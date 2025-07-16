/**
 * StudentRetro - 學生個人回顧頁面
 * 
 * 🎯 功能：
 * - 提供完整的個人回顧體驗
 * - 整合週統計、問題抽取和回答功能
 * - 遵循專案的頁面佈局規範
 * - 支援週期管理和切換
 */

import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { PersonalRetroPanel } from '../../components/retro/PersonalRetroPanel';
import { WeekSelector } from '../../components/shared/WeekSelector';
import { useRetroStore } from '../../store/retroStore';

export const StudentRetro: React.FC = () => {
  const {
    selectedWeekId,
    selectedWeekIds,
    loading,
    setSelectedWeek,
    loadWeekData,
    getWeekId
  } = useRetroStore();

  // 初始化當前週期
  useEffect(() => {
    const currentWeekId = getWeekId();
    if (!selectedWeekId) {
      setSelectedWeek(currentWeekId);
      loadWeekData(currentWeekId);
    }
  }, [selectedWeekId, setSelectedWeek, loadWeekData, getWeekId]);

  // 處理週期變更
  const handleWeekChange = useCallback(async (weekId: string, weekIds: string[]) => {
    try {
      setSelectedWeek(weekId, weekIds);
      await loadWeekData(weekId);
    } catch (error) {
      console.error('切換週期失敗:', error);
    }
  }, [setSelectedWeek, loadWeekData]);

  return (
    <PageLayout title="✨ 個人回顧時光">
      <div className="container mx-auto p-4">
        
        {/* 個人回顧面板 */}
        <PersonalRetroPanel />
      </div>
    </PageLayout>
  );
}; 