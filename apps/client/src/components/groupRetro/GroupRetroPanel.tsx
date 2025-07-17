/**
 * GroupRetroPanel - 小組討論回顧主面板
 * 
 * 🎯 功能說明：
 * - 管理小組討論的完整流程
 * - 參與者選擇和管理
 * - 週進度概覽展示
 * - 討論問題管理
 * - 多人回覆系統
 * 
 * 🏗️ 架構設計：
 * - 參考 TaskWallPage 的整體佈局 [[memory:2569399]]
 * - 使用統一的設計風格規範 [[memory:2569399]]
 * - 遵循錯誤處理系統 [[memory:978767]]
 * - 支援響應式設計和動畫效果
 * 
 * 🎨 視覺設計：
 * - 漸層背景和毛玻璃效果
 * - 溫暖色調和圓角設計
 * - Framer Motion 動畫過渡
 * - 分步驟的引導流程
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MessageSquare, Download, Settings, ChevronRight, CheckCircle2, Star, RefreshCw, Plus, Clock, Target } from 'lucide-react';
import { useGroupRetroStore } from '../../store/groupRetroStore';
import { useUser } from '../../context/UserContext';
import { LoadingDots } from '../shared/LoadingDots';
import { ParticipantSelector } from './ParticipantSelector';
import { ParticipantOverview } from './ParticipantOverview';
import { IntegratedDiscussion } from './IntegratedDiscussion';
import { GroupRetroResultsDashboard } from './GroupRetroResultsDashboard';
import type { GroupRetroSession, CreateGroupRetroSessionData } from '../../types/groupRetro';
import toast, { Toaster } from 'react-hot-toast';

// Debug 開關
const DEBUG_GROUP_RETRO_PANEL = true;

const debugLog = (...args: any[]) => {
  if (DEBUG_GROUP_RETRO_PANEL) {
    console.log(...args);
  }
};

interface GroupRetroPanelProps {
  onClose?: () => void;
  currentSession: GroupRetroSession | null;
  selectedParticipants: any[];
  sessionProgress: any;
  error: string | null;
  currentWeekId: string | null;
  loading: boolean;
  onCreateSession: (data: CreateGroupRetroSessionData) => Promise<void>;
  onStepChange: (step: PanelStep) => void;
  sessionTitle?: string;
  setSessionTitle?: (title: string) => void;
  onAddParticipant?: (participant: any) => void;
}

// 面板步驟狀態
type PanelStep = 'setup' | 'overview' | 'discussion' | 'results' | 'completed';

interface StepIndicatorProps {
  currentStep: PanelStep;
  onStepChange: (step: PanelStep) => void;
  canNavigate: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepChange, canNavigate }) => {
  const steps = [
    { id: 'setup', title: '選擇夥伴', icon: Users },
    { id: 'overview', title: '週進度總覽', icon: Target },
    { id: 'discussion', title: '共學討論', icon: MessageSquare },
    { id: 'results', title: '討論結果', icon: Star },
    { id: 'completed', title: '完成', icon: CheckCircle2 }
  ];

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isPassed = steps.findIndex(s => s.id === currentStep) > index;
          // 完成步驟不能被點擊，只能自動跳轉
          const isClickable = canNavigate && step.id !== 'completed' && (isPassed || isActive || index === steps.findIndex(s => s.id === currentStep) + 1);

          return (
            <React.Fragment key={step.id}>
              <motion.button
                onClick={() => isClickable && onStepChange(step.id as PanelStep)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg'
                    : isPassed
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : isClickable
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!isClickable}
                whileHover={isClickable ? { scale: 1.05 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{step.title}</span>
              </motion.button>
              
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const GroupRetroPanel: React.FC<GroupRetroPanelProps> = ({
  onClose,
  currentSession,
  selectedParticipants,
  sessionProgress,
  error,
  currentWeekId,
  loading,
  onCreateSession,
  onStepChange,
  sessionTitle: sessionTitleProp,
  setSessionTitle: setSessionTitleProp,
  onAddParticipant,
}) => {
  debugLog('🔴 [GroupRetroPanel] 組件渲染開始');
  
  // 組件狀態
  const initialStep: PanelStep = currentSession ? 'overview' : 'setup';
  const [currentStep, setCurrentStep] = useState<PanelStep>(initialStep);
  const [sessionTitle, setSessionTitle] = useState(sessionTitleProp || '');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 只要 currentSession 變動都回到 setup
  useEffect(() => {
    if (currentSession && currentSession.status === 'completed') {
      setCurrentStep('completed');
    } else {
      setCurrentStep('setup');
    }
  }, [currentSession]);

  // 監聽完成討論事件
  useEffect(() => {
    const handleCompleteDiscussion = () => {
      debugLog('🔴 [GroupRetroPanel] 收到完成討論事件，切換到結果頁面');
      setCurrentStep('results');
      // 發送步驟變化事件
      window.dispatchEvent(new CustomEvent('groupRetroStepChange', { 
        detail: { step: 'results' } 
      }));
    };

    window.addEventListener('completeDiscussion', handleCompleteDiscussion);
    return () => window.removeEventListener('completeDiscussion', handleCompleteDiscussion);
  }, []); // 修復：添加 clearError 依賴

  // 創建會話
  const handleCreateSession = useCallback(async () => {
    const currentSelectedParticipants = selectedParticipants;
    if (currentSelectedParticipants.length < 2) {
      toast.error('請至少選擇 2 位夥伴參與討論');
      return;
    }
    setIsCreatingSession(true);
    try {
      const sessionData: CreateGroupRetroSessionData = {
        title: sessionTitle || `第 ${currentWeekId} 週共學討論`,
        weekId: currentWeekId || '',
        participantIds: currentSelectedParticipants.map(p => p.user.id),
        settings: {
          autoGenerateQuestions: true,
          maxParticipants: 8,
          questionLimit: 5,
          allowAnonymous: false
        }
      };
      await onCreateSession(sessionData);
      setCurrentStep('overview');
      toast.success('小組討論會話創建成功！', {
        duration: 3000,
        style: {
          background: '#10B981',
          color: 'white',
          borderRadius: '12px'
        }
      });
    } catch (error) {
      console.error('創建會話失敗:', error);
      toast.error('創建會話失敗，請稍後再試');
    } finally {
      setIsCreatingSession(false);
    }
  }, [sessionTitle, currentWeekId, selectedParticipants, onCreateSession]);

  // 步驟切換
  const handleStepChange = useCallback((step: PanelStep) => {
    setCurrentStep(step);
    onStepChange(step);
  }, [onStepChange]);

  // 渲染主要內容
  const renderMainContent = () => {
    switch (currentStep) {
      case 'setup':
        debugLog('🔴 [GroupRetroPanel] 渲染 setup 步驟');
        return (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">選擇討論夥伴</h2>
              <p className="text-gray-600">邀請完成個人 Retro 的小夥伴一起分享學習經驗</p>
            </div>

            {/* 會話標題輸入 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-orange-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                討論主題
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white/70 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder={`第 ${currentWeekId} 週共學討論`}
              />
            </div>

            {/* 已選夥伴列表 */}
            {selectedParticipants && selectedParticipants.length > 0 && (
              <div className="mb-4">
                <div className="font-bold text-gray-700 mb-2">已選夥伴：</div>
                <ul className="flex flex-wrap gap-2">
                  {selectedParticipants.map((p, idx) => (
                    <li key={p.user?.id || idx} className="px-3 py-1 bg-orange-100 rounded-full text-sm text-orange-700">
                      {p.user?.name || '未命名'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(() => {
              debugLog('�� [GroupRetroPanel] 準備渲染 ParticipantSelector');
              return <ParticipantSelector key="participant-selector" />;
            })()}

            {/* 操作按鈕 */}
            <div className="flex justify-center">
              <motion.button
                onClick={handleCreateSession}
                disabled={selectedParticipants.length < 2 || isCreatingSession}
                className="px-8 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCreatingSession ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    創建中...
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    開始討論
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        );

      case 'overview':
        return (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">本週學習概覽</h2>
              <p className="text-gray-600">看看大家這週的學習狀況，為討論做準備</p>
            </div>

            <ParticipantOverview />

            <div className="flex justify-center">
              <motion.button
                onClick={() => {
                  setCurrentStep('discussion');
                  // 發送步驟變化事件
                  window.dispatchEvent(new CustomEvent('groupRetroStepChange', { 
                    detail: { step: 'discussion' } 
                  }));
                }}
                className="px-8 py-3 bg-gradient-to-r from-green-400 to-teal-400 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageSquare className="w-4 h-4" />
                開始討論
              </motion.button>
            </div>
          </motion.div>
        );

      case 'discussion':
        return (
          <motion.div
            key="discussion"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">共學討論時間</h2>
              <p className="text-gray-600">分享彼此的學習經驗，互相學習成長</p>
            </div>

            {/* 進度指示器 */}
            {sessionProgress && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">討論進度</span>
                  <span className="text-sm font-bold text-purple-600">
                    {sessionProgress.completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${sessionProgress.completionPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {sessionProgress.repliedParticipants} / {sessionProgress.totalParticipants} 位夥伴已參與
                </p>
              </div>
            )}

            <IntegratedDiscussion />
          </motion.div>
        );

      case 'results':
        return (
          <motion.div
            key="results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <GroupRetroResultsDashboard 
              onSaveComplete={() => {
                setCurrentStep('completed');
                // 發送步驟變化事件
                window.dispatchEvent(new CustomEvent('groupRetroStepChange', { 
                  detail: { step: 'completed' } 
                }));
              }}
            />
          </motion.div>
        );
      case 'completed':
        return (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            <div className="text-center text-2xl font-bold text-green-600 mb-2">
              🎉 恭喜你完成小組回顧！每一次回顧都是成長的累積，持續反思讓學習更有力量。
            </div>
            {/* 直接重用討論結果頁內容 */}
            <GroupRetroResultsDashboard 
              onSaveComplete={() => {
                setCurrentStep('completed');
                window.dispatchEvent(new CustomEvent('groupRetroStepChange', { 
                  detail: { step: 'completed' } 
                }));
              }}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  // 移除：不再需要全局載入檢查，因為 loading 狀態已移除
  // if (loading && !currentSession) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <LoadingDots />
  //     </div>
  //   );
  // }

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #fefdf8 0%, #faf7f0 50%, #f7f3e9 100%)',
        backgroundImage: `
          radial-gradient(circle at 20px 50px, #00000008 1px, transparent 1px),
          radial-gradient(circle at 80px 20px, #00000008 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px'
      }}
    >
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B',
            borderRadius: '12px',
            fontWeight: '500'
          }
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* 步驟指示器 */}
        <StepIndicator
          currentStep={currentStep}
          onStepChange={handleStepChange}
          canNavigate={true}
        />

        {/* 錯誤提示 */}
        {error && (
          <motion.div
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* 主要內容區域 */}
        <motion.div
          className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-orange-200 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-8">
            <AnimatePresence mode="wait">
              {renderMainContent()}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* 關閉按鈕 */}
        {onClose && (
          <div className="text-center mt-6">
            <motion.button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              關閉面板
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}; 