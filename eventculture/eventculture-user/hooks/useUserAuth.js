import { create } from 'zustand';
import { userAuthApi } from '../services/api';
import { storage } from '../services/storage';

export const useUserAuth = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = await storage.getItem('userAccessToken');
      const savedUser = await storage.getItem('userProfile');

      if (token && savedUser) {
        set({ user: savedUser, isAuthenticated: true, isLoading: false });
        try {
          const res = await userAuthApi.getMe();
          const freshUser = res.data.data.user;
          await storage.setItem('userProfile', freshUser);
          set({ user: freshUser });
        } catch {}
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  sendOtp: async (email) => {
    set({ error: null });
    try {
      const res = await userAuthApi.sendOtp(email);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP to registered email';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  verifyOtp: async (email, otp) => {
    set({ error: null });
    try {
      const res = await userAuthApi.verifyOtp(email, otp);
      const { user, accessToken, refreshToken } = res.data.data;

      await storage.setItem('userAccessToken', accessToken);
      await storage.setItem('userRefreshToken', refreshToken);
      await storage.setItem('userProfile', user);

      set({ user, isAuthenticated: true, error: null });
      return user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await userAuthApi.logout();
    } catch {}
    await storage.clear();
    set({ user: null, isAuthenticated: false, error: null });
  },

  updateProfileUser: (updatedUser) => {
    storage.setItem('userProfile', updatedUser);
    set({ user: updatedUser });
  },
}));
