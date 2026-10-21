@echo off
title COGNIVA — Single Merged HTTP Service
color 0A

echo.
echo  =========================================
echo    COGNIVA - Cognitive Gaming Platform
echo    Single Merged HTTP Service (Port 5000)
echo  =========================================
echo.

REM ── Check Node.js ────────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo  Download it from: https://nodejs.org
    pause
    exit /b 1
)

REM ── Check Python ─────────────────────────────────────────────────────────────
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python is not installed.
    echo  Download it from: https://www.python.org
    pause
    exit /b 1
)

REM ── Install frontend deps if node_modules missing ────────────────────────────
if not exist "node_modules" (
    echo  [INFO] Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed. Please check your internet connection.
        pause
        exit /b 1
    )
)

REM ── Install backend deps ─────────────────────────────────────────────────────
echo  [INFO] Ensuring backend dependencies are installed...
python -m pip install flask flask-cors --quiet

REM ── Build frontend if dist is missing ────────────────────────────────────────
if not exist "dist" (
    echo  [INFO] Building frontend for single HTTP service...
    call npm run build
)

REM ── Free port 5000 if previously locked ──────────────────────────────────────
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /f /pid %%a >nul 2>&1

REM ── Launch single merged HTTP server and open browser ────────────────────────
echo.
echo  =========================================
echo    Single Merged HTTP Server Running!
echo.
echo    Unified App : http://localhost:5000
echo    Mobile / LAN: http://<LAN-IP>:5000
echo  =========================================
echo.

start http://localhost:5000
python -u backend\app.py
