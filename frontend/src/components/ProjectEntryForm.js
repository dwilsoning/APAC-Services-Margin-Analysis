import React, { useState, useEffect } from 'react';
import { clientsAPI, projectsAPI, adminRatesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const RESOURCE_TYPES = [
  'Project Director',
  'Project Manager',
  'PMO Assistant',
  'Implementation Consultant',
  'Solution Architect',
  'System Engineer',
  'Platform Technology Consultant',
  'Integration Consultant',
  'Non-APAC Global resources',
  'APAC Global Test Team',
  'APAC Global PS Roles',
  'Domestic Non-APAC Roles'
];

const CURRENCIES = ['USD', 'AUD', 'EUR', 'GBP', 'SGD', 'NZD'];

const ProjectEntryForm = ({ onProjectCreated, editProjectId, onCancelEdit }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [newClientName, setNewClientName] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [costRates, setCostRates] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalProjectData, setOriginalProjectData] = useState(null);

  const [formData, setFormData] = useState({
    client_id: '',
    currency_used: 'USD',
    contract_number: '',
    oracle_id: '',
    project_name: '',
    local_service_value: '',
    baseline_hours: '',
    resources: {}, // Will store { resourceType: { baseline: X, final: Y } }
    third_party_resources: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchClients();
    fetchCostRates();
  }, []);

  useEffect(() => {
    if (editProjectId) {
      loadProjectForEdit(editProjectId);
    } else {
      setIsEditMode(false);
      resetForm();
    }
  }, [editProjectId]);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getClients();
      setClients(response.data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchCostRates = async () => {
    try {
      const response = await adminRatesAPI.getRates();
      const ratesMap = {};
      response.data.forEach(rate => {
        ratesMap[rate.resource_type] = rate.cost_rate_usd;
      });
      setCostRates(ratesMap);
    } catch (err) {
      console.error('Failed to fetch cost rates:', err);
    }
  };

  const loadProjectForEdit = async (projectId) => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProject(projectId);
      const project = response.data;

      setOriginalProjectData(project);
      setIsEditMode(true);

      // Load resources into the format expected by the form
      const resourcesMap = {};
      if (project.resources && project.resources.length > 0) {
        project.resources.forEach(resource => {
          resourcesMap[resource.resource_type] = {
            baseline: resource.baseline_hours || 0,
            final: resource.final_hours || resource.hours || 0
          };
        });
      }

      setFormData({
        client_id: project.client_id,
        currency_used: project.currency_used || 'USD',
        contract_number: project.contract_number || '',
        oracle_id: project.oracle_id || '',
        project_name: project.project_name,
        local_service_value: project.local_service_value,
        baseline_hours: project.baseline_hours,
        resources: resourcesMap,
        third_party_resources: project.third_party_resources || []
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project data');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      currency_used: 'USD',
      contract_number: '',
      oracle_id: '',
      project_name: '',
      local_service_value: '',
      baseline_hours: '',
      resources: {},
      third_party_resources: []
    });
    setOriginalProjectData(null);
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      setError('Client name cannot be empty');
      return;
    }

    try {
      const response = await clientsAPI.createClient({ client_name: newClientName.trim() });
      setClients([...clients, response.data]);
      setFormData({ ...formData, client_id: response.data.id });
      setNewClientName('');
      setShowNewClient(false);
      setSuccess('Client created successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create client');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleResourceHoursChange = (resourceType, field, hours) => {
    setFormData(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        [resourceType]: {
          ...(prev.resources[resourceType] || { baseline: 0, final: 0 }),
          [field]: hours === '' ? 0 : parseFloat(hours)
        }
      }
    }));
  };

  const handleAddThirdPartyResource = () => {
    setFormData(prev => ({
      ...prev,
      third_party_resources: [
        ...prev.third_party_resources,
        { resource_name: '', cost_usd: 0, hours: 0 }
      ]
    }));
  };

  const handleRemoveThirdPartyResource = (index) => {
    setFormData(prev => ({
      ...prev,
      third_party_resources: prev.third_party_resources.filter((_, i) => i !== index)
    }));
  };

  const handleThirdPartyChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      third_party_resources: prev.third_party_resources.map((resource, i) =>
        i === index ? { ...resource, [field]: field === 'resource_name' ? value : parseFloat(value) || 0 } : resource
      )
    }));
  };

  // Calculate total baseline hours from all resource allocations
  const calculateTotalBaselineHours = () => {
    return Object.values(formData.resources).reduce((sum, resource) => {
      return sum + (resource.baseline || 0);
    }, 0);
  };

  // Calculate total final hours from all resource allocations
  const calculateTotalFinalHours = () => {
    return Object.values(formData.resources).reduce((sum, resource) => {
      return sum + (resource.final || 0);
    }, 0);
  };

  // Calculate non-bill hours (total final hours - project baseline hours)
  const calculateNonBillHours = () => {
    const totalFinal = calculateTotalFinalHours();
    const projectBaseline = parseFloat(formData.baseline_hours) || 0;
    const variance = totalFinal - projectBaseline;
    return variance > 0 ? variance : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.client_id) {
      setError('Please select a client');
      return;
    }

    if (!formData.project_name.trim()) {
      setError('Project name is required');
      return;
    }

    if (parseFloat(formData.local_service_value) <= 0) {
      setError('Service value must be greater than 0');
      return;
    }

    if (!formData.baseline_hours || parseFloat(formData.baseline_hours) <= 0) {
      setError('Baseline hours is required');
      return;
    }

    // Convert resources object to array with baseline and final hours
    const resources = Object.entries(formData.resources)
      .filter(([_, resource]) => (resource.baseline > 0 || resource.final > 0))
      .map(([resource_type, resource]) => ({
        resource_type,
        baseline_hours: resource.baseline || 0,
        final_hours: resource.final || 0,
        hours: resource.final || 0 // Use final hours for calculation
      }));

    if (resources.length === 0) {
      setError('Please allocate hours to at least one resource type');
      return;
    }

    // Calculate totals and non-bill hours
    const totalBaselineHours = calculateTotalBaselineHours();
    const totalFinalHours = calculateTotalFinalHours();
    const nonBillHours = calculateNonBillHours();

    // Prepare data
    const projectData = {
      client_id: parseInt(formData.client_id),
      currency_used: formData.currency_used,
      contract_number: formData.contract_number.trim() || null,
      oracle_id: formData.oracle_id.trim() || null,
      project_name: formData.project_name.trim(),
      local_service_value: parseFloat(formData.local_service_value),
      baseline_hours: parseFloat(formData.baseline_hours),
      total_baseline_hours: totalFinalHours, // Total of all final resource hours
      non_bill_hours: nonBillHours, // Calculated from (final - baseline) for each resource
      resources,
      third_party_resources: formData.third_party_resources.filter(r => r.resource_name.trim())
    };

    try {
      setLoading(true);
      let response;

      if (isEditMode && editProjectId) {
        // Update existing project
        response = await projectsAPI.updateProject(editProjectId, projectData);
        setSuccess('Project updated successfully! Navigating to Analytics Dashboard...');
      } else {
        // Create new project
        response = await projectsAPI.createProject(projectData);
        setSuccess('Project created successfully! Navigating to Analytics Dashboard...');
      }

      // Reset form
      resetForm();
      setLoading(false);

      // Notify parent component to switch to analytics view
      setTimeout(() => {
        if (onProjectCreated && response.data?.id) {
          onProjectCreated(response.data.id);
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} project`);
      setLoading(false);
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="project-entry-form">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {isEditMode && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Edit Mode:</strong> You are editing "{originalProjectData?.project_name}"
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              if (onCancelEdit) onCancelEdit();
            }}
            className="btn btn-secondary"
          >
            Cancel Edit
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Project Information */}
        <div className="card">
          <div className="card-header">{isEditMode ? 'Edit Project Information' : 'Project Information'}</div>

          <div className="form-group">
            <label>Client *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="form-control"
                required
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.client_name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewClient(!showNewClient)}
                className="btn btn-secondary"
              >
                {showNewClient ? 'Cancel' : '+ New'}
              </button>
            </div>

            {showNewClient && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="New client name"
                  className="form-control"
                />
                <button
                  type="button"
                  onClick={handleCreateClient}
                  className="btn btn-success"
                >
                  Create
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Currency Used *</label>
              <select
                value={formData.currency_used}
                onChange={(e) => setFormData({ ...formData, currency_used: e.target.value })}
                className="form-control"
                required
              >
                {CURRENCIES.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Local Service Value *</label>
              <input
                type="text"
                value={formData.local_service_value ? parseFloat(formData.local_service_value).toLocaleString('en-US') : ''}
                onChange={(e) => {
                  // Remove commas and parse the number
                  const value = e.target.value.replace(/,/g, '');
                  setFormData({ ...formData, local_service_value: value });
                }}
                onBlur={(e) => {
                  // Ensure it's a valid number on blur
                  const value = e.target.value.replace(/,/g, '');
                  if (value && !isNaN(value)) {
                    setFormData({ ...formData, local_service_value: parseFloat(value).toString() });
                  }
                }}
                className="form-control"
                placeholder="e.g., 100,000"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              className="form-control"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Contract Number</label>
              <input
                type="text"
                value={formData.contract_number}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Oracle ID</label>
              <input
                type="text"
                value={formData.oracle_id}
                onChange={(e) => setFormData({ ...formData, oracle_id: e.target.value })}
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Baseline Hours (Budgeted) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.baseline_hours}
              onChange={(e) => setFormData({ ...formData, baseline_hours: e.target.value })}
              className="form-control"
              required
              placeholder="Enter contracted/budgeted hours"
            />
            <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
              The total hours contracted or budgeted for this project
            </small>
          </div>

          {/* Summary Display */}
          {formData.baseline_hours && (
            <div style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px',
              marginTop: '1rem',
              border: calculateNonBillHours() > 0 ? '2px solid #ffc107' : '2px solid #28a745'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <strong>Project Baseline:</strong>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                    {parseFloat(formData.baseline_hours).toFixed(2)}
                  </div>
                  <small style={{ color: '#666' }}>Total budgeted</small>
                </div>
                <div>
                  <strong>Resource Baseline:</strong>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6c757d' }}>
                    {calculateTotalBaselineHours().toFixed(2)}
                  </div>
                  <small style={{ color: '#666' }}>Sum of baselines</small>
                </div>
                <div>
                  <strong>Final Hours:</strong>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: calculateTotalFinalHours() > parseFloat(formData.baseline_hours) ? '#dc3545' : '#28a745' }}>
                    {calculateTotalFinalHours().toFixed(2)}
                  </div>
                  <small style={{ color: '#666' }}>Actual used</small>
                </div>
                <div>
                  <strong>Non-Bill Hours:</strong>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: calculateNonBillHours() > 0 ? '#ffc107' : '#28a745' }}>
                    {calculateNonBillHours().toFixed(2)}
                  </div>
                  {calculateNonBillHours() > 0 ? (
                    <small style={{ color: '#856404' }}>
                      ⚠️ Over by {calculateNonBillHours().toFixed(2)} hrs
                    </small>
                  ) : (
                    <small style={{ color: '#28a745' }}>
                      ✓ Within budget
                    </small>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resource Allocation */}
        <div className="card">
          <div className="card-header">Resource Allocation (Hours)</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {RESOURCE_TYPES.map(resourceType => (
              <div key={resourceType} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem', background: '#f8f9fa' }}>
                <div style={{ marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#333' }}>
                  {resourceType}
                  {user?.role === 'admin' && costRates[resourceType] !== undefined && (
                    <span style={{ color: '#667eea', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                      (${costRates[resourceType]}/hr)
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.875rem', color: '#666' }}>Baseline Hours</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.resources[resourceType]?.baseline === 0 ? '' : formData.resources[resourceType]?.baseline || ''}
                      onChange={(e) => handleResourceHoursChange(resourceType, 'baseline', e.target.value)}
                      className="form-control"
                      placeholder="Budgeted hours"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.875rem', color: '#666' }}>Final/Actual Hours</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.resources[resourceType]?.final === 0 ? '' : formData.resources[resourceType]?.final || ''}
                      onChange={(e) => handleResourceHoursChange(resourceType, 'final', e.target.value)}
                      className="form-control"
                      placeholder="Actual hours used"
                      style={{
                        borderColor: (formData.resources[resourceType]?.final || 0) > (formData.resources[resourceType]?.baseline || 0) ? '#ffc107' : '#ddd'
                      }}
                    />
                  </div>
                </div>
                {(formData.resources[resourceType]?.final || 0) > (formData.resources[resourceType]?.baseline || 0) && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#856404', background: '#fff3cd', padding: '0.5rem', borderRadius: '4px' }}>
                    ⚠️ Variance: {((formData.resources[resourceType]?.final || 0) - (formData.resources[resourceType]?.baseline || 0)).toFixed(2)} hours over baseline
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Third Party Resources */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Third Party Resources</span>
              <button type="button" onClick={handleAddThirdPartyResource} className="btn btn-secondary">
                + Add Third Party Resource
              </button>
            </div>
          </div>

          {formData.third_party_resources.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>
              No third-party resources added. Click the button above to add one.
            </p>
          ) : (
            formData.third_party_resources.map((resource, index) => (
              <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label>Resource Name</label>
                  <input
                    type="text"
                    value={resource.resource_name}
                    onChange={(e) => handleThirdPartyChange(index, 'resource_name', e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Cost (USD)</label>
                  <input
                    type="text"
                    value={resource.cost_usd ? parseFloat(resource.cost_usd).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      handleThirdPartyChange(index, 'cost_usd', value);
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      if (value && !isNaN(value)) {
                        handleThirdPartyChange(index, 'cost_usd', parseFloat(value));
                      }
                    }}
                    className="form-control"
                    placeholder="e.g., 10,000"
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={resource.hours}
                    onChange={(e) => handleThirdPartyChange(index, 'hours', e.target.value)}
                    className="form-control"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveThirdPartyResource(index)}
                  className="btn btn-danger"
                  style={{ marginBottom: 0 }}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {/* Submit Button */}
        <div style={{ textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '200px' }}>
            {loading
              ? (isEditMode ? 'Updating Project...' : 'Creating Project...')
              : (isEditMode ? '✓ Update Project' : '✓ Create Project')
            }
          </button>
          {isEditMode && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                if (onCancelEdit) onCancelEdit();
              }}
              className="btn btn-secondary"
              disabled={loading}
              style={{ minWidth: '150px' }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProjectEntryForm;
