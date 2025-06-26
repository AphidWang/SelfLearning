import { authService as supabaseAuthService } from './supabase';
import type { User } from '../types/goal';

export const authService = {
  // 登入 - 直接使用 Supabase Auth user_metadata
  async login(credentials: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const { user: supabaseUser, session } = await supabaseAuthService.signIn(credentials.email, credentials.password);
    
    if (!session?.access_token || !supabaseUser) {
      throw new Error('登入失敗：未獲得有效 token');
    }
    
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

    return {
      user: userData,
      token: session.access_token
    };
  },

  // Google 登入
  async loginWithGoogle(): Promise<void> {
    await supabaseAuthService.signInWithGoogle();
    // OAuth 會重定向，不需要返回值
  },

  // 登出 - 直接使用 Supabase
  async logout(): Promise<void> {
    await supabaseAuthService.signOut();
    // 清除本地儲存
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // 更新當前用戶
  async updateCurrentUser(updates: Partial<User>): Promise<void> {
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
    
    if (error) throw error;
  },

  // 獲取當前用戶 - 直接使用 Supabase Auth user_metadata
  async getCurrentUser(): Promise<User | null> {
    try {
      const supabaseUser = await supabaseAuthService.getCurrentUser();
      
      if (!supabaseUser) {
        return null;
      }

      // 支援新的多角色系統，同時向後兼容單角色
      const roles = supabaseUser.user_metadata?.roles || 
                   (supabaseUser.user_metadata?.role ? [supabaseUser.user_metadata.role] : ['student']);
      
      return {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
        avatar: supabaseUser.user_metadata?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${supabaseUser.id}&backgroundColor=ffd5dc`,
        color: supabaseUser.user_metadata?.color || '#FF6B6B',
        roles: roles,
        role: roles[0] // 向後兼容：取第一個角色作為主要角色
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // 檢查是否已登入 - 直接使用 Supabase
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token') || !!supabaseAuthService.getCurrentUser();
  },

  // 獲取 token - 從 Supabase session 獲取
  async getToken(): Promise<string | null> {
    // 優先從 localStorage 獲取，然後從 Supabase session
    const storedToken = localStorage.getItem('token');
    if (storedToken) return storedToken;

    // 嘗試從 Supabase session 獲取
    try {
      const { data: { session } } = await supabaseAuthService.supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  },

  // 註冊 - 直接使用 Supabase，然後在我們的資料庫創建記錄
  async signUp(email: string, password: string, userData: { name: string; role: User['role'] }) {
    const result = await supabaseAuthService.signUp(email, password, userData);
    
    // 如果註冊成功，在我們的資料庫中創建用戶記錄
    if (result.user && !result.user.email_confirmed_at) {
      // 等待郵件確認後，會通過 onAuthStateChange 觸發創建用戶記錄
      console.log('請檢查郵件以確認帳號');
    }
    
    return result;
  },

  // 監聽認證狀態變化 - 直接使用 Supabase
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabaseAuthService.onAuthStateChange(async (supabaseUser) => {
      if (supabaseUser) {
        try {
          const userData = await this.getCurrentUser();
          
          // 如果資料庫沒有用戶記錄，且是新註冊用戶，創建記錄
          if (!userData && supabaseUser.email_confirmed_at) {
            await this.createUserRecord(supabaseUser);
            const newUserData = await this.getCurrentUser();
            callback(newUserData);
          } else {
            callback(userData);
          }
        } catch (error) {
          console.error('Error getting user data on auth change:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },

  // 創建用戶記錄 - 用戶已在 Supabase Auth 中，無需額外操作
  async createUserRecord(supabaseUser: any): Promise<void> {
    try {
      // 用戶已經在 Supabase Auth 中，所有資料都在 user_metadata
      console.log('User already exists in Supabase Auth:', supabaseUser.id);
      // 不需要額外的資料庫操作
    } catch (error) {
      console.error('Error in createUserRecord:', error);
    }
  }
};

export type { User }; 