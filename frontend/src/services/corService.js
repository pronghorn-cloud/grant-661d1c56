import api from './api';

export const corAPI = {
  // Staff endpoints
  checkCOR: (applicationId) => api.post(`/cor/check/${applicationId}`),
  sendRequest: (applicationId, data = {}) => api.post(`/cor/request/${applicationId}`, data),
  getStatus: (applicationId) => api.get(`/cor/status/${applicationId}`),
  getPending: (params = {}) => api.get('/cor/pending', { params }),
  getAll: (params = {}) => api.get('/cor/all', { params }),

  // Public institution endpoint
  getRequestInfo: (token) => api.get(`/cor/respond/${token}`),
  respond: (token, data) => api.post(`/cor/respond/${token}`, data)
};
