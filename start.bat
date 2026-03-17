@echo off
title CloudSentinel - Starting...
color 0B
echo ============================================
echo    CloudSentinel v3.0
echo    Enterprise Multi-Cloud Security Platform
echo ============================================
echo.

:: Start Backend
echo [1/2] Starting Backend on port 5000...
start "CloudSentinel Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app:app --reload --port 5000"
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [2/2] Starting Frontend on port 3002...
start "CloudSentinel Frontend" cmd /k "cd /d %~dp0frontend && npx vite --port 3002"
timeout /t 5 /nobreak >nul

:: Open Browser
echo.
echo [OK] Opening CloudSentinel in browser...
start http://localhost:3002

echo.
echo ============================================
echo    CloudSentinel is running!
echo    Frontend: http://localhost:3002
echo    Backend:  http://localhost:5000
echo    Login:    admin / admin123
echo ============================================
echo.
echo Close this window to keep servers running.
echo To stop: close the Backend and Frontend windows.
pause
