import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Input as InputIcon,
  Upload as UploadIcon,
  Help as HelpIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import DataEntry from './pages/DataEntry';
import StaffRoles from './pages/StaffRoles';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const theme = createTheme({
  palette: {
    primary: {
      main: '#707CF1',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showHelp, setShowHelp] = useState(false);

  // Server health check
  const checkServerStatus = async () => {
    try {
      await axios.get(`${API_URL}/health`, { timeout: 3000 });
      setServerStatus('online');
    } catch (error) {
      setServerStatus('offline');
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #707CF1 0%, #5B21B6 100%)' }}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                APAC Services Margin Analysis
              </Typography>

              {/* Server Status Indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor:
                      serverStatus === 'online' ? '#10B981' :
                      serverStatus === 'offline' ? '#EF4444' :
                      '#F59E0B',
                  }}
                />
                <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem' }}>
                  {serverStatus === 'online' ? 'Server Online' :
                   serverStatus === 'offline' ? 'Server Offline' :
                   'Checking...'}
                </Typography>
              </Box>

              <Button
                color="inherit"
                component={Link}
                to="/"
                startIcon={<DashboardIcon />}
                sx={{ fontWeight: 500 }}
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/data-entry"
                startIcon={<InputIcon />}
                sx={{ fontWeight: 500 }}
              >
                Data Entry
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/upload"
                startIcon={<UploadIcon />}
                sx={{ fontWeight: 500 }}
              >
                Upload
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/staff-roles"
                startIcon={<PeopleIcon />}
                sx={{ fontWeight: 500 }}
              >
                Staff Roles
              </Button>
              <Button
                color="inherit"
                startIcon={<HelpIcon />}
                onClick={() => setShowHelp(true)}
                sx={{
                  ml: 1,
                  fontWeight: 600,
                  border: '2px solid white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                Help
              </Button>
            </Toolbar>
          </AppBar>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/data-entry" element={<DataEntry />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/staff-roles" element={<StaffRoles />} />
          </Routes>
        </Box>

        {/* Help Dialog */}
        <Dialog open={showHelp} onClose={() => setShowHelp(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: '#707CF1', color: 'white', fontWeight: 600 }}>
            Help & Documentation
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#707CF1', fontWeight: 600 }}>
                Getting Started
              </Typography>
              <Typography variant="body2" paragraph>
                This application helps you track and analyze financial data for clients and projects.
                You can either manually enter data through forms or upload spreadsheets.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#707CF1', fontWeight: 600 }}>
                Data Entry Workflow
              </Typography>
              <ol style={{ marginTop: 8, paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Add Clients:</strong> Start by creating client records with company information,
                  region, and industry details.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Create Projects:</strong> Link projects to clients with project details,
                  dates, and status information.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Enter Financial Data:</strong> Add monthly financial metrics including
                  revenue, costs, and expenses. Margins are calculated automatically.
                </li>
                <li>
                  <strong>View Dashboard:</strong> Analyze your data through interactive visualizations
                  and reports.
                </li>
              </ol>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#707CF1', fontWeight: 600 }}>
                Features
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                <Chip label="Form-based Data Entry" color="primary" size="small" />
                <Chip label="Spreadsheet Upload" color="primary" size="small" />
                <Chip label="Automatic Margin Calculations" color="primary" size="small" />
                <Chip label="Interactive Dashboards" color="primary" size="small" />
                <Chip label="Regional Analysis" color="primary" size="small" />
                <Chip label="Project Tracking" color="primary" size="small" />
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#707CF1', fontWeight: 600 }}>
                Server Status
              </Typography>
              <Typography variant="body2">
                The server status indicator in the top navigation bar shows whether the backend
                server is running. If it shows "Server Offline", please ensure the backend is
                started by running <code>start-margin-analysis.bat</code>.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#707CF1', fontWeight: 600 }}>
                Need More Help?
              </Typography>
              <Typography variant="body2">
                For additional assistance or to report issues, please contact your system administrator.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowHelp(false)} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Router>
    </ThemeProvider>
  );
}

function Home() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to APAC Services Margin Analysis
      </Typography>
      <Typography variant="body1" paragraph>
        This platform helps you analyze financial performance across clients and projects.
      </Typography>
      <Typography variant="body1">
        Get started by using the <strong>Data Entry</strong> page to add your financial data,
        or use the <strong>Upload</strong> page to import data from spreadsheets.
      </Typography>
    </Container>
  );
}

function Upload() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Upload Spreadsheets
      </Typography>
      <Typography variant="body1">
        Spreadsheet upload functionality coming soon...
      </Typography>
    </Container>
  );
}

export default App;
