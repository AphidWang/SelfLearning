/**
 * Token 管理器 - 統一處理認證 token 的生命週期
 * 
 * 🎯 功能：
 * - 自動檢測 token 過期
 * - 無感知 refresh token
 * - 統一錯誤處理
 * - 請求攔截和重試
 */

import { supabase } from './supabase';
import { authService } from './auth';

export interface TokenRefreshEvent {
  type: 'TOKEN_REFRESHED' | 'TOKEN_EXPIRED' | 'AUTH_ERROR';
  token?: string;
  error?: string;
}

class TokenManager {
  private refreshPromise: Promise<string | null> | null = null;
  private listeners: ((event: TokenRefreshEvent) => void)[] = [];
  private isRefreshing = false;

  constructor() {
    console.log('🔧 [TokenManager] 初始化...');
    
    // 監聽 Supabase 的認證狀態變化
    supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔄 [TokenManager] Auth 狀態變化: ${event}`, {
        hasSession: !!session,
        hasToken: !!session?.access_token,
        expiresAt: session?.expires_at
      });
      
      if (event === 'TOKEN_REFRESHED' && session) {
        console.log('✅ [TokenManager] Supabase 自動刷新了 token');
        this.handleTokenRefresh(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 [TokenManager] 用戶已登出');
        this.handleTokenExpired();
      }
    });
  }

  /**
   * 獲取有效的 access token
   */
  async getValidToken(): Promise<string | null> {
    try {
      console.log('🎫 [TokenManager] 獲取有效 token...');
      
      // 首先嘗試從當前 session 獲取
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [TokenManager] 獲取 session 失敗:', error);
        return null;
      }

      if (!session) {
        console.warn('⚠️ [TokenManager] 沒有 session，用戶可能未登入');
        return null;
      }

      // 檢查 token 是否即將過期（提前 5 分鐘刷新）
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const bufferTime = 5 * 60; // 5 分鐘緩衝
      const timeToExpiry = expiresAt ? expiresAt - now : 0;

      console.log('📊 [TokenManager] Token 狀態檢查:', {
        expiresAt,
        now,
        timeToExpiry,
        willExpireSoon: timeToExpiry < bufferTime
      });

      if (expiresAt && (expiresAt - now) < bufferTime) {
        // Token 即將過期，嘗試刷新
        console.log('⏰ [TokenManager] Token 即將過期，開始刷新...');
        return await this.refreshToken();
      }

      console.log('✅ [TokenManager] Token 仍然有效');
      return session.access_token;
    } catch (error) {
      console.error('❌ [TokenManager] getValidToken 錯誤:', error);
      return null;
    }
  }

  /**
   * 刷新 token
   */
  async refreshToken(): Promise<string | null> {
    console.log('🔄 [TokenManager] 開始 token 刷新流程...');
    
    // 如果正在刷新，等待當前的刷新完成
    if (this.refreshPromise) {
      console.log('⏳ [TokenManager] 已有刷新在進行中，等待完成...');
      return await this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const token = await this.refreshPromise;
      console.log(`${token ? '✅' : '❌'} [TokenManager] Token 刷新${token ? '成功' : '失敗'}`);
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * 執行 token 刷新
   */
  private async performTokenRefresh(): Promise<string | null> {
    try {
      this.isRefreshing = true;
      console.log('🔄 [TokenManager] 執行 Supabase token 刷新...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ [TokenManager] Supabase Token 刷新失敗:', error);
        this.notifyListeners({
          type: 'AUTH_ERROR',
          error: error.message
        });
        
        // 如果刷新失敗，可能是 refresh token 也過期了
        if (error.message?.includes('refresh_token') || 
            error.message?.includes('expired') ||
            error.message?.includes('invalid')) {
          console.warn('⚠️ [TokenManager] Refresh token 無效，觸發登出');
          await this.handleTokenExpired();
        }
        
        return null;
      }

      if (data.session) {
        const newToken = data.session.access_token;
        const newExpiresAt = data.session.expires_at;
        
        console.log('✅ [TokenManager] Token 刷新成功', {
          hasNewToken: !!newToken,
          newExpiresAt,
          timeToNewExpiry: newExpiresAt ? newExpiresAt - Math.floor(Date.now() / 1000) : 0
        });
        
        // 更新 localStorage
        localStorage.setItem('token', newToken);
        
        this.notifyListeners({
          type: 'TOKEN_REFRESHED',
          token: newToken
        });
        
        return newToken;
      }

      console.warn('⚠️ [TokenManager] 刷新後沒有 session');
      return null;
    } catch (error) {
      console.error('❌ [TokenManager] performTokenRefresh 錯誤:', error);
      this.notifyListeners({
        type: 'AUTH_ERROR',
        error: String(error)
      });
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 處理 token 刷新成功
   */
  private handleTokenRefresh(token: string) {
    console.log('✅ [TokenManager] 處理 token 刷新成功');
    localStorage.setItem('token', token);
    this.notifyListeners({
      type: 'TOKEN_REFRESHED',
      token
    });
  }

  /**
   * 處理 token 過期
   */
  private async handleTokenExpired() {
    console.warn('⚠️ [TokenManager] 處理 token 過期');
    
    // 清除本地存儲
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    this.notifyListeners({
      type: 'TOKEN_EXPIRED'
    });
    
    console.log('🧹 [TokenManager] 本地存儲已清除');
  }

  /**
   * 檢查請求是否為認證錯誤
   */
  isAuthError(error: any): boolean {
    if (!error) return false;
    
    // 檢查 HTTP 狀態碼
    const isHttpAuthError = error.status === 401 || error.status === 403;
    
    // 檢查 Supabase 錯誤
    const isSupabaseAuthError = error.message?.includes('JWT') || 
        error.message?.includes('token') ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('expired');
    
    const isAuthError = isHttpAuthError || isSupabaseAuthError;
    
    if (isAuthError) {
      console.warn('⚠️ [TokenManager] 檢測到認證錯誤:', {
        status: error.status,
        message: error.message,
        isHttpAuthError,
        isSupabaseAuthError
      });
    }
    
    return isAuthError;
  }

  /**
   * 訂閱 token 事件
   */
  subscribe(listener: (event: TokenRefreshEvent) => void) {
    console.log('👂 [TokenManager] 新增事件監聽器');
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      console.log('👂 [TokenManager] 移除事件監聽器');
    };
  }

  /**
   * 通知所有監聽器
   */
  private notifyListeners(event: TokenRefreshEvent) {
    console.log(`📢 [TokenManager] 通知監聽器: ${event.type}`, {
      listenerCount: this.listeners.length,
      hasToken: !!event.token,
      hasError: !!event.error
    });
    
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ [TokenManager] 監聽器錯誤:', error);
      }
    });
  }

  /**
   * 強制登出（清除所有狀態並重定向）
   */
  async forceLogout() {
    console.warn('🚪 [TokenManager] 強制登出');
    
    try {
      await authService.logout();
    } catch (error) {
      console.error('❌ [TokenManager] 登出過程中發生錯誤:', error);
      
      // 即使登出失敗，也要清除本地狀態
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    
    // 重定向到登入頁面
    if (typeof window !== 'undefined') {
      console.log('🔄 [TokenManager] 重定向到登入頁');
      window.location.href = '/';
    }
  }
}

export const tokenManager = new TokenManager(); 