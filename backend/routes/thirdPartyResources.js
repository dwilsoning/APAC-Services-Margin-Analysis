const express = require('express');
const router = express.Router();

// Get all third party resources
router.get('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { active_only } = req.query;

    let query = 'SELECT * FROM third_party_resources';
    const params = [];

    if (active_only === 'true') {
      query += ' WHERE is_active = true';
    }

    query += ' ORDER BY resource_name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching third party resources:', error);
    res.status(500).json({ error: 'Failed to fetch third party resources' });
  }
});

// Get single third party resource by ID
router.get('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM third_party_resources WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Third party resource not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching third party resource:', error);
    res.status(500).json({ error: 'Failed to fetch third party resource' });
  }
});

// Create new third party resource
router.post('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { resource_name, company_name, daily_rate, currency, resource_type, notes } = req.body;

    // Validation
    if (!resource_name || !daily_rate) {
      return res.status(400).json({ error: 'Resource name and daily rate are required' });
    }

    if (daily_rate < 0) {
      return res.status(400).json({ error: 'Daily rate must be non-negative' });
    }

    const result = await pool.query(
      `INSERT INTO third_party_resources (resource_name, company_name, daily_rate, currency, resource_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [resource_name, company_name, daily_rate, currency || 'USD', resource_type, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating third party resource:', error);
    res.status(500).json({ error: 'Failed to create third party resource' });
  }
});

// Update third party resource
router.put('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const { resource_name, company_name, daily_rate, currency, resource_type, notes, is_active } = req.body;

    if (!resource_name || daily_rate === undefined) {
      return res.status(400).json({ error: 'Resource name and daily rate are required' });
    }

    if (daily_rate < 0) {
      return res.status(400).json({ error: 'Daily rate must be non-negative' });
    }

    const result = await pool.query(
      `UPDATE third_party_resources
       SET resource_name = $1, company_name = $2, daily_rate = $3, currency = $4,
           resource_type = $5, notes = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [resource_name, company_name, daily_rate, currency, resource_type, notes, is_active !== undefined ? is_active : true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Third party resource not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating third party resource:', error);
    res.status(500).json({ error: 'Failed to update third party resource' });
  }
});

// Deactivate third party resource (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE third_party_resources
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Third party resource not found' });
    }

    res.json({ message: 'Third party resource deactivated successfully', resource: result.rows[0] });
  } catch (error) {
    console.error('Error deactivating third party resource:', error);
    res.status(500).json({ error: 'Failed to deactivate third party resource' });
  }
});

module.exports = router;
