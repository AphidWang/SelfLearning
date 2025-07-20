import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTopicStore } from '../../../store/topicStore';
import { useUserStore } from '../../../store/userStore';
import { useAsyncOperation, ErrorPatterns } from '../../../utils/errorHandler';
import type { Topic, Goal, Task } from '../../../types/goal';
import type { User } from '@self-learning/types';
import { getCompletionRate } from '../../../store/progressQueries';
import { refreshTopicData } from '../../../store/dataManager';

interface Collaborator extends User {
  permission: 'view' | 'edit';
}

export interface TopicReviewState {
  topic: Topic | null;
  owner?: User;
  collaborators: User[]; // 改為 User[] 以匹配 DetailsPanel 的期望
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
    updateTopic,
    deleteTopic,
    enableTopicCollaboration,
    disableTopicCollaboration,
    inviteTopicCollaborator,
    removeTopicCollaborator,
  } = useTopicStore();
  
  const { getCollaboratorCandidates, users } = useUserStore();
  const { wrapAsync } = useAsyncOperation();
  
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
  const refreshTopic = useCallback(
    wrapAsync(
      async () => {
        console.log('📥 useTopicReview - refreshTopic started');
        
        const fetchedTopic = await refreshTopicData(topicId);
        if (!fetchedTopic) {
          throw new Error('無法載入主題資料');
        }

        console.log('📥 useTopicReview - fetchedTopic from refreshTopicData:', {
          topicId: fetchedTopic.id,
          topicTitle: fetchedTopic.title,
          hasCollaborators: !!fetchedTopic.collaborators,
          collaboratorsLength: fetchedTopic.collaborators?.length,
          firstCollaborator: fetchedTopic.collaborators?.[0],
          hasTopicCollaborators: !!fetchedTopic.topic_collaborators,
          topicCollaboratorsLength: fetchedTopic.topic_collaborators?.length
        });

        setState(prev => ({
          ...prev,
          topic: fetchedTopic,
          editedTopic: fetchedTopic,
        }));

        console.log('📥 useTopicReview - refreshTopic end ', state);
        
        return fetchedTopic;
      },
      {
        context: '載入主題資料',
        retryCount: 1,
        retryDelay: 500,
      }
    ),
    [topicId, refreshTopicData, wrapAsync]
  );

  // 當協作者更新時刷新頁面
  const handleCollaborationUpdate = useCallback(
    wrapAsync(
      async () => {
        console.log('🔄 useTopicReview - handleCollaborationUpdate triggered');
        setState(prev => ({ ...prev, isUpdating: true, pendingOperation: 'collaboration' }));
        
        try {
          // 確保協作者候選人列表是最新的
          await getCollaboratorCandidates(true);
          // 刷新主題數據（包含最新的協作者信息）
          await refreshTopic();
        } finally {
          setState(prev => ({ ...prev, isUpdating: false, pendingOperation: null }));
        }
      },
      {
        context: '更新協作者資訊',
        showSuccess: false, // 不顯示成功提示
      }
    ),
    [refreshTopic, getCollaboratorCandidates, wrapAsync]
  );

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
    if (!topic) return { owner: undefined, collaborators: [], availableUsers: [], totalUsers: 0 };

    const owner = topic.owner;
    
    // 處理協作者數據 - refreshTopicData 應該已經處理過了
    let collaborators: User[] = [];
    
    // 檢查 topic.collaborators（經過 storeUtils 處理後的數據）
    if (Array.isArray(topic.collaborators)) {
      if (topic.collaborators.length > 0 && (topic.collaborators[0] as any)?.user) {
        // 已經處理過，直接提取 user
        collaborators = topic.collaborators.map((c: any) => c.user);
      } else if (topic.collaborators.length > 0 && topic.collaborators[0]?.id) {
        // 如果還是原始數據，說明 storeUtils 沒有被正確調用
        console.warn('🔍 useTopicReview - storeUtils 可能沒有被正確調用，手動處理協作者數據');
        collaborators = topic.collaborators.map((collab: any) => {
          const id = collab.id;
          const user = users.find(u => u.id === id);
          if (!user) {
            console.warn(`🔍 useTopicReview - 找不到用戶 ${id}，使用預設名稱`);
            return {
              id,
              name: `User-${id?.slice?.(0, 8) || ''}`,
              email: '',
              avatar: undefined,
              role: 'student',
              roles: ['student']
            };
          }
          return user;
        });
      }
    }
    
    const availableUsers = users.length ? users.filter(u => 
      u.id !== owner?.id && !collaborators.some(c => c.id === u.id)
    ) : [];

    console.log('🔍 useTopicReview - derivedData:', { 
      owner: owner?.name, 
      collaborators: collaborators.map(c => c.name), 
      availableUsers: availableUsers.map(u => u.name),
      totalUsers: users.length,
      topicCollaboratorsRaw: topic.collaborators,
      topicCollaboratorsType: typeof topic.collaborators,
      topicCollaboratorsIsArray: Array.isArray(topic.collaborators),
      topicCollaboratorsLength: topic.collaborators?.length,
      firstCollaborator: topic.collaborators?.[0],
      firstCollaboratorType: typeof topic.collaborators?.[0]
    });

    return { owner, collaborators, availableUsers, totalUsers: users.length };
  }, [state.topic, users]);

  // 初始化時載入用戶和主題數據
  useEffect(() => {
    const initializeData = async () => {
      console.log('🔄 useTopicReview - initializeData started', { topicId });
      
      // 重置主題數據
      setState(prev => ({ ...prev, topic: null }));
      
      // 確保用戶數據存在
      if (!users.length) {
        await getCollaboratorCandidates();
      }
      
      // 載入主題數據
      await refreshTopic();
    };
    
    initializeData();
  }, [topicId]); // 只依賴 topicId，避免循環

  // 更新衍生數據到 state（只在實際變化時更新）
  useEffect(() => {
    setState(prev => {
      // 檢查是否真的有變化
      const hasChanged = 
        prev.owner?.id !== derivedData.owner?.id ||
        prev.collaborators.length !== derivedData.collaborators.length ||
        prev.availableUsers.length !== derivedData.availableUsers.length;
      
      if (!hasChanged) return prev;
      
      return {
        ...prev,
        ...derivedData
      };
    });
  }, [derivedData.owner?.id, derivedData.collaborators.length, derivedData.availableUsers.length]); // 只依賴關鍵識別符

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
      progress: state.topic ? getCompletionRate(state.topic) : 0,
      collaborators: state.collaborators,
      availableUsers: state.availableUsers,
    }
  };
}; 