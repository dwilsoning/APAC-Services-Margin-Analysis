import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import ClientForm from '../components/ClientForm';
import ProjectForm from '../components/ProjectForm';
import FinancialDataForm from '../components/FinancialDataForm';

const DataEntry: React.FC = () => {
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [financialFormOpen, setFinancialFormOpen] = useState(false);

  const handleSuccess = () => {
    // Refresh data or show success message
    console.log('Form submitted successfully');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Data Entry
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Use the forms below to manually enter client, project, and financial data.
          All data will be available in the dashboard for analysis and visualization.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Typography variant="h6">Add Client</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Create a new client record with company information, region, and industry details.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  fullWidth
                  onClick={() => setClientFormOpen(true)}
                >
                  Add Client
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WorkIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                  <Typography variant="h6">Add Project</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Create a new project linked to a client with project details and timeline.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<AddIcon />}
                  fullWidth
                  onClick={() => setProjectFormOpen(true)}
                >
                  Add Project
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssessmentIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                  <Typography variant="h6">Add Financial Data</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Enter monthly financial metrics including revenue, costs, and expenses.
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AddIcon />}
                  fullWidth
                  onClick={() => setFinancialFormOpen(true)}
                >
                  Add Financial Data
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'info.lighter', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Data Entry Workflow
          </Typography>
          <Typography variant="body2" component="div">
            <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Start by adding a <strong>Client</strong> - this represents the company or organization</li>
              <li>Create a <strong>Project</strong> and link it to the client</li>
              <li>Add <strong>Financial Data</strong> for each month/period to track project performance</li>
              <li>View your data in the Dashboard for analysis and insights</li>
            </ol>
          </Typography>
        </Box>
      </Paper>

      {/* Form Dialogs */}
      <ClientForm
        open={clientFormOpen}
        onClose={() => setClientFormOpen(false)}
        onSuccess={handleSuccess}
      />
      <ProjectForm
        open={projectFormOpen}
        onClose={() => setProjectFormOpen(false)}
        onSuccess={handleSuccess}
      />
      <FinancialDataForm
        open={financialFormOpen}
        onClose={() => setFinancialFormOpen(false)}
        onSuccess={handleSuccess}
      />
    </Container>
  );
};

export default DataEntry;
