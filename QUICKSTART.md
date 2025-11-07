# Quick Start Guide - APAC Services Margin Analysis

Follow these simple steps to get the application running in 5 minutes!

## Step 1: Get Your IP Address

Double-click: **`GET-IP-ADDRESS.bat`**

This will show you your PostgreSQL IP address (something like `172.27.144.1`).

**Write this IP down** - you'll need it in the next step!

---

## Step 2: Create the .env File

1. Navigate to: `backend` folder
2. Create a new file named: `.env` (no extension)
3. Copy and paste this content:

```env
DB_HOST=172.27.144.1
DB_PORT=5432
DB_NAME=apac_margin_analysis
DB_USER=margin_analysis_user
DB_PASSWORD=Diamonds04$
PORT=5001
JWT_SECRET=apac_margin_analysis_secret_key_2025
NODE_ENV=development
```

4. **IMPORTANT**: Replace `172.27.144.1` with YOUR IP from Step 1
5. Save the file

**Where to create it:**
```
APAC-Services-Margin-Analysis/
├── backend/
│   └── .env  ← Create this file here
```

---

## Step 3: Set Up the Database

Double-click: **`SETUP-DATABASE.bat`**

This will:
- Start PostgreSQL
- Create the database
- Create the user
- Set up all tables
- Load the 16 default staff roles

**Note:** If prompted, enter your Linux/WSL password.

---

## Step 4: Start the Application

Double-click: **`start-margin-analysis.bat`**

This will:
- Start the backend server (port 5001)
- Start the frontend server (port 3000)
- Open your browser automatically

Two command windows will open - **don't close them!**

---

## Step 5: Use the Application

Your browser should open to: `http://localhost:3000`

Look for the **green "Server Online"** indicator in the top right.

### What to do first:

1. **Staff Roles** - Click to review/update the hourly rates
2. **Third-Party** - Add external contractors with daily rates
3. **Data Entry** - Start adding:
   - Clients
   - Projects
   - Financial Data
   - Resource Allocations (calculates COGS automatically!)

---

## Stopping the Application

Double-click: **`stop-margin-analysis.bat`**

---

## Troubleshooting

### "Server Offline" (Red indicator)

1. Check PostgreSQL is running:
   ```cmd
   wsl sudo service postgresql status
   ```

2. Start PostgreSQL if needed:
   ```cmd
   wsl sudo service postgresql start
   ```

3. Run `GET-IP-ADDRESS.bat` again and update your `.env` file if IP changed

4. Restart the application

### "Cannot find module" errors

Open Command Prompt and run:
```cmd
cd backend
npm install

cd ../frontend
npm install
```

### Port already in use

Run: `stop-margin-analysis.bat` first, then try starting again.

---

## File Locations Cheat Sheet

- **Backend .env file**: `backend/.env`
- **Start app**: `start-margin-analysis.bat` (in root folder)
- **Stop app**: `stop-margin-analysis.bat` (in root folder)
- **Setup database**: `SETUP-DATABASE.bat` (in root folder)
- **Get IP**: `GET-IP-ADDRESS.bat` (in root folder)

---

## Default Staff Roles Included

Your database comes pre-loaded with 16 Altera staff roles:

| Role | Rate/Hour |
|------|-----------|
| Project/Program Director | $150 |
| Project Manager | $120 |
| Solution Architect | $140 |
| Global Services PM | $125 |
| Training Manager | $115 |
| Implementation Consultant | $110 |
| Integration Consultant | $110 |
| Global Services IC | $110 |
| Platform Technology | $105 |
| System Engineer | $100 |
| Global Services SE | $100 |
| Trainer/Training Consultant | $95 |
| APAC Testing Consultant | $90 |
| Domestic non-APAC roles | $85 |
| PMO Assistant | $75 |
| APAC India Roles | $70 |

**Update these rates** in the application via Staff Roles page!

---

## Need More Help?

- **Detailed setup**: See `SETUP.md`
- **In-app help**: Click the "Help" button in the navigation bar
- **Server status**: Check the indicator in the top right corner

---

That's it! You're ready to start tracking your project margins! 🚀
