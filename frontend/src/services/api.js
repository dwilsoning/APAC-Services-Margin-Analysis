import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login for actual authentication failures, not permission errors
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error || '';
      console.log('401 Error:', errorMessage);

      // Only redirect if it's a token-related error
      if (errorMessage.includes('token') || errorMessage.includes('Access token required') ||
          errorMessage.includes('Invalid or expired')) {
        console.log('Token error detected - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.error || '';
      console.log('403 Error:', errorMessage);

      // Only redirect if it's a token expiration issue, not a permission issue
      if (errorMessage.includes('Invalid or expired token')) {
        console.log('Expired token detected - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (userData) =>
    api.post('/auth/register', userData),

  getCurrentUser: () =>
    api.get('/auth/me'),

  getUsers: () =>
    api.get('/auth/users'),

  updateUserStatus: (userId, active) =>
    api.patch(`/auth/users/${userId}/status`, { active })
};

// Admin Rates API
export const adminRatesAPI = {
  getRates: () =>
    api.get('/admin/rates'),

  getRate: (id) =>
    api.get(`/admin/rates/${id}`),

  updateRate: (id, data) =>
    api.put(`/admin/rates/${id}`, data),

  bulkUpdateRates: (rates) =>
    api.patch('/admin/rates/bulk', { rates }),

  getRateHistory: (id) =>
    api.get(`/admin/rates/${id}/history`),

  getExchangeRates: () =>
    api.get('/admin/exchange-rates'),

  updateExchangeRate: (id, data) =>
    api.put(`/admin/exchange-rates/${id}`, data),

  refreshExchangeRates: () =>
    api.post('/admin/exchange-rates/refresh')
};

// Clients API
export const clientsAPI = {
  getClients: () =>
    api.get('/clients'),

  getClient: (id) =>
    api.get(`/clients/${id}`),

  createClient: (data) =>
    api.post('/clients', data),

  updateClient: (id, data) =>
    api.put(`/clients/${id}`, data),

  deleteClient: (id) =>
    api.delete(`/clients/${id}`)
};

// Projects API
export const projectsAPI = {
  getProjects: (params = {}) =>
    api.get('/projects', { params }),

  getProject: (id) =>
    api.get(`/projects/${id}`),

  createProject: (data) =>
    api.post('/projects', data),

  updateProject: (id, data) =>
    api.put(`/projects/${id}`, data),

  deleteProject: (id) =>
    api.delete(`/projects/${id}`),

  getDashboardStats: (params = {}) =>
    api.get('/projects/dashboard/stats', { params }),

  exportToExcel: (params = {}) =>
    api.get('/projects/export/excel', {
      params,
      responseType: 'blob'
    })
};

export default api;
