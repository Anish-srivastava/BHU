# ⚡ Carbon-Wise: Ultra-Quick Start (5 Minutes)

## 🎯 Get Running in 5 Minutes

### Prerequisites
- ✅ Python 3.8+ installed
- ✅ Node.js 16+ installed
- ❌ No need to read long docs!

### 🚀 For Windows Users (EASIEST)

**Step 1: Open Project Folder**
- Open File Explorer
- Navigate to: `C:\Anish\hackathon\BHU`

**Step 2: Start Backend (First)**
- Double-click: `run_backend.bat`
- A terminal will open and say something like "running on http://0.0.0.0:8000"
- ✅ Leave this open!

**Step 3: Start Frontend (Second Terminal)**
- Double-click: `run_frontend.bat`
- Wait for message "ready - started server on 0.0.0.0:3000"
- ✅ App is running!

**Step 4: Open Browser**
- Go to: `http://localhost:3000`
- 🎉 You're done! Try it out!

---

### 💻 For Mac/Linux Users

```bash
# Terminal 1: Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && python main.py

# Terminal 2: Frontend
cd frontend
npm install && npm run dev

# Then open: http://localhost:3000
```

---

## ✨ That's It!

The application is ready to use. Try this:
1. Enter Daily Mileage: `50` km
2. Enter Ownership Period: `5` years
3. Select Segment: Pick any vehicle type
4. Click "Compare Vehicles"
5. See the results! 🎉

---

## 🛑 To Stop

- Press `Ctrl + C` in each terminal window
- Close the windows

---

## ❓ Problems?

**Error: "Command not found"**
- Python/Node.js not installed
- Get them from: python.org or nodejs.org

**Can't connect to API?**
- Make sure backend terminal is still running
- Check `http://localhost:8000/health` directly

**Port already in use?**
- Close other applications
- Or read the full docs in README.md

---

**For detailed setup, see: [SETUP_WINDOWS.md](SETUP_WINDOWS.md) or [README.md](README.md)**

Happy comparing! 🌍
