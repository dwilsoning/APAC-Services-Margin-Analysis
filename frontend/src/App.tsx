import React from 'react';
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
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Input as InputIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import DataEntry from './pages/DataEntry';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                APAC Services Margin Analysis
              </Typography>
              <Button color="inherit" component={Link} to="/" startIcon={<DashboardIcon />}>
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/data-entry" startIcon={<InputIcon />}>
                Data Entry
              </Button>
              <Button color="inherit" component={Link} to="/upload" startIcon={<UploadIcon />}>
                Upload
              </Button>
            </Toolbar>
          </AppBar>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/data-entry" element={<DataEntry />} />
            <Route path="/upload" element={<Upload />} />
          </Routes>
        </Box>
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
