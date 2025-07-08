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
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';

// Sentry DSN - 請替換為你的實際 DSN
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

// 是否為開發環境
const isDevelopment = import.meta.env.MODE === 'development';

/**
 * 初始化 Sentry
 */
export const initSentry = () => {
  console.log('開始初始化 Sentry...');
  try {
    Sentry.init({
      dsn: "https://d347fd97a10246c0312bbf9411fc63dd@o4509603489316864.ingest.us.sentry.io/4509603494100993",
      environment: "production", // 固定為 production 環境
      debug: false,
      tracesSampleRate: 0, // 關閉 Performance Tracing
      sendDefaultPii: true,
      // 捕捉 console 錯誤
      integrations: [
        Sentry.captureConsoleIntegration({
          levels: ['error'] // 只捕捉 console.error
        })
      ],
    });
    
    // 測試 Sentry 是否正常運作
    Sentry.captureMessage('Sentry 初始化測試', 'info');
    console.log('Sentry 初始化成功！');
  } catch (error) {
    console.error('Sentry 初始化失敗：', error);
  }
};

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

// 導出 ErrorBoundary 供 App.tsx 使用
export const ErrorBoundary = Sentry.ErrorBoundary; 