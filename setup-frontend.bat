@echo off
echo ========================================
echo SPL 2026 Auction - Frontend Setup
echo ========================================

cd /d "%~dp0frontend"

echo Installing npm dependencies...
npm install

echo.
echo ========================================
echo Frontend setup complete!
echo.
echo To start the frontend:
echo   cd frontend
echo   npm run dev
echo ========================================
pause
