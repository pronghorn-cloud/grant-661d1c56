import api from './api';

export const staffAPI = {
  // Work Queue
  getQueue: (params = {}) => api.get('/staff/queue', { params }),

  // Dashboard
  getDashboardStats: () => api.get('/staff/dashboard'),

  // Reports
  getReport: (params = {}) => api.get('/staff/reports', { params }),

  // Staff members
  getMembers: () => api.get('/staff/members'),

  // Templates
  getTemplates: (type) => api.get('/staff/templates', { params: { type } }),

  // Rankings
  getRankings: (scholarshipId) => api.get(`/staff/rankings/${scholarshipId}`),

  // Application review
  getApplication: (id) => api.get(`/staff/applications/${id}`),
  addNotes: (id, notes) => api.post(`/staff/applications/${id}/notes`, { notes }),
  sendMILetter: (id, data) => api.post(`/staff/applications/${id}/mi-letter`, data),
  approve: (id, data = {}) => api.post(`/staff/applications/${id}/approve`, data),
  reject: (id, data) => api.post(`/staff/applications/${id}/reject`, data),
  assign: (id, assigneeId) => api.post(`/staff/applications/${id}/assign`, { assignee_id: assigneeId }),
  bulkAssign: (applicationIds, assigneeId) => api.post('/staff/bulk-assign', { application_ids: applicationIds, assignee_id: assigneeId })
};
