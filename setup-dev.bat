@echo off
REM APAC Services Margin Analysis - Windows Development Setup Script

echo ========================================
echo APAC Margin Analysis - Development Setup
echo ========================================

REM Check if running in the correct directory
if not exist "backend\package.json" (
    echo ERROR: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Setup backend
echo.
echo [1/4] Setting up backend...
cd backend

if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit backend\.env and update the configuration values!
    echo Press any key after editing .env to continue...
    pause > nul
)

echo Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)

echo Initializing database with margin analysis schema...
call npm run init-margin-schema
if errorlevel 1 (
    echo ERROR: Failed to initialize database
    cd ..
    pause
    exit /b 1
)

echo.
echo Creating admin user...
echo You will be prompted for admin credentials.
call npm run create-admin
if errorlevel 1 (
    echo ERROR: Failed to create admin user
    cd ..
    pause
    exit /b 1
)

cd ..

REM Setup frontend
echo.
echo [2/4] Setting up frontend...
cd frontend

if not exist ".env" (
    echo Creating frontend .env file...
    copy .env.example .env
)

echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run "start-dev.bat" to start the development environment
echo 2. Access the application at http://localhost:3000
echo 3. Login with your admin credentials
echo.
echo ========================================
pause
