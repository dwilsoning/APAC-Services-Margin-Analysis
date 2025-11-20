const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const currencyService = require('../services/currencyService');
const calculationService = require('../services/calculationService');
const Joi = require('joi');
const ExcelJS = require('exceljs');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/projects
 * Get all projects with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { client_id, start_date, end_date, contract_number, oracle_id, project_name, margin_status, ps_ratio_status } = req.query;

    let query = `
      SELECT p.*, c.client_name
      FROM projects p
      INNER JOIN clients c ON p.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (client_id) {
      query += ' AND p.client_id = ?';
      params.push(client_id);
    }

    if (start_date) {
      query += ' AND p.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND p.created_at <= ?';
      params.push(end_date);
    }

    if (contract_number) {
      query += ' AND p.contract_number LIKE ?';
      params.push(`%${contract_number}%`);
    }

    if (oracle_id) {
      query += ' AND p.oracle_id LIKE ?';
      params.push(`%${oracle_id}%`);
    }

    if (project_name) {
      query += ' AND p.project_name LIKE ?';
      params.push(`%${project_name}%`);
    }

    if (margin_status) {
      query += ' AND p.margin_status = ?';
      params.push(margin_status);
    }

    if (ps_ratio_status) {
      query += ' AND p.ps_ratio_status = ?';
      params.push(ps_ratio_status);
    }

    query += ' ORDER BY p.created_at DESC';

    const projects = await db.all(query, params);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project with all details
 */
router.get('/:id', async (req, res) => {
  try {
    const project = await db.get(`
      SELECT p.*, c.client_name
      FROM projects p
      INNER JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get project resources - exclude cost_rate_usd for non-admin users
    let resources;
    if (req.user.role === 'admin') {
      resources = await db.all(
        'SELECT * FROM project_resources WHERE project_id = ? ORDER BY resource_type',
        [req.params.id]
      );
    } else {
      // For non-admin users, exclude cost_rate_usd
      resources = await db.all(
        'SELECT id, project_id, resource_type, hours, baseline_hours, final_hours, total_cost_usd, created_at FROM project_resources WHERE project_id = ? ORDER BY resource_type',
        [req.params.id]
      );
    }

    // Get third-party resources
    const thirdPartyResources = await db.all(
      'SELECT * FROM third_party_resources WHERE project_id = ? ORDER BY resource_name',
      [req.params.id]
    );

    res.json({
      ...project,
      resources,
      third_party_resources: thirdPartyResources
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

/**
 * POST /api/projects
 * Create a new project with calculations
 */
router.post('/', async (req, res) => {
  try {
    const schema = Joi.object({
      client_id: Joi.number().integer().required(),
      currency_used: Joi.string().valid('USD', 'AUD', 'EUR', 'GBP', 'SGD', 'NZD').required(),
      contract_number: Joi.string().allow('', null).optional(),
      oracle_id: Joi.string().allow('', null).optional(),
      project_name: Joi.string().trim().min(1).max(255).required(),
      local_service_value: Joi.number().min(0).required(),
      baseline_hours: Joi.number().min(0).allow(null).optional(),
      total_baseline_hours: Joi.number().min(0).required(),
      non_bill_hours: Joi.number().min(0).default(0),
      resources: Joi.array().items(
        Joi.object({
          resource_type: Joi.string().required(),
          hours: Joi.number().min(0).required(),
          baseline_hours: Joi.number().min(0).default(0),
          final_hours: Joi.number().min(0).default(0)
        })
      ).required(),
      third_party_resources: Joi.array().items(
        Joi.object({
          resource_name: Joi.string().required(),
          cost_usd: Joi.number().min(0).required(),
          hours: Joi.number().min(0).required()
        })
      ).default([])
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verify client exists
    const client = await db.get('SELECT id FROM clients WHERE id = ?', [value.client_id]);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Convert local service value to USD
    const serviceValueUSD = await currencyService.convertToUSD(
      value.local_service_value,
      value.currency_used
    );

    // Get current cost rates for all resource types
    const projectResources = [];
    for (const resource of value.resources) {
      const costRate = await db.get(
        'SELECT cost_rate_usd FROM admin_cost_rates WHERE resource_type = ?',
        [resource.resource_type]
      );

      if (!costRate) {
        return res.status(400).json({
          error: `Cost rate not found for resource type: ${resource.resource_type}`
        });
      }

      projectResources.push({
        resource_type: resource.resource_type,
        hours: resource.hours, // This is final_hours (used for final calculations)
        baseline_hours: resource.baseline_hours || 0,
        final_hours: resource.final_hours || 0,
        cost_rate_usd: costRate.cost_rate_usd
      });
    }

    // Convert third-party costs to USD
    const thirdPartyResources = [];
    for (const resource of value.third_party_resources) {
      // Assuming third-party costs are provided in USD
      // If they're in local currency, you'd need to convert them
      thirdPartyResources.push({
        resource_name: resource.resource_name,
        cost_usd: resource.cost_usd,
        hours: resource.hours
      });
    }

    // Validate baseline hours
    const hoursValidation = calculationService.validateBaselineHours(
      value.total_baseline_hours,
      projectResources,
      value.non_bill_hours || 0
    );

    if (!hoursValidation.isValid) {
      console.warn('Baseline hours mismatch:', hoursValidation);
      // We'll continue but could warn the user
    }

    // Debug logging
    console.log('\n=== CALCULATION DEBUG (POST) ===');
    console.log('Service Value USD:', serviceValueUSD);
    console.log('Project Resources:', projectResources.map(r => ({
      type: r.resource_type,
      baseline_hours: r.baseline_hours,
      final_hours: r.final_hours,
      hours: r.hours,
      cost_rate: r.cost_rate_usd
    })));

    // Calculate baseline metrics (using baseline hours)
    const baselineMetrics = calculationService.calculateBaselineMetrics(
      serviceValueUSD,
      projectResources,
      thirdPartyResources
    );
    console.log('Baseline Metrics:', baselineMetrics);

    // Calculate final metrics (using final/actual hours)
    const finalMetrics = calculationService.calculateProjectMetrics(
      serviceValueUSD,
      projectResources,
      thirdPartyResources,
      value.non_bill_hours || 0
    );
    console.log('Final Metrics:', finalMetrics);
    console.log('=== END DEBUG ===\n');

    // Insert project
    const projectResult = await db.run(`
      INSERT INTO projects (
        client_id, currency_used, contract_number, oracle_id, project_name,
        local_service_value, baseline_hours, total_baseline_hours, non_bill_hours,
        total_costs_usd, baseline_margin_percent, net_revenue_usd, ebita_usd,
        ps_ratio, margin_status, ps_ratio_status,
        baseline_total_costs_usd, baseline_margin_baseline_percent,
        baseline_net_revenue_usd, baseline_ebita_usd, baseline_ps_ratio,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      value.client_id, value.currency_used, value.contract_number, value.oracle_id,
      value.project_name, value.local_service_value, value.baseline_hours,
      value.total_baseline_hours, value.non_bill_hours,
      finalMetrics.totalCostsUsd, finalMetrics.baselineMarginPercent, finalMetrics.netRevenueUsd,
      finalMetrics.ebitaUsd, finalMetrics.psRatio, finalMetrics.marginStatus, finalMetrics.psRatioStatus,
      baselineMetrics.baselineTotalCostsUsd, baselineMetrics.baselineMarginPercent,
      baselineMetrics.baselineNetRevenueUsd, baselineMetrics.baselineEbitaUsd, baselineMetrics.baselinePsRatio,
      req.user.id
    ]);

    const projectId = projectResult.id;

    // Insert project resources
    for (const resource of projectResources) {
      const totalCost = resource.hours * resource.cost_rate_usd;
      await db.run(`
        INSERT INTO project_resources (
          project_id, resource_type, hours, cost_rate_usd, total_cost_usd,
          baseline_hours, final_hours
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        projectId,
        resource.resource_type,
        resource.hours,
        resource.cost_rate_usd,
        totalCost,
        resource.baseline_hours || 0,
        resource.final_hours || 0
      ]);
    }

    // Insert third-party resources
    for (const resource of thirdPartyResources) {
      await db.run(`
        INSERT INTO third_party_resources (project_id, resource_name, cost_usd, hours)
        VALUES (?, ?, ?, ?)
      `, [projectId, resource.resource_name, resource.cost_usd, resource.hours]);
    }

    // Log audit
    await db.run(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      'CREATE',
      'projects',
      projectId,
      JSON.stringify(value),
      req.ip
    ]);

    // Get complete project with all details
    const newProject = await db.get(`
      SELECT p.*, c.client_name
      FROM projects p
      INNER JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `, [projectId]);

    const resources = await db.all(
      'SELECT * FROM project_resources WHERE project_id = ?',
      [projectId]
    );

    const thirdPartyResourcesDb = await db.all(
      'SELECT * FROM third_party_resources WHERE project_id = ?',
      [projectId]
    );

    res.status(201).json({
      ...newProject,
      resources,
      third_party_resources: thirdPartyResourcesDb,
      hours_validation: hoursValidation
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

/**
 * GET /api/projects/dashboard/stats
 * Get dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const { client_id, start_date, end_date, contract_number, oracle_id, project_name, margin_status, ps_ratio_status } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (client_id) {
      whereClause += ' AND client_id = ?';
      params.push(client_id);
    }

    if (start_date) {
      whereClause += ' AND created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND created_at <= ?';
      params.push(end_date);
    }

    if (contract_number) {
      whereClause += ' AND contract_number LIKE ?';
      params.push(`%${contract_number}%`);
    }

    if (oracle_id) {
      whereClause += ' AND oracle_id LIKE ?';
      params.push(`%${oracle_id}%`);
    }

    if (project_name) {
      whereClause += ' AND project_name LIKE ?';
      params.push(`%${project_name}%`);
    }

    if (margin_status) {
      whereClause += ' AND margin_status = ?';
      params.push(margin_status);
    }

    if (ps_ratio_status) {
      whereClause += ' AND ps_ratio_status = ?';
      params.push(ps_ratio_status);
    }

    const stats = await db.get(`
      SELECT
        COUNT(*) as total_projects,
        AVG(baseline_margin_percent) as avg_margin,
        AVG(ps_ratio) as avg_ps_ratio,
        SUM(CASE WHEN margin_status = 'On Track' THEN 1 ELSE 0 END) as projects_on_track_margin,
        SUM(CASE WHEN margin_status = 'Below Target' THEN 1 ELSE 0 END) as projects_below_target_margin,
        SUM(CASE WHEN ps_ratio_status = 'On Track' THEN 1 ELSE 0 END) as projects_on_track_ps,
        SUM(CASE WHEN ps_ratio_status = 'Below Target' THEN 1 ELSE 0 END) as projects_below_target_ps,
        SUM(local_service_value) as total_service_value,
        SUM(total_costs_usd) as total_costs,
        SUM(net_revenue_usd) as total_net_revenue
      FROM projects
      ${whereClause}
    `, params);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * GET /api/projects/export/excel
 * Export projects to Excel
 */
router.get('/export/excel', async (req, res) => {
  try {
    const { client_id, start_date, end_date } = req.query;

    let query = `
      SELECT p.*, c.client_name
      FROM projects p
      INNER JOIN clients c ON p.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (client_id) {
      query += ' AND p.client_id = ?';
      params.push(client_id);
    }

    if (start_date) {
      query += ' AND p.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND p.created_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY p.created_at DESC';

    const projects = await db.all(query, params);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Projects');

    // Add headers
    worksheet.columns = [
      { header: 'Client', key: 'client_name', width: 20 },
      { header: 'Project Name', key: 'project_name', width: 30 },
      { header: 'Contract Number', key: 'contract_number', width: 15 },
      { header: 'Oracle ID', key: 'oracle_id', width: 15 },
      { header: 'Currency', key: 'currency_used', width: 10 },
      { header: 'Service Value', key: 'local_service_value', width: 15 },
      { header: 'Total Costs (USD)', key: 'total_costs_usd', width: 15 },
      { header: 'Margin %', key: 'baseline_margin_percent', width: 12 },
      { header: 'Margin Status', key: 'margin_status', width: 15 },
      { header: 'Net Revenue (USD)', key: 'net_revenue_usd', width: 15 },
      { header: 'EBITA (USD)', key: 'ebita_usd', width: 15 },
      { header: 'PS Ratio', key: 'ps_ratio', width: 12 },
      { header: 'PS Ratio Status', key: 'ps_ratio_status', width: 15 },
      { header: 'Total Baseline Hours', key: 'total_baseline_hours', width: 15 },
      { header: 'Created At', key: 'created_at', width: 20 }
    ];

    // Add data rows
    projects.forEach(project => {
      worksheet.addRow(project);
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=margin-analysis-${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

/**
 * PUT /api/projects/:id
 * Update an existing project
 */
router.put('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;

    // Verify project exists and user has access
    const existingProject = await db.get(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    );

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate input
    const schema = Joi.object({
      client_id: Joi.number().integer().required(),
      currency_used: Joi.string().valid('USD', 'AUD', 'EUR', 'GBP', 'SGD', 'NZD').required(),
      contract_number: Joi.string().allow('', null).optional(),
      oracle_id: Joi.string().allow('', null).optional(),
      project_name: Joi.string().trim().min(1).max(255).required(),
      local_service_value: Joi.number().min(0).required(),
      baseline_hours: Joi.number().min(0).allow(null).optional(),
      total_baseline_hours: Joi.number().min(0).required(),
      non_bill_hours: Joi.number().min(0).default(0),
      resources: Joi.array().items(
        Joi.object({
          resource_type: Joi.string().required(),
          hours: Joi.number().min(0).required(),
          baseline_hours: Joi.number().min(0).default(0),
          final_hours: Joi.number().min(0).default(0)
        })
      ).required(),
      third_party_resources: Joi.array().items(
        Joi.object({
          resource_name: Joi.string().required(),
          cost_usd: Joi.number().min(0).required(),
          hours: Joi.number().min(0).required()
        })
      ).default([])
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verify client exists
    const client = await db.get('SELECT id FROM clients WHERE id = ?', [value.client_id]);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Convert local service value to USD
    const serviceValueUSD = await currencyService.convertToUSD(
      value.local_service_value,
      value.currency_used
    );

    // Get existing cost rates from the project (preserve original rates when editing)
    const existingResources = await db.all(
      'SELECT resource_type, cost_rate_usd FROM project_resources WHERE project_id = ?',
      [projectId]
    );

    const existingRatesMap = {};
    existingResources.forEach(r => {
      existingRatesMap[r.resource_type] = r.cost_rate_usd;
    });

    // Build project resources, using existing cost rates or fetching new ones for new resources
    const projectResources = [];
    for (const resource of value.resources) {
      let costRateUsd;

      // If this resource type existed in the project, use the original rate
      if (existingRatesMap[resource.resource_type]) {
        costRateUsd = existingRatesMap[resource.resource_type];
      } else {
        // New resource type added during edit - get current rate
        const costRate = await db.get(
          'SELECT cost_rate_usd FROM admin_cost_rates WHERE resource_type = ?',
          [resource.resource_type]
        );

        if (!costRate) {
          return res.status(400).json({
            error: `Cost rate not found for resource type: ${resource.resource_type}`
          });
        }
        costRateUsd = costRate.cost_rate_usd;
      }

      projectResources.push({
        resource_type: resource.resource_type,
        hours: resource.hours,
        baseline_hours: resource.baseline_hours || 0,
        final_hours: resource.final_hours || 0,
        cost_rate_usd: costRateUsd
      });
    }

    // Convert third-party costs to USD
    const thirdPartyResources = [];
    for (const resource of value.third_party_resources) {
      thirdPartyResources.push({
        resource_name: resource.resource_name,
        cost_usd: resource.cost_usd,
        hours: resource.hours
      });
    }

    // Calculate baseline metrics (using baseline hours)
    const baselineMetrics = calculationService.calculateBaselineMetrics(
      serviceValueUSD,
      projectResources,
      thirdPartyResources
    );

    // Calculate final metrics (using final/actual hours)
    const finalMetrics = calculationService.calculateProjectMetrics(
      serviceValueUSD,
      projectResources,
      thirdPartyResources,
      value.non_bill_hours || 0
    );

    // Update project
    await db.run(`
      UPDATE projects SET
        client_id = ?,
        currency_used = ?,
        contract_number = ?,
        oracle_id = ?,
        project_name = ?,
        local_service_value = ?,
        baseline_hours = ?,
        total_baseline_hours = ?,
        non_bill_hours = ?,
        total_costs_usd = ?,
        baseline_margin_percent = ?,
        net_revenue_usd = ?,
        ebita_usd = ?,
        ps_ratio = ?,
        margin_status = ?,
        ps_ratio_status = ?,
        baseline_total_costs_usd = ?,
        baseline_margin_baseline_percent = ?,
        baseline_net_revenue_usd = ?,
        baseline_ebita_usd = ?,
        baseline_ps_ratio = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      value.client_id, value.currency_used, value.contract_number, value.oracle_id,
      value.project_name, value.local_service_value, value.baseline_hours,
      value.total_baseline_hours, value.non_bill_hours,
      finalMetrics.totalCostsUsd, finalMetrics.baselineMarginPercent, finalMetrics.netRevenueUsd,
      finalMetrics.ebitaUsd, finalMetrics.psRatio, finalMetrics.marginStatus, finalMetrics.psRatioStatus,
      baselineMetrics.baselineTotalCostsUsd, baselineMetrics.baselineMarginPercent,
      baselineMetrics.baselineNetRevenueUsd, baselineMetrics.baselineEbitaUsd, baselineMetrics.baselinePsRatio,
      projectId
    ]);

    // Delete existing resources and third-party resources
    await db.run('DELETE FROM project_resources WHERE project_id = ?', [projectId]);
    await db.run('DELETE FROM third_party_resources WHERE project_id = ?', [projectId]);

    // Insert updated project resources
    for (const resource of projectResources) {
      const totalCost = resource.hours * resource.cost_rate_usd;
      await db.run(`
        INSERT INTO project_resources (
          project_id, resource_type, hours, cost_rate_usd, total_cost_usd,
          baseline_hours, final_hours
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        projectId,
        resource.resource_type,
        resource.hours,
        resource.cost_rate_usd,
        totalCost,
        resource.baseline_hours,
        resource.final_hours
      ]);
    }

    // Insert updated third-party resources
    for (const resource of thirdPartyResources) {
      await db.run(`
        INSERT INTO third_party_resources (project_id, resource_name, cost_usd, hours)
        VALUES (?, ?, ?, ?)
      `, [projectId, resource.resource_name, resource.cost_usd, resource.hours]);
    }

    // Log audit
    await db.run(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.id,
      'UPDATE',
      'projects',
      projectId,
      req.ip
    ]);

    // Fetch updated project with all details
    const updatedProject = await db.get(`
      SELECT p.*, c.client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `, [projectId]);

    res.json({
      message: 'Project updated successfully',
      id: projectId,
      ...updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project (admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Delete associated resources (will cascade delete)
    const result = await db.run(
      'DELETE FROM projects WHERE id = ?',
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Log audit
    await db.run(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.id,
      'DELETE',
      'projects',
      req.params.id,
      req.ip
    ]);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
