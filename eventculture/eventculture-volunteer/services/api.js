import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';

// Production Vercel Backend URL
const PROD_BACKEND_URL = 'https://eventculture-backend.vercel.app/api';

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

api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('volunteerAccessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await storage.getItem('volunteerRefreshToken');
        if (refreshToken) {
          const res = await axios.post(`${BACKEND_URL}/auth/refresh-token`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          await storage.setItem('volunteerAccessToken', accessToken);
          if (newRefresh) await storage.setItem('volunteerRefreshToken', newRefresh);

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

export const volunteerAuthApi = {
  sendOtp: (email) => api.post('/auth/send-volunteer-otp', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp, role: 'VOLUNTEER' }),
  getMe: () => api.get('/auth/me'),
  logout: async () => {
    const refreshToken = await storage.getItem('volunteerRefreshToken');
    return api.post('/auth/logout', { refreshToken });
  },
};

export const volunteerScanApi = {
  validatePass: (qrToken, location = 'Scanner Gate 1', deviceId = 'VOL_DEV', expectedPassTypeId = null) =>
    api.post('/scans/validate', { qrToken, location, deviceId, expectedPassTypeId }),
  redeemPass: (qrToken, location = 'Scanner Gate 1', deviceId = 'VOL_DEV', expectedPassTypeId = null) =>
    api.post('/scans/scan', { qrToken, location, deviceId, expectedPassTypeId }),
  getHistory: (params = {}) => api.get('/scans/history', { params }),
};

export const volunteerEventsApi = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  getAssignment: (eventId) => api.get(`/volunteers/me/assignments/${eventId}`),
};
