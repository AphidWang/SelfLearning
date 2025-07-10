/**
 * StudentRetro - 學生個人回顧頁面
 * 
 * 🎯 功能：
 * - 提供完整的個人回顧體驗
 * - 整合週統計、問題抽取和回答功能
 * - 遵循專案的頁面佈局規範
 */

import React from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PersonalRetroPanel } from '../../components/retro/PersonalRetroPanel';

export const StudentRetro: React.FC = () => {
  return (
    <PageLayout title="✨ 個人回顧時光">
      <div className="container mx-auto p-4">
        <PersonalRetroPanel />
      </div>
    </PageLayout>
  );
}; 