@echo off
REM APAC Services Margin Analysis - Windows Development Startup Script

echo ========================================
echo APAC Margin Analysis - Starting Development Environment
echo ========================================

REM Check if running in the correct directory
if not exist "backend\package.json" (
    echo ERROR: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Start backend in a new window
echo Starting backend server...
start "Margin Analysis - Backend" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend in a new window
echo Starting frontend development server...
start "Margin Analysis - Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo Development environment started!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Close the command windows to stop the servers.
pause
