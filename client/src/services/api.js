import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password })
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
  getMatchesForProject: (projectId) => api.get(`/matches/${projectId}`),
  recomputeMatches: () => api.post('/matches/recompute')
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

export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};

export const uploadAPI = {
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post('/upload/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const collaborationAPI = {
  sendRequest: (projectId, data) => api.post(`/collaborations/projects/${projectId}`, data),
  getRequestsForProject: (projectId) => api.get(`/collaborations/projects/${projectId}`),
  getMyRequests: () => api.get('/collaborations/my'),
  respond: (id, action) => api.put(`/collaborations/${id}`, { action }),
  remove: (id) => api.delete(`/collaborations/${id}`)
};

export default api;
