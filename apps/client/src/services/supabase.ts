/**
 * Supabase 前端服務
 * 
 * 架構設計：
 * - 此檔案用於普通用戶操作（獲取自己的資料、更新個人資料等）
 * - 直接與 Supabase 通信，不經過 server 層
 * - 用於提高效能和減少不必要的 API 層
 * 
 * 注意：管理其他用戶的操作請使用 userStore 中的管理員功能
 */

import { createClient } from '@supabase/supabase-js';
import type { User } from '../types/goal';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// 數據庫類型定義
export interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color?: string;
  role: 'student' | 'mentor' | 'parent' | 'admin';
  created_at: string;
  updated_at: string;
}

// 用戶服務
export const userService = {
  // 獲取所有用戶
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(transformDatabaseUser);
  },

  // 根據 ID 獲取用戶
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // 找不到記錄
      throw error;
    }

    return transformDatabaseUser(data);
  },

  // 新增用戶
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const dbUser = {
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      color: userData.color,
      role: userData.role || 'student'
    };

    const { data, error } = await supabase
      .from('users')
      .insert([dbUser])
      .select()
      .single();

    if (error) throw error;
    
    return transformDatabaseUser(data);
  },

  // 更新用戶
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const dbUpdates = {
      ...(updates.name && { name: updates.name }),
      ...(updates.email && { email: updates.email }),
      ...(updates.avatar !== undefined && { avatar: updates.avatar }),
      ...(updates.color && { color: updates.color }),
      ...(updates.role && { role: updates.role }),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return transformDatabaseUser(data);
  },

  // 刪除用戶
  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 搜尋用戶
  async searchUsers(query: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(transformDatabaseUser);
  },

  // 根據角色獲取用戶
  async getUsersByRole(role: User['role']): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(transformDatabaseUser);
  },

  // 實時訂閱用戶變化
  subscribeToUsers(callback: (users: User[]) => void) {
    const channel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        async () => {
          // 重新獲取所有用戶
          try {
            const users = await this.getUsers();
            callback(users);
          } catch (error) {
            console.error('Failed to fetch users on real-time update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

// 將數據庫用戶轉換為應用用戶類型
function transformDatabaseUser(dbUser: DatabaseUser): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    avatar: dbUser.avatar,
    color: dbUser.color,
    role: dbUser.role
  };
}

// 用戶認證服務
export const authService = {
  // 暴露 supabase client 供其他地方使用
  supabase,

  // 註冊
  async signUp(email: string, password: string, userData: { name: string; role: User['role'] }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role
        }
      }
    });

    if (error) throw error;
    return data;
  },

  // 登入
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  // Google 登入
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  },

  // 登出
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 獲取當前用戶
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // 監聽認證狀態變化
  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
};