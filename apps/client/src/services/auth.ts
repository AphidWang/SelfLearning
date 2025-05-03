import { api } from './api';
import type { User, LoginCredentials, LoginResponse } from '@self-learning/types';

export const authService = {
  // 正式 API 呼叫
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
    localStorage.removeItem('token');
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch {
      return null;
    }
  }
}; 