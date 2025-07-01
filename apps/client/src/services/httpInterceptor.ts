/**
 * HTTP 攔截器 - 處理 Supabase 請求的認證中間件
 * 
 * 🎯 功能：
 * - 自動為請求添加 token
 * - 攔截認證錯誤
 * - 自動重試失敗的請求
 * - 優雅處理 token 過期
 */

import { supabase } from './supabase';
import { tokenManager } from './tokenManager';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
}

class HttpInterceptor {
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 1,
    retryDelay: 1000
  };

  constructor() {
    this.setupSupabaseInterceptor();
  }

  /**
   * 設置 Supabase 客戶端攔截器
   */
  private setupSupabaseInterceptor() {
    // Supabase 本身處理大部分的 token 管理
    // 我們主要需要監聽錯誤事件並處理
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && !session) {
        // 用戶被登出，可能是 token 過期
        console.log('用戶已登出，可能是 token 過期');
      }
    });
  }

  /**
   * 包裝 Supabase 查詢，添加錯誤處理和重試機制
   */
  async wrapSupabaseQuery<T>(
    queryFn: () => Promise<{ data: T; error: any }>,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<{ data: T; error: any }> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: any = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // 確保有有效的 token
        const token = await tokenManager.getValidToken();
        if (!token && attempt === 0) {
          // 首次嘗試沒有 token，可能需要登入
          return {
            data: null as any,
            error: { message: '用戶未登入', status: 401 }
          };
        }

        // 執行查詢
        const result = await queryFn();
        
        // 檢查是否為認證錯誤
        if (result.error && this.isAuthError(result.error)) {
          lastError = result.error;
          
          if (attempt < config.maxRetries) {
            console.log(`認證錯誤，嘗試刷新 token 並重試 (${attempt + 1}/${config.maxRetries})`);
            
            // 嘗試刷新 token
            const newToken = await tokenManager.refreshToken();
            if (!newToken) {
              // 刷新失敗，強制登出
              await tokenManager.forceLogout();
              return result;
            }
            
            // 等待一段時間後重試
            await this.delay(config.retryDelay);
            continue;
          } else {
            // 重試次數用完，強制登出
            console.error('重試次數用完，強制登出');
            await tokenManager.forceLogout();
          }
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (this.isAuthError(error) && attempt < config.maxRetries) {
          console.log(`請求異常，嘗試重試 (${attempt + 1}/${config.maxRetries}):`, error);
          await this.delay(config.retryDelay);
          continue;
        }
        
        // 非認證錯誤或重試次數用完，直接拋出
        throw error;
      }
    }

    // 如果到這裡，說明所有重試都失敗了
    return {
      data: null as any,
      error: lastError
    };
  }

  /**
   * 包裝 Supabase Storage 操作
   */
  async wrapStorageOperation<T>(
    operationFn: () => Promise<{ data: T; error: any }>,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<{ data: T; error: any }> {
    return this.wrapSupabaseQuery(operationFn, retryConfig);
  }

  /**
   * 檢查是否為認證錯誤
   */
  private isAuthError(error: any): boolean {
    if (!error) return false;
    
    // 檢查錯誤訊息
    const errorMessage = error.message?.toLowerCase() || '';
    const authErrorKeywords = [
      'jwt',
      'token',
      'unauthorized',
      'expired',
      'invalid',
      'malformed',
      'signature'
    ];
    
    if (authErrorKeywords.some(keyword => errorMessage.includes(keyword))) {
      return true;
    }
    
    // 檢查狀態碼
    if (error.status === 401 || error.status === 403) {
      return true;
    }
    
    // 檢查 Supabase 特定錯誤碼
    if (error.code === 'PGRST301' || error.code === 'PGRST302') {
      return true;
    }
    
    return false;
  }

  /**
   * 延遲函數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 為 fetch 請求添加認證 header
   */
  async addAuthHeader(headers: HeadersInit = {}): Promise<HeadersInit> {
    const token = await tokenManager.getValidToken();
    
    if (token) {
      return {
        ...headers,
        'Authorization': `Bearer ${token}`
      };
    }
    
    return headers;
  }

  /**
   * 包裝 fetch 請求
   */
  async wrappedFetch(
    url: string,
    options: RequestInit = {},
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<Response> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: any = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // 添加認證 header
        const headers = await this.addAuthHeader(options.headers);
        const requestOptions = { ...options, headers };
        
        const response = await fetch(url, requestOptions);
        
        // 檢查是否為認證錯誤
        if (response.status === 401 || response.status === 403) {
          if (attempt < config.maxRetries) {
            console.log(`HTTP 認證錯誤，嘗試刷新 token 並重試 (${attempt + 1}/${config.maxRetries})`);
            
            const newToken = await tokenManager.refreshToken();
            if (!newToken) {
              await tokenManager.forceLogout();
              return response;
            }
            
            await this.delay(config.retryDelay);
            continue;
          } else {
            await tokenManager.forceLogout();
          }
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt < config.maxRetries) {
          console.log(`請求失敗，重試 (${attempt + 1}/${config.maxRetries}):`, error);
          await this.delay(config.retryDelay);
          continue;
        }
        
        throw error;
      }
    }

    throw lastError;
  }
}

// 導出單例
export const httpInterceptor = new HttpInterceptor(); 