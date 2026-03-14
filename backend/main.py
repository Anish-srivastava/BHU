from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
import glob
from typing import Optional, List, Any, cast

# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

df: Optional[pd.DataFrame] = None


REQUIRED_COLUMNS = [
    "make",
    "model",
    "year",
    "VClass",
    "co2TailpipeGpm",
    "comb08",
    "fuelCost08",
    "youSaveSpend",
    "total_manufacturing_co2_kg",
]

CANONICAL_SEGMENTS = ["Compact", "Sedan", "SUV", "Pickup", "Van", "Sports"]
CANONICAL_SEGMENT_BY_KEY = {s.lower(): s for s in CANONICAL_SEGMENTS}


def normalize_dataset_schema(dataset: pd.DataFrame) -> pd.DataFrame:
    """Map compatible column variants to canonical names used by endpoints."""
    alias_map = {
        "vclass": "VClass",
        "vehicle_class": "VClass",
        "co2tailpipegpm": "co2TailpipeGpm",
        "co2_tailpipe_gpm": "co2TailpipeGpm",
        "comb_mpg": "comb08",
        "fuel_cost_annual": "fuelCost08",
        "you_save_spend": "youSaveSpend",
        "manufacturer": "make",
        "manufacturer_name": "make",
        "model_name": "model",
    }

    rename_map: dict[str, str] = {}
    existing_lower = {c.lower(): c for c in dataset.columns}
    for alias, target in alias_map.items():
        if target in dataset.columns:
            continue
        if alias in existing_lower:
            rename_map[existing_lower[alias]] = target

    if rename_map:
        dataset = dataset.rename(columns=rename_map)

    # If manufacturing total is missing, derive it from known components.
    if (
        "total_manufacturing_co2_kg" not in dataset.columns
        and "body_co2_kg" in dataset.columns
        and "battery_co2_kg" in dataset.columns
    ):
        dataset["total_manufacturing_co2_kg"] = (
            pd.to_numeric(dataset["body_co2_kg"], errors="coerce").fillna(0)
            + pd.to_numeric(dataset["battery_co2_kg"], errors="coerce").fillna(0)
        )

    return dataset


def map_vclass_to_segment(vclass: Any) -> Optional[str]:
    """Map raw dataset class strings to the 6 user-facing segment buckets."""
    if vclass is None:
        return None

    text = str(vclass).strip().lower()
    if not text:
        return None

    if "pickup" in text or "truck" in text:
        return "Pickup"

    if "sport utility" in text or "suv" in text:
        return "SUV"

    if "van" in text:
        return "Van"

    if "two seater" in text or "special purpose" in text or "sports" in text:
        return "Sports"

    if "minicompact" in text or "subcompact" in text:
        return "Compact"

    if "cars" in text or "wagon" in text:
        return "Sedan"

    return None


def segment_mask_for_request(dataset: pd.DataFrame, segment: str) -> pd.Series:
    """Return a boolean mask for a canonical segment over dataset.VClass."""
    key = (segment or "").strip().lower()
    normalized = CANONICAL_SEGMENT_BY_KEY.get(key)
    if not normalized:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid vehicle segment. "
                f"Supported segments: {', '.join(CANONICAL_SEGMENTS)}"
            ),
        )

    mapped = dataset["VClass"].map(map_vclass_to_segment)
    return mapped == normalized


def load_dataset() -> pd.DataFrame:
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    candidate_patterns = [
        "vehicles_global_dataset_merged*.csv",
        "vehicles_global_dataset_with_india*.csv",
        "vehicles_with_full_manufacturing_co2*.csv",
    ]

    candidate_files: list[str] = []
    for pattern in candidate_patterns:
        matches = sorted(glob.glob(os.path.join(data_dir, pattern)))
        candidate_files.extend(matches)

    # Fallback: load any CSV if no known pattern is found.
    if not candidate_files:
        candidate_files = sorted(glob.glob(os.path.join(data_dir, "*.csv")))

    for csv_path in candidate_files:
        filename = os.path.basename(csv_path)
        loaded_df = pd.read_csv(csv_path, low_memory=False)
        loaded_df = normalize_dataset_schema(loaded_df)
        missing = [c for c in REQUIRED_COLUMNS if c not in loaded_df.columns]
        if missing:
            print(f"⚠️ Missing required columns in {filename}: {missing}")
            continue
        print(f"✅ Dataset loaded from {filename}: {len(loaded_df)} vehicles")
        return loaded_df

    print(f"❌ No supported CSV found in {data_dir}")
    return pd.DataFrame()


@asynccontextmanager
async def lifespan(_app: "FastAPI"):  # type: ignore[name-defined]
    globals()["df"] = load_dataset()
    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="Carbon-Wise API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


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
    top_3_cars: List[CarResult]


