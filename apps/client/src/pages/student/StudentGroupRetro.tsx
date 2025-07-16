/**
 * StudentGroupRetro - 小組討論頁面
 * 
 * 🎯 功能說明：
 * - 小組討論回顧系統的主頁面
 * - 使用 PageLayout 提供一致的頁面佈局
 * - 整合 GroupRetroPanel 組件
 * - 確保用戶數據載入完成後再顯示組件
 * - 支援週期管理和切換
 * - 當討論進入第二步後，週期選擇器變為只讀
 * 
 * 🏗️ 架構設計：
 * - 遵循頁面組件的設計模式
 * - 使用統一的頁面佈局
 * - 支援響應式設計
 * - 管理用戶數據載入狀態
 * - 整合 Header 和週期選擇器
 * 
 * 🎨 視覺設計：
 * - 仿照個人回顧頁面的 Header 設計
 * - 一致的視覺風格 
 * - 良好的用戶體驗
 * - 載入狀態指示器
 */
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';
import {GroupRetroPanel} from '../../components/groupRetro/GroupRetroPanel';
import { WeekSelector } from '../../components/shared/WeekSelector';
import { useUserStore } from '../../store/userStore';
import { useGroupRetroStore } from '../../store/groupRetroStore';
import { LoadingDots } from '../../components/shared/LoadingDots';

// 面板步驟類型（從 GroupRetroPanel 同步）
type PanelStep = 'setup' | 'overview' | 'discussion' | 'results' | 'completed';

