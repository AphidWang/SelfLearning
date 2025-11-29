/**
 * 認證上下文 - 全域認證狀態管理
 * 
 * 🎯 功能：
 * - 統一管理認證狀態
 * - 處理 token 過期事件
 * - 提供認證錯誤處理
 * - 自動重定向管理
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { tokenManager, TokenRefreshEvent } from '../services/tokenManager';
import { authService } from '../services/auth';
import type { User } from '@self-learning/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  tokenStatus: 'valid' | 'expired' | 'refreshing' | 'error' | 'unknown';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenStatus, setTokenStatus] = useState<AuthContextType['tokenStatus']>('unknown');

  // 處理 token 事件
  useEffect(() => {
    const unsubscribe = tokenManager.subscribe((event: TokenRefreshEvent) => {
      switch (event.type) {
        case 'TOKEN_REFRESHED':
          setTokenStatus('valid');
          console.log('Token 已刷新');
          break;
          
        case 'TOKEN_EXPIRED':
          setTokenStatus('expired');
          setUser(null);
          console.log('Token 已過期，清除用戶狀態');
          
          // 如果當前不在登入頁面，顯示提示並跳轉
          if (!window.location.pathname.includes('/login')) {
            showTokenExpiredNotification();
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          }
          break;
          
        case 'AUTH_ERROR':
          setTokenStatus('error');
          console.error('認證錯誤:', event.error);
          
          // 根據錯誤類型決定處理方式
          if (event.error?.includes('expired') || event.error?.includes('invalid')) {
            setUser(null);
            if (!window.location.pathname.includes('/login')) {
              showTokenExpiredNotification();
              setTimeout(() => {
                window.location.href = '/login';
              }, 2000);
            }
          }
          break;
      }
    });

    return unsubscribe;
  }, []);

  // 初始化認證狀態
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // 檢查是否有有效的 token
      const token = await tokenManager.getValidToken();
      
      if (token) {
        // 獲取用戶信息
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setTokenStatus('valid');
        } else {
          setTokenStatus('error');
        }
      } else {
        setTokenStatus('expired');
      }
    } catch (error) {
      console.error('初始化認證狀態失敗:', error);
      setTokenStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const { user: loggedInUser } = await authService.login(credentials);
      setUser(loggedInUser);
      setTokenStatus('valid');
    } catch (error) {
      setTokenStatus('error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setTokenStatus('expired');
    } catch (error) {
      console.error('登出失敗:', error);
      // 即使登出失敗，也要清除本地狀態
      setUser(null);
      setTokenStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        setTokenStatus('valid');
      } else {
        setTokenStatus('expired');
      }
    } catch (error) {
      console.error('刷新用戶信息失敗:', error);
      setTokenStatus('error');
    }
  };

  const showTokenExpiredNotification = () => {
    // 創建一個簡單的通知
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 300px;
      ">
        <div style="font-weight: 600; margin-bottom: 4px;">登入已過期</div>
        <div>正在為您跳轉到登入頁面...</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3 秒後移除通知
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  const isAuthenticated = !!user && tokenStatus === 'valid';

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    tokenStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 高階組件：需要認證的路由保護
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <Navigate to="/login" replace /> 
}) => {
  const { isAuthenticated, isLoading, tokenStatus } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>正在驗證身份...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // 如果 token 狀態不是單純的過期，顯示錯誤信息
    if (tokenStatus === 'error') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-600">
            <div className="text-lg font-semibold mb-2">認證錯誤</div>
            <div>請重新登入</div>
          </div>
        </div>
      );
    }
    
    return fallback;
  }

  return <>{children}</>;
};

// 角色保護路由組件
interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRoles: string[];
  fallbackPath?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  requiredRoles,
  fallbackPath 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>正在驗證權限...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 檢查用戶角色（支援新舊格式）
  const userRoles = user.roles || (user.role ? [user.role] : ['student']);
  const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role as any));

  if (!hasRequiredRole) {
    // 根據用戶的角色決定重定向路徑
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    }

    // 預設重定向邏輯
    const primaryRole = userRoles[0];
    
    if (primaryRole === 'admin') {
      return <Navigate to="/admin/users" replace />;
    } else if (primaryRole === 'mentor') {
      return <Navigate to="/mentor" replace />;
    } else {
      return <Navigate to="/student" replace />;
    }
  }

  return <>{children}</>;
}; 