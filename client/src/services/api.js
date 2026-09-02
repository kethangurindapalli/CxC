import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const userAPI = {
  search: (params) => api.get('/users/search', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data)
};

export const projectAPI = {
  create: (data) => api.post('/projects', data),
  getMyProjects: (params) => api.get('/projects', { params }),
  getAll: (params) => api.get('/projects/all', { params }),
  search: (params) => api.get('/projects/search', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`)
};

export const matchAPI = {
  getMatches: () => api.get('/matches'),
  getMatchesForProject: (projectId) => api.get(`/matches/${projectId}`)
};

export const connectionAPI = {
  sendRequest: (receiverId) => api.post('/connections', { receiverId }),
  getConnections: () => api.get('/connections'),
  respond: (connectionId, action) => api.put(`/connections/${connectionId}`, { action }),
  remove: (connectionId) => api.delete(`/connections/${connectionId}`)
};

export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (receiverId, message) => api.post('/messages', { receiverId, message })
};

export default api;
