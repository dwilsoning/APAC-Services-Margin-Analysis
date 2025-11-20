const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const dbPath = path.resolve(__dirname, '../database/margin-analysis.db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  console.log('\n=== Create Admin User ===\n');

  const email = await question('Admin email: ');
  const password = await question('Admin password: ');
  const firstName = await question('First name: ');
  const lastName = await question('Last name: ');

  if (!email || !password || !firstName || !lastName) {
    console.error('\n❌ All fields are required');
    rl.close();
    process.exit(1);
  }

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to database:', err.message);
      rl.close();
      process.exit(1);
    }
  });

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin user
    db.run(
      `INSERT INTO users (email, password, first_name, last_name, role, active)
       VALUES (?, ?, ?, ?, 'admin', 1)`,
      [email, hashedPassword, firstName, lastName],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            console.error('\n❌ User with this email already exists');
          } else {
            console.error('\n❌ Error creating admin user:', err.message);
          }
          rl.close();
          db.close();
          process.exit(1);
        } else {
          console.log('\n✓ Admin user created successfully!');
          console.log(`  Email: ${email}`);
          console.log(`  Name: ${firstName} ${lastName}`);
          console.log(`  Role: admin\n`);
          rl.close();
          db.close();
        }
      }
    );
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    db.close();
    process.exit(1);
  }
}

createAdmin();
