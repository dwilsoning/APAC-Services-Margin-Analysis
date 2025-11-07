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
} from '@mui/material';
import { financialDataApi, projectsApi } from '../services/api';

interface FinancialDataFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  financialDataId?: number | null;
}

interface Project {
  id: number;
  project_name: string;
  client_name: string;
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

const FinancialDataForm: React.FC<FinancialDataFormProps> = ({
  open,
  onClose,
  onSuccess,
  financialDataId,
}) => {
  const [formData, setFormData] = useState({
    project_id: '',
    period_month: '',
    period_year: new Date().getFullYear().toString(),
    revenue: '',
    cost_of_goods_sold: '',
    operating_expenses: '',
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate margins in real-time
  const revenue = parseFloat(formData.revenue) || 0;
  const cogs = parseFloat(formData.cost_of_goods_sold) || 0;
  const opex = parseFloat(formData.operating_expenses) || 0;
  const grossMargin = revenue - cogs;
  const grossMarginPercent = revenue !== 0 ? (grossMargin / revenue) * 100 : 0;
  const netMargin = revenue - cogs - opex;
  const netMarginPercent = revenue !== 0 ? (netMargin / revenue) * 100 : 0;

  useEffect(() => {
    if (open) {
      loadProjects();
      if (financialDataId) {
        loadFinancialData(financialDataId);
      } else {
        resetForm();
      }
    }
  }, [financialDataId, open]);

  const loadProjects = async () => {
    try {
      const response = await projectsApi.getAll();
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadFinancialData = async (id: number) => {
    try {
      setLoading(true);
      const response = await financialDataApi.getAll();
      const data = response.data.find((item: any) => item.id === id);
      if (data) {
        setFormData({
          project_id: data.project_id,
          period_month: data.period_month,
          period_year: data.period_year.toString(),
          revenue: data.revenue?.toString() || '',
          cost_of_goods_sold: data.cost_of_goods_sold?.toString() || '',
          operating_expenses: data.operating_expenses?.toString() || '',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      period_month: '',
      period_year: new Date().getFullYear().toString(),
      revenue: '',
      cost_of_goods_sold: '',
      operating_expenses: '',
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
        project_id: parseInt(formData.project_id as string),
        period_month: parseInt(formData.period_month as string),
        period_year: parseInt(formData.period_year),
        revenue: parseFloat(formData.revenue) || 0,
        cost_of_goods_sold: parseFloat(formData.cost_of_goods_sold) || 0,
        operating_expenses: parseFloat(formData.operating_expenses) || 0,
      };

      if (financialDataId) {
        await financialDataApi.update(financialDataId, submitData);
      } else {
        await financialDataApi.create(submitData);
      }
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save financial data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {financialDataId ? 'Edit Financial Data' : 'Add Financial Data'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
            <Typography variant="subtitle2" color="text.secondary">
              Financial Information
            </Typography>

            <TextField
              label="Revenue"
              name="revenue"
              type="number"
              value={formData.revenue}
              onChange={handleChange}
              fullWidth
              inputProps={{ step: '0.01', min: 0 }}
              helperText="Total revenue for the period"
            />

            <TextField
              label="Cost of Goods Sold (COGS)"
              name="cost_of_goods_sold"
              type="number"
              value={formData.cost_of_goods_sold}
              onChange={handleChange}
              fullWidth
              inputProps={{ step: '0.01', min: 0 }}
              helperText="Direct costs attributable to production"
            />

            <TextField
              label="Operating Expenses"
              name="operating_expenses"
              type="number"
              value={formData.operating_expenses}
              onChange={handleChange}
              fullWidth
              inputProps={{ step: '0.01', min: 0 }}
              helperText="Indirect costs (admin, sales, etc.)"
            />

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Calculated Margins (Preview)
            </Typography>

            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Gross Margin:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${grossMargin.toFixed(2)} ({grossMarginPercent.toFixed(2)}%)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Net Margin:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${netMargin.toFixed(2)} ({netMarginPercent.toFixed(2)}%)
                </Typography>
              </Box>
            </Box>

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

export default FinancialDataForm;
