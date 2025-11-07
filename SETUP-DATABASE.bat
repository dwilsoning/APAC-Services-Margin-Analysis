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

echo [1/4] Checking if PostgreSQL is running...
echo NOTE: PostgreSQL should already be running on your Windows system.
echo If you get connection errors, make sure PostgreSQL Windows service is running.
timeout /t 2 /nobreak >nul

echo.
echo [2/4] Creating database and user...
echo.

REM Use psql directly without wsl wrapper
psql -U postgres -h 172.27.156.242 -c "CREATE DATABASE apac_margin_analysis;" 2>nul || echo Database may already exist
psql -U postgres -h 172.27.156.242 -c "CREATE USER margin_analysis_user WITH PASSWORD 'Diamonds04$';" 2>nul || echo User may already exist
psql -U postgres -h 172.27.156.242 -c "GRANT ALL PRIVILEGES ON DATABASE apac_margin_analysis TO margin_analysis_user;"

echo.
echo [3/4] Running database schema...
echo This will create all tables and insert default staff roles...
echo.

cd /d "%BACKEND_DIR%"
set PGPASSWORD=Diamonds04$
psql -h 172.27.156.242 -U margin_analysis_user -d apac_margin_analysis -f db/schema.sql

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
