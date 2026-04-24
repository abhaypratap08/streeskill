// User Profile API Service
import { API_CONFIG, USE_MOCK_API, getHeaders } from './config';
import { ApiResponse, User, UserPreferences, UserStats } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from './authApi';
import { normalizeUser, normalizeUserPreferences } from './normalizers';

const USER_KEY = '@streeskill_user';
const STATS_KEY = '@streeskill_stats';

export const userApi = {
  // PUT /user/profile - Update profile
  updateProfile: async (data: { name?: string; avatar?: string }): Promise<ApiResponse<User>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const userStr = await AsyncStorage.getItem(USER_KEY);
      if (!userStr) return { success: false, error: 'Not authenticated' };
      
      const user: User = JSON.parse(userStr);
      if (data.name) user.name = data.name;
      if (data.avatar) user.avatar = data.avatar;
      
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      return { success: true, data: user, message: 'Profile updated successfully' };
    }
    
    const token = await authApi.getToken();
    const response = await fetch(`${API_CONFIG.BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: getHeaders(token || undefined),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (result.success && result.data) {
      const normalizedUser = normalizeUser(result.data);
      if (normalizedUser) {
        const userStr = await AsyncStorage.getItem(USER_KEY);
        const existingUser = userStr ? normalizeUser(JSON.parse(userStr)) : undefined;
        const mergedUser = {
          ...(existingUser || normalizedUser),
          ...normalizedUser,
          preferences: normalizedUser.preferences,
        };
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
        result.data = mergedUser;
      }
    }
    return result;
  },

  // PUT /user/password - Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (currentPassword.length < 6) return { success: false, error: 'Current password is incorrect' };
      if (newPassword.length < 6) return { success: false, error: 'New password must be at least 6 characters' };
      return { success: true, message: 'Password changed successfully' };
    }
    
    const token = await authApi.getToken();
    const response = await fetch(`${API_CONFIG.BASE_URL}/user/password`, {
      method: 'PUT',
      headers: getHeaders(token || undefined),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response.json();
  },

  // PUT /user/settings - Update preferences
  updateSettings: async (preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const userStr = await AsyncStorage.getItem(USER_KEY);
      if (!userStr) return { success: false, error: 'Not authenticated' };
      
      const user: User = JSON.parse(userStr);
      user.preferences = { ...user.preferences, ...preferences };
      
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      return { success: true, data: user.preferences, message: 'Settings updated' };
    }
    
    const token = await authApi.getToken();
    const response = await fetch(`${API_CONFIG.BASE_URL}/user/settings`, {
      method: 'PUT',
      headers: getHeaders(token || undefined),
      body: JSON.stringify(preferences),
    });
    const result = await response.json();
    if (result.success && result.data) {
      const normalizedPreferences = normalizeUserPreferences(result.data);
      const userStr = await AsyncStorage.getItem(USER_KEY);
      if (userStr) {
        const existingUser = normalizeUser(JSON.parse(userStr));
        if (existingUser) {
          existingUser.preferences = normalizedPreferences;
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(existingUser));
        }
      }
      result.data = normalizedPreferences;
    }
    return result;
  },

  // GET /user/stats - Get learning stats
  getStats: async (): Promise<ApiResponse<UserStats>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const statsStr = await AsyncStorage.getItem(STATS_KEY);
      const defaultStats: UserStats = {
        totalSessions: 15,
        minutesLearned: 178,
        longestStreak: 8,
        currentStreak: 3,
        coursesCompleted: 2,
        coursesInProgress: 3,
      };
      
      const stats = statsStr ? JSON.parse(statsStr) : defaultStats;
      return { success: true, data: stats };
    }
    
    const token = await authApi.getToken();
    const response = await fetch(`${API_CONFIG.BASE_URL}/user/stats`, { headers: getHeaders(token || undefined) });
    return response.json();
  },

  // Update stats locally (for mock)
  updateStats: async (updates: Partial<UserStats>): Promise<void> => {
    const statsStr = await AsyncStorage.getItem(STATS_KEY);
    const stats: UserStats = statsStr ? JSON.parse(statsStr) : {
      totalSessions: 0, minutesLearned: 0, longestStreak: 0, currentStreak: 0, coursesCompleted: 0, coursesInProgress: 0,
    };
    
    Object.assign(stats, updates);
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  },
};
