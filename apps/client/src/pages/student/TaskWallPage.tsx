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
 * - 優先權排序：高優先權任務優先顯示
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
import { subjects } from '../../styles/tokens';
import { ArrowLeft, Settings, Filter, Star, BookMarked } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { TaskWallGrid } from './components/TaskWallGrid';
import { CompletedCardsStack } from './components/CompletedCardsStack';
import { DailyJournalDialog } from './components/DailyJournalDialog';
import type { Topic, Goal, Task, TaskStatus } from '../../types/goal';

/**
 * 任務牆配置介面
 */
interface TaskWallConfig {
  maxVisibleCards: number; // 主畫面最大卡片數
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
    updateTask, 
    addTask,
    loading, 
    error 
  } = useTopicStore();
  
  const { users, getUsers } = useUserStore();

  // 組件狀態
  const [config, setConfig] = useState<TaskWallConfig>({
    maxVisibleCards: 12,
    gridColumns: 'auto',
    showCompletedStack: true,
    priorityFilter: 'all'
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
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

  /**
   * 處理任務狀態更新
   * 當任務完成時，觸發動畫並移動到完成堆疊
   */
  const handleTaskStatusUpdate = useCallback(async (
    taskId: string, 
    goalId: string, 
    topicId: string, 
    newStatus: TaskStatus
  ) => {
    try {
      // 先找到任務以便動畫使用
      const task = activeTasks.find(t => t.id === taskId);
      
      // 更新任務狀態
      await updateTask(topicId, goalId, taskId, { 
        status: newStatus,
        completedAt: newStatus === 'done' ? new Date().toISOString() : undefined
      });

      // 如果任務完成，加入完成堆疊
      if (newStatus === 'done' && task) {
        setCompletedTasks(prev => [task, ...prev.slice(0, 9)]); // 最多保留 10 個
      } else if (newStatus !== 'done') {
        // 如果任務狀態改為未完成，從完成堆疊移除
        setCompletedTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
    }
  }, [updateTask]);

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
   * 處理日誌保存
   */
  const handleSaveJournal = useCallback(async (journalEntry: any) => {
    try {
      // TODO: 實際保存到後端
      console.log('保存日誌:', journalEntry);
      
      // 暫時存到 localStorage
      const existingJournals = JSON.parse(localStorage.getItem('dailyJournals') || '[]');
      const newJournals = [journalEntry, ...existingJournals];
      localStorage.setItem('dailyJournals', JSON.stringify(newJournals));
      
      alert('日誌保存成功！繼續加油！ 🎉');
    } catch (error) {
      console.error('保存日誌失敗:', error);
      throw error;
    }
  }, []);

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

    // 按優先權和更新時間排序
    return tasks.sort((a, b) => {
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
    
    // 限制顯示數量
    return filtered.slice(0, config.maxVisibleCards);
  }, [activeTasks, config]);

  /**
   * 合併任務和目標卡片，用於統一顯示
   */
  const allCards = useMemo(() => {
    const taskCards = filteredTasks.map(task => ({ type: 'task' as const, data: task }));
    const goalCards = goalsNeedingTasks.slice(0, Math.max(0, config.maxVisibleCards - taskCards.length))
      .map(goal => ({ type: 'goal' as const, data: goal }));
    
    return [...taskCards, ...goalCards];
  }, [filteredTasks, goalsNeedingTasks, config.maxVisibleCards]);

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
                    {allCards.length} 張卡片 • {completedTasks.length} 個已完成
                  </p>
                  {/* 顯示活躍主題 */}
                  {topics && topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {topics
                        .filter(topic => topic.status !== 'archived')
                        .slice(0, 3) // 最多顯示3個主題
                        .map(topic => {
                          const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
                          return (
                            <span
                              key={topic.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${subjectStyle.accent}20`,
                                color: subjectStyle.accent
                              }}
                            >
                              <span>{topic.title}</span>
                            </span>
                          );
                        })}
                      {topics.filter(topic => topic.status !== 'archived').length > 3 && (
                        <span className="text-xs text-amber-600">
                          +{topics.filter(topic => topic.status !== 'archived').length - 3} 個主題
                        </span>
                      )}
                    </div>
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
              className="fixed top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-md shadow-2xl z-40 p-6"
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
                
                {/* 最大卡片數設定 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大顯示卡片數
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="24"
                    value={config.maxVisibleCards}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      maxVisibleCards: parseInt(e.target.value) 
                    }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">{config.maxVisibleCards} 張</span>
                </div>

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
            />
          )}
        </div>

        {/* 完成卡片堆疊 */}
        {config.showCompletedStack && completedTasks.length > 0 && (
          <CompletedCardsStack 
            completedTasks={completedTasks}
            onClearStack={() => setCompletedTasks([])}
          />
        )}

        {/* 日誌記錄 Dialog */}
        <DailyJournalDialog
          isOpen={showJournalDialog}
          onClose={() => setShowJournalDialog(false)}
          onSave={handleSaveJournal}
        />
      </div>
    </PageLayout>
  );
};

export default TaskWallPage; 