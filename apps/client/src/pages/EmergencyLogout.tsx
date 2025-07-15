import React, { useEffect } from 'react';

const EmergencyLogout: React.FC = () => {
  useEffect(() => {
    const performEmergencyLogout = () => {
      console.log('🚨 執行緊急登出');
      
      // 立即清除所有 localStorage
      try {
        localStorage.clear();
        console.log('✅ localStorage 已清除');
      } catch (err) {
        console.error('❌ 清除 localStorage 失敗:', err);
      }
      
      // 立即清除所有 sessionStorage
      try {
        sessionStorage.clear();
        console.log('✅ sessionStorage 已清除');
      } catch (err) {
        console.error('❌ 清除 sessionStorage 失敗:', err);
      }
      
      // 清除所有 cookies
      try {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        console.log('✅ Cookies 已清除');
      } catch (err) {
        console.error('❌ 清除 cookies 失敗:', err);
      }
      
      // 立即重定向到登入頁面
      window.location.href = '/login';
    };

    performEmergencyLogout();
  }, []);

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">緊急登出中...</h2>
        <p className="text-gray-600 text-sm">正在清除所有資料並重定向到登入頁面</p>
      </div>
    </div>
  );
};

export default EmergencyLogout; 