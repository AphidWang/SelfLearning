/**
 * StudentGroupRetro - 小組討論頁面
 * 
 * 🎯 功能說明：
 * - 小組討論回顧系統的主頁面
 * - 使用 PageLayout 提供一致的頁面佈局
 * - 整合 GroupRetroPanel 組件
 * 
 * 🏗️ 架構設計：
 * - 遵循頁面組件的設計模式
 * - 使用統一的頁面佈局
 * - 支援響應式設計
 * 
 * 🎨 視覺設計：
 * - 溫暖的頁面標題
 * - 一致的視覺風格 
 * - 良好的用戶體驗
 */
import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import {GroupRetroPanel} from '../../components/groupRetro/GroupRetroPanel';

export const StudentGroupRetro: React.FC = () => {
  return (
    <PageLayout title="🤝 小組討論">
      <GroupRetroPanel />
    </PageLayout>
  );
}; 