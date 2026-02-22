# 🌍 Carbon-Wise: Vehicle Lifecycle CO₂ Comparison Engine

A modern full-stack web application that helps users make informed decisions about vehicle choices based on total lifecycle CO₂ emissions (manufacturing + use phase).

## 🎯 Features

- **Comprehensive Lifecycle Analysis**: Calculate total CO₂ emissions from both manufacturing and driving phases
- **Vehicle Comparison**: Compare top 3 lowest emission vehicles in your chosen segment
- **Interactive Dashboard**: Beautiful, responsive UI with real-time results
- **Visual Analytics**: Bar chart comparing manufacturing vs. use-phase emissions
- **Multiple Vehicle Segments**: Support for various vehicle types (compact cars, SUVs, trucks, etc.)
- **EV Support**: Handles electric vehicles with zero tailpipe emissions
- **Real-time Calculation**: Instant calculation based on your driving patterns

## 📊 Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Data Processing**: Pandas
- **Database**: CSV Dataset
- **API**: RESTful with CORS support

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: CSS Modules
- **Visualization**: Chart.js with React-Chartjs-2
- **HTTP Client**: Axios

### Database
- **Format**: CSV
- **Records**: 45+ vehicles across multiple segments and fuel types

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+ (for frontend)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create a virtual environment** (optional but recommended)
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the backend server**
   ```bash
   python main.py
   ```
   
   The server will start on `http://localhost:8000`

6. **Test the API** (optional)
   - Health Check: `http://localhost:8000/health`
   - API Docs: `http://localhost:8000/docs`
   - Get Segments: `http://localhost:8000/segments`

### Frontend Setup

1. **Navigate to frontend directory** (from project root)
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```
   
   Ensure `.env.local` contains:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:3000`

## 📖 API Documentation

### Endpoints

#### 1. Health Check
```
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "dataset_loaded": true,
  "total_vehicles": 45
}
```

#### 2. Get Vehicle Segments
```
GET /segments
```
**Response:**
```json
{
  "segments": [
    "Compact Car",
    "Midsize Car",
    "Full Size Truck",
    "Small Utility Vehicle (SUV)",
    "Standard Utility Vehicle (SUV)"
  ]
}
```

#### 3. Compare Vehicles
```
POST /compare
```

**Request:**
```json
{
  "daily_mileage": 50,
  "ownership_years": 5,
  "vehicle_segment": "Compact Car"
}
```

**Response:**
```json
{
  "lifetime_km": 91250.0,
  "top_3_cars": [
    {
      "make": "Tesla",
      "model": "Model 3",
      "year": 2023,
      "manufacturing_co2": 3450.0,
      "use_phase_co2": 0.0,
      "total_lifecycle_co2": 3450.0
    },
    {
      "make": "Nissan",
      "model": "Leaf",
      "year": 2023,
      "manufacturing_co2": 3200.0,
      "use_phase_co2": 0.0,
      "total_lifecycle_co2": 3200.0
    },
    {
      "make": "Toyota",
      "model": "Prius",
      "year": 2023,
      "manufacturing_co2": 950.0,
      "use_phase_co2": 2157.4,
      "total_lifecycle_co2": 3107.4
    }
  ]
}
```

## 🧮 Calculation Formula

### Lifetime Distance
```
Lifetime_km = Daily_Mileage × 365 × Ownership_Period
```

### Use Phase CO₂
1. Convert `co2TailpipeGpm` (grams per mile) to kg per km:
   ```
   kg_per_km = (gpm / 1000) / 1.60934
   ```

2. Calculate use phase emissions:
   ```
   use_phase_co2 = kg_per_km × Lifetime_km
   ```

### Total Lifecycle CO₂
```
total_lifecycle_co2 = manufacturing_co2_kg + use_phase_co2
```

## 📁 Project Structure

