# APAC Services Margin Analysis System - Setup Guide

## Overview

This system provides comprehensive margin analysis for service contracts with:
- **Role-based access control** (Admin and End User)
- **Secure cost rate management** (Admin only)
- **Project data entry** with real-time financial calculations
- **Analytics dashboard** with filtering and export capabilities
- **Currency conversion** for multi-currency support
- **Historical cost rate tracking**

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Windows, Linux, or Mac

### Windows Setup (Fastest)

1. Open Command Prompt in the project directory
2. Run the setup script:
   ```
   setup-dev.bat
   ```
3. Follow prompts to install dependencies and create admin user
4. Start the application:
   ```
   start-dev.bat
   ```
5. Access at http://localhost:3000

### Linux/Mac Setup

1. **Install backend dependencies and initialize database:**
   ```bash
   cd backend
   npm install
   npm run init-margin-schema
   npm run create-admin
   ```

2. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

3. **Start both servers (in separate terminals):**

   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm start
   ```

4. Access the application at http://localhost:3000

## First Time Setup

### 1. Create Admin User

When running `npm run create-admin`, you'll be prompted for:
- Email
- Password
- First Name
- Last Name

**This admin user can:**
- Set and update cost rates
- Manage exchange rates
- Create projects
- View all analytics
- Access all system features

### 2. Configure Cost Rates (Admin Only)

After logging in as admin:

1. Navigate to **Admin: Cost Rates**
2. Set USD rates for each resource type:
   - Project Director
   - Project Manager
   - PMO Assistant
   - Implementation Consultant
   - Solution Architect
   - System Engineer
   - Platform Technology Consultant
   - Integration Consultant
   - Non-APAC Global resources
   - APAC Global Test Team
   - APAC Global PS Roles
   - Domestic Non-APAC Roles

3. Click **Save All Changes** or save individually
4. Optionally refresh exchange rates from API

### 3. Create Your First Project

1. Navigate to **New Project**
2. Select or create a client
3. Fill in project details:
   - Currency (USD, AUD, EUR, GBP, SGD, or NZD)
   - Local Service Value
   - Project Name
   - Contract Number (optional)
   - Oracle ID (optional)
   - Total Baseline Hours
   - Non-Bill Hours (if applicable)

4. Allocate hours to resource types
5. Add third-party resources if needed
6. Click **Create Project**

### 4. View Analytics

1. Navigate to **Analytics Dashboard**
2. Use filters to analyze:
   - Specific clients
   - Date ranges
   - All projects
3. Export data to Excel for further analysis

## Key Features

### Financial Calculations

The system automatically calculates:

**Total Costs:**
- Predefined resource costs (hours × cost rates)
- Third-party resource costs
- Non-bill hours costs

**Baseline Margin:**
- Formula: ((Service Value USD - Total Costs) / Service Value USD) × 100
- Target: ≥ 40%

**Net Revenue:**
- Formula: Service Value USD - Non-Third Party Costs
- Used for PS Ratio calculation

**EBITA:**
- Formula: Service Value USD - Total Costs
- Shows profitability

**Professional Services Ratio:**
- Formula: Net Revenue / OPEX
- Target: ≥ 2.0

**Status Indicators:**
- 🟢 **On Track**: Meets targets (Margin ≥ 40%, PS Ratio ≥ 2.0)
- 🔴 **Below Target**: Does not meet targets

### Security Features

**Cost Rate Protection:**
- Cost rates are never exposed to end users
- Only admins can view and modify rates
- API endpoints enforce role-based access

**Data Validation:**
- Input validation on all forms
- Hours mismatch warnings
- Currency conversion error handling

**Audit Logging:**
- All cost rate changes tracked
- User actions logged with IP addresses
- Historical rate tracking maintained

### Currency Conversion

**Supported Currencies:**
- USD (base currency)
- AUD (Australian Dollar)
- EUR (Euro)
- GBP (British Pound)
- SGD (Singapore Dollar)
- NZD (New Zealand Dollar)

**Exchange Rate Updates:**
- Automatically fetches from external API
- Admin can manually refresh
- Cached for performance
- Fallback to database rates if API fails

## Database Schema

### Core Tables

**users** - User accounts with role-based access
**clients** - Client/customer records
**admin_cost_rates** - Current cost rates (admin only)
**cost_rate_history** - Historical rate changes
**exchange_rates** - Currency conversion rates
**projects** - Project data and calculated metrics
**project_resources** - Resource allocation by project
**third_party_resources** - External resource costs
**audit_log** - System audit trail

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register user (admin only)
- `GET /api/auth/me` - Get current user

### Admin Cost Rates (Admin Only)
- `GET /api/admin/rates` - Get all cost rates
- `PUT /api/admin/rates/:id` - Update cost rate
- `PATCH /api/admin/rates/bulk` - Bulk update rates
- `GET /api/admin/rates/:id/history` - Get rate history
- `GET /api/admin/exchange-rates` - Get exchange rates
- `POST /api/admin/exchange-rates/refresh` - Refresh from API

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Projects
- `GET /api/projects` - Get all projects (with filters)
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `DELETE /api/projects/:id` - Delete project (admin only)
- `GET /api/projects/dashboard/stats` - Get analytics stats
- `GET /api/projects/export/excel` - Export to Excel

## Troubleshooting

### Database Errors

If you encounter database errors:
```bash
cd backend
npm run init-margin-schema
```

### Port Already in Use

**Backend (port 5000):**
Edit `backend/.env` and change `PORT=5000` to another port

**Frontend (port 3000):**
Kill the process or edit `frontend/package.json`

### Cost Rates Not Loading

1. Ensure you're logged in as admin
2. Check backend console for errors
3. Verify database was initialized:
   ```bash
   cd backend
   npm run init-margin-schema
   ```

### Exchange Rates Not Updating

1. Click "Refresh from API" in Admin Cost Rates
2. Check internet connection
3. Database will fallback to stored rates if API fails

### Hours Mismatch Warning

The system warns when:
- Total Baseline Hours ≠ (Sum of Resource Hours + Non-Bill Hours)

**This is a warning, not an error** - the project will still be created.
Adjust hours to match for accurate tracking.

## Best Practices

### For Administrators

1. **Set Cost Rates Before Creating Projects**
   - All resource types should have rates > 0
   - Update rates when they change
   - Historical rates are preserved automatically

2. **Refresh Exchange Rates Regularly**
   - Recommended: Daily or before major project entries
   - Ensures accurate currency conversion

3. **Review Audit Logs**
   - Track who changed what and when
   - Identify patterns in rate changes

### For End Users

1. **Create Clients First**
   - Add clients before creating projects
   - Use consistent naming

2. **Verify Hours Allocation**
   - Ensure Total Baseline Hours matches sum
   - Include Non-Bill Hours when applicable

3. **Use Filters in Analytics**
   - Filter by client for client-specific reports
   - Use date ranges for quarterly/annual analysis

4. **Export Data Regularly**
   - Excel exports include all visible data
   - Use for presentations and further analysis

## Support & Maintenance

### Backup Database

The database file is located at:
```
backend/database/margin-analysis.db
```

Copy this file regularly to create backups.

### Update Application

```bash
git pull origin main
cd backend && npm install
cd ../frontend && npm install
```

### View Logs

**Backend logs:**
Displayed in the terminal running the backend server

**Database location:**
`backend/database/margin-analysis.db`

## Production Deployment

For production deployment to AWS EC2, see:
- `deployment/setup-ec2.sh` - EC2 setup script
- `deployment/deploy-app.sh` - Deployment script
- `README.md` - Full deployment guide

## Technical Stack

**Backend:**
- Node.js & Express
- SQLite3 database
- JWT authentication
- Bcrypt password hashing
- Axios for API calls
- ExcelJS for exports

**Frontend:**
- React 18
- React Router v6
- Axios for API calls
- Context API for state management

## License

ISC

## Support

For issues or questions, create an issue in the repository or contact your system administrator.
