/**
 * Token 狀態指示器 - 用於監控和測試認證狀態
 * 
 * 🎯 功能：
 * - 顯示當前 token 狀態
 * - 提供手動刷新按鈕
 * - 測試認證功能
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tokenManager } from '../services/tokenManager';

interface TokenInfo {
  isValid: boolean;
  expiresAt?: number;
  timeToExpiry?: number;
}

export const TokenStatusIndicator: React.FC = () => {
  const { user, tokenStatus, refreshUser, logout } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ isValid: false });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkTokenStatus();
    
    // 每 30 秒檢查一次 token 狀態
    const interval = setInterval(checkTokenStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkTokenStatus = async () => {
    try {
      const token = await tokenManager.getValidToken();
      
      if (token) {
        // 嘗試解析 JWT 來獲取過期時間
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          const expiresAt = payload.exp;
          const now = Math.floor(Date.now() / 1000);
          
          setTokenInfo({
            isValid: true,
            expiresAt,
            timeToExpiry: Math.max(0, expiresAt - now)
          });
        } catch {
          setTokenInfo({ isValid: true });
        }
      } else {
        setTokenInfo({ isValid: false });
      }
    } catch (error) {
      console.error('檢查 token 狀態失敗:', error);
      setTokenInfo({ isValid: false });
    }
  };

  const handleRefreshToken = async () => {
    try {
      setIsRefreshing(true);
      await tokenManager.refreshToken();
      await refreshUser();
      await checkTokenStatus();
    } catch (error) {
      console.error('刷新 token 失敗:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分鐘`;
    return `${Math.floor(seconds / 3600)}小時`;
  };

  const getStatusColor = () => {
    switch (tokenStatus) {
      case 'valid': return 'bg-green-500';
      case 'expired': return 'bg-red-500';
      case 'refreshing': return 'bg-yellow-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (tokenStatus) {
      case 'valid': return '有效';
      case 'expired': return '已過期';
      case 'refreshing': return '刷新中';
      case 'error': return '錯誤';
      default: return '未知';
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span className="text-sm text-gray-600">未登入</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <div className="space-y-3">
        {/* 狀態指示器 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
            <span className="text-sm font-medium">Token 狀態: {getStatusText()}</span>
          </div>
          <button
            onClick={handleRefreshToken}
            disabled={isRefreshing}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRefreshing ? '刷新中...' : '手動刷新'}
          </button>
        </div>

        {/* 用戶信息 */}
        <div className="text-sm text-gray-600">
          <div>用戶: {user.name}</div>
          <div>角色: {user.roles?.join(', ') || user.role}</div>
        </div>

        {/* Token 詳細信息 */}
        {tokenInfo.isValid && tokenInfo.timeToExpiry && (
          <div className="text-xs text-gray-500 space-y-1">
            <div>過期時間: {formatTime(tokenInfo.timeToExpiry)}</div>
            {tokenInfo.timeToExpiry < 300 && (
              <div className="text-orange-600 font-medium">
                ⚠️ Token 即將過期
              </div>
            )}
          </div>
        )}

        {/* 測試按鈕 */}
        <div className="flex space-x-2 pt-2 border-t">
          <button
            onClick={checkTokenStatus}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            檢查狀態
          </button>
          <button
            onClick={() => {
              // 模擬 token 錯誤
              localStorage.setItem('token', 'invalid-token');
              checkTokenStatus();
            }}
            className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            模擬錯誤
          </button>
          <button
            onClick={logout}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            登出
          </button>
        </div>
      </div>
    </div>
  );
}; 