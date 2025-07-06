/**
 * TaskHabitIntegrationPage - 任務習慣整合頁面
 * 
 * 🎯 功能說明：
 * - 左側：任務區塊（來自任務牆）
 * - 右側：習慣挑戰（來自習慣培養）
 * - 整合統一的進度追蹤和成就系統
 * - 溫暖色調設計，營造舒適的學習環境
 * 
 * 🏗️ 架構設計：
 * - 左右分欄布局，可調整寬度
 * - 任務區塊使用 TaskWallGrid 組件
 * - 習慣區塊使用 HabitChallenge 相關組件
 * - 統一的頂部控制區域
 * 
 * 🎨 視覺設計：
 * - 清新的淺色調背景
 * - 左右分區使用不同的色彩主題
 * - 統一的卡片樣式和動畫效果
 * - 響應式設計，支援手機和桌面
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Settings, Grid3x3, Zap, Star, BarChart3, CheckCircle2, Target, Flame, Calendar, X, SplitSquareHorizontal } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { useTopicStore } from '../../store/topicStore';
import { useUserStore } from '../../store/userStore';
import { useUser } from '../../context/UserContext';
import { subjects } from '../../styles/tokens';
import { TaskWallGrid } from './components/TaskWallGrid';
import { TaskRecordDialog } from './components/TaskRecordDialog';
import { TaskRecordHistoryDialog } from './components/TaskRecordHistoryDialog';
import { DailyJournalDialog } from './components/DailyJournalDialog';
import { LoadingDots } from '../../components/shared/LoadingDots';
import type { Topic, Goal, Task, TaskStatus } from '../../types/goal';

// 重用習慣相關的介面和組件
type HabitType = 'daily' | 'weekly' | 'challenge';
type HabitStatus = 'active' | 'completed' | 'paused';

interface Habit {
  id: string;
  title: string;
  description?: string;
  type: HabitType;
  status: HabitStatus;
  categoryId: string;
  target: number;
  current: number;
  streak: number;
  lastCompletedDate?: string;
  createdAt: string;
  completedDates: string[];
}

interface HabitCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

interface TaskWithContext extends Task {
  topicId: string;
  topicTitle: string;
  topicSubject: string;
  goalId: string;
  goalTitle: string;
  subjectStyle: any;
  records: {
    id: string;
    created_at: string;
    title: string;
    message: string;
    difficulty: number;
    completion_time?: number;
    files?: any[];
    tags?: string[];
  }[];
}

// Mock 習慣資料
const mockCategories: HabitCategory[] = [
  {
    id: 'study',
    name: '學習習慣',
    emoji: '📚',
    color: '#3B82F6',
    description: '培養良好的學習習慣'
  },
  {
    id: 'health',
    name: '健康生活',
    emoji: '💪',
    color: '#10B981',
    description: '維持身心健康'
  },
  {
    id: 'life',
    name: '生活管理',
    emoji: '🏠',
    color: '#F59E0B',
    description: '提升生活品質'
  },
  {
    id: 'hobby',
    name: '興趣培養',
    emoji: '🎨',
    color: '#8B5CF6',
    description: '發展個人興趣'
  }
];

const mockHabits: Habit[] = [
  {
    id: 'habit-1',
    title: '每日英文練習',
    description: '每天15分鐘英文練習',
    type: 'daily',
    status: 'active',
    categoryId: 'study',
    target: 7,
    current: 4,
    streak: 4,
    lastCompletedDate: '2024-01-15',
    createdAt: '2024-01-12',
    completedDates: ['2024-01-12', '2024-01-13', '2024-01-14', '2024-01-15']
  },
  {
    id: 'habit-2',
    title: '晨間運動',
    description: '10分鐘伸展運動',
    type: 'daily',
    status: 'active',
    categoryId: 'health',
    target: 7,
    current: 3,
    streak: 3,
    lastCompletedDate: '2024-01-15',
    createdAt: '2024-01-13',
    completedDates: ['2024-01-13', '2024-01-14', '2024-01-15']
  },
  {
    id: 'habit-3',
    title: '整理書桌',
    description: '保持書桌整潔',
    type: 'daily',
    status: 'active',
    categoryId: 'life',
    target: 7,
    current: 2,
    streak: 2,
    lastCompletedDate: '2024-01-14',
    createdAt: '2024-01-13',
    completedDates: ['2024-01-13', '2024-01-14']
  },
  {
    id: 'habit-4',
    title: '畫畫練習',
    description: '每日素描20分鐘',
    type: 'daily',
    status: 'active',
    categoryId: 'hobby',
    target: 7,
    current: 3,
    streak: 3,
    lastCompletedDate: '2024-01-15',
    createdAt: '2024-01-13',
    completedDates: ['2024-01-13', '2024-01-14', '2024-01-15']
  }
];

/**
 * 習慣卡片組件
 */
