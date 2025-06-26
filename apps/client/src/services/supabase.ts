/**
 * Supabase 前端服務
 * 
 * 架構設計：
 * - 此專案使用 Supabase Auth 內建認證系統
 * - 用戶資料儲存在 auth.users.raw_user_meta_data 中
 * - 不再使用自定義的 users 表
 * - 用戶管理通過 Supabase Auth API 進行
 * 
 * 用戶資料結構 (存於 user_metadata):
 * {
 *   "name": "用戶暱稱",
 *   "role": "student|mentor|parent|admin",
 *   "avatar": "頭像 URL", 
 *   "color": "#FF6B6B",
 *   "email_verified": true
 * }
 * 
 * 注意：管理其他用戶的操作請使用 userStore 中的管理員功能
 */

import { createClient } from '@supabase/supabase-js';
import type { User } from '../types/goal';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// 注意：
// 原本的 userService 已移除，因為不再使用自定義的 users 表
// 用戶管理現在完全通過 Supabase Auth API 進行：
// - 獲取用戶：supabaseAdmin.auth.admin.listUsers()
// - 更新用戶：supabaseAdmin.auth.admin.updateUserById()
// - 刪除用戶：supabaseAdmin.auth.admin.deleteUser()
// 
// 普通用戶操作請使用 authService
// 管理員操作請使用 userStore 中的管理員功能

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
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log('Google OAuth redirect URL:', redirectUrl);
    console.log('window.location.origin:', window.location.origin);
    console.log('import.meta.env.DEV:', import.meta.env.DEV);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
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