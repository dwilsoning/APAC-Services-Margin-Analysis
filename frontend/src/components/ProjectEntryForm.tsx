import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Typography,
  Box,
  Divider,
  Alert,
  Autocomplete,
} from '@mui/material';
import { staffRolesApi, projectEntryApi } from '../services/api';
import axios from 'axios';

interface ProjectEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: any;
}

interface StaffRole {
  id: number;
  role_name: string;
  hourly_rate_usd: string;
}

interface Client {
  id: number;
  client_name: string;
  client_code?: string;
  region?: string;
  industry?: string;
}

const CURRENCIES = ['USD', 'AUD', 'EUR', 'GBP', 'INR', 'SGD', 'CNY', 'JPY'];

const ProjectEntryForm: React.FC<ProjectEntryFormProps> = ({ open, onClose, onSuccess, project }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    currency: 'USD',
    contract_number: '',
    oracle_id: '',
    project_name: '',
    local_services_value: '',
    baseline_hours: '',
    local_fair_services_value: '',
    total_non_bill_hours: '',
    closure_date: '',
  });

  const [staffRoles, setStaffRoles] = useState<StaffRole[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientInputValue, setClientInputValue] = useState('');
  const [resourceHours, setResourceHours] = useState<{ [key: number]: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadStaffRoles();
      loadClients();
      if (project) {
        // Populate form with existing project data
        setFormData({
          client_name: project.client_name || '',
          currency: project.currency || 'USD',
          contract_number: project.contract_number || '',
          oracle_id: project.oracle_id || '',
          project_name: project.project_name || '',
          local_services_value: project.local_services_value || '',
          baseline_hours: project.baseline_hours || '',
          local_fair_services_value: project.local_fair_services_value || '',
          total_non_bill_hours: project.total_non_bill_hours || '',
          closure_date: project.closure_date || '',
        });
        setClientInputValue(project.client_name || '');
      } else {
        resetForm();
      }
    }
  }, [open, project]);

  const loadStaffRoles = async () => {
    try {
      const response = await staffRolesApi.getAll(true);
      setStaffRoles(response.data);
      // Initialize resource hours to empty strings
      const hours: { [key: number]: string } = {};
      response.data.forEach((role: StaffRole) => {
        hours[role.id] = '';
      });
      setResourceHours(hours);
    } catch (err) {
      console.error('Error loading staff roles:', err);
      setError('Failed to load staff roles');
    }
  };

  const loadClients = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${API_URL}/api/clients`);
      setClients(response.data);
    } catch (err) {
      console.error('Error loading clients:', err);
      // Don't set error - clients list is optional
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      currency: 'USD',
      contract_number: '',
      oracle_id: '',
      project_name: '',
      local_services_value: '',
      baseline_hours: '',
      local_fair_services_value: '',
      total_non_bill_hours: '',
      closure_date: '',
    });
    setSelectedClient(null);
    setClientInputValue('');
    const hours: { [key: number]: string } = {};
    staffRoles.forEach((role) => {
      hours[role.id] = '';
    });
    setResourceHours(hours);
    setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleResourceHoursChange = (roleId: number, value: string) => {
    setResourceHours({
      ...resourceHours,
      [roleId]: value,
    });
  };

  const handleClientChange = async (event: any, newValue: string | Client | null) => {
    if (typeof newValue === 'string') {
      // User typed a new client name
      const trimmedValue = newValue.trim();
      if (trimmedValue) {
        // Check if this client already exists in our list
        const existingClient = clients.find(
          c => c.client_name.toLowerCase() === trimmedValue.toLowerCase()
        );

        if (existingClient) {
          setSelectedClient(existingClient);
          setFormData({ ...formData, client_name: existingClient.client_name });
        } else {
          // Create new client automatically
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const response = await axios.post(`${API_URL}/api/clients`, {
              client_name: trimmedValue,
            });
            const newClient = response.data;
            setClients([...clients, newClient]);
            setSelectedClient(newClient);
            setFormData({ ...formData, client_name: newClient.client_name });
          } catch (err) {
            console.error('Error creating client:', err);
            setError('Failed to create new client');
          }
        }
      }
    } else if (newValue && typeof newValue === 'object') {
      // User selected an existing client from dropdown
      setSelectedClient(newValue);
      setFormData({ ...formData, client_name: newValue.client_name });
    } else {
      // Cleared selection
      setSelectedClient(null);
      setFormData({ ...formData, client_name: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare the data payload
      const payload = {
        ...formData,
        resource_hours: resourceHours,
      };

      // Submit to API
      if (project) {
        await projectEntryApi.update(project.id, payload);
      } else {
        await projectEntryApi.create(payload);
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Error saving project:', err);
      setError(err.response?.data?.error || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {project ? 'Edit Project Entry' : 'New Project Entry'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
            Project Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={clients}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : option.client_name
                }
                value={selectedClient}
                inputValue={clientInputValue}
                onInputChange={(event, newInputValue) => {
                  setClientInputValue(newInputValue);
                }}
                onChange={handleClientChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Client Name"
                    helperText="Select existing or type new client name"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                {CURRENCIES.map((curr) => (
                  <MenuItem key={curr} value={curr}>
                    {curr}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Contract Number"
                name="contract_number"
                value={formData.contract_number}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Oracle ID"
                name="oracle_id"
                value={formData.oracle_id}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Project Name"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Local Services Value"
                name="local_services_value"
                value={formData.local_services_value}
                onChange={handleChange}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Baseline Hours"
                name="baseline_hours"
                value={formData.baseline_hours}
                onChange={handleChange}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Local Fair Services Value"
                name="local_fair_services_value"
                value={formData.local_fair_services_value}
                onChange={handleChange}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Total Non-Bill Hours Added"
                name="total_non_bill_hours"
                value={formData.total_non_bill_hours}
                onChange={handleChange}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Closure Date"
                name="closure_date"
                value={formData.closure_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Resource Hours
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Enter the number of hours for each resource role (leave blank if not applicable)
          </Typography>

          <Grid container spacing={2}>
            {staffRoles.map((role) => (
              <Grid item xs={12} sm={6} key={role.id}>
                <TextField
                  fullWidth
                  type="number"
                  label={role.role_name}
                  value={resourceHours[role.id] || ''}
                  onChange={(e) => handleResourceHoursChange(role.id, e.target.value)}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : project ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProjectEntryForm;
