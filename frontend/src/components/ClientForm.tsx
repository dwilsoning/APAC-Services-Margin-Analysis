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
} from '@mui/material';
import { clientsApi } from '../services/api';

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId?: number | null;
}

const REGIONS = [
  'Asia Pacific',
  'North Asia',
  'South Asia',
  'Southeast Asia',
  'Oceania',
  'Other',
];

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Telecommunications',
  'Energy',
  'Education',
  'Government',
  'Other',
];

const ClientForm: React.FC<ClientFormProps> = ({ open, onClose, onSuccess, clientId }) => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_code: '',
    region: '',
    industry: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadClient(clientId);
    } else {
      resetForm();
    }
  }, [clientId, open]);

  const loadClient = async (id: number) => {
    try {
      setLoading(true);
      const response = await clientsApi.getById(id);
      setFormData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_code: '',
      region: '',
      industry: '',
    });
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (clientId) {
        await clientsApi.update(clientId, formData);
      } else {
        await clientsApi.create(formData);
      }
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{clientId ? 'Edit Client' : 'Add New Client'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Client Name"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Client Code"
              name="client_code"
              value={formData.client_code}
              onChange={handleChange}
              fullWidth
              helperText="Optional unique identifier"
            />
            <TextField
              select
              label="Region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {REGIONS.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {INDUSTRIES.map((industry) => (
                <MenuItem key={industry} value={industry}>
                  {industry}
                </MenuItem>
              ))}
            </TextField>
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

export default ClientForm;
