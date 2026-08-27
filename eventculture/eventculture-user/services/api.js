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
    const token = await storage.getItem('userAccessToken');
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
        const refreshToken = await storage.getItem('userRefreshToken');
        if (refreshToken) {
          const res = await axios.post(`${BACKEND_URL}/auth/refresh-token`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          await storage.setItem('userAccessToken', accessToken);
          if (newRefresh) await storage.setItem('userRefreshToken', newRefresh);

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

export const userAuthApi = {
  sendOtp: (email) => api.post('/auth/send-user-otp', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-user-otp', { email, otp }),
  getMe: () => api.get('/auth/me'),
  logout: async () => {
    const refreshToken = await storage.getItem('userRefreshToken');
    return api.post('/auth/logout', { refreshToken });
  },
};

export const userPassApi = {
  getMyPasses: () => api.get('/passes/my-passes'),
  getPassById: (id) => api.get(`/passes/${id}`),
};

export const userEventsApi = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
};

export const userUploadApi = {
  uploadImage: (formData) =>
    api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
