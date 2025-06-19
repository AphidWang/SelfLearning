import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Topic } from '../../types/goal';
import { TopicDetails } from './TopicDetails';
import { Pencil, Check, History, ChevronLeft, Calendar, CheckCircle2, Clock, Upload, Play, Menu, ArrowUpRight, Plus, X, AlertCircle, Brain, Target, Sparkles, PartyPopper, List, LayoutTemplate, Network } from 'lucide-react';
import { subjects } from '../../styles/tokens';
import { useTopicStore } from '../../store/topicStore';
import { GoalOverviewDialog } from './TopicOverviewDialog';
import { TopicReviewPage } from './TopicReviewPage';

interface WeeklyActivity {
  id: string;
  type: 'completed' | 'started' | 'uploaded' | 'in_progress';
  title: string;
  timestamp: string;
}

interface WeeklyProgress {
  week: string;
  progress: number;
  activities: WeeklyActivity[];
}

interface TopicDetailsDialogProps {
  topic: Topic;
  onClose: () => void;
  onBack: () => void;
  onTaskClick: (taskId: string) => void;
  isCreating?: boolean;
}

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
}

export const TopicDetailsDialog: React.FC<TopicDetailsDialogProps> = ({
  topic,
  onClose,
  onBack,
  onTaskClick,
  isCreating = false
}) => {
  const [isEditing, setIsEditing] = useState(isCreating);
  const [showHistory, setShowHistory] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [visibleWeeks, setVisibleWeeks] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentGoalIndexes, setCurrentGoalIndexes] = useState<Record<string, number>>({});
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const [showOverview, setShowOverview] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
  const { getActiveGoals, getCompletionRate, addTask, getFocusedGoals } = useTopicStore();

  // 獲取主題當前專注的目標
  const getFocusedGoalsForTopic = (topicId: string) => {
    return getFocusedGoals(topicId);
  };

  // 處理目標切換 - 循環切換到下一個目標
  const handleGoalToggle = (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    const focusedGoalsCount = getFocusedGoalsForTopic(topicId).length;
    if (focusedGoalsCount <= 1) return;
    
    setCurrentGoalIndexes(prev => ({
      ...prev,
      [topicId]: ((prev[topicId] || 0) + 1) % focusedGoalsCount // 循環切換
    }));
    
    // 切換目標時重置滾動位置到頂部，並重置底部狀態
    if (dialogContentRef.current) {
      dialogContentRef.current.scrollTop = 0;
    }
    setHasReachedBottom(false);
  };

  // 處理新增任務
  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !currentGoal) return;
    addTask(topic.id, currentGoal.id, {
      id: '',
      title: newTaskTitle,
      status: 'todo'
    });
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  // 處理任務點擊
  const handleTaskClick = (taskId: string) => {
    onTaskClick(taskId);
  };

  // 檢測對話框內容是否可滾動
  const checkScrollability = () => {
    if (dialogContentRef.current) {
      const element = dialogContentRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      const hasScrollableContent = scrollHeight > clientHeight;
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= 20;
      
      // 只有在有可滾動內容、不在底部附近、且未曾到達過底部時才顯示指示器
      setShowScrollIndicator(hasScrollableContent && !isNearBottom && !hasReachedBottom);
    }
  };

  // 獲取當前專注的目標和完成的目標
  const focusedGoals = getFocusedGoalsForTopic(topic.id);
  const goals = getActiveGoals(topic.id);
  const totalGoals = goals.length;
  const completedGoalsCount = goals.filter(g => g.tasks.every(t => t.status === 'done')).length;
  const progress = getCompletionRate(topic.id);

  // 當前顯示的目標索引
  const currentIndex = focusedGoals.length > 0 ? Math.min(currentGoalIndexes[topic.id] || 0, focusedGoals.length - 1) : 0;
  const currentGoal = focusedGoals[currentIndex];

  // 監聽內容變化和組件掛載
  useEffect(() => {
    // 延遲檢查，確保 DOM 已經更新
    const timer = setTimeout(() => {
      checkScrollability();
    }, 100);
    
    // 監聽窗口大小變化
    const handleResize = () => {
      setTimeout(checkScrollability, 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentGoal?.tasks, showAddTask, focusedGoals.length, currentIndex]);

  // 當視圖模式改變時也檢查
  useEffect(() => {
    if (!showHistory && !showDetails) {
      const timer = setTimeout(() => {
        checkScrollability();
      }, 300); // 等待動畫完成
      return () => clearTimeout(timer);
    } else {
      setShowScrollIndicator(false); // 其他視圖不顯示滾動指示器
      setHasReachedBottom(false); // 重置底部狀態
    }
  }, [showHistory, showDetails]);

  // 當用戶滾動時檢查是否接近底部
  const handleDialogScroll = () => {
    if (dialogContentRef.current) {
      const element = dialogContentRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      // 當滾動到底部 20px 範圍內時記錄已到達底部並隱藏指示器
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= 20;
      
      if (isNearBottom) {
        setHasReachedBottom(true);
        setShowScrollIndicator(false);
      }
    }
  };

  // Mock 週進度數據
  const generateWeeklyProgress = (): WeeklyProgress[] => {
    const now = new Date();
    const mockWeeks: WeeklyProgress[] = [];
    
    // 生成過去 4 週的 mock 數據
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (weekOffset * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const activities: WeeklyActivity[] = [];
      
      // 根據週次生成不同的活動
      switch (weekOffset) {
        case 0: // 本週
          activities.push(
            {
              id: 'act-1',
              type: 'started',
              title: '開始學習基礎概念',
              timestamp: new Date(weekStart.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'act-2',
              type: 'uploaded',
              title: '上傳了學習筆記截圖',
              timestamp: new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'act-3',
              type: 'in_progress',
              title: '正在練習應用題',
              timestamp: new Date(weekStart.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
            }
          );
          break;
          
        case 1: // 上週
          activities.push(
            {
              id: 'act-4',
              type: 'completed',
              title: '完成第一章練習',
              timestamp: new Date(weekStart.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'act-5',
              type: 'uploaded',
              title: '上傳作業照片',
              timestamp: new Date(weekStart.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'act-6',
              type: 'started',
              title: '開始第二章學習',
              timestamp: new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'act-7',
              type: 'completed',
              title: '完成課堂測驗',
              timestamp: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
            }
          );
          break;
          
        case 2: // 兩週前
          activities.push(
            {
              id: 'act-8',
              type: 'started',
              title: '開始新的學習目標',
              timestamp: new Date(weekStart.getTime() + 0 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'act-9',
              type: 'uploaded',
              title: '分享學習心得',
              timestamp: new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'act-10',
              type: 'completed',
              title: '完成基礎知識學習',
              timestamp: new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString()
            }
          );
          break;
          
        case 3: // 三週前
          activities.push(
            {
              id: 'act-11',
              type: 'started',
              title: '制定學習計劃',
              timestamp: new Date(weekStart.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'act-12',
              type: 'uploaded',
              title: '上傳學習資料',
              timestamp: new Date(weekStart.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
            }
          );
          break;
      }
      
      mockWeeks.push({
        week: weekStart.toISOString(),
        progress: 0.75, // 假設進度為75%
        activities
      });
    }
    
    return mockWeeks;
  };

  const weeklyProgress = generateWeeklyProgress();

  // 處理歷史視圖的逐步顯示
  useEffect(() => {
    if (showHistory && !isAnimating) {
      setIsAnimating(true);
      setVisibleWeeks(0);
      
      const showNextWeek = (index: number) => {
        if (index < weeklyProgress.length) {
          setTimeout(() => {
            setVisibleWeeks(index + 1);
            
            // 自動滾動到底部
            if (historyScrollRef.current) {
              const container = historyScrollRef.current;
              setTimeout(() => {
                container.scrollTo({
                  top: container.scrollHeight,
                  behavior: 'smooth'
                });
              }, 100); // 稍微延遲確保 DOM 更新完成
            }
            
            showNextWeek(index + 1);
          }, 400); // 每400ms顯示一個週進度
        } else {
          setIsAnimating(false);
        }
      };
      
      showNextWeek(0);
    }
  }, [showHistory, weeklyProgress.length]);

  // 重置歷史視圖狀態
  const handleShowHistory = () => {
    setShowHistory(true);
    setVisibleWeeks(0);
    setIsAnimating(false);
  };

  return (
    <>
      <motion.div 
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 p-6 flex flex-col h-[520px] relative overflow-hidden transition-all duration-300"
        style={{ 
          borderColor: subjectStyle.accent,
          boxShadow: `0 20px 40px ${subjectStyle.accent}25, 0 0 0 1px ${subjectStyle.accent}20`,
          width: '380px'
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
      {/* 背景裝飾 */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${subjectStyle.accent}40 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${subjectStyle.accent}30 0%, transparent 50%)`,
          pointerEvents: 'none'
        }}
      />

      <div className="flex justify-between items-center mb-4 select-none relative z-10" data-draggable-header>
        <div className="flex items-center gap-2 relative flex-1">
          {(showHistory || showDetails) && (
            <button
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-1"
              onClick={() => {
                setShowHistory(false);
                setShowDetails(false);
                setVisibleWeeks(0);
                setIsAnimating(false);
              }}
              aria-label="返回"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 line-clamp-2">
            {showHistory ? '歷史回顧' : showDetails ? topic.title : topic.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Review Page 按鈕 */}
          {!showHistory && !showDetails && (
            <button
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => setShowReview(true)}
              aria-label="詳細回顧"
            >
              <LayoutTemplate className="w-4 h-4" />
            </button>
          )}
          {showDetails && (
            <>
              <button
                className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  isEditing ? 'text-green-500 hover:bg-green-50' : ''
                }`}
                onClick={() => setIsEditing(!isEditing)}
                aria-label={isEditing ? '完成編輯' : '編輯'}
              >
                {isEditing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </button>
              <button
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => {
                  setShowDetails(false);
                  setIsEditing(false);
                }}
                aria-label="返回主頁"
              >
                <Menu className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onClose}
            aria-label="關閉"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-auto relative z-10" 
        ref={showHistory ? historyScrollRef : dialogContentRef}
        onScroll={showHistory ? undefined : handleDialogScroll}
      >
        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full p-2"
            >
              {/* 樹葉狀時間軸 */}
              <div className="relative">
                {/* 中央時間線 */}
                <div 
                  className="absolute left-1/2 top-0 w-0.5 bg-gradient-to-b from-green-400 to-green-600 transform -translate-x-1/2 transition-all duration-500 ease-out"
                  style={{ 
                    height: visibleWeeks > 0 ? `${Math.min(visibleWeeks * 120, weeklyProgress.length * 120) + 120}px` : '0px',
                  }}
                />
                
                {/* 時間軸尾端標記 - 表示學習還在進行中 */}
                {visibleWeeks === weeklyProgress.length && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="absolute inset-x-0 flex flex-col items-center"
                    style={{ 
                      top: `${Math.min(visibleWeeks * 120, weeklyProgress.length * 120) + 120}px`
                    }}
                  >
                    {/* 僅圓點：絕對置中 */}
                    <div 
                      className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center ring-2"
                      style={{ ['--tw-ring-color' as string]: subjectStyle.accent }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: subjectStyle.accent }}
                      />
                    </div>
                  </motion.div>
                )}
                
                <div className="space-y-6 pb-32">
                  {weeklyProgress.length > 0 ? weeklyProgress.slice(0, visibleWeeks).map((week, index) => (
                    <motion.div
                      key={week.week}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.5,
                        ease: "easeOut",
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                      className={`relative flex ${index % 2 === 0 ? 'justify-end pr-[52%]' : 'justify-start pl-[52%]'}`}
                    >
                      {/* 樹葉卡片 */}
                      <div 
                        className="w-40 p-3 rounded-2xl shadow-lg border-2"
                        style={{
                          backgroundColor: `${subjectStyle.accent}10`,
                          borderColor: `${subjectStyle.accent}30`,
                          borderRadius: index % 2 === 0 ? '20px 20px 20px 5px' : '20px 20px 5px 20px'
                        }}
                      >
                        {/* 週期標題 */}
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-3 h-3" style={{ color: subjectStyle.accent }} />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            第 {index + 1} 週
                          </span>
                        </div>
                        
                        {/* 活動列表 */}
                        {week.activities.length > 0 && (
                          <div className="space-y-1">
                            {week.activities.slice(0, 4).map(activity => (
                              <div key={activity.id} className="flex items-center gap-1.5">
                                {activity.type === 'completed' && (
                                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                )}
                                {activity.type === 'started' && (
                                  <Play className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                )}
                                {activity.type === 'uploaded' && (
                                  <Upload className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                )}
                                {activity.type === 'in_progress' && (
                                  <Clock className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                )}
                                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                  {activity.title}
                                </span>
                              </div>
                            ))}
                            {week.activities.length > 4 && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
                                +{week.activities.length - 4} 更多
                              </div>
                            )}
                          </div>
                        )}
                        
                        {week.activities.length === 0 && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-1">
                            無活動記錄
                          </div>
                        )}
                      </div>
                      
                      {/* 連接點 */}
                      <div 
                        className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-white dark:bg-gray-800 ring-2 transform -translate-x-1/2 -translate-y-1/2 z-10"
                        style={{ ['--tw-ring-color' as string]: subjectStyle.accent }}
                      />
                    </motion.div>
                  )) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 dark:text-gray-500 text-sm">
                        尚無歷史記錄
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : showDetails ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <TopicDetails
                topic={topic}
                onBack={onBack}
                onTaskClick={onTaskClick}
                isCreating={false}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full p-2"
            >
              {/* 目標資訊 */}
              <div 
                className="mb-10 rounded-lg p-3 border-2 shadow-md" 
                style={{ 
                  borderColor: subjectStyle.accent,
                  background: `linear-gradient(to right, ${subjectStyle.accent}10, ${subjectStyle.accent}10)`,
                  boxShadow: `0 4px 12px ${subjectStyle.accent}15`
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
                      topic.templateType === '學習目標' ? 'bg-purple-100 text-purple-800' :
                      topic.templateType === '個人成長' ? 'bg-blue-100 text-blue-800' :
                      topic.templateType === '專案計畫' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {topic.templateType === '學習目標' ? <Brain className="h-3 w-3" /> :
                       topic.templateType === '個人成長' ? <Target className="h-3 w-3" /> :
                       topic.templateType === '專案計畫' ? <Sparkles className="h-3 w-3" /> :
                       <PartyPopper className="h-3 w-3" />}
                      {topic.templateType}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      subjects.getSubjectStyle(topic.subject || '').bg
                    } ${subjects.getSubjectStyle(topic.subject || '').text}`}>
                      {topic.subject || '未分類'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    aria-label="步驟總覽"
                  >
                    <List size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{topic.description}</p>
              </div>

              {/* 當前進行 */}
              <div className="group mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" style={{ color: subjectStyle.accent }} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      當前進行
                    </span>
                  </div>
                </div>
                <div className="min-h-[76px] relative">
                  {focusedGoals.length > 0 ? (
                    <>
                      <div 
                        className={`text-sm text-gray-700 dark:text-gray-300 p-3 rounded-lg transition-all duration-300 ${focusedGoals.length > 1 ? 'cursor-pointer hover:shadow-md' : ''} flex items-start justify-between gap-3`}
                        style={{ backgroundColor: `${subjectStyle.accent}15` }}
                        onClick={focusedGoals.length > 1 ? (e) => handleGoalToggle(e, topic.id) : undefined}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium mb-1 line-clamp-2">{currentGoal?.title}</div>
                          <div className="text-xs text-gray-500">
                            {currentGoal?.tasks.filter(t => t.status === 'in_progress').length > 0 
                              ? `${currentGoal?.tasks.filter(t => t.status === 'in_progress').length} 個進行中`
                              : `${currentGoal?.tasks.filter(t => t.status === 'todo').length || 0} 個待開始`
                            }
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReview(true);
                          }}
                          className="p-1.5 rounded-lg transition-all duration-200 flex-shrink-0 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 shadow-sm hover:shadow-md opacity-0 group-hover:opacity-100"
                          aria-label="展開詳細回顧"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                      {/* 步驟指示點 */}
                      {focusedGoals.length > 1 && (
                        <div className="absolute -bottom-2 left-0 right-0 flex justify-center items-center gap-2 mt-2">
                          {focusedGoals.map((_, index) => (
                            <button
                              key={index}
                              className="w-1.5 h-1.5 rounded-full transition-all cursor-pointer hover:scale-125"
                              style={{ 
                                backgroundColor: index === currentIndex ? subjectStyle.accent : `${subjectStyle.accent}40`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentGoalIndexes(prev => ({
                                  ...prev,
                                  [topic.id]: index
                                }));
                                // 切換目標時重置滾動位置到頂部，並重置底部狀態
                                if (dialogContentRef.current) {
                                  dialogContentRef.current.scrollTop = 0;
                                }
                                setHasReachedBottom(false);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      className="w-full text-sm text-gray-500 p-3 rounded-lg transition-all duration-200 hover:shadow-md flex items-center justify-between gap-3"
                      style={{ backgroundColor: `${subjectStyle.accent}15` }}
                    >
                      <div className="flex flex-col">
                        <div className="font-medium">現在沒有進行中的步驟</div>
                        <div className="text-xs">一起挑選一個吧</div>
                      </div>
                      <button
                        onClick={() => setShowDetails(true)}
                        className="p-1.5 rounded-lg transition-all duration-200 flex-shrink-0 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 shadow-sm hover:shadow-md opacity-0 group-hover:opacity-100"
                        aria-label="挑選步驟"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

                                           {/* 當前步驟的所有任務 */}
              {currentGoal && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" style={{ color: subjectStyle.accent }} />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        任務清單
                      </span>
                    </div>
                    <button
                      onClick={() => setShowAddTask(true)}
                      className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      aria-label="新增任務"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* 任務列表 */}
                  <div className="space-y-2">
                    {currentGoal?.tasks.map((task, index) => (
                        <div 
                          key={`${currentGoal?.id}-${index}`}
                          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:shadow-sm transition-all"
                          style={{ backgroundColor: `${subjectStyle.accent}05` }}
                          onClick={() => handleTaskClick(`${currentGoal?.id}-${index}`)}
                        >
                          <div 
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              task.status === 'done' 
                                ? 'bg-green-500 border-green-500' 
                                : task.status === 'in_progress'
                                ? 'border-orange-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {task.status === 'done' && (
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            )}
                            {task.status === 'in_progress' && (
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                            )}
                          </div>
                           <span className={`text-sm flex-1 ${
                             task.status === 'done' 
                               ? 'text-gray-500 line-through' 
                               : 'text-gray-700 dark:text-gray-300'
                           }`}>
                             {task.title || `任務 ${index + 1}`}
                           </span>
                        </div>
                      )) || []}
                      
                      {/* 新增任務輸入框 */}
                      {showAddTask && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="輸入任務名稱..."
                            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddTask();
                              } else if (e.key === 'Escape') {
                                setShowAddTask(false);
                                setNewTaskTitle('');
                              }
                            }}
                          />
                          <button
                            onClick={handleAddTask}
                            className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            新增
                          </button>
                          <button
                            onClick={() => {
                              setShowAddTask(false);
                              setNewTaskTitle('');
                            }}
                            className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      )}
                    </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* 整個對話框的滾動指示器 */}
      {!showHistory && !showDetails && showScrollIndicator && (
        <div className="absolute bottom-0 right-0 h-8 w-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none flex items-end justify-center pb-1 z-20">
          <div 
            className="flex items-center gap-1 text-xs text-gray-400 animate-bounce"
            style={{ color: subjectStyle.accent }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>還有更多</span>
          </div>
        </div>
      )}
    </motion.div>

    {/* TopicReviewPage - 只在 showReview 為 true 時顯示 */}
    <AnimatePresence>
      {showReview && (
        <TopicReviewPage
          topicId={topic.id}
          onClose={() => setShowReview(false)}
          onTaskClick={onTaskClick}
          onGoalClick={(goalId) => console.log('Goal clicked:', goalId)}
        />
      )}
    </AnimatePresence>

    {/* GoalOverviewDialog */}
    <AnimatePresence>
      {showOverview && (
        <GoalOverviewDialog
          topicId={topic.id}
          onClose={() => setShowOverview(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
};

// 兼容性導出
export const GoalDetailsDialog = TopicDetailsDialog;
export type { TopicDetailsDialogProps, TopicDetailsDialogProps as GoalDetailsDialogProps }; 