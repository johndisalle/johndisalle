const express = require('express');
const { getPool } = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get activity log (optionally filter by client)
router.get('/log', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const clientId = req.query.clientId;

    let rows;
    if (clientId) {
      const result = await db.query(
        'SELECT * FROM activity_log WHERE client_id = $1 ORDER BY timestamp DESC LIMIT 100',
        [clientId]
      );
      rows = result.rows;
    } else {
      const result = await db.query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100');
      rows = result.rows;
    }

    res.json(rows);
  } catch (err) {
    console.error('Get activity log error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add activity log entry
router.post('/log', authenticate, async (req, res) => {
  try {
    const { clientId, note, type } = req.body;
    if (!clientId || !note) return res.status(400).json({ error: 'Client ID and note required' });

    const db = getPool();
    const id = 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    await db.query(
      'INSERT INTO activity_log (id, client_id, note, type) VALUES ($1, $2, $3, $4)',
      [id, clientId, note, type || 'note']
    );

    const { rows } = await db.query('SELECT * FROM activity_log WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add activity error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team feed
router.get('/feed', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const { rows } = await db.query('SELECT * FROM team_feed ORDER BY timestamp DESC LIMIT 50');
    res.json(rows);
  } catch (err) {
    console.error('Get team feed error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add team feed entry
router.post('/feed', authenticate, async (req, res) => {
  try {
    const { tech, action, obligationTitle, clientName, obligationType } = req.body;
    if (!tech || !action) return res.status(400).json({ error: 'Tech and action required' });

    const db = getPool();
    const id = 'feed_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    await db.query(
      `INSERT INTO team_feed (id, tech, action, obligation_title, client_name, obligation_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, tech, action, obligationTitle || '', clientName || '', obligationType || '']
    );

    const { rows } = await db.query('SELECT * FROM team_feed WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add feed entry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk data endpoint - get everything in one call (for initial load)
router.get('/all', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const istech = req.user.role === 'technician' && req.user.technicianName;

    let clients, obligations;
    if (istech) {
      clients = (await db.query(
        'SELECT * FROM clients WHERE primary_tech = $1 OR secondary_tech = $1 ORDER BY name',
        [req.user.technicianName]
      )).rows;
      const clientIds = clients.map(c => c.id);
      if (clientIds.length > 0) {
        obligations = (await db.query(
          `SELECT * FROM obligations WHERE client_id = ANY($1) ORDER BY created_at`,
          [clientIds]
        )).rows;
      } else {
        obligations = [];
      }
    } else {
      clients = (await db.query('SELECT * FROM clients ORDER BY name')).rows;
      obligations = (await db.query('SELECT * FROM obligations ORDER BY created_at')).rows;
    }

    const [completions, technicians, activityLog, teamFeed, snoozes] = await Promise.all([
      db.query('SELECT * FROM completions ORDER BY completed_at DESC'),
      db.query('SELECT name FROM technicians ORDER BY name'),
      db.query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 200'),
      db.query('SELECT * FROM team_feed ORDER BY timestamp DESC LIMIT 50'),
      db.query('SELECT * FROM snoozes ORDER BY snoozed_at DESC')
    ]);

    res.json({
      clients,
      obligations,
      completions: completions.rows,
      technicians: technicians.rows.map(r => r.name),
      activityLog: activityLog.rows,
      teamFeed: teamFeed.rows,
      snoozes: snoozes.rows
    });
  } catch (err) {
    console.error('Get all data error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Load sample data (admin only)
router.post('/sample-data', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const db = getPool();
    const bcrypt = require('bcryptjs');

    // Clear existing data
    await db.query('DELETE FROM team_feed');
    await db.query('DELETE FROM activity_log');
    await db.query('DELETE FROM snoozes');
    await db.query('DELETE FROM completions');
    await db.query('DELETE FROM obligations');
    await db.query('DELETE FROM clients');
    await db.query('DELETE FROM technicians');

    // Technicians
    const techs = ['John D.', 'Sarah M.', 'Mike R.'];
    for (const name of techs) {
      await db.query('INSERT INTO technicians (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        ['tech_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), name]);
    }

    // Clients
    const clientData = [
      { id: 'sample_c1', name: 'Acme Corp', contractDetails: 'Premium SLA - 4hr response', contactEmail: 'it@acmecorp.com', contactPhone: '555-0101', region: 'Northeast', primaryTech: 'John D.', secondaryTech: 'Sarah M.' },
      { id: 'sample_c2', name: 'Baker Law Firm', contractDetails: 'Standard SLA - 8hr response, HIPAA compliant', contactEmail: 'admin@bakerlaw.com', contactPhone: '555-0102', region: 'Southeast', primaryTech: 'Sarah M.', secondaryTech: 'Mike R.' },
      { id: 'sample_c3', name: 'City Medical Center', contractDetails: 'Premium SLA - 2hr response, HIPAA required', contactEmail: 'it@citymed.org', contactPhone: '555-0103', region: 'Northeast', primaryTech: 'Mike R.', secondaryTech: 'John D.' },
      { id: 'sample_c4', name: 'Delta Manufacturing', contractDetails: 'Basic SLA - next business day', contactEmail: 'ops@deltamfg.com', contactPhone: '555-0104', region: 'Midwest', primaryTech: 'John D.', secondaryTech: 'Mike R.' }
    ];

    for (const c of clientData) {
      await db.query(
        `INSERT INTO clients (id, name, contract_details, contact_email, contact_phone, region, primary_tech, secondary_tech)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [c.id, c.name, c.contractDetails, c.contactEmail, c.contactPhone, c.region, c.primaryTech, c.secondaryTech]
      );
    }

    // Obligations
    const oblData = [
      { id: 'sample_o1', clientId: 'sample_c1', title: 'Monthly Onsite Visit', type: 'onsite_visit', recurrence: 'monthly', dayOfMonth: 15 },
      { id: 'sample_o2', clientId: 'sample_c1', title: 'Weekly Backup Check', type: 'backup_verification', recurrence: 'weekly', dayOfWeek: 1 },
      { id: 'sample_o3', clientId: 'sample_c2', title: 'Quarterly Security Audit', type: 'security_review', recurrence: 'quarterly', dayOfMonth: 1 },
      { id: 'sample_o4', clientId: 'sample_c2', title: 'Monthly Patch Tuesday', type: 'patch_management', recurrence: 'monthly', dayOfMonth: 14 },
      { id: 'sample_o5', clientId: 'sample_c3', title: 'HIPAA Compliance Review', type: 'hipaa_compliance', recurrence: 'quarterly', dayOfMonth: 1 },
      { id: 'sample_o6', clientId: 'sample_c3', title: 'Biweekly Onsite', type: 'onsite_visit', recurrence: 'biweekly', dayOfWeek: 3 },
      { id: 'sample_o7', clientId: 'sample_c4', title: 'Monthly Vulnerability Scan', type: 'vulnerability_scan', recurrence: 'monthly', dayOfMonth: 20 },
      { id: 'sample_o8', clientId: 'sample_c4', title: 'Annual Cert Renewal', type: 'cert_renewal', recurrence: 'annually', dayOfMonth: 15, monthOfYear: 6 },
      { id: 'sample_o9', clientId: 'sample_c1', title: 'Quarterly Security Review', type: 'security_review', recurrence: 'quarterly', dayOfMonth: 1 },
      { id: 'sample_o10', clientId: 'sample_c3', title: 'Weekly Backup Verification', type: 'backup_verification', recurrence: 'weekly', dayOfWeek: 5 }
    ];

    for (const o of oblData) {
      await db.query(
        `INSERT INTO obligations (id, client_id, title, obligation_type, recurrence, day_of_week, day_of_month, month_of_year)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [o.id, o.clientId, o.title, o.type, o.recurrence, o.dayOfWeek || null, o.dayOfMonth || null, o.monthOfYear || null]
      );
    }

    // Some sample completions (recent dates)
    const today = new Date();
    const recentDates = [];
    for (let i = 1; i <= 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 3);
      recentDates.push(d.toISOString().split('T')[0]);
    }

    const compData = [
      { obligationId: 'sample_o2', dueDate: recentDates[0], completedBy: 'John D.' },
      { obligationId: 'sample_o2', dueDate: recentDates[1], completedBy: 'John D.' },
      { obligationId: 'sample_o6', dueDate: recentDates[0], completedBy: 'Mike R.' },
      { obligationId: 'sample_o10', dueDate: recentDates[1], completedBy: 'Mike R.' }
    ];

    for (const comp of compData) {
      const id = 'comp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      await db.query(
        `INSERT INTO completions (id, obligation_id, due_date, completed_by, notes) VALUES ($1, $2, $3, $4, '')`,
        [id, comp.obligationId, comp.dueDate, comp.completedBy]
      );
    }

    // Create tech user accounts
    for (const tech of techs) {
      const username = tech.toLowerCase().replace(/[^a-z]/g, '');
      const existing = await db.query('SELECT id FROM users WHERE username = $1', [username]);
      if (existing.rows.length === 0) {
        const hash = await bcrypt.hash('password', 10);
        const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        await db.query(
          `INSERT INTO users (id, username, password_hash, display_name, role, technician_name) VALUES ($1, $2, $3, $4, 'technician', $5)`,
          [id, username, hash, tech, tech]
        );
      }
    }

    res.json({ success: true, message: 'Sample data loaded' });
  } catch (err) {
    console.error('Load sample data error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear all data (admin only)
router.delete('/all', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const db = getPool();
    await db.query('DELETE FROM team_feed');
    await db.query('DELETE FROM activity_log');
    await db.query('DELETE FROM snoozes');
    await db.query('DELETE FROM completions');
    await db.query('DELETE FROM obligations');
    await db.query('DELETE FROM clients');
    await db.query('DELETE FROM technicians');

    res.json({ success: true });
  } catch (err) {
    console.error('Clear data error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
