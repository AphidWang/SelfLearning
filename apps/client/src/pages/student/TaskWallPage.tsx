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

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Eye, Grid3X3, Columns, Users, Calendar, TrendingUp, 
  Clipboard, CheckCircle2, Archive, Settings, Search, Filter,
  MoreVertical, Shuffle, SortAsc, ChevronDown, ChevronRight,
  Clock, Target, User as UserIcon, Play, BookOpen, BookMarked, Zap, Star, Gift
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useTopicStore } from '../../store/topicStore';
import { useTaskStore } from '../../store/taskStore';
import { useGoalStore } from '../../store/goalStore';
import { useUserStore } from '../../store/userStore';
import { 
  getGoalsForTopic, 
  getTasksForGoal, 
  getTopicProgress,
  getTaskById,
  getGoalById,
  getTopicById,
  getAllTasksForTopic,
  getActiveGoalsForTopic,
  getActiveTasksForGoal
} from '../../store/helpers';
import {
  useGoalsForTopic,
  useActiveGoalsForTopic,
  useTasksForGoal,
  useActiveTasksForGoal,
  useTopicStats,
  useGoalStats,
  useAllTasksForTopic,
  useActiveTasksForTopic,
  useTaskWallTaskIds,
  useTasksByIds
} from '../../store/selectors';
import { useUser } from '../../context/UserContext';
import { subjects } from '../../styles/tokens';
import { DailyJournalDialog } from './components/DailyJournalDialog';
import { TopicReviewPage } from '../../components/topic-review/TopicReviewPage';
import { LoadingDots } from '../../components/shared/LoadingDots';
import { TaskWallGrid } from './components/TaskWallGrid';
import { CompletedCardsStack } from './components/CompletedCardsStack';
import { StarCounter, CompletedTasksDialog, CutePromptDialog } from './components/SharedDialogs';
import { useAsyncOperation } from '../../utils/errorHandler';
import PageLayout from '../../components/layout/PageLayout';
import type { 
  Task, 
  Goal, 
  TaskStatus, 
  GoalStatus, 
  TaskWithContext
} from '../../types/goal';
import { SPECIAL_TASK_FLAGS } from '../../types/goal';
import { CreateWeeklyTaskCard } from './components/cards/CreateWeeklyTaskCard';
import { TaskRecordDialog } from './components/TaskRecordDialog';
import { TaskRecordHistoryDialog } from './components/TaskRecordHistoryDialog';
import { TopicGrid } from './components/TopicCards';
import { TopicTemplateBrowser as TemplateBrowser } from '../../components/template/TopicTemplateBrowser';
import { fetchTopicsWithActions } from '../../store/dataManager';

/**
 * 任務牆配置介面
 */
