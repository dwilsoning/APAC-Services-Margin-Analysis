# APAC Services Margin Analysis - Setup Guide

This guide will help you set up and run the APAC Services Margin Analysis application.

## Prerequisites

- Node.js (v18 or higher) - Already installed ✓
- PostgreSQL (v12 or higher) - Already installed ✓
- npm - Already installed ✓

## Database Setup

### Step 1: Find Your PostgreSQL IP Address

**Option A - Use the Helper Script (Easiest):**

Double-click: `GET-IP-ADDRESS.bat`

This will display your IP address and tell you exactly what to put in your `.env` file.

**Option B - Manual (Command Prompt):**

Open Command Prompt and run:
```cmd
wsl ip addr show eth0 | findstr "inet "
```

Look for the line with `inet` and copy the IP address (e.g., `172.27.144.1`)

Your IP should be something like: `172.27.144.1`

### Step 2: Start PostgreSQL Service

Open Command Prompt or PowerShell and run:
```cmd
wsl sudo service postgresql start
```

Verify it's running:
```cmd
wsl sudo service postgresql status
```

You should see "online" or "active (running)"

### Step 3: Create Database and User

**Option A - Use the Automated Setup (Recommended):**

Double-click: `SETUP-DATABASE.bat`

This will automatically create everything for you!

**Option B - Manual Setup:**

Open Command Prompt and run:
```cmd
wsl sudo -u postgres psql
```

Then in the PostgreSQL prompt, run these commands:
```sql
CREATE DATABASE apac_margin_analysis;
CREATE USER margin_analysis_user WITH PASSWORD 'Diamonds04$';
GRANT ALL PRIVILEGES ON DATABASE apac_margin_analysis TO margin_analysis_user;
\q
```

### Step 4: Run Database Schema

```bash
cd /mnt/c/Users/dwils/Claude-Projects/APAC-Services-Margin-Analysis/backend
PGPASSWORD='Diamonds04$' psql -h 172.27.144.1 -U margin_analysis_user -d apac_margin_analysis -f db/schema.sql
```

This will create all tables and insert the default staff roles.

## Backend Configuration

### Step 5: Create .env File

Create a file at: `/mnt/c/Users/dwils/Claude-Projects/APAC-Services-Margin-Analysis/backend/.env`

**Copy and paste this exact content:**

```env
# PostgreSQL Database Configuration
DB_HOST=172.27.144.1
DB_PORT=5432
DB_NAME=apac_margin_analysis
DB_USER=margin_analysis_user
DB_PASSWORD=Diamonds04$

# Server Configuration
PORT=5001

# JWT Secret (for future authentication)
JWT_SECRET=apac_margin_analysis_secret_key_2025

# Environment
NODE_ENV=development
```

**IMPORTANT**: Replace `172.27.144.1` with YOUR actual IP address from Step 1 if it's different.

## Frontend Configuration

### Step 6: Create Frontend .env File (Optional)

Create a file at: `/mnt/c/Users/dwils/Claude-Projects/APAC-Services-Margin-Analysis/frontend/.env`

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5001/api
```

This is optional - the frontend has this as a default.

## Starting the Application

### Option 1: Using Batch Files (Recommended)

**To Start:**
```bash
# Double-click or run from command prompt:
start-margin-analysis.bat
```

This will:
1. Check PostgreSQL connection
2. Start the backend server (port 5001)
3. Start the frontend server (port 3000)
4. Open your browser automatically

**To Stop:**
```bash
# Double-click or run:
stop-margin-analysis.bat
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd /mnt/c/Users/dwils/Claude-Projects/APAC-Services-Margin-Analysis/backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd /mnt/c/Users/dwils/Claude-Projects/APAC-Services-Margin-Analysis/frontend
npm start
```

## Accessing the Application

Once started, open your browser to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api

## Troubleshooting

### PostgreSQL Connection Issues

If you get database connection errors:

1. **Check PostgreSQL is running:**
   ```bash
   sudo service postgresql status
   ```

2. **Check your IP address:**
   ```bash
   ip addr | grep inet | grep eth0 | awk '{print $2}' | cut -d/ -f1
   ```
   Update the `DB_HOST` in `.env` if it changed.

3. **Test connection manually:**
   ```bash
   PGPASSWORD='Diamonds04$' psql -h 172.27.144.1 -U margin_analysis_user -d apac_margin_analysis
   ```

4. **Check PostgreSQL configuration:**
   ```bash
   sudo nano /etc/postgresql/*/main/postgresql.conf
   # Ensure: listen_addresses = '*'

   sudo nano /etc/postgresql/*/main/pg_hba.conf
   # Ensure this line exists:
   host    all    all    0.0.0.0/0    md5
   ```

5. **Restart PostgreSQL after config changes:**
   ```bash
   sudo service postgresql restart
   ```

### Port Already in Use

If ports 3000 or 5001 are already in use:

```bash
# Stop the processes:
stop-margin-analysis.bat

# Or manually kill processes:
netstat -ano | findstr :5001
taskkill /PID <process_id> /F

netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Missing Dependencies

If you get module not found errors:

```bash
# Backend
cd /mnt/c/Users/dwils/Claude-Projects/APAC-Services-Margin-Analysis/backend
npm install

# Frontend
cd /mnt/c/Users/dwils/Claude-Projects/APAC-Services-Margin-Analysis/frontend
npm install
```

## Default Staff Roles

The database comes pre-loaded with 16 Altera staff roles:

1. Project/Program Director - $150/hr
2. Project Manager - $120/hr
3. PMO Assistant - $75/hr
4. Implementation Consultant - $110/hr
5. Solution Architect - $140/hr
6. System Engineer - $100/hr
7. Training Manager - $115/hr
8. Trainer/Training Consultant - $95/hr
9. Platform Technology - $105/hr
10. Integration Consultant - $110/hr
11. Global Services PM - $125/hr
12. Global Services IC - $110/hr
13. Global Services SE - $100/hr
14. APAC Testing Consultant - $90/hr
15. APAC India Roles - $70/hr
16. Domestic non-APAC roles - $85/hr

**Note:** These are placeholder rates. Update them via the "Staff Roles" page in the application.

## Next Steps

Once the application is running:

1. **Navigate to Staff Roles** - Review and update hourly rates as needed
2. **Add Third-Party Resources** - Add external contractors with daily rates
3. **Data Entry Page** - Start entering:
   - Clients
   - Projects
   - Financial Data
   - Resource Allocations (for COGS calculation)
4. **Dashboard** - View financial analysis and reports

## Getting Help

- **Server Status**: Check the indicator in the top navigation bar
- **Help Button**: Click "Help" in the navigation for in-app documentation
- **Logs**: Check terminal windows for error messages

## File Locations

- **Backend .env**: `backend/.env`
- **Frontend .env**: `frontend/.env` (optional)
- **Database Schema**: `backend/db/schema.sql`
- **Batch Scripts**: `start-margin-analysis.bat` and `stop-margin-analysis.bat`
