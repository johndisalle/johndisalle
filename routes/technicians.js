const express = require('express');
const { getPool } = require('../db/init');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all technicians
router.get('/', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const { rows } = await db.query('SELECT * FROM technicians ORDER BY name');
    res.json(rows.map(r => r.name));
  } catch (err) {
    console.error('Get technicians error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add technician (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Technician name required' });

    const db = getPool();
    const id = 'tech_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    await db.query('INSERT INTO technicians (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING', [id, name]);
    res.status(201).json({ name });
  } catch (err) {
    console.error('Add technician error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete technician (admin only)
router.delete('/:name', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getPool();
    await db.query('DELETE FROM technicians WHERE name = $1', [req.params.name]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete technician error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
