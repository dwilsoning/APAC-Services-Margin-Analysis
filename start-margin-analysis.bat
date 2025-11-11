@echo off
setlocal enabledelayedexpansion

echo ================================================
echo  APAC Services Margin Analysis
echo ================================================
echo.

REM Step 1: Stop any existing servers
echo [1/4] Stopping any existing servers...
echo.

REM Kill any Node.js process running on port 5001 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001 ^| findstr LISTENING 2^>nul') do (
    echo Found process on port 5001: %%a
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! == 0 (
        echo   + Stopped process %%a
    )
)

REM Kill any server.js processes
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO LIST 2^>nul ^| findstr /C:"PID:"') do (
    wmic process where "ProcessId=%%a" get CommandLine 2>nul | findstr /C:"server.js" >nul 2>&1
    if !errorlevel! == 0 (
        echo Found server process: %%a
        taskkill /F /PID %%a >nul 2>&1
        if !errorlevel! == 0 (
            echo   + Stopped server (PID: %%a)
        )
    )
)

REM Kill any Vite dev server processes (frontend) on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo Found process on port 3000: %%a
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! == 0 (
        echo   + Stopped process %%a
    )
)

echo   + All existing servers stopped

echo.

REM Step 2: Validate ports are free
echo [2/4] Validating ports are free...
echo.

set "port5001_free=1"
set "port3000_free=1"

netstat -aon | findstr :5001 | findstr LISTENING >nul 2>&1
if !errorlevel! == 0 (
    set "port5001_free=0"
    echo   WARNING: Port 5001 still in use!
) else (
    echo   + Port 5001 is free
)

netstat -aon | findstr :3000 | findstr LISTENING >nul 2>&1
if !errorlevel! == 0 (
    set "port3000_free=0"
    echo   WARNING: Port 3000 still in use!
) else (
    echo   + Port 3000 is free
)

if !port5001_free! == 0 (
    echo.
    echo ERROR: Port 5001 is still in use. Cannot start backend.
    echo    Please manually check: netstat -aon ^| findstr :5001
    echo.
    pause
    exit /b 1
)

if !port3000_free! == 0 (
    echo.
    echo ERROR: Port 3000 is still in use. Cannot start frontend.
    echo    Please manually check: netstat -aon ^| findstr :3000
    echo.
    pause
    exit /b 1
)

echo.

REM Step 3: Start Backend Server
echo [3/4] Starting Backend Server...
start /min "APAC Margin Analysis - Backend" cmd /k "cd /d "C:\Users\dwils\Claude-Projects\APAC-Services-Margin-Analysis\backend" && node server.js"

REM Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

echo   + Backend server started
echo.

REM Step 4: Start Frontend Server
echo [4/4] Starting Frontend Server...
start /min "APAC Margin Analysis - Frontend" cmd /k "cd /d "C:\Users\dwils\Claude-Projects\APAC-Services-Margin-Analysis\frontend" && npm start"

echo   + Frontend server started
echo.

REM Wait a moment for frontend to fully start
timeout /t 2 /nobreak >nul

REM Open the browser
echo Opening browser...
start http://localhost:3000

echo.
echo ================================================
echo  Both servers are running!
echo ================================================
echo.
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:3000
echo.
echo The server windows are running minimized in the taskbar.
echo Browser should open automatically to http://localhost:3000
echo Close this window when you're done.
echo.
pause
