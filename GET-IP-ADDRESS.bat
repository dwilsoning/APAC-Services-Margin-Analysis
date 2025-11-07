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

REM Get the IP address from WSL
for /f "tokens=2 delims=: " %%a in ('wsl ip addr show eth0 ^| findstr "inet "') do set WSL_IP=%%a

REM Remove the subnet mask (e.g., /20)
for /f "tokens=1 delims=/" %%a in ("%WSL_IP%") do set CLEAN_IP=%%a

echo Your PostgreSQL IP Address is: %CLEAN_IP%
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
pause
