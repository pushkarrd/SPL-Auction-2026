@echo off
echo ========================================
echo SPL 2026 Auction - Start Frontend
echo ========================================

cd /d "%~dp0frontend"

echo Starting React dev server...
npm run dev
