import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTopicStore } from '../../../store/topicStore';
import { useUserStore } from '../../../store/userStore';
import type { Topic, Goal, Task, User } from '../../../types/goal';

interface Collaborator extends User {
  permission: 'view' | 'edit';
}

export interface TopicReviewState {
  topic: Topic | null;
  owner?: User;
  collaborators: Collaborator[];
  availableUsers: User[];
  selectedGoalId: string | null;
  selectedTaskId: string | null;
  isEditingTitle: boolean;
  editedTopic: Topic | null;
  showSubjectDropdown: boolean;
  showDeleteConfirm: boolean;
  isUpdating: boolean;
  pendingOperation: string | null;
  pendingPermissions: Record<string, 'view' | 'edit' | 'none'>;
}

export const useTopicReview = (topicId: string) => {
  const { 
    getTopic,
    updateTopic,
    deleteTopic,
    toggleTopicCollaborative,
    inviteTopicCollaborator,
    removeTopicCollaborator,
    getCompletionRate,
  } = useTopicStore();
  
  const { getUsers, users } = useUserStore();
  
  const [state, setState] = useState<TopicReviewState>({
    topic: null,
    collaborators: [],
    availableUsers: [],
    selectedGoalId: null,
    selectedTaskId: null,
    isEditingTitle: false,
    editedTopic: null,
    showSubjectDropdown: false,
    showDeleteConfirm: false,
    isUpdating: false,
    pendingOperation: null,
    pendingPermissions: {},
  });

  // 異步載入主題數據
  const refreshTopic = useCallback(async () => {
    console.log('📥 useTopicReview - refreshTopic started');
    const fetchedTopic = await getTopic(topicId);
    if (!fetchedTopic) return;

    setState(prev => ({
      ...prev,
      topic: fetchedTopic,
      editedTopic: fetchedTopic,
    }));
  }, [topicId, getTopic]);

  // 當協作者更新時刷新頁面
  const handleCollaborationUpdate = useCallback(async () => {
    console.log('🔄 useTopicReview - handleCollaborationUpdate triggered');
    setState(prev => ({ ...prev, isUpdating: true, pendingOperation: 'collaboration' }));
    
    try {
      await refreshTopic();
      if (!users.length) {
        await getUsers();
      }
    } finally {
      setState(prev => ({ ...prev, isUpdating: false, pendingOperation: null }));
    }
  }, [refreshTopic, getUsers, users.length]);

  // 通用的更新處理函數，確保所有更新都會同步狀態
  const handleTopicUpdate = useCallback(async (updateFn: () => Promise<any>) => {
    console.log('🔄 useTopicReview - handleTopicUpdate triggered');
    setState(prev => ({ ...prev, isUpdating: true }));
    
    try {
      const result = await updateFn();
      await refreshTopic(); // 更新後立即刷新數據
      return result;
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [refreshTopic]);

  // 計算衍生數據
  const derivedData = useMemo(() => {
    const { topic } = state;
    if (!topic) return { owner: undefined, collaborators: [], availableUsers: [] };

    const owner = topic.owner;
    const collaborators = (topic.collaborators as (User & { permission?: 'view' | 'edit' })[])?.map(c => ({
      ...c,
      permission: c.permission || 'view'
    })) as Collaborator[] || [];
    
    const availableUsers = users.length ? users.filter(u => 
      u.id !== owner?.id && !collaborators.some(c => c.id === u.id)
    ) : [];

    return { owner, collaborators, availableUsers };
  }, [state.topic, users]);

  // 監聽 users 變化
  useEffect(() => {
    if (!users.length) {
      getUsers();
    }
  }, [users.length, getUsers]);

  // 初始化 topic
  useEffect(() => {
    if (!state.topic) {
      refreshTopic();
    }
  }, [state.topic, refreshTopic]);

  // 更新衍生數據到 state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      ...derivedData
    }));
  }, [derivedData]);

  // Actions
  const setSelectedGoal = (goalId: string | null) => {
    setState(prev => ({ ...prev, selectedGoalId: goalId, selectedTaskId: null }));
  };

  const setSelectedTask = (taskId: string | null, goalId?: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedTaskId: taskId,
      selectedGoalId: goalId || prev.selectedGoalId
    }));
  };

  const setEditingTitle = (editing: boolean) => {
    setState(prev => ({ ...prev, isEditingTitle: editing }));
  };

  const setShowSubjectDropdown = (show: boolean) => {
    setState(prev => ({ ...prev, showSubjectDropdown: show }));
  };

  const setShowDeleteConfirm = (show: boolean) => {
    setState(prev => ({ ...prev, showDeleteConfirm: show }));
  };

  const updateEditedTopic = (updates: Partial<Topic>) => {
    setState(prev => ({ 
      ...prev, 
      editedTopic: prev.editedTopic ? { ...prev.editedTopic, ...updates } : null 
    }));
  };

  const handlePermissionChange = (userId: string, permission: 'view' | 'edit' | 'none') => {
    setState(prev => ({
      ...prev,
      pendingPermissions: {
        ...prev.pendingPermissions,
        [userId]: permission
      }
    }));
  };

  // 批量更新權限
  const handleUpdatePermissions = async () => {
    try {
      setState(prev => ({ ...prev, isUpdating: true, pendingOperation: 'permissions' }));
      
      for (const [userId, permission] of Object.entries(state.pendingPermissions)) {
        if (permission === 'none') {
          await removeTopicCollaborator(topicId, userId);
        } else {
          await inviteTopicCollaborator(topicId, userId, permission);
        }
      }
      
      await handleCollaborationUpdate();
      setState(prev => ({ ...prev, pendingPermissions: {} }));
    } catch (error) {
      console.error('更新權限失敗:', error);
      alert('更新權限失敗，請稍後再試');
    } finally {
      setState(prev => ({ ...prev, isUpdating: false, pendingOperation: null }));
    }
  };

  return {
    state,
    actions: {
      refreshTopic,
      handleCollaborationUpdate,
      handleTopicUpdate,
      setSelectedGoal,
      setSelectedTask,
      setEditingTitle,
      setShowSubjectDropdown,
      setShowDeleteConfirm,
      updateEditedTopic,
      handlePermissionChange,
      handleUpdatePermissions,
    },
    computed: {
      progress: state.topic ? getCompletionRate(state.topic.id) : 0,
      collaborators: state.collaborators,
      availableUsers: state.availableUsers,
    }
  };
}; 