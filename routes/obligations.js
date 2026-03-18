const express = require('express');
const { getPool } = require('../db/init');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all obligations (filtered by visible clients for technicians)
router.get('/', authenticate, async (req, res) => {
  try {
    const db = getPool();
    let rows;

    if (req.user.role === 'technician' && req.user.technicianName) {
      const result = await db.query(
        `SELECT o.* FROM obligations o
         JOIN clients c ON o.client_id = c.id
         WHERE c.primary_tech = $1 OR c.secondary_tech = $1
         ORDER BY o.created_at`,
        [req.user.technicianName]
      );
      rows = result.rows;
    } else {
      const result = await db.query('SELECT * FROM obligations ORDER BY created_at');
      rows = result.rows;
    }

    res.json(rows);
  } catch (err) {
    console.error('Get obligations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get obligations for a specific client
router.get('/client/:clientId', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const { rows } = await db.query(
      'SELECT * FROM obligations WHERE client_id = $1 ORDER BY created_at',
      [req.params.clientId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get client obligations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create obligation (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { clientId, title, description, obligationType, recurrence, specificDate, dayOfWeek, dayOfMonth, monthOfYear } = req.body;
    if (!clientId || !title) return res.status(400).json({ error: 'Client and title required' });

    const db = getPool();
    const id = 'obl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    await db.query(
      `INSERT INTO obligations (id, client_id, title, description, obligation_type, recurrence, specific_date, day_of_week, day_of_month, month_of_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, clientId, title, description || '', obligationType || 'custom', recurrence || 'monthly',
       specificDate || null, dayOfWeek != null ? dayOfWeek : null, dayOfMonth != null ? dayOfMonth : null, monthOfYear != null ? monthOfYear : null]
    );

    const { rows } = await db.query('SELECT * FROM obligations WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create obligation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update obligation (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { clientId, title, description, obligationType, recurrence, specificDate, dayOfWeek, dayOfMonth, monthOfYear } = req.body;
    const db = getPool();

    await db.query(
      `UPDATE obligations SET
         client_id = COALESCE($1, client_id), title = COALESCE($2, title),
         description = COALESCE($3, description), obligation_type = COALESCE($4, obligation_type),
         recurrence = COALESCE($5, recurrence), specific_date = $6,
         day_of_week = $7, day_of_month = $8, month_of_year = $9
       WHERE id = $10`,
      [clientId, title, description, obligationType, recurrence,
       specificDate || null, dayOfWeek != null ? dayOfWeek : null, dayOfMonth != null ? dayOfMonth : null, monthOfYear != null ? monthOfYear : null,
       req.params.id]
    );

    const { rows } = await db.query('SELECT * FROM obligations WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Obligation not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update obligation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete obligation (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getPool();
    await db.query('DELETE FROM obligations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete obligation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
