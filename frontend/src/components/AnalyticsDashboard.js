import React, { useState, useEffect } from 'react';
import { projectsAPI, clientsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AnalyticsDashboard = ({ newProjectId, onClearNewProject, onEditProject }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [filters, setFilters] = useState({
    client_id: '',
    start_date: '',
    end_date: '',
    contract_number: '',
    oracle_id: '',
    project_name: '',
    margin_status: '',
    ps_ratio_status: ''
  });

  const [showTable, setShowTable] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  useEffect(() => {
    fetchClients();
    fetchData();
  }, []);

  useEffect(() => {
    if (newProjectId) {
      // Show only the newly created project
      setShowTable(true);
      fetchNewProject(newProjectId);
      if (onClearNewProject) {
        setTimeout(() => onClearNewProject(), 3000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newProjectId]);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getClients();
      setClients(response.data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchData = async (filterParams = {}) => {
    try {
      setLoading(true);
      const [projectsResponse, statsResponse] = await Promise.all([
        projectsAPI.getProjects(filterParams),
        projectsAPI.getDashboardStats(filterParams)
      ]);

      setProjects(projectsResponse.data);
      setStats(statsResponse.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const fetchNewProject = async (projectId) => {
    try {
      setLoading(true);
      const [projectResponse, statsResponse] = await Promise.all([
        projectsAPI.getProject(projectId),
        projectsAPI.getDashboardStats()
      ]);

      // Display only the newly created project
      setProjects([projectResponse.data]);
      setStats(statsResponse.data);
      setSuccess('New project created successfully and displayed below!');
      setLoading(false);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to fetch new project');
      setLoading(false);
      fetchData(); // Fallback to showing all projects
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const buildFilterParams = () => {
    const filterParams = {};
    if (filters.client_id) filterParams.client_id = filters.client_id;
    if (filters.start_date) filterParams.start_date = filters.start_date;
    if (filters.end_date) filterParams.end_date = filters.end_date;
    if (filters.contract_number) filterParams.contract_number = filters.contract_number;
    if (filters.oracle_id) filterParams.oracle_id = filters.oracle_id;
    if (filters.project_name) filterParams.project_name = filters.project_name;
    if (filters.margin_status) filterParams.margin_status = filters.margin_status;
    if (filters.ps_ratio_status) filterParams.ps_ratio_status = filters.ps_ratio_status;
    return filterParams;
  };

  const handleApplyFilters = () => {
    const filterParams = buildFilterParams();
    setActiveFilters(filterParams);
    setShowTable(true);
    fetchData(filterParams);
  };

  const handleClearFilters = () => {
    setFilters({
      client_id: '',
      start_date: '',
      end_date: '',
      contract_number: '',
      oracle_id: '',
      project_name: '',
      margin_status: '',
      ps_ratio_status: ''
    });
    setActiveFilters({});
    setShowTable(false);
    fetchData();
  };

  const handleStatCardClick = (filterType, filterValue) => {
    // If no filter type (Total Projects card), clear all filters
    if (!filterType) {
      handleClearFilters();
      return;
    }

    // Clear existing filters and apply only the stat filter
    const newFilters = {
      client_id: '',
      start_date: '',
      end_date: '',
      contract_number: '',
      oracle_id: '',
      project_name: '',
      margin_status: '',
      ps_ratio_status: ''
    };

    if (filterType === 'margin_status') {
      newFilters.margin_status = filterValue;
    } else if (filterType === 'ps_ratio_status') {
      newFilters.ps_ratio_status = filterValue;
    }

    setFilters(newFilters);
    const filterParams = { [filterType]: filterValue };
    setActiveFilters(filterParams);
    setShowTable(true);
    fetchData(filterParams);
  };

  const handleExportToExcel = async () => {
    try {
      const filterParams = {};
      if (filters.client_id) filterParams.client_id = filters.client_id;
      if (filters.start_date) filterParams.start_date = filters.start_date;
      if (filters.end_date) filterParams.end_date = filters.end_date;
      if (filters.contract_number) filterParams.contract_number = filters.contract_number;
      if (filters.oracle_id) filterParams.oracle_id = filters.oracle_id;
      if (filters.project_name) filterParams.project_name = filters.project_name;

      const response = await projectsAPI.exportToExcel(filterParams);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `margin-analysis-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export data');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"?\n\nThis action cannot be undone and will permanently delete:\n- Project data\n- Resource allocations\n- Third-party resources\n- All related records`)) {
      return;
    }

    try {
      await projectsAPI.deleteProject(projectId);
      setSuccess('Project deleted successfully');

      // Refresh data
      const filterParams = {};
      if (filters.client_id) filterParams.client_id = filters.client_id;
      if (filters.start_date) filterParams.start_date = filters.start_date;
      if (filters.end_date) filterParams.end_date = filters.end_date;
      if (filters.contract_number) filterParams.contract_number = filters.contract_number;
      if (filters.oracle_id) filterParams.oracle_id = filters.oracle_id;
      if (filters.project_name) filterParams.project_name = filters.project_name;
      fetchData(filterParams);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete project');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="analytics-dashboard">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Filters */}
      <div className="card">
        <div className="card-header">Search & Filters</div>

        {/* Search Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>🔍 Contract Number</label>
            <input
              type="text"
              value={filters.contract_number}
              onChange={(e) => handleFilterChange('contract_number', e.target.value)}
              className="form-control"
              placeholder="Search by contract number..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>🔍 Oracle ID</label>
            <input
              type="text"
              value={filters.oracle_id}
              onChange={(e) => handleFilterChange('oracle_id', e.target.value)}
              className="form-control"
              placeholder="Search by Oracle ID..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>🔍 Project Name</label>
            <input
              type="text"
              value={filters.project_name}
              onChange={(e) => handleFilterChange('project_name', e.target.value)}
              className="form-control"
              placeholder="Search by project name..."
            />
          </div>
        </div>

        {/* Filter Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Client</label>
            <select
              value={filters.client_id}
              onChange={(e) => handleFilterChange('client_id', e.target.value)}
              className="form-control"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.client_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="form-control"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleApplyFilters} className="btn btn-primary">
              🔍 Search
            </button>
            <button onClick={handleClearFilters} className="btn btn-secondary">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            className="card"
            onClick={() => handleStatCardClick(null, null)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>Total Projects</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_projects || 0}</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Click to clear filters</p>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', pointerEvents: 'none', opacity: 0.85 }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>Average Margin</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
              {stats.avg_margin ? `${Math.round(stats.avg_margin)}%` : 'N/A'}
            </p>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', pointerEvents: 'none', opacity: 0.85 }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>Average PS Ratio</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
              {stats.avg_ps_ratio ? stats.avg_ps_ratio.toFixed(2) : 'N/A'}
            </p>
          </div>

          <div
            className="card"
            onClick={() => handleStatCardClick('margin_status', 'On Track')}
            style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>On Track (Margin)</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.projects_on_track_margin || 0}</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Click to filter</p>
          </div>

          <div
            className="card"
            onClick={() => handleStatCardClick('margin_status', 'Below Target')}
            style={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>Below Target (Margin)</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.projects_below_target_margin || 0}</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Click to filter</p>
          </div>

          <div
            className="card"
            onClick={() => handleStatCardClick('ps_ratio_status', 'On Track')}
            style={{
              background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>On Track (PS Ratio)</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.projects_on_track_ps || 0}</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>Click to filter</p>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>All Projects ({projects.length})</span>
              {Object.keys(activeFilters).length > 0 && (
                <span style={{ fontSize: '0.9rem', color: '#667eea', fontWeight: 500 }}>
                  Filtered
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleExportToExcel} className="btn btn-success">
                📥 Export to Excel
              </button>
            </div>
          </div>
        </div>

        {!showTable && projects.length > 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Apply a filter or click a statistic card above to view filtered projects.
          </p>
        ) : projects.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No projects found. Create your first project to see analytics!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Project Name</th>
                  <th>Currency</th>
                  <th>Service Value</th>
                  <th>Final Margin %</th>
                  <th>Final Net Revenue (USD)</th>
                  <th>Final EBITA (USD)</th>
                  <th>Final PS Ratio</th>
                  <th>Variance Status</th>
                  <th>Created</th>
                  {user?.role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {projects.map(project => {
                  // Calculate variances
                  const marginVariance = (project.baseline_margin_percent || 0) - (project.baseline_margin_baseline_percent || 0);
                  const netRevenueVariance = (project.net_revenue_usd || 0) - (project.baseline_net_revenue_usd || 0);
                  const ebitaVariance = (project.ebita_usd || 0) - (project.baseline_ebita_usd || 0);
                  const psRatioVariance = (project.ps_ratio || 0) - (project.baseline_ps_ratio || 0);

                  // Determine variance color (positive variance = better performance = green)
                  const getVarianceColor = (variance) => {
                    if (variance >= 0) return '#28a745'; // Green - met or exceeded baseline
                    if (variance >= -5) return '#ffc107'; // Yellow - slightly below
                    return '#dc3545'; // Red - significantly below
                  };

                  const getVarianceIcon = (variance) => {
                    if (variance > 0) return '↑';
                    if (variance < 0) return '↓';
                    return '=';
                  };

                  return (
                    <tr
                      key={project.id}
                      onClick={() => onEditProject && onEditProject(project.id)}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Click to edit project"
                    >
                      <td style={{ fontWeight: 500 }}>{project.client_name}</td>
                      <td>{project.project_name}</td>
                      <td>{project.currency_used}</td>
                      <td>${Math.round(project.local_service_value)?.toLocaleString()}</td>

                      {/* Final Margin with Baseline Comparison */}
                      <td>
                        <div style={{ fontWeight: 600, color: project.baseline_margin_percent >= 40 ? '#28a745' : '#dc3545' }}>
                          {Math.round(project.baseline_margin_percent)}%
                        </div>
                        <div style={{ fontSize: '0.75rem', color: getVarianceColor(marginVariance) }}>
                          {getVarianceIcon(marginVariance)} {Math.abs(Math.round(marginVariance))}% vs baseline
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>
                          (Baseline: {Math.round(project.baseline_margin_baseline_percent)}%)
                        </div>
                      </td>

                      {/* Final Net Revenue with Baseline Comparison */}
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          ${project.net_revenue_usd?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: getVarianceColor(netRevenueVariance) }}>
                          {getVarianceIcon(netRevenueVariance)} ${Math.abs(netRevenueVariance).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>
                          (Baseline: ${project.baseline_net_revenue_usd?.toLocaleString()})
                        </div>
                      </td>

                      {/* Final EBITA with Baseline Comparison */}
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          ${project.ebita_usd?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: getVarianceColor(ebitaVariance) }}>
                          {getVarianceIcon(ebitaVariance)} ${Math.abs(ebitaVariance).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>
                          (Baseline: ${project.baseline_ebita_usd?.toLocaleString()})
                        </div>
                      </td>

                      {/* Final PS Ratio with Baseline Comparison */}
                      <td>
                        <div style={{ fontWeight: 600, color: project.ps_ratio >= 2.0 ? '#28a745' : '#dc3545' }}>
                          {project.ps_ratio?.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: getVarianceColor(psRatioVariance) }}>
                          {getVarianceIcon(psRatioVariance)} {Math.abs(psRatioVariance).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>
                          (Baseline: {project.baseline_ps_ratio?.toFixed(2)})
                        </div>
                      </td>

                      {/* Overall Variance Status Badge */}
                      <td>
                        {marginVariance >= 0 && ebitaVariance >= 0 ? (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: '#d4edda',
                            color: '#155724',
                            border: '1px solid #c3e6cb'
                          }}>
                            ✓ Within/Above Baseline
                          </span>
                        ) : marginVariance >= -5 && ebitaVariance >= -1000 ? (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: '#fff3cd',
                            color: '#856404',
                            border: '1px solid #ffeeba'
                          }}>
                            ⚠ Slightly Below
                          </span>
                        ) : (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            border: '1px solid #f5c6cb'
                          }}>
                            ✗ Below Baseline
                          </span>
                        )}
                      </td>

                      <td>{new Date(project.created_at).toLocaleDateString()}</td>
                      {user?.role === 'admin' && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDeleteProject(project.id, project.project_name)}
                            className="btn btn-danger"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            title="Delete project"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Calculation Reference */}
      <div className="card" style={{ background: '#f8f9fa' }}>
        <div className="card-header">Calculation Reference</div>
        <div style={{ fontSize: '0.875rem' }}>
          <p><strong>Margin %:</strong> (EBITA / Service Value USD) × 100</p>
          <p><strong>Net Revenue:</strong> Service Value USD - COGS (Third Party Costs Only)</p>
          <p><strong>EBITA:</strong> Service Value USD - Total Costs (Internal Resources + Third Party + Non-Bill)</p>
          <p><strong>PS Ratio:</strong> Net Revenue / OPEX (Internal Resource Costs)</p>
          <p><strong>Total Costs:</strong> OPEX + COGS + Non-Bill Hours Cost</p>
          <p><strong>Target Thresholds:</strong> Margin ≥ 40%, PS Ratio ≥ 2.0</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
