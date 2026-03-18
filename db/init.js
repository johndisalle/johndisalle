const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let pool;

function getPool() {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    // Enable SSL if DATABASE_URL points to a remote host (Railway, etc.)
    const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    pool = new Pool({
      connectionString: dbUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
}

async function waitForDatabase(db, retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await db.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`Database connection attempt ${i + 1}/${retries} failed: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function initDatabase() {
  const db = getPool();
  console.log('Waiting for database connection...');
  await waitForDatabase(db);
  console.log('Database connected');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(schema);

  // Create default admin if no users exist
  const { rows } = await db.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(rows[0].count) === 0) {
    const hash = await bcrypt.hash('admin', 10);
    const id = 'user_' + Date.now();
    await db.query(
      `INSERT INTO users (id, username, password_hash, display_name, role, technician_name, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [id, 'admin', hash, 'Administrator', 'admin', '']
    );
    console.log('Default admin account created (admin/admin)');
  }

  console.log('Database initialized');
}

module.exports = { getPool, initDatabase };
