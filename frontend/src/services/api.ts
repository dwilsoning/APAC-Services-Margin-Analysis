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

// Staff Roles APIs
export const staffRolesApi = {
  getAll: (activeOnly?: boolean) => api.get('/staff-roles', { params: { active_only: activeOnly } }),
  getById: (id: number) => api.get(`/staff-roles/${id}`),
  getHistory: (id: number) => api.get(`/staff-roles/${id}/history`),
  create: (data: any) => api.post('/staff-roles', data),
  update: (id: number, data: any) => api.put(`/staff-roles/${id}`, data),
  deactivate: (id: number) => api.delete(`/staff-roles/${id}`),
};

// Third Party Resources APIs
export const thirdPartyResourcesApi = {
  getAll: (activeOnly?: boolean) => api.get('/third-party-resources', { params: { active_only: activeOnly } }),
  getById: (id: number) => api.get(`/third-party-resources/${id}`),
  create: (data: any) => api.post('/third-party-resources', data),
  update: (id: number, data: any) => api.put(`/third-party-resources/${id}`, data),
  deactivate: (id: number) => api.delete(`/third-party-resources/${id}`),
};

// Project Resources APIs
export const projectResourcesApi = {
  getAll: () => api.get('/project-resources'),
  getByProject: (projectId: number) => api.get(`/project-resources/project/${projectId}`),
  getByPeriod: (year: number, month: number) => api.get(`/project-resources/period/${year}/${month}`),
  create: (data: any) => api.post('/project-resources', data),
  update: (id: number, data: any) => api.put(`/project-resources/${id}`, data),
  delete: (id: number) => api.delete(`/project-resources/${id}`),
};

export default api;
