@echo off
title Smart Greenhouse Automation Hub - Launcher
color 0A

echo ======================================================================
echo    SMART ENVIRONMENTAL ^& GREENHOUSE AUTOMATION HUB (3D + AI AGENT)
echo ======================================================================
echo.
echo Starting all system services...
echo.

echo [1/3] Launching Local AI Model Agent (Llamafile Qwen 4B on port 8080)...
start "Greenhouse Local AI Agent (Port 8080)" cmd /k "call start.bat"

timeout /t 3 /nobreak >nul

echo [2/3] Launching Node.js Express Backend API (Port 5000)...
start "Greenhouse Backend API (Port 5000)" cmd /k "color 0E && title Backend API Server && npm run server"

timeout /t 2 /nobreak >nul

echo [3/3] Launching 3D Web Dashboard (Port 3000)...
start "Greenhouse 3D Web Dashboard (Port 3000)" cmd /k "color 0A && title Web Dashboard && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ======================================================================
echo All 3 services are launching!
echo  - 3D Web Dashboard:  http://localhost:3000
echo  - Backend API:       http://localhost:5000
echo  - Local AI Agent:    http://localhost:8080
echo ======================================================================
echo.
echo Opening browser...
start http://localhost:3000

pause

