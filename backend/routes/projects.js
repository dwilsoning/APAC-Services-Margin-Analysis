const express = require('express');
const router = express.Router();

// Get all projects with client information
router.get('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const result = await pool.query(
      `SELECT p.*, c.client_name, c.region, c.industry
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get projects by client ID
router.get('/client/:clientId', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { clientId } = req.params;
    const result = await pool.query(
      `SELECT * FROM projects WHERE client_id = $1 ORDER BY project_name ASC`,
      [clientId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project by ID
router.get('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, c.client_name, c.region, c.industry
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { client_id, project_name, project_code, start_date, end_date, status } = req.body;

    // Validation
    if (!client_id || !project_name) {
      return res.status(400).json({ error: 'Client ID and project name are required' });
    }

    const result = await pool.query(
      `INSERT INTO projects (client_id, project_name, project_code, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [client_id, project_name, project_code, start_date, end_date, status || 'active']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Project code already exists' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Client does not exist' });
    }
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const { client_id, project_name, project_code, start_date, end_date, status } = req.body;

    if (!client_id || !project_name) {
      return res.status(400).json({ error: 'Client ID and project name are required' });
    }

    const result = await pool.query(
      `UPDATE projects
       SET client_id = $1, project_name = $2, project_code = $3,
           start_date = $4, end_date = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [client_id, project_name, project_code, start_date, end_date, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Project code already exists' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Client does not exist' });
    }
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully', project: result.rows[0] });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
