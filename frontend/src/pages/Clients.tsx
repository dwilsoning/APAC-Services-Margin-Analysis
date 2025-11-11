import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Client {
  id: number;
  client_name: string;
  client_code?: string;
  region?: string;
  industry?: string;
  created_at: string;
  updated_at: string;
}

interface DeleteDialogData {
  client: Client;
  projectCount: number;
  requiresReassignment: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogData, setDeleteDialogData] = useState<DeleteDialogData | null>(null);
  const [reassignToClient, setReassignToClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    client_name: '',
    client_code: '',
    region: '',
    industry: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/clients`);
      setClients(response.data);
      setError('');
    } catch (err) {
      console.error('Error loading clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      client_name: client.client_name,
      client_code: client.client_code || '',
      region: client.region || '',
      industry: client.industry || '',
    });
    setEditDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedClient(null);
    setFormData({
      client_name: '',
      client_code: '',
      region: '',
      industry: '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveClient = async () => {
    try {
      if (selectedClient) {
        // Update existing client
        await axios.put(`${API_URL}/api/clients/${selectedClient.id}`, formData);
      } else {
        // Create new client
        await axios.post(`${API_URL}/api/clients`, formData);
      }
      setEditDialogOpen(false);
      loadClients();
    } catch (err: any) {
      console.error('Error saving client:', err);
      setError(err.response?.data?.error || 'Failed to save client');
    }
  };

  const handleDeleteClick = async (client: Client) => {
    try {
      // Check if client has dependencies
      const response = await axios.get(`${API_URL}/api/clients/${client.id}/dependencies`);
      const data = response.data;

      setDeleteDialogData({
        client: client,
        projectCount: data.project_count,
        requiresReassignment: data.has_dependencies,
      });
      setReassignToClient(null);
      setDeleteDialogOpen(true);
    } catch (err) {
      console.error('Error checking client dependencies:', err);
      setError('Failed to check client dependencies');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogData) return;

    try {
      const payload = deleteDialogData.requiresReassignment && reassignToClient
        ? { reassign_to_client_id: reassignToClient.id }
        : {};

      await axios.delete(`${API_URL}/api/clients/${deleteDialogData.client.id}`, {
        data: payload
      });

      setDeleteDialogOpen(false);
      setDeleteDialogData(null);
      setReassignToClient(null);
      loadClients();
    } catch (err: any) {
      console.error('Error deleting client:', err);
      if (err.response?.data?.requires_reassignment) {
        setError('Please select a client to reassign projects to');
      } else {
        setError(err.response?.data?.error || 'Failed to delete client');
      }
    }
  };

  const availableClientsForReassignment = clients.filter(
    c => c.id !== deleteDialogData?.client.id
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Client Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Client
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Client Name</strong></TableCell>
                <TableCell><strong>Client Code</strong></TableCell>
                <TableCell><strong>Region</strong></TableCell>
                <TableCell><strong>Industry</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No clients found. Click "Add Client" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.client_name}</TableCell>
                    <TableCell>{client.client_code || '-'}</TableCell>
                    <TableCell>{client.region || '-'}</TableCell>
                    <TableCell>{client.industry || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(client)}
                        title="Edit client"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(client)}
                        title="Delete client"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit/Add Client Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedClient ? 'Edit Client' : 'Add New Client'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              required
              fullWidth
              label="Client Name"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Client Code"
              value={formData.client_code}
              onChange={(e) => setFormData({ ...formData, client_code: e.target.value })}
            />
            <TextField
              fullWidth
              label="Region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            />
            <TextField
              fullWidth
              label="Industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveClient}
            variant="contained"
            disabled={!formData.client_name.trim()}
          >
            {selectedClient ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Client Dialog with Reassignment */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Delete Client
          </Box>
        </DialogTitle>
        <DialogContent>
          {deleteDialogData && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                You are about to delete client: <strong>{deleteDialogData.client.client_name}</strong>
              </Alert>

              {deleteDialogData.requiresReassignment ? (
                <Box>
                  <Typography variant="body1" paragraph>
                    This client has <strong>{deleteDialogData.projectCount}</strong> associated project(s).
                    You must select another client to reassign these projects to before deletion.
                  </Typography>

                  <Autocomplete
                    options={availableClientsForReassignment}
                    getOptionLabel={(option) => option.client_name}
                    value={reassignToClient}
                    onChange={(event, newValue) => setReassignToClient(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="Reassign Projects To"
                        helperText="Select a client to receive the projects"
                      />
                    )}
                  />

                  {availableClientsForReassignment.length === 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      Cannot delete this client because there are no other clients to reassign projects to.
                      Please create another client first.
                    </Alert>
                  )}
                </Box>
              ) : (
                <Typography variant="body1">
                  This client has no associated projects and can be safely deleted.
                  Are you sure you want to proceed?
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={
              deleteDialogData?.requiresReassignment &&
              (!reassignToClient || availableClientsForReassignment.length === 0)
            }
          >
            Delete Client
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Clients;
