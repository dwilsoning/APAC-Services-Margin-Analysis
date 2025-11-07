# APAC Services Margin Analysis

A comprehensive web-based financial analysis platform for importing, analyzing, and visualizing client and project financial data through interactive dashboards.

## Overview

This application enables financial teams to:
- Import financial data from Excel/CSV spreadsheets
- Track client and project revenue, costs, and margins
- Visualize financial performance through interactive dashboards
- Perform margin analysis and trend analysis
- Make data-driven financial decisions

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (secure, persistent data storage)
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: XLSX for spreadsheet parsing
- **Security**: bcrypt for password hashing

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Material-UI (MUI)
- **Charts**: Recharts for data visualization
- **Routing**: React Router
- **HTTP Client**: Axios

## Project Structure

```
APAC-Services-Margin-Analysis/
├── backend/
│   ├── server.js           # Main server entry point
│   ├── db/
│   │   └── schema.sql      # Database schema
│   ├── .env.example        # Environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## Features

### Current Features
- RESTful API backend with Express
- PostgreSQL database with comprehensive schema
- React frontend with TypeScript
- Material-UI component library for professional dashboards

### Planned Features
- User authentication and authorization
- Excel/CSV file upload and parsing
- Client and project management
- Financial data import and storage
- Interactive dashboards with:
  - Revenue and cost trends
  - Margin analysis (gross and net)
  - Regional performance comparison
  - Project profitability rankings
- Data filtering and search capabilities
- Export functionality for reports

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL (v12 or higher)
- npm or yarn

### Database Setup

1. Create a PostgreSQL database:
```bash
createdb apac_margin_analysis
```

2. Run the schema setup:
```bash
psql -d apac_margin_analysis -f backend/db/schema.sql
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials and configuration

5. Start the server:
```bash
npm start
```

The API will be available at `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Database Schema

The database includes the following main tables:
- **users**: User authentication and authorization
- **clients**: Client information (name, region, industry)
- **projects**: Project details linked to clients
- **financial_data**: Monthly financial metrics per project
- **upload_history**: Track spreadsheet imports

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Coming Soon
- User authentication endpoints
- Client CRUD operations
- Project management endpoints
- Financial data upload and retrieval
- Dashboard data aggregation endpoints

## Deployment to AWS EC2

This application is designed to be deployed on AWS EC2 instances.

### Deployment Checklist
- [ ] Set up EC2 instance with Ubuntu/Amazon Linux
- [ ] Install Node.js and PostgreSQL on EC2
- [ ] Configure security groups (ports 80, 443, 5432)
- [ ] Set up environment variables
- [ ] Configure PM2 or similar for process management
- [ ] Set up Nginx as reverse proxy
- [ ] Configure SSL/TLS certificates
- [ ] Set up automated backups for PostgreSQL
- [ ] Implement logging and monitoring

## Security Considerations

- Environment variables for sensitive data
- JWT-based authentication
- bcrypt password hashing
- CORS configuration for API access
- SQL injection prevention via parameterized queries
- Input validation and sanitization
- HTTPS/SSL in production

## Development Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Project setup
- [x] Database schema design
- [x] Basic API structure
- [x] Frontend scaffolding

### Phase 2: Authentication & User Management
- [ ] User registration and login
- [ ] JWT authentication
- [ ] Role-based access control

### Phase 3: Data Import
- [ ] File upload endpoint
- [ ] Excel/CSV parsing
- [ ] Data validation and import
- [ ] Error handling and reporting

### Phase 4: Dashboard & Visualization
- [ ] Main dashboard layout
- [ ] Revenue and margin charts
- [ ] Regional performance views
- [ ] Project comparison tools

### Phase 5: Advanced Features
- [ ] Data export functionality
- [ ] Advanced filtering
- [ ] Custom date range selection
- [ ] Performance optimization

### Phase 6: Deployment
- [ ] AWS EC2 setup
- [ ] Production database configuration
- [ ] SSL/HTTPS setup
- [ ] Monitoring and logging

## Contributing

This is a private project. For questions or suggestions, please contact the development team.

## License

Proprietary - All rights reserved
