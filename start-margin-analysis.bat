@echo off
REM =============================================================================
REM APAC Services Margin Analysis - Start Script
REM =============================================================================
REM This script starts both the backend (PostgreSQL) and frontend servers
REM Press Ctrl+C to stop both servers
REM =============================================================================

echo.
echo ========================================
echo APAC Services Margin Analysis
echo ========================================
echo.
echo Starting APAC Margin Analysis with PostgreSQL database...
echo.

REM Set the backend directory path
set BACKEND_DIR=C:\Users\dwils\Claude-Projects\APAC-Services-Margin-Analysis\backend

REM Change to backend directory
cd /d "%BACKEND_DIR%"
echo Backend directory: %CD%
echo.

REM Check if .env exists
if not exist "%BACKEND_DIR%\.env" (
    echo.
    echo ERROR: Backend .env file not found!
    echo Please create: %BACKEND_DIR%\.env
    echo.
    echo See SETUP.md for configuration details.
    echo.
    pause
    exit /b 1
)

REM Check if PostgreSQL is running
echo [1/3] Checking PostgreSQL connection...
node -e "const {Pool} = require('pg'); require('dotenv').config(); const pool = new Pool({user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT}); pool.query('SELECT NOW()', (err) => { if(err) { console.error('ERROR: PostgreSQL not connected!'); console.error(err.message); process.exit(1); } else { console.log('PostgreSQL is connected.'); } pool.end(); })"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Cannot connect to PostgreSQL!
    echo Please ensure PostgreSQL is running and .env is configured correctly.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/3] Starting Backend Server (PostgreSQL)...
start "APAC Margin Analysis Backend" cmd /k "cd /d "%BACKEND_DIR%" && node server.js"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Server...
set FRONTEND_DIR=C:\Users\dwils\Claude-Projects\APAC-Services-Margin-Analysis\frontend
cd /d "%FRONTEND_DIR%"
start "APAC Margin Analysis Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm start"

echo.
echo ========================================
echo APAC Margin Analysis Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:3000
echo.
echo Two command windows have been opened:
echo   1. Backend Server (PostgreSQL) - DO NOT CLOSE
echo   2. Frontend Server (React) - DO NOT CLOSE
echo.
echo To stop the servers:
echo   - Run stop-margin-analysis.bat
echo   - OR close both command windows
echo   - OR press Ctrl+C in each window
echo.
echo This window can be safely closed.
echo.
pause
