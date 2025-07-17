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
import { useGroupRetroStore } from '../../store/groupRetroStore';
import { LoadingDots } from '../../components/shared/LoadingDots';
import { parseWeekId, formatWeekRange } from '../../utils/weekUtils';
import {
  getWeekId,
  setSelectedWeek,
  loadWeekData,
  getCurrentSession,
  getAvailableParticipants,
  clearError as clearGroupRetroError,
} from '../../store/groupRetroStore';

// 面板步驟類型（從 GroupRetroPanel 同步）
type PanelStep = 'setup' | 'overview' | 'discussion' | 'results' | 'completed';

export const StudentGroupRetro: React.FC = () => {
  const loading = useGroupRetroStore(s => s.loading);
  const error = useGroupRetroStore(s => s.error);

  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [availableParticipants, setAvailableParticipants] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<PanelStep>('setup');
  const initializedRef = React.useRef(false);

  // 初始化，只執行一次
  useEffect(() => {
    if (!initializedRef.current) {
      const weekId = getWeekId();
      setSelectedWeekId(weekId);
      loadWeekData(weekId).then(() => {
        setCurrentSession(getCurrentSession());
        setAvailableParticipants(getAvailableParticipants());
        initializedRef.current = true;
      });
    }
  }, []);

  // loading 結束後 fetch 資料
  useEffect(() => {
    if (initializedRef.current && !loading) {
      setCurrentSession(getCurrentSession());
      setAvailableParticipants(getAvailableParticipants());
    }
  }, [loading]);

  // 監聽小組討論的步驟變化
  useEffect(() => {
    const handleStepChange = (event: CustomEvent) => {
      setCurrentStep(event.detail.step);
    };
    window.addEventListener('groupRetroStepChange', handleStepChange as EventListener);
    return () => {
      window.removeEventListener('groupRetroStepChange', handleStepChange as EventListener);
    };
  }, []);

  // 根據 currentSession 判斷當前步驟
  useEffect(() => {
    if (currentSession) {
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

  // 處理週期變更 - 任何時候都允許
  const handleWeekChange = useCallback(async (weekId: string, weekIds: string[]) => {
    try {
      setSelectedWeek(weekId, weekIds);
      await loadWeekData(weekId);
      setSelectedWeekId(weekId);
      setCurrentSession(getCurrentSession());
      setAvailableParticipants(getAvailableParticipants());
      setCurrentStep('setup'); // 切週期時重設為第一步
    } catch (error) {
      console.error('切換週期失敗:', error);
    }
  }, []);

  // 週期日期範圍
  const getWeekDateRange = () => {
    if (!selectedWeekId) return '';
    try {
      const weekInfo = parseWeekId(selectedWeekId);
      if (!weekInfo) return '';
      return formatWeekRange(weekInfo.startDate, weekInfo.endDate);
    } catch (error) {
      return '';
    }
  };

  if (loading) {
    return (
      <PageLayout title="🤝 小組討論">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingDots />
            <p className="mt-4 text-gray-600">'載入夥伴資料中...'</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const isWeekSelectorReadOnly = currentStep !== 'setup';

  console.log('🔄 [StudentGroupRetro] re-render', {
    selectedWeekId,
    currentSession,
    availableParticipants,
    currentStep,
    loading,
    error,
  });

  return (
    <PageLayout title="🤝 小組討論">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header區域 - 融合週期選擇，仿照個人回顧頁面 */}
        <div className="bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 backdrop-blur-md border-b border-orange-200 shadow-sm px-6 py-4 z-10">
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
                    loading={loading}
                    title=""
                    disabled={false}
                  />
                </div>
              </div>
              {/* 右側：狀態指示器 */}
              <div className="flex items-center space-x-4">
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
                    onClick={clearGroupRetroError}
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
        <div className="flex-1 overflow-y-auto px-6 py-4">
        <GroupRetroPanel
          currentSession={currentSession}
          selectedParticipants={availableParticipants}
          sessionProgress={null}
          error={error}
          currentWeekId={selectedWeekId}
          loading={loading}
          onCreateSession={async () => {}}
          onStepChange={setCurrentStep}
          sessionTitle={''}
          setSessionTitle={() => {}}
          onAddParticipant={(participant) => {
            setAvailableParticipants(prev => [...prev, participant]);
          }}
        />
        </div>
      </div>
    </PageLayout>
  );
}; 