export const StudentGroupRetro: React.FC = () => {
  const { getCollaboratorCandidates, users, loading: userLoading } = useUserStore();
  const {
    selectedWeekId,
    loading: retroLoading,
    error,
    clearError,
    setSelectedWeek,
    loadWeekData,
    getWeekId,
    currentSession
  } = useGroupRetroStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStep, setCurrentStep] = useState<PanelStep>('setup');

  // 監聽小組討論的步驟變化
  useEffect(() => {
    const handleStepChange = (event: CustomEvent) => {
      setCurrentStep(event.detail.step);
    };

    // 監聽來自 GroupRetroPanel 的步驟變化事件
    window.addEventListener('groupRetroStepChange', handleStepChange as EventListener);
    
    return () => {
      window.removeEventListener('groupRetroStepChange', handleStepChange as EventListener);
    };
  }, []);

  // 根據 currentSession 判斷當前步驟
  useEffect(() => {
    if (currentSession) {
      // 如果有會話，說明已經進入 overview 或之後的步驟
      if (currentSession.status === 'completed') {
        setCurrentStep('completed');
      } else if (currentSession.questions && currentSession.questions.length > 0) {
        setCurrentStep('discussion');
      } else {
        setCurrentStep('overview');
      }
    } else {
      setCurrentStep('setup');
    }
  }, [currentSession]);

  // 初始化當前週期
  useEffect(() => {
    const currentWeekId = getWeekId();
    if (!selectedWeekId) {
      setSelectedWeek(currentWeekId);
      loadWeekData(currentWeekId);
    }
  }, [selectedWeekId, setSelectedWeek, loadWeekData, getWeekId]);

  useEffect(() => {
    const initializeUsers = async () => {
      console.log('🔄 [StudentGroupRetro] 初始化用戶數據');
      console.log('🔄 [StudentGroupRetro] 當前用戶數量:', users.length);
      
      try {
        // 始終嘗試載入用戶數據，確保數據是最新的
        console.log('🔄 [StudentGroupRetro] 載入用戶數據');
        await getCollaboratorCandidates();
        
        console.log('🔄 [StudentGroupRetro] 用戶數據載入完成，數量:', users.length);
        setIsInitialized(true);
      } catch (error) {
        console.error('🔴 [StudentGroupRetro] 載入用戶數據失敗:', error);
        // 失敗後嘗試重試一次
        try {
          console.log('🔄 [StudentGroupRetro] 重試載入用戶數據');
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
          await getCollaboratorCandidates();
          console.log('🔄 [StudentGroupRetro] 重試成功，用戶數量:', users.length);
        } catch (retryError) {
          console.error('🔴 [StudentGroupRetro] 重試載入用戶數據失敗:', retryError);
        }
        setIsInitialized(true);
      }
    };

    initializeUsers();
  }, []); // 只在組件掛載時執行一次

  // 處理週期變更 - 只有在 setup 步驟時允許
  const handleWeekChange = useCallback(async (weekId: string, weekIds: string[]) => {
    // 只有在 setup 步驟才允許變更週期
    if (currentStep !== 'setup') {
      console.log('🚫 [StudentGroupRetro] 已進入討論階段，不允許變更週期');
      return;
    }
    
    try {
      setSelectedWeek(weekId, weekIds);
      await loadWeekData(weekId);
    } catch (error) {
      console.error('切換週期失敗:', error);
    }
  }, [setSelectedWeek, loadWeekData, currentStep]);

  // 獲取週期間的日期範圍文字
  const getWeekDateRange = () => {
    if (!selectedWeekId) return '';
    
    try {
      // 使用 utils/weekUtils 的解析功能
      const { parseWeekId, formatWeekRange } = require('../../utils/weekUtils');
      const weekInfo = parseWeekId(selectedWeekId);
      
      if (!weekInfo) return '';
      
      return formatWeekRange(weekInfo.startDate, weekInfo.endDate);
    } catch (error) {
      console.error('解析週期日期失敗:', error);
      return '';
    }
  };

  // 顯示載入狀態 - 等待用戶數據和初始化完成
  if (!isInitialized || userLoading || users.length === 0) {
    return (
      <PageLayout title="🤝 小組討論">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingDots />
            <p className="mt-4 text-gray-600">載入用戶資料中...</p>
            {users.length === 0 && isInitialized && !userLoading && (
              <p className="mt-2 text-sm text-orange-600">
                正在獲取可合作的夥伴清單...
              </p>
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  // 判斷週期選擇器是否為只讀狀態
  const isWeekSelectorReadOnly = currentStep !== 'setup';

  return (
    <PageLayout title="🤝 小組討論">
      {/* Header區域 - 融合週期選擇，仿照個人回顧頁面 */}
      <div className="bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 backdrop-blur-md border-b border-orange-200 sticky top-0 z-10 shadow-sm -mt-6 -mx-6 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            {/* 左側：標題 */}
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                和夥伴們分享學習經驗
              </h2>
            </div>

            {/* 中間：週期選擇器 */}
            <div className="flex-1 flex justify-center mx-8">
              <div className="flex flex-col items-center">
                <WeekSelector
                  selectedWeekId={selectedWeekId ?? undefined}
                  onChange={handleWeekChange}
                  loading={retroLoading}
                  title=""
                  disabled={isWeekSelectorReadOnly} // 當不是 setup 步驟時禁用
                />
                {/* 顯示日期範圍 */}
                {getWeekDateRange() && (
                  <div className="text-xs text-gray-500 mt-1">
                    {getWeekDateRange()}
                  </div>
                )}
                {/* 當週期選擇器被禁用時顯示提示 */}
                {isWeekSelectorReadOnly && (
                  <div className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded-full">
                    討論進行中，無法變更週期
                  </div>
                )}
              </div>
            </div>

            {/* 右側：狀態指示器 */}
            <div className="flex items-center space-x-4">
              {/* 步驟指示器 */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  ['overview', 'discussion', 'results', 'completed'].includes(currentStep) ? 'bg-orange-400' : 'bg-gray-300'
                }`} />
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  ['discussion', 'results', 'completed'].includes(currentStep) ? 'bg-yellow-400' : 'bg-gray-300'
                }`} />
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  ['results', 'completed'].includes(currentStep) ? 'bg-green-400' : 'bg-gray-300'
                }`} />
              </div>
              
              {/* 當前狀態文字 */}
              <div className="text-sm text-gray-600">
                {currentStep === 'setup' && '選擇夥伴'}
                {currentStep === 'overview' && '學習概覽'}
                {currentStep === 'discussion' && '討論中'}
                {currentStep === 'results' && '查看結果'}
                {currentStep === 'completed' && '已完成'}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 錯誤提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4"
          >
            <div className="p-4 bg-red-100 border border-red-200 rounded-xl text-red-700">
              <div className="flex items-center justify-between">
                <span>⚠️ {error}</span>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 主要內容 */}
      <div className="mt-4">
        <GroupRetroPanel />
      </div>
    </PageLayout>
  );
}; 