interface HabitCardProps {
  habit: Habit;
  category: HabitCategory;
  onToggleComplete: (habitId: string) => void;
  onEdit: (habitId: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, category, onToggleComplete, onEdit }) => {
  const progress = (habit.current / habit.target) * 100;
  const isCompletedToday = habit.lastCompletedDate === new Date().toISOString().split('T')[0];
  
  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
      whileHover={{ y: -2 }}
      layout
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.button
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              isCompletedToday 
                ? 'bg-green-500 border-green-500' 
                : 'border-gray-300 hover:border-green-400'
            }`}
            onClick={() => onToggleComplete(habit.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isCompletedToday && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 text-sm">{habit.title}</h4>
            {habit.description && (
              <p className="text-xs text-gray-600 mt-1">{habit.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {habit.streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">
              <Flame className="w-3 h-3" />
              <span className="font-medium">{habit.streak}</span>
            </div>
          )}
          <span className="text-xs text-gray-500">
            {habit.current}/{habit.target}
          </span>
        </div>
      </div>
      
      {/* 進度條 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="h-2 rounded-full transition-all duration-500"
          style={{ backgroundColor: category.color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

/**
 * 習慣分區組件
 */
interface HabitSectionProps {
  habits: Habit[];
  categories: HabitCategory[];
  onToggleComplete: (habitId: string) => void;
  onEditHabit: (habitId: string) => void;
}

const HabitSection: React.FC<HabitSectionProps> = ({ habits, categories, onToggleComplete, onEditHabit }) => {
  const habitsByCategory = useMemo(() => {
    const grouped = categories.map(category => ({
      category,
      habits: habits.filter(h => h.categoryId === category.id && h.status === 'active')
    }));
    return grouped.filter(group => group.habits.length > 0);
  }, [categories, habits]);

  return (
    <div className="space-y-6">
      {/* 習慣統計 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-purple-800">習慣挑戰</h3>
            <p className="text-purple-600 text-sm">培養良好習慣，提升生活品質</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">總習慣</span>
            </div>
            <span className="text-2xl font-bold text-purple-800">{habits.length}</span>
          </div>
          
          <div className="bg-white/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">連續天數</span>
            </div>
            <span className="text-2xl font-bold text-orange-800">
              {Math.max(...habits.map(h => h.streak), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* 習慣列表 */}
      <div className="space-y-4">
        {habitsByCategory.map((group) => (
          <div key={group.category.id} className="bg-white/90 rounded-3xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-md"
                style={{ backgroundColor: group.category.color + '20' }}
              >
                {group.category.emoji}
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">{group.category.name}</h4>
                <p className="text-sm text-gray-600">{group.category.description}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {group.habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  category={group.category}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditHabit}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 任務分區組件
 */
interface TaskSectionProps {
  tasks: TaskWithContext[];
  onTaskStatusUpdate: (taskId: string, goalId: string, topicId: string, status: TaskStatus) => void;
  onOpenRecord: (task: TaskWithContext) => void;
  onOpenHistory: (task: TaskWithContext) => void;
  isLoading: boolean;
}

const TaskSection: React.FC<TaskSectionProps> = ({ tasks, onTaskStatusUpdate, onOpenRecord, onOpenHistory, isLoading }) => {
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const completedTasksCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="space-y-6">
      {/* 任務統計 */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
            <Grid3x3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-800">學習任務</h3>
            <p className="text-blue-600 text-sm">專注學習，達成目標</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">進行中</span>
            </div>
            <span className="text-2xl font-bold text-blue-800">{inProgressTasks.length}</span>
          </div>
          
          <div className="bg-white/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">待開始</span>
            </div>
            <span className="text-2xl font-bold text-amber-800">{todoTasks.length}</span>
          </div>
          
          <div className="bg-white/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">已完成</span>
            </div>
            <span className="text-2xl font-bold text-green-800">{completedTasksCount}</span>
          </div>
        </div>
      </div>

      {/* 任務網格 */}
      <div className="bg-white/90 rounded-3xl p-6 shadow-lg border border-gray-100">
        <TaskWallGrid
          cards={tasks.map(task => ({ type: 'task' as const, data: task }))}
          config={{
            maxVisibleCards: 12,
            gridColumns: 'auto',
            priorityFilter: 'all',
            showCompletedStack: true
          }}
          onTaskStatusUpdate={onTaskStatusUpdate}
          onAddTaskToGoal={() => {}}
          onOpenRecord={onOpenRecord}
          onOpenHistory={onOpenHistory}
          onRecordSuccess={async () => {}}
          currentUserId={undefined}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export const TaskHabitIntegrationPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedTaskForRecord, setSelectedTaskForRecord] = useState<TaskWithContext | null>(null);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState<TaskWithContext | null>(null);
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [categories] = useState<HabitCategory[]>(mockCategories);
  const [splitRatio, setSplitRatio] = useState(50); // 左右分割比例

  // Store hooks
  const { 
    fetchTopics, 
    topics, 
    markTaskCompletedCompat: markTaskCompleted,
    markTaskInProgressCompat: markTaskInProgress,
    markTaskTodoCompat: markTaskTodo,
    clearError,
    loading, 
    error
  } = useTopicStore();
  
  const { getCollaboratorCandidates } = useUserStore();
  const { currentUser, isLoading: userLoading } = useUser();

  // 初始化資料載入
  useEffect(() => {
    const fetchData = async () => {
      if (userLoading) return;
      
      setIsLoading(true);
      try {
        await Promise.all([
          fetchTopics(),
          getCollaboratorCandidates()
        ]);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [fetchTopics, getCollaboratorCandidates, userLoading]);

  // 從任務牆提取活躍任務
  const activeTasks = useMemo((): TaskWithContext[] => {
    if (!topics) return [];

    const tasks: TaskWithContext[] = [];
    
    topics.forEach(topic => {
      if (topic.status === 'archived') return;
      
      const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
      
      topic.goals?.forEach(goal => {
        if (goal.status === 'archived') return;
        
        goal.tasks?.forEach(task => {
          if (task.status === 'todo' || task.status === 'in_progress') {
            tasks.push({
              ...task,
              topicId: topic.id,
              topicTitle: topic.title,
              topicSubject: topic.subject || '未分類',
              goalId: goal.id,
              goalTitle: goal.title,
              subjectStyle,
              records: (task.records || []).map(record => ({
                id: record.id,
                created_at: record.created_at || new Date().toISOString(),
                title: task.title,
                message: record.content || '',
                difficulty: 3,
                completion_time: undefined,
                files: [],
                tags: []
              }))
            });
          }
        });
      });
    });

    return tasks.sort((a, b) => {
      const statusOrder = { in_progress: 2, todo: 1 };
      const aStatus = statusOrder[a.status] || 1;
      const bStatus = statusOrder[b.status] || 1;
      
      if (aStatus !== bStatus) {
        return bStatus - aStatus;
      }
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      
      return bPriority - aPriority;
    });
  }, [topics]);

  // 處理任務狀態更新
  const handleTaskStatusUpdate = useCallback(async (
    taskId: string, 
    goalId: string, 
    topicId: string, 
    newStatus: TaskStatus
  ) => {
    try {
      let result;
      
      switch (newStatus) {
        case 'done':
          result = await markTaskCompleted(topicId, goalId, taskId, true);
          if (!result.success) {
            if (result.requiresRecord) {
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
                  subjectStyle: subjects.getSubjectStyle(topics.find(t => t.id === topicId)?.subject || ''),
                  records: (task.records || []).map(record => ({
                    id: record.id,
                    created_at: record.created_at || new Date().toISOString(),
                    title: task.title,
                    message: record.content || '',
                    difficulty: 3,
                    completion_time: undefined,
                    files: [],
                    tags: []
                  }))
                });
                setShowRecordDialog(true);
              }
            } else {
              toast.error(result.message);
            }
            return;
          }
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
      }
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      toast.error('系統錯誤，請稍後再試');
    }
  }, [markTaskCompleted, markTaskInProgress, markTaskTodo, topics]);

  // 處理習慣完成狀態切換
  const handleToggleComplete = useCallback((habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    setHabits(prev => prev.map(habit => {
      if (habit.id !== habitId) return habit;
      
      const isCompletedToday = habit.lastCompletedDate === today;
      
      if (isCompletedToday) {
        return {
          ...habit,
          current: Math.max(0, habit.current - 1),
          streak: Math.max(0, habit.streak - 1),
          lastCompletedDate: habit.completedDates[habit.completedDates.length - 2] || undefined,
          completedDates: habit.completedDates.filter(date => date !== today)
        };
      } else {
        const newCompletedDates = [...habit.completedDates, today].sort();
        return {
          ...habit,
          current: habit.current + 1,
          streak: habit.streak + 1,
          lastCompletedDate: today,
          completedDates: newCompletedDates
        };
      }
    }));
    
    toast.success(
      habits.find(h => h.id === habitId)?.lastCompletedDate === today 
        ? '已取消今日完成 👌' 
        : '太棒了！今日任務完成 🎉',
      {
        duration: 2000,
        style: {
          background: '#10B981',
          color: 'white',
          borderRadius: '12px',
          fontWeight: '500'
        }
      }
    );
  }, [habits]);

  // 處理編輯習慣
  const handleEditHabit = useCallback((habitId: string) => {
    console.log('Edit habit:', habitId);
  }, []);

  // 處理打開記錄
  const handleOpenRecord = useCallback((task: TaskWithContext) => {
    setSelectedTaskForRecord(task);
    setShowRecordDialog(true);
  }, []);

  // 處理打開歷史
  const handleOpenHistory = useCallback((task: TaskWithContext) => {
    setSelectedTaskForHistory(task);
    setShowHistoryDialog(true);
  }, []);

  // 處理記錄成功
  const handleRecordSuccess = useCallback(async () => {
    setShowRecordDialog(false);
    setSelectedTaskForRecord(null);
    await fetchTopics();
  }, [fetchTopics]);

  if (loading || isLoading) {
    return (
      <PageLayout title="任務習慣整合">
        <div className="flex items-center justify-center h-64">
          <LoadingDots />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="任務習慣整合">
        <div className="text-center py-12">
          <p className="text-red-600">載入失敗：{error}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="任務習慣整合">
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
      
      {/* 清新背景 */}
      <div 
        className="min-h-screen"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #e0f2fe 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, #fef3c7 0%, transparent 50%)
          `
        }}
      >
        {/* 標題區域 */}
        <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-sm border-b border-slate-200/50 mb-6">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 rounded-full bg-white/80 text-slate-700 hover:bg-white transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-1">
                    🎯 任務習慣整合
                  </h1>
                  <p className="text-slate-700">
                    左側學習任務，右側習慣培養，雙管齊下提升自己！
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-full bg-white/80 text-slate-700 hover:bg-white transition-colors shadow-sm"
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
                  <h3 className="text-lg font-bold text-gray-800">整合設定</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      左右分割比例
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="70"
                      value={splitRatio}
                      onChange={(e) => setSplitRatio(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>任務 {splitRatio}%</span>
                      <span>習慣 {100 - splitRatio}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主要內容區域 */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* 左側：任務區塊 */}
            <div 
              className="flex-shrink-0 overflow-y-auto custom-scrollbar"
              style={{ width: `${splitRatio}%` }}
            >
              <TaskSection
                tasks={activeTasks}
                onTaskStatusUpdate={handleTaskStatusUpdate}
                onOpenRecord={handleOpenRecord}
                onOpenHistory={handleOpenHistory}
                isLoading={isLoading}
              />
            </div>

            {/* 分割線 */}
            <div className="w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent flex-shrink-0 relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center">
                <SplitSquareHorizontal className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* 右側：習慣區塊 */}
            <div 
              className="flex-shrink-0 overflow-y-auto custom-scrollbar"
              style={{ width: `${100 - splitRatio}%` }}
            >
              <HabitSection
                habits={habits}
                categories={categories}
                onToggleComplete={handleToggleComplete}
                onEditHabit={handleEditHabit}
              />
            </div>
          </div>
        </div>

        {/* 任務記錄 Dialog */}
        <TaskRecordDialog
          isOpen={showRecordDialog}
          task={{
            id: selectedTaskForRecord?.id || '',
            title: selectedTaskForRecord?.title || '',
            description: selectedTaskForRecord?.description
          }}
          onClose={() => {
            setShowRecordDialog(false);
            setSelectedTaskForRecord(null);
          }}
          onRecordSuccess={handleRecordSuccess}
        />

        {/* 歷史記錄 Dialog */}
        <TaskRecordHistoryDialog
          isOpen={showHistoryDialog}
          onClose={() => {
            setShowHistoryDialog(false);
            setSelectedTaskForHistory(null);
          }}
          task={{
            id: selectedTaskForHistory?.id || '',
            title: selectedTaskForHistory?.title || '',
            records: selectedTaskForHistory?.records || [],
            topicTitle: selectedTaskForHistory?.topicTitle,
            subjectStyle: selectedTaskForHistory?.subjectStyle
          }}
        />

        {/* 日誌 Dialog */}
        <DailyJournalDialog
          isOpen={showJournalDialog}
          onClose={() => setShowJournalDialog(false)}
        />
      </div>

      <style>
        {`.custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }`}
      </style>
    </PageLayout>
  );
};

export default TaskHabitIntegrationPage; 