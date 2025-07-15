import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut, CheckCircle } from 'lucide-react';
import { authService } from '../services/auth';

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'logging_out' | 'clearing_storage' | 'complete'>('logging_out');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    performLogout();
  }, []);

  const performLogout = async () => {
    try {
      setStatus('logging_out');
      
      // 第一步：執行 Supabase 登出
      try {
        await authService.logout();
        console.log('✅ Supabase 登出成功');
      } catch (error) {
        console.warn('⚠️ Supabase 登出失敗，繼續清除本地資料:', error);
      }
      
      setStatus('clearing_storage');
      
      // 第二步：清除所有 localStorage
      const localStorageKeys = [
        'token',
        'user',
        'accessToken', 
        'refreshToken',
        'supabase.auth.token',
        'sb-127-auth-token',
        'sb-auth-token',
        // 清除其他可能的應用狀態
        'currentUser',
        'authUser',
        'userSession',
        'authSession',
        // 清除 Zustand stores 可能的持久化狀態
        'topic-store',
        'user-store',
        'task-store',
        'goal-store',
        'retro-store',
        // 清除其他可能的快取
        'taskRecords',
        'userPreferences',
        'appSettings'
      ];
      
      // 清除指定的 keys
      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`🧹 已清除 localStorage key: ${key}`);
        } catch (err) {
          console.warn(`⚠️ 清除 ${key} 失敗:`, err);
        }
      });
      
      // 嘗試清除所有 localStorage（備用方案）
      try {
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('token') || key.includes('user')) {
            localStorage.removeItem(key);
            console.log(`🧹 已清除額外的 localStorage key: ${key}`);
          }
        });
      } catch (err) {
        console.warn('⚠️ 清除額外 localStorage 失敗:', err);
      }
      
      // 第三步：清除 sessionStorage
      try {
        sessionStorage.clear();
        console.log('🧹 已清除 sessionStorage');
      } catch (err) {
        console.warn('⚠️ 清除 sessionStorage 失敗:', err);
      }
      
      // 第四步：清除可能的 cookies
      try {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('auth') || name.includes('token') || name.includes('supabase')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            console.log(`🧹 已清除 cookie: ${name}`);
          }
        });
      } catch (err) {
        console.warn('⚠️ 清除 cookies 失敗:', err);
      }
      
      setStatus('complete');
      
      // 等待一下讓使用者看到完成訊息，然後重定向
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
      
    } catch (error) {
      console.error('❌ 登出過程中發生錯誤:', error);
      setError(error instanceof Error ? error.message : '登出失敗');
      
      // 即使發生錯誤，也要嘗試清除本地狀態並重定向
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    }
  };

  const handleForceRedirect = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {status === 'complete' ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <LogOut className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          )}
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {status === 'complete' ? '登出完成' : '正在登出'}
          </h2>
          
          <p className="text-gray-600">
            {status === 'logging_out' && '正在登出系統...'}
            {status === 'clearing_storage' && '正在清除本地資料...'}
            {status === 'complete' && '已成功登出，即將跳轉到登入頁面'}
          </p>
        </div>

        {error ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <button
              onClick={handleForceRedirect}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              前往登入頁面
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span className="text-gray-500 text-sm">
              {status === 'logging_out' && '登出中...'}
              {status === 'clearing_storage' && '清除資料中...'}
              {status === 'complete' && '準備跳轉...'}
            </span>
          </div>
        )}

        {status !== 'complete' && !error && (
          <div className="mt-6">
            <button
              onClick={handleForceRedirect}
              className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg hover:bg-gray-400 transition-colors text-sm"
            >
              跳過並前往登入頁面
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logout; 