const express = require('express');
const { getPool } = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all snoozes
router.get('/', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const { rows } = await db.query('SELECT * FROM snoozes ORDER BY snoozed_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Get snoozes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create/replace snooze
router.post('/', authenticate, async (req, res) => {
  try {
    const { obligationId, dueDate, snoozeTo, reason } = req.body;
    if (!obligationId || !dueDate || !snoozeTo) {
      return res.status(400).json({ error: 'Obligation ID, due date, and snooze-to date required' });
    }

    const db = getPool();

    // Remove existing snooze for this obligation+date
    await db.query(
      'DELETE FROM snoozes WHERE obligation_id = $1 AND due_date = $2',
      [obligationId, dueDate]
    );

    const id = 'snz_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    await db.query(
      `INSERT INTO snoozes (id, obligation_id, due_date, snooze_to, reason, snoozed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, obligationId, dueDate, snoozeTo, reason || '', req.user.displayName]
    );

    const { rows } = await db.query('SELECT * FROM snoozes WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create snooze error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove snooze (unsnooze)
router.delete('/:obligationId/:dueDate', authenticate, async (req, res) => {
  try {
    const db = getPool();
    await db.query(
      'DELETE FROM snoozes WHERE obligation_id = $1 AND due_date = $2',
      [req.params.obligationId, req.params.dueDate]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Delete snooze error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
