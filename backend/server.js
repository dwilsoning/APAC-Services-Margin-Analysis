const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Make pool available to routes
app.locals.pool = pool;

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// Import routes
const clientsRouter = require('./routes/clients');
const projectsRouter = require('./routes/projects');
const financialDataRouter = require('./routes/financialData');
const staffRolesRouter = require('./routes/staffRoles');
const thirdPartyResourcesRouter = require('./routes/thirdPartyResources');
const projectResourcesRouter = require('./routes/projectResources');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'APAC Services Margin Analysis API is running' });
});

// API routes
app.use('/api/clients', clientsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/financial-data', financialDataRouter);
app.use('/api/staff-roles', staffRolesRouter);
app.use('/api/third-party-resources', thirdPartyResourcesRouter);
app.use('/api/project-resources', projectResourcesRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, pool };
