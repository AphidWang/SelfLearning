/**
 * PersonalRetroPanel - 個人 Retro 面板
 * 
 * 🎯 功能：
 * - 優化的雙欄布局：左側週摘要，右側混合資訊+回顧
 * - 每日學習軌跡可點擊查看日記
 * - 打卡次數支援 hover 顯示詳細任務
 * - 折疊區塊設計，避免資訊過載
 * 
 * 🎨 設計風格：
 * - 左側：週摘要 + 核心統計
 * - 右側上半：每日軌跡 + 能量變化
 * - 右側下半：回顧問答區
 * - 互動式設計，支援點擊和 hover
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Calendar, Eye, BookOpen, ExternalLink, Trash2, AlertTriangle, Save, Trophy, Star, Heart, CheckCircle, X } from 'lucide-react';
import { useRetroStore } from '../../store/retroStore';
import { journalStore, type DailyJournal } from '../../store/journalStore';
import { createPortal } from 'react-dom';
import { QuestionDrawGame } from './QuestionDrawGame';
import { AnswerInputCard } from './AnswerInputCard';
import { LoadingDots } from '../shared/LoadingDots';
import { DailyJournalDialog } from '../../pages/student/components/DailyJournalDialog';
import { subjects } from '../../styles/tokens';
import type { RetroQuestion } from '../../types/retro';
import { useTopicStore } from '../../store/topicStore';

interface HoverTasksProps {
  tasks: Array<{
    id: string;
    title: string;
    subject: string;
    recordCount: number;
    taskRecords: Array<{
      id: string;
      timestamp: string;
    }>;
  }>;
  isVisible: boolean;
  position: { x: number; y: number };
}

interface CompletedRetroCardProps {
  answer: {
    id: string;
    question: string;
    answer: string;
    mood: string;
    emoji?: string;
    createdAt: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

// 已完成回顧小卡片組件
const CompletedRetroCard: React.FC<CompletedRetroCardProps> = ({ answer, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getMoodEmoji = (mood: string) => {
    const moodEmojis = {
      excited: '🤩',
      happy: '😊',
      okay: '😌',
      tired: '😴',
      stressed: '😰'
    };
    return moodEmojis[mood as keyof typeof moodEmojis] || '😌';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('zh-TW', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-lg transition-all duration-300 relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-800 text-sm mb-1 break-words">
              {answer.question}
            </h4>
            <hr className="my-2 border-gray-200" />
            <div className="text-gray-600 text-sm whitespace-pre-wrap break-words">
              <p>{answer.answer}</p>
            </div>
          </div>
        </div>

        {/* 刪除按鈕 */}
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* 日期顯示 */}
        {formatDate(answer.createdAt) && (
          <div className="text-xs text-gray-500 mt-2">
            {formatDate(answer.createdAt)}
          </div>
        )}
      </motion.div>

      {/* 刪除確認對話框 - 使用 Portal */}
      {showDeleteConfirm && createPortal(
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl p-4 w-full max-w-sm shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-white">確認刪除回顧</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  此操作無法復原
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              您確定要刪除這個回顧嗎？
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                  setShowDeleteConfirm(false);
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                確認刪除
              </button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </>
  );
};

  // 根據 subject 獲取顏色配置（使用系統統一配置）
  const getSubjectColor = (subject: string) => {
    const style = subjects.getSubjectStyle(subject);
    return {
      bg: style.bg,
      text: style.text,
      dot: style.accent ? `bg-[${style.accent}]` : style.bg
    };
  };

  // 修改 HoverTasksPanel 組件
  const HoverTasksPanel: React.FC<HoverTasksProps> = ({ tasks, isVisible, position }) => {
    if (!isVisible || tasks.length === 0) return null;

    const formatTime = (timestamp: string) => {
      return new Date(timestamp).toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div
        className="fixed z-50 bg-white rounded-xl shadow-xl border-2 border-blue-200 p-4 max-w-xs pointer-events-none animate-fadeIn"
        style={{
          left: position.x,
          top: position.y - 16,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <div className="text-sm font-medium text-gray-800 mb-2">📋 今日任務活動</div>
        <div className="space-y-3">
          {tasks.map((task, index) => {
            const colors = getSubjectColor(task.subject);
            const hasTaskRecords = task.taskRecords && task.taskRecords.length > 0;
            const hasCheckIns = task.recordCount > 0 && !hasTaskRecords;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} flex-shrink-0`} />
                    <span className="text-gray-700 truncate">{task.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                    {task.subject}
                  </span>
                </div>
                
                <div className="pl-3 space-y-1">
                  {/* 顯示任務記錄 */}
                  {hasTaskRecords && task.taskRecords.map((record, recordIndex) => (
                    <div key={recordIndex} className="text-xs text-gray-600 flex items-center gap-2">
                      <span>📔</span>
                      <span>{formatTime(record.timestamp)}</span>
                      <span className="text-orange-600">學習記錄</span>
                    </div>
                  ))}
                  
                  {/* 顯示打卡記錄 */}
                  {hasCheckIns && (
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <span>🔔</span>
                      <span className="text-blue-600">打卡記錄</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };





export const PersonalRetroPanel: React.FC = () => {
  const {
    currentWeekStats,
    currentSession,
    loading,
    error,
    getCurrentWeekStats,
    getWeekStatsForWeek,
    getCurrentSession,
    getSessionForWeek, // 添加這個
    drawQuestions,
    createAnswer,
    saveSessionAnswer,
    updateSessionQuestions,
    getAnswerHistory,
    getWeekId,
    clearError,
    deleteAnswer,
    completeSession,
    selectedWeekId // 新增：獲取當前選中的週期
  } = useRetroStore();

  // 🔍 專門監聽 selectedWeekId 變化
  useEffect(() => {
    console.log('📅 selectedWeekId 變化:', {
      新值: selectedWeekId,
      時間戳: new Date().toISOString()
    });
  }, [selectedWeekId]);

  // 追蹤載入狀態
  const [loadingState, setLoadingState] = useState<'initial' | 'loading' | 'completed' | 'error'>('initial');

  const [selectedQuestion, setSelectedQuestion] = useState<RetroQuestion | null>(null);
  const [drawnQuestions, setDrawnQuestions] = useState<RetroQuestion[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [retroStep, setRetroStep] = useState<'ready' | 'selecting' | 'answering'>('ready');
  const [completedRetros, setCompletedRetros] = useState<Array<{
    id: string;
    question: string;
    answer: string;
    mood: string;
    emoji?: string;
    createdAt: string;
  }>>([]);

  // 新增狀態
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    tasks: false,
    energy: false,
    dailyTrack: true
  });
  const [hoverTasks, setHoverTasks] = useState<{
    visible: boolean;
    tasks: Array<{
      id: string;
      title: string;
      subject: string;
      recordCount: number;
      taskRecords: Array<{
        id: string;
        timestamp: string;
      }>;
    }>;
    position: { x: number; y: number };
  }>({
    visible: false,
    tasks: [],
    position: { x: 0, y: 0 }
  });
  const [journalModal, setJournalModal] = useState<{
    isOpen: boolean;
    date: string;
    journal: DailyJournal | null;
    loading: boolean;
  }>({
    isOpen: false,
    date: '',
    journal: null,
    loading: false
  });

  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRetroSaved, setIsRetroSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialRetroCount, setInitialRetroCount] = useState(0);

  // 幫你加一個 util，統一 session 取得
  const getSession = async () => {
    if (!selectedWeekId) throw new Error('selectedWeekId 不應為空');
    return await getSessionForWeek(selectedWeekId);
  };

  // 載入週統計數據和當前 session
  useEffect(() => {
    console.log('🔄 PersonalRetroPanel - useEffect 觸發!');
    // 依賴項變化檢查:
    console.log('🔍 依賴項變化檢查:', { 
      selectedWeekId, 
      hasGetCurrentWeekStats: !!getCurrentWeekStats,
      hasGetWeekStatsForWeek: !!getWeekStatsForWeek,
      // refreshCounter
    });
    
    const loadData = async () => {
      console.log('🚀 PersonalRetroPanel - 開始載入數據...');
      console.log('🔍 PersonalRetroPanel - 當前狀態:', { 
        selectedWeekId, 
        hasCurrentWeekStats: !!currentWeekStats,
        loading 
      });
      
      setLoadingState('loading');
      try {
        // 根據是否有選中週期來決定載入邏輯
        let weekStatsPromise;
        let sessionPromise;
        if (selectedWeekId) {
          console.log('📞 PersonalRetroPanel - 載入選中週期數據:', selectedWeekId);
          weekStatsPromise = getWeekStatsForWeek(selectedWeekId);
          sessionPromise = getSession();
        } else {
          // 理論上不應該進來
          throw new Error('selectedWeekId 不應為空，請檢查 UI 狀態');
        }
        
        console.log('⏳ PersonalRetroPanel - 等待 Promise.all 完成...');
        const [weekStats, session] = await Promise.all([
          weekStatsPromise,
          sessionPromise
        ]);
        
        console.log('📊 PersonalRetroPanel - 載入的週統計:', weekStats);
        if (weekStats && weekStats.dailyCheckIns) {
          weekStats.dailyCheckIns.forEach((row: any, idx: number) => {
            console.log(`[DEBUG] dailyCheckIns[${idx}]`, row);
          });
        }
        console.log('🎯 PersonalRetroPanel - 載入的 session:', session);
        
        // 如果 session 存在且有週統計數據，從 session 中提取已完成的回顧
        if (session?.weeklyStats) {
          console.log('📝 PersonalRetroPanel - 從 session 載入回顧...');
          await loadCompletedRetrosFromSession(session);
        } else {
          console.log('📝 PersonalRetroPanel - 回退到直接載入回顧...');
          await loadCompletedRetros();
        }
        
        console.log('✅ PersonalRetroPanel - 數據載入完成');
        setLoadingState('completed');
        // 🔄 強制觸發重新渲染
        // setRefreshCounter(prev => prev + 1);
      } catch (error) {
        console.error('❌ PersonalRetroPanel - 載入數據失敗:', error);
        setLoadingState('error');
      }
    };
    
    // 當 selectedWeekId 變化時重新載入，或首次載入時
    loadData();
  }, [selectedWeekId]);

  // 從 session 中載入已完成的回顧
  const loadCompletedRetrosFromSession = async (session: any) => {
    try {
      console.log('📝 從 session 載入回顧記錄:', session);
      
      // 如果 session 有答案數據，直接使用
      if (session.sessionAnswers && Array.isArray(session.sessionAnswers)) {
        const formatted = session.sessionAnswers.map((answer: any) => ({
          id: answer.id,
          question: answer.question?.question || answer.customQuestion || '自定義問題',
          answer: answer.answer,
          mood: answer.mood,
          emoji: answer.emoji,
          createdAt: answer.createdAt
        }));
        
        console.log('📝 從 session 提取的回顧記錄:', formatted);
        setCompletedRetros(formatted);
        
        // 初始化時正確設 isRetroSaved/hasChanges
        if (formatted.length >= 2) {
          setIsRetroSaved(true);
          setHasChanges(false);
        } else {
          setIsRetroSaved(false);
        }
        return;
      }
      
      // 回退到原來的方法
      await loadCompletedRetros();
    } catch (error) {
      console.error('從 session 載入回顧失敗:', error);
      // 回退到原來的方法
      await loadCompletedRetros();
    }
  };

  // 載入本週已完成的回顧 (回退方法)
  const loadCompletedRetros = async () => {
    try {
      // 使用統一的週期計算邏輯
      const { getWeekStart, getWeekEnd } = await import('../../utils/weekUtils');
      
      const weekStartStr = getWeekStart();
      const weekEndStr = getWeekEnd();
      
      console.log('🔍 查詢本週回顧:', { weekStartStr, weekEndStr });
      
      const answers = await getAnswerHistory({
        startDate: weekStartStr,
        endDate: weekEndStr
      });
      
      const formatted = answers.map(answer => ({
        id: answer.id,
        question: answer.question.question,
        answer: answer.answer,
        mood: answer.mood,
        emoji: answer.emoji,
        createdAt: answer.createdAt
      }));
      
      console.log('📝 本週回顧記錄:', formatted);
      setCompletedRetros(formatted);
      
      // 初始化時正確設 isRetroSaved/hasChanges
      if (formatted.length >= 2) {
        setIsRetroSaved(true);
        setHasChanges(false);
      } else {
        setIsRetroSaved(false);
      }
    } catch (error) {
      console.error('載入已完成回顧失敗:', error);
    }
  };

  // 切換區塊展開狀態
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 處理打卡hover
  const handleCheckInHover = async (
    event: React.MouseEvent,
    checkInTasks: Array<{
      id: string;
      title: string;
      subject: string;
      recordCount: number;
      taskRecords?: Array<{
        id: string;
        timestamp: string;
      }>;
    }>
  ) => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }

    const rect = event.currentTarget.getBoundingClientRect();

    try {
      // 現在任務詳情已經包含了 taskRecords，不需要額外查詢
      const tasksWithRecords = checkInTasks
        .filter(task => task.taskRecords && task.taskRecords.length > 0)
        .map(task => ({
          ...task,
          taskRecords: task.taskRecords || []
        }));

      setHoverTasks({
        visible: true,
        tasks: tasksWithRecords,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top
        }
      });
    } catch (error) {
      console.error('處理打卡記錄失敗:', error);
    }
  };

  const handleCheckInLeave = () => {
    const timer = setTimeout(() => {
      setHoverTasks(prev => ({ ...prev, visible: false }));
    }, 100);
    setHoverTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);

  // 偵測回顧數量變化
  useEffect(() => {
    if (initialRetroCount > 0 && completedRetros.length !== initialRetroCount) {
      setHasChanges(true);
      // 如果從已儲存狀態變化，重置儲存狀態
      if (isRetroSaved) {
        setIsRetroSaved(false);
      }
    }
  }, [completedRetros.length, initialRetroCount, isRetroSaved]);

  // 處理日記查看
  const handleViewJournal = async (date: string) => {
    console.log('📖 Opening journal for date:', date);
    setJournalModal({
      isOpen: true,
      date,
      journal: null,
      loading: true
    });

    try {
      const journal = await journalStore.getJournalByDate(date);
      console.log('📖 Journal loaded:', journal);
      setJournalModal(prev => ({
        ...prev,
        journal,
        loading: false
      }));
    } catch (error) {
      console.error('❌ Failed to load journal:', error);
      setJournalModal(prev => ({
        ...prev,
        journal: null,
        loading: false
      }));
    }
  };

  // 處理問題選擇
  const handleQuestionSelect = async (question: RetroQuestion) => {
    try {
      setSelectedQuestion(question);
      setShowQuestionModal(false);
      setRetroStep('answering');

      // 統一 session 取得
      let session = currentSession;
      if (!session) {
        session = await getSession();
        if (!session) {
          throw new Error('無法創建或獲取 session');
        }
      }

      // 如果這是新抽取的問題，更新 session 的問題記錄
      if (drawnQuestions.length > 0) {
        await updateSessionQuestions(session.id, drawnQuestions);
      }
    } catch (error) {
      console.error('處理問題選擇失敗:', error);
      setSelectedQuestion(question);
      setShowQuestionModal(false);
      setRetroStep('answering');
    }
  };

  // 處理回答提交
  const handleAnswerSubmit = async (answer: string, emoji?: string) => {
    try {
      if (!selectedQuestion) {
        console.error('沒有選中的問題');
        return;
      }

      // 統一 session 取得
      let session = currentSession;
      if (!session) {
        session = await getSession();
        if (!session) {
          throw new Error('無法創建或獲取 session');
        }
      }

      const weekId = getWeekId();
      
      // 使用 session-based 保存
      const savedAnswer = await saveSessionAnswer(session.id, {
        weekId,
        question: selectedQuestion,
        isCustomQuestion: false,
        answer,
        mood: 'okay', // 默認心情
        emoji
      });

      if (savedAnswer) {
        // 先 append 到 completedRetros，避免 reload 前畫面消失
        setCompletedRetros(prev => [
          ...prev,
          {
            id: savedAnswer.id,
            question: savedAnswer.question?.question || savedAnswer.customQuestion || '自定義問題',
            answer: savedAnswer.answer,
            mood: savedAnswer.mood,
            emoji: savedAnswer.emoji,
            createdAt: savedAnswer.createdAt
          }
        ]);
        // 重新載入 session 以獲取最新數據
        const updatedSession = await getSession();
        if (updatedSession) {
          await loadCompletedRetrosFromSession(updatedSession);
        } else {
          await loadCompletedRetros();
        }
        // 標記有變化（新增了回顧）
        setHasChanges(true);
        setRetroStep('ready');
        setSelectedQuestion(null);
      }
      
    } catch (error) {
      console.error('提交回答失敗:', error);
    }
  };

  // 重新開始回顧
  const handleRestart = () => {
    setSelectedQuestion(null);
    setDrawnQuestions([]);
    setRetroStep('ready');
  };

  // 獲取學習模式的顯示
  const getLearningPatternDisplay = (pattern: string) => {
    const patterns = {
      consistent: { emoji: '📈', text: '穩定持續' },
      burst: { emoji: '💥', text: '爆發式' },
      irregular: { emoji: '🌊', text: '不規律' },
      balanced: { emoji: '⚖️', text: '平衡發展' }
    };
    return patterns[pattern as keyof typeof patterns] || patterns.balanced;
  };

  // 獲取心情表情
  const getMoodEmoji = (mood: string | null) => {
    const moodEmojis = {
      excited: '🤩',
      happy: '😊',
      okay: '😐',
      tired: '😴',
      stressed: '😰'
    };
    return moodEmojis[mood as keyof typeof moodEmojis] || '😐';
  };

  // 獲取能量表情
  const getEnergyEmoji = (energy: number) => {
    if (energy >= 5) return '🔥';
    if (energy >= 4) return '😊';
    if (energy >= 3) return '😌';
    if (energy >= 2) return '😐';
    return '😴';
  };

  // 獲取台灣時間的今日日期字串
  const getTaiwanToday = () => {
    const now = new Date();
    // 使用 en-CA locale 直接獲取 YYYY-MM-DD 格式
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Taipei'
    }).format(now);
  };

  // 處理儲存回顧
  const handleSaveRetro = async () => {
    if (!currentWeekStats || !currentSession) return;
    
    setIsSaving(true);
    try {
      // 🎯 真正的儲存邏輯：完成當前 session
      const success = await completeSession(currentSession.id);
      
      if (success) {
        setShowSaveDialog(false);
        setIsSaving(false);
        
        // 標記為已儲存，重置變化狀態
        setIsRetroSaved(true);
        setHasChanges(false);
        
        console.log('✅ 回顧已儲存並完成');
        
        // 重新載入 session 以更新狀態
        await getSession();
      } else {
        throw new Error('完成 session 失敗');
      }
    } catch (error) {
      console.error('儲存失敗:', error);
      setIsSaving(false);
      
      // 可以添加錯誤提示 UI
      alert('儲存失敗，請重試');
    }
  };

  // 獲取週期間的日期範圍文字
  const getWeekDateRange = () => {
    if (!currentWeekStats?.dailyCheckIns || currentWeekStats.dailyCheckIns.length === 0) {
      return '';
    }
    
    const dates = currentWeekStats.dailyCheckIns.map(d => new Date(d.date)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    return `${firstDate.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} ~ ${lastDate.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}`;
  };

  if (!currentWeekStats) {
    if (loadingState === 'loading' || loadingState === 'initial') {
      console.log('📊 顯示載入中...');
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <LoadingDots />
            <p className="mt-4 text-gray-600">載入本週學習統計中...</p>
          </div>
        </div>
      );
    }
    
    console.log('❌ 顯示暫無數據...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600">暫無本週學習數據</p>
          {loadingState === 'error' && (
            <p className="mt-2 text-red-600 text-sm">載入過程中發生錯誤</p>
          )}
        </div>
      </div>
    );
  }

  const patternDisplay = getLearningPatternDisplay(currentWeekStats.weekSummary?.learningPattern || 'balanced');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* 標題區域 */}
      <div className="bg-white/80 backdrop-blur-md border-b border-orange-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                ✨ 個人回顧時光
              </h1>
            </div>
            
            {/* 狀態指示器 */}
            <div className="flex items-center space-x-6">
              {/* 流程狀態指示器 */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  completedRetros.length >= 1 ? 'bg-orange-400' : 'bg-gray-300'
                }`} />
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  completedRetros.length >= 2 ? 'bg-yellow-400' : 'bg-gray-300'
                }`} />
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  completedRetros.length >= 3 ? 'bg-green-400' : 'bg-gray-300'
                }`} />
              </div>
              {/* 完成的回顧計數與提示 */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {completedRetros.length === 0 && <span>寫下兩個心得完成這週的回顧喔</span>}
                {completedRetros.length === 1 && <span>再寫一個心得回顧就完成了呢</span>}
                {completedRetros.length >= 2 && <span>哇！你留下了 {completedRetros.length} 個心得, 真棒!</span>}
              </div>
              
              {/* 儲存按鈕 - 只在完成2個以上回顧時顯示 */}
              {completedRetros.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={hasChanges ? 'save' : 'saved'}
                >
                  {hasChanges ? (
                    // 可儲存狀態
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSaveDialog(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Save className="w-4 h-4" />
                      <span>儲存回顧</span>
                    </motion.button>
                  ) : (
                    // 已儲存狀態
                    <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-medium rounded-xl shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span>回顧已儲存</span>
                    </div>
                  )}
                </motion.div>
              )}
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
            className="max-w-7xl mx-auto px-6 py-4"
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

      {/* 主要內容區域 - 三欄布局 */}
      <div className="max-w-7xl mx-auto px-6 py-4" key={currentWeekStats?.weekId}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 左欄：任務進度 + 每日學習軌跡 */}
          <div className="space-y-4 md:col-span-1">
            {/* 任務進度 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-xl p-4 border-2 border-green-200 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🎯</span>
                  任務進度
                </h3>
                <button
                  onClick={() => toggleSection('tasks')}
                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                >
                  {expandedSections.tasks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* 任務摘要 */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200 text-center">
                  <div className="text-xl mb-1">✅</div>
                  <div className="text-base font-bold text-green-600">{currentWeekStats.completedTaskCount}</div>
                  <div className="text-xs text-gray-600">已完成</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200 text-center">
                  <div className="text-xl mb-1">🔄</div>
                  <div className="text-base font-bold text-blue-600">{currentWeekStats.inProgressTasks.length}</div>
                  <div className="text-xs text-gray-600">進行中</div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 border border-orange-200 text-center">
                  <div className="text-xl mb-1">📔</div>
                  <div className="text-base font-bold text-orange-600">{currentWeekStats.totalTaskRecords || 0}</div>
                  <div className="text-xs text-gray-600">任務記錄</div>
                </div>
              </div>

              {/* 詳細任務列表 */}
              <AnimatePresence>
                {expandedSections.tasks && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* 完成的任務 */}
                    {currentWeekStats.mainTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">✅ 完成的任務</h4>
                        <div className="space-y-2">
                          {currentWeekStats.mainTasks.slice(0, 3).map((task, index) => {
                            const colors = getSubjectColor(task.topic);
                            return (
                              <div
                                key={task.id}
                                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                    <div>
                                      <h5 className="font-medium text-gray-800 text-sm">{task.title}</h5>
                                      <p className={`text-xs ${colors.text}`}>{task.topic}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                      <span
                                        key={i}
                                        className={`text-xs ${
                                          i < task.difficulty ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                      >
                                        ⭐
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 進行中的任務 */}
                    {currentWeekStats.inProgressTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">🔄 正在進行</h4>
                        <div className="space-y-2">
                          {currentWeekStats.inProgressTasks.slice(0, 3).map((task, index) => {
                            const colors = getSubjectColor(task.topic);
                            return (
                              <div
                                key={task.id}
                                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                    <div>
                                      <h5 className="font-medium text-gray-800 text-sm">{task.title}</h5>
                                      <p className={`text-xs ${colors.text}`}>{task.topic}</p>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {task.daysInProgress > 0 && `${task.daysInProgress}天`}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* 每日學習軌跡 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-md rounded-xl p-4 border-2 border-purple-200 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📅</span>
                  每日學習軌跡
                </h3>
                <button
                  onClick={() => toggleSection('dailyTrack')}
                  className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  {expandedSections.dailyTrack ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
              
              <AnimatePresence>
                {expandedSections.dailyTrack && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {currentWeekStats.dailyCheckIns.map((day, index) => (
                      <motion.div
                        key={day.date}
                        data-date={day.date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-md transition-all p-3"
                      >
                        <div className="flex flex-col gap-2">
                          {/* 第一行：日期/星期 + 心情/動力/查看日記 */}
                          <div className="flex items-center justify-between">
                            {/* 左邊：日期/星期幾 */}
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-gray-500">
                                {new Date(day.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
                              </div>
                              <div className="text-sm font-medium text-gray-800">
                                {day.dayOfWeek}
                              </div>
                            </div>
                            
                            {/* 右邊：心情/動力/查看日記 */}
                            <div className="flex items-center space-x-3">
                              {day.mood && (
                                <span className="text-lg" title={`心情: ${day.mood}`}>
                                  {getMoodEmoji(day.mood)}
                                </span>
                              )}
                              {day.energy && (
                                <span className="text-lg" title={`能量: ${day.energy}/5`}>
                                  {getEnergyEmoji(day.energy)}
                                </span>
                              )}
                              <button
                                onClick={() => handleViewJournal(day.date)}
                                className="flex items-center space-x-1 text-xs text-gray-600 hover:text-purple-600 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>查看日記</span>
                              </button>
                            </div>
                          </div>

                          {/* 第二行：打卡次數、任務記錄和完成任務 */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* 打卡次數 - 狀態變化記錄 */}
                            {day.checkInCount > 0 && (
                              <span
                                className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 transition-colors text-xs hover-tasks-trigger"
                                onMouseEnter={(e) => handleCheckInHover(e, day.topics.filter(t => t.recordCount > 0 && !t.taskRecords?.length))}
                                onMouseLeave={handleCheckInLeave}
                              >
                                🔔 {day.checkInCount} 次打卡
                              </span>
                            )}
                            
                            {/* 任務記錄 - 學習過程記錄 */}
                            {day.taskRecordCount > 0 && (
                              <span
                                className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-700 cursor-pointer hover:bg-orange-200 transition-colors text-xs hover-tasks-trigger"
                                onMouseEnter={(e) => handleCheckInHover(e, day.topics.filter(t => t.taskRecords?.length > 0))}
                                onMouseLeave={handleCheckInLeave}
                              >
                                📔 {day.taskRecordCount} 個記錄
                              </span>
                            )}
                            
                            {/* 完成的任務 - 使用每日數據中的 completedTasks */}
                            {(day.completedTasks || [])
                              .slice(0, 3)
                              .map((task, taskIndex) => {
                                const colors = getSubjectColor(task.subject);
                                return (
                                  <span
                                    key={taskIndex}
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${colors.bg} ${colors.text}`}
                                  >
                                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} mr-1.5`} />
                                    ✅ {task.title}
                                  </span>
                                );
                              })}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* 中欄：本週學習回顧 + 能量變化 */}
          <div className="space-y-4 md:col-span-1">
            {/* 本週學習回顧 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-xl p-4 border-2 border-orange-200 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  📊 本週學習回顧
                </h2>
                <button
                  onClick={() => toggleSection('summary')}
                  className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  {expandedSections.summary ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* 核心數據摘要 */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{patternDisplay.emoji}</span>
                  <span className="font-medium text-gray-800 text-sm">{patternDisplay.text}學習模式</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-base font-bold text-blue-600">{currentWeekStats.totalCheckIns}</div>
                    <div className="text-xs text-gray-600">次打卡</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-green-600">{currentWeekStats.completedTaskCount}</div>
                    <div className="text-xs text-gray-600">完成任務</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-orange-600">{currentWeekStats.averageEnergy || 0}/5</div>
                    <div className="text-xs text-gray-600">平均能量</div>
                  </div>
                </div>
              </div>

              {/* 詳細摘要 */}
              <AnimatePresence>
                {expandedSections.summary && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-gray-700">
                      本週學習模式：{patternDisplay.text}，共完成 {currentWeekStats.completedTaskCount} 個任務，
                      進行了 {currentWeekStats.totalCheckIns} 次打卡，記錄了 {currentWeekStats.totalTaskRecords || 0} 個學習心得。
                      {currentWeekStats.averageEnergy && `平均能量指數為 ${currentWeekStats.averageEnergy.toFixed(1)}/5。`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* 能量變化圖表 */}
            {currentWeekStats.dailyCheckIns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 backdrop-blur-md rounded-xl p-4 border-2 border-indigo-200 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">📊</span>
                    能量變化
                  </h3>
                  <button
                    onClick={() => toggleSection('energy')}
                    className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    {expandedSections.energy ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
                  <div className="flex items-end justify-between gap-1 h-16">
                    {currentWeekStats.dailyCheckIns.map((day, index) => {
                      const height = day.energy ? (day.energy / 5) * 100 : (day.totalActivities / Math.max(...currentWeekStats.dailyCheckIns.map(d => d.totalActivities))) * 100;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <motion.div
                            className="bg-gradient-to-t from-indigo-400 to-purple-400 rounded-t-lg min-h-[4px] w-full cursor-pointer"
                            style={{ height: `${height}%` }}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            title={`${day.date}: ${day.energy || '未記錄'}${day.energy ? '/5' : ''}`}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {day.mood ? getMoodEmoji(day.mood) : '😐'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedSections.energy && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 text-sm text-gray-600"
                    >
                      <p>每日能量變化趨勢，反映你的學習狀態和心情起伏。</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* 右欄：本週回顧記錄 */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            {completedRetros.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-md rounded-xl p-4 border-2 border-green-200 shadow-lg"
              >
                <h3 className="text-base font-semibold text-gray-800 flex items-center mb-3">
                  <span className="mr-2">📝</span>
                  本週回顧記錄
                  <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {completedRetros.length} 個
                  </span>
                </h3>

                <div className="space-y-3">
                  {completedRetros.map((retro) => (
                    <CompletedRetroCard
                      key={retro.id}
                      answer={retro}
                      onDelete={async () => {
                        try {
                          await deleteAnswer(retro.id);
                          // reload 當前 session
                          const updatedSession = await getSession();
                          if (updatedSession) {
                            await loadCompletedRetrosFromSession(updatedSession);
                          } else {
                            setCompletedRetros([]); // 沒有 session 就清空
                          }
                          // 標記有變化（刪除了回顧）
                          setHasChanges(true);
                        } catch (error) {
                          console.error('刪除回顧失敗:', error);
                        }
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {retroStep === 'answering' && selectedQuestion ? (
                <motion.div
                  key="answering"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/80 backdrop-blur-md rounded-xl p-4 border-2 border-orange-200 shadow-lg"
                >
                  <AnswerInputCard
                    question={selectedQuestion.question}
                    questionType={selectedQuestion.type}
                    hint={selectedQuestion.hint}
                    example={selectedQuestion.example}
                    isCustomQuestion={false}
                    onSubmit={handleAnswerSubmit}
                    onBack={handleRestart}
                    submitButtonText="儲存"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="draw-question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/80 backdrop-blur-md rounded-xl p-4 border-2 border-orange-200 shadow-lg"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🎯</div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">
                      想要進行另一個回顧嗎？
                    </h2>
                    <p className="text-gray-600 mb-6 text-sm">
                      每個問題都能帶來不同的反思角度，讓我們繼續探索學習旅程！
                    </p>
                    
                    <motion.button
                      onClick={() => setShowQuestionModal(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center mx-auto space-x-2"
                    >
                      <span>🎲</span>
                      <span>抽取回顧問題</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modal 相關 */}
      <AnimatePresence>
        {showQuestionModal && (
          <motion.div
            key="question-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowQuestionModal(false)}
          >
            <motion.div
              key="question-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <QuestionDrawGame
                onQuestionSelect={handleQuestionSelect}
                onBack={() => setShowQuestionModal(false)}
                drawnQuestions={drawnQuestions}
                setDrawnQuestions={setDrawnQuestions}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover 任務面板 */}
      {hoverTasks.visible && <HoverTasksPanel
        tasks={hoverTasks.tasks}
        isVisible={hoverTasks.visible}
        position={hoverTasks.position}
      />}

      {/* 日記查看 Modal */}
      {journalModal.isOpen && (
        <DailyJournalDialog
          isOpen={journalModal.isOpen}
          onClose={() => setJournalModal(prev => ({ ...prev, isOpen: false }))}
          mode="view"
          initialData={journalModal.journal || undefined}
        />
      )}

      {/* 儲存鼓勵對話框 */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSaving) {
                setShowSaveDialog(false);
              }
            }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 標題區 */}
              <div 
                className="relative p-6 rounded-t-3xl text-white text-center"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
              >
                {!isSaving && (
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    type="button"
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-6 h-6" />
                  <h2 className="text-xl font-bold">太棒了！</h2>
                </div>
                <p className="text-white/90 text-sm">
                  你完成了這週的學習回顧
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* 成就統計 */}
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                      <Star className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      你在 {getWeekDateRange()} 期間的成就：
                    </h3>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">{currentWeekStats?.completedTaskCount || 0}</div>
                          <div className="text-xs text-gray-600">完成任務</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{currentWeekStats?.totalCheckIns || 0}</div>
                          <div className="text-xs text-gray-600">次打卡</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">{completedRetros.length}</div>
                          <div className="text-xs text-gray-600">個心得</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-purple-600">
                      <Heart className="w-5 h-5" />
                      <span className="font-medium">回顧與紀錄是成長的關鍵</span>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed">
                      透過回顧，你不僅記錄了學習的足跡，更重要的是培養了反思的習慣。
                      每一個心得都是你成長路上的寶貴財富！
                    </p>
                    
                    <div className="flex items-center justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, rotate: 0 }}
                          animate={{ scale: 1, rotate: 360 }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                        >
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 動作按鈕 */}
                <div className="space-y-3">
                  <motion.button
                    onClick={handleSaveRetro}
                    disabled={isSaving}
                    className={`w-full py-3 rounded-xl font-semibold text-base transition-all ${
                      isSaving
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl'
                    }`}
                    whileHover={!isSaving ? { scale: 1.02 } : {}}
                    whileTap={!isSaving ? { scale: 0.98 } : {}}
                  >
                    {isSaving ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        儲存中...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        確認儲存
                      </div>
                    )}
                  </motion.button>
                  
                  {!isSaving && (
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="w-full py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      再補充一下
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 