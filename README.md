# APAC Services Margin Analysis System

A comprehensive margin analysis system with role-based authentication (System Administrator and End User access levels), built with React, Node.js, Express, and SQLite3, designed for deployment on AWS EC2.

## Features

- **Role-Based Access Control**
  - System Administrator: Full access to all features, user management, and system settings
  - End User: Access to view and manage assigned projects and data

- **Authentication & Security**
  - JWT-based authentication
  - Bcrypt password hashing
  - Rate limiting
  - Security headers with Helmet

- **Database**
  - SQLite3 for lightweight, serverless database
  - Schema includes: Users, Customers, Projects, Services, and Audit Logs
  - Ready for margin analysis and reporting

- **Deployment Ready**
  - EC2 deployment scripts included
  - PM2 for process management
  - Nginx configuration for production

## Tech Stack

### Backend
- Node.js
- Express.js
- SQLite3
- JWT (jsonwebtoken)
- Bcrypt
- Joi (validation)
- Helmet (security)

### Frontend
- React 18
- React Router v6
- Axios
- Context API for state management

## Quick Start (Development)

### Prerequisites
- Node.js 18+ and npm
- Git

### Windows Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd APAC-Services-Margin-Analysis
   ```

2. **Run setup script**
   ```bash
   setup-dev.bat
   ```
   This will:
   - Install all dependencies
   - Create .env files
   - Initialize the database
   - Prompt you to create an admin user

3. **Start development environment**
   ```bash
   start-dev.bat
   ```

   The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Linux/Mac Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd APAC-Services-Margin-Analysis
   ```

2. **Setup backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npm run init-db
   npm run create-admin
   ```

3. **Setup frontend**
   ```bash
   cd ../frontend
   cp .env.example .env
   npm install
   ```

4. **Start development servers**

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

## EC2 Deployment

### Prerequisites
- Ubuntu EC2 instance (t2.micro or larger)
- SSH access to your EC2 instance
- Domain name (optional, for SSL)

### Deployment Steps

1. **SSH into your EC2 instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd APAC-Services-Margin-Analysis
   ```

3. **Run EC2 setup script**
   ```bash
   chmod +x deployment/setup-ec2.sh
   ./deployment/setup-ec2.sh
   ```
   This installs Node.js, PM2, Nginx, and configures the firewall.

4. **Deploy the application**
   ```bash
   chmod +x deployment/deploy-app.sh
   ./deployment/deploy-app.sh
   ```
   This will:
   - Install dependencies
   - Initialize the database
   - Create admin user
   - Build frontend
   - Configure PM2 and Nginx
   - Start the application

5. **Access your application**
   - Navigate to: `http://YOUR_EC2_PUBLIC_IP`

### Updating the Application

```bash
cd APAC-Services-Margin-Analysis
chmod +x deployment/update-app.sh
./deployment/update-app.sh
```

## Project Structure

```
APAC-Services-Margin-Analysis/
├── backend/
│   ├── database/              # SQLite database file
│   ├── middleware/            # Authentication middleware
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── scripts/               # Database initialization scripts
│   ├── server.js              # Express server
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts (Auth)
│   │   └── services/          # API services
│   ├── package.json
│   └── .env.example
│
├── deployment/
│   ├── setup-ec2.sh          # EC2 initial setup
│   ├── deploy-app.sh         # Application deployment
│   └── update-app.sh         # Update script
│
├── setup-dev.bat             # Windows development setup
├── start-dev.bat             # Windows development start
└── README.md
```

## Database Schema

### Users
- id, email, password, first_name, last_name, role (admin/user), active, timestamps

### Customers
- id, customer_name, customer_code, region, active, timestamps

### Projects
- id, customer_id, project_name, project_code, dates, status, timestamps

### Services
- id, project_id, service_description, type, quantity, prices, margin, timestamps

### Audit Log
- id, user_id, action, table_name, record_id, values, ip_address, timestamp

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users (admin only)
- `PATCH /api/auth/users/:id/status` - Update user status (admin only)

### Health
- `GET /health` - Server health check
- `GET /` - API information

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DATABASE_PATH=./database/margin-analysis.db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## User Roles

### System Administrator
- Create and manage users
- Access all projects and customers
- View audit logs
- Manage system settings
- Full CRUD operations on all data

### End User
- View assigned projects
- Manage project data
- Generate reports
- Limited to assigned permissions

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- Helmet security headers
- CORS configuration
- Input validation with Joi
- SQL injection protection
- XSS protection

## PM2 Commands (Production)

```bash
# View application status
pm2 status

# View logs
pm2 logs margin-analysis-backend

# Restart application
pm2 restart margin-analysis-backend

# Stop application
pm2 stop margin-analysis-backend

# Monitor
pm2 monit
```

## Troubleshooting

### Database Issues
```bash
cd backend
npm run init-db
```

### Permission Issues (Linux)
```bash
chmod +x deployment/*.sh
```

### Port Already in Use
- Backend: Change PORT in backend/.env
- Frontend: Change port in frontend/package.json

### Can't Access EC2 Instance
- Check Security Group allows HTTP (port 80)
- Check Nginx status: `sudo systemctl status nginx`
- Check PM2 status: `pm2 status`

## Future Enhancements

- Project and customer management interfaces
- Margin analysis dashboards
- Reporting and analytics
- Data import/export features
- Email notifications
- SSL/HTTPS setup
- Database backup automation
- Multi-tenant support

## License

ISC

## Support

For issues or questions, please create an issue in the repository.
