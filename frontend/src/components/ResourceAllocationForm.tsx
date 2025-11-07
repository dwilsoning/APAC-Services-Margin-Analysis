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
  Typography,
  Divider,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
} from '@mui/material';
import { projectResourcesApi, projectsApi, staffRolesApi, thirdPartyResourcesApi } from '../services/api';

interface ResourceAllocationFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resourceId?: number | null;
}

interface Project {
  id: number;
  project_name: string;
  client_name: string;
}

interface StaffRole {
  id: number;
  role_name: string;
  hourly_rate_usd: string;
}

interface ThirdPartyResource {
  id: number;
  resource_name: string;
  company_name: string;
  daily_rate: string;
  currency: string;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const ResourceAllocationForm: React.FC<ResourceAllocationFormProps> = ({
  open,
  onClose,
  onSuccess,
  resourceId,
}) => {
  const [formData, setFormData] = useState({
    project_id: '',
    period_month: '',
    period_year: new Date().getFullYear().toString(),
    resource_type: 'staff', // 'staff' or 'third_party'
    staff_role_id: '',
    staff_hours: '',
    third_party_resource_id: '',
    third_party_hours: '',
    notes: '',
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [staffRoles, setStaffRoles] = useState<StaffRole[]>([]);
  const [thirdPartyResources, setThirdPartyResources] = useState<ThirdPartyResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate estimated cost
  const calculateEstimatedCost = () => {
    if (formData.resource_type === 'staff' && formData.staff_role_id && formData.staff_hours) {
      const role = staffRoles.find(r => r.id === parseInt(formData.staff_role_id));
      if (role) {
        const cost = parseFloat(role.hourly_rate_usd) * parseFloat(formData.staff_hours);
        return { cost, currency: 'USD', category: 'OPEX', rate: parseFloat(role.hourly_rate_usd), unit: 'hour' };
      }
    } else if (formData.resource_type === 'third_party' && formData.third_party_resource_id && formData.third_party_hours) {
      const resource = thirdPartyResources.find(r => r.id === parseInt(formData.third_party_resource_id));
      if (resource) {
        const days = parseFloat(formData.third_party_hours) / 8;
        const cost = parseFloat(resource.daily_rate) * days;
        return { cost, currency: resource.currency, category: 'COGS', rate: parseFloat(resource.daily_rate), unit: 'day' };
      }
    }
    return null;
  };

  const estimatedCost = calculateEstimatedCost();

  useEffect(() => {
    if (open) {
      loadData();
      if (!resourceId) {
        resetForm();
      }
    }
  }, [resourceId, open]);

  const loadData = async () => {
    try {
      const [projectsRes, staffRolesRes, thirdPartyRes] = await Promise.all([
        projectsApi.getAll(),
        staffRolesApi.getAll(true),
        thirdPartyResourcesApi.getAll(true),
      ]);
      setProjects(projectsRes.data);
      setStaffRoles(staffRolesRes.data);
      setThirdPartyResources(thirdPartyRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      period_month: '',
      period_year: new Date().getFullYear().toString(),
      resource_type: 'staff',
      staff_role_id: '',
      staff_hours: '',
      third_party_resource_id: '',
      third_party_hours: '',
      notes: '',
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

  const handleResourceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      resource_type: e.target.value,
      staff_role_id: '',
      staff_hours: '',
      third_party_resource_id: '',
      third_party_hours: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData: any = {
        project_id: parseInt(formData.project_id),
        period_month: parseInt(formData.period_month),
        period_year: parseInt(formData.period_year),
        notes: formData.notes,
      };

      if (formData.resource_type === 'staff') {
        submitData.staff_role_id = parseInt(formData.staff_role_id);
        submitData.staff_hours = parseFloat(formData.staff_hours);
      } else {
        submitData.third_party_resource_id = parseInt(formData.third_party_resource_id);
        submitData.third_party_hours = parseFloat(formData.third_party_hours);
      }

      if (resourceId) {
        await projectResourcesApi.update(resourceId, submitData);
      } else {
        await projectResourcesApi.create(submitData);
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save resource allocation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#707CF1', color: 'white', fontWeight: 600 }}>
        {resourceId ? 'Edit Resource Allocation' : 'Allocate Resource to Project'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Project Selection */}
            <FormControl fullWidth required>
              <InputLabel>Project</InputLabel>
              <Select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange as any}
                label="Project"
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.client_name} - {project.project_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Period Selection */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Month</InputLabel>
                <Select
                  name="period_month"
                  value={formData.period_month}
                  onChange={handleChange as any}
                  label="Month"
                >
                  {MONTHS.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Year"
                name="period_year"
                type="number"
                value={formData.period_year}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ min: 2000, max: 2100 }}
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Resource Type Selection */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Resource Type
              </Typography>
              <RadioGroup
                row
                name="resource_type"
                value={formData.resource_type}
                onChange={handleResourceTypeChange}
              >
                <FormControlLabel
                  value="staff"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>Altera Staff</span>
                      <Chip label="OPEX" size="small" color="primary" />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="third_party"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>Third-Party Resource</span>
                      <Chip label="COGS" size="small" color="error" />
                    </Box>
                  }
                />
              </RadioGroup>
            </Box>

            {/* Staff Resource Fields */}
            {formData.resource_type === 'staff' && (
              <>
                <FormControl fullWidth required>
                  <InputLabel>Staff Role</InputLabel>
                  <Select
                    name="staff_role_id"
                    value={formData.staff_role_id}
                    onChange={handleChange as any}
                    label="Staff Role"
                  >
                    {staffRoles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.role_name} - ${parseFloat(role.hourly_rate_usd).toFixed(2)}/hr
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Hours Allocated"
                  name="staff_hours"
                  type="number"
                  value={formData.staff_hours}
                  onChange={handleChange}
                  fullWidth
                  required
                  inputProps={{ step: '0.5', min: 0 }}
                  helperText="Total hours worked in this period"
                />
              </>
            )}

            {/* Third-Party Resource Fields */}
            {formData.resource_type === 'third_party' && (
              <>
                <FormControl fullWidth required>
                  <InputLabel>Third-Party Resource</InputLabel>
                  <Select
                    name="third_party_resource_id"
                    value={formData.third_party_resource_id}
                    onChange={handleChange as any}
                    label="Third-Party Resource"
                  >
                    {thirdPartyResources.map((resource) => (
                      <MenuItem key={resource.id} value={resource.id}>
                        {resource.resource_name}
                        {resource.company_name && ` (${resource.company_name})`} -{' '}
                        {resource.currency} {parseFloat(resource.daily_rate).toFixed(2)}/day
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Hours Allocated"
                  name="third_party_hours"
                  type="number"
                  value={formData.third_party_hours}
                  onChange={handleChange}
                  fullWidth
                  required
                  inputProps={{ step: '0.5', min: 0 }}
                  helperText="Total hours worked in this period (8 hours = 1 day)"
                />
              </>
            )}

            <TextField
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              helperText="Optional: Additional information about this allocation"
            />

            {/* Cost Preview */}
            {estimatedCost && (
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Cost Estimate
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Rate: {estimatedCost.currency} {estimatedCost.rate.toFixed(2)} per {estimatedCost.unit}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hours: {formData.resource_type === 'staff' ? formData.staff_hours : formData.third_party_hours}
                      {formData.resource_type === 'third_party' && ` (${(parseFloat(formData.third_party_hours) / 8).toFixed(2)} days)`}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={estimatedCost.category}
                      size="small"
                      color={estimatedCost.category === 'OPEX' ? 'primary' : 'error'}
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#707CF1' }}>
                      {estimatedCost.currency} {estimatedCost.cost.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Allocation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ResourceAllocationForm;
