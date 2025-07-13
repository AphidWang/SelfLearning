/**
 * StudentGroupRetro - 小組討論頁面
 * 
 * 🎯 功能說明：
 * - 小組討論回顧系統的主頁面
 * - 使用 PageLayout 提供一致的頁面佈局
 * - 整合 GroupRetroPanel 組件
 * - 確保用戶數據載入完成後再顯示組件
 * 
 * 🏗️ 架構設計：
 * - 遵循頁面組件的設計模式
 * - 使用統一的頁面佈局
 * - 支援響應式設計
 * - 管理用戶數據載入狀態
 * 
 * 🎨 視覺設計：
 * - 溫暖的頁面標題
 * - 一致的視覺風格 
 * - 良好的用戶體驗
 * - 載入狀態指示器
 */
import React, { useEffect, useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import {GroupRetroPanel} from '../../components/groupRetro/GroupRetroPanel';
import { useUserStore } from '../../store/userStore';
import { LoadingDots } from '../../components/shared/LoadingDots';

export const StudentGroupRetro: React.FC = () => {
  const { getCollaboratorCandidates, users, loading } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeUsers = async () => {
      console.log('🔄 [StudentGroupRetro] 初始化用戶數據');
      console.log('🔄 [StudentGroupRetro] 當前用戶數量:', users.length);
      
      try {
        // 確保用戶數據存在
        if (!users.length) {
          console.log('🔄 [StudentGroupRetro] 載入用戶數據');
          await getCollaboratorCandidates();
        }
        
        console.log('🔄 [StudentGroupRetro] 用戶數據載入完成，數量:', users.length);
        setIsInitialized(true);
      } catch (error) {
        console.error('🔴 [StudentGroupRetro] 載入用戶數據失敗:', error);
        // 即使失敗也要設置為已初始化，避免無限載入
        setIsInitialized(true);
      }
    };

    initializeUsers();
  }, []); // 只在組件掛載時執行一次

  // 顯示載入狀態
  if (!isInitialized || loading) {
    return (
      <PageLayout title="🤝 小組討論">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingDots />
            <p className="mt-4 text-gray-600 dark:text-gray-400">載入用戶資料中...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="🤝 小組討論">
      <GroupRetroPanel />
    </PageLayout>
  );
}; 