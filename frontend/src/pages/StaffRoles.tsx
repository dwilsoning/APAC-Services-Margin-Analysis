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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { staffRolesApi } from '../services/api';

interface StaffRole {
  id: number;
  role_name: string;
  hourly_rate_usd: string;
  is_active: boolean;
  cost_category: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface RateHistory {
  id: number;
  old_rate: string;
  new_rate: string;
  changed_by_name: string;
  change_date: string;
  reason: string;
}

const StaffRoles: React.FC = () => {
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null);
  const [rateHistory, setRateHistory] = useState<RateHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedDescription, setExpandedDescription] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    role_name: '',
    hourly_rate_usd: '',
    description: '',
    reason: '',
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await staffRolesApi.getAll();
      setRoles(response.data);
    } catch (err) {
      setError('Failed to load staff roles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: StaffRole) => {
    setSelectedRole(role);
    setFormData({
      role_name: role.role_name,
      hourly_rate_usd: role.hourly_rate_usd,
      description: role.description || '',
      reason: '',
    });
    setEditDialogOpen(true);
  };

  const handleViewHistory = async (role: StaffRole) => {
    setSelectedRole(role);
    try {
      const response = await staffRolesApi.getHistory(role.id);
      setRateHistory(response.data);
      setHistoryDialogOpen(true);
    } catch (err) {
      setError('Failed to load rate history');
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!selectedRole) return;

    try {
      await staffRolesApi.update(selectedRole.id, {
        ...formData,
        hourly_rate_usd: parseFloat(formData.hourly_rate_usd),
        is_active: true,
        changed_by: 1, // TODO: Replace with actual user ID when auth is implemented
      });

      setSuccess(`Role "${selectedRole.role_name}" updated successfully`);
      setEditDialogOpen(false);
      loadRoles();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Staff Roles & Hourly Rates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All roles are OPEX (Altera staff). Rates are in USD per hour.
            </Typography>
          </Box>
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
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Role Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">
                  Hourly Rate (USD)
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No roles found
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <React.Fragment key={role.id}>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 500 }}>{role.role_name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#707CF1' }}>
                        ${parseFloat(role.hourly_rate_usd).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip label={role.cost_category} size="small" color="primary" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Box>
                          {role.description && role.description.length > 50 ? (
                            <>
                              <Typography variant="body2">
                                {expandedDescription === role.id
                                  ? role.description
                                  : `${role.description.substring(0, 50)}...`}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setExpandedDescription(
                                    expandedDescription === role.id ? null : role.id
                                  )
                                }
                              >
                                {expandedDescription === role.id ? (
                                  <ExpandLessIcon fontSize="small" />
                                ) : (
                                  <ExpandMoreIcon fontSize="small" />
                                )}
                              </IconButton>
                            </>
                          ) : (
                            <Typography variant="body2">{role.description || 'N/A'}</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={role.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={role.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(role)}
                          title="Edit Role"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleViewHistory(role)}
                          title="View Rate History"
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#707CF1', color: 'white' }}>
          Edit Role: {selectedRole?.role_name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Role Name"
              name="role_name"
              value={formData.role_name}
              onChange={handleChange}
              fullWidth
              disabled
              helperText="Role name cannot be changed"
            />
            <TextField
              label="Hourly Rate (USD)"
              name="hourly_rate_usd"
              type="number"
              value={formData.hourly_rate_usd}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ step: '0.01', min: 0 }}
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Reason for Change"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              helperText="Optional: Explain why the rate is being changed"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rate History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#707CF1', color: 'white' }}>
          Rate Change History: {selectedRole?.role_name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {rateHistory.length === 0 ? (
            <Typography>No rate changes recorded for this role.</Typography>
          ) : (
            <List>
              {rateHistory.map((entry) => (
                <ListItem key={entry.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">
                          <strong>${parseFloat(entry.old_rate).toFixed(2)}</strong> →{' '}
                          <strong style={{ color: '#707CF1' }}>
                            ${parseFloat(entry.new_rate).toFixed(2)}
                          </strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(entry.change_date)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {entry.changed_by_name && (
                          <Typography variant="body2">
                            Changed by: {entry.changed_by_name}
                          </Typography>
                        )}
                        {entry.reason && (
                          <Typography variant="body2" color="text.secondary">
                            Reason: {entry.reason}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffRoles;
