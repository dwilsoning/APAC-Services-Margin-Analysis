@echo off
REM =============================================================================
REM APAC Services Margin Analysis - Stop Script
REM =============================================================================
REM This script stops both the backend and frontend servers
REM =============================================================================

echo.
echo ========================================
echo Stopping APAC Services Margin Analysis
echo ========================================
echo.

echo Stopping Node.js servers (Backend)...
taskkill /FI "WINDOWTITLE eq APAC Margin Analysis Backend*" /T /F 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Backend server stopped.
) else (
    echo No backend server found running.
)

echo.
echo Stopping React servers (Frontend)...
taskkill /FI "WINDOWTITLE eq APAC Margin Analysis Frontend*" /T /F 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Frontend server stopped.
) else (
    echo No frontend server found running.
)

echo.
echo Cleaning up any remaining Node.js processes on ports 5001 and 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5001" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

echo.
echo ========================================
echo APAC Services Margin Analysis Stopped
echo ========================================
echo.
pause
