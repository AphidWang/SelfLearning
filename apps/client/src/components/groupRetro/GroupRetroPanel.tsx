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
import { DiscussionQuestions } from './DiscussionQuestions';
import { ReplyInput } from './ReplyInput';
import type { GroupRetroSession, CreateGroupRetroSessionData } from '../../types/groupRetro';
import toast, { Toaster } from 'react-hot-toast';

interface GroupRetroPanelProps {
  onClose?: () => void;
}

// 面板步驟狀態
type PanelStep = 'setup' | 'overview' | 'discussion' | 'completed';

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
    { id: 'completed', title: '完成', icon: CheckCircle2 }
  ];

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isPassed = steps.findIndex(s => s.id === currentStep) > index;
          const isClickable = canNavigate && (isPassed || isActive || index === steps.findIndex(s => s.id === currentStep) + 1);

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

export const GroupRetroPanel: React.FC<GroupRetroPanelProps> = ({ onClose }) => {
  console.log('🔴 [GroupRetroPanel] 組件渲染開始');
  
  const { currentUser } = useUser();
  const {
    currentSession,
    selectedParticipants,
    sessionProgress,
    // loading,  // 移除：避免因 ParticipantSelector 的載入狀態導致父組件重新渲染
    error,
    createSession,
    getCurrentWeekSession,
    getWeekId,
    clearError,
    reset
  } = useGroupRetroStore();

  // 組件狀態
  const [currentStep, setCurrentStep] = useState<PanelStep>('setup');
  const [sessionTitle, setSessionTitle] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  console.log('🔴 [GroupRetroPanel] 狀態:', {
    currentStep: currentStep,
    currentUser: currentUser?.id,
    currentSession: currentSession?.id,
    selectedParticipants: selectedParticipants.length,
    // loading,  // 移除 loading 狀態記錄
    error: !!error
  });

  // 使用 useRef 來穩定引用，避免重新渲染
  const selectedParticipantsRef = useRef(selectedParticipants);
  const createSessionRef = useRef(createSession);

  console.log('🔴 [GroupRetroPanel] 組件狀態初始化完成');

  // 更新 ref 當值變化時
  useEffect(() => {
    console.log('🔴 [GroupRetroPanel] 更新 ref useEffect 觸發');
    selectedParticipantsRef.current = selectedParticipants;
    createSessionRef.current = createSession;
  }, [selectedParticipants, createSession]);

  // 計算當前週 ID
  const currentWeekId = useMemo(() => {
    const targetDate = new Date();
    const year = targetDate.getFullYear();
    const week = Math.ceil(
      ((targetDate.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
    );
    const weekId = `${year}-W${week.toString().padStart(2, '0')}`;
    return weekId;
  }, []);

  // 初始化時檢查是否有現存的會話
  useEffect(() => {
    console.log('🔴 [GroupRetroPanel] 初始化 useEffect 觸發');
    
    const checkExistingSession = async () => {
      try {
        console.log('🔴 [GroupRetroPanel] 檢查現存會話');
        const existingSession = await getCurrentWeekSession();
        if (existingSession) {
          console.log('🔴 [GroupRetroPanel] 找到現存會話，跳到概覽');
          // 如果有現存會話，直接跳到概覽步驟
          setCurrentStep('overview');
          setSessionTitle(existingSession.title);
        } else {
          console.log('🔴 [GroupRetroPanel] 沒有現存會話，設置預設標題');
          // 生成預設標題
          const defaultTitle = `第 ${currentWeekId} 週共學討論`;
          setSessionTitle(defaultTitle);
        }
      } catch (error) {
        console.error('🔴 [GroupRetroPanel] 檢查現存會話失敗:', error);
      }
    };

    if (currentUser?.id) {
      console.log('🔴 [GroupRetroPanel] 有 currentUser，開始檢查會話');
      checkExistingSession();
    } else {
      console.log('🔴 [GroupRetroPanel] 沒有 currentUser，跳過檢查');
    }
  }, [currentUser?.id, currentWeekId, getCurrentWeekSession]); // 修復：添加 getCurrentWeekSession 依賴

  // 清除錯誤
  useEffect(() => {
    console.log('🔴 [GroupRetroPanel] 清除錯誤 useEffect 觸發, error:', error);
    if (error) {
      console.log('🔴 [GroupRetroPanel] 設置錯誤清除定時器');
      const timer = setTimeout(() => {
        console.log('🔴 [GroupRetroPanel] 清除錯誤');
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]); // 修復：添加 clearError 依賴

  // 創建會話
  const handleCreateSession = useCallback(async () => {
    const currentSelectedParticipants = selectedParticipantsRef.current;
    
    if (currentSelectedParticipants.length < 2) {
      toast.error('請至少選擇 2 位夥伴參與討論');
      return;
    }

    setIsCreatingSession(true);
    try {
      const sessionData: CreateGroupRetroSessionData = {
        title: sessionTitle || `第 ${currentWeekId} 週共學討論`,
        weekId: currentWeekId,
        participantIds: currentSelectedParticipants.map(p => p.user.id),
        settings: {
          autoGenerateQuestions: true,
          maxParticipants: 8,
          questionLimit: 5,
          allowAnonymous: false
        }
      };

      await createSessionRef.current(sessionData);
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
  }, [sessionTitle, currentWeekId]); // 修復：移除 selectedParticipants 和 createSession 引用

  // 步驟切換
  const handleStepChange = useCallback((step: PanelStep) => {
    if (step === 'overview' && !currentSession) {
      // 如果要進入概覽但沒有會話，先創建會話
      const createSessionAndNavigate = async () => {
        const currentSelectedParticipants = selectedParticipantsRef.current;
        
        if (currentSelectedParticipants.length < 2) {
          toast.error('請至少選擇 2 位夥伴參與討論');
          return;
        }

        setIsCreatingSession(true);
        try {
          const sessionData: CreateGroupRetroSessionData = {
            title: sessionTitle || `第 ${currentWeekId} 週共學討論`,
            weekId: currentWeekId,
            participantIds: currentSelectedParticipants.map(p => p.user.id),
            settings: {
              autoGenerateQuestions: true,
              maxParticipants: 8,
              questionLimit: 5,
              allowAnonymous: false
            }
          };

          await createSessionRef.current(sessionData);
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
      };
      
      createSessionAndNavigate();
      return;
    }
    setCurrentStep(step);
  }, [currentSession, sessionTitle, currentWeekId]); // 修復：移除 selectedParticipants 和 createSession 引用

  // 渲染主要內容
  const renderMainContent = () => {
    switch (currentStep) {
      case 'setup':
        console.log('🔴 [GroupRetroPanel] 渲染 setup 步驟');
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

            {(() => {
              console.log('🔴 [GroupRetroPanel] 準備渲染 ParticipantSelector');
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
                onClick={() => setCurrentStep('discussion')}
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

            <DiscussionQuestions />
            <ReplyInput />
          </motion.div>
        );

      case 'completed':
        return (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">討論完成！</h2>
              <p className="text-gray-600">太棒了！大家的分享很精彩，記得把討論記錄保存下來喔</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
              <div className="flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-yellow-500" />
                <Star className="w-6 h-6 text-yellow-500" />
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">共學收穫</h3>
              <p className="text-sm text-gray-600">
                透過分享和討論，大家不僅回顧了自己的學習，也學到了夥伴們的方法和經驗
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={() => {
                  // 匯出功能
                  if (currentSession) {
                    const store = useGroupRetroStore.getState();
                    store.exportSession(currentSession.id, 'markdown');
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-4 h-4" />
                下載記錄
              </motion.button>
              
              <motion.button
                onClick={() => {
                  reset();
                  setCurrentStep('setup');
                }}
                className="px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4" />
                開始新討論
              </motion.button>
            </div>
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
        {/* 頁面標題 */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-3xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🤝 小組共學討論
          </motion.h1>
          <motion.p
            className="text-gray-600"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            和夥伴們分享學習經驗，一起成長
          </motion.p>
        </div>

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