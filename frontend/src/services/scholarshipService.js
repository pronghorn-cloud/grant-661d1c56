import api from './api';

export const scholarshipsAPI = {
  getAll: (params) => api.get('/scholarships', { params }),
  getById: (id) => api.get(`/scholarships/${id}`),
  getTypes: () => api.get('/scholarships/types'),
  getCategories: () => api.get('/scholarships/categories')
};
