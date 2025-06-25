import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { authService } from '../services/auth';
import type { User } from '../types/goal';
import { trackEvent } from '../utils/analytics';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
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
        const user = await authService.getCurrentUser();
        if (isMounted) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
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
        setCurrentUser(user);
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
      
      setCurrentUser(user);
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
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
    isLoading,
    error
  };

  if (isLoading) {
    return null;
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export { UserProvider };
export type { User as UserRole };