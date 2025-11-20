import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getUsers();
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      setError('All fields are required');
      return;
    }

    if (newUser.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await authAPI.register(newUser);
      setSuccess(`User ${newUser.email} created successfully!`);

      // Reset form
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'user'
      });
      setShowCreateForm(false);

      // Refresh user list
      fetchUsers();

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await authAPI.updateUserStatus(userId, !currentStatus);
      setSuccess(`User status updated successfully`);
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update user status');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Header with Create Button */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>User Management</span>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-primary"
            >
              {showCreateForm ? '✕ Cancel' : '➕ Create New User'}
            </button>
          </div>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateUser} style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Create New User</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-control"
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="form-control"
                  required
                  placeholder="Minimum 6 characters"
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-success">
                ✓ Create User
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Users List */}
      <div className="card">
        <div className="card-header">All Users ({users.length})</div>

        {users.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No users found. Create your first user above.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>
                    {user.first_name} {user.last_name}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-badge ${user.role === 'admin' ? 'status-on-track' : ''}`} style={{
                      background: user.role === 'admin' ? '#667eea' : '#6c757d',
                      color: 'white',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.active ? 'status-on-track' : 'status-below-target'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString()
                      : 'Never'}
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleToggleUserStatus(user.id, user.active)}
                      className={`btn ${user.active ? 'btn-danger' : 'btn-success'}`}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      {user.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Card */}
      <div className="card" style={{ background: '#f8f9fa' }}>
        <div className="card-header">User Management Information</div>
        <div style={{ fontSize: '0.9rem' }}>
          <p><strong>Admin Users:</strong> Have full access to all features including cost rates, user management, and system settings.</p>
          <p><strong>Standard Users:</strong> Can create projects and view analytics but cannot see cost rates or manage users.</p>
          <p><strong>Deactivating Users:</strong> Deactivated users cannot log in but their data is preserved. They can be reactivated at any time.</p>
          <p style={{ marginBottom: 0 }}><strong>Password Security:</strong> Passwords are hashed with bcrypt and cannot be retrieved. Users must reset their password if forgotten.</p>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
