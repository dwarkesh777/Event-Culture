import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async setItem(key, value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, stringValue);
    } else {
      await SecureStore.setItemAsync(key, stringValue);
    }
  },

  async getItem(key) {
    try {
      let val = null;
      if (Platform.OS === 'web') {
        val = await AsyncStorage.getItem(key);
      } else {
        val = await SecureStore.getItemAsync(key);
      }
      if (!val) return null;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    } catch (e) {
      console.warn('Storage getItem error:', e);
      return null;
    }
  },

  async removeItem(key) {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },

  async clear() {
    if (Platform.OS === 'web') {
      await AsyncStorage.clear();
    } else {
      await SecureStore.deleteItemAsync('userAccessToken');
      await SecureStore.deleteItemAsync('userRefreshToken');
      await SecureStore.deleteItemAsync('userProfile');
    }
  },
};
