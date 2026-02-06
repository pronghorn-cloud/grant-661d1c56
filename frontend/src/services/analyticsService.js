import api from './api';

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard')
};
