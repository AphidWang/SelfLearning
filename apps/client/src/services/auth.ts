import { api } from './api';
import type { User, LoginCredentials, LoginResponse } from '@self-learning/types';

export const authService = {
  // 正式 API 呼叫
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // 如果是 demo 帳號，使用模擬資料
    if (credentials.email.includes('demo')) {
      return this.handleDemoLogin(credentials.email);
    }

    // 正式 API 呼叫
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Demo 用途的登入處理
  async handleDemoLogin(email: string): Promise<LoginResponse> {
    // 模擬網路延遲
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email.includes('student')) {
      return {
        user: {
          id: '1',
          name: 'Alex Student',
          role: 'student',
          avatar: 'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=150'
        },
        token: 'demo-student-token'
      };
    } else {
      return {
        user: {
          id: '2',
          name: 'Sam Mentor',
          role: 'mentor',
          avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150'
        },
        token: 'demo-mentor-token'
      };
    }
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('token');
    
    // 如果是 demo token，直接清除
    if (token?.startsWith('demo-')) {
      localStorage.removeItem('token');
      return;
    }

    // 正式 API 呼叫
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('token');
    
    // 如果是 demo token，返回對應的模擬用戶
    if (token?.startsWith('demo-')) {
      return token.includes('student')
        ? {
            id: '1',
            name: 'Alex Student',
            role: 'student',
            avatar: 'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=150'
          }
        : {
            id: '2',
            name: 'Sam Mentor',
            role: 'mentor',
            avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150'
          };
    }

    // 正式 API 呼叫
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch {
      return null;
    }
  }
}; 