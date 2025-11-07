import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Client APIs
export const clientsApi = {
  getAll: () => api.get('/clients'),
  getById: (id: number) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: number, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: number) => api.delete(`/clients/${id}`),
};

// Project APIs
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id: number) => api.get(`/projects/${id}`),
  getByClient: (clientId: number) => api.get(`/projects/client/${clientId}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: number, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
};

// Financial Data APIs
export const financialDataApi = {
  getAll: () => api.get('/financial-data'),
  getByProject: (projectId: number) => api.get(`/financial-data/project/${projectId}`),
  getByPeriod: (year: number, month: number) => api.get(`/financial-data/period/${year}/${month}`),
  create: (data: any) => api.post('/financial-data', data),
  update: (id: number, data: any) => api.put(`/financial-data/${id}`, data),
  delete: (id: number) => api.delete(`/financial-data/${id}`),
};

export default api;
