import api from './api';

export const adminAPI = {
  // UC-ADMIN-01: Scholarship management
  getScholarships: (params = {}) => api.get('/admin/scholarships', { params }),
  getScholarshipById: (id) => api.get(`/admin/scholarships/${id}`),
  createScholarship: (data) => api.post('/admin/scholarships', data),
  updateScholarship: (id, data) => api.put(`/admin/scholarships/${id}`, data),
  getLookups: () => api.get('/admin/scholarships/lookups'),

  // UC-ADMIN-02: User management
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleUserBlock: (id, blocked) => api.put(`/admin/users/${id}/block`, { blocked }),
  getRoles: () => api.get('/admin/users/roles'),

  // UC-ADMIN-03: Legacy
  getLegacyImports: (params = {}) => api.get('/admin/legacy/imports', { params }),
  importLegacy: (submissions) => api.post('/admin/legacy/import', { submissions }),

  // UC-AUDIT-01: Audit Trail
  getAuditLogs: (params = {}) => api.get('/admin/audit', { params }),
  getAuditActions: () => api.get('/admin/audit/actions'),
  exportAuditLogs: (params = {}) => api.get('/admin/audit/export', { params, responseType: 'blob' }),

  // UC-INT-01: SFS Sync
  syncWithSFS: () => api.post('/admin/sfs/sync')
};