class SearchModelsRequest(BaseModel):
    model_queries: List[str]
    daily_mileage: float
    ownership_years: float
    vehicle_segment: Optional[str] = None


class SearchCarResult(BaseModel):
    matched_query: str
    make: str
    model: str
    year: int
    vehicle_class: str
    manufacturing_co2: float
    use_phase_co2: float
    total_co2: float
    long_term_savings: float
    fuel_efficiency_mpg: float
    annual_fuel_cost_usd: Optional[float]   # from fuelCost08
    five_year_savings_usd: Optional[float]  # from youSaveSpend (vs avg vehicle)
    score: float
    rank_label: str  # "Top" | "Best" | "Good"


class SearchResponse(BaseModel):
    lifetime_km: float
    vehicles: List[SearchCarResult]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def convert_gpm_to_kg_per_km(gpm: float) -> float:
    """Convert CO2 tailpipe grams-per-mile → kg per km."""
    if not gpm:
        return 0.0
    return (gpm / 1000.0) / 1.60934


def _assign_ranks(results: list) -> None:
    """Mutate each result dict to set rank_label based on score percentile."""
    sorted_scores = sorted(r["score"] for r in results)
    n = len(sorted_scores)
    if n == 1:
        top_thr = mid_thr = sorted_scores[0]
    elif n == 2:
        top_thr = sorted_scores[1]
        mid_thr = sorted_scores[0]
    else:
        top_thr = sorted_scores[min(int(n * 0.67), n - 1)]
        mid_thr = sorted_scores[min(int(n * 0.33), n - 1)]

    for r in results:
        if r["score"] >= top_thr:
            r["rank_label"] = "Top"
        elif r["score"] > mid_thr:  # strict > so bottom tier gets "Good"
            r["rank_label"] = "Best"
        else:
            r["rank_label"] = "Good"


def get_loaded_df() -> Any:
    """Return loaded dataset or raise a 500 error if unavailable."""
    if df is None or df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded")
    return cast(Any, df)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "dataset_loaded": df is not None and not df.empty,
        "total_vehicles": len(df) if df is not None else 0,
    }


@app.get("/segments")
async def get_vehicle_segments():
    _ = cast(Any, get_loaded_df())
    return {"segments": CANONICAL_SEGMENTS}


@app.get("/models/suggest")
async def suggest_models(q: str = Query(..., min_length=1)):
    """Return up to 15 'Make Model' suggestions matching the query."""
    dataset = cast(Any, get_loaded_df())
    mask = dataset.model.str.contains(q, case=False, na=False)
    hits = dataset.loc[mask, ["make", "model"]].drop_duplicates()
    suggestions = (hits["make"] + " " + hits["model"]).unique().tolist()[:15]
    return {"suggestions": suggestions}


