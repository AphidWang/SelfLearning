import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { authService } from '../services/supabase';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 等待 Supabase 處理 OAuth 回調
        const { data: { session } } = await authService.supabase.auth.getSession();
        
        if (session?.user) {
          // 先獲取當前用戶資料
          const currentUser = await authService.getCurrentUser();
          
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || 
                  session.user.user_metadata?.name || 
                  session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            // 如果用戶已經有頭像，就保留原來的頭像
            avatar: currentUser?.user_metadata?.avatar || 
                    session.user.user_metadata?.avatar_url || 
                    session.user.user_metadata?.picture ||
                    `https://api.dicebear.com/7.x/adventurer/svg?seed=${session.user.id}&backgroundColor=ffd5dc`,
            color: session.user.user_metadata?.color || '#FF6B6B',
            role: session.user.user_metadata?.role || 'student'
          };

          // 存儲 token 和用戶資料
          localStorage.setItem('token', session.access_token);
          localStorage.setItem('user', JSON.stringify(userData));
          
          setCurrentUser(userData);

          // 根據角色重定向
          switch (userData.role) {
            case 'admin':
              navigate('/admin/users');
              break;
            case 'mentor':
              navigate('/mentor');
              break;
            case 'student':
            case 'parent':
              navigate('/student');
              break;
            default:
              navigate('/student');
          }
        } else {
          // 沒有 session，重定向到登入頁
          navigate('/?error=auth_failed');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [navigate, setCurrentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">正在處理登入...</p>
      </div>
    </div>
  );
}; 