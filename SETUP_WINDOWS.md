# 🪟 Carbon-Wise: Windows Setup Guide

This guide provides step-by-step instructions to get Carbon-Wise running on Windows.

## ✅ Prerequisites Check

Before starting, ensure you have:

1. **Python 3.8+** installed
   - Open Command Prompt and run: `python --version`
   - If not installed, download from: https://www.python.org/downloads/
   - ⚠️ **Important**: During installation, check "Add Python to PATH"

2. **Node.js 16+** installed
   - Open Command Prompt and run: `node --version`
   - If not installed, download from: https://nodejs.org/
   - LTS version is recommended

3. **Git** (optional, for cloning the repository)
   - Download from: https://git-scm.com/download/win

## 🚀 Quick Start (Recommended)

### Method 1: Using Batch Scripts (Easiest)

1. **Extract/Navigate to project folder**
   - Open the project folder in File Explorer
   - `c:\Anish\hackathon\BHU`

2. **Start Backend (First Terminal)**
   - Double-click `run_backend.bat`
   - A new window will open
   - Wait for message: "Running on http://0.0.0.0:8000"
   - **Keep this window open!**

3. **Start Frontend (Second Terminal)**
   - Double-click `run_frontend.bat`
   - A new window will open
   - Wait for message: "ready - started server on 0.0.0.0:3000"

4. **Open Application**
   - Open your browser
   - Navigate to: `http://localhost:3000`
   - You should see the Carbon-Wise dashboard!

5. **Stop the application**
   - Press `Ctrl + C` in each terminal window

---

## 📋 Manual Setup (Step-by-Step)

If the batch scripts don't work, follow these steps:

### Backend Setup

1. **Open Command Prompt**
   - Press `Win + R`
   - Type `cmd` and press Enter

2. **Navigate to project**
   ```
   cd C:\Anish\hackathon\BHU\backend
   ```

3. **Create virtual environment**
   ```
   python -m venv venv
   ```

4. **Activate virtual environment**
   ```
   venv\Scripts\activate.bat
   ```
   - Your prompt should now show `(venv)` at the start

5. **Install dependencies**
   ```
   pip install -r requirements.txt
   ```
   - This may take a few minutes

6. **Start the server**
   ```
   python main.py
   ```
   - You should see:
     ```
     ✅ Dataset loaded: 45 vehicles found
     Uvicorn running on http://0.0.0.0:8000
     ```
   - **Keep this window open!**

### Frontend Setup

1. **Open a NEW Command Prompt**
   - (Don't close the backend window!)
   - Press `Win + R` then type `cmd`

2. **Navigate to frontend**
   ```
   cd C:\Anish\hackathon\BHU\frontend
   ```

3. **Install dependencies**
   ```
   npm install
   ```
   - This may take several minutes (5-10 minutes is normal)

4. **Create environment file**
   ```
   echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
   ```

5. **Start the development server**
   ```
   npm run dev
   ```
   - You should see:
     ```
     ▲ Next.js 14.0.0
     - ready started server on 0.0.0.0:3000
     ```

6. **Open in browser**
   - Open your browser
   - Go to: `http://localhost:3000`

---

## 🧪 Testing the Setup

### Verify Backend is Running
1. Open your browser
2. Go to: `http://localhost:8000/docs`
3. You should see the FastAPI interactive documentation (Swagger UI)

### Verify Frontend is Running
1. Open your browser
2. Go to: `http://localhost:3000`
3. You should see the Carbon-Wise dashboard

### Test the Application
1. On the dashboard, fill in the form:
   - Daily Mileage: 50 km
   - Ownership Period: 5 years
   - Vehicle Segment: Select any segment
2. Click "Compare Vehicles"
3. You should see results with 3 cars and a chart

---

## 🆘 Troubleshooting

### Problem: "Python command not found"
**Solution:**
- Python may not be in your PATH
- Download Python from: https://www.python.org/downloads/
- **Important**: During installation, check the box "Add Python to PATH"
- Restart Command Prompt after installing

### Problem: "npm command not found"
**Solution:**
- Node.js may not be installed
- Download from: https://nodejs.org/
- Restart Command Prompt after installing
- Run `npm --version` to verify

### Problem: Backend starts but shows "Dataset not loaded"
**Solution:**
- The CSV file might be missing
- Check that this file exists:
  `C:\Anish\hackathon\BHU\data\vehicles_with_full_manufacturing_co2.csv`
- If missing, re-download or reinstall the project

### Problem: "Failed to connect to API" error in frontend
**Solutions:**
1. Make sure backend is running (check first Command Prompt window)
2. Verify `.env.local` file contains:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
3. Check that backend is listening on port 8000
4. Try accessing `http://localhost:8000/health` directly in browser

### Problem: Port 8000 or 3000 is already in use
**Solution:**
- Close any other application using these ports
- Or modify ports in configuration:
  - **Backend**: Edit `backend/main.py` (last line)
  - **Frontend**: Run `npm run dev -- -p 3001`

### Problem: npm install is very slow
**Solution:**
- This is normal for first install
- Can take 5-15 minutes
- Try clearing npm cache:
  ```
  npm cache clean --force
  npm install
  ```

### Problem: "ModuleNotFoundError: No module named 'fastapi'"
**Solution:**
- Virtual environment might not be activated
- Make sure prompt shows `(venv)` before running pip install
- Reinstall with:
  ```
  pip install -r requirements.txt
  ```

---

## 🎯 Next Steps After Installation

1. **Explore the API Documentation**
   - Visit: `http://localhost:8000/docs`
   - Try different endpoints

2. **Test Different Scenarios**
   - Try various daily mileages
   - Change ownership periods
   - Compare different vehicle segments

3. **Customize the Application**
   - Edit the CSV file to add more vehicles
   - Modify colors/styling in CSS files
   - Add new features!

---

## 📝 File Structure

```
C:\Anish\hackathon\BHU\
├── run_backend.bat          ← Double-click to start backend
├── run_frontend.bat         ← Double-click to start frontend
├── README.md                ← Full documentation
├── SETUP_WINDOWS.md         ← This file
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── .env.example
│   └── app/
├── data/
│   └── vehicles_with_full_manufacturing_co2.csv
└── .gitignore
```

---

## 🔄 Stopping the Application

To stop the application:

1. **Backend Terminal**: Press `Ctrl + C` to stop the server
2. **Frontend Terminal**: Press `Ctrl + C` to stop the dev server
3. Close the Command Prompt windows

---

## 💾 Saving Your Work

The application doesn't modify the database, so no data is saved between sessions.

If you want to add more vehicles:
1. Edit `data/vehicles_with_full_manufacturing_co2.csv`
2. Restart the backend
3. The new vehicles will be available immediately

---

## 🚀 Going Further

### Run in Production Mode
```
# Frontend build for production
npm run build
npm start
```

### Deploy to Cloud
- Backend: Deploy to AWS, Google Cloud, or Azure
- Frontend: Deploy to Vercel, Netlify, or AWS Amplify

---

## 📞 Getting Help

1. Check the main [README.md](README.md) for complete documentation
2. Visit backend docs at `http://localhost:8000/docs`
3. Check browser console (F12) for frontend errors
4. Review troubleshooting section above

---

**Enjoy exploring Carbon-Wise! 🌍**
