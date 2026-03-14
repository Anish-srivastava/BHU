@echo off
cd frontend
echo Installing dependencies...
call npm install > nul 2>&1
echo.
echo ===================================
echo Starting Carbon-Wise Frontend
echo ===================================
echo Single-page HTML/CSS/JS frontend will run on: http://localhost:3000
echo.
call npm run dev
pause
