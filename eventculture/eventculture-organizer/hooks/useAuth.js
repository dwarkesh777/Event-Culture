import { create } from 'zustand';
import { authApi } from '../services/api';
import { storage } from '../services/storage';

export const useAuth = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = await storage.getItem('accessToken');
      const savedUser = await storage.getItem('userProfile');

      if (token && savedUser) {
        set({ user: savedUser, isAuthenticated: true, isLoading: false });
        // Silently verify with /me
        try {
          const res = await authApi.getMe();
          const freshUser = res.data.data.user;
          await storage.setItem('userProfile', freshUser);
          set({ user: freshUser });
        } catch {
          // Keep saved user unless token fails
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  sendOtp: async (email) => {
    set({ error: null });
    try {
      const res = await authApi.sendOtp(email);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  verifyOtp: async (email, otp) => {
    set({ error: null });
    try {
      const res = await authApi.verifyOtp(email, otp);
      const { user, accessToken, refreshToken } = res.data.data;

      await storage.setItem('accessToken', accessToken);
      await storage.setItem('refreshToken', refreshToken);
      await storage.setItem('userProfile', user);

      set({ user, isAuthenticated: true, error: null });
      return user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  sendSignupOtp: async (formData) => {
    set({ error: null });
    try {
      const res = await authApi.sendSignupOtp(formData);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send signup OTP';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  verifySignupOtp: async (formData) => {
    set({ error: null });
    try {
      const res = await authApi.verifySignupOtp(formData);
      const { user, accessToken, refreshToken } = res.data.data;

      await storage.setItem('accessToken', accessToken);
      await storage.setItem('refreshToken', refreshToken);
      await storage.setItem('userProfile', user);

      set({ user, isAuthenticated: true, error: null });
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {}
    await storage.clear();
    set({ user: null, isAuthenticated: false, error: null });
  },

  updateProfileUser: (updatedUser) => {
    storage.setItem('userProfile', updatedUser);
    set({ user: updatedUser });
  },
}));
