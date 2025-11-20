# Quick Start Guide

## For Windows Users

### First Time Setup

1. Open Command Prompt or PowerShell in the project directory
2. Run the setup script:
   ```
   setup-dev.bat
   ```
3. Follow the prompts to:
   - Install dependencies
   - Create environment files
   - Initialize database
   - Create admin user

### Starting the Application

Run:
```
start-dev.bat
```

This opens two command windows:
- Backend server (http://localhost:5000)
- Frontend development server (http://localhost:3000)

### Accessing the Application

1. Open browser to http://localhost:3000
2. Login with your admin credentials
3. Start exploring!

## For Linux/Mac Users

### First Time Setup

```bash
# Backend setup
cd backend
cp .env.example .env
nano .env  # Edit configuration
npm install
npm run init-db
npm run create-admin

# Frontend setup
cd ../frontend
cp .env.example .env
npm install
```

### Starting the Application

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

### Accessing the Application

1. Open browser to http://localhost:3000
2. Login with your admin credentials
3. Start exploring!

## Default Credentials

You set these during setup when running `create-admin`:
- Email: (what you entered)
- Password: (what you entered)

## What You Can Do

### As Admin
- Create new users
- Manage all data
- View system information
- Full access to all features

### As User
- View assigned data
- Manage projects
- Generate reports

## Next Steps

1. Explore the dashboard
2. Create additional users (Admin → Users)
3. Add customers and projects
4. Start analyzing margins!

## Need Help?

- Check README.md for detailed documentation
- Review deployment/ folder for EC2 deployment guides
- Check logs if something isn't working

## Common Issues

**Port already in use?**
- Backend: Edit `backend/.env` and change PORT
- Frontend: Kill the process using port 3000

**Database errors?**
- Run: `cd backend && npm run init-db`

**Can't login?**
- Re-create admin: `cd backend && npm run create-admin`
