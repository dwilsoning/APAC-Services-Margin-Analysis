const express = require('express');
const router = express.Router();

// Get all staff roles
router.get('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { active_only } = req.query;

    let query = 'SELECT * FROM staff_roles';
    const params = [];

    if (active_only === 'true') {
      query += ' WHERE is_active = true';
    }

    query += ' ORDER BY role_name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff roles:', error);
    res.status(500).json({ error: 'Failed to fetch staff roles' });
  }
});

// Get single staff role by ID
router.get('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM staff_roles WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff role not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching staff role:', error);
    res.status(500).json({ error: 'Failed to fetch staff role' });
  }
});

// Get role rate history
router.get('/:id/history', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const result = await pool.query(
      `SELECT rh.*, u.username as changed_by_name
       FROM role_rate_history rh
       LEFT JOIN users u ON rh.changed_by = u.id
       WHERE rh.role_id = $1
       ORDER BY rh.change_date DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching role rate history:', error);
    res.status(500).json({ error: 'Failed to fetch role rate history' });
  }
});

// Create new staff role (admin only)
router.post('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { role_name, hourly_rate_usd, cost_category, description } = req.body;

    // Validation
    if (!role_name || !hourly_rate_usd) {
      return res.status(400).json({ error: 'Role name and hourly rate are required' });
    }

    if (hourly_rate_usd < 0) {
      return res.status(400).json({ error: 'Hourly rate must be non-negative' });
    }

    const result = await pool.query(
      `INSERT INTO staff_roles (role_name, hourly_rate_usd, cost_category, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [role_name, hourly_rate_usd, cost_category || 'OPEX', description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating staff role:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Role name already exists' });
    }
    res.status(500).json({ error: 'Failed to create staff role' });
  }
});

// Update staff role (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const { role_name, hourly_rate_usd, cost_category, description, is_active, changed_by, reason } = req.body;

    if (!role_name || hourly_rate_usd === undefined) {
      return res.status(400).json({ error: 'Role name and hourly rate are required' });
    }

    if (hourly_rate_usd < 0) {
      return res.status(400).json({ error: 'Hourly rate must be non-negative' });
    }

    // Get current rate to track history
    const currentRole = await pool.query('SELECT hourly_rate_usd FROM staff_roles WHERE id = $1', [id]);

    if (currentRole.rows.length === 0) {
      return res.status(404).json({ error: 'Staff role not found' });
    }

    const oldRate = currentRole.rows[0].hourly_rate_usd;

    // Update the role
    const result = await pool.query(
      `UPDATE staff_roles
       SET role_name = $1, hourly_rate_usd = $2, cost_category = $3,
           description = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [role_name, hourly_rate_usd, cost_category, description, is_active !== undefined ? is_active : true, id]
    );

    // If rate changed, log to history
    if (parseFloat(oldRate) !== parseFloat(hourly_rate_usd)) {
      await pool.query(
        `INSERT INTO role_rate_history (role_id, old_rate, new_rate, changed_by, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, oldRate, hourly_rate_usd, changed_by || null, reason || null]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating staff role:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Role name already exists' });
    }
    res.status(500).json({ error: 'Failed to update staff role' });
  }
});

// Deactivate staff role (soft delete - admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE staff_roles
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff role not found' });
    }

    res.json({ message: 'Staff role deactivated successfully', role: result.rows[0] });
  } catch (error) {
    console.error('Error deactivating staff role:', error);
    res.status(500).json({ error: 'Failed to deactivate staff role' });
  }
});

module.exports = router;
