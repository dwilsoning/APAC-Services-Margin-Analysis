const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/margin-analysis.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.\n');
});

console.log('Adding baseline and final columns to support dual metrics tracking...\n');

// Add columns to project_resources table
db.run(`
  ALTER TABLE project_resources ADD COLUMN baseline_hours REAL DEFAULT 0
`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding baseline_hours to project_resources:', err.message);
  } else {
    console.log('✓ Added baseline_hours column to project_resources');
  }
});

db.run(`
  ALTER TABLE project_resources ADD COLUMN final_hours REAL DEFAULT 0
`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding final_hours to project_resources:', err.message);
  } else {
    console.log('✓ Added final_hours column to project_resources');
  }
});

// Add baseline metric columns to projects table
db.run(`
  ALTER TABLE projects ADD COLUMN baseline_total_costs_usd REAL
`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding baseline_total_costs_usd:', err.message);
  } else {
    console.log('✓ Added baseline_total_costs_usd column to projects');
  }
});

db.run(`
  ALTER TABLE projects ADD COLUMN baseline_margin_baseline_percent REAL
`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding baseline_margin_baseline_percent:', err.message);
  } else {
    console.log('✓ Added baseline_margin_baseline_percent column to projects');
  }
});

db.run(`
  ALTER TABLE projects ADD COLUMN baseline_net_revenue_usd REAL
`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding baseline_net_revenue_usd:', err.message);
  } else {
    console.log('✓ Added baseline_net_revenue_usd column to projects');
  }
});

db.run(`
  ALTER TABLE projects ADD COLUMN baseline_ebita_usd REAL
`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding baseline_ebita_usd:', err.message);
  } else {
    console.log('✓ Added baseline_ebita_usd column to projects');
  }
});

db.run(`
  ALTER TABLE projects ADD COLUMN baseline_ps_ratio REAL
`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding baseline_ps_ratio:', err.message);
  } else {
    console.log('✓ Added baseline_ps_ratio column to projects');
  }
});

// Update existing records to copy hours to final_hours (if hours exist)
setTimeout(() => {
  db.run(`
    UPDATE project_resources
    SET final_hours = hours, baseline_hours = hours
    WHERE final_hours = 0 AND baseline_hours = 0
  `, (err) => {
    if (err) {
      console.error('Error updating existing records:', err.message);
    } else {
      console.log('✓ Updated existing project_resources records');
    }

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('\n✓ Database migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Restart the backend server');
        console.log('2. Create a new project to test baseline and final hours');
      }
    });
  });
}, 1000); // Give time for all ALTER TABLE commands to complete
