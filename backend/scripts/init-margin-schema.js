const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, '../database/margin-analysis.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Create tables for margin analysis system
db.serialize(() => {
  // Users table with role-based access
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('✓ Users table created');
    }
  });

  // Clients table (renamed from customers for clarity)
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating clients table:', err.message);
    } else {
      console.log('✓ Clients table created');
    }
  });

  // Admin cost rates table - stores cost rates for predefined resource types
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_cost_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_type TEXT NOT NULL UNIQUE,
      cost_rate_usd REAL NOT NULL,
      effective_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating admin_cost_rates table:', err.message);
    } else {
      console.log('✓ Admin cost rates table created');
    }
  });

  // Cost rate history table - maintains historical rates
  db.run(`
    CREATE TABLE IF NOT EXISTS cost_rate_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_type TEXT NOT NULL,
      cost_rate_usd REAL NOT NULL,
      effective_date DATE NOT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating cost_rate_history table:', err.message);
    } else {
      console.log('✓ Cost rate history table created');
    }
  });

  // Exchange rates table - admin configurable currency rates
  db.run(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency_code TEXT NOT NULL UNIQUE,
      rate_to_usd REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating exchange_rates table:', err.message);
    } else {
      console.log('✓ Exchange rates table created');
    }
  });

  // Projects table - stores all project data and calculations
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      currency_used TEXT NOT NULL,
      contract_number TEXT,
      oracle_id TEXT,
      project_name TEXT NOT NULL,
      local_service_value REAL NOT NULL,
      baseline_hours REAL,
      total_baseline_hours REAL NOT NULL,
      non_bill_hours REAL DEFAULT 0,

      -- Calculated fields
      total_costs_usd REAL,
      baseline_margin_percent REAL,
      net_revenue_usd REAL,
      ebita_usd REAL,
      ps_ratio REAL,
      margin_status TEXT,
      ps_ratio_status TEXT,

      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating projects table:', err.message);
    } else {
      console.log('✓ Projects table created');
    }
  });

  // Project resources table - stores hours allocation for predefined resource types
  db.run(`
    CREATE TABLE IF NOT EXISTS project_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      resource_type TEXT NOT NULL,
      hours REAL NOT NULL,
      cost_rate_usd REAL NOT NULL,
      total_cost_usd REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating project_resources table:', err.message);
    } else {
      console.log('✓ Project resources table created');
    }
  });

  // Third party resources table - stores dynamic third-party resource costs
  db.run(`
    CREATE TABLE IF NOT EXISTS third_party_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      resource_name TEXT NOT NULL,
      cost_usd REAL NOT NULL,
      hours REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating third_party_resources table:', err.message);
    } else {
      console.log('✓ Third party resources table created');
    }
  });

  // Audit log table
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      table_name TEXT,
      record_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating audit_log table:', err.message);
    } else {
      console.log('✓ Audit log table created');
    }
  });

  // Insert default predefined resource types with placeholder rates
  const resourceTypes = [
    'Project Director',
    'Project Manager',
    'PMO Assistant',
    'Implementation Consultant',
    'Solution Architect',
    'System Engineer',
    'Platform Technology Consultant',
    'Integration Consultant',
    'Non-APAC Global resources',
    'APAC Global Test Team',
    'APAC Global PS Roles',
    'Domestic Non-APAC Roles'
  ];

  const insertRate = db.prepare(`
    INSERT OR IGNORE INTO admin_cost_rates (resource_type, cost_rate_usd)
    VALUES (?, 0)
  `);

  resourceTypes.forEach(type => {
    insertRate.run(type);
  });
  insertRate.finalize();
  console.log('✓ Default resource types inserted');

  // Insert default exchange rates
  const defaultRates = [
    ['USD', 1.00],
    ['AUD', 0.65],
    ['EUR', 1.08],
    ['GBP', 1.27],
    ['SGD', 0.74],
    ['NZD', 0.61]
  ];

  const insertExchangeRate = db.prepare(`
    INSERT OR IGNORE INTO exchange_rates (currency_code, rate_to_usd)
    VALUES (?, ?)
  `);

  defaultRates.forEach(([currency, rate]) => {
    insertExchangeRate.run(currency, rate);
  });
  insertExchangeRate.finalize();
  console.log('✓ Default exchange rates inserted');

  console.log('\n✓ Database schema initialization complete!');
  console.log('Next step: Run "npm run create-admin" to create an admin user\n');
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  }
});
