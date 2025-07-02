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
  },

  // 更新當前用戶資料
  async updateCurrentUser(updates: { name?: string; avatar?: string; [key: string]: any }) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });

    if (error) throw error;
    return data;
  }
};

// 頭像存儲服務
export const avatarService = {
  // 支持的圖片格式
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  
  // 最大文件大小 (10MB) - Supabase Image Transformation 會自動優化
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  // 頭像 bucket 名稱 (暫時使用 uploads bucket，生產環境建議創建專用的 avatars bucket)
  BUCKET_NAME: 'uploads',

  /**
   * 驗證上傳的圖片文件
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // 檢查文件類型
    if (!this.SUPPORTED_FORMATS.includes(file.type)) {
      return {
        isValid: false,
        error: `不支持的文件格式。支持格式：${this.SUPPORTED_FORMATS.map(f => f.split('/')[1].toUpperCase()).join(', ')}`
      };
    }

    // 檢查文件大小
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `文件大小不能超過 ${(this.MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB`
      };
    }

    return { isValid: true };
  },



  /**
   * 生成頭像文件路徑
   */
  generateAvatarPath(userId: string, filename: string): string {
    const timestamp = Date.now();
    const extension = filename.split('.').pop();
    return `${userId}/avatar_${timestamp}.${extension}`;
  },

  /**
   * 上傳頭像
   */
  async uploadAvatar(file: File, userId: string): Promise<{ path: string; url: string }> {
    // 基本驗證
    const fileValidation = this.validateImageFile(file);
    if (!fileValidation.isValid) {
      throw new Error(fileValidation.error);
    }

    // 放寬尺寸驗證，因為 Supabase 會自動處理
    // 只檢查極端情況 (超過 50MP 或 25MB 的 Supabase 限制)
    if (file.size > 25 * 1024 * 1024) {
      throw new Error('檔案太大，無法處理 (超過 25MB)');
    }

    // 生成文件路徑
    const path = this.generateAvatarPath(userId, file.name);

    // 上傳到 Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // 允許覆蓋舊文件
      });

    if (error) {
      console.error('Avatar upload error:', error);
      throw new Error(`上傳失敗: ${error.message}`);
    }

    console.log('Upload success, file path:', data.path);

    // 獲取原始 URL
    const { data: originalUrlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log('Original URL:', originalUrlData.publicUrl);

    // Image Transformation 需要 Pro 計劃，直接使用原始 URL
    console.log('Using original URL (Image Transformation requires Pro plan)');
    return {
      path: data.path,
      url: originalUrlData.publicUrl
    };
  },

  /**
   * 刪除舊頭像
   */
  async deleteAvatar(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Avatar deletion error:', error);
      // 不拋出錯誤，因為刪除失敗不應該阻止新頭像上傳
    }
  },

  /**
   * 從 URL 提取文件路徑
   */
  extractPathFromUrl(url: string): string | null {
    if (!url) return null;
    
    const match = url.match(new RegExp(`/storage/v1/object/public/${this.BUCKET_NAME}/(.+)$`));
    return match ? match[1] : null;
  },

  /**
   * 獲取圖片轉換後的 URL (利用 Supabase Image Transformation)
   */
  getTransformedImageUrl(path: string, options: { width?: number; height?: number; quality?: number } = {}): string {
    const { width = 200, height = 200, quality = 80 } = options;
    
    try {
      const { data } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(path, {
          transform: {
            width,
            height,
            resize: 'cover',
            quality
          }
        });

      console.log('Generated transform URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.warn('Transform URL generation failed:', error);
      // 降級到原始 URL
      const { data: fallbackData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(path);
      return fallbackData.publicUrl;
    }
  }
};