interface TaskWallConfig {
  gridColumns: 'auto' | 2 | 3; // 網格欄數
  showCompletedStack: boolean;
  viewMode: 'tasks' | 'topics'; // 新增：視圖模式切換
  sortMode: 'task_type' | 'topic'; // 新增：排序模式
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

export const TaskWallPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isTopicLoading, setIsTopicLoading] = useState(false);
  const [isViewModeChanging, setIsViewModeChanging] = useState(false);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  
  // Store hooks with error handling
  const {  
    topics, 
    createTopic,
    getActiveGoals,
    getActiveTopics,
    loading, 
    error,
  } = useTopicStore();
  const { addTask, deleteTask, markTaskCompleted, markTaskInProgress, markTaskTodo } = useTaskStore();
  const { addGoal } = useGoalStore();
  
  const { users, getCollaboratorCandidates } = useUserStore();
  const { currentUser, isLoading: userLoading } = useUser();

  // 組件狀態
  const [config, setConfig] = useState<TaskWallConfig>({
    gridColumns: 'auto',
    showCompletedStack: true,
    viewMode: 'tasks',
    sortMode: 'task_type'
  });
  
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [selectedTaskForRecord, setSelectedTaskForRecord] = useState<TaskWithContext | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskWithContext[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isStarAnimating, setIsStarAnimating] = useState(false);
  const [showTopicReviewId, setShowTopicReviewId] = useState<string | null>(null);
  const [loadingTopicId, setLoadingTopicId] = useState<string | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState<TaskWithContext | null>(null);
  const [isCreatingWeeklyTask, setIsCreatingWeeklyTask] = useState(false);
  




  // 初始化資料載入
  useEffect(() => {
    const fetchData = async () => {
      // 等待用戶資料載入完成
      if (userLoading) return;
      
      console.log('TaskWallPage fetchData called')
      setIsLoading(true);
      const startTime = performance.now();
      try {
        await Promise.all([
          fetchTopicsWithActions(),
          getCollaboratorCandidates()
        ]);
        
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        console.log(`⚡ 任務牆載入時間: ${Math.round(loadTime)}ms`);
        
        // 在開發環境下顯示載入時間
        if (import.meta.env.DEV) {
          setTimeout(() => {
            toast.success(`⚡ 載入完成：${Math.round(loadTime)}ms`, {
              duration: 2000,
              style: {
                background: '#10B981',
                color: 'white',
                fontSize: '14px'
              }
            });
          }, 100);
        }
      } catch (error) {
        console.error('Failed to load task wall data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userLoading]); // 移除 getCollaboratorCandidates 依賴，因為它是穩定的函數

  // 自動清除錯誤消息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        // clearError();
        useTopicStore.setState({ error: null }); // 直接 patch
      }, 5000); // 5秒後自動清除錯誤

      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * 使用響應式 selector 獲取 TaskWallPage 關注的任務 ID 列表
   */
  const { activeTaskIds, completedTaskIds } = useTaskWallTaskIds();

  /**
   * 使用響應式 selector 根據 ID 列表獲取完整的任務資料
   */
  const allActiveTasks = useTasksByIds(activeTaskIds);

  // 使用響應式 selector 獲取已完成任務
  const completedTasksData = useTasksByIds(completedTaskIds);
  
  // 從響應式數據構建已完成任務列表
  useEffect(() => {
    if (!topics || !completedTasksData) return;

    const completedTasksFromDB: TaskWithContext[] = [];
    
    completedTasksData.forEach(task => {
      const goal = getGoalById(task.goal_id);
      if (!goal) return;
      
      const topic = getTopicById(goal.topic_id);
      if (!topic || topic.status === 'archived') return;
      
      const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
      
      completedTasksFromDB.push({
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
          message: record.message || '',
          difficulty: record.difficulty || 3,
          completion_time: record.completion_time,
          files: record.files || [],
          tags: record.tags || []
        }))
      });
    });

    // 按完成時間排序（最新的在前）
    completedTasksFromDB.sort((a, b) => {
      const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return bTime - aTime;
    });

    // 最多保留最近的 10 個已完成任務
    const recentCompletedTasks = completedTasksFromDB.slice(0, 10);
    setCompletedTasks(recentCompletedTasks);
    setCompletedCount(completedTasksFromDB.length);
  }, [completedTasksData, topics]); // getGoalById 是穩定的函數引用

  /**
   * 處理任務狀態更新
   * 使用 Result pattern 進行錯誤處理
   */
  const handleTaskStatusUpdate = useCallback(async (
    taskId: string, 
    goalId: string, 
    topicId: string, 
    newStatus: TaskStatus,
    taskVersion: number
  ) => {
    console.log('handleTaskStatusUpdate called', taskId, goalId, topicId, newStatus, taskVersion);
    try {
      let result;
      
      // 使用專門的狀態切換函數
      switch (newStatus) {
        case 'done':
          result = await markTaskCompleted(taskId, taskVersion, true); // 使用正確的版本號
          
          if (!result.success) {
            if (result.requiresRecord) {
              // 需要學習記錄，顯示溫馨提示
              const task = getTaskById(taskId);
              const topic = getTopicById(topicId);
              const goal = getGoalById(goalId);
              
              if (task && topic && goal) {
                setSelectedTaskForRecord({
                  ...task,
                  topicId,
                  topicTitle: topic.title,
                  topicSubject: topic.subject || '未分類',
                  goalId,
                  goalTitle: goal.title,
                  subjectStyle: subjects.getSubjectStyle(topic.subject || ''),
                  records: (task.records || []).map(record => ({
                    id: record.id,
                    created_at: record.created_at || new Date().toISOString(),
                    title: task.title,
                    message: record.message || '',
                    difficulty: record.difficulty || 3,
                    completion_time: record.completion_time,
                    files: record.files || [],
                    tags: record.tags || []
                  }))
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
          result = await markTaskInProgress(taskId, taskVersion);
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          break;
          
        case 'todo':
          result = await markTaskTodo(taskId, taskVersion);
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
  }, [markTaskCompleted, markTaskInProgress, markTaskTodo]); // getTaskById 和 getGoalById 是穩定的函數引用

  /**
   * 處理新增任務到目標
   */
  const handleAddTaskToGoal = useCallback(async (
    goalId: string, 
    topicId: string, 
    taskTitle: string
  ) => {
    try {
      await addTask(goalId, {
        title: taskTitle,
        status: 'todo',
        description: '',
        priority: 'medium',
        order_index: 0,
        need_help: false,
        task_type: 'single',
        task_config: { type: 'single' },
        cycle_config: { cycle_type: 'none', auto_reset: false },
      });
    } catch (error) {
      console.error('新增任務失敗:', error);
    }
  }, [addTask]); // addTask 是穩定的函數引用

  /**
   * 處理任務恢復到進行中
   */
  const handleRestoreTask = useCallback(async (
    taskId: string, 
    goalId: string, 
    topicId: string,
    taskVersion: number
  ) => {
    try {
      // 使用專門的狀態切換函數
      await markTaskInProgress(taskId, taskVersion);
    } catch (error) {
      console.error('恢復任務失敗:', error);
    }
  }, [markTaskInProgress]); // markTaskInProgress 是穩定的函數引用

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
    setSelectedTaskForRecord({
      ...task,
      records: task.records // 已經是新格式，不需要再轉換
    });
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
   * 獲取週開始日期（週日開始）
   */
  const getWeekStart = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = date.getDate() - dayOfWeek;
    const weekStart = new Date(date.setDate(diff));
    return weekStart;
  }, []);

  /**
   * 獲取台灣時間的日期字串
   */
  const getTaiwanDateString = useCallback(() => {
    const now = new Date();
    const taiwanTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
    return taiwanTime.toISOString().split('T')[0];
  }, []);

  /**
   * 快速創建週循環任務
   */
  const handleCreateWeeklyTask = useCallback(async (title: string) => {
    if (!currentUser) return;

    setIsCreatingWeeklyTask(true);
    
    try {
      // 找到或創建"個人習慣"主題
      const currentTopics = useTopicStore.getState().topics;
      let habitTopic = currentTopics?.find(topic => topic.title === '個人習慣' && topic.subject === '生活');
      
      if (!habitTopic) {
        // 創建個人習慣主題（隱藏主題，不在主題牆顯示）
        const newTopic = await createTopic({
          title: '個人習慣',
          description: '培養良好的日常習慣',
          subject: '生活',
          status: 'hidden', // 使用 hidden 狀態來隱藏主題
          is_collaborative: false,
          show_avatars: false
        });
        
        if (!newTopic) {
          toast.error('創建習慣主題失敗');
          return;
        }
        habitTopic = newTopic;
      }

      // 找到或創建"每週挑戰"目標
      const goals = getGoalsForTopic(habitTopic.id);
      let challengeGoal = goals.find(goal => goal.title === '每週挑戰');
      
      if (!challengeGoal) {
        const newGoal = await addGoal(habitTopic.id, {
          title: '每週挑戰',
          description: '堅持完成本週設定的挑戰',
          status: 'todo',
          priority: 'high',
          order_index: 0
        });
        
        if (!newGoal) {
          toast.error('創建挑戰目標失敗');
          return;
        }
        challengeGoal = newGoal;
      }

      // 創建計數型任務
      const weekStart = getWeekStart(getTaiwanDateString());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const taskConfig = {
        type: 'count' as const,
        target_count: 7,
        current_count: 0,
        reset_frequency: 'weekly' as const // 每週重置
      };

      const cycleConfig = {
        cycle_type: 'weekly' as const,
        cycle_start_date: weekStart.toISOString().split('T')[0],
        deadline: weekEnd.toISOString().split('T')[0],
        auto_reset: true
      };

      const progressData = {
        last_updated: new Date().toISOString(),
        completion_percentage: 0,
        check_in_dates: [],
        current_count: 0,
        target_count: 7
      };

      const newTask = await addTask(challengeGoal.id, {
        title: title,
        description: `本週挑戰：${title}`,
        task_type: 'count',
        task_config: taskConfig,
        cycle_config: cycleConfig,
        status: 'in_progress',
        priority: 'high',
        order_index: 0,
        need_help: false,
        special_flags: [SPECIAL_TASK_FLAGS.WEEKLY_QUICK_CHALLENGE],
      });

      if (newTask) {
        // 刷新頁面數據
        await fetchTopicsWithActions();
        
        toast.success('週挑戰創建成功！開始你的7天打卡之旅 🎉', {
          duration: 5000,
          style: {
            background: '#10B981',
            color: 'white',
            borderRadius: '12px',
            fontWeight: '600'
          }
        });
      } else {
        toast.error('創建任務失敗');
      }
    } catch (error) {
      console.error('創建週挑戰失敗:', error);
      toast.error('創建失敗，請稍後再試');
    } finally {
      setIsCreatingWeeklyTask(false);
    }
  }, [currentUser, createTopic, addGoal, addTask, getWeekStart, getTaiwanDateString]); // fetchTopicsWithActions 是穩定的函數引用


  /**
   * 過濾和構建活躍任務列表
   */
  const activeTasks = useMemo((): TaskWithContext[] => {
    if (!topics || !allActiveTasks) return [];

    const tasks: TaskWithContext[] = [];
    
    allActiveTasks.forEach(task => {
      // 獲取相關的 topic 和 goal 資訊
      const goal = getGoalById(task.goal_id);
      if (!goal) return;
      
      const topic = getTopicById(goal.topic_id);
      if (!topic || topic.status === 'archived') return;
      
      const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
      
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
          message: record.message || '',
          difficulty: record.difficulty || 3,
          completion_time: record.completion_time,
          files: record.files || [],
          tags: record.tags || []
        }))
      });
    });

    // 根據排序模式進行排序
    return tasks.sort((a, b) => {
      if (config.sortMode === 'task_type') {
        // 任務類型排序：每週 > 其他計次 > 其他連續 > 其他累積 > 單次型任務
        const getTaskTypeOrder = (task: TaskWithContext) => {
          if (task.task_type === 'single') return 5; // 單次任務最後
          
          // 檢查是否是週循環
          const hasWeeklyCycle = (task.cycle_config as any)?.cycle_type === 'weekly';
          
          switch (task.task_type) {
            case 'count':
              return hasWeeklyCycle ? 1 : 2; // 週循環計次 > 其他計次
            case 'streak':
              return hasWeeklyCycle ? 1 : 3; // 週循環連續 > 其他連續
            case 'accumulative':
              return hasWeeklyCycle ? 1 : 4; // 週循環累積 > 其他累積
            default:
              return 5;
          }
        };
        
        const aOrder = getTaskTypeOrder(a);
        const bOrder = getTaskTypeOrder(b);
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // 相同類型則按狀態排序：進行中 > 待開始
        const statusOrder = { in_progress: 2, todo: 1 };
        const aStatus = statusOrder[a.status] || 1;
        const bStatus = statusOrder[b.status] || 1;
        
        if (aStatus !== bStatus) {
          return bStatus - aStatus;
        }
        
        // 相同狀態則按優先權排序
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // 最後按建立時間排序
        return b.id.localeCompare(a.id);
      } else {
        // 主題排序：按主題名稱，然後按狀態和優先權
        const topicCompare = a.topicTitle.localeCompare(b.topicTitle);
        
        if (topicCompare !== 0) {
          return topicCompare;
        }
        
        // 相同主題則按狀態排序
        const statusOrder = { in_progress: 2, todo: 1 };
        const aStatus = statusOrder[a.status] || 1;
        const bStatus = statusOrder[b.status] || 1;
        
        if (aStatus !== bStatus) {
          return bStatus - aStatus;
        }
        
        // 相同狀態則按優先權排序
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // 最後按建立時間排序
        return b.id.localeCompare(a.id);
      }
    });
  }, [allActiveTasks, topics, config.sortMode]); // getGoalById 是穩定的函數引用



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
      const topicGoals = getGoalsForTopic(topic.id);
      
      topicGoals.forEach(goal => {
        if (goal.status === 'archived') return;
        
        // 檢查目標是否需要更多任務
        const activeTasks = getActiveTasksForGoal(goal.id);
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
  }, [topics]); // getGoalsForTopic 和 getActiveTasksForGoal 是穩定的函數引用

  /**
   * 根據配置過濾任務
   */
  const filteredTasks = useMemo(() => {
    // 顯示所有活躍任務
    return activeTasks;
  }, [activeTasks]);

  /**
   * 檢查是否存在週挑戰任務（包括隱藏主題中的）
   */
  const weeklyQuickChallengeInfo = useMemo(() => {
    if (!topics) return { hasChallenge: false, challengeTask: undefined };

    let challengeTask: TaskWithContext | undefined;
    
    // 從所有主題（包括隱藏主題）中尋找週挑戰任務
    topics.forEach(topic => {
      if (topic.status === 'archived') return;
      
      const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
      const goals = getGoalsForTopic(topic.id);
      
      goals.forEach(goal => {
        if (goal.status === 'archived') return;
        
        const tasks = getTasksForGoal(goal.id);
        tasks.forEach(task => {
          if ((task.status === 'todo' || task.status === 'in_progress') &&
              task.special_flags?.includes(SPECIAL_TASK_FLAGS.WEEKLY_QUICK_CHALLENGE)) {
            challengeTask = {
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
                message: record.message || '',
                difficulty: record.difficulty || 3,
                completion_time: record.completion_time,
                files: record.files || [],
                tags: record.tags || []
              }))
            };
          }
        });
      });
    });
    
    return {
      hasChallenge: !!challengeTask,
      challengeTask
    };
  }, [topics]); // getGoalsForTopic 和 getTasksForGoal 是穩定的函數引用

  /**
   * 整合所有卡片（包括週挑戰任務）
   */
  const allCards = useMemo(() => {
    const taskCards = filteredTasks.map(task => ({ 
      type: 'task' as const, 
      data: task,
      highlight: false
    }));
    
    // 如果有週挑戰任務，加入到卡片列表的開頭並標記為 highlight
    if (weeklyQuickChallengeInfo.challengeTask) {
      const weeklyCard = {
        type: 'task' as const,
        data: weeklyQuickChallengeInfo.challengeTask,
        highlight: true
      };
      
      // 週挑戰卡片放在最前面
      return [weeklyCard, ...taskCards];
    }
    
    return taskCards;
  }, [filteredTasks, weeklyQuickChallengeInfo.challengeTask]);

  /**
   * 處理主題數據，計算各種統計資訊
   */
  const topicCards = useMemo((): any[] => { // Changed return type to any[] as TopicCardData is removed
    if (!topics) return [];

    return topics
      .filter(topic => topic.status !== 'archived' && topic.status !== 'hidden')
      .map(topic => {
        const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
        
        // 計算目標統計
        const activeGoals = getActiveGoalsForTopic(topic.id);
        const totalGoals = activeGoals.length;
        const completedGoals = activeGoals.filter(goal => {
          const goalTasks = getActiveTasksForGoal(goal.id);
          return goalTasks.length > 0 && goalTasks.every(task => task.status === 'done');
        }).length;

        // 計算任務統計
        let totalTasks = 0;
        let completedTasks = 0;
        let inProgressTasks = 0;
        let needHelpCount = 0;

        activeGoals.forEach(goal => {
          const goalTasks = getActiveTasksForGoal(goal.id);
          totalTasks += goalTasks.length;
          
          goalTasks.forEach(task => {
            if (task.status === 'done') {
              completedTasks++;
            } else if (task.status === 'in_progress') {
              inProgressTasks++;
            }
            
            if (task.need_help) {
              needHelpCount++;
            }
          });
        });

        // 計算整體進度
        const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // 獲取協作者資訊
        const collaborators = topic.is_collaborative ? (topic.collaborators || []) : [];

        return {
          topic,
          subjectStyle,
          totalGoals,
          completedGoals,
          totalTasks,
          completedTasks,
          inProgressTasks,
          needHelpCount,
          collaborators,
          overallProgress
        };
      })
      .sort((a, b) => {
        // 排序邏輯：進行中任務多的在前，然後按進度，最後按更新時間
        if (a.inProgressTasks !== b.inProgressTasks) {
          return b.inProgressTasks - a.inProgressTasks;
        }
        if (a.overallProgress !== b.overallProgress) {
          return a.overallProgress - b.overallProgress; // 進度低的在前（需要更多關注）
        }
        return b.topic.id.localeCompare(a.topic.id); // 新的在前
      });
  }, [topics]); // getActiveGoalsForTopic 和 getActiveTasksForGoal 是穩定的函數引用

  /**
   * 處理主題點擊 - 開啟 TopicReviewPage
   */
  const handleTopicClick = useCallback((topicId: string) => {
    if (!topicId) return;
    setLoadingTopicId(topicId);
    setShowTopicReviewId(topicId);
    
    setTimeout(() => {
      setLoadingTopicId(null);
    }, 500);
  }, []); // 沒有依賴，函數內部只設置狀態

  // 修改切換視圖模式的處理函數
  const handleViewModeChange = useCallback(async (mode: 'tasks' | 'topics') => {
    setIsViewModeChanging(true);
    setConfig(prev => ({ ...prev, viewMode: mode }));
    // 模擬載入延遲
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsViewModeChanging(false);
  }, []);

  // 在 TaskWallPage 組件中添加刷新函數
  const handleRecordSuccess = useCallback(async () => {
    setShowRecordDialog(false);
    setSelectedTaskForRecord(null);
    // 重新獲取最新數據
    await fetchTopicsWithActions();
  }, []); // fetchTopicsWithActions 是穩定的函數引用，不需要依賴

  // 處理打開歷史記錄
  const handleOpenHistory = useCallback((task: TaskWithContext) => {
    setSelectedTaskForHistory(task);
    setShowHistoryDialog(true);
  }, []);

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
        {/* 主要內容區域 */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {/* 任務牆標題區域 - 保持整條 */}
          <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-sm border-b border-amber-200/50 mb-4 rounded-2xl">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-amber-900">
                        {config.viewMode === 'tasks' ? '⭐ 任務牆' : '🐦 主題牆'}
                      </h1>
                      <StarCounter 
                        count={completedCount} 
                        isAnimating={isStarAnimating}
                        onClick={handleToggleCompletedStack}
                      />
                      <span className="text-sm text-amber-600">
                        {config.viewMode === 'tasks' ? (
                          `${allCards.length + 1} 張卡片 • ${activeTasks.filter(task => task.status === 'in_progress').length} 個進行中 • ${config.sortMode === 'task_type' ? '類型排序' : '主題排序'}`
                        ) : (
                          `${topicCards.length} 個主題 • ${topicCards.reduce((sum, topic) => sum + topic.inProgressTasks, 0)} 個任務進行中`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* 類別排序按鈕 */}
                  {config.viewMode === 'tasks' && (
                    <button
                      onClick={() => setConfig(prev => ({ 
                        ...prev, 
                        sortMode: prev.sortMode === 'task_type' ? 'topic' : 'task_type' 
                      }))}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm border border-slate-200"
                      title={`當前排序: ${config.sortMode === 'task_type' ? '任務類型' : '主題分類'}`}
                    >
                      {config.sortMode === 'task_type' ? (
                        <>
                          <Target className="w-4 h-4" />
                          <span className="text-xs font-medium">類型排序</span>
                        </>
                      ) : (
                        <>
                          <BookMarked className="w-4 h-4" />
                          <span className="text-xs font-medium">主題排序</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* 緊湊模式切換按鈕 */}
                  <button
                    onClick={() => handleViewModeChange(config.viewMode === 'tasks' ? 'topics' : 'tasks')}
                    className="flex items-center bg-white/95 rounded-full shadow-lg border border-indigo-200 overflow-hidden hover:bg-indigo-50/50 transition-colors"
                    title={`切換到${config.viewMode === 'tasks' ? '主題' : '任務'}模式`}
                  >
                    <div className={`px-3 py-2 transition-all duration-300 flex items-center gap-2 ${
                      config.viewMode === 'tasks'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                        : 'text-slate-700'
                    }`}>
                      <span className="text-sm">⭐</span>
                      <span className="text-xs font-bold">任務</span>
                    </div>
                    <div className="w-px h-6 bg-indigo-200"></div>
                    <div className={`px-3 py-2 transition-all duration-300 flex items-center gap-2 ${
                      config.viewMode === 'topics'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
                        : 'text-slate-700'
                    }`}>
                      <span className="text-sm">🐦</span>
                      <span className="text-xs font-bold">主題</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowJournalDialog(true)}
                    className="p-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500 transition-all shadow-md hover:shadow-lg"
                    title="寫今日學習日記"
                  >
                    <BookMarked className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 根據模式決定佈局 */}
          {config.viewMode === 'tasks' ? (
            // 任務模式：全寬度佈局
            <div className="w-full">
              {/* 週挑戰區域 - 總是顯示在最前面 */}
              <div className="mb-6">
                {weeklyQuickChallengeInfo.hasChallenge ? (
                  // 如果有週挑戰任務，顯示在 TaskWallGrid 中（通過 allCards）
                  null
                ) : (
                  // 如果沒有週挑戰任務，顯示創建卡片
                  <div className="flex justify-center">
                    <div className="w-full max-w-sm">
                      <CreateWeeklyTaskCard
                        onCreateWeeklyTask={handleCreateWeeklyTask}
                        isCreatingTask={isCreatingWeeklyTask}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 一般任務區域 */}
              {filteredTasks.length === 0 && weeklyQuickChallengeInfo.hasChallenge ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-amber-800 mb-2">太棒了！</h3>
                  <p className="text-amber-600">所有任務都完成了，該享受成就感了！</p>
                </div>
              ) : (
                <TaskWallGrid
                  cards={allCards}
                  config={config}
                  onTaskStatusUpdate={handleTaskStatusUpdate}
                  onAddTaskToGoal={handleAddTaskToGoal}
                  onOpenRecord={handleOpenRecord}
                  onOpenHistory={handleOpenHistory}
                  onRecordSuccess={handleRecordSuccess}
                  currentUserId={currentUser?.id}
                  isLoading={isLoading}
                />
              )}
            </div>
          ) : (
            // 主題模式：全寬度佈局
            <div className="w-full">
              {topicCards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-2xl font-bold text-amber-800 mb-2">還沒有主題</h3>
                  <p className="text-amber-600 mb-4">建立你的第一個學習主題吧！</p>
                  <button
                    onClick={() => setShowTemplateBrowser(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-2xl font-medium hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    建立新主題
                  </button>
                </div>
              ) : (
                <TopicGrid
                  topics={topicCards.map(card => ({
                    ...card,
                    isLoading: card.topic.id === loadingTopicId
                  }))}
                  onTopicClick={handleTopicClick}
                  onCreateTopicClick={() => setShowTemplateBrowser(true)}
                  isLoading={isLoading}
                  isViewModeChanging={isViewModeChanging}
                  loadingTopicId={loadingTopicId}
                />
              )}
            </div>
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

        {/* 主題詳細檢視 */}
        {showTopicReviewId && (
          <TopicReviewPage
            topicId={showTopicReviewId}
            onClose={() => {
              setShowTopicReviewId(null);
              setLoadingTopicId(null);
            }}
            onTaskClick={(taskId, goalId) => {
              console.log('Task clicked:', taskId, goalId);
            }}
            onGoalClick={(goalId) => {
              console.log('Goal clicked:', goalId);
            }}
          />
        )}

        {/* 歷史記錄對話框 */}
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

        {/* 主題模板瀏覽器 */}
        <TemplateBrowser
          isOpen={showTemplateBrowser}
          onClose={() => setShowTemplateBrowser(false)}
          onTemplateSelected={(templateId) => {
            console.log('選擇了模板:', templateId);
            setShowTemplateBrowser(false);
            // 刷新主題列表
            fetchTopicsWithActions();
          }}
          onCreateBlankTopic={() => {
            console.log('建立空白主題');
            setShowTemplateBrowser(false);
            // 刷新主題列表
            fetchTopicsWithActions();
          }}
        />

      </div>
    </PageLayout>
  );
};

export default TaskWallPage; 