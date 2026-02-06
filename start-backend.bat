@echo off
echo ========================================
echo SPL 2026 Auction - Start Backend
echo ========================================

cd /d "%~dp0backend"

call venv\Scripts\activate
echo Starting FastAPI server...
python main.py
