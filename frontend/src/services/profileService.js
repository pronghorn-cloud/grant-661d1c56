import api from './api';

export const profileAPI = {
  getProfile: () => api.get('/profile/me'),
  createProfile: (data) => api.post('/profile/me', data),
  updateProfile: (data) => api.put('/profile/me', data),
  getBanking: () => api.get('/profile/banking'),
  saveBanking: (data) => api.post('/profile/banking', data),
  getLookup: (table) => api.get(`/profile/lookups/${table}`)
};