@app.post("/search-models", response_model=SearchResponse)
async def search_models(request: SearchModelsRequest):
    """
    Search for vehicles by model name(s) and compute lifecycle CO2.

    Scoring formula:
        score = 0.3 * (mpg / max_mpg) + 0.7 * (1 - total_co2 / max_total_co2)

    Rank labels (by percentile):
        Top  → top 33 %
        Best → middle 33 %
        Good → bottom 33 %
    """
    dataset = cast(Any, get_loaded_df())
    if request.daily_mileage <= 0:
        raise HTTPException(status_code=400, detail="Daily mileage must be > 0")
    if request.ownership_years <= 0:
        raise HTTPException(status_code=400, detail="Ownership years must be > 0")

    lifetime_km = request.daily_mileage * 365.0 * request.ownership_years

    cleaned_queries: list[str] = []
    seen_queries: set[str] = set()
    for raw_query in request.model_queries:
        query = raw_query.strip()
        query_key = query.lower()
        if query and query_key not in seen_queries:
            seen_queries.add(query_key)
            cleaned_queries.append(query)

    if not cleaned_queries:
        return SearchResponse(
            lifetime_km=round(lifetime_km, 2),
            vehicles=[],
        )

    filtered_dataset = dataset.copy()
    if request.vehicle_segment:
        filtered_dataset = filtered_dataset.loc[
            segment_mask_for_request(filtered_dataset, request.vehicle_segment)
        ].copy()

    filtered_dataset["year"] = pd.to_numeric(filtered_dataset["year"], errors="coerce")
    filtered_dataset = filtered_dataset.dropna(subset=["year"])
    filtered_dataset = filtered_dataset.sort_values("year", ascending=False)

    if filtered_dataset.empty:
        return SearchResponse(
            lifetime_km=round(lifetime_km, 2),
            vehicles=[],
        )

    make_model = filtered_dataset.make.fillna("") + " " + filtered_dataset.model.fillna("")
    results = []
    MAX_RESULTS_PER_QUERY = 3

    for query in cleaned_queries:
        query_mask = filtered_dataset.model.str.contains(query, case=False, na=False)
        query_mask |= make_model.str.contains(query, case=False, na=False)
        query_matches = filtered_dataset.loc[query_mask].copy()
        if query_matches.empty:
            continue

        query_matches = query_matches.drop_duplicates(subset=["make", "model"], keep="first")

        query_results = []
        for _, v in query_matches.iterrows():
            kg_per_km = convert_gpm_to_kg_per_km(float(v["co2TailpipeGpm"]))
            use_phase_co2 = kg_per_km * lifetime_km
            manufacturing_co2 = float(v["total_manufacturing_co2_kg"])
            total_co2 = manufacturing_co2 + use_phase_co2
            fuel_cost = float(v["fuelCost08"]) if pd.notna(v.get("fuelCost08")) else None
            five_yr = float(v["youSaveSpend"]) if pd.notna(v.get("youSaveSpend")) else None
            query_results.append({
                "matched_query": query,
                "make": str(v["make"]),
                "model": str(v["model"]),
                "year": int(v["year"]),
                "vehicle_class": str(v["VClass"]),
                "manufacturing_co2": round(manufacturing_co2, 2),
                "use_phase_co2": round(use_phase_co2, 2),
                "total_co2": round(total_co2, 2),
                "long_term_savings": 0.0,
                "fuel_efficiency_mpg": float(v["comb08"]) if pd.notna(v.get("comb08")) else 0.0,
                "annual_fuel_cost_usd": fuel_cost,
                "five_year_savings_usd": five_yr,
                "score": 0.0,
                "rank_label": "Good",
                "_total_co2_raw": total_co2,
            })

        max_co2 = max(r["_total_co2_raw"] for r in query_results)
        for r in query_results:
            r["long_term_savings"] = round(max_co2 - r["_total_co2_raw"], 2)

        max_mpg = max((r["fuel_efficiency_mpg"] for r in query_results), default=1.0) or 1.0
        max_total = max_co2 or 1.0
        for r in query_results:
            fuel_score = r["fuel_efficiency_mpg"] / max_mpg
            co2_score = 1.0 - (r["_total_co2_raw"] / max_total)
            r["score"] = round(0.3 * fuel_score + 0.7 * co2_score, 4)

        _assign_ranks(query_results)
        query_results.sort(key=lambda x: x["score"], reverse=True)

        for r in query_results[:MAX_RESULTS_PER_QUERY]:
            del r["_total_co2_raw"]
            results.append(r)

    return SearchResponse(
        lifetime_km=round(lifetime_km, 2),
        vehicles=[SearchCarResult(**r) for r in results],
    )


@app.post("/compare", response_model=ComparisonResponse)
async def compare_vehicles(request: ComparisonRequest):
    """Return the top-3 lowest-emission vehicles within a segment."""
    dataset = cast(Any, get_loaded_df())
    if request.daily_mileage <= 0:
        raise HTTPException(status_code=400, detail="Daily mileage must be greater than 0")
    if request.ownership_years <= 0:
        raise HTTPException(status_code=400, detail="Ownership years must be greater than 0")
    if not request.vehicle_segment:
        raise HTTPException(status_code=400, detail="Vehicle segment is required")

    lifetime_km = request.daily_mileage * 365.0 * request.ownership_years
    segment_vehicles = dataset.loc[
        segment_mask_for_request(dataset, request.vehicle_segment)
    ].copy()
    if segment_vehicles.empty:
        raise HTTPException(
            status_code=400,
            detail=f"No vehicles found for segment: {request.vehicle_segment}",
        )

    results = []
    for _, vehicle in segment_vehicles.iterrows():
        kg_per_km = convert_gpm_to_kg_per_km(float(vehicle["co2TailpipeGpm"]))
        use_phase_co2 = kg_per_km * lifetime_km
        manufacturing_co2 = float(vehicle["total_manufacturing_co2_kg"])
        total_lifecycle_co2 = manufacturing_co2 + use_phase_co2
        results.append({
            "make": vehicle["make"],
            "model": vehicle["model"],
            "year": int(vehicle["year"]),
            "manufacturing_co2": round(manufacturing_co2, 2),
            "use_phase_co2": round(use_phase_co2, 2),
            "total_lifecycle_co2": round(total_lifecycle_co2, 2),
            "_total_sort": total_lifecycle_co2,
        })

    results.sort(key=lambda x: x["_total_sort"])

    # Deduplicate: keep the best (lowest CO₂) entry per unique (make, model)
    seen = {}
    for car in results:
        key = (car["make"].lower(), car["model"].lower())
        if key not in seen:
            seen[key] = car
    deduplicated = list(seen.values())  # already sorted, insertion order preserved

    top_3 = deduplicated[:3]
    for car in top_3:
        del car["_total_sort"]

    return ComparisonResponse(
        lifetime_km=round(lifetime_km, 2),
        top_3_cars=[CarResult(**car) for car in top_3],
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
