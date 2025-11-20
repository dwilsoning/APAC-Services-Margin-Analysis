import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminCostRates from './AdminCostRates';
import ProjectEntryForm from './ProjectEntryForm';
import AnalyticsDashboard from './AnalyticsDashboard';
import UserManagement from './UserManagement';
import axios from 'axios';
import './MainDashboard.css';

const MainDashboard = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('analytics');
  const [newProjectId, setNewProjectId] = useState(null);
  const [editProjectId, setEditProjectId] = useState(null);
  const [serverHealth, setServerHealth] = useState('checking'); // 'healthy', 'unhealthy', 'checking'

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleProjectCreated = useCallback((projectId) => {
    setNewProjectId(projectId);
    setEditProjectId(null);
    setActiveView('analytics');
  }, []);

  const handleClearNewProject = useCallback(() => {
    setNewProjectId(null);
  }, []);

  const handleEditProject = useCallback((projectId) => {
    setEditProjectId(projectId);
    setNewProjectId(null);
    setActiveView('newProject');
  }, []);

  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        // Health endpoint is at root level, not under /api
        const SERVER_URL = process.env.REACT_APP_API_URL
          ? process.env.REACT_APP_API_URL.replace('/api', '')
          : 'http://localhost:5000';
        await axios.get(`${SERVER_URL}/health`, { timeout: 3000 });
        setServerHealth('healthy');
      } catch (error) {
        console.log('Server health check failed:', error.message);
        setServerHealth('unhealthy');
      }
    };

    // Check immediately on mount
    checkServerHealth();

    // Check every 30 seconds
    const interval = setInterval(checkServerHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="main-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1>APAC Services Margin Analysis</h1>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '500',
                backgroundColor: serverHealth === 'healthy' ? '#d4edda' :
                                serverHealth === 'unhealthy' ? '#f8d7da' : '#fff3cd',
                color: serverHealth === 'healthy' ? '#155724' :
                       serverHealth === 'unhealthy' ? '#721c24' : '#856404',
                border: `1px solid ${serverHealth === 'healthy' ? '#c3e6cb' :
                                     serverHealth === 'unhealthy' ? '#f5c6cb' : '#ffeaa7'}`
              }}
              title={serverHealth === 'healthy' ? 'Server is running' :
                     serverHealth === 'unhealthy' ? 'Server is down - Please restart backend' :
                     'Checking server status...'}
            >
              <span style={{
                fontSize: '1rem',
                animation: serverHealth === 'checking' ? 'pulse 1.5s infinite' : 'none'
              }}>
                {serverHealth === 'healthy' ? '🟢' :
                 serverHealth === 'unhealthy' ? '🔴' : '🟡'}
              </span>
              <span>
                {serverHealth === 'healthy' ? 'Server Online' :
                 serverHealth === 'unhealthy' ? 'Server Offline' :
                 'Checking...'}
              </span>
            </div>
          </div>
          <div className="user-info">
            <span className="user-name">
              {user.first_name} {user.last_name}
            </span>
            <span className="user-role">{user.role}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
        >
          📊 Analytics Dashboard
        </button>
        <button
          className={`nav-btn ${activeView === 'newProject' ? 'active' : ''}`}
          onClick={() => setActiveView('newProject')}
        >
          ➕ New Project
        </button>
        {user.role === 'admin' && (
          <>
            <button
              className={`nav-btn ${activeView === 'adminRates' ? 'active' : ''}`}
              onClick={() => setActiveView('adminRates')}
            >
              ⚙️ Admin: Cost Rates
            </button>
            <button
              className={`nav-btn ${activeView === 'userManagement' ? 'active' : ''}`}
              onClick={() => setActiveView('userManagement')}
            >
              👥 Admin: Users
            </button>
          </>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {activeView === 'analytics' && (
          <AnalyticsDashboard
            newProjectId={newProjectId}
            onClearNewProject={handleClearNewProject}
            onEditProject={handleEditProject}
          />
        )}
        {activeView === 'newProject' && (
          <ProjectEntryForm
            onProjectCreated={handleProjectCreated}
            editProjectId={editProjectId}
            onCancelEdit={() => setEditProjectId(null)}
          />
        )}
        {activeView === 'adminRates' && user.role === 'admin' && <AdminCostRates />}
        {activeView === 'userManagement' && user.role === 'admin' && <UserManagement />}
      </main>
    </div>
  );
};

export default MainDashboard;
