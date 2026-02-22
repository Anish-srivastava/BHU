# 🏗️ Carbon-Wise: System Architecture

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              USER BROWSER (http://localhost:3000)            │
│                     [React/Next.js UI]                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Carbon-Wise Interactive Dashboard            │   │
│  │  Input Form │ Results Cards │ Chart Visualization    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP/AJAX Requests (JSON)
               │ (CORS enabled)
┌──────────────▼──────────────────────────────────────────────┐
│        FastAPI Backend Server (http://localhost:8000)        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            API Endpoints                             │   │
│  │  • GET /segments                                     │   │
│  │  • GET /health                                       │   │
│  │  • POST /compare (Main Logic)                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     Data Processing & Calculations                   │   │
│  │  • Load CSV → Pandas DataFrame                       │   │
│  │  • Filter by VClass                                  │   │
│  │  • Calculate CO₂ Emissions                           │   │
│  │  • Sort & Return Top 3                               │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────────────────┘
               │ Read CSV Data
               │ (Once at startup)
┌──────────────▼──────────────────────────────────────────────┐
│          CSV Dataset (45+ Vehicles)                          │
│  vehicles_with_full_manufacturing_co2.csv                    │
│  [make, model, year, VClass, co2TailpipeGpm, ...]           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
USER INPUT (Form)
    ↓
[daily_mileage, ownership_years, vehicle_segment]
    ↓
VALIDATE INPUT
    ↓ (via POST /compare)
FILTER VEHICLES
    └─→ df[df['VClass'] == segment]
    ↓
CALCULATE FOR EACH VEHICLE:
    ├─→ Convert GPM to kg/km
    │   (gpm / 1000) / 1.60934
    ├─→ Calculate lifetime distance
    │   daily_mileage × 365 × ownership_years
    ├─→ Calculate use-phase CO₂
    │   kg_per_km × lifetime_km
    └─→ Total lifecycle CO₂
        manufacturing_co2 + use_phase_co2
    ↓
RANK by total_lifecycle_co2 (ascending)
    ↓
SELECT Top 3 Results
    ↓
RETURN JSON Response
    ↓
FRONTEND RECEIVES
    ├─→ Display Summary Cards
    ├─→ Display Result Cards (with medals)
    └─→ Render Chart Visualization
```

---

## 🌐 API Contract

### Request Format (POST /compare)
```
Headers:
  Content-Type: application/json

Body:
{
  "daily_mileage": number,      // Required: > 0
  "ownership_years": number,    // Required: > 0
  "vehicle_segment": string     // Required: Must match VClass
}
```

### Response Format (Success: 200)
```
{
  "lifetime_km": number,
  "top_3_cars": [
    {
      "make": string,
      "model": string,
      "year": integer,
      "manufacturing_co2": number,
      "use_phase_co2": number,
      "total_lifecycle_co2": number
    },
    ...
  ]
}
```

### Error Responses
```
400 - Bad Request
{
  "detail": "Validation error message"
}

500 - Server Error
{
  "detail": "Dataset not loaded"
}
```

---

## 🔄 Component Relationship

### Frontend Component Tree
```
<Home> (Main Page)
├─ <InputForm>           → Collects user input
│                           Validates form
│                           Calls API on submit
│
├─ <ResultsSummary>      → Shows calculation summary
│   ├─ Summary Cards     → Lifetime km, top car CO2
│   └─ Stats Display
│
├─ <CarCard> × 3         → Display individual results
│   ├─ Vehicle Info      → Make, model, year
│   └─ Emissions Data    → Manufacturing, Use-phase, Total
│
└─ <ComparisonChart>     → Bar chart visualization
    └─ Chart.js          → Manufacturing vs Use-phase
```

---

## 💾 Database Schema (CSV)

```
vehicles_with_full_manufacturing_co2.csv

Columns:
┌──────────────────────────┬──────────┬──────────────┐
│ Column                   │ Type     │ Example      │
├──────────────────────────┼──────────┼──────────────┤
│ make                     │ string   │ "Toyota"     │
│ model                    │ string   │ "Corolla"    │
│ year                     │ integer  │ 2023         │
│ VClass                   │ string   │ "Compact Car"│
│ fuelType1                │ string   │ "Gasoline"   │
│ co2TailpipeGpm           │ float    │ 432.5        │
│ body_co2_kg              │ float    │ 800          │
│ battery_co2_kg           │ float    │ 0            │
│ total_manufacturing_co2_kg│ float   │ 1200         │
└──────────────────────────┴──────────┴──────────────┘

Total Records: 45+ vehicles
Indexed by: VClass (for fast filtering)
```

---

## 🔧 Technology Stack Details

### Frontend Stack
```
Next.js 14
├─ React 18 (Component rendering)
├─ TypeScript (Type safety)
├─ CSS Modules (Scoped styling)
├─ Axios (HTTP client)
├─ Chart.js (Charting library)
└─ React-Chartjs-2 (Chart wrapper)

Build: next build
Dev: next dev (port 3000)
Prod: npm start
```

### Backend Stack
```
FastAPI (0.104.1)
├─ Uvicorn (ASGI server)
├─ Pandas (Data processing)
├─ Pydantic (Data validation)
└─ Python-multipart (Form data)

Run: python main.py
Port: 8000
Docs: http://localhost:8000/docs
```

### Data Stack
```
CSV File Format
├─ No database needed
├─ Loaded once at startup
└─ Processed with Pandas
   ├─ Filtering (by VClass)
   ├─ Calculations (CO₂ emissions)
   └─ Sorting (by total lifecycle CO₂)
```

---

## 📈 Calculation Engine

### Module: CO₂ Calculations

**Function: convert_gpm_to_kg_per_km(gpm)**
```
Input:  gpm (grams per mile)
Logic:  
  - Convert grams to kg: ÷ 1000
  - Convert miles to km: ÷ 1.60934
Output: kg/km
```

**Function: calculate_lifecycle_co2(vehicle, lifetime_km)**
```
Input:  vehicle_data, lifetime_km
Process:
  1. Convert vehicle['co2TailpipeGpm'] → kg_per_km
  2. Calculate use_phase = kg_per_km × lifetime_km
  3. Get manufacturing_co2 from vehicle['total_manufacturing_co2_kg']
  4. Return manufacturing_co2 + use_phase
Output: total_lifecycle_co2 (kg)
```

**Function: compare_vehicles(daily_mileage, ownership_years, segment)**
```
Input:  User parameters
Process:
  1. lifetime_km = daily_mileage × 365 × ownership_years
  2. Filter dataset by segment
  3. For each vehicle:
     - Calculate total lifecycle CO₂
     - Store results with vehicle info
  4. Sort by total lifecycle CO₂ (ascending)
  5. Return top 3
Output: JSON response with results
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────┐
│     Frontend (React)             │
│  • Input Validation              │
│  • XSS Prevention (React escaping)│
│  • CSRF Token (inherent in REST) │
└────────────┬────────────────────┘
             │
        HTTPS/CORS
             │
┌────────────▼────────────────────┐
│   FastAPI Backend                │
│  • CORS Middleware               │
│  • Pydantic Validation           │
│  • Error Handling                │
│  • Input Sanitization            │
│  • No SQL Injection (CSV only)   │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   CSV Data Source                │
│  • No external connections       │
│  • No sensitive data            │
│  • Public dataset               │
└─────────────────────────────────┘
```

---

## 🔄 Request-Response Cycle

### Example: Compare Compact Cars
```
1. USER ACTION
   ├─ Enters: 50 km/day, 5 years, "Compact Car"
   └─ Clicks: "Compare Vehicles"

2. FRONTEND (InputForm)
   ├─ Validates input
   ├─ Calls: vehicleAPI.compareVehicles(50, 5, "Compact Car")
   └─ Shows loading spinner

3. API REQUEST
   POST /compare
   {
     "daily_mileage": 50,
     "ownership_years": 5,
     "vehicle_segment": "Compact Car"
   }

4. BACKEND CALCULATION
   ├─ Filter: df[df['VClass'] == "Compact Car"]  → 10 vehicles
   ├─ Calculate for each:
   │  ├─ lifetime_km = 50 × 365 × 5 = 91,250 km
   │  ├─ For Toyota Corolla:
   │  │  ├─ kg_per_km = (432.5 / 1000) / 1.60934 = 0.2686 kg/km
   │  │  ├─ use_phase = 0.2686 × 91,250 = 24,509.75 kg
   │  │  └─ total = 1200 + 24,509.75 = 25,709.75 kg
   │  └─ (Repeat for all 10 vehicles)
   │
   ├─ Sort by total CO₂
   └─ Return top 3

5. API RESPONSE (200)
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
       ...
     ]
   }

