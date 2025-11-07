@echo off
REM =============================================================================
REM Get PostgreSQL IP Address for WSL
REM =============================================================================
REM This script helps you find the correct IP address for PostgreSQL in WSL
REM =============================================================================

echo.
echo ========================================
echo PostgreSQL IP Address Finder
echo ========================================
echo.
echo Finding your WSL PostgreSQL IP address...
echo.

REM Get IPv4 address only (exclude IPv6)
for /f "tokens=2" %%a in ('wsl ip -4 addr show eth0 ^| findstr "inet "') do (
    for /f "tokens=1 delims=/" %%b in ("%%a") do set CLEAN_IP=%%b
)

REM If that didn't work, try alternative method
if "%CLEAN_IP%"=="" (
    echo Trying alternative method...
    for /f "tokens=4" %%a in ('wsl ip addr show eth0 ^| findstr "inet " ^| findstr -v "inet6"') do (
        for /f "tokens=1 delims=/" %%b in ("%%a") do set CLEAN_IP=%%b
    )
)

REM Check if we got a valid IP
if "%CLEAN_IP%"=="" (
    echo ERROR: Could not detect IP address automatically.
    echo.
    echo Please run this command manually in Command Prompt:
    echo   wsl hostname -I
    echo.
    echo Use the FIRST IP address shown (should look like 172.x.x.x or 192.168.x.x)
    echo.
    pause
    exit /b 1
)

echo Your PostgreSQL IP Address is: %CLEAN_IP%
echo.
echo This should be an IPv4 address like: 172.27.144.1
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Copy this IP address: %CLEAN_IP%
echo.
echo 2. Open this file in a text editor:
echo    %~dp0backend\.env
echo.
echo 3. Update the DB_HOST line to:
echo    DB_HOST=%CLEAN_IP%
echo.
echo 4. Save the file and start the application with:
echo    start-margin-analysis.bat
echo.
echo ========================================
echo.
echo NOTE: If the IP address looks wrong (like "fe80" or incomplete):
echo.
echo Run this command in Command Prompt:
echo   wsl hostname -I
echo.
echo Use the FIRST IP address from that output instead.
echo It should look like: 172.x.x.x or 192.168.x.x
echo.
pause
