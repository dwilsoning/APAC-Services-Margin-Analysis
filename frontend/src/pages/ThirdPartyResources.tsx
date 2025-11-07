import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { thirdPartyResourcesApi } from '../services/api';

interface ThirdPartyResource {
  id: number;
  resource_name: string;
  company_name: string;
  daily_rate: string;
  currency: string;
  cost_category: string;
  resource_type: string;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

const CURRENCIES = ['USD', 'AUD', 'EUR', 'GBP', 'INR', 'SGD', 'CNY', 'JPY'];
const RESOURCE_TYPES = [
  'Developer',
  'Consultant',
  'Architect',
  'Designer',
  'Tester',
  'Project Manager',
  'Business Analyst',
  'Technical Writer',
  'Other',
];

const ThirdPartyResources: React.FC = () => {
  const [resources, setResources] = useState<ThirdPartyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ThirdPartyResource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    resource_name: '',
    company_name: '',
    daily_rate: '',
    currency: 'USD',
    resource_type: '',
    notes: '',
  });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await thirdPartyResourcesApi.getAll();
      setResources(response.data);
    } catch (err) {
      setError('Failed to load third party resources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedResource(null);
    setFormData({
      resource_name: '',
      company_name: '',
      daily_rate: '',
      currency: 'USD',
      resource_type: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (resource: ThirdPartyResource) => {
    setSelectedResource(resource);
    setFormData({
      resource_name: resource.resource_name,
      company_name: resource.company_name || '',
      daily_rate: resource.daily_rate,
      currency: resource.currency,
      resource_type: resource.resource_type || '',
      notes: resource.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const submitData = {
        ...formData,
        daily_rate: parseFloat(formData.daily_rate),
      };

      if (selectedResource) {
        await thirdPartyResourcesApi.update(selectedResource.id, submitData);
        setSuccess(`Resource "${formData.resource_name}" updated successfully`);
      } else {
        await thirdPartyResourcesApi.create(submitData);
        setSuccess(`Resource "${formData.resource_name}" created successfully`);
      }

      setDialogOpen(false);
      loadResources();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save resource');
    }
  };

  const handleDeactivate = async (resource: ThirdPartyResource) => {
    if (!window.confirm(`Are you sure you want to deactivate "${resource.resource_name}"?`)) {
      return;
    }

    try {
      await thirdPartyResourcesApi.deactivate(resource.id);
      setSuccess(`Resource "${resource.resource_name}" deactivated successfully`);
      loadResources();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to deactivate resource');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Third-Party Resources
            </Typography>
            <Typography variant="body2" color="text.secondary">
              External contractors and vendors (COGS). Rates are per day.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ bgcolor: '#707CF1' }}
          >
            Add Resource
          </Button>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#707CF1' }}>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Resource Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Company</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">
                  Daily Rate
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : resources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No third-party resources found. Click "Add Resource" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                resources.map((resource) => (
                  <TableRow key={resource.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{resource.resource_name}</TableCell>
                    <TableCell>{resource.company_name || 'N/A'}</TableCell>
                    <TableCell>{resource.resource_type || 'N/A'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#DC2626' }}>
                      {resource.currency} {parseFloat(resource.daily_rate).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip label={resource.cost_category} size="small" color="error" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={resource.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={resource.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(resource)}
                        title="Edit Resource"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {resource.is_active && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeactivate(resource)}
                          title="Deactivate Resource"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#FEF2F2', borderRadius: 1, borderLeft: '4px solid #DC2626' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#DC2626' }}>
            About Third-Party Resources (COGS)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Third-party resources are external contractors or vendors whose costs are classified as
            <strong> Cost of Goods Sold (COGS)</strong>. These are different from Altera staff roles (OPEX).
            Daily rates can be in any currency and will be converted to USD for COGS calculations.
          </Typography>
        </Box>
      </Paper>

      {/* Add/Edit Resource Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#707CF1', color: 'white' }}>
          {selectedResource ? 'Edit Third-Party Resource' : 'Add Third-Party Resource'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Resource Name"
              name="resource_name"
              value={formData.resource_name}
              onChange={handleChange}
              fullWidth
              required
              helperText="e.g., John Smith"
            />
            <TextField
              label="Company Name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              fullWidth
              helperText="Optional: Name of contracting company"
            />
            <TextField
              select
              label="Resource Type"
              name="resource_type"
              value={formData.resource_type}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {RESOURCE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Daily Rate"
                name="daily_rate"
                type="number"
                value={formData.daily_rate}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ step: '0.01', min: 0 }}
              />
              <TextField
                select
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                sx={{ minWidth: 120 }}
              >
                {CURRENCIES.map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              helperText="Optional: Additional information about this resource"
            />
            <Alert severity="info" sx={{ mt: 1 }}>
              This resource will be classified as <strong>COGS (Cost of Goods Sold)</strong> for
              financial reporting.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedResource ? 'Save Changes' : 'Add Resource'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ThirdPartyResources;
