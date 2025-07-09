/**
 * Sentry 錯誤監控配置
 * 
 * 🎯 功能說明：
 * - 自動捕捉未處理的錯誤和 Promise rejection
 * - 整合 React Error Boundary
 * - 啟用 React Component Stack Trace
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
      
      // 🚀 Replay 配置 - 只在錯誤時記錄，節省配額
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.1,
      
      // 🚀 啟用更好的錯誤追蹤
      integrations: [
        // 捕捉 React 組件錯誤和 component stack
        Sentry.browserTracingIntegration({
          // 關閉 performance 追蹤，但保留錯誤追蹤
          enableLongTask: false,
          enableInp: false
        }),
        
        // 捕捉 console 錯誤
        Sentry.captureConsoleIntegration({
          levels: ['error'] // 只捕捉 console.error
        }),
        
        // 捕捉更多的 React 錯誤資訊
        Sentry.replayIntegration()
      ],
      
      // 🎯 增強錯誤上下文捕捉
      beforeSend: (event, hint) => {
        // 增強 React 錯誤的 component stack
        if (hint.originalException && hint.originalException instanceof Error) {
          const error = hint.originalException as any;
          
          // 如果有 componentStack，添加到 contexts
          if (error.componentStack) {
            event.contexts = event.contexts || {};
            event.contexts.react = {
              componentStack: error.componentStack
            };
          }
          
          // 如果是 DOM 錯誤，添加更多上下文
          if (error.message && error.message.includes('insertBefore')) {
            event.contexts = event.contexts || {};
            event.contexts.dom_error = {
              error_type: 'DOM Manipulation Error',
              error_method: 'insertBefore',
              likely_cause: 'React component rendering issue'
            };
          }
        }
        
        return event;
      }
    });
    
    // 測試 Sentry 是否正常運作
    Sentry.captureMessage('Sentry 初始化測試', 'info');
    console.log('Sentry 初始化成功！');
  } catch (error) {
    console.error('Sentry 初始化失敗：', error);
  }
};

// 🚀 增強的手動報告錯誤函數
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    
    // 如果錯誤有 componentStack，特別處理
    const errorWithStack = error as any;
    if (errorWithStack.componentStack) {
      scope.setContext('react', {
        componentStack: errorWithStack.componentStack
      });
    }
    
    Sentry.captureException(error);
  });
};

// 🎯 專門用於 React 組件錯誤的報告函數
export const reportReactError = (error: Error, errorInfo: React.ErrorInfo, additionalContext?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    // 設置 React 錯誤上下文
    scope.setContext('react', {
      componentStack: errorInfo.componentStack
    });
    
    // 添加額外上下文
    if (additionalContext) {
      Object.entries(additionalContext).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    
    // 設置錯誤標籤
    scope.setTag('error_boundary', 'react');
    scope.setLevel('error');
    
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