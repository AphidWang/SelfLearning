/**
 * 用戶管理 Store
 * 
 * 架構設計：
 * - 普通用戶操作（獲取自己的資料、更新個人資料）：直接使用 Supabase client
 * - 管理其他用戶的操作（管理員功能）：通過 server API (/api/users)
 * 
 * 這樣設計的原因：
 * 1. 普通操作不需要額外的 server 層，直接與 Supabase 通信更高效
 * 2. 管理操作需要特殊權限檢查，通過 server 可以確保安全性
 * 3. 避免在前端暴露過多的資料庫權限
 */

import { create } from 'zustand';
import type { User } from '../types/goal';
import { authService } from '../services/auth';

// 管理員 API 基礎 URL (只用於管理其他用戶)
const ADMIN_API_BASE = '/api/users';

// 管理員 API 呼叫函數
const adminApiCall = async (endpoint: string, options?: RequestInit) => {
  // 嘗試從多個來源獲取 token
  let token = localStorage.getItem('token');
  
  // 如果沒有 token，嘗試從 Supabase session 獲取
  if (!token) {
    try {
      token = await authService.getToken();
      
      // 如果找到 token，存儲它
      if (token) {
        localStorage.setItem('token', token);
      }
    } catch (error) {
      console.warn('Failed to get token from Supabase session:', error);
    }
  }
  
  const response = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// 普通用戶 API 調用函數（不需要管理員權限）
const userApiCall = async (endpoint: string, options?: RequestInit) => {
  let token = localStorage.getItem('token');
  
  if (!token) {
    try {
      token = await authService.getToken();
      if (token) {
        localStorage.setItem('token', token);
      }
    } catch (error) {
      console.warn('Failed to get token from Supabase session:', error);
    }
  }
  
  const response = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// 管理員用戶 API 服務 (只用於管理其他用戶)
const adminUserApi = {
  // 獲取所有用戶 (管理員功能)
  getUsers: () => adminApiCall(''),
  
  // 獲取協作者候選人 (普通用戶功能)
  getCollaboratorCandidates: () => userApiCall('/collaborator-candidates'),
  
  // 根據 ID 獲取用戶 (管理員功能)
  getUser: (id: string) => adminApiCall(`/${id}`),
  
  // 創建認證用戶 (管理員功能)
  createAuthUser: (userData: { 
    email: string; 
    password: string; 
    name: string; 
    roles?: User['roles']; 
    role?: User['role']; // 向後兼容
    avatar?: string; 
    color?: string 
  }) => adminApiCall('/create-auth-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  // 更新用戶 (管理員功能)
  updateUser: (id: string, userData: Partial<User>) =>
    adminApiCall(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  
  // 刪除用戶 (管理員功能) - 軟刪除
  deleteUser: (id: string) =>
    adminApiCall(`/${id}`, {
      method: 'DELETE',
    }),
  
  // 停用用戶 (管理員功能)
  banUser: (id: string, banUntil?: string) =>
    adminApiCall(`/${id}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ banUntil }),
    }),
  
  // 恢復用戶 (管理員功能)
  unbanUser: (id: string) =>
    adminApiCall(`/${id}/unban`, {
      method: 'PUT',
    }),
  
  // 搜尋用戶 (管理員功能)
  searchUsers: (query: string) => adminApiCall(`/search/${encodeURIComponent(query)}`),
  
  // 根據角色獲取用戶 (管理員功能)
  getUsersByRole: (role: string) => adminApiCall(`/role/${role}`),
  
  // 重置用戶密碼 (管理員功能)
  resetUserPassword: (userId: string, password: string) =>
    adminApiCall(`/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    }),
};

interface UserStore {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  
  // 普通用戶操作 (直接使用 Supabase)
  getCurrentUser: () => Promise<User | null>;
  updateCurrentUser: (updates: Partial<User>) => Promise<void>;
  
  // 協作相關 (不需要管理員權限)
  getCollaboratorCandidates: (force?: boolean) => Promise<void>;
  
  // 強制刷新用戶列表 (清除緩存)
  forceRefreshUsers: () => Promise<void>;
  
  // 管理員功能 (通過 server API)
  getUsers: () => Promise<void>;
  createAuthUser: (userData: { 
    email: string; 
    password: string; 
    name: string; 
    roles?: User['roles']; 
    role?: User['role']; // 向後兼容
    avatar?: string; 
    color?: string 
  }) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  banUser: (id: string, banUntil?: string) => Promise<void>;
  unbanUser: (id: string) => Promise<void>;
  resetUserPassword: (userId: string, password: string) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  
  // 搜尋和篩選
  searchUsers: (query: string) => User[];
  getUsersByRole: (role: User['role']) => User[];
  
  // 重置和清理
  clearError: () => void;
  reset: () => void;
}

export const useUserStore = create<UserStore>((set, get) => {
  const store = {
    users: [],
    currentUser: null,
    loading: false,
    error: null,

    // 普通用戶操作 - 直接使用 Supabase
    getCurrentUser: async () => {
      try {
        const userData = await authService.getCurrentUser();
        set({ currentUser: userData });
        return userData;
      } catch (error: any) {
        set({ error: error.message || '獲取當前用戶失敗' });
        return null;
      }
    },

    updateCurrentUser: async (updates: Partial<User>) => {
      set({ loading: true, error: null });
      try {
        const currentUser = get().currentUser;
        if (!currentUser) {
          throw new Error('沒有當前用戶');
        }

        // 直接使用 Supabase 更新 user_metadata，支援多角色
        const updateData: any = {
          name: updates.name || currentUser.name,
          avatar: updates.avatar || currentUser.avatar,
          color: updates.color || currentUser.color,
        };
        
        if (updates.roles) {
          updateData.roles = updates.roles;
          updateData.role = updates.roles[0]; // 向後兼容
        } else if (updates.role) {
          updateData.role = updates.role;
          updateData.roles = [updates.role]; // 向前兼容
        } else {
          updateData.roles = currentUser.roles || [currentUser.role || 'student'];
          updateData.role = currentUser.role || 'student';
        }
        
        // 使用我們的 authService 更新用戶，這樣會回傳正確的 User 類型
        await authService.updateCurrentUser(updates);
        
        // 重新獲取用戶資料以確保同步
        const userData = await authService.getCurrentUser();
        if (!userData) throw new Error('更新後無法獲取用戶資料');

        set({ currentUser: userData, loading: false });
      } catch (error: any) {
        set({ loading: false, error: error.message || '更新用戶失敗' });
        throw error;
      }
    },

    // 協作相關功能 - 不需要管理員權限
    getCollaboratorCandidates: async (force = false) => {
      const { loading } = get();
      if (loading && !force) return;

      set({ loading: true, error: null });
      try {
        const candidates = await adminUserApi.getCollaboratorCandidates();
        set({ users: candidates, loading: false });
      } catch (error: any) {
        set({ loading: false, error: error.message || '獲取協作者候選人失敗' });
        throw error;
      }
    },

    // 管理員功能 - 通過 server API
    getUsers: async () => {
      // 如果正在載入中，避免重複請求
      const { loading } = get();
      if (loading) return;

      set({ loading: true, error: null });
      try {
        const fetchedUsers = await adminUserApi.getUsers();
        set({ users: fetchedUsers, loading: false });
      } catch (error: any) {
        set({ loading: false, error: error.message || '獲取用戶失敗' });
        throw error; // 拋出錯誤以便調用者處理
      }
    },

    createAuthUser: async (userData) => {
      set({ loading: true, error: null });
      try {
        // 確保必需的欄位有預設值
        const userToCreate = {
          ...userData,
          color: userData.color || generateRandomColor(),
          avatar: userData.avatar || generateAvatar(userData.name)
        };

        const response = await adminUserApi.createAuthUser(userToCreate);
        const newUser = response.user;
        
        // 更新本地狀態
        const currentUsers = get().users;
        const updatedUsers = [...currentUsers, newUser];
        set({ users: updatedUsers, loading: false });
        
        return newUser;
      } catch (error: any) {
        const errorMessage = error.message || '創建認證用戶失敗';
        set({ loading: false, error: errorMessage });
        throw error;
      }
    },

    updateUser: async (id, updates) => {
      set({ loading: true, error: null });
      try {
        const updatedUser = await adminUserApi.updateUser(id, updates);
        
        // 更新本地狀態
        const currentUsers = get().users;
        const updatedUsers = currentUsers.map(user =>
          user.id === id ? updatedUser : user
        );
        
        set({ users: updatedUsers, loading: false });
      } catch (error: any) {
        set({ loading: false, error: error.message || '更新用戶失敗' });
        throw error;
      }
    },

    deleteUser: async (id) => {
      set({ loading: true, error: null });
      try {
        await adminUserApi.deleteUser(id);
        
        // 軟刪除：從本地狀態移除用戶
        const currentUsers = get().users;
        const updatedUsers = currentUsers.filter(user => user.id !== id);
        
        set({ users: updatedUsers, loading: false });
      } catch (error: any) {
        set({ loading: false, error: error.message || '刪除用戶失敗' });
        throw error;
      }
    },

    banUser: async (id, banUntil) => {
      set({ loading: true, error: null });
      try {
        await adminUserApi.banUser(id, banUntil);
        
        // 更新本地狀態
        const currentUsers = get().users;
        const updatedUsers = currentUsers.map(user =>
          user.id === id 
            ? { 
                ...user, 
                banned_until: banUntil || 'permanent',
                is_banned: true 
              }
            : user
        );
        
        set({ users: updatedUsers, loading: false });
      } catch (error: any) {
        set({ loading: false, error: error.message || '停用用戶失敗' });
        throw error;
      }
    },

    unbanUser: async (id) => {
      set({ loading: true, error: null });
      try {
        await adminUserApi.unbanUser(id);
        
        // 更新本地狀態
        const currentUsers = get().users;
        const updatedUsers = currentUsers.map(user =>
          user.id === id 
            ? { 
                ...user, 
                banned_until: null,
                is_banned: false 
              }
            : user
        );
        
        set({ users: updatedUsers, loading: false });
      } catch (error: any) {
        set({ loading: false, error: error.message || '恢復用戶失敗' });
        throw error;
      }
    },

    resetUserPassword: async (userId, password) => {
      set({ loading: true, error: null });
      try {
        await adminUserApi.resetUserPassword(userId, password);
        set({ loading: false });
      } catch (error: any) {
        set({ loading: false, error: error.message || '重置密碼失敗' });
        throw error;
      }
    },

    setCurrentUser: (user) => set({ currentUser: user }),

    searchUsers: (query) => {
      const users = get().users;
      if (!query.trim()) return users;
      
      const lowerQuery = query.toLowerCase();
      return users.filter(user =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email?.toLowerCase().includes(lowerQuery)
      );
    },

    getUsersByRole: (role) => {
      const users = get().users;
      return users.filter(user => user.role === role);
    },

    clearError: () => set({ error: null }),

    reset: () => set({
      users: [],
      currentUser: null,
      loading: false,
      error: null
    }),

    // 強制刷新用戶列表 (清除緩存)
    forceRefreshUsers: async () => {
      set({ loading: true, error: null });
      try {
        const candidates = await adminUserApi.getCollaboratorCandidates();
        set({ users: candidates, loading: false });
      } catch (error: any) {
        set({ loading: false, error: error.message || '強制刷新用戶列表失敗' });
        throw error;
      }
    }
  };

  return store;
});

// 輔助函數
const generateRandomColor = (): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const generateAvatar = (name: string): string => {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=ffd5dc`;
}; 