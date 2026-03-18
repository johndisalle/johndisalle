const express = require('express');
const { getPool } = require('../db/init');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all clients (filtered by technician role)
router.get('/', authenticate, async (req, res) => {
  try {
    const db = getPool();
    let rows;

    if (req.user.role === 'technician' && req.user.technicianName) {
      const result = await db.query(
        'SELECT * FROM clients WHERE primary_tech = $1 OR secondary_tech = $1 ORDER BY name',
        [req.user.technicianName]
      );
      rows = result.rows;
    } else {
      const result = await db.query('SELECT * FROM clients ORDER BY name');
      rows = result.rows;
    }

    res.json(rows);
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single client
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Get client error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create client (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, contractDetails, contactEmail, contactPhone, region, primaryTech, secondaryTech } = req.body;
    if (!name) return res.status(400).json({ error: 'Client name required' });

    const db = getPool();
    const id = 'client_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    await db.query(
      `INSERT INTO clients (id, name, contract_details, contact_email, contact_phone, region, primary_tech, secondary_tech)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, name, contractDetails || '', contactEmail || '', contactPhone || '', region || '', primaryTech || '', secondaryTech || '']
    );

    const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create client error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update client (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, contractDetails, contactEmail, contactPhone, region, primaryTech, secondaryTech } = req.body;
    const db = getPool();

    await db.query(
      `UPDATE clients SET name = COALESCE($1, name), contract_details = COALESCE($2, contract_details),
       contact_email = COALESCE($3, contact_email), contact_phone = COALESCE($4, contact_phone),
       region = COALESCE($5, region), primary_tech = COALESCE($6, primary_tech),
       secondary_tech = COALESCE($7, secondary_tech) WHERE id = $8`,
      [name, contractDetails, contactEmail, contactPhone, region, primaryTech, secondaryTech, req.params.id]
    );

    const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update client error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete client (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getPool();
    await db.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
