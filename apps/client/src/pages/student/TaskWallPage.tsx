/**
 * TaskWallPage - 學生任務牆頁面
 * 
 * 🎯 功能說明：
 * - 呈現溫暖色調的任務卡牆，類似手作筆記本風格
 * - 顯示待完成任務和進行中任務，以及需要建立任務的目標
 * - 支援卡片翻轉互動和完成動畫
 * - 已完成的任務以星星計數器顯示，帶有動畫效果
 * 
 * 🏗️ 架構設計：
 * - 使用 topicStore 獲取最新的主題/目標/任務資料 [[memory:1599136828095381917]]
 * - 分層組件設計：TaskWallPage -> TaskWallGrid -> TaskCard/GoalCard
 * - 響應式佈局：手機2欄，平板3欄，桌面可調整
 * - 優先權排序：進行中任務優先，高優先權任務優先顯示
 * - 顯示所有符合條件的卡片（無數量限制）
 * 
 * 🎨 視覺設計：
 * - 溫暖色調：米色、奶油色、淡橙色背景
 * - 手作感：輕微紙質紋理、柔軟陰影
 * - 親切字體：手寫風格設計
 * - 卡片造型：便條紙風格，圓角無粗邊框
 * - 星星計數器：完成任務時的動畫反饋
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useTopicStore } from '../../store/topicStore';
import { useUserStore } from '../../store/userStore';
import { useUser } from '../../context/UserContext';
import { subjects } from '../../styles/tokens';
import { ArrowLeft, Settings, Filter, Star, BookMarked, X, RotateCcw } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { TaskWallGrid } from './components/TaskWallGrid';
import { DailyJournalDialog } from './components/DailyJournalDialog';
import { TaskRecordDialog } from './components/TaskRecordDialog';
import type { Topic, Goal, Task, TaskStatus } from '../../types/goal';

/**
 * 任務牆配置介面
 */
interface TaskWallConfig {
  maxVisibleCards: number; // 已停用 - 現在顯示所有卡片
  gridColumns: 'auto' | 2 | 3; // 網格欄數
  priorityFilter: 'all' | 'high' | 'medium' | 'low'; // 優先權過濾
  showCompletedStack: boolean;
}

/**
 * 擴展的任務介面，包含主題和目標資訊
 */
interface TaskWithContext extends Task {
  topicId: string;
  topicTitle: string;
  topicSubject: string;
  goalId: string;
  goalTitle: string;
  subjectStyle: any;
}

/**
 * 擴展的目標介面，包含主題資訊
 */
interface GoalWithContext extends Goal {
  topicId: string;
  topicTitle: string;
  topicSubject: string;
  subjectStyle: any;
}

/**
 * 星星計數器組件 - 彩色星星設計
 */
interface StarCounterProps {
  count: number;
  isAnimating?: boolean;
  onClick?: () => void;
}

