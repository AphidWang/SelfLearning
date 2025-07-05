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
 *   "name": "第三方登入的顯示名稱",
 *   "nickname": "用戶暱稱（可編輯）",
 *   "role": "student|mentor|parent|admin",
 *   "avatar": "頭像 URL", 
 *   "color": "#FF6B6B",
 *   "email_verified": true
 * }
 * 
 * 注意：
 * - 第三方登入時，name 會被自動設置為 OAuth 提供商的顯示名稱
 * - nickname 用於平台上的顯示名稱，可由用戶自行編輯
 * - 初次登入時，如果 nickname 為空，會自動使用 name 作為 nickname
 * - 其他模組統一使用 nickname 作為顯示名稱
 * 
 * 注意：管理其他用戶的操作請使用 userStore 中的管理員功能
 */

import { createClient } from '@supabase/supabase-js';
import type { User } from '@self-learning/types';
import { ImageProcessor } from '../lib/imageProcessor';

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
          nickname: userData.name, // 註冊時 nickname 和 name 一致
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
    if (!user) return null;

    // 支援新的多角色系統，同時向後兼容單角色
    const roles = user.user_metadata?.roles || 
                 (user.user_metadata?.role ? [user.user_metadata.role] : ['student']);

    // 處理 nickname 邏輯
    const metadata = user.user_metadata || {};
    let needsUpdate = false;
    
    // 如果 nickname 不存在，使用 display name 來設置
    if (!metadata.nickname && user.user_metadata?.name) {
      metadata.nickname = user.user_metadata.name;
      needsUpdate = true;
      
      console.log('🔄 [Supabase] 設置 nickname:', {
        userId: user.id,
        nickname: metadata.nickname,
        source: 'display_name'
      });
    }
    
    // 如果需要更新 metadata，執行更新
    if (needsUpdate) {
      try {
        await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            nickname: metadata.nickname
          }
        });
        console.log('✅ [Supabase] nickname 更新成功');
      } catch (error) {
        console.error('❌ [Supabase] nickname 更新失敗:', error);
      }
    }

    return {
      ...user,
      user_metadata: {
        ...user.user_metadata,
        roles,
        role: roles[0], // 向後兼容：取第一個角色作為主要角色
        nickname: metadata.nickname || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
      }
    };
  },

  // 監聽認證狀態變化
  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  },

  // 更新當前用戶資料
  async updateCurrentUser(updates: { name?: string; avatar?: string; [key: string]: any }) {
    // 如果更新 name，則更新 nickname
    const updateData = { ...updates };
    if (updates.name) {
      updateData.nickname = updates.name;
      delete updateData.name; // 不更新 name 字段，只更新 nickname
    }

    const { data, error } = await supabase.auth.updateUser({
      data: updateData
    });

    if (error) throw error;
    return data;
  }
};

// 頭像存儲服務
export const avatarService = {
  // 支持的圖片格式 (由 ImageProcessor 處理)
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
  
  // 最大檔案大小 (50MB，處理後會壓縮)
  MAX_FILE_SIZE: 50 * 1024 * 1024,

  // 頭像 bucket 名稱
  BUCKET_NAME: 'uploads',

  /**
   * 驗證上傳的圖片檔案 (使用新的圖片處理模組)
   */
  async validateImageFile(file: File): Promise<{ isValid: boolean; error?: string }> {
    try {
      // 使用新的圖片處理模組進行驗證
      const { validateImageFile } = await import('../lib/imageProcessor');
      const result = await validateImageFile(file);
      
      return {
        isValid: result.isValid,
        error: result.error
      };
    } catch (error) {
      return {
        isValid: false,
        error: `驗證失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      };
    }
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
   * 上傳頭像 (整合新的圖片處理模組)
   */
  async uploadAvatar(
    file: File, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ path: string; url: string; processingInfo?: any }> {
    try {
      // 步驟 1: 驗證檔案 (5%)
      onProgress?.(5);
      const validation = await this.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // 步驟 2: 使用新的圖片處理模組處理圖片 (5-70%)
      onProgress?.(10);
      const processingResult = await ImageProcessor.processImage(file, {
        maxSize: 4096, // 支援較大尺寸
        fallbackMaxSize: 2500, // Supabase 限制 (用於 canvas-fallback)
        quality: 0.8,
        targetFormat: 'image/jpeg', // 統一轉為 JPEG 以節省空間
        onProgress: (progress) => {
          onProgress?.(10 + progress * 0.6); // 10-70%
        }
      });

      // 步驟 3: 上傳處理後的檔案 (70-90%)
      onProgress?.(75);
      const path = this.generateAvatarPath(userId, processingResult.file.name);

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(path, processingResult.file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Avatar upload error:', error);
        throw new Error(`上傳失敗: ${error.message}`);
      }

      onProgress?.(85);

      // 步驟 4: 獲取公開 URL (90-100%)
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      onProgress?.(100);

      console.log('頭像上傳成功:', {
        originalSize: processingResult.originalSize,
        processedSize: processingResult.processedSize,
        compressionRatio: ((processingResult.originalSize - processingResult.processedSize) / processingResult.originalSize * 100).toFixed(1) + '%',
        method: processingResult.method,
        formatChanged: processingResult.formatChanged,
        maxSizeUsed: processingResult.method === 'canvas-fallback' ? 2500 : 4096
      });

      return {
        path: data.path,
        url: urlData.publicUrl,
        processingInfo: {
          originalSize: processingResult.originalSize,
          processedSize: processingResult.processedSize,
          originalDimensions: processingResult.originalDimensions,
          processedDimensions: processingResult.processedDimensions,
          method: processingResult.method,
          formatChanged: processingResult.formatChanged,
          compressionRatio: ((processingResult.originalSize - processingResult.processedSize) / processingResult.originalSize * 100).toFixed(1) + '%',
          maxSizeUsed: processingResult.method === 'canvas-fallback' ? 2500 : 4096
        }
      };

    } catch (error) {
      console.error('Avatar upload failed:', error);
      throw new Error(error instanceof Error ? error.message : '頭像上傳失敗');
    }
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
   * 注意：由於我們已經在客戶端處理了圖片，這個方法主要用於進一步優化
   */
  getTransformedImageUrl(path: string, options: { width?: number; height?: number; quality?: number } = {}): Promise<string> {
    const { width = 200, height = 200, quality = 80 } = options;
    
    return new Promise(async (resolve, reject) => {
      try {
        const { data: transformData } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(path, {
            transform: {
              width,
              height,
              resize: 'cover',
              quality
            }
          });
        
        // 測試轉換後的 URL 是否可用
        const transformResponse = await fetch(transformData.publicUrl, { method: 'HEAD' });
        if (transformResponse.ok) {
          return resolve(transformData.publicUrl);
        }
        throw new Error('圖片轉換失敗');

      } catch (error) {
        console.error('Image transform failed:', error);
        reject(new Error('圖片轉換失敗，請稍後再試'));
      }
    });
  }
};