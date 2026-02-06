import api from './api';

export const paymentAPI = {
  getEligible: () => api.get('/payments/eligible'),
  generateBatch: (applicationIds) => api.post('/payments/batch', { application_ids: applicationIds }),
  getBatches: (params = {}) => api.get('/payments/batches', { params }),
  getBatchDetails: (id) => api.get(`/payments/batches/${id}`),
  confirmBatch: (id) => api.post(`/payments/batches/${id}/confirm`),
  getDuplicates: () => api.get('/payments/duplicates')
};
