const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

async function initDatabase() {
  const db = getPool();
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
