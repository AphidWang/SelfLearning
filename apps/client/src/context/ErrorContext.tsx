import React, { createContext, useContext, useState, ReactNode } from 'react';
import { X, AlertTriangle, XCircle, Info, CheckCircle } from 'lucide-react';

// 錯誤類型定義
export interface ErrorInfo {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: string;
  errorCode?: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
  canClose?: boolean;
}

// Context 類型定義
interface ErrorContextType {
  // 顯示錯誤的方法
  showError: (error: Partial<ErrorInfo>) => void;
  showWarning: (warning: Partial<ErrorInfo>) => void;
  showInfo: (info: Partial<ErrorInfo>) => void;
  showSuccess: (success: Partial<ErrorInfo>) => void;
  
  // 網路錯誤處理
  handleNetworkError: (error: any, context?: string) => void;
  
  // 權限錯誤處理
  handleAuthError: (error: any, context?: string) => void;
  
  // API 錯誤處理
  handleApiError: (error: any, context?: string) => void;
  
  // 清除錯誤
  clearError: (id: string) => void;
  clearAllErrors: () => void;
  
  // 當前錯誤列表
  errors: ErrorInfo[];
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// 錯誤對話框組件
const ErrorDialog: React.FC<{ error: ErrorInfo; onClose: () => void }> = ({ error, onClose }) => {
  const getIcon = () => {
    switch (error.type) {
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
    }
  };

  const getBgColor = () => {
    switch (error.type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 ${getBgColor()}`}>
          {getIcon()}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
            {error.title}
          </h3>
          {error.canClose !== false && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {error.message}
          </p>

          {/* 錯誤詳情 */}
          {error.details && (
            <div className="mb-4">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  技術詳情
                </summary>
                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-32">
                  {error.details}
                </pre>
              </details>
            </div>
          )}

          {/* 錯誤代碼 */}
          {error.errorCode && (
            <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              錯誤代碼: {error.errorCode}
            </div>
          )}

          {/* 時間戳 */}
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            發生時間: {error.timestamp.toLocaleString('zh-TW')}
          </div>

          {/* 建議的解決方案 */}
          {error.type === 'error' && (
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm">
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">建議解決方案：</p>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 檢查網路連線是否正常</li>
                <li>• 重新整理頁面再試一次</li>
                <li>• 如果問題持續，請聯絡系統管理員</li>
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end gap-3">
          {error.action && (
            <button
              onClick={error.action.onClick}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {error.action.label}
            </button>
          )}
          
          {error.canClose !== false && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              關閉
            </button>
          )}
          
          {error.type === 'error' && (
            <button
              onClick={() => {
                // 複製錯誤信息到剪貼板
                const errorInfo = `
錯誤標題: ${error.title}
錯誤訊息: ${error.message}
錯誤代碼: ${error.errorCode || 'N/A'}
發生時間: ${error.timestamp.toLocaleString('zh-TW')}
技術詳情: ${error.details || 'N/A'}
                `.trim();
                
                navigator.clipboard.writeText(errorInfo).then(() => {
                  alert('錯誤信息已複製到剪貼板，請提供給系統管理員');
                });
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
            >
              複製錯誤信息
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Provider 組件
export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  // 生成唯一 ID
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // 通用錯誤顯示方法
  const showError = (errorData: Partial<ErrorInfo>) => {
    const error: ErrorInfo = {
      id: generateId(),
      type: 'error',
      title: '發生錯誤',
      message: '系統發生未預期的錯誤',
      timestamp: new Date(),
      canClose: true,
      ...errorData,
    };
    
    setErrors(prev => [...prev, error]);
    
    // 自動清除成功消息
    if (error.type === 'success') {
      setTimeout(() => {
        clearError(error.id);
      }, 5000);
    }
  };

  const showWarning = (warningData: Partial<ErrorInfo>) => {
    showError({ ...warningData, type: 'warning', title: warningData.title || '警告' });
  };

  const showInfo = (infoData: Partial<ErrorInfo>) => {
    showError({ ...infoData, type: 'info', title: infoData.title || '提示' });
  };

  const showSuccess = (successData: Partial<ErrorInfo>) => {
    showError({ ...successData, type: 'success', title: successData.title || '成功' });
  };

  // 網路錯誤處理
  const handleNetworkError = (error: any, context = '') => {
    console.error('🌐 [Network Error]', { error, context });
    
    let message = '網路連線發生問題，請檢查您的網路狀態。';
    let details = '';
    
    if (error?.code === 'NETWORK_ERROR') {
      message = '無法連接到伺服器，請檢查網路連線。';
    } else if (error?.message) {
      details = error.message;
    }
    
    showError({
      title: '網路連線錯誤',
      message: context ? `在${context}時發生網路錯誤：${message}` : message,
      details,
      errorCode: error?.code || 'NETWORK_ERROR',
    });
  };

  // 權限錯誤處理  
  const handleAuthError = (error: any, context = '') => {
    console.error('🔐 [Auth Error]', { error, context });
    
    let message = '您沒有權限執行此操作，請聯絡系統管理員。';
    let details = '';
    
    if (error?.status === 401) {
      message = '登入狀態已過期，請重新登入。';
    } else if (error?.status === 403) {
      message = '您沒有足夠的權限執行此操作。';
    } else if (error?.message) {
      details = error.message;
    }
    
    showError({
      title: '權限不足',
      message: context ? `在${context}時發生權限錯誤：${message}` : message,
      details,
      errorCode: error?.status?.toString() || 'AUTH_ERROR',
      action: error?.status === 401 ? {
        label: '重新登入',
        onClick: () => {
          localStorage.clear();
          window.location.href = '/';
        }
      } : undefined
    });
  };

  // API 錯誤處理
  const handleApiError = (error: any, context = '') => {
    console.error('🔧 [API Error]', { error, context });
    
    // 根據錯誤類型選擇處理方式
    if (error?.status === 401 || error?.status === 403) {
      return handleAuthError(error, context);
    }
    
    if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return handleNetworkError(error, context);
    }
    
    // 一般 API 錯誤
    let message = '伺服器發生錯誤，請稍後再試。';
    let details = '';
    
    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      details = error.message;
    }
    
    showError({
      title: 'API 錯誤',
      message: context ? `在${context}時發生錯誤：${message}` : message,
      details,
      errorCode: error?.status?.toString() || error?.code || 'API_ERROR',
    });
  };

  // 清除錯誤
  const clearError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  const contextValue: ErrorContextType = {
    showError,
    showWarning,
    showInfo,
    showSuccess,
    handleNetworkError,
    handleAuthError,
    handleApiError,
    clearError,
    clearAllErrors,
    errors,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      
      {/* 錯誤對話框 */}
      {errors.map(error => (
        <ErrorDialog
          key={error.id}
          error={error}
          onClose={() => clearError(error.id)}
        />
      ))}
    </ErrorContext.Provider>
  );
};

// Hook
export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}; 