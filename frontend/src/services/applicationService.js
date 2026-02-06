import api from './api';

export const applicationsAPI = {
  start: (scholarshipId) => api.post('/applications', { scholarship_id: scholarshipId }),
  getMyApplications: () => api.get('/applications/my'),
  getById: (id) => api.get(`/applications/${id}`),
  saveDraft: (id, data) => api.put(`/applications/${id}`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  withdraw: (id) => api.post(`/applications/${id}/withdraw`),
  respondToMI: (id) => api.post(`/applications/${id}/respond-mi`),
  uploadDocument: (id, formData) => api.post(`/applications/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  removeDocument: (appId, docId) => api.delete(`/applications/${appId}/documents/${docId}`)
};
