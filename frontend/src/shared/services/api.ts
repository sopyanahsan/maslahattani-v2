import axios from 'axios';
import {
  getCacheKey,
  setCacheEntry,
  getCacheEntryStale,
} from '@/shared/utils/offlineCache';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: cache GET responses + handle 401 + offline fallback
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.status >= 200 && response.status < 300) {
      const url = response.config.url || '';
      const params = response.config.params;
      const key = getCacheKey(url, params);
      setCacheEntry(key, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ============================================
    // OFFLINE FALLBACK: return cached data for GET
    // ============================================
    if (!error.response && originalRequest?.method === 'get') {
      // Network error (offline, timeout, DNS fail)
      const url = originalRequest.url || '';
      const params = originalRequest.params;
      const key = getCacheKey(url, params);
      const cached = getCacheEntryStale(key);

      if (cached) {
        // Return cached data as a fake successful response
        return {
          data: cached,
          status: 200,
          statusText: 'OK (cached)',
          headers: {},
          config: originalRequest,
          _fromCache: true,
        };
      }
      // No cache — reject with friendly error
      return Promise.reject({
        ...error,
        message: 'Tidak ada koneksi internet. Data belum tersedia offline.',
        isOffline: true,
      });
    }

    // ============================================
    // OFFLINE for mutations (POST/PUT/DELETE)
    // ============================================
    if (!error.response && originalRequest?.method !== 'get') {
      return Promise.reject({
        ...error,
        message: 'Tidak ada koneksi. Aksi disimpan sebagai pending.',
        isOffline: true,
      });
    }

    // ============================================
    // 401 TOKEN REFRESH
    // ============================================
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            { refreshToken },
          );
          localStorage.setItem('access_token', data.token);
          localStorage.setItem('refresh_token', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        } catch {
          // Refresh failed, clear tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Redirect ke login page yang sesuai berdasarkan path saat ini
          const path = window.location.pathname;
          if (path.startsWith('/admin')) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/kasir/login';
          }
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
