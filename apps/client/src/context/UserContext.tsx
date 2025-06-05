import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { authService, User } from '../services/auth';
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

function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    console.log('Initial auth check:', { storedUser, token });
    
    if (storedUser && token) {
      setCurrentUser(JSON.parse(storedUser));
      authService.getCurrentUser().then(user => {
        console.log('Token validation result:', { user });
        if (!user) {
          console.log('Token invalid, clearing storage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setCurrentUser(null);
        }
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { user, token } = await authService.login({ email, password });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      trackEvent('login_success', 'auth');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗');
      trackEvent('login_failed', 'auth');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem('user');
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

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export { UserProvider, useUser };
export type { User as UserRole };