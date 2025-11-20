const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Joi = require('joi');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/rates
 * Get all current cost rates
 */
router.get('/rates', async (req, res) => {
  try {
    const rates = await db.all(`
      SELECT * FROM admin_cost_rates
      ORDER BY resource_type
    `);
    res.json(rates);
  } catch (error) {
    console.error('Error fetching cost rates:', error);
    res.status(500).json({ error: 'Failed to fetch cost rates' });
  }
});

/**
 * GET /api/admin/rates/:id
 * Get a specific cost rate
 */
router.get('/rates/:id', async (req, res) => {
  try {
    const rate = await db.get(
      'SELECT * FROM admin_cost_rates WHERE id = ?',
      [req.params.id]
    );

    if (!rate) {
      return res.status(404).json({ error: 'Cost rate not found' });
    }

    res.json(rate);
  } catch (error) {
    console.error('Error fetching cost rate:', error);
    res.status(500).json({ error: 'Failed to fetch cost rate' });
  }
});

/**
 * PUT /api/admin/rates/:id
 * Update a cost rate
 */
router.put('/rates/:id', async (req, res) => {
  try {
    const schema = Joi.object({
      cost_rate_usd: Joi.number().min(0).required(),
      effective_date: Joi.date().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get current rate for history
    const currentRate = await db.get(
      'SELECT * FROM admin_cost_rates WHERE id = ?',
      [req.params.id]
    );

    if (!currentRate) {
      return res.status(404).json({ error: 'Cost rate not found' });
    }

    // Save to history
    await db.run(`
      INSERT INTO cost_rate_history (resource_type, cost_rate_usd, effective_date, created_by)
      VALUES (?, ?, ?, ?)
    `, [
      currentRate.resource_type,
      currentRate.cost_rate_usd,
      currentRate.effective_date,
      req.user.id
    ]);

    // Update current rate
    const effectiveDate = value.effective_date || new Date().toISOString().split('T')[0];
    await db.run(`
      UPDATE admin_cost_rates
      SET cost_rate_usd = ?, effective_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [value.cost_rate_usd, effectiveDate, req.params.id]);

    // Log audit
    await db.run(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      'UPDATE',
      'admin_cost_rates',
      req.params.id,
      JSON.stringify({ cost_rate_usd: currentRate.cost_rate_usd }),
      JSON.stringify({ cost_rate_usd: value.cost_rate_usd }),
      req.ip
    ]);

    const updatedRate = await db.get(
      'SELECT * FROM admin_cost_rates WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedRate);
  } catch (error) {
    console.error('Error updating cost rate:', error);
    res.status(500).json({ error: 'Failed to update cost rate' });
  }
});

/**
 * PATCH /api/admin/rates/bulk
 * Bulk update cost rates
 */
router.patch('/rates/bulk', async (req, res) => {
  try {
    const schema = Joi.object({
      rates: Joi.array().items(
        Joi.object({
          id: Joi.number().required(),
          cost_rate_usd: Joi.number().min(0).required()
        })
      ).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const effectiveDate = new Date().toISOString().split('T')[0];
    const updatedRates = [];

    for (const rateUpdate of value.rates) {
      // Get current rate for history
      const currentRate = await db.get(
        'SELECT * FROM admin_cost_rates WHERE id = ?',
        [rateUpdate.id]
      );

      if (currentRate) {
        // Save to history
        await db.run(`
          INSERT INTO cost_rate_history (resource_type, cost_rate_usd, effective_date, created_by)
          VALUES (?, ?, ?, ?)
        `, [
          currentRate.resource_type,
          currentRate.cost_rate_usd,
          currentRate.effective_date,
          req.user.id
        ]);

        // Update current rate
        await db.run(`
          UPDATE admin_cost_rates
          SET cost_rate_usd = ?, effective_date = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [rateUpdate.cost_rate_usd, effectiveDate, rateUpdate.id]);

        updatedRates.push(rateUpdate.id);
      }
    }

    // Log audit
    await db.run(`
      INSERT INTO audit_log (user_id, action, table_name, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.id,
      'BULK_UPDATE',
      'admin_cost_rates',
      JSON.stringify(value.rates),
      req.ip
    ]);

    res.json({
      message: 'Cost rates updated successfully',
      updated: updatedRates.length
    });
  } catch (error) {
    console.error('Error bulk updating cost rates:', error);
    res.status(500).json({ error: 'Failed to update cost rates' });
  }
});

/**
 * GET /api/admin/rates/:id/history
 * Get cost rate history for a specific resource type
 */
router.get('/rates/:id/history', async (req, res) => {
  try {
    const currentRate = await db.get(
      'SELECT resource_type FROM admin_cost_rates WHERE id = ?',
      [req.params.id]
    );

    if (!currentRate) {
      return res.status(404).json({ error: 'Cost rate not found' });
    }

    const history = await db.all(`
      SELECT h.*, u.email as created_by_email, u.first_name, u.last_name
      FROM cost_rate_history h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.resource_type = ?
      ORDER BY h.effective_date DESC, h.created_at DESC
      LIMIT 50
    `, [currentRate.resource_type]);

    res.json(history);
  } catch (error) {
    console.error('Error fetching cost rate history:', error);
    res.status(500).json({ error: 'Failed to fetch cost rate history' });
  }
});

/**
 * GET /api/admin/exchange-rates
 * Get all exchange rates
 */
router.get('/exchange-rates', async (req, res) => {
  try {
    const rates = await db.all(`
      SELECT * FROM exchange_rates
      ORDER BY currency_code
    `);
    res.json(rates);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

/**
 * PUT /api/admin/exchange-rates/:id
 * Update an exchange rate
 */
router.put('/exchange-rates/:id', async (req, res) => {
  try {
    const schema = Joi.object({
      rate_to_usd: Joi.number().min(0).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    await db.run(`
      UPDATE exchange_rates
      SET rate_to_usd = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [value.rate_to_usd, req.params.id]);

    // Log audit
    await db.run(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      'UPDATE',
      'exchange_rates',
      req.params.id,
      JSON.stringify({ rate_to_usd: value.rate_to_usd }),
      req.ip
    ]);

    const updatedRate = await db.get(
      'SELECT * FROM exchange_rates WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedRate);
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    res.status(500).json({ error: 'Failed to update exchange rate' });
  }
});

/**
 * POST /api/admin/exchange-rates/refresh
 * Fetch latest exchange rates from API
 */
router.post('/exchange-rates/refresh', async (req, res) => {
  try {
    const currencyService = require('../services/currencyService');
    const success = await currencyService.fetchAndUpdateRates();

    if (success) {
      const rates = await db.all('SELECT * FROM exchange_rates ORDER BY currency_code');
      res.json({ message: 'Exchange rates updated successfully', rates });
    } else {
      res.status(500).json({ error: 'Failed to fetch exchange rates from API' });
    }
  } catch (error) {
    console.error('Error refreshing exchange rates:', error);
    res.status(500).json({ error: 'Failed to refresh exchange rates' });
  }
});

module.exports = router;
