import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { projectsApi, clientsApi } from '../services/api';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId?: number | null;
}

interface Client {
  id: number;
  client_name: string;
}

const PROJECT_STATUSES = ['active', 'completed', 'on-hold', 'cancelled'];

const ProjectForm: React.FC<ProjectFormProps> = ({ open, onClose, onSuccess, projectId }) => {
  const [formData, setFormData] = useState({
    client_id: '',
    project_name: '',
    project_code: '',
    start_date: '',
    end_date: '',
    status: 'active',
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadClients();
      if (projectId) {
        loadProject(projectId);
      } else {
        resetForm();
      }
    }
  }, [projectId, open]);

  const loadClients = async () => {
    try {
      const response = await clientsApi.getAll();
      setClients(response.data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  const loadProject = async (id: number) => {
    try {
      setLoading(true);
      const response = await projectsApi.getById(id);
      const project = response.data;
      setFormData({
        client_id: project.client_id,
        project_name: project.project_name,
        project_code: project.project_code || '',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        status: project.status || 'active',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      project_name: '',
      project_code: '',
      start_date: '',
      end_date: '',
      status: 'active',
    });
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        client_id: parseInt(formData.client_id as string),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (projectId) {
        await projectsApi.update(projectId, submitData);
      } else {
        await projectsApi.create(submitData);
      }
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{projectId ? 'Edit Project' : 'Add New Project'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Client</InputLabel>
              <Select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange as any}
                label="Client"
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.client_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Project Name"
              name="project_name"
              value={formData.project_name}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Project Code"
              name="project_code"
              value={formData.project_code}
              onChange={handleChange}
              fullWidth
              helperText="Optional unique identifier"
            />
            <TextField
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange as any}
                label="Status"
              >
                {PROJECT_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {error && (
              <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>
                {error}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProjectForm;
