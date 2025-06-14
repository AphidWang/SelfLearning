import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Goal } from '../../types/goal';
import { GoalDetails } from './GoalDetails';
import { Pencil, Check, History, ChevronLeft, Calendar, CheckCircle2, Clock, Upload, Play } from 'lucide-react';
import { subjects } from '../../styles/tokens';

interface WeeklyActivity {
  id: string;
  type: 'completed' | 'started' | 'uploaded' | 'in_progress';
  title: string;
  timestamp: string;
}

interface WeeklyProgress {
  weekNumber: number;
  startDate: string;
  endDate: string;
  activities: WeeklyActivity[];
}

interface GoalDetailsDialogProps {
  goal: Goal;
  onClose: () => void;
  onBack: () => void;
  onTaskClick: (taskId: string) => void;
  isCreating?: boolean;
}

export const GoalDetailsDialog: React.FC<GoalDetailsDialogProps> = ({
  goal,
  onClose,
  onBack,
  onTaskClick,
  isCreating = false
}) => {
  const [isEditing, setIsEditing] = useState(isCreating);
  const [showHistory, setShowHistory] = useState(false);
  const [visibleWeeks, setVisibleWeeks] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const subjectStyle = subjects.getSubjectStyle(goal.subject || '');

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
        weekNumber: weekOffset,
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
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
    <motion.div 
      className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 p-6 w-[380px] max-w-[90vw] flex flex-col h-[520px] relative overflow-hidden"
      style={{ 
        borderColor: subjectStyle.accent,
        boxShadow: `0 20px 40px ${subjectStyle.accent}25, 0 0 0 1px ${subjectStyle.accent}20`
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
        <div className="flex items-center gap-2">
          {showHistory && (
            <button
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => {
                setShowHistory(false);
                setVisibleWeeks(0);
                setIsAnimating(false);
              }}
              aria-label="返回"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 line-clamp-2 pr-6">
            {showHistory ? '歷史回顧' : goal.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!showHistory && (
            <>
              <button
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={handleShowHistory}
                aria-label="歷史回顧"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  isEditing ? 'text-green-500 hover:bg-green-50' : ''
                }`}
                onClick={() => setIsEditing(!isEditing)}
                aria-label={isEditing ? '完成編輯' : '編輯'}
              >
                {isEditing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
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
              className="h-full"
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
                      key={week.weekNumber}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.5,
                        ease: "easeOut",
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                      className={`relative flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                    >
                      {/* 樹葉卡片 */}
                      <div 
                        className={`w-40 p-3 rounded-2xl shadow-lg border-2 ${
                          index % 2 === 0 ? 'mr-6' : 'ml-6'
                        }`}
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
                            第 {week.weekNumber + 1} 週
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
                        className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-white dark:bg-gray-800 ring-2 transform -translate-x-1/2 -translate-y-1/2"
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
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <GoalDetails
                goal={goal}
                onBack={onBack}
                onTaskClick={onTaskClick}
                isCreating={false}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}; 
; 