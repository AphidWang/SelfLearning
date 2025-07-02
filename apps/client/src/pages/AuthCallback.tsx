import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { authService } from '../services/auth';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser, refreshUser } = useUser();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 [AuthCallback] 處理 Google 登入回調...');
        
        // 確保用戶資料完全載入
        await refreshUser();
        
        // 重新獲取最新的用戶資料
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser) {
          console.log('✅ [AuthCallback] 獲取用戶資料成功', {
            userId: currentUser.id,
            name: currentUser.name,
            roles: currentUser.roles
          });
          
          // 再次確保 UserContext 更新
          setCurrentUser(currentUser);

          // 根據用戶的主要角色重定向
          const userRoles = currentUser.roles || (currentUser.role ? [currentUser.role] : ['student']);
          const primaryRole = userRoles[0];
          
          console.log('🚀 [AuthCallback] 重定向用戶', { primaryRole, userRoles });

          if (primaryRole === 'admin') {
            navigate('/admin/users', { replace: true });
          } else if (primaryRole === 'mentor') {
            navigate('/mentor', { replace: true });
          } else {
            navigate('/student', { replace: true });
          }
        } else {
          console.error('❌ [AuthCallback] 無法獲取用戶資料');
          navigate('/login?error=auth_failed', { replace: true });
        }
      } catch (error) {
        console.error('❌ [AuthCallback] 處理回調失敗:', error);
        navigate('/login?error=auth_failed', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, setCurrentUser, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">正在處理登入...</p>
      </div>
    </div>
  );
}; 