6. FRONTEND DISPLAY
   ├─ Hide spinner
   ├─ Show summary cards
   ├─ Display 3 result cards with medals
   └─ Render comparison chart

7. USER SEES
   ✅ Results with lowest CO₂ highlighted
   ✅ Chart comparing emissions
   ✅ All information clearly displayed
```

---

## 🎨 Styling Architecture

```
Global Styles (globals.css)
├─ CSS Variables (colors, shadows)
├─ Base element styles
└─ Utility classes

Component Styles (*.module.css)
├─ CarCard.module.css
├─ InputForm.module.css
└─ Page-specific styles
     └─ page.module.css

Responsive Design
├─ Desktop: 1200px+
├─ Tablet: 768px - 1199px
└─ Mobile: < 768px

CSS Approach: Modules (no conflicts)
```

---

## 🚀 Performance Optimization

### Frontend
- Next.js automatic code splitting
- CSS Modules → reduced bundle size
- Chart.js canvas rendering
- Client-side result caching

### Backend
- Single CSV load at startup → O(1) startup
- Pandas vectorized operations → Fast filtering
- Stateless API → Scalable
- Response caching via client

### Data
- 45 vehicles → Fast processing (< 100ms)
- CSV format → Lightweight (< 30KB)
- In-memory DataFrame → No disk I/O

---

## 📋 Deployment Architecture

### Local Development
```
Developer Machine
├─ Backend: localhost:8000
├─ Frontend: localhost:3000
└─ CSV: Local file system
```

### Production Deployment
```
Cloud Provider (AWS/GCP/Azure)
├─ Backend
│  ├─ Container (Docker)
│  ├─ Server: Gunicorn + Uvicorn
│  └─ Database: CSV or PostgreSQL
│
├─ Frontend
│  ├─ Static Build (Next.js export)
│  ├─ CDN: CloudFront/CloudFlare
│  └─ Storage: S3/Cloud Storage
│
└─ DNS
   ├─ Backend API: api.example.com
   └─ Frontend: www.example.com
```

---

## 📝 Extension Points

### Easy to Add
1. **New Vehicles** → Update CSV file
2. **New Segments** → Add VClass to CSV
3. **New Calculations** → Modify backend logic
4. **New Visualizations** → Add React components
5. **New UI Features** → Extend frontend

### Moderate to Add
1. **Database** → Replace CSV with SQL
2. **Authentication** → Add user accounts
3. **Real-time Updates** → Add WebSocket
4. **Mobile App** → React Native version

### Advanced Extensions
1. **ML Predictions** → CO₂ estimation models
2. **Real-time Data** → Live vehicle pricing
3. **Geographic Data** → Regional emissions
4. **Integration** → Car dealer APIs

---

## 🎯 System Characteristics

| Aspect | Value |
|--------|-------|
| Architecture | Monolithic (can be modularized) |
| Scalability | Moderate (CSV → SQL for scale) |
| Latency | Low (< 100ms typical response) |
| Availability | High (stateless design) |
| Security | Good (basic validation) |
| Maintainability | Excellent (clean code) |
| Complexity | Low to Moderate |
| Cost | Minimal (no infrastructure needed) |

---

**Carbon-Wise Architecture v1.0** ✅
*Clean, Simple, and Scalable*
