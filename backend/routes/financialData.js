const express = require('express');
const router = express.Router();

// Get all financial data with project and client info
router.get('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const result = await pool.query(
      `SELECT fd.*, p.project_name, p.project_code, c.client_name, c.region
       FROM financial_data fd
       LEFT JOIN projects p ON fd.project_id = p.id
       LEFT JOIN clients c ON p.client_id = c.id
       ORDER BY fd.period_year DESC, fd.period_month DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
});

// Get financial data by project ID
router.get('/project/:projectId', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT * FROM financial_data
       WHERE project_id = $1
       ORDER BY period_year DESC, period_month DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
});

// Get financial data for a specific period
router.get('/period/:year/:month', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { year, month } = req.params;
    const result = await pool.query(
      `SELECT fd.*, p.project_name, c.client_name, c.region
       FROM financial_data fd
       LEFT JOIN projects p ON fd.project_id = p.id
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE fd.period_year = $1 AND fd.period_month = $2`,
      [year, month]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
});

// Create new financial data entry
router.post('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const {
      project_id,
      period_month,
      period_year,
      revenue,
      cost_of_goods_sold,
      operating_expenses
    } = req.body;

    // Validation
    if (!project_id || !period_month || !period_year) {
      return res.status(400).json({
        error: 'Project ID, period month, and period year are required'
      });
    }

    if (period_month < 1 || period_month > 12) {
      return res.status(400).json({ error: 'Period month must be between 1 and 12' });
    }

    // Calculate margins
    const revenueNum = parseFloat(revenue) || 0;
    const cogsNum = parseFloat(cost_of_goods_sold) || 0;
    const opexNum = parseFloat(operating_expenses) || 0;

    const gross_margin = revenueNum - cogsNum;
    const gross_margin_percentage = revenueNum !== 0 ? (gross_margin / revenueNum) * 100 : 0;
    const net_margin = revenueNum - cogsNum - opexNum;
    const net_margin_percentage = revenueNum !== 0 ? (net_margin / revenueNum) * 100 : 0;

    const result = await pool.query(
      `INSERT INTO financial_data (
        project_id, period_month, period_year, revenue, cost_of_goods_sold,
        operating_expenses, gross_margin, gross_margin_percentage,
        net_margin, net_margin_percentage
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        project_id, period_month, period_year, revenueNum, cogsNum, opexNum,
        gross_margin, gross_margin_percentage, net_margin, net_margin_percentage
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating financial data:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Financial data already exists for this project and period'
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Project does not exist' });
    }
    res.status(500).json({ error: 'Failed to create financial data' });
  }
});

// Update financial data
router.put('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const {
      project_id,
      period_month,
      period_year,
      revenue,
      cost_of_goods_sold,
      operating_expenses
    } = req.body;

    if (!project_id || !period_month || !period_year) {
      return res.status(400).json({
        error: 'Project ID, period month, and period year are required'
      });
    }

    if (period_month < 1 || period_month > 12) {
      return res.status(400).json({ error: 'Period month must be between 1 and 12' });
    }

    // Calculate margins
    const revenueNum = parseFloat(revenue) || 0;
    const cogsNum = parseFloat(cost_of_goods_sold) || 0;
    const opexNum = parseFloat(operating_expenses) || 0;

    const gross_margin = revenueNum - cogsNum;
    const gross_margin_percentage = revenueNum !== 0 ? (gross_margin / revenueNum) * 100 : 0;
    const net_margin = revenueNum - cogsNum - opexNum;
    const net_margin_percentage = revenueNum !== 0 ? (net_margin / revenueNum) * 100 : 0;

    const result = await pool.query(
      `UPDATE financial_data
       SET project_id = $1, period_month = $2, period_year = $3,
           revenue = $4, cost_of_goods_sold = $5, operating_expenses = $6,
           gross_margin = $7, gross_margin_percentage = $8,
           net_margin = $9, net_margin_percentage = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        project_id, period_month, period_year, revenueNum, cogsNum, opexNum,
        gross_margin, gross_margin_percentage, net_margin, net_margin_percentage, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Financial data not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating financial data:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Financial data already exists for this project and period'
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Project does not exist' });
    }
    res.status(500).json({ error: 'Failed to update financial data' });
  }
});

// Delete financial data
router.delete('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM financial_data WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Financial data not found' });
    }

    res.json({ message: 'Financial data deleted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting financial data:', error);
    res.status(500).json({ error: 'Failed to delete financial data' });
  }
});

module.exports = router;
