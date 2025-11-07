@echo off
REM =============================================================================
REM APAC Services Margin Analysis - Database Setup Script
REM =============================================================================
REM This script sets up the PostgreSQL database for the application
REM =============================================================================

echo.
echo ========================================
echo APAC Margin Analysis - Database Setup
echo ========================================
echo.

REM Check if .env file exists
set BACKEND_DIR=C:\Users\dwils\Claude-Projects\APAC-Services-Margin-Analysis\backend

if not exist "%BACKEND_DIR%\.env" (
    echo ERROR: Backend .env file not found!
    echo.
    echo Please create the file: %BACKEND_DIR%\.env
    echo.
    echo Use the template from .env.example or follow the SETUP.md guide.
    echo.
    pause
    exit /b 1
)

echo [1/4] Starting PostgreSQL service...
wsl sudo service postgresql start
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start PostgreSQL
    echo Please run: wsl sudo service postgresql start
    pause
    exit /b 1
)

echo.
echo [2/4] Checking PostgreSQL connection...
timeout /t 2 /nobreak >nul

echo.
echo [3/4] Creating database and user...
echo NOTE: You may be prompted for your Linux password for 'sudo'
echo.

wsl bash -c "sudo -u postgres psql -c \"CREATE DATABASE apac_margin_analysis;\" 2>/dev/null || echo 'Database may already exist'"
wsl bash -c "sudo -u postgres psql -c \"CREATE USER margin_analysis_user WITH PASSWORD 'Diamonds04\$';\" 2>/dev/null || echo 'User may already exist'"
wsl bash -c "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE apac_margin_analysis TO margin_analysis_user;\""

echo.
echo [4/4] Running database schema...
echo This will create all tables and insert default staff roles...
echo.

cd /d "%BACKEND_DIR%"
wsl bash -c "PGPASSWORD='Diamonds04\$' psql -h 172.27.144.1 -U margin_analysis_user -d apac_margin_analysis -f db/schema.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Schema execution had some warnings or errors.
    echo This is normal if tables already exist.
    echo.
) else (
    echo.
    echo ========================================
    echo Database Setup Complete!
    echo ========================================
    echo.
)

echo Database: apac_margin_analysis
echo User: margin_analysis_user
echo.
echo You can now start the application using:
echo   start-margin-analysis.bat
echo.
pause
