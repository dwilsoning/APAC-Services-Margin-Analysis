const express = require('express');
const router = express.Router();

// Get all project resources with details
router.get('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const result = await pool.query(
      `SELECT pr.*,
              p.project_name, p.project_code,
              c.client_name,
              sr.role_name as staff_role_name, sr.hourly_rate_usd as staff_hourly_rate,
              tpr.resource_name as third_party_name, tpr.daily_rate as third_party_daily_rate,
              tpr.currency as third_party_currency
       FROM project_resources pr
       LEFT JOIN projects p ON pr.project_id = p.id
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN staff_roles sr ON pr.staff_role_id = sr.id
       LEFT JOIN third_party_resources tpr ON pr.third_party_resource_id = tpr.id
       ORDER BY pr.period_year DESC, pr.period_month DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching project resources:', error);
    res.status(500).json({ error: 'Failed to fetch project resources' });
  }
});

// Get project resources by project ID
router.get('/project/:projectId', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT pr.*,
              sr.role_name as staff_role_name, sr.hourly_rate_usd as staff_hourly_rate,
              tpr.resource_name as third_party_name, tpr.daily_rate as third_party_daily_rate,
              tpr.currency as third_party_currency
       FROM project_resources pr
       LEFT JOIN staff_roles sr ON pr.staff_role_id = sr.id
       LEFT JOIN third_party_resources tpr ON pr.third_party_resource_id = tpr.id
       WHERE pr.project_id = $1
       ORDER BY pr.period_year DESC, pr.period_month DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching project resources:', error);
    res.status(500).json({ error: 'Failed to fetch project resources' });
  }
});

// Get project resources by period
router.get('/period/:year/:month', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { year, month } = req.params;
    const result = await pool.query(
      `SELECT pr.*,
              p.project_name, c.client_name,
              sr.role_name as staff_role_name, sr.hourly_rate_usd as staff_hourly_rate,
              tpr.resource_name as third_party_name, tpr.daily_rate as third_party_daily_rate,
              tpr.currency as third_party_currency
       FROM project_resources pr
       LEFT JOIN projects p ON pr.project_id = p.id
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN staff_roles sr ON pr.staff_role_id = sr.id
       LEFT JOIN third_party_resources tpr ON pr.third_party_resource_id = tpr.id
       WHERE pr.period_year = $1 AND pr.period_month = $2`,
      [year, month]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching project resources:', error);
    res.status(500).json({ error: 'Failed to fetch project resources' });
  }
});

// Create new project resource allocation
router.post('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const {
      project_id,
      period_month,
      period_year,
      staff_role_id,
      staff_hours,
      third_party_resource_id,
      third_party_hours,
      notes
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

    // Must have either staff or third party resource
    if ((!staff_role_id && !third_party_resource_id) || (staff_role_id && third_party_resource_id)) {
      return res.status(400).json({
        error: 'Must specify either staff role OR third party resource, but not both'
      });
    }

    // Calculate cost
    let total_cost_usd = 0;
    let cost_category = '';

    if (staff_role_id) {
      // Get staff hourly rate
      const roleResult = await pool.query('SELECT hourly_rate_usd FROM staff_roles WHERE id = $1', [staff_role_id]);
      if (roleResult.rows.length === 0) {
        return res.status(400).json({ error: 'Staff role not found' });
      }
      const hourly_rate = parseFloat(roleResult.rows[0].hourly_rate_usd);
      total_cost_usd = hourly_rate * (parseFloat(staff_hours) || 0);
      cost_category = 'OPEX';
    } else if (third_party_resource_id) {
      // Get third party daily rate
      const resourceResult = await pool.query(
        'SELECT daily_rate, currency FROM third_party_resources WHERE id = $1',
        [third_party_resource_id]
      );
      if (resourceResult.rows.length === 0) {
        return res.status(400).json({ error: 'Third party resource not found' });
      }
      const daily_rate = parseFloat(resourceResult.rows[0].daily_rate);
      // TODO: Handle currency conversion if not USD
      const days = (parseFloat(third_party_hours) || 0) / 8; // Assuming 8 hours = 1 day
      total_cost_usd = daily_rate * days;
      cost_category = 'COGS';
    }

    const result = await pool.query(
      `INSERT INTO project_resources (
        project_id, period_month, period_year,
        staff_role_id, staff_hours,
        third_party_resource_id, third_party_hours,
        total_cost_usd, cost_category, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        project_id, period_month, period_year,
        staff_role_id, staff_hours,
        third_party_resource_id, third_party_hours,
        total_cost_usd, cost_category, notes
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project resource:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Referenced project or resource does not exist' });
    }
    res.status(500).json({ error: 'Failed to create project resource' });
  }
});

// Update project resource
router.put('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;
    const {
      staff_hours,
      third_party_hours,
      notes
    } = req.body;

    // Get existing resource to recalculate cost
    const existing = await pool.query('SELECT * FROM project_resources WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Project resource not found' });
    }

    const resource = existing.rows[0];
    let total_cost_usd = 0;

    if (resource.staff_role_id) {
      const roleResult = await pool.query('SELECT hourly_rate_usd FROM staff_roles WHERE id = $1', [resource.staff_role_id]);
      const hourly_rate = parseFloat(roleResult.rows[0].hourly_rate_usd);
      total_cost_usd = hourly_rate * (parseFloat(staff_hours) || 0);
    } else if (resource.third_party_resource_id) {
      const resourceResult = await pool.query('SELECT daily_rate FROM third_party_resources WHERE id = $1', [resource.third_party_resource_id]);
      const daily_rate = parseFloat(resourceResult.rows[0].daily_rate);
      const days = (parseFloat(third_party_hours) || 0) / 8;
      total_cost_usd = daily_rate * days;
    }

    const result = await pool.query(
      `UPDATE project_resources
       SET staff_hours = $1, third_party_hours = $2, total_cost_usd = $3, notes = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [staff_hours, third_party_hours, total_cost_usd, notes, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project resource:', error);
    res.status(500).json({ error: 'Failed to update project resource' });
  }
});

// Delete project resource
router.delete('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM project_resources WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project resource not found' });
    }

    res.json({ message: 'Project resource deleted successfully', resource: result.rows[0] });
  } catch (error) {
    console.error('Error deleting project resource:', error);
    res.status(500).json({ error: 'Failed to delete project resource' });
  }
});

module.exports = router;
