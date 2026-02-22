from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
from typing import Optional

app = FastAPI(title="Carbon-Wise API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store dataset
df = None


class ComparisonRequest(BaseModel):
    daily_mileage: float
    ownership_years: float
    vehicle_segment: str


class CarResult(BaseModel):
    make: str
    model: str
    year: int
    manufacturing_co2: float
    use_phase_co2: float
    total_lifecycle_co2: float


class ComparisonResponse(BaseModel):
    lifetime_km: float
    top_3_cars: list[CarResult]


def load_dataset():
    """Load the CSV dataset at startup"""
    global df
    # Construct the path relative to the script
    csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "vehicles_with_full_manufacturing_co2.csv")
    
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        print(f"✅ Dataset loaded: {len(df)} vehicles found")
        print(f"Available segments: {df['VClass'].unique()}")
    else:
        print(f"❌ CSV file not found at {csv_path}")
        df = pd.DataFrame()


def convert_gpm_to_kg_per_km(gpm):
    """
    Convert co2TailpipeGpm (grams per mile) to kg per km
    1 mile = 1.60934 km
    1 gram = 0.001 kg
    
    kg_per_km = (gpm / 1000) / 1.60934
    """
    if gpm == 0:
        return 0
    return (gpm / 1000) / 1.60934


@app.on_event("startup")
async def startup_event():
    """Load dataset when the app starts"""
    load_dataset()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "dataset_loaded": len(df) > 0 if df is not None else False,
        "total_vehicles": len(df) if df is not None else 0
    }


@app.get("/segments")
async def get_vehicle_segments():
    """Get all available vehicle segments"""
    if df is None or df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    segments = sorted(df['VClass'].unique().tolist())
    return {"segments": segments}


@app.post("/compare", response_model=ComparisonResponse)
async def compare_vehicles(request: ComparisonRequest):
    """
    Compare vehicles based on lifecycle CO2 emissions
    
    Request body:
    {
        "daily_mileage": number,
        "ownership_years": number,
        "vehicle_segment": string
    }
    """
    
    if df is None or df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    
    # Validate input
    if request.daily_mileage <= 0:
        raise HTTPException(status_code=400, detail="Daily mileage must be greater than 0")
    
    if request.ownership_years <= 0:
        raise HTTPException(status_code=400, detail="Ownership years must be greater than 0")
    
    if not request.vehicle_segment:
        raise HTTPException(status_code=400, detail="Vehicle segment is required")
    
    # Calculate lifetime distance
    lifetime_km = request.daily_mileage * 365 * request.ownership_years
    
    # Filter vehicles by segment
    segment_vehicles = df[df['VClass'] == request.vehicle_segment].copy()
    
    if segment_vehicles.empty:
        raise HTTPException(
            status_code=400,
            detail=f"No vehicles found for segment: {request.vehicle_segment}"
        )
    
    # Calculate lifecycle CO2 for each vehicle
    results = []
    
    for _, vehicle in segment_vehicles.iterrows():
        # Convert co2TailpipeGpm to kg per km
        kg_per_km = convert_gpm_to_kg_per_km(vehicle['co2TailpipeGpm'])
        
        # Calculate use phase CO2
        use_phase_co2 = kg_per_km * lifetime_km
        
        # Get manufacturing CO2
        manufacturing_co2 = vehicle['total_manufacturing_co2_kg']
        
        # Calculate total lifecycle CO2
        total_lifecycle_co2 = manufacturing_co2 + use_phase_co2
        
        results.append({
            "make": vehicle['make'],
            "model": vehicle['model'],
            "year": int(vehicle['year']),
            "manufacturing_co2": round(manufacturing_co2, 2),
            "use_phase_co2": round(use_phase_co2, 2),
            "total_lifecycle_co2": round(total_lifecycle_co2, 2),
            "_total_sort": total_lifecycle_co2  # For sorting
        })
    
    # Sort by total lifecycle CO2 (ascending) and get top 3
    results.sort(key=lambda x: x["_total_sort"])
    top_3 = results[:3]
    
    # Remove the temporary sort key
    for car in top_3:
        del car["_total_sort"]
    
    return ComparisonResponse(
        lifetime_km=round(lifetime_km, 2),
        top_3_cars=[CarResult(**car) for car in top_3]
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
