import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { authService } from '../services/auth';
import type { User } from '@self-learning/types';
import { trackEvent } from '../utils/analytics';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🔄 [UserContext] 初始化認證狀態...');
        const user = await authService.getCurrentUser();
        
        if (isMounted) {
          console.log('✅ [UserContext] 初始化完成', {
            hasUser: !!user,
            userId: user?.id,
            roles: user?.roles
          });
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('❌ [UserContext] 初始化失敗:', error);
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // 監聽認證狀態變化
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      if (isMounted) {
        console.log('🔄 [UserContext] 認證狀態變化', {
          hasUser: !!user,
          userId: user?.id,
          roles: user?.roles
        });
        
        setCurrentUser(user);
        setIsLoading(false); // 確保載入狀態更新
        
        // 儲存到 localStorage 供初始化使用
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    });

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { user, token } = await authService.login({ email, password });
      
      // 儲存到 localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // 不需要手動設置 currentUser，onAuthStateChange 會處理
      trackEvent('login_success', 'auth');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登入失敗';
      setError(errorMessage);
      trackEvent('login_failed', 'auth');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      trackEvent('logout', 'auth');
      
      // 登出後重定向到登入頁面
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 [UserContext] 手動刷新用戶資料...');
      const user = await authService.getCurrentUser();
      console.log('✅ [UserContext] 用戶資料刷新完成', {
        hasUser: !!user,
        userId: user?.id,
        roles: user?.roles
      });
      setCurrentUser(user);
    } catch (error) {
      console.error('❌ [UserContext] 刷新用戶資料失敗:', error);
    }
  };

  const value = useMemo(() => ({
    currentUser,
    setCurrentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
    isLoading,
    error,
    refreshUser
  }), [currentUser, isLoading, error]);

  // 在載入中時顯示載入畫面，而不是返回 null
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>正在載入用戶資料...</div>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export { UserProvider };
export type { User as UserRole };