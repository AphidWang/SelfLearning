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
    // TODO: Implement template task operations
    console.warn('Template task operations not implemented yet');
  };

  const handleUpdateTask = async (goalId: string, taskId: string, updates: Partial<TemplateTask>) => {
    // TODO: Implement template task operations
    console.warn('Template task operations not implemented yet');
  };

  const handleDeleteTask = async (goalId: string, taskId: string) => {
    // TODO: Implement template task operations
    console.warn('Template task operations not implemented yet');
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
    },
    computed: {
      // 計算衍生數據
      totalGoals: state.template?.goals?.length || 0,
      totalTasks: state.template?.goals?.reduce((sum, g) => sum + (g.tasks?.length || 0), 0) || 0,
    }
  };
}; 