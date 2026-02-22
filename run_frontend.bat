@echo off
cd frontend
echo Installing dependencies...
call npm install > nul 2>&1
if not exist .env.local (
    echo Creating .env.local file...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:8000
    ) > .env.local
)
echo.
echo ===================================
echo Starting Carbon-Wise Frontend
echo ===================================
echo Application will run on: http://localhost:3000
echo.
call npm run dev
pause
