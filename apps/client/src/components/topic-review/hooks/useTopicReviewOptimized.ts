import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTopicStore } from '../../../store/topicStore';
import { useUserStore } from '../../../store/userStore';
import type { Topic, Goal, Task, User } from '../../../types/goal';

interface Collaborator extends User {
  permission: 'view' | 'edit';
}

interface TopicReviewState {
  // 核心數據
  topic: Topic | null;
  
  // UI 狀態
  selectedGoalId: string | null;
  selectedTaskId: string | null;
  isEditingTitle: boolean;
  editedTopic: Topic | null;
  showSubjectDropdown: boolean;
  showDeleteConfirm: boolean;
  isUpdating: boolean;
  pendingOperation: string | null;
  pendingPermissions: Record<string, 'view' | 'edit' | 'none'>;
  
  // 加載狀態
  isLoading: boolean;
  error: string | null;
}

interface TopicReviewComputed {
  owner: User | undefined;
  collaborators: Collaborator[];
  availableUsers: User[];
  needHelpCount: number;
  memoizedGoals: Goal[];
  subjectStyle: any;
  progress: number;
  weeklyStats: {
    newlyCompleted: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
  };
}

interface TopicReviewActions {
  // 選擇操作
  setSelectedGoal: (goalId: string | null) => void;
  setSelectedTask: (taskId: string | null, goalId?: string | null) => void;
  
  // 編輯操作
  setIsEditingTitle: (editing: boolean) => void;
  setEditedTopic: (topic: Topic | null) => void;
  setShowSubjectDropdown: (show: boolean) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  
  // 權限操作
  setPendingPermissions: (permissions: Record<string, 'view' | 'edit' | 'none'>) => void;
  
  // 數據更新
  refreshTopic: () => Promise<void>;
  handleCollaborationUpdate: () => Promise<void>;
  handleTopicUpdate: (updateFn: () => Promise<void>) => Promise<void>;
}

