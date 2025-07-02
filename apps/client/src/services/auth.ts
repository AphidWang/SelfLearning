import { authService as supabaseAuthService } from './supabase';
import type { User } from '../types/goal';

export const authService = {
  // 登入 - 直接使用 Supabase Auth user_metadata
  async login(credentials: { email: string; password: string }): Promise<{ user: User; token: string }> {
    console.log('🔐 [Auth] 開始登入流程...', { email: credentials.email });
    
    const { user: supabaseUser, session } = await supabaseAuthService.signIn(credentials.email, credentials.password);
    
    if (!session?.access_token || !supabaseUser) {
      console.error('❌ [Auth] 登入失敗：未獲得有效 token 或用戶信息');
      throw new Error('登入失敗：未獲得有效 token');
    }
    
    console.log('✅ [Auth] Supabase 登入成功', {
      userId: supabaseUser.id,
      hasToken: !!session.access_token,
      hasRefreshToken: !!session.refresh_token,
      expiresAt: session.expires_at
    });
    
    // 支援新的多角色系統，同時向後兼容單角色
    const roles = supabaseUser.user_metadata?.roles || 
                 (supabaseUser.user_metadata?.role ? [supabaseUser.user_metadata.role] : ['student']);
    
    const userData: User = {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
      avatar: supabaseUser.user_metadata?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${supabaseUser.id}&backgroundColor=ffd5dc`,
      color: supabaseUser.user_metadata?.color || '#FF6B6B',
      roles: roles,
      role: roles[0] // 向後兼容：取第一個角色作為主要角色
    };

    // 存儲 token 到 localStorage
    localStorage.setItem('token', session.access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    console.log('💾 [Auth] 用戶數據已保存到 localStorage', {
      userId: userData.id,
      name: userData.name,
      roles: userData.roles
    });

    return {
      user: userData,
      token: session.access_token
    };
  },

  // Google 登入
  async loginWithGoogle(): Promise<void> {
    console.log('🔐 [Auth] 開始 Google 登入流程...');
    await supabaseAuthService.signInWithGoogle();
    // OAuth 會重定向，不需要返回值
  },

  // 登出 - 直接使用 Supabase
  async logout(): Promise<void> {
    console.log('🚪 [Auth] 開始登出流程...');
    
    try {
      await supabaseAuthService.signOut();
      console.log('✅ [Auth] Supabase 登出成功');
    } catch (error) {
      console.error('❌ [Auth] Supabase 登出失敗:', error);
    }
    
    // 清除本地儲存
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    console.log('🧹 [Auth] 本地儲存已清除');
  },

  // 更新當前用戶
  async updateCurrentUser(updates: Partial<User>): Promise<void> {
    console.log('🔄 [Auth] 更新用戶資料...', updates);
    
    // 構建更新資料，支援多角色
    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.avatar) updateData.avatar = updates.avatar;
    if (updates.color) updateData.color = updates.color;
    
    if (updates.roles) {
      updateData.roles = updates.roles;
      updateData.role = updates.roles[0]; // 向後兼容
    } else if (updates.role) {
      updateData.role = updates.role;
      updateData.roles = [updates.role]; // 向前兼容
    }
    
    const { error } = await supabaseAuthService.supabase.auth.updateUser({
      data: updateData
    });
    
    if (error) {
      console.error('❌ [Auth] 更新用戶資料失敗:', error);
      throw error;
    }
    
    console.log('✅ [Auth] 用戶資料更新成功');
  },

  // 獲取當前用戶 - 直接使用 Supabase Auth user_metadata
  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('👤 [Auth] 獲取當前用戶...');
      const supabaseUser = await supabaseAuthService.getCurrentUser();
      
      if (!supabaseUser) {
        console.log('👤 [Auth] 沒有當前用戶');
        return null;
      }

      // 支援新的多角色系統，同時向後兼容單角色
      const roles = supabaseUser.user_metadata?.roles || 
                   (supabaseUser.user_metadata?.role ? [supabaseUser.user_metadata.role] : ['student']);
      
      const userData = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
        avatar: supabaseUser.user_metadata?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${supabaseUser.id}&backgroundColor=ffd5dc`,
        color: supabaseUser.user_metadata?.color || '#FF6B6B',
        roles: roles,
        role: roles[0] // 向後兼容：取第一個角色作為主要角色
      };
      
      console.log('✅ [Auth] 獲取用戶成功', {
        userId: userData.id,
        name: userData.name,
        roles: userData.roles
      });
      
      return userData;
    } catch (error) {
      console.error('❌ [Auth] 獲取當前用戶失敗:', error);
      return null;
    }
  },

  // 檢查是否已登入 - 直接使用 Supabase
  isAuthenticated(): boolean {
    const hasLocalToken = !!localStorage.getItem('token');
    console.log(`🔍 [Auth] 檢查認證狀態: localStorage token 存在 = ${hasLocalToken}`);
    return hasLocalToken;
  },

  // 獲取 token - 從 Supabase session 獲取
  async getToken(): Promise<string | null> {
    console.log('🎫 [Auth] 獲取 token...');
    
    // 優先從 localStorage 獲取，然後從 Supabase session
    const storedToken = localStorage.getItem('token');
    console.log(`💾 [Auth] localStorage token 存在: ${!!storedToken}`);
    
    if (storedToken) return storedToken;

    // 嘗試從 Supabase session 獲取
    try {
      const { data: { session }, error } = await supabaseAuthService.supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [Auth] 獲取 session 失敗:', error);
        return null;
      }
      
      if (session?.access_token) {
        console.log('✅ [Auth] 從 session 獲取到 token');
        // 更新 localStorage
        localStorage.setItem('token', session.access_token);
        return session.access_token;
      }
      
      console.log('⚠️ [Auth] Session 中沒有 token');
      return null;
    } catch (error) {
      console.error('❌ [Auth] getToken 失敗:', error);
      return null;
    }
  },

  // 註冊 - 直接使用 Supabase，然後在我們的資料庫創建記錄
  async signUp(email: string, password: string, userData: { name: string; role: User['role'] }) {
    console.log('📝 [Auth] 開始註冊流程...', { email, role: userData.role });
    
    const result = await supabaseAuthService.signUp(email, password, userData);
    
    // 如果註冊成功，在我們的資料庫中創建用戶記錄
    if (result.user && !result.user.email_confirmed_at) {
      // 等待郵件確認後，會通過 onAuthStateChange 觸發創建用戶記錄
      console.log('📧 [Auth] 註冊成功，等待郵件確認');
    }
    
    return result;
  },

  // 監聽認證狀態變化 - 直接使用 Supabase
  onAuthStateChange(callback: (user: User | null) => void) {
    console.log('👂 [Auth] 設置認證狀態監聽器');
    
    return supabaseAuthService.onAuthStateChange(async (supabaseUser) => {
      console.log('🔄 [Auth] 認證狀態變化', {
        hasUser: !!supabaseUser,
        userId: supabaseUser?.id,
        email: supabaseUser?.email
      });
      
      if (supabaseUser) {
        try {
          const userData = await this.getCurrentUser();
          
          // 如果資料庫沒有用戶記錄，且是新註冊用戶，創建記錄
          if (!userData && supabaseUser.email_confirmed_at) {
            console.log('👤 [Auth] 新用戶確認郵件，創建記錄');
            await this.createUserRecord(supabaseUser);
            const newUserData = await this.getCurrentUser();
            callback(newUserData);
          } else {
            callback(userData);
          }
        } catch (error) {
          console.error('❌ [Auth] 認證狀態變化處理失敗:', error);
          callback(null);
        }
      } else {
        console.log('👤 [Auth] 用戶已登出');
        callback(null);
      }
    });
  },

  // 創建用戶記錄 - 用戶已在 Supabase Auth 中，無需額外操作
  async createUserRecord(supabaseUser: any): Promise<void> {
    try {
      // 用戶已經在 Supabase Auth 中，所有資料都在 user_metadata
      console.log('👤 [Auth] 用戶已存在於 Supabase Auth:', supabaseUser.id);
      // 不需要額外的資料庫操作
    } catch (error) {
      console.error('❌ [Auth] createUserRecord 失敗:', error);
    }
  }
};

export type { User }; 