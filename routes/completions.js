const express = require('express');
const { getPool } = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all completions
router.get('/', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const { rows } = await db.query('SELECT * FROM completions ORDER BY completed_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Get completions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get completions for a specific obligation
router.get('/obligation/:obligationId', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const { rows } = await db.query(
      'SELECT * FROM completions WHERE obligation_id = $1 ORDER BY completed_at DESC',
      [req.params.obligationId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get obligation completions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark complete
router.post('/', authenticate, async (req, res) => {
  try {
    const { obligationId, dueDate, completedBy, notes } = req.body;
    if (!obligationId || !dueDate) return res.status(400).json({ error: 'Obligation ID and due date required' });

    const db = getPool();
    const id = 'comp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    await db.query(
      `INSERT INTO completions (id, obligation_id, due_date, completed_by, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, obligationId, dueDate, completedBy || req.user.displayName, notes || '']
    );

    const { rows } = await db.query('SELECT * FROM completions WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create completion error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Uncomplete (remove completion)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const db = getPool();
    await db.query('DELETE FROM completions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete completion error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete by obligation + due date (for toggle behavior)
router.delete('/by-obligation/:obligationId/:dueDate', authenticate, async (req, res) => {
  try {
    const db = getPool();
    await db.query(
      'DELETE FROM completions WHERE obligation_id = $1 AND due_date = $2',
      [req.params.obligationId, req.params.dueDate]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Delete completion by obligation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
