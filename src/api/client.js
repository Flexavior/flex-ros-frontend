import axios from 'axios';
import { resolveApiBaseUrl } from './resolveApiBaseUrl.js';

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mss_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/me')) {
      localStorage.removeItem('mss_token');
      if (window.location.pathname !== '/login') {
        const returnPath = window.location.pathname + window.location.search;
        const q = returnPath && returnPath !== '/'
          ? `?returnUrl=${encodeURIComponent(returnPath)}`
          : '';
        window.location.href = `/login${q}`;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
