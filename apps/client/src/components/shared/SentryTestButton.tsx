/**
 * SentryTestButton - Sentry 錯誤監控測試組件
 * 
 * 🎯 功能說明：
 * - 測試 Sentry 錯誤捕捉功能
 * - 僅在開發環境顯示
 * - 提供多種錯誤測試場景
 * - 🚀 新增 React 組件錯誤測試
 */

import React, { useState } from 'react';
import { reportError, reportReactError } from '../../config/sentry';

// 🚀 測試用的有問題的組件
const BuggyComponent: React.FC<{ shouldCrash: boolean }> = ({ shouldCrash }) => {
  if (shouldCrash) {
    // 這會觸發 React 錯誤邊界
    throw new Error('這是一個模擬的 React 組件錯誤 - 測試 componentStack 追蹤');
  }
  return <div>正常組件</div>;
};

// 🚀 測試 DOM 操作錯誤的組件
const DOMBuggyComponent: React.FC<{ shouldCrash: boolean }> = ({ shouldCrash }) => {
  React.useEffect(() => {
    if (shouldCrash) {
      // 模擬 insertBefore 錯誤
      const fakeError = new Error('Failed to execute \'insertBefore\' on \'Node\': parameter 1 is not of type \'Node\'.');
      (fakeError as any).componentStack = `
    in DOMBuggyComponent
    in div
    in SentryTestButton
    in App`;
      
      setTimeout(() => {
        throw fakeError;
      }, 100);
    }
  }, [shouldCrash]);

  return <div>DOM 測試組件</div>;
};

export const SentryTestButton: React.FC = () => {
  const [showBuggyComponent, setShowBuggyComponent] = useState(false);
  const [showDOMBuggy, setShowDOMBuggy] = useState(false);

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

  // 🚀 測試 React 組件錯誤 (會觸發 Error Boundary)
  const testReactComponentError = () => {
    setShowBuggyComponent(true);
  };

  // 🚀 測試模擬 React 錯誤與 componentStack
  const testReactErrorWithStack = () => {
    const error = new Error('模擬的 React 渲染錯誤');
    const errorInfo: React.ErrorInfo = {
      componentStack: `
    in TestComponent
    in div
    in ErrorBoundary
    in App`
    };

    reportReactError(error, errorInfo, {
      testType: 'simulated_react_error',
      timestamp: Date.now(),
      user_action: 'manual_test'
    });
  };

  // 🚀 測試 DOM insertBefore 錯誤
  const testInsertBeforeError = () => {
    setShowDOMBuggy(true);
  };

  // 🚀 測試手動 DOM 錯誤
  const testManualDOMError = () => {
    const error = new Error('Failed to execute \'insertBefore\' on \'Node\': parameter 1 is not of type \'Node\'.');
    (error as any).componentStack = `
    in ProblematicComponent
    in SomeParentComponent
    in App`;

    reportError(error, {
      testType: 'dom_error',
      errorMethod: 'insertBefore',
      timestamp: Date.now()
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="bg-white border border-gray-300 rounded-lg shadow-lg">
        <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
          🐛 Sentry 測試 (增強版)
        </summary>
        <div className="p-3 border-t border-gray-200 space-y-2 min-w-[250px]">
          {/* 基本錯誤測試 */}
          <div className="border-b border-gray-100 pb-2">
            <div className="text-xs text-gray-500 mb-2">基本錯誤測試</div>
            <button
              onClick={testSyncError}
              className="w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors mb-1"
            >
              測試同步錯誤
            </button>
            <button
              onClick={testAsyncError}
              className="w-full px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors mb-1"
            >
              測試異步錯誤
            </button>
            <button
              onClick={testPromiseRejection}
              className="w-full px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors mb-1"
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

          {/* 🚀 React 組件錯誤測試 */}
          <div className="border-b border-gray-100 pb-2">
            <div className="text-xs text-gray-500 mb-2">React 組件錯誤測試</div>
            <button
              onClick={testReactComponentError}
              className="w-full px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors mb-1"
            >
              觸發 React 組件錯誤
            </button>
            <button
              onClick={testReactErrorWithStack}
              className="w-full px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              模擬 componentStack
            </button>
          </div>

          {/* 🚀 DOM 錯誤測試 */}
          <div>
            <div className="text-xs text-gray-500 mb-2">DOM 錯誤測試</div>
            <button
              onClick={testInsertBeforeError}
              className="w-full px-3 py-1 text-xs bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors mb-1"
            >
              觸發 insertBefore 錯誤
            </button>
            <button
              onClick={testManualDOMError}
              className="w-full px-3 py-1 text-xs bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors"
            >
              模擬 DOM 錯誤
            </button>
          </div>

          {/* 重置按鈕 */}
          {(showBuggyComponent || showDOMBuggy) && (
            <button
              onClick={() => {
                setShowBuggyComponent(false);
                setShowDOMBuggy(false);
              }}
              className="w-full px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              重置測試組件
            </button>
          )}
        </div>
      </details>

      {/* 測試組件 */}
      {showBuggyComponent && <BuggyComponent shouldCrash={true} />}
      {showDOMBuggy && <DOMBuggyComponent shouldCrash={true} />}
    </div>
  );
}; 