@echo off
:: Portfolio Pro v2 — Quick Start (Windows)
setlocal
cd /d "%~dp0"

echo.
echo ══════════════════════════════════════
echo   Portfolio Pro v2
echo ══════════════════════════════════════

python --version >nul 2>&1 || (echo   ERROR: Python not found ^& pause ^& exit /b 1)

if not exist ".venv\" (echo   Creating virtual environment... & python -m venv .venv)

call .venv\Scripts\activate.bat

echo   Installing dependencies...
pip install -q -r requirements.txt

echo   Starting server...
echo   Open: http://localhost:5000
echo ══════════════════════════════════════
echo.

python app.py
pause
