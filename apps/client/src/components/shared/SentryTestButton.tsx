/**
 * SentryTestButton - Sentry 錯誤監控測試組件
 * 
 * 🎯 功能說明：
 * - 測試 Sentry 錯誤捕捉功能
 * - 僅在開發環境顯示
 * - 提供多種錯誤測試場景
 */

import React from 'react';
import { reportError } from '../../config/sentry';

export const SentryTestButton: React.FC = () => {
  // 只在開發環境顯示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // 測試同步錯誤
  const testSyncError = () => {
    throw new Error('Sentry 測試：同步錯誤');
  };

  // 測試異步錯誤
  const testAsyncError = async () => {
    try {
      await new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sentry 測試：異步錯誤')), 100);
      });
    } catch (error) {
      reportError(error as Error, { testType: 'async', timestamp: Date.now() });
    }
  };

  // 測試 Promise rejection
  const testPromiseRejection = () => {
    Promise.reject(new Error('Sentry 測試：Promise rejection'));
  };

  // 測試手動報告錯誤
  const testManualError = () => {
    const error = new Error('Sentry 測試：手動報告錯誤');
    reportError(error, {
      testType: 'manual',
      userAction: 'button_click',
      timestamp: Date.now()
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="bg-white border border-gray-300 rounded-lg shadow-lg">
        <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
          🐛 Sentry 測試
        </summary>
        <div className="p-3 border-t border-gray-200 space-y-2 min-w-[200px]">
          <button
            onClick={testSyncError}
            className="w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            測試同步錯誤
          </button>
          <button
            onClick={testAsyncError}
            className="w-full px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            測試異步錯誤
          </button>
          <button
            onClick={testPromiseRejection}
            className="w-full px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            測試 Promise Rejection
          </button>
          <button
            onClick={testManualError}
            className="w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            測試手動報告
          </button>
        </div>
      </details>
    </div>
  );
}; 