# APAC Services Margin Analysis - Quick Start

## 🚀 Starting the Application

**Simply double-click:** `start-margin-analysis.bat`

The script will automatically:
1. Detect your current WSL IP address
2. Update the backend `.env` file with the correct IP
3. Verify PostgreSQL connection
4. Start both servers

**Then open your browser to the URL shown in the script output**
(Usually something like: `http://172.27.X.X:3000`)

---

## ⚙️ First Time Setup

If this is your first time running the application:

1. **Set up the database:**
   - Double-click: `SETUP-DATABASE.bat`
   - This creates the database, user, and loads 16 default staff roles

2. **Start the application:**
   - Double-click: `start-margin-analysis.bat`

---

## 🛑 Stopping the Application

Double-click: `stop-margin-analysis.bat`

Or close the two command windows that were opened.

---

## 📍 Accessing the Application

The batch file will show you the correct URL based on your current WSL IP address.

**Example:** `http://172.27.156.242:3000`

**Note:** The IP address may change after restarting your computer. The batch files automatically detect and update it each time you start the application.

---

## 🔧 Troubleshooting

### Can't connect to the application?

1. Make sure PostgreSQL Windows service is running:
   - Open Services (Win + R, type `services.msc`)
   - Find "postgresql-x64-18"
   - Make sure it's "Running"

2. Check your WSL IP address:
   - Double-click: `GET-IP-ADDRESS.bat`
   - Use the IP shown to access the application

3. Re-run the setup if needed:
   - `SETUP-DATABASE.bat` (safe to run multiple times)

### "Server Offline" indicator in the app?

- The backend may not have started yet - wait 5-10 seconds and refresh
- Check that both command windows are still open and running
- Restart using `stop-margin-analysis.bat` then `start-margin-analysis.bat`

---

## 📁 Key Files

- **start-margin-analysis.bat** - Starts both servers (auto-detects IP)
- **stop-margin-analysis.bat** - Stops all servers
- **SETUP-DATABASE.bat** - One-time database setup (auto-detects IP)
- **GET-IP-ADDRESS.bat** - Shows your current WSL IP address

---

## ✅ What You Have

- **Frontend:** React + TypeScript + Material-UI
- **Backend:** Node.js + Express
- **Database:** PostgreSQL with 16 pre-loaded staff roles
- **Features:**
  - Client & Project Management
  - Financial Data Entry
  - Staff Roles (OPEX) with hourly rates
  - Third-Party Resources (COGS) with daily rates
  - Automatic cost calculations
  - Dashboard with visualizations

---

**Need help?** Check `SETUP.md` or `QUICKSTART.md` for detailed instructions.
