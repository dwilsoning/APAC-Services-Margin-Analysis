# 🚀 START HERE - Quick Launch Guide

## Get Started in 3 Steps

### Step 1: Setup (First Time Only)

**Windows:**
```bash
setup-dev.bat
```

**Linux/Mac:**
```bash
cd backend
npm install
npm run init-margin-schema
npm run create-admin
cd ../frontend
npm install
```

### Step 2: Start Application

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm start
```

### Step 3: Access

Open browser: **http://localhost:3000**

Login with credentials you created during setup.

---

## First Time Usage

### As Admin (First Login)

1. **Set Cost Rates**
   - Click "Admin: Cost Rates"
   - Enter USD rates for all 12 resource types
   - Click "Save All Changes"

2. **Create First Project**
   - Click "New Project"
   - Create or select a client
   - Fill in project details
   - Allocate hours to resources
   - Click "Create Project"

3. **View Analytics**
   - Click "Analytics Dashboard"
   - See your project metrics
   - Use filters and export options

### The 12 Resource Types

You must set rates for:
1. Project Director
2. Project Manager
3. PMO Assistant
4. Implementation Consultant
5. Solution Architect
6. System Engineer
7. Platform Technology Consultant
8. Integration Consultant
9. Non-APAC Global resources
10. APAC Global Test Team
11. APAC Global PS Roles
12. Domestic Non-APAC Roles

---

## Key Features

### ✅ Admin Can:
- Set & update cost rates (USD per hour)
- Manage exchange rates
- View all projects and analytics
- Export data to Excel
- Create and delete projects

### ✅ End Users Can:
- Create projects with resource allocation
- Add third-party resources
- View calculated financial metrics
- Filter and analyze projects
- Export reports to Excel

### 🚫 End Users CANNOT:
- View or modify cost rates (hidden for security)
- Delete projects (admin only)
- Access admin settings

---

## What Gets Calculated

For every project, the system automatically calculates:

- **Total Costs** (all resources + third-party + non-bill hours)
- **Baseline Margin %** (target: ≥40%)
- **Net Revenue** (Service Value - Non-Third Party Costs)
- **EBITA** (Service Value - Total Costs)
- **PS Ratio** (target: ≥2.0)
- **Status Indicators** (On Track / Below Target)

---

## Supported Currencies

- USD (US Dollar) - Base currency
- AUD (Australian Dollar)
- EUR (Euro)
- GBP (British Pound)
- SGD (Singapore Dollar)
- NZD (New Zealand Dollar)

Exchange rates auto-update from API (admin can manually refresh).

---

## Dashboard Features

- **Statistics** - Total projects, avg margin, avg PS ratio
- **Filters** - By client, date range
- **Color Coding** - Green = on track, Red = below target
- **Excel Export** - Download filtered results

---

## Need Help?

📖 **Detailed Documentation:**
- `MARGIN-ANALYSIS-SETUP.md` - Complete setup guide
- `IMPLEMENTATION-SUMMARY.md` - Technical details
- `README.md` - Full project documentation

🐛 **Troubleshooting:**

**Port already in use?**
- Backend: Edit `backend/.env`, change PORT
- Frontend: Kill process on port 3000

**Database errors?**
```bash
cd backend
npm run init-margin-schema
```

**Can't login?**
```bash
cd backend
npm run create-admin
```

---

## File Locations

📁 **Database:** `backend/database/margin-analysis.db`
📁 **Backend config:** `backend/.env`
📁 **Frontend config:** `frontend/.env`

---

## Quick Commands

```bash
# Setup
setup-dev.bat                    # Windows setup

# Start
start-dev.bat                    # Windows start
npm run dev                      # Backend (Linux/Mac)
npm start                        # Frontend (Linux/Mac)

# Database
npm run init-margin-schema       # Initialize database
npm run create-admin             # Create admin user
```

---

## Support

For issues or questions:
- Check documentation files
- Review error messages in browser console
- Check backend terminal for server errors

---

**System Status:** ✅ READY TO USE
**Version:** 1.0.0

Happy analyzing! 📊