const StarCounter: React.FC<StarCounterProps> = ({ count, isAnimating = false, onClick }) => {
  // 十種彩色星星顏色
  const starColors = [
    '#FF6B6B', // 紅
    '#4ECDC4', // 青
    '#45B7D1', // 藍
    '#96CEB4', // 綠
    '#FECA57', // 黃
    '#FF9FF3', // 粉
    '#A8E6CF', // 淺綠
    '#FFB74D', // 橙
    '#CE93D8', // 紫
    '#81C784'  // 深綠
  ];

  // 計算彩虹星星數量 (每10個一顆)
  const rainbowStars = Math.floor(count / 10);
  // 計算剩餘彩色星星數量
  const coloredStars = count % 10;

  const renderStars = () => {
    const stars: JSX.Element[] = [];
    
    // 彩虹/金色星星 (大)
    for (let i = 0; i < rainbowStars; i++) {
      stars.push(
        <motion.div
          key={`rainbow-${i}`}
          animate={isAnimating ? { 
            rotate: [0, 360],
            scale: [1, 1.5, 1]
          } : {}}
          transition={{ duration: 0.8, ease: "easeInOut", delay: i * 0.1 }}
        >
          <Star 
            className="w-7 h-7 fill-yellow-400 text-yellow-400 drop-shadow-lg" 
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))'
            }}
          />
        </motion.div>
      );
    }
    
    // 彩色星星 (小) - 上五下四排列
    const topRowCount = Math.min(5, coloredStars);
    const bottomRowCount = coloredStars - topRowCount;
    
    return (
      <div className="flex flex-col gap-1">
        {/* 彩虹星星區域 */}
        {rainbowStars > 0 && (
          <div className="flex gap-1 mb-1">
            {stars}
          </div>
        )}
        
        {/* 上排彩色星星 */}
        {topRowCount > 0 && (
          <div className="flex gap-1 justify-center">
            {Array.from({ length: topRowCount }).map((_, i) => (
              <motion.div
                key={`colored-top-${i}`}
                animate={isAnimating ? { 
                  rotate: [0, 360],
                  scale: [1, 1.3, 1]
                } : {}}
                transition={{ duration: 0.6, ease: "easeInOut", delay: (rainbowStars * 0.1) + (i * 0.1) }}
              >
                <Star 
                  className="w-5 h-5 drop-shadow-sm" 
                  style={{
                    color: starColors[i],
                    fill: starColors[i],
                    filter: `drop-shadow(0 0 4px ${starColors[i]}80)`
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
        
        {/* 下排彩色星星 */}
        {bottomRowCount > 0 && (
          <div className="flex gap-1 justify-center">
            {Array.from({ length: bottomRowCount }).map((_, i) => (
              <motion.div
                key={`colored-bottom-${i}`}
                animate={isAnimating ? { 
                  rotate: [0, 360],
                  scale: [1, 1.3, 1]
                } : {}}
                transition={{ duration: 0.6, ease: "easeInOut", delay: (rainbowStars * 0.1) + ((i + topRowCount) * 0.1) }}
              >
                <Star 
                  className="w-5 h-5 drop-shadow-sm" 
                  style={{
                    color: starColors[i + topRowCount],
                    fill: starColors[i + topRowCount],
                    filter: `drop-shadow(0 0 4px ${starColors[i + topRowCount]}80)`
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.button 
      className="flex items-center gap-2 p-3 rounded-xl hover:bg-amber-50 transition-all duration-300 cursor-pointer group"
      animate={isAnimating ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={onClick}
      title="點擊查看完成收藏"
    >
      <div className="flex items-center">
        {renderStars()}
      </div>
      <motion.span 
        className="text-xl font-bold text-amber-700 ml-2"
        key={count} // 重新渲染動畫
        initial={isAnimating ? { scale: 2, color: "#F59E0B" } : false}
        animate={{ scale: 1, color: "#B45309" }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
      >
        {count}
      </motion.span>
      <motion.div
        className="text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"
        animate={isAnimating ? { rotate: [0, 10, -10, 0] } : {}}
      >
        ✨
      </motion.div>
    </motion.button>
  );
};

/**
 * 完成任務 Dialog 組件
 */
interface CompletedTasksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  completedTasks: TaskWithContext[];
  onRestoreTask: (taskId: string, goalId: string, topicId: string) => Promise<void>;
  onClearStack: () => void;
}

const CompletedTasksDialog: React.FC<CompletedTasksDialogProps> = ({
  isOpen,
  onClose,
  completedTasks,
  onRestoreTask,
  onClearStack
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl border border-amber-200 p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 標題區域 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">🎉 完成收藏</h3>
                <p className="text-sm text-gray-600">
                  恭喜你完成了 {completedTasks.length} 個任務！
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 任務列表 */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {completedTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">🌟</div>
                <p className="text-gray-500">還沒有完成的任務</p>
                <p className="text-sm text-gray-400">完成任務後會出現在這裡</p>
              </div>
            ) : (
              completedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 hover:shadow-md transition-all"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: task.subjectStyle.accent + '20',
                            color: task.subjectStyle.accent
                          }}
                        >
                          {task.topicTitle}
                        </div>
                        <Star className="w-4 h-4 text-amber-500" />
                      </div>
                      
                      <h4 className="text-lg font-bold text-gray-800 mb-1">
                        {task.title}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        目標：{task.goalTitle}
                      </p>
                      
                      {task.completedAt && (
                        <p className="text-xs text-gray-500">
                          完成於 {new Date(task.completedAt).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => onRestoreTask(task.id, task.goalId, task.topicId)}
                      className="ml-4 p-3 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors flex-shrink-0 group"
                      title="恢復到進行中"
                    >
                      <RotateCcw className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * 溫馨提示 Dialog 組件
 */
interface CutePromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const CutePromptDialog: React.FC<CutePromptDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl border-2 border-amber-200 p-8 w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          {/* 可愛表情 */}
          <motion.div
            className="text-6xl mb-4"
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 0.8, repeat: Infinity, repeatDelay: 2 },
              scale: { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
            }}
          >
            🤗
          </motion.div>

          {/* 標題 */}
          <h3 className="text-2xl font-bold text-amber-800 mb-3">
            {title}
          </h3>

          {/* 訊息 */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message}
          </p>

          {/* 按鈕區域 */}
          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              等等再說
            </motion.button>
            <motion.button
              onClick={onConfirm}
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl font-medium hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              好的！記錄一下 ✨
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const TaskWallPage: React.FC = () => {
  // Store hooks
  const { 
    fetchTopics, 
    topics, 
    addTask,
    markTaskCompleted,
    markTaskInProgress,
    markTaskTodo,
    clearError,
    loading, 
    error
  } = useTopicStore();
  
  const { users, getUsers } = useUserStore();
  const { currentUser } = useUser();

  // 組件狀態
  const [config, setConfig] = useState<TaskWallConfig>({
    maxVisibleCards: 12,
    gridColumns: 'auto',
    priorityFilter: 'all',
    showCompletedStack: true
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [selectedTaskForRecord, setSelectedTaskForRecord] = useState<TaskWithContext | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskWithContext[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isStarAnimating, setIsStarAnimating] = useState(false);

  // 初始化資料載入
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchTopics(),
          getUsers()
        ]);
      } catch (error) {
        console.error('初始化資料失敗:', error);
      }
    };

    initializeData();
  }, [fetchTopics, getUsers]);

  // 自動清除錯誤消息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // 5秒後自動清除錯誤

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // 從資料庫載入已完成任務到完成收藏
  useEffect(() => {
    if (!topics) return;

    const completedTasksFromDB: TaskWithContext[] = [];
    
    topics.forEach(topic => {
      if (topic.status === 'archived') return;
      
      const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
      
      topic.goals?.forEach(goal => {
        if (goal.status === 'archived') return;
        
        goal.tasks?.forEach(task => {
          // 載入已完成的任務
          if (task.status === 'done') {
            completedTasksFromDB.push({
              ...task,
              topicId: topic.id,
              topicTitle: topic.title,
              topicSubject: topic.subject || '未分類',
              goalId: goal.id,
              goalTitle: goal.title,
              subjectStyle
            });
          }
        });
      });
    });

    // 按完成時間排序（最新的在前）
    completedTasksFromDB.sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });

    // 最多保留最近的 10 個已完成任務
    const recentCompletedTasks = completedTasksFromDB.slice(0, 10);
    setCompletedTasks(recentCompletedTasks);
    setCompletedCount(completedTasksFromDB.length);
  }, [topics]);

  /**
   * 處理任務狀態更新
   * 使用 Result pattern 進行錯誤處理
   */
  const handleTaskStatusUpdate = useCallback(async (
    taskId: string, 
    goalId: string, 
    topicId: string, 
    newStatus: TaskStatus
  ) => {
    try {
      let result;
      
      // 使用專門的狀態切換函數
      switch (newStatus) {
        case 'done':
          result = await markTaskCompleted(topicId, goalId, taskId, true); // 要求學習記錄
          
          if (!result.success) {
            if (result.requiresRecord) {
              // 需要學習記錄，顯示溫馨提示
              const task = topics
                .find(t => t.id === topicId)
                ?.goals?.find(g => g.id === goalId)
                ?.tasks?.find(t => t.id === taskId);
              
              if (task) {
                setSelectedTaskForRecord({
                  ...task,
                  topicId,
                  topicTitle: topics.find(t => t.id === topicId)?.title || '',
                  topicSubject: topics.find(t => t.id === topicId)?.subject || '未分類',
                  goalId,
                  goalTitle: topics.find(t => t.id === topicId)?.goals?.find(g => g.id === goalId)?.title || '',
                  subjectStyle: subjects.getSubjectStyle(topics.find(t => t.id === topicId)?.subject || '')
                });
                setShowPromptDialog(true);
              }
            } else {
              // 其他錯誤，顯示 toast
              toast.error(result.message);
            }
            return;
          }
          
          // 任務成功完成，觸發星星動畫
          setIsStarAnimating(true);
          setTimeout(() => setIsStarAnimating(false), 1000);
          break;
          
        case 'in_progress':
          result = await markTaskInProgress(topicId, goalId, taskId);
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          break;
          
        case 'todo':
          result = await markTaskTodo(topicId, goalId, taskId);
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          break;
          
        default:
          console.warn('未知的任務狀態:', newStatus);
          return;
      }

    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      toast.error('系統錯誤，請稍後再試');
    }
  }, [markTaskCompleted, markTaskInProgress, markTaskTodo, topics]);

  /**
   * 處理新增任務到目標
   */
  const handleAddTaskToGoal = useCallback(async (
    goalId: string, 
    topicId: string, 
    taskTitle: string
  ) => {
    try {
      await addTask(topicId, goalId, {
        title: taskTitle,
        status: 'todo',
        description: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('新增任務失敗:', error);
    }
  }, [addTask]);

  /**
   * 處理任務恢復到進行中
   */
  const handleRestoreTask = useCallback(async (
    taskId: string, 
    goalId: string, 
    topicId: string
  ) => {
    try {
      // 使用專門的狀態切換函數
      await markTaskInProgress(topicId, goalId, taskId);
    } catch (error) {
      console.error('恢復任務失敗:', error);
    }
  }, [markTaskInProgress]);

  /**
   * 處理切換完成堆疊顯示
   */
  const handleToggleCompletedStack = useCallback(() => {
    setShowCompletedDialog(true);
  }, []);

  /**
   * 處理打開記錄對話框
   */
  const handleOpenRecord = useCallback((task: TaskWithContext) => {
    setSelectedTaskForRecord(task);
    setShowRecordDialog(true);
  }, []);

  /**
   * 處理記錄保存
   */
  const handleSaveRecord = useCallback(async (record: any) => {
    if (!selectedTaskForRecord) return;

    try {
      // TODO: 實際保存到後端
      console.log('保存學習記錄:', record);
      
      // 暫時存到 localStorage
      const existingRecords = JSON.parse(localStorage.getItem('taskRecords') || '{}');
      existingRecords[selectedTaskForRecord.id] = {
        ...record,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('taskRecords', JSON.stringify(existingRecords));
    } catch (error) {
      console.error('保存記錄失敗:', error);
      throw error;
    }
  }, [selectedTaskForRecord]);

  /**
   * 從所有主題中提取活躍的任務
   * 過濾條件：未完成、未歸檔的任務
   */
  const activeTasks = useMemo((): TaskWithContext[] => {
    if (!topics) return [];

    const tasks: TaskWithContext[] = [];
    
    topics.forEach(topic => {
      // 只處理活躍的主題
      if (topic.status === 'archived') return;
      
      const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
      
      topic.goals?.forEach(goal => {
        // 只處理活躍的目標
        if (goal.status === 'archived') return;
        
        goal.tasks?.forEach(task => {
          // 只顯示待完成和進行中的任務
          if (task.status === 'todo' || task.status === 'in_progress') {
            tasks.push({
              ...task,
              topicId: topic.id,
              topicTitle: topic.title,
              topicSubject: topic.subject || '未分類',
              goalId: goal.id,
              goalTitle: goal.title,
              subjectStyle
            });
          }
        });
      });
    });

    // 按狀態、優先權和更新時間排序
    return tasks.sort((a, b) => {
      // 首先按狀態排序：進行中 > 待開始
      const statusOrder = { in_progress: 2, todo: 1 };
      const aStatus = statusOrder[a.status] || 1;
      const bStatus = statusOrder[b.status] || 1;
      
      if (aStatus !== bStatus) {
        return bStatus - aStatus; // 進行中在前
      }
      
      // 相同狀態則按優先權排序
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // 高優先權在前
      }
      
      // 相同優先權則按建立時間排序（假設 id 包含時間資訊）
      return b.id.localeCompare(a.id);
    });
  }, [topics]);

  /**
   * 從所有主題中提取需要建立任務的目標
   * 過濾條件：沒有任務或所有任務都已完成的活躍目標
   */
  const goalsNeedingTasks = useMemo((): GoalWithContext[] => {
    if (!topics) return [];

    const goals: GoalWithContext[] = [];
    
    topics.forEach(topic => {
      if (topic.status === 'archived') return;
      
      const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
      
      topic.goals?.forEach(goal => {
        if (goal.status === 'archived') return;
        
        // 檢查目標是否需要更多任務
        const activeTasks = goal.tasks?.filter(t => t.status !== 'archived') || [];
        const incompleteTasks = activeTasks.filter(t => t.status !== 'done');
        
        // 如果沒有未完成的任務，這個目標需要新任務
        if (incompleteTasks.length === 0) {
          goals.push({
            ...goal,
            topicId: topic.id,
            topicTitle: topic.title,
            topicSubject: topic.subject || '未分類',
            subjectStyle
          });
        }
      });
    });

    return goals;
  }, [topics]);

  /**
   * 根據配置過濾任務
   */
  const filteredTasks = useMemo(() => {
    let filtered = activeTasks;
    
    // 優先權過濾
    if (config.priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === config.priorityFilter);
    }
    
    // 顯示所有符合條件的任務（移除數量限制）
    return filtered;
  }, [activeTasks, config]);

  /**
   * 合併任務和目標卡片，用於統一顯示
   */
  const allCards = useMemo(() => {
    const taskCards = filteredTasks.map(task => ({ type: 'task' as const, data: task }));
    const goalCards = goalsNeedingTasks.map(goal => ({ type: 'goal' as const, data: goal }));
    
    return [...taskCards, ...goalCards];
  }, [filteredTasks, goalsNeedingTasks]);

  // 載入狀態
  if (loading) {
    return (
      <PageLayout title="任務牆">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </PageLayout>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <PageLayout title="任務牆">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">載入失敗：{error}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="任務牆">
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
      
      {/* 手作筆記本風格背景 */}
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
        {/* 標題區域 */}
        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-sm border-b border-amber-200/50 mb-6">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 rounded-full bg-white/80 text-amber-700 hover:bg-white transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-4 mb-1">
                    <h1 className="text-3xl font-bold text-amber-900 font-hand">
                      📝 我的任務牆
                    </h1>
                    <StarCounter 
                      count={completedCount} 
                      isAnimating={isStarAnimating}
                      onClick={handleToggleCompletedStack}
                    />
                  </div>
                  <p className="text-amber-700">
                    {allCards.length} 張卡片 • 
                    {activeTasks.filter(task => task.status === 'in_progress').length} 個進行中
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowJournalDialog(true)}
                  className="p-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500 transition-all shadow-md hover:shadow-lg"
                  title="寫今日學習日記"
                >
                  <BookMarked className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-full bg-white/80 text-amber-700 hover:bg-white transition-colors shadow-sm"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 設定面板 */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              className="fixed top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-md shadow-2xl z-[100] p-6"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">任務牆設定</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* 最大卡片數設定已移除 - 現在顯示所有卡片 */}

                {/* 優先權過濾 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優先權過濾
                  </label>
                  <select
                    value={config.priorityFilter}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      priorityFilter: e.target.value as any 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">所有優先權</option>
                    <option value="high">高優先權</option>
                    <option value="medium">中優先權</option>
                    <option value="low">低優先權</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主要內容區域 */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          {allCards.length === 0 ? (
            // 空狀態
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-amber-800 mb-2">太棒了！</h3>
              <p className="text-amber-600">所有任務都完成了，該享受成就感了！</p>
            </div>
          ) : (
            // 卡片網格
            <TaskWallGrid
              cards={allCards}
              config={config}
              onTaskStatusUpdate={handleTaskStatusUpdate}
              onAddTaskToGoal={handleAddTaskToGoal}
              onOpenRecord={handleOpenRecord}
              currentUserId={currentUser?.id}
            />
          )}
        </div>

        {/* 完成任務 Dialog */}
        <CompletedTasksDialog
          isOpen={showCompletedDialog}
          onClose={() => setShowCompletedDialog(false)}
          completedTasks={completedTasks}
          onRestoreTask={handleRestoreTask}
          onClearStack={() => {
            setCompletedTasks([]);
            setCompletedCount(0);
            setShowCompletedDialog(false);
          }}
        />

        {/* 日誌記錄 Dialog */}
        <DailyJournalDialog
          isOpen={showJournalDialog}
          onClose={() => setShowJournalDialog(false)}
        />

        {/* 任務記錄 Dialog */}
        <TaskRecordDialog
          isOpen={showRecordDialog}
          taskTitle={selectedTaskForRecord?.title || ''}
          topic_id={selectedTaskForRecord?.topicId}
          task_id={selectedTaskForRecord?.id}
          task_type="task"
          onClose={() => {
            setShowRecordDialog(false);
            setSelectedTaskForRecord(null);
          }}
          onSuccess={() => {
            setShowRecordDialog(false);
            setSelectedTaskForRecord(null);
          }}
        />

        {/* 溫馨提示 Dialog */}
        <CutePromptDialog
          isOpen={showPromptDialog}
          onClose={() => {
            setShowPromptDialog(false);
            setSelectedTaskForRecord(null);
          }}
          onConfirm={() => {
            setShowPromptDialog(false);
            setShowRecordDialog(true);
          }}
          title="需要記錄學習心得 📝"
          message="記錄一下這次的學習過程和收穫，這樣任務就能完成了！分享你的學習感想吧~ 😊"
        />
      </div>
    </PageLayout>
  );
};

export default TaskWallPage; 