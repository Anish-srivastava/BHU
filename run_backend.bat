@echo off
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo Installing dependencies...
pip install -r requirements.txt > nul 2>&1
echo.
echo ===================================
echo Starting Carbon-Wise Backend
echo ===================================
echo Server will run on: http://localhost:8000
echo API Docs available at: http://localhost:8000/docs
echo.
python main.py
pause