```
BHU/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment configuration template
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Main page component
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.module.css      # Page styles
│   │   ├── components/
│   │   │   ├── InputForm.tsx
│   │   │   ├── InputForm.module.css
│   │   │   ├── CarCard.tsx
│   │   │   ├── CarCard.module.css
│   │   │   ├── ComparisonChart.tsx
│   │   ├── styles/
│   │   │   └── globals.css      # Global styles
│   │   └── api/
│   │       └── vehicleAPI.ts    # API client
│   ├── package.json             # Node dependencies
│   ├── next.config.js           # Next.js configuration
│   └── .env.example             # Environment configuration template
│
├── data/
│   └── vehicles_with_full_manufacturing_co2.csv  # Dataset
│
└── README.md                    # This file
```

## 🗄️ Dataset Columns

- `make`: Vehicle manufacturer
- `model`: Vehicle model name
- `year`: Model year
- `VClass`: Vehicle segment/class
- `fuelType1`: Primary fuel type
- `co2TailpipeGpm`: CO₂ tailpipe emissions (grams per mile)
- `body_co2_kg`: Body manufacturing CO₂
- `battery_co2_kg`: Battery manufacturing CO₂ (for EVs)
- `total_manufacturing_co2_kg`: Total manufacturing emissions

## 💡 Example Use Cases

### Scenario 1: Urban Commuter
- **Daily Mileage**: 40 km
- **Ownership Period**: 5 years
- **Segment**: Compact Car
- **Expected Result**: Find eco-friendly compact cars with lowest total emissions

### Scenario 2: Long-distance Driver
- **Daily Mileage**: 150 km
- **Ownership Period**: 8 years
- **Segment**: Midsize Car
- **Expected Result**: Prioritizes vehicles with lower use-phase emissions

### Scenario 3: SUV Buyer
- **Daily Mileage**: 80 km
- **Ownership Period**: 10 years
- **Segment**: Standard Utility Vehicle (SUV)
- **Expected Result**: Compare SUVs considering higher manufacturing emissions

## 🔧 Configuration

### Frontend Environment Variables
Create `.env.local` in the frontend directory:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend Environment Variables
Create `.env` in the backend directory:
```
PORT=8000
HOST=0.0.0.0
```

## 🐛 Troubleshooting

### Issue: "Failed to connect to API"
- **Solution**: Ensure the FastAPI server is running on `http://localhost:8000`
- Check CORS is enabled in `main.py`
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### Issue: "Dataset not loaded"
- **Solution**: Verify CSV file exists at `data/vehicles_with_full_manufacturing_co2.csv`
- Check file permissions
- Ensure CSV path is correct in `main.py`

### Issue: "No vehicles found for segment"
- **Solution**: Check available segments via `GET /segments`
- Verify segment name spelling matches exactly

### Issue: Frontend won't start
- **Solution**: Delete `node_modules` and `.next` folder
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

## 📈 Performance Tips

1. **Backend**: Dataset is loaded once at startup for faster queries
2. **Frontend**: Results are cached client-side
3. **API**: All calculations are performed server-side for consistency

## 🌱 Sustainability Impact

This application helps users understand the **true environmental cost** of vehicle ownership, considering:
- Manufacturing emissions (often overlooked)
- Use-phase emissions based on actual driving patterns
- Impact of vehicle segment choice
- Benefits of alternative fuel types (EV vs. Hybrid vs. Gasoline)

## 📝 License

This project is open source and available for educational purposes.

## 👨‍💻 Development

### Adding New Vehicles
1. Edit `data/vehicles_with_full_manufacturing_co2.csv`
2. Restart the backend server
3. New vehicles will automatically be available

### Extending Vehicle Segments
1. Add rows to CSV with new `VClass` values
2. New segments will appear in the dropdown automatically

### Customizing Calculations
1. Modify conversion factors in `backend/main.py`
2. Update formulas in `convert_gpm_to_kg_per_km()` function

## 🚀 Deployment

### Backend (FastAPI)
- Deploy to AWS EC2, Google Cloud Run, or Heroku
- Use Gunicorn for production server
- Ensure CORS is properly configured

### Frontend (Next.js)
- Deploy to Vercel (recommended for Next.js)
- Or use AWS Amplify, Netlify, etc.
- Update `NEXT_PUBLIC_API_URL` to point to production backend

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review API documentation at `http://localhost:8000/docs`
3. Check browser console for frontend errors

---

**Made with 🌍 for a sustainable future!**
