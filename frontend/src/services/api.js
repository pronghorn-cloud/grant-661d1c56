import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('ae_scholarships_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// UC-AUTH-04: Auto-refresh token before expiry
let refreshTimer = null;

export function startTokenRefresh() {
  stopTokenRefresh();
  // Refresh every 20 minutes (token expires in 24h, refresh well before)
  refreshTimer = setInterval(async () => {
    const token = localStorage.getItem('ae_scholarships_token');
    if (!token) { stopTokenRefresh(); return; }
    try {
      const res = await api.post('/auth/refresh');
      if (res.data?.token) {
        localStorage.setItem('ae_scholarships_token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('ae_scholarships_user', JSON.stringify(res.data.user));
        }
      }
    } catch {
      // If refresh fails, token is still valid or user needs to re-auth
    }
  }, 20 * 60 * 1000);
}

export function stopTokenRefresh() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
}

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // UC-AUTH-04: Handle expired tokens
    if (error.response?.status === 401) {
      localStorage.removeItem('ae_scholarships_token');
      localStorage.removeItem('ae_scholarships_user');
      stopTokenRefresh();
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// API methods
export const servicesAPI = {
  getAll: () => api.get('/services'),
  getById: (id) => api.get(`/services/${id}`)
};

export const healthAPI = {
  check: () => api.get('/health')
};

export default api;
