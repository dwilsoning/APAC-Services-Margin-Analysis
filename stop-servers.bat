@echo off
echo ================================================
echo   Stopping APAC Services Margin Analysis
echo ================================================
echo.

echo Stopping Backend Server (Port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    echo Found process on port 5000: %%a
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✓ Backend server stopped successfully
    )
)

echo.
echo Stopping Frontend Server (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Found process on port 3000: %%a
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✓ Frontend server stopped successfully
    )
)

echo.
echo ================================================
echo   All servers stopped
echo ================================================
echo.
pause
