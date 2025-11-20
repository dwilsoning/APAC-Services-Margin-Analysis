const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/margin-analysis.db');
const contractNumber = process.argv[2] || '12345';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.\n');
});

// Get project details
db.get('SELECT * FROM projects WHERE contract_number = ?', [contractNumber], (err, project) => {
  if (err) {
    console.error('Error fetching project:', err);
    db.close();
    return;
  }

  if (!project) {
    console.log('Project not found with contract number:', contractNumber);
    db.close();
    return;
  }

  console.log('=== PROJECT DATA ===');
  console.log('Project ID:', project.id);
  console.log('Project Name:', project.project_name);
  console.log('Service Value:', project.local_service_value);
  console.log('Currency:', project.currency_used);
  console.log('Baseline Hours (Project Level):', project.baseline_hours);
  console.log('Total Baseline Hours:', project.total_baseline_hours);
  console.log('Non-Bill Hours:', project.non_bill_hours);
  console.log('\n=== BASELINE METRICS ===');
  console.log('Baseline Margin %:', project.baseline_margin_baseline_percent);
  console.log('Baseline Net Revenue:', project.baseline_net_revenue_usd);
  console.log('Baseline EBITA:', project.baseline_ebita_usd);
  console.log('Baseline PS Ratio:', project.baseline_ps_ratio);
  console.log('\n=== FINAL METRICS ===');
  console.log('Final Margin %:', project.baseline_margin_percent);
  console.log('Final Net Revenue:', project.net_revenue_usd);
  console.log('Final EBITA:', project.ebita_usd);
  console.log('Final PS Ratio:', project.ps_ratio);
  console.log('Final Total Costs:', project.total_costs_usd);

  // Get resources
  db.all('SELECT * FROM project_resources WHERE project_id = ?', [project.id], (err, resources) => {
    if (err) {
      console.error('Error fetching resources:', err);
      db.close();
      return;
    }

    console.log('\n=== RESOURCES ===');
    resources.forEach(r => {
      console.log(`\n${r.resource_type}:`);
      console.log('  Baseline Hours:', r.baseline_hours);
      console.log('  Final Hours:', r.final_hours);
      console.log('  Hours (stored):', r.hours);
      console.log('  Cost Rate USD:', r.cost_rate_usd);
      console.log('  Total Cost:', r.total_cost_usd);
    });

    // Get third party resources
    db.all('SELECT * FROM third_party_resources WHERE project_id = ?', [project.id], (err, thirdParty) => {
      if (err) {
        console.error('Error fetching third party resources:', err);
        db.close();
        return;
      }

      if (thirdParty.length > 0) {
        console.log('\n=== THIRD PARTY RESOURCES ===');
        thirdParty.forEach(r => {
          console.log(`\n${r.resource_name}:`);
          console.log('  Cost USD:', r.cost_usd);
          console.log('  Hours:', r.hours);
        });
      }

      db.close();
    });
  });
});
