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
import { ChevronDown, ChevronUp, Calendar, Eye, BookOpen, ExternalLink } from 'lucide-react';
import { useRetroStore } from '../../store/retroStore';
import { journalStore, type DailyJournal } from '../../store/journalStore';
import { QuestionDrawGame } from './QuestionDrawGame';
import { AnswerInputCard } from './AnswerInputCard';
import { LoadingDots } from '../shared/LoadingDots';
import { DailyJournalDialog } from '../../pages/student/components/DailyJournalDialog';
import { subjects } from '../../styles/tokens';
import type { RetroQuestion } from '../../types/retro';

interface HoverTasksProps {
  tasks: Array<{ title: string; recordCount: number; subject?: string }>;
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
    return date.toLocaleDateString('zh-TW', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getMoodEmoji(answer.mood)}</span>
            <span className="text-xs text-gray-500">{formatDate(answer.createdAt)}</span>
          </div>
          
          <h4 className="font-medium text-gray-800 text-sm mb-1">
            {answer.question}
          </h4>
          
          <div className="text-gray-600 text-sm">
            <p>{answer.answer}</p>
          </div>
        </div>
      </div>
      
      {(onEdit || onDelete) && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end space-x-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              編輯
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              刪除
            </button>
          )}
        </div>
      )}
    </motion.div>
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

  const HoverTasksPanel: React.FC<HoverTasksProps> = ({ tasks, isVisible, position }) => {
  if (!isVisible || tasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-50 bg-white rounded-xl shadow-xl border-2 border-orange-200 p-4 max-w-xs"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -120%)'
      }}
    >
      <div className="text-sm font-medium text-gray-800 mb-2">📚 今日學習任務</div>
      <div className="space-y-2">
        {tasks.map((task, index) => {
          const colors = getSubjectColor((task as any).subject || '其他');
          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />
                <span className="text-gray-700 truncate">{task.title}</span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                  {(task as any).subject || '其他'}
                </span>
                <span className="text-orange-600 font-medium">{task.recordCount}次</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};





export const PersonalRetroPanel: React.FC = () => {
  const {
    currentWeekStats,
    loading,
    error,
    getCurrentWeekStats,
    drawQuestions,
    createAnswer,
    getAnswerHistory,
    getWeekId,
    clearError
  } = useRetroStore();

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
    tasks: Array<{ title: string; recordCount: number }>;
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

  // 載入週統計數據和已完成的回顧
  useEffect(() => {
    const loadData = async () => {
      try {
        await getCurrentWeekStats();
        await loadCompletedRetros();
      } catch (error) {
        console.error('載入數據失敗:', error);
      }
    };
    loadData();
  }, [getCurrentWeekStats]);

  // 載入本週已完成的回顧
  const loadCompletedRetros = async () => {
    try {
      // 使用正確的週開始和結束日期
      const today = new Date().toISOString().split('T')[0]; // 取得今天的日期 YYYY-MM-DD
      const currentDate = new Date(today);
      
      // 計算本週開始日期（週一）
      const dayOfWeek = currentDate.getDay();
      const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // 調整到週一
      const weekStart = new Date(currentDate.setDate(diff));
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      // 計算本週結束日期（週日）
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
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
  const handleCheckInHover = (
    event: React.MouseEvent,
    tasks: Array<{ title: string; recordCount: number }>
  ) => {
    console.log('🖱️ Hover on check-in:', { event, tasks });
    const rect = event.currentTarget.getBoundingClientRect();
    console.log('📍 Hover position:', { rect, left: rect.left, top: rect.top, width: rect.width });
    
    setHoverTasks({
      visible: true,
      tasks,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    });
    
    console.log('✅ Hover state updated:', {
      visible: true,
      tasksCount: tasks.length,
      position: { x: rect.left + rect.width / 2, y: rect.top }
    });
  };

  const handleCheckInLeave = () => {
    console.log('🖱️ Mouse leave check-in');
    setHoverTasks(prev => ({ ...prev, visible: false }));
  };

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
  const handleQuestionSelect = (question: RetroQuestion) => {
    setSelectedQuestion(question);
    setShowQuestionModal(false);
    setRetroStep('answering');
  };

  // 處理回答提交
  const handleAnswerSubmit = async (answer: string, emoji?: string) => {
    try {
      const weekId = getWeekId();
      
      if (selectedQuestion) {
        await createAnswer({
          weekId,
          question: selectedQuestion,
          isCustomQuestion: false,
          answer,
          mood: 'okay', // 默認心情
          emoji
        });
        
        // 儲存成功後，重新加載已完成的回顧並回到 ready 狀態
        await loadCompletedRetros();
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

  if (loading && !currentWeekStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingDots />
          <p className="mt-4 text-gray-600">載入本週學習統計中...</p>
        </div>
      </div>
    );
  }

  if (!currentWeekStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600">暫無本週學習數據</p>
        </div>
      </div>
    );
  }

  const patternDisplay = getLearningPatternDisplay(currentWeekStats.weekSummary.learningPattern);

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
              <p className="text-gray-600 text-sm">
                {retroStep === 'ready' && '左側查看任務進度、能量變化和每日軌跡，右側開始深度反思'}
                {retroStep === 'selecting' && '從三張卡片中選擇一個問題開始回顧'}
                {retroStep === 'answering' && '參考左側的學習記錄，誠實分享你的想法和感受'}
              </p>
            </div>
            
            {/* 狀態指示器 */}
            <div className="flex items-center space-x-6">
              {/* 流程狀態指示器 */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${retroStep === 'ready' ? 'bg-blue-400' : 'bg-gray-300'}`} />
                <div className={`w-3 h-3 rounded-full ${retroStep === 'selecting' ? 'bg-purple-400' : 'bg-gray-300'}`} />
                <div className={`w-3 h-3 rounded-full ${retroStep === 'answering' ? 'bg-orange-400' : 'bg-gray-300'}`} />
              </div>
              
              {/* 完成的回顧計數 */}
              {completedRetros.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>📝</span>
                  <span>本週已完成 {completedRetros.length} 個回顧</span>
                </div>
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

      {/* 主要內容區域 - 重新調整布局 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：任務進度 + 能量變化 + 每日學習軌跡 */}
          <div className="space-y-6">
            {/* 任務進度 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-green-200 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
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
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 text-center">
                  <div className="text-2xl mb-1">✅</div>
                  <div className="text-lg font-bold text-green-600">{currentWeekStats.completedTaskCount}</div>
                  <div className="text-xs text-gray-600">已完成</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 text-center">
                  <div className="text-2xl mb-1">🔄</div>
                  <div className="text-lg font-bold text-blue-600">{currentWeekStats.inProgressTasks.length}</div>
                  <div className="text-xs text-gray-600">進行中</div>
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
                          {currentWeekStats.mainTasks.slice(0, 3).map((task, index) => (
                            <div
                              key={task.id}
                              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-800 text-sm">{task.title}</h5>
                                  <p className="text-xs text-gray-600">{task.topic}</p>
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
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 進行中的任務 */}
                    {currentWeekStats.inProgressTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">🔄 正在進行</h4>
                        <div className="space-y-2">
                          {currentWeekStats.inProgressTasks.slice(0, 3).map((task, index) => (
                            <div
                              key={task.id}
                              className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-800 text-sm">{task.title}</h5>
                                  <p className="text-xs text-gray-600">{task.topic}</p>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {task.daysInProgress > 0 && `${task.daysInProgress}天`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* 能量變化圖表 */}
            {currentWeekStats.energyTimeline.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-indigo-200 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
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

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-end justify-between gap-1 h-20">
                    {currentWeekStats.energyTimeline.map((point, index) => {
                      const height = (point.energy / 5) * 100;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <motion.div
                            className="bg-gradient-to-t from-indigo-400 to-purple-400 rounded-t-lg min-h-[4px] w-full cursor-pointer"
                            style={{ height: `${height}%` }}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            title={`${point.date}: ${point.energy}/5`}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {getMoodEmoji(point.mood)}
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
             
             {/* 每日學習軌跡 */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-purple-200 shadow-lg"
             >
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-semibold text-gray-800 flex items-center">
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
                     className="space-y-3"
                   >
                     {currentWeekStats.dailyCheckIns.map((day, index) => (
                       <motion.div
                         key={day.date}
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.1 + index * 0.05 }}
                         className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all p-4"
                       >
                         <div className="flex items-center justify-between">
                           {/* 左邊：日期/星期幾 */}
                           <div className="flex items-center space-x-3">
                             <div className="text-sm font-medium text-gray-800 min-w-[60px]">
                               {day.dayOfWeek}
                             </div>
                             <div className="text-xs text-gray-500">
                               {new Date(day.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
                             </div>
                             {day.checkInCount > 0 && (
                               <span
                                 className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 cursor-pointer hover:bg-green-200 transition-colors text-xs"
                                 onMouseEnter={(e) => handleCheckInHover(e, day.topics)}
                                 onMouseLeave={handleCheckInLeave}
                               >
                                 {day.checkInCount} 次打卡
                               </span>
                             )}
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
                         
                         {/* 該日任務預覽 */}
                         {day.topics.length > 0 && (
                           <div className="mt-2 flex flex-wrap gap-1">
                             {day.topics.slice(0, 3).map((task, taskIndex) => {
                               const colors = getSubjectColor(task.subject || '其他');
                               return (
                                 <span
                                   key={taskIndex}
                                   className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${colors.bg} ${colors.text}`}
                                 >
                                   <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} mr-1.5`} />
                                   {task.title}
                                   {task.recordCount > 1 && (
                                     <span className="ml-1 font-medium">({task.recordCount})</span>
                                   )}
                                 </span>
                               );
                             })}
                             {day.topics.length > 3 && (
                               <span className="text-gray-500 text-xs">
                                 +{day.topics.length - 3} 更多
                               </span>
                             )}
                           </div>
                         )}
                       </motion.div>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
             </motion.div>
           </div>

           {/* 右側：本週學習回顧 + 回顧區 */}
           <div className="space-y-6">
             {/* 本週學習回顧 */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-orange-200 shadow-lg"
             >
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
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
               <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200 mb-4">
                 <div className="flex items-center gap-3 mb-2">
                   <span className="text-2xl">{patternDisplay.emoji}</span>
                   <span className="font-semibold text-gray-800">{patternDisplay.text}學習模式</span>
                 </div>
                 <div className="grid grid-cols-3 gap-4 text-center">
                   <div>
                     <div className="text-lg font-bold text-blue-600">{currentWeekStats.checkInCount}</div>
                     <div className="text-xs text-gray-600">次打卡</div>
                   </div>
                   <div>
                     <div className="text-lg font-bold text-green-600">{currentWeekStats.completedTaskCount}</div>
                     <div className="text-xs text-gray-600">完成任務</div>
                   </div>
                   <div>
                     <div className="text-lg font-bold text-orange-600">{currentWeekStats.averageEnergy}/5</div>
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
                       {currentWeekStats.weekSummary.summary}
                     </p>
                     
                     {/* 關鍵字標籤 */}
                     {currentWeekStats.weekSummary.keywords.length > 0 && (
                       <div className="flex flex-wrap gap-2">
                         {currentWeekStats.weekSummary.keywords.map((keyword, index) => (
                           <span
                             key={index}
                             className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 border border-orange-200"
                           >
                             {keyword}
                           </span>
                         ))}
                       </div>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
             </motion.div>

            {/* 回顧問答區 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="min-h-[300px]"
            >
              <AnimatePresence mode="wait">
                {retroStep === 'ready' && (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* 已完成的回顧 */}
                    {completedRetros.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          <span className="mr-2">📝</span>
                          本週的回顧記錄
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {completedRetros.map((retro) => (
                            <CompletedRetroCard
                              key={retro.id}
                              answer={retro}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 開始新回顧 */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-orange-200 shadow-lg">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🎯</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                          {completedRetros.length > 0 ? '想要進行另一個回顧嗎？' : '準備好開始回顧了嗎？'}
                        </h2>
                        <p className="text-gray-600 mb-8">
                          {completedRetros.length > 0 
                            ? '每個問題都能帶來不同的反思角度，讓我們繼續探索學習旅程！'
                            : '看看左側的任務進度、能量變化和每日軌跡，回想一下這週的點點滴滴，然後我們一起深入探索你的學習旅程！'
                          }
                        </p>
                        
                        <motion.button
                          onClick={() => setShowQuestionModal(true)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-8 py-4 bg-gradient-to-r from-orange-400 to-pink-400 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center mx-auto space-x-3"
                        >
                          <span>🎲</span>
                          <span>{completedRetros.length > 0 ? '再抽一個問題' : '抽取回顧問題'}</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {retroStep === 'answering' && selectedQuestion && (
                  <motion.div
                    key="answering"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
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
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 問題選擇 Modal */}
      <AnimatePresence>
        {showQuestionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowQuestionModal(false)}
          >
            <motion.div
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
      <AnimatePresence>
        <HoverTasksPanel
          tasks={hoverTasks.tasks}
          isVisible={hoverTasks.visible}
          position={hoverTasks.position}
        />
      </AnimatePresence>

      {/* 日記查看 Modal */}
      <DailyJournalDialog
        isOpen={journalModal.isOpen}
        onClose={() => setJournalModal(prev => ({ ...prev, isOpen: false }))}
        mode="view"
        initialData={journalModal.journal || undefined}
      />
    </div>
  );
}; 