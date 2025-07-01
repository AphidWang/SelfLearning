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
    // 監聽 Supabase 的認證狀態變化
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session) {
        this.handleTokenRefresh(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        this.handleTokenExpired();
      }
    });
  }

  /**
   * 獲取有效的 access token
   */
  async getValidToken(): Promise<string | null> {
    try {
      // 首先嘗試從當前 session 獲取
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('獲取 session 失敗:', error);
        return null;
      }

      if (!session) {
        return null;
      }

      // 檢查 token 是否即將過期（提前 5 分鐘刷新）
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const bufferTime = 5 * 60; // 5 分鐘緩衝

      if (expiresAt && (expiresAt - now) < bufferTime) {
        // Token 即將過期，嘗試刷新
        return await this.refreshToken();
      }

      return session.access_token;
    } catch (error) {
      console.error('getValidToken 錯誤:', error);
      return null;
    }
  }

  /**
   * 刷新 token
   */
  async refreshToken(): Promise<string | null> {
    // 如果正在刷新，等待當前的刷新完成
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const token = await this.refreshPromise;
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
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Token 刷新失敗:', error);
        this.notifyListeners({
          type: 'AUTH_ERROR',
          error: error.message
        });
        
        // 如果刷新失敗，可能是 refresh token 也過期了
        if (error.message?.includes('refresh_token') || error.message?.includes('expired')) {
          await this.handleTokenExpired();
        }
        
        return null;
      }

      if (data.session) {
        const newToken = data.session.access_token;
        
        // 更新 localStorage
        localStorage.setItem('token', newToken);
        
        this.notifyListeners({
          type: 'TOKEN_REFRESHED',
          token: newToken
        });
        
        return newToken;
      }

      return null;
    } catch (error) {
      console.error('performTokenRefresh 錯誤:', error);
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
    // 清除本地存儲
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    this.notifyListeners({
      type: 'TOKEN_EXPIRED'
    });
  }

  /**
   * 檢查請求是否為認證錯誤
   */
  isAuthError(error: any): boolean {
    if (!error) return false;
    
    // 檢查 HTTP 狀態碼
    if (error.status === 401 || error.status === 403) {
      return true;
    }
    
    // 檢查 Supabase 錯誤
    if (error.message?.includes('JWT') || 
        error.message?.includes('token') ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('expired')) {
      return true;
    }
    
    return false;
  }

  /**
   * 訂閱 token 事件
   */
  subscribe(listener: (event: TokenRefreshEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 通知所有監聽器
   */
  private notifyListeners(event: TokenRefreshEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Token event listener 錯誤:', error);
      }
    });
  }

  /**
   * 強制登出
   */
  async forceLogout() {
    try {
      await authService.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('強制登出錯誤:', error);
      // 即使登出失敗，也要清除本地數據並跳轉
      localStorage.clear();
      window.location.href = '/login';
    }
  }
}

// 導出單例
export const tokenManager = new TokenManager(); 