export const useTopicReviewOptimized = (topicId: string) => {
  // Store hooks
  const { 
    getTopic,
    getCompletionRate,
    getActiveGoals
  } = useTopicStore();
  
  const { getCollaboratorCandidates, users } = useUserStore();
  
  // 狀態管理
  const [state, setState] = useState<TopicReviewState>({
    topic: null,
    selectedGoalId: null,
    selectedTaskId: null,
    isEditingTitle: false,
    editedTopic: null,
    showSubjectDropdown: false,
    showDeleteConfirm: false,
    isUpdating: false,
    pendingOperation: null,
    pendingPermissions: {},
    isLoading: true,
    error: null
  });

  // 核心數據獲取函數 - 只調用一次
  const refreshTopic = useCallback(async () => {
    console.log('📥 useTopicReviewOptimized - refreshTopic started');
    const startTime = performance.now();
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // 並行獲取主題數據和用戶數據
      const [fetchedTopic] = await Promise.all([
        getTopic(topicId),
        // 只在沒有用戶數據時才獲取
        users.length === 0 ? getCollaboratorCandidates() : Promise.resolve()
      ]);
      
      if (!fetchedTopic) {
        setState(prev => ({ ...prev, error: '無法載入主題數據', isLoading: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        topic: fetchedTopic,
        editedTopic: fetchedTopic,
        isLoading: false,
        error: null
      }));
      
      const endTime = performance.now();
      console.log(`⚡ useTopicReviewOptimized - refreshTopic 耗時: ${Math.round(endTime - startTime)}ms`);
      
    } catch (error) {
      console.error('獲取主題數據失敗:', error);
      setState(prev => ({ 
        ...prev, 
        error: '載入失敗，請稍後再試', 
        isLoading: false 
      }));
    }
  }, [topicId, getTopic, getCollaboratorCandidates, users.length]);

  // 初始化數據
  useEffect(() => {
    console.log('🔄 useTopicReviewOptimized - initializeData started', { topicId });
    refreshTopic();
  }, [topicId]); // 只依賴 topicId

  // 計算衍生數據 - 記憶化避免重複計算
  const computed = useMemo<TopicReviewComputed>(() => {
    const { topic } = state;
    
    if (!topic) {
      return {
        owner: undefined,
        collaborators: [],
        availableUsers: [],
        needHelpCount: 0,
        memoizedGoals: [],
        subjectStyle: { accent: '#000' },
        progress: 0,
        weeklyStats: {
          newlyCompleted: 0,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0
        }
      };
    }

    // 計算協作者數據
    const owner = topic.owner;
    const collaborators = (topic.collaborators as (User & { permission?: 'view' | 'edit' })[])?.map(c => ({
      ...c,
      permission: c.permission || 'view' as 'view' | 'edit'
    })) || [];
    
    const availableUsers = users.filter(u => 
      u.id !== owner?.id && !collaborators.some(c => c.id === u.id)
    );

    // 計算需要幫助的項目數量
    const activeGoals = getActiveGoals(topicId);
    let needHelpCount = 0;
    activeGoals.forEach(goal => {
      if (goal.need_help) needHelpCount++;
      (goal.tasks || []).forEach(task => {
        if (task.need_help) needHelpCount++;
      });
    });

    // 計算週統計
    let newlyCompleted = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    
    const isThisWeek = (dateStr?: string) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    };
    
    (topic.goals || []).forEach(goal => {
      (goal.tasks || []).forEach(task => {
        totalTasks++;
        if (task.status === 'done') {
          completedTasks++;
          if (isThisWeek(task.completed_at)) {
            newlyCompleted++;
          }
        } else if (task.status === 'in_progress') {
          inProgressTasks++;
        }
      });
    });

    return {
      owner,
      collaborators,
      availableUsers,
      needHelpCount,
      memoizedGoals: topic.goals || [],
      subjectStyle: { accent: '#3b82f6' }, // 簡化主題樣式計算
      progress: getCompletionRate(topic.id),
      weeklyStats: {
        newlyCompleted,
        totalTasks,
        completedTasks,
        inProgressTasks
      }
    };
  }, [state.topic, users, topicId, getActiveGoals, getCompletionRate]);

  // 操作函數
  const actions = useMemo<TopicReviewActions>(() => ({
    setSelectedGoal: (goalId: string | null) => {
      setState(prev => ({
        ...prev,
        selectedGoalId: goalId,
        selectedTaskId: null // 選擇新目標時清除任務選擇
      }));
    },

    setSelectedTask: (taskId: string | null, goalId?: string | null) => {
      setState(prev => ({
        ...prev,
        selectedTaskId: taskId,
        selectedGoalId: goalId !== undefined ? goalId : prev.selectedGoalId
      }));
    },

    setIsEditingTitle: (editing: boolean) => {
      setState(prev => ({ ...prev, isEditingTitle: editing }));
    },

    setEditedTopic: (topic: Topic | null) => {
      setState(prev => ({ ...prev, editedTopic: topic }));
    },

    setShowSubjectDropdown: (show: boolean) => {
      setState(prev => ({ ...prev, showSubjectDropdown: show }));
    },

    setShowDeleteConfirm: (show: boolean) => {
      setState(prev => ({ ...prev, showDeleteConfirm: show }));
    },

    setPendingPermissions: (permissions: Record<string, 'view' | 'edit' | 'none'>) => {
      setState(prev => ({ ...prev, pendingPermissions: permissions }));
    },

    refreshTopic,

    handleCollaborationUpdate: async () => {
      console.log('🔄 useTopicReviewOptimized - handleCollaborationUpdate triggered');
      setState(prev => ({ 
        ...prev, 
        isUpdating: true, 
        pendingOperation: 'collaboration' 
      }));
      
      try {
        await refreshTopic();
      } finally {
        setState(prev => ({ 
          ...prev, 
          isUpdating: false, 
          pendingOperation: null 
        }));
      }
    },

    handleTopicUpdate: async (updateFn: () => Promise<void>) => {
      setState(prev => ({ ...prev, isUpdating: true }));
      
      try {
        await updateFn();
        await refreshTopic();
      } catch (error) {
        console.error('更新主題失敗:', error);
        throw error;
      } finally {
        setState(prev => ({ ...prev, isUpdating: false }));
      }
    }
  }), [refreshTopic]);

  return {
    state,
    computed,
    actions
  };
}; 