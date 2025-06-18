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

  const [showOverview, setShowOverview] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
  const { getActiveGoals, getCompletionRate, addTask } = useTopicStore();

  // 獲取主題當前進行中的目標（最多2個）
  const getInProgressGoals = (topicId: string) => {
    // MOCK DATA - 之後要移除
    const mockGoals = {
      // 一個進行中的目標
      single: {
        id: 'mock-g1',
        title: '完成微積分第三章作業',
        tasks: [
          { status: 'in_progress' },
          { status: 'todo' }
        ]
      },
      // 兩個進行中的目標
      double1: {
        id: 'mock-d1',
        title: '觀看向量空間概念影片',
        tasks: [
          { status: 'in_progress' },
          { status: 'todo' }
        ]
      },
      double2: {
        id: 'mock-d2',
        title: '完成線性轉換練習',
        tasks: [
          { status: 'todo' },
          { status: 'todo' }
        ]
      }
    };

    const goals = getActiveGoals(topicId);
    
    // 用 topicId 的字元來產生一個簡單的 hash
    const hash = topicId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // 每五個 hash 值就一個是空的
    if (hash % 5 === 0) {
      return [];
    }
    
    // 用 hash 決定要取幾個目標
    const shouldGetTwo = hash % 2 === 1;
    
    // 如果沒有真實目標，根據 hash 回傳假資料
    if (goals.length === 0) {
      if (shouldGetTwo) {
        return [mockGoals.double1, mockGoals.double2];
      } else {
        return [mockGoals.single];
      }
    }

    // 先找進行中的目標
    const inProgressGoals = goals.filter(goal => 
      goal.tasks.some(task => task.status === 'in_progress')
    );

    // 再找待開始的目標
    const todoGoals = goals.filter(goal => 
      !inProgressGoals.includes(goal) && 
      goal.tasks.some(task => task.status === 'todo')
    );

    // 組合目標
    const allGoals = [...inProgressGoals, ...todoGoals];
    
    // 如果沒有任何可用的目標，回傳空陣列
    if (allGoals.length === 0) {
      return [];
    }

    // 根據 shouldGetTwo 決定回傳一個還是兩個目標
    return shouldGetTwo ? allGoals.slice(0, 2) : allGoals.slice(0, 1);
  };

  // 處理目標切換 - 直接切換到另一個目標
  const handleGoalToggle = (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    setCurrentGoalIndexes(prev => ({
      ...prev,
      [topicId]: prev[topicId] === 1 ? 0 : 1 // 在 0 和 1 之間切換
    }));
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

  // 獲取當前進行中的目標和完成的目標
  const currentGoals = getInProgressGoals(topic.id);
  const goals = getActiveGoals(topic.id);
  const totalGoals = goals.length;
  const completedGoalsCount = goals.filter(g => g.tasks.every(t => t.status === 'done')).length;
  const progress = getCompletionRate(topic.id);

  // 當前顯示的目標索引
  const currentIndex = currentGoalIndexes[topic.id] || 0;
  const currentGoal = currentGoals[currentIndex];

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
          {!showHistory && !showDetails && (
            <>
              <button
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setShowOverview(true)}
                aria-label="目標概覽"
              >
                <LayoutTemplate className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setShowReview(true)}
                aria-label="學習回顧"
              >
                <Network className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={handleShowHistory}
                aria-label="歷史回顧"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setShowDetails(true)}
                aria-label="詳細資訊"
              >
                <Menu className="w-4 h-4" />
              </button>
            </>
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

      <div className="flex-1 overflow-auto relative z-10" ref={historyScrollRef}>
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
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" style={{ color: subjectStyle.accent }} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      當前進行
                    </span>
                  </div>
                </div>
                <div className="min-h-[76px] relative">
                  {currentGoals.length > 0 ? (
                    <>
                      <div 
                        className={`text-sm text-gray-700 dark:text-gray-300 p-3 rounded-lg transition-all duration-300 ${currentGoals.length > 1 ? 'cursor-pointer hover:shadow-md' : ''}`}
                        style={{ backgroundColor: `${subjectStyle.accent}08` }}
                        onClick={currentGoals.length > 1 ? (e) => handleGoalToggle(e, topic.id) : undefined}
                      >
                        <div className="font-medium mb-1 line-clamp-2">{currentGoal.title}</div>
                        <div className="text-xs text-gray-500">
                          {currentGoal.tasks.filter(t => t.status === 'in_progress').length > 0 
                            ? `${currentGoal.tasks.filter(t => t.status === 'in_progress').length} 個進行中`
                            : `${currentGoal.tasks.filter(t => t.status === 'todo').length} 個待開始`
                          }
                        </div>
                      </div>
                      {/* 步驟指示點 */}
                      {currentGoals.length > 1 && (
                        <div className="absolute -bottom-2 left-0 right-0 flex justify-center items-center gap-2 mt-2">
                          {currentGoals.map((_, index) => (
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
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => setShowDetails(true)}
                      className="w-full text-sm text-gray-500 p-3 rounded-lg transition-all duration-200 hover:shadow-md flex flex-col items-center gap-2"
                      style={{ backgroundColor: `${subjectStyle.accent}08` }}
                    >
                      <div className="font-medium">現在沒有進行中的步驟</div>
                      <div className="text-xs flex items-center gap-1.5">
                        一起挑選一個吧
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
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
                  <div className="space-y-2">
                    {currentGoal.tasks.map((task, index) => (
                      <div 
                        key={`${currentGoal.id}-${index}`}
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:shadow-sm transition-all"
                        style={{ backgroundColor: `${subjectStyle.accent}05` }}
                        onClick={() => handleTaskClick(`${currentGoal.id}-${index}`)}
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
                           任務 {index + 1}
                         </span>
                      </div>
                                          ))}
                      
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