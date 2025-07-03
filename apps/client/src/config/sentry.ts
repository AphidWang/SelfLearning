/**
 * Sentry 錯誤監控配置
 * 
 * 🎯 功能說明：
 * - 自動捕捉未處理的錯誤和 Promise rejection
 * - 整合 React Error Boundary
 * - 關閉 Performance Monitoring 以節省配額
 * 
 * 📝 使用說明：
 * 1. 將 DSN 替換為實際的 Sentry DSN
 * 2. 根據環境調整 sampleRate 和 debug 設定
 */

import * as Sentry from '@sentry/react';
import { useEffect } from 'react';

// Sentry DSN - 請替換為你的實際 DSN
const SENTRY_DSN = process.env.VITE_SENTRY_DSN || '';

// 是否為開發環境
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 初始化 Sentry
 */
export const initSentry = () => {
  // 如果沒有 DSN，則不初始化 Sentry
  if (!SENTRY_DSN) {
    console.log('Sentry DSN not found, skipping initialization');
    return;
  }

  Sentry.init({
    // Sentry DSN
    dsn: SENTRY_DSN,
    
    // 環境設定
    environment: isDevelopment ? 'development' : 'production',
    
    // 錯誤採樣率 (1.0 = 100%)
    sampleRate: isDevelopment ? 1.0 : 0.1,
    
    // 關閉 Performance Monitoring
    tracesSampleRate: 0,
    
    // 開發環境啟用 debug
    debug: isDevelopment,
    
    // 自動捕捉設定
    autoSessionTracking: true,
    
    // 整合設定
    integrations: [
      // React Router 整合
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
      }),
      
      // 重播錯誤整合（可選）
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // 重播採樣率（關閉以節省配額）
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    
    // 過濾不需要的錯誤
    beforeSend(event, hint) {
      // 過濾開發環境的某些錯誤
      if (isDevelopment) {
        // 過濾 HMR 相關錯誤
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message);
          if (message.includes('Loading chunk') || message.includes('ChunkLoadError')) {
            return null;
          }
        }
      }
      
      return event;
    },
    
    // 設定發佈版本（可選）
    release: process.env.VITE_APP_VERSION || 'unknown',
  });
};

// 導出 Sentry 實例以便在其他地方使用
export { Sentry };

// 手動報告錯誤的輔助函數
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

// 設定用戶資訊
export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

// 清除用戶資訊（登出時使用）
export const clearUser = () => {
  Sentry.setUser(null);
}; 