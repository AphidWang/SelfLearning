import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTopicTemplateStore } from '../../../store/topicTemplateStore';
import { useAsyncOperation } from '../../../utils/errorHandler';
import type { TopicTemplate, TemplateGoal, TemplateTask } from '../../../types/goal';

export interface TemplateReviewState {
  template: TopicTemplate | null;
  selectedGoalId: string | null;
  selectedTaskId: string | null;
  isEditingTitle: boolean;
  editedTemplate: TopicTemplate | null;
  showSubjectDropdown: boolean;
  showDeleteConfirm: boolean;
  isUpdating: boolean;
  pendingOperation: string | null;
}

export const useTemplateReview = (templateId: string) => {
  const { 
    getTemplate,
    updateTemplate,
    deleteTemplate,
    addGoal,
    updateGoal,
    deleteGoal,
    addTask,
    updateTask,
    deleteTask,
    updateTemplateReferenceInfo,
    addTemplateAttachment,
    removeTemplateAttachment,
    addTemplateLink,
    removeTemplateLink,
    updateGoalReferenceInfo,
    addGoalAttachment,
    removeGoalAttachment,
    addGoalLink,
    removeGoalLink,
    updateTaskReferenceInfo,
    addTaskAttachment,
    removeTaskAttachment,
    addTaskLink,
    removeTaskLink,
  } = useTopicTemplateStore();
  
  const { wrapAsync } = useAsyncOperation();
  
  const [state, setState] = useState<TemplateReviewState>({
    template: null,
    selectedGoalId: null,
    selectedTaskId: null,
    isEditingTitle: false,
    editedTemplate: null,
    showSubjectDropdown: false,
    showDeleteConfirm: false,
    isUpdating: false,
    pendingOperation: null,
  });

  // 異步載入模板數據
  const refreshTemplate = useCallback(
    wrapAsync(
      async () => {
        console.log('📥 useTemplateReview - refreshTemplate started');
        
        const fetchedTemplate = await getTemplate(templateId);
        if (!fetchedTemplate) {
          throw new Error('無法載入模板資料');
        }

        setState(prev => ({
          ...prev,
          template: fetchedTemplate,
          editedTemplate: fetchedTemplate,
        }));
        
        return fetchedTemplate;
      },
      {
        context: '載入模板資料',
        retryCount: 1,
        retryDelay: 500,
      }
    ),
    [templateId, getTemplate, wrapAsync]
  );

  // 通用的更新處理函數，確保所有更新都會同步狀態
  const handleTemplateUpdate = useCallback(async (updateFn: () => Promise<any>) => {
    console.log('🔄 useTemplateReview - handleTemplateUpdate triggered');
    setState(prev => ({ ...prev, isUpdating: true }));
    
    try {
      const result = await updateFn();
      await refreshTemplate(); // 更新後立即刷新數據
      return result;
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [refreshTemplate]);

  // 初始化時載入模板數據
  useEffect(() => {
    const initializeData = async () => {
      console.log('🔄 useTemplateReview - initializeData started', { templateId });
      
      // 重置模板數據
      setState(prev => ({ ...prev, template: null }));
      
      // 載入模板數據
      await refreshTemplate();
    };
    
    initializeData();
  }, [templateId]); // 只依賴 templateId，避免無限循環

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

  const updateEditedTemplate = (updates: Partial<TopicTemplate>) => {
    setState(prev => ({ 
      ...prev, 
      editedTemplate: prev.editedTemplate ? { ...prev.editedTemplate, ...updates } : null 
    }));
  };

  // 模板 CRUD 操作
  const handleUpdateTemplate = async (updates: Partial<TopicTemplate>) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await updateTemplate(state.template!.id, updates);
    });
  };

  const handleDeleteTemplate = async () => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await deleteTemplate(state.template!.id);
    });
  };

  // 目標 CRUD 操作
  const handleAddGoal = async (goalData: Omit<TemplateGoal, 'id'>) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await addGoal(state.template!.id, goalData);
    });
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<TemplateGoal>) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await updateGoal(state.template!.id, goalId, updates);
    });
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await deleteGoal(state.template!.id, goalId);
    });
  };

  // 任務 CRUD 操作
  const handleAddTask = async (goalId: string, taskData: Omit<TemplateTask, 'id'>) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await addTask(state.template!.id, goalId, taskData);
    });
  };

  const handleUpdateTask = async (goalId: string, taskId: string, updates: Partial<TemplateTask>) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await updateTask(state.template!.id, goalId, taskId, updates);
    });
  };

  const handleDeleteTask = async (goalId: string, taskId: string) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await deleteTask(state.template!.id, goalId, taskId);
    });
  };

  // 參考資訊管理操作
  const handleUpdateTemplateReferenceInfo = async (referenceInfo: any) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await updateTemplateReferenceInfo(state.template!.id, referenceInfo);
    });
  };

  const handleAddTemplateAttachment = async (attachment: any) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await addTemplateAttachment(state.template!.id, attachment);
    });
  };

  const handleRemoveTemplateAttachment = async (attachmentId: string) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await removeTemplateAttachment(state.template!.id, attachmentId);
    });
  };

  const handleAddTemplateLink = async (link: any) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await addTemplateLink(state.template!.id, link);
    });
  };

  const handleRemoveTemplateLink = async (linkId: string) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await removeTemplateLink(state.template!.id, linkId);
    });
  };

  const handleUpdateGoalReferenceInfo = async (goalId: string, referenceInfo: any) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await updateGoalReferenceInfo(state.template!.id, goalId, referenceInfo);
    });
  };

  const handleAddGoalAttachment = async (goalId: string, attachment: any) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await addGoalAttachment(state.template!.id, goalId, attachment);
    });
  };

  const handleRemoveGoalAttachment = async (goalId: string, attachmentId: string) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await removeGoalAttachment(state.template!.id, goalId, attachmentId);
    });
  };

  const handleAddGoalLink = async (goalId: string, link: any) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await addGoalLink(state.template!.id, goalId, link);
    });
  };

  const handleRemoveGoalLink = async (goalId: string, linkId: string) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await removeGoalLink(state.template!.id, goalId, linkId);
    });
  };

  const handleUpdateTaskReferenceInfo = async (goalId: string, taskId: string, referenceInfo: any) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await updateTaskReferenceInfo(state.template!.id, goalId, taskId, referenceInfo);
    });
  };

  const handleAddTaskAttachment = async (goalId: string, taskId: string, attachment: any) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await addTaskAttachment(state.template!.id, goalId, taskId, attachment);
    });
  };

  const handleRemoveTaskAttachment = async (goalId: string, taskId: string, attachmentId: string) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await removeTaskAttachment(state.template!.id, goalId, taskId, attachmentId);
    });
  };

  const handleAddTaskLink = async (goalId: string, taskId: string, link: any) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await addTaskLink(state.template!.id, goalId, taskId, link);
    });
  };

  const handleRemoveTaskLink = async (goalId: string, taskId: string, linkId: string) => {
    if (!state.template) return;
    
    return handleTemplateUpdate(async () => {
      return await removeTaskLink(state.template!.id, goalId, taskId, linkId);
    });
  };

  return {
    state,
    actions: {
      refreshTemplate,
      handleTemplateUpdate,
      setSelectedGoal,
      setSelectedTask,
      setEditingTitle,
      setShowSubjectDropdown,
      setShowDeleteConfirm,
      updateEditedTemplate,
      handleUpdateTemplate,
      handleDeleteTemplate,
      handleAddGoal,
      handleUpdateGoal,
      handleDeleteGoal,
      handleAddTask,
      handleUpdateTask,
      handleDeleteTask,
      // 參考資訊管理
      handleUpdateTemplateReferenceInfo,
      handleAddTemplateAttachment,
      handleRemoveTemplateAttachment,
      handleAddTemplateLink,
      handleRemoveTemplateLink,
      handleUpdateGoalReferenceInfo,
      handleAddGoalAttachment,
      handleRemoveGoalAttachment,
      handleAddGoalLink,
      handleRemoveGoalLink,
      handleUpdateTaskReferenceInfo,
      handleAddTaskAttachment,
      handleRemoveTaskAttachment,
      handleAddTaskLink,
      handleRemoveTaskLink,
    },
    computed: {
      // 計算衍生數據
      totalGoals: state.template?.goals?.length || 0,
      totalTasks: state.template?.goals?.reduce((sum, g) => sum + (g.tasks?.length || 0), 0) || 0,
    }
  };
}; 