import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-content">
          <h1>APAC Margin Analysis</h1>
          <div className="nav-right">
            <span className="user-info">
              {user?.firstName} {user?.lastName} ({isAdmin() ? 'Admin' : 'User'})
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome to APAC Services Margin Analysis</h2>
          <p>Role: <strong>{isAdmin() ? 'System Administrator' : 'End User'}</strong></p>

          {isAdmin() && (
            <div className="admin-section">
              <h3>Administrator Features</h3>
              <ul>
                <li>Create and manage users</li>
                <li>Access all projects and data</li>
                <li>View audit logs</li>
                <li>Manage system settings</li>
              </ul>
            </div>
          )}

          <div className="features-section">
            <h3>Available Features</h3>
            <p>This is a starting point for your margin analysis system. Key features to be implemented:</p>
            <ul>
              <li>Customer management</li>
              <li>Project tracking</li>
              <li>Service/margin analysis</li>
              <li>Reporting and analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
