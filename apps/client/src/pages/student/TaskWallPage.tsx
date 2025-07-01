/**
 * TaskWallPage - 學生任務牆頁面
 * 
 * 🎯 功能說明：
 * - 呈現溫暖色調的任務卡牆，類似手作筆記本風格
 * - 顯示待完成任務和進行中任務，以及需要建立任務的目標
 * - 支援卡片翻轉互動和完成動畫
 * - 已完成的任務會移動到右下角收藏堆
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
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTopicStore } from '../../store/topicStore';
import { useUserStore } from '../../store/userStore';
import { useUser } from '../../context/UserContext';
import { subjects } from '../../styles/tokens';
import { ArrowLeft, Settings, Filter, Star, BookMarked, X } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { TaskWallGrid } from './components/TaskWallGrid';
import { CompletedCardsStack } from './components/CompletedCardsStack';
import { DailyJournalDialog } from './components/DailyJournalDialog';
import { TaskRecordDialog } from './components/TaskRecordDialog';
import type { Topic, Goal, Task, TaskStatus } from '../../types/goal';

/**
 * 任務牆配置介面
 */
interface TaskWallConfig {
  maxVisibleCards: number; // 已停用 - 現在顯示所有卡片
  gridColumns: 'auto' | 2 | 3; // 網格欄數
  showCompletedStack: boolean; // 是否顯示完成堆疊
  priorityFilter: 'all' | 'high' | 'medium' | 'low'; // 優先權過濾
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
    showCompletedStack: true,
    priorityFilter: 'all'
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [selectedTaskForRecord, setSelectedTaskForRecord] = useState<TaskWithContext | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskWithContext[]>([]);

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
    setCompletedTasks(completedTasksFromDB.slice(0, 10));
  }, [topics]);

  /**
   * 處理任務狀態更新
   * 使用專門的狀態切換函數，包含學習記錄檢查
   */
  const handleTaskStatusUpdate = useCallback(async (
    taskId: string, 
    goalId: string, 
    topicId: string, 
    newStatus: TaskStatus
  ) => {
    try {
      let result: Task | null = null;
      
      // 使用專門的狀態切換函數
      switch (newStatus) {
        case 'done':
          result = await markTaskCompleted(topicId, goalId, taskId, true); // 要求學習記錄
          break;
        case 'in_progress':
          result = await markTaskInProgress(topicId, goalId, taskId);
          break;
        case 'todo':
          result = await markTaskTodo(topicId, goalId, taskId);
          break;
        default:
          console.warn('未知的任務狀態:', newStatus);
          return;
      }

      // 如果狀態切換失敗（如缺少學習記錄），result 會是 null
      if (!result && newStatus === 'done') {
        // 任務完成失敗，可能需要先記錄學習心得
        // 錯誤信息已在 store 中設置，這裡可以選擇顯示提示
        const task = topics
          .find(t => t.id === topicId)
          ?.goals?.find(g => g.id === goalId)
          ?.tasks?.find(t => t.id === taskId);
        
        if (task) {
          // 自動打開記錄對話框
          setSelectedTaskForRecord({
            ...task,
            topicId,
            topicTitle: topics.find(t => t.id === topicId)?.title || '',
            topicSubject: topics.find(t => t.id === topicId)?.subject || '未分類',
            goalId,
            goalTitle: topics.find(t => t.id === topicId)?.goals?.find(g => g.id === goalId)?.title || '',
            subjectStyle: {}
          });
          setShowRecordDialog(true);
        }
        return;
      }

      // 更新成功後會自動觸發 topics 重新載入，完成收藏會自動更新
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
    }
  }, [markTaskCompleted, markTaskInProgress, markTaskTodo]);

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

      // 更新成功後會自動觸發 topics 重新載入，完成收藏會自動更新
    } catch (error) {
      console.error('恢復任務失敗:', error);
    }
  }, [markTaskInProgress]);

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
      
      alert('學習記錄保存成功！繼續加油！ 🎉');
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
                  <h1 className="text-3xl font-bold text-amber-900 font-hand">
                    📝 我的任務牆
                  </h1>
                  <p className="text-amber-700 mt-1">
                    {allCards.length} 張卡片 • 
                    {activeTasks.filter(task => task.status === 'in_progress').length} 個進行中 • 
                    {completedTasks.length} 個已完成
                  </p>
                  {/* 錯誤消息顯示 */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="text-red-700 text-sm font-medium">
                        {error}
                      </p>
                    </motion.div>
                  )}
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

                {/* 完成堆疊開關 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">顯示完成堆疊</span>
                  <button
                    onClick={() => setConfig(prev => ({ 
                      ...prev, 
                      showCompletedStack: !prev.showCompletedStack 
                    }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      config.showCompletedStack 
                        ? 'bg-amber-500' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      config.showCompletedStack ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
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

        {/* 完成卡片堆疊 */}
        {config.showCompletedStack && completedTasks.length > 0 && (
          <CompletedCardsStack 
            completedTasks={completedTasks}
            onClearStack={() => setCompletedTasks([])}
            onRestoreTask={handleRestoreTask}
          />
        )}

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
      </div>
    </PageLayout>
  );
};

export default TaskWallPage; 