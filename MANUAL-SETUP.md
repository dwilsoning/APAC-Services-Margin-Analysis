# Manual Database Setup Guide

Since you already have PostgreSQL running from your Invoice Tracker, follow these simple steps:

## Step 1: Create the .env File

Create: `C:\Users\dwils\Claude-Projects\APAC-Services-Margin-Analysis\backend\.env`

With this content:

```env
DB_HOST=172.27.156.242
DB_PORT=5432
DB_NAME=apac_margin_analysis
DB_USER=margin_analysis_user
DB_PASSWORD=Diamonds04$
PORT=5001
JWT_SECRET=apac_margin_analysis_secret_key_2025
NODE_ENV=development
```

## Step 2: Open Command Prompt

Navigate to your backend folder:

```cmd
cd C:\Users\dwils\Claude-Projects\APAC-Services-Margin-Analysis\backend
```

## Step 3: Create Database (Using psql)

Run these commands one at a time:

```cmd
psql -U postgres -h 172.27.156.242 -c "CREATE DATABASE apac_margin_analysis;"
```

```cmd
psql -U postgres -h 172.27.156.242 -c "CREATE USER margin_analysis_user WITH PASSWORD 'Diamonds04$';"
```

```cmd
psql -U postgres -h 172.27.156.242 -c "GRANT ALL PRIVILEGES ON DATABASE apac_margin_analysis TO margin_analysis_user;"
```

**Note:** If you see "already exists" errors, that's fine - it means they're already created.

## Step 4: Run the Schema

This creates all the tables and loads the 16 default staff roles:

```cmd
set PGPASSWORD=Diamonds04$
psql -h 172.27.156.242 -U margin_analysis_user -d apac_margin_analysis -f db/schema.sql
```

## Step 5: Verify Setup

Test the connection:

```cmd
set PGPASSWORD=Diamonds04$
psql -h 172.27.156.242 -U margin_analysis_user -d apac_margin_analysis -c "SELECT COUNT(*) FROM staff_roles;"
```

You should see: `count: 16` (the default staff roles)

## Step 6: Install Dependencies

If you haven't already:

```cmd
npm install
```

## Step 7: Start the Application

From the project root:

```cmd
cd C:\Users\dwils\Claude-Projects\APAC-Services-Margin-Analysis
start-margin-analysis.bat
```

Or start manually:

**Terminal 1 - Backend:**
```cmd
cd C:\Users\dwils\Claude-Projects\APAC-Services-Margin-Analysis\backend
npm start
```

**Terminal 2 - Frontend:**
```cmd
cd C:\Users\dwils\Claude-Projects\APAC-Services-Margin-Analysis\frontend
npm start
```

## Troubleshooting

### "psql: command not found"

Add PostgreSQL to your PATH, or use the full path:

```cmd
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h 172.27.156.242
```

(Adjust the version number to match your PostgreSQL installation)

### Password Prompt

When prompted for password, use: `Post2020` (your postgres user password from Invoice Tracker)

### Connection Refused

Make sure PostgreSQL Windows service is running:
1. Open Services (Win + R, type `services.msc`)
2. Find "postgresql" service
3. Make sure it's "Running"

### Schema Errors

If you get errors about tables already existing, you can drop and recreate:

```cmd
set PGPASSWORD=Diamonds04$
psql -h 172.27.156.242 -U postgres -c "DROP DATABASE IF EXISTS apac_margin_analysis;"
```

Then start from Step 3 again.

## Success!

Once setup is complete, access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api

You should see a green "Server Online" indicator in the top navigation!
