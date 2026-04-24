// Authentication API Service
import { API_CONFIG, USE_MOCK_API, getHeaders } from './config';
import { ApiResponse, User, AuthTokens, LoginRequest, RegisterRequest } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeUser } from './normalizers';

const AUTH_TOKEN_KEY = '@streeskill_auth_token';
const USER_KEY = '@streeskill_user';

const buildMockUser = (overrides: Partial<Pick<User, 'id' | 'email' | 'name'>> = {}): User => ({
  id: overrides.id ?? 'user_001',
  email: overrides.email ?? 'streeskill@example.com',
  name: overrides.name ?? 'StreeSkill Learner',
  createdAt: new Date().toISOString(),
  preferences: {
    notifications: true,
    autoPlay: true,
    downloadOverWifi: true,
    language: 'English',
    captionLanguages: ['Hindi', 'English', 'Tamil'],
  },
});

// Mock user for development
const MOCK_USER: User = buildMockUser();

export const authApi = {
  // POST /auth/register - User signup
  register: async (data: RegisterRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newUser = buildMockUser({
        email: data.email,
        name: data.name,
        id: `user_${Date.now()}`,
      });
      const tokens: AuthTokens = { accessToken: 'mock_token_' + Date.now(), refreshToken: 'mock_refresh_' + Date.now(), expiresIn: 3600 };
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
      return { success: true, data: { user: newUser, tokens } };
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (result.success && result.data?.tokens) {
      const normalizedUser = normalizeUser(result.data.user);
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, result.data.tokens.accessToken);
      if (normalizedUser) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        result.data.user = normalizedUser;
      }
    }
    return result;
  },

  // POST /auth/login - User login
  login: async (data: LoginRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (data.email && data.password.length >= 6) {
        const tokens: AuthTokens = { accessToken: 'mock_token_' + Date.now(), refreshToken: 'mock_refresh_' + Date.now(), expiresIn: 3600 };
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(MOCK_USER));
        return { success: true, data: { user: MOCK_USER, tokens } };
      }
      return { success: false, error: 'Invalid credentials' };
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (result.success && result.data?.tokens) {
      const normalizedUser = normalizeUser(result.data.user);
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, result.data.tokens.accessToken);
      if (normalizedUser) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        result.data.user = normalizedUser;
      }
    }
    return result;
  },

  // POST /auth/logout - Logout
  logout: async (): Promise<ApiResponse<null>> => {
    if (USE_MOCK_API) {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      return { success: true, message: 'Logged out successfully' };
    }
    
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(token || undefined),
    });
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    return response.json();
  },

  // POST /auth/forgot-password - Password reset
  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Password reset email sent' };
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  // GET /auth/me - Get current user profile
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    if (USE_MOCK_API) {
      const userStr = await AsyncStorage.getItem(USER_KEY);
      if (userStr) {
        return { success: true, data: JSON.parse(userStr) };
      }
      return { success: false, error: 'Not authenticated' };
    }
    
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return { success: false, error: 'Not authenticated' };
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
      headers: getHeaders(token),
    });
    const result = await response.json();
    if (result.success && result.data) {
      const normalizedUser = normalizeUser(result.data);
      if (normalizedUser) {
        result.data = normalizedUser;
      }
    }
    return result;
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  },

  // Get stored token
  getToken: async (): Promise<string | null> => {
    return AsyncStorage.getItem(AUTH_TOKEN_KEY);
  },
};
