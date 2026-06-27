@echo off
title AI Lead Gen - Local Demo
cd /d "%~dp0"

echo ============================================================
echo   AI Lead Generation - Local Demo Launcher
echo ============================================================
echo.

REM --- 1. Check Node.js is installed ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo.
  echo Please install Node.js LTS from:  https://nodejs.org
  echo Then double-click this file again.
  echo.
  pause
  exit /b 1
)

REM --- 2. Install dependencies (first run only) ---
if not exist "node_modules" (
  echo Installing dependencies... this can take a few minutes the first time.
  call npm install --legacy-peer-deps
  if errorlevel 1 ( echo [ERROR] Install failed. & pause & exit /b 1 )
)

REM --- 3. Create local database + demo data (first run only) ---
if not exist "prisma\dev.db" (
  echo Setting up the local database and demo data...
  call npm run setup:local
  if errorlevel 1 ( echo [ERROR] Database setup failed. & pause & exit /b 1 )
)

echo.
echo ============================================================
echo   Starting the app...  A browser will open shortly.
echo   Login:  demo@demo.com  /  Demo@1234
echo   To stop the app: close this window.
echo ============================================================
echo.

REM --- 4. Open the browser after the server has had time to boot ---
start "" cmd /c "timeout /t 9 >nul & start "" http://localhost:3000"

REM --- 5. Start the server (runs in this window) ---
call npm run dev:local

pause
