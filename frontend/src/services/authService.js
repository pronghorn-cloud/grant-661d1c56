import api, { startTokenRefresh, stopTokenRefresh } from './api';

const TOKEN_KEY = 'ae_scholarships_token';
const USER_KEY = 'ae_scholarships_user';

export const authAPI = {
  loginWithACA: (data) => api.post('/auth/aca', data),
  loginWithMicrosoft: (data) => api.post('/auth/microsoft', data),
  devLogin: (data) => api.post('/auth/dev-login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAuthenticated() {
  return !!getToken();
}

export async function login(provider, credentials) {
  let response;
  if (provider === 'aca') {
    response = await authAPI.loginWithACA(credentials);
  } else if (provider === 'microsoft') {
    response = await authAPI.loginWithMicrosoft(credentials);
  } else {
    response = await authAPI.devLogin(credentials);
  }

  if (response.success && response.data) {
    setToken(response.data.token);
    setStoredUser(response.data.user);
    startTokenRefresh();
    return response.data.user;
  }
  throw new Error('Login failed');
}

export async function logout() {
  try {
    await authAPI.logout();
  } catch {
    // Ignore server errors on logout
  }
  stopTokenRefresh();
  removeToken();
}

export async function refreshUser() {
  try {
    const response = await authAPI.getMe();
    if (response.success && response.data) {
      setStoredUser(response.data);
      return response.data;
    }
  } catch {
    removeToken();
  }
  return null;
}
