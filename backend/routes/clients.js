const express = require('express');
const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const result = await pool.query(
      'SELECT * FROM clients ORDER BY client_name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get single client by ID
router.get('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create new client
router.post('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { client_name, client_code, region, industry } = req.body;

    // Validation
    if (!client_name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const result = await pool.query(
      `INSERT INTO clients (client_name, client_code, region, industry)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [client_name, client_code, region, industry]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Client code already exists' });
    }
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const { client_name, client_code, region, industry } = req.body;

    if (!client_name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const result = await pool.query(
      `UPDATE clients
       SET client_name = $1, client_code = $2, region = $3, industry = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [client_name, client_code, region, industry, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Client code already exists' });
    }
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Get client dependencies (check if client has projects)
router.get('/:id/dependencies', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;

    // Check if client exists
    const clientResult = await pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get count of projects associated with this client
    const projectsResult = await pool.query(
      'SELECT COUNT(*) as project_count FROM projects WHERE client_id = $1',
      [id]
    );

    const projectCount = parseInt(projectsResult.rows[0].project_count);

    res.json({
      client: clientResult.rows[0],
      has_dependencies: projectCount > 0,
      project_count: projectCount,
      can_delete: projectCount === 0
    });
  } catch (error) {
    console.error('Error checking client dependencies:', error);
    res.status(500).json({ error: 'Failed to check client dependencies' });
  }
});

// Delete client (requires reassignment if has projects)
router.delete('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const { reassign_to_client_id } = req.body;

    // Check if client exists and has projects
    const clientCheck = await pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const projectsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM projects WHERE client_id = $1',
      [id]
    );

    const projectCount = parseInt(projectsCheck.rows[0].count);

    // If client has projects, reassignment is required
    if (projectCount > 0) {
      if (!reassign_to_client_id) {
        return res.status(400).json({
          error: 'Client has associated projects and requires reassignment',
          project_count: projectCount,
          requires_reassignment: true
        });
      }

      // Verify the reassignment target exists
      const targetClientCheck = await pool.query(
        'SELECT * FROM clients WHERE id = $1',
        [reassign_to_client_id]
      );

      if (targetClientCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Target client for reassignment not found' });
      }

      // Reassign all projects to the new client
      await pool.query(
        'UPDATE projects SET client_id = $1, updated_at = CURRENT_TIMESTAMP WHERE client_id = $2',
        [reassign_to_client_id, id]
      );
    }

    // Now delete the client
    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 RETURNING *',
      [id]
    );

    res.json({
      message: 'Client deleted successfully',
      client: result.rows[0],
      projects_reassigned: projectCount,
      reassigned_to: reassign_to_client_id || null
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
