import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import ProjectEntryForm from '../components/ProjectEntryForm';

const DataEntry: React.FC = () => {
  const [projectFormOpen, setProjectFormOpen] = useState(false);

  const handleSuccess = () => {
    // Refresh data or show success message
    console.log('Project submitted successfully');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Project Data Entry
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Enter complete project information including client details, contract information,
          financial values, and resource hours allocation.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setProjectFormOpen(true)}
          >
            Add New Project
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'info.lighter', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            What to Enter
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Project Information:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Client Name, Contract Number, Oracle ID</li>
              <li>Project Name and Currency</li>
              <li>Local Services Value, Baseline Hours</li>
              <li>Local Fair Services Value, Total Non-Bill Hours</li>
              <li>Closure Date</li>
            </ul>
            <strong>Resource Hours:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Enter hours worked for each staff role</li>
              <li>Costs are automatically calculated based on hourly rates</li>
              <li>Leave blank for roles not used on the project</li>
            </ul>
          </Typography>
        </Box>
      </Paper>

      {/* Form Dialog */}
      <ProjectEntryForm
        open={projectFormOpen}
        onClose={() => setProjectFormOpen(false)}
        onSuccess={handleSuccess}
      />
    </Container>
  );
};

export default DataEntry;
