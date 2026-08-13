@echo off
title E-Transport ERP - Backend (FastAPI)
echo ==========================================
echo Starting E-Transport ERP Backend API...
echo ==========================================
cd /d "%~dp0\backend"
".venv\Scripts\python.exe" -m uvicorn app.main:app --reload --port 8000
pause
