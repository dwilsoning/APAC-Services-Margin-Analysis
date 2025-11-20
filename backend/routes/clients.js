const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const Joi = require('joi');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/clients
 * Get all clients
 */
router.get('/', async (req, res) => {
  try {
    const clients = await db.all(`
      SELECT * FROM clients
      ORDER BY client_name
    `);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

/**
 * GET /api/clients/:id
 * Get a specific client
 */
router.get('/:id', async (req, res) => {
  try {
    const client = await db.get(
      'SELECT * FROM clients WHERE id = ?',
      [req.params.id]
    );

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

/**
 * POST /api/clients
 * Create a new client
 */
router.post('/', async (req, res) => {
  try {
    const schema = Joi.object({
      client_name: Joi.string().trim().min(1).max(255).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if client already exists
    const existing = await db.get(
      'SELECT id FROM clients WHERE client_name = ?',
      [value.client_name]
    );

    if (existing) {
      return res.status(409).json({ error: 'Client already exists' });
    }

    const result = await db.run(
      'INSERT INTO clients (client_name) VALUES (?)',
      [value.client_name]
    );

    // Log audit
    await db.run(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      'CREATE',
      'clients',
      result.id,
      JSON.stringify({ client_name: value.client_name }),
      req.ip
    ]);

    const newClient = await db.get(
      'SELECT * FROM clients WHERE id = ?',
      [result.id]
    );

    res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

/**
 * PUT /api/clients/:id
 * Update a client
 */
router.put('/:id', async (req, res) => {
  try {
    const schema = Joi.object({
      client_name: Joi.string().trim().min(1).max(255).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await db.run(
      'UPDATE clients SET client_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [value.client_name, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Log audit
    await db.run(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      'UPDATE',
      'clients',
      req.params.id,
      JSON.stringify({ client_name: value.client_name }),
      req.ip
    ]);

    const updatedClient = await db.get(
      'SELECT * FROM clients WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

/**
 * DELETE /api/clients/:id
 * Delete a client (only if no associated projects)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Check if client has any projects
    const projectCount = await db.get(
      'SELECT COUNT(*) as count FROM projects WHERE client_id = ?',
      [req.params.id]
    );

    if (projectCount.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete client with associated projects'
      });
    }

    const result = await db.run(
      'DELETE FROM clients WHERE id = ?',
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Log audit
    await db.run(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.id,
      'DELETE',
      'clients',
      req.params.id,
      req.ip
    ]);

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
