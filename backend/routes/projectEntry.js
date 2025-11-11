const express = require('express');
const router = express.Router();

// Create a complete project entry with all data
router.post('/', async (req, res) => {
  const { pool } = req.app.locals;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      client_name,
      currency,
      contract_number,
      oracle_id,
      project_name,
      local_services_value,
      baseline_hours,
      local_fair_services_value,
      total_non_bill_hours,
      closure_date,
      resource_hours
    } = req.body;

    // Insert or get client
    let clientResult = await client.query(
      'SELECT id FROM clients WHERE company_name = $1',
      [client_name]
    );

    let client_id;
    if (clientResult.rows.length === 0) {
      const insertClient = await client.query(
        'INSERT INTO clients (company_name) VALUES ($1) RETURNING id',
        [client_name]
      );
      client_id = insertClient.rows[0].id;
    } else {
      client_id = clientResult.rows[0].id;
    }

    // Insert project
    const projectResult = await client.query(
      `INSERT INTO projects (
        client_id,
        project_name,
        contract_number,
        oracle_id,
        currency,
        local_services_value,
        baseline_hours,
        local_fair_services_value,
        total_non_bill_hours,
        closure_date,
        start_date,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, 'Active')
      RETURNING id`,
      [
        client_id,
        project_name,
        contract_number,
        oracle_id || null,
        currency,
        local_services_value,
        baseline_hours,
        local_fair_services_value || null,
        total_non_bill_hours || null,
        closure_date || null
      ]
    );

    const project_id = projectResult.rows[0].id;

    // Insert resource allocations
    if (resource_hours && typeof resource_hours === 'object') {
      for (const [role_id, hours] of Object.entries(resource_hours)) {
        if (hours && parseFloat(hours) > 0) {
          // Get hourly rate for this role
          const rateResult = await client.query(
            'SELECT hourly_rate_usd FROM staff_roles WHERE id = $1',
            [role_id]
          );

          if (rateResult.rows.length > 0) {
            const hourly_rate = parseFloat(rateResult.rows[0].hourly_rate_usd);
            const total_hours = parseFloat(hours);
            const total_cost = hourly_rate * total_hours;

            await client.query(
              `INSERT INTO project_resources (
                project_id,
                staff_role_id,
                staff_hours,
                total_cost_usd,
                cost_category,
                allocation_date
              ) VALUES ($1, $2, $3, $4, 'OPEX', CURRENT_DATE)`,
              [project_id, role_id, total_hours, total_cost]
            );
          }
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Project created successfully',
      project_id: project_id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating project entry:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Get all projects with details
router.get('/', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const result = await pool.query(`
      SELECT
        p.*,
        c.company_name as client_name,
        COALESCE(SUM(pr.total_cost_usd), 0) as total_resource_cost
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN project_resources pr ON p.id = pr.project_id
      GROUP BY p.id, c.company_name
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get project by ID with all details including resource hours
router.get('/:id', async (req, res) => {
  try {
    const { pool } = req.app.locals;
    const { id } = req.params;

    // Get project details
    const projectResult = await pool.query(`
      SELECT
        p.*,
        c.company_name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Get resource hours
    const resourceResult = await pool.query(`
      SELECT
        pr.staff_role_id,
        pr.staff_hours,
        sr.role_name
      FROM project_resources pr
      JOIN staff_roles sr ON pr.staff_role_id = sr.id
      WHERE pr.project_id = $1
    `, [id]);

    // Format resource hours as an object
    const resource_hours = {};
    resourceResult.rows.forEach(row => {
      resource_hours[row.staff_role_id] = row.staff_hours.toString();
    });

    res.json({
      ...project,
      resource_hours
    });

  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  const { pool } = req.app.locals;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      client_name,
      currency,
      contract_number,
      oracle_id,
      project_name,
      local_services_value,
      baseline_hours,
      local_fair_services_value,
      total_non_bill_hours,
      closure_date,
      resource_hours
    } = req.body;

    // Get or create client
    let clientResult = await client.query(
      'SELECT id FROM clients WHERE company_name = $1',
      [client_name]
    );

    let client_id;
    if (clientResult.rows.length === 0) {
      const insertClient = await client.query(
        'INSERT INTO clients (company_name) VALUES ($1) RETURNING id',
        [client_name]
      );
      client_id = insertClient.rows[0].id;
    } else {
      client_id = clientResult.rows[0].id;
    }

    // Update project
    await client.query(
      `UPDATE projects SET
        client_id = $1,
        project_name = $2,
        contract_number = $3,
        oracle_id = $4,
        currency = $5,
        local_services_value = $6,
        baseline_hours = $7,
        local_fair_services_value = $8,
        total_non_bill_hours = $9,
        closure_date = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11`,
      [
        client_id,
        project_name,
        contract_number,
        oracle_id || null,
        currency,
        local_services_value,
        baseline_hours,
        local_fair_services_value || null,
        total_non_bill_hours || null,
        closure_date || null,
        id
      ]
    );

    // Delete existing resource allocations
    await client.query('DELETE FROM project_resources WHERE project_id = $1', [id]);

    // Insert new resource allocations
    if (resource_hours && typeof resource_hours === 'object') {
      for (const [role_id, hours] of Object.entries(resource_hours)) {
        if (hours && parseFloat(hours) > 0) {
          const rateResult = await client.query(
            'SELECT hourly_rate_usd FROM staff_roles WHERE id = $1',
            [role_id]
          );

          if (rateResult.rows.length > 0) {
            const hourly_rate = parseFloat(rateResult.rows[0].hourly_rate_usd);
            const total_hours = parseFloat(hours);
            const total_cost = hourly_rate * total_hours;

            await client.query(
              `INSERT INTO project_resources (
                project_id,
                staff_role_id,
                staff_hours,
                total_cost_usd,
                cost_category,
                allocation_date
              ) VALUES ($1, $2, $3, $4, 'OPEX', CURRENT_DATE)`,
              [id, role_id, total_hours, total_cost]
            );
          }
        }
      }
    }

    await client.query('COMMIT');

    res.json({ message: 'Project updated successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating project:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  const { pool } = req.app.locals;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Delete resource allocations first
    await client.query('DELETE FROM project_resources WHERE project_id = $1', [id]);

    // Delete project
    const result = await client.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found' });
    }

    await client.query('COMMIT');

    res.json({ message: 'Project deleted successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting project:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
