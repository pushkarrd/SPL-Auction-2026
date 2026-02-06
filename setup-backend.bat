@echo off
echo ========================================
echo SPL 2026 Auction - Backend Setup
echo ========================================

cd /d "%~dp0backend"

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo ========================================
echo Backend setup complete!
echo.
echo To start the backend:
echo   cd backend
echo   venv\Scripts\activate
echo   python main.py
echo ========================================
pause
