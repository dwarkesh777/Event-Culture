import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';

// Production Vercel Backend URL
const PROD_BACKEND_URL = 'https://eventculture-backend.vercel.app/api';

// Automatically detect host IP when running on Expo Go / physical device or simulator
const getBackendUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }
  return PROD_BACKEND_URL;
};

const BACKEND_URL = getBackendUrl();

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors & token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (refreshToken) {
          const res = await axios.post(`${BACKEND_URL}/auth/refresh-token`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          await storage.setItem('accessToken', accessToken);
          if (newRefresh) await storage.setItem('refreshToken', newRefresh);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        await storage.clear();
      }
    }
    return Promise.reject(error);
  }
);

// Organizer API Endpoints
export const authApi = {
  sendOtp: (email) => api.post('/auth/send-organizer-otp', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp, role: 'ORGANIZER' }),
  sendSignupOtp: (data) => api.post('/auth/send-organizer-signup-otp', data),
  verifySignupOtp: (data) => api.post('/auth/verify-organizer-signup-otp', data),
  getMe: () => api.get('/auth/me'),
  logout: async () => {
    const refreshToken = await storage.getItem('refreshToken');
    return api.post('/auth/logout', { refreshToken });
  },
};

export const eventsApi = {
  create: (data) => api.post('/events', data),
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  update: (id, data) => api.patch(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  clearData: (id) => api.delete(`/events/${id}/clear-data`),
};

export const csvApi = {
  preview: (eventId, formData) =>
    api.post(`/events/${eventId}/preview-csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  import: (eventId, formData) =>
    api.post(`/events/${eventId}/import-csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getHistory: (eventId) => api.get(`/events/${eventId}/imports`),
};

export const participantsApi = {
  getAll: (eventId, params = {}) => api.get(`/events/${eventId}/participants`, { params }),
  getById: (id) => api.get(`/participants/${id}`),
  update: (id, data) => api.patch(`/participants/${id}`, data),
  delete: (id) => api.delete(`/participants/${id}`),
};

export const passApi = {
  getPassTypes: (eventId) => api.get(`/events/${eventId}/pass-types`),
  createPassType: (eventId, data) => api.post(`/events/${eventId}/pass-types`, data),
  updatePassType: (id, data) => api.patch(`/passes/types/${id}`, data),
  deletePassType: (id) => api.delete(`/passes/types/${id}`),
  assignPass: (data) => api.post('/passes/assign', data),
  bulkAssignPass: (data) => api.post('/passes/bulk-assign', data),
};

export const volunteerApi = {
  getAll: (eventId) => api.get(`/events/${eventId}/volunteers`),
  add: (eventId, data) => api.post(`/events/${eventId}/volunteers`, data),
  update: (id, data) => api.patch(`/volunteers/${id}`, data),
  delete: (id) => api.delete(`/volunteers/${id}`),
};

export const analyticsApi = {
  getStats: (eventId) => api.get(`/events/${eventId}/analytics`),
  getRecentScans: (eventId) => api.get(`/events/${eventId}/recent-scans`),
};

export const uploadApi = {
  uploadImage: (formData) =>
    api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
