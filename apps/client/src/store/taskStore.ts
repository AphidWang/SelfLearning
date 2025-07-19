import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useAsyncOperation } from '../utils/errorHandler';
import type { Task, ReferenceInfo, ReferenceAttachment, ReferenceLink, TaskActionResult, ActiveTaskResult, TaskAction, TaskRecord } from '../types/goal';

interface TaskStoreState {
  tasks: Record<string, Task>;
  error?: string;
  
  // Cache 機制
  lastFetchTime: number;
  cacheExpiry: number; // 快取過期時間（毫秒）
  
  // 組合查詢方法
  getTasksForGoal: (goalId: string) => Task[];
  getTasksForTopic: (topicId: string) => Task[];
  getTaskById: (taskId: string) => Task | undefined;
  getAllTasks: () => Task[];
  
  // Cache 管理
  isCacheValid: () => boolean;
  invalidateCache: () => void;
  
  // Batch operations for performance
  setTasks: (tasks: Task[]) => void;
  clearTasks: () => void;
  
  // 獨立任務功能
  createIndependentTask: (task: Omit<Task, 'id' | 'goal_id' | 'version' | 'created_at' | 'updated_at' | 'creator_id'>) => Promise<Task | null>;
  getMyIndependentTasks: () => Promise<Task[]>;
  getCollaborativeIndependentTasks: () => Promise<Task[]>;
  
  addTask: (goalId: string, task: Omit<Task, 'id' | 'goal_id' | 'version' | 'created_at' | 'updated_at' | 'creator_id'>) => Promise<Task | null>;
  updateTask: (taskId: string, expectedVersion: number, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  restoreTask: (taskId: string) => Promise<boolean>;
  updateTaskReferenceInfo: (taskId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addTaskAttachment: (taskId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeTaskAttachment: (taskId: string, attachmentId: string) => Promise<boolean>;
  addTaskLink: (taskId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeTaskLink: (taskId: string, linkId: string) => Promise<boolean>;
  markTaskCompleted: (taskId: string, expectedVersion: number, requireRecord?: boolean) => Promise<TaskActionResult>;
  markTaskInProgress: (taskId: string, expectedVersion: number) => Promise<TaskActionResult>;
  markTaskTodo: (taskId: string, expectedVersion: number) => Promise<TaskActionResult>;
  performTaskAction: (taskId: string, actionType: 'check_in' | 'add_count' | 'add_amount' | 'reset', params?: any) => Promise<TaskActionResult>;
  checkInTask: (taskId: string) => Promise<TaskActionResult>;
  addTaskCount: (taskId: string, count: number) => Promise<TaskActionResult>;
  addTaskAmount: (taskId: string, amount: number, unit?: string) => Promise<TaskActionResult>;
  resetTaskProgress: (taskId: string) => Promise<TaskActionResult>;
  cancelTodayCheckIn: (taskId: string) => Promise<TaskActionResult>;
  getActiveTasksForUser: () => Promise<ActiveTaskResult[]>;
  getTaskCheckInRecords: (taskIds: string[], date: string) => Promise<Array<{ task_id: string; action_date: string; action_timestamp: string }>>;
  getTodayTaskActivities: () => Promise<{
    statusChanges: Array<{
      task_id: string;
      task_title: string;
      old_status: string;
      new_status: string;
      changed_at: string;
      topic_title: string;
      goal_title: string;
    }>;
    checkIns: Array<{
      task_id: string;
      task_title: string;
      action_timestamp: string;
      action_data: any;
      topic_title: string;
      goal_title: string;
    }>;
    records: Array<{
      task_id: string;
      task_title: string;
      record_id: string;
      created_at: string;
      topic_title: string;
      goal_title: string;
    }>;
    totalActivities: number;
  }>;
  getUserTaskActivitiesForDateRange: (startDate: string, endDate: string) => Promise<any>;
  getTaskActivitiesForDate: (date: string) => Promise<{
    statusChanges: Array<{
      task_id: string;
      task_title: string;
      old_status: string;
      new_status: string;
      changed_at: string;
      topic_title: string;
      goal_title: string;
    }>;
    checkIns: Array<{
      task_id: string;
      task_title: string;
      action_timestamp: string;
      action_data: any;
      topic_title: string;
      goal_title: string;
    }>;
    records: Array<{
      task_id: string;
      task_title: string;
      record_id: string;
      created_at: string;
      topic_title: string;
      goal_title: string;
    }>;
    totalActivities: number;
  }>;
  getTaskTodayActions: (taskId: string) => Promise<Array<{ action_type: string; action_timestamp: string; action_data: any }>>;
  hasTaskActivityToday: (taskId: string) => Promise<boolean>;
  getDailyActivityStats: (startDate: string, endDate: string) => Promise<Array<{
    date: string;
    total_activities: number;
    status_changes: number;
    check_ins: number;
    records: number;
    active_tasks: string[];
  }>>;
  getTasksWithFullData: (filters?: { task_ids?: string[]; goal_ids?: string[]; topic_ids?: string[]; date_range?: { start: string; end: string }; include_actions?: boolean; include_records?: boolean; }) => Promise<Array<Task & { actions?: TaskAction[]; records?: TaskRecord[] }>>;
  getUserTaskActivitiesForDate: (date: string) => Promise<{
    completed_tasks: Array<{
      id: string;
      title: string;
      topic_title: string;
      goal_title: string;
      completed_at: string;
      type: 'completed';
    }>;
    checked_in_tasks: Array<{
      id: string;
      title: string;
      topic_title: string;
      goal_title: string;
      action_timestamp: string;
      action_data: any;
      type: 'check_in';
    }>;
    recorded_tasks: Array<{
      id: string;
      title: string;
      topic_title: string;
      goal_title: string;
      record_id: string;
      created_at: string;
      type: 'record';
    }>;
    all_activities: Array<{
      id: string;
      title: string;
      topic_title: string;
      goal_title: string;
      timestamp: string;
      type: 'completed' | 'check_in' | 'record';
      data?: any;
    }>;
  }>;
  updateTaskHelp: (taskId: string, needHelp: boolean, helpMessage?: string) => Promise<boolean>;
  setTaskOwner: (taskId: string, userId: string) => Promise<Task | null>;
  addTaskCollaborator: (taskId: string, userId: string) => Promise<boolean>;
  removeTaskCollaborator: (taskId: string, userId: string) => Promise<boolean>;
  reorderTasks: (goalId: string, taskIds: string[]) => Promise<boolean>;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: {},
  error: undefined,
  lastFetchTime: 0,
  cacheExpiry: 5 * 60 * 1000, // 5分鐘過期

  // Cache 管理
  isCacheValid: () => {
    const state = get();
    return Date.now() - state.lastFetchTime < state.cacheExpiry;
  },

  invalidateCache: () => {
    set({ lastFetchTime: 0 });
  },

  // 組合查詢方法
  getTasksForGoal: (goalId: string) => {
    const state = get();
    return Object.values(state.tasks).filter(task => task.goal_id === goalId);
  },
  
  getTasksForTopic: (topicId: string) => {
    const state = get();
    return Object.values(state.tasks).filter(task => {
      // TODO: 需要通過 goalStore 來查找 goal.topic_id
      // 暫時返回空陣列，之後實作
      return false;
    });
  },
  
  getTaskById: (taskId: string) => {
    const state = get();
    return state.tasks[taskId];
  },
  
  getAllTasks: () => {
    const state = get();
    return Object.values(state.tasks);
  },

  // Batch operations for performance
  setTasks: (tasks: Task[]) => {
    set(state => {
      const tasksMap = { ...state.tasks };
      tasks.forEach(task => {
        tasksMap[task.id] = task;
      });
      return { 
        tasks: tasksMap,
        lastFetchTime: Date.now() // 更新快取時間
      };
    });
  },

  clearTasks: () => {
    set({ tasks: {}, lastFetchTime: 0 });
  },

  // 獨立任務功能
  createIndependentTask: async (taskData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const taskType = taskData.task_type || 'single';
      const taskConfig = taskData.task_config || {};
      const cycleConfig = taskData.cycle_config || {};

      const independentTaskData = {
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        order_index: taskData.order_index || 0,
        need_help: taskData.need_help || false,
        goal_id: null, // 獨立任務不屬於任何 goal
        creator_id: user.id,
        owner_id: user.id, // 創建者即為擁有者
        task_type: taskType,
        task_config: taskConfig,
        cycle_config: cycleConfig,
        special_flags: taskData.special_flags || [],
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([independentTaskData])
        .select()
        .single();

      if (error) throw error;

      set(state => ({ tasks: { ...state.tasks, [data.id]: data } }));
      console.log('✅ 成功創建獨立任務:', data.id);
      return data;
    } catch (error: any) {
      console.error('創建獨立任務失敗:', error);
      set({ error: error.message || '創建獨立任務失敗' });
      return null;
    }
  },

  getMyIndependentTasks: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const { data, error } = await supabase.rpc('get_independent_tasks_by_creator', {
        p_user_id: user.id
      });

      if (error) throw error;

      const tasks = data || [];
      // 更新本地 store
      set(state => {
        const updatedTasks = { ...state.tasks };
        tasks.forEach(task => {
          updatedTasks[task.id] = task;
        });
        return { tasks: updatedTasks };
      });

      return tasks;
    } catch (error: any) {
      console.error('獲取我的獨立任務失敗:', error);
      return [];
    }
  },

  getCollaborativeIndependentTasks: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const { data, error } = await supabase.rpc('get_independent_tasks_as_collaborator', {
        p_user_id: user.id
      });

      if (error) throw error;

      const tasks = data || [];
      // 更新本地 store
      set(state => {
        const updatedTasks = { ...state.tasks };
        tasks.forEach(task => {
          updatedTasks[task.id] = task;
        });
        return { tasks: updatedTasks };
      });

      return tasks;
    } catch (error: any) {
      console.error('獲取協作獨立任務失敗:', error);
      return [];
    }
  },

  /**
   * 新增任務
   */
  addTask: async (goalId, taskData) => {
    try {
      // 確保所有必需字段都有默認值
      const taskType = taskData.task_type || 'single';
      const taskConfig = taskData.task_config || {};
      const cycleConfig = taskData.cycle_config || {};
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const taskDataWithDefaults = {
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        order_index: taskData.order_index || 0,
        need_help: taskData.need_help || false,
        goal_id: goalId,
        creator_id: user.id,
        task_type: taskType,
        task_config: taskConfig,
        cycle_config: cycleConfig,
        special_flags: taskData.special_flags || [],
      };
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskDataWithDefaults])
        .select()
        .single();
      if (error) throw error;
      set(state => ({ 
        tasks: { ...state.tasks, [data.id]: data },
        lastFetchTime: Date.now()
      }));
      return data;
    } catch (error: any) {
      console.error('添加任務失敗:', error);
      set({ error: error.message || '添加任務失敗' });
      return null;
    }
  },

  /**
   * 更新任務（帶版本控制）
   */
  updateTask: async (taskId, expectedVersion, updates) => {
    try {
      let completedAt = updates.completed_at;
      if (updates.status === 'done' && !completedAt) {
        completedAt = new Date().toISOString();
      } else if (updates.status && updates.status !== 'done') {
        completedAt = undefined;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const { data, error } = await supabase.rpc('safe_update_task', {
        p_id: taskId,
        p_expected_version: expectedVersion,
        p_user_id: user.id,
        p_title: updates.title,
        p_description: updates.description,
        p_status: updates.status,
        p_priority: updates.priority,
        p_order_index: updates.order_index,
        p_need_help: updates.need_help,
        p_help_message: updates.help_message,
        p_reply_message: updates.reply_message,
        p_reply_at: null,
        p_replied_by: updates.replied_by,
        p_completed_at: completedAt,
        p_completed_by: updates.completed_by,
        p_estimated_minutes: updates.estimated_minutes,
        p_actual_minutes: updates.actual_minutes,
        p_creator_id: null
      });
      if (error) throw error;
      const result = data as any;
      if (!result || !result.success) {
        if (result && result.message === 'Version conflict detected') {
          throw new Error('任務已被其他用戶修改，請重新載入');
        }
        throw new Error(result?.message || '更新任務失敗');
      }
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      if (taskError) throw taskError;
      set(state => ({
        tasks: { ...state.tasks, [taskId]: taskData }
      }));
      return taskData;
    } catch (error: any) {
      console.error('更新任務失敗:', error);
      set({ error: error.message || '更新任務失敗' });
      throw error;
    }
  },

  /**
   * 刪除任務（歸檔）
   */
  deleteTask: async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'archived' })
        .eq('id', taskId);
      if (error) throw error;
      set(state => {
        const { [taskId]: deleted, ...remainingTasks } = state.tasks;
        return { tasks: remainingTasks };
      });
      console.log(`📍 deleteTask - 成功歸檔任務 ${taskId}`);
      return true;
    } catch (error: any) {
      console.error('歸檔任務失敗:', error);
      set({ error: error.message || '歸檔任務失敗' });
      return false;
    }
  },

  /**
   * 還原歸檔的任務
   */
  restoreTask: async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'todo' })
        .eq('id', taskId);
      if (error) throw error;
      set(state => {
        const existingTask = state.tasks[taskId];
        if (existingTask) {
          return {
            tasks: { ...state.tasks, [taskId]: { ...existingTask, status: 'todo' } }
          };
        }
        return state;
      });
      console.log(`📍 restoreTask - 成功還原任務 ${taskId}`);
      return true;
    } catch (error: any) {
      console.error('還原任務失敗:', error);
      set({ error: error.message || '還原任務失敗' });
      return false;
    }
  },

  /**
   * 更新 Task 參考資訊
   */
  updateTaskReferenceInfo: async (taskId, referenceInfo) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ reference_info: referenceInfo })
        .eq('id', taskId);
      if (error) throw error;
      set(state => {
        const existingTask = state.tasks[taskId];
        if (existingTask) {
          return {
            tasks: { ...state.tasks, [taskId]: { ...existingTask, reference_info: referenceInfo } }
          };
        }
        return state;
      });
      return true;
    } catch (error: any) {
      console.error('更新 Task 參考資訊失敗:', error);
      set({ error: error.message || '更新 Task 參考資訊失敗' });
      return false;
    }
  },

  /**
   * 新增 Task 附件
   */
  addTaskAttachment: async (taskId, attachment) => {
    const state = get();
    const targetTask = state.tasks[taskId];
    if (!targetTask) return false;
    const newAttachment: ReferenceAttachment = {
      ...attachment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    const currentReferenceInfo = targetTask.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      attachments: [...currentReferenceInfo.attachments, newAttachment]
    };
    return await get().updateTaskReferenceInfo(taskId, updatedReferenceInfo);
  },

  /**
   * 移除 Task 附件
   */
  removeTaskAttachment: async (taskId, attachmentId) => {
    const state = get();
    const targetTask = state.tasks[taskId];
    if (!targetTask || !targetTask.reference_info) return false;
    const updatedReferenceInfo = {
      ...targetTask.reference_info,
      attachments: targetTask.reference_info.attachments.filter(a => a.id !== attachmentId)
    };
    return await get().updateTaskReferenceInfo(taskId, updatedReferenceInfo);
  },

  /**
   * 新增 Task 連結
   */
  addTaskLink: async (taskId, link) => {
    const state = get();
    const targetTask = state.tasks[taskId];
    if (!targetTask) return false;
    const newLink: ReferenceLink = {
      ...link,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    const currentReferenceInfo = targetTask.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      links: [...currentReferenceInfo.links, newLink]
    };
    return await get().updateTaskReferenceInfo(taskId, updatedReferenceInfo);
  },

  /**
   * 移除 Task 連結
   */
  removeTaskLink: async (taskId, linkId) => {
    const state = get();
    const targetTask = state.tasks[taskId];
    if (!targetTask || !targetTask.reference_info) return false;
    const updatedReferenceInfo = {
      ...targetTask.reference_info,
      links: targetTask.reference_info.links.filter(l => l.id !== linkId)
    };
    return await get().updateTaskReferenceInfo(taskId, updatedReferenceInfo);
  },

  /**
   * 標記任務為完成
   */
  markTaskCompleted: async (taskId, expectedVersion, requireRecord = true) => {
    try {
      // 這裡不檢查 hasRecord，直接 demo 實作
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      const updatedTask = await get().updateTask(taskId, expectedVersion, {
        status: 'done',
        completed_by: user.id
      });
      if (updatedTask) {
        // taskStore 已在 updateTask 中更新，不需要重複
        return { success: true, task: updatedTask };
      }
      return { success: false, message: '更新任務失敗' };
    } catch (error: any) {
      return { success: false, message: error.message || '標記任務完成失敗' };
    }
  },

  /**
   * 標記任務為進行中
   */
  markTaskInProgress: async (taskId, expectedVersion) => {
    try {
      const updatedTask = await get().updateTask(taskId, expectedVersion, {
        status: 'in_progress'
      });
      if (updatedTask) {
        // taskStore 已在 updateTask 中更新，不需要重複
        return { success: true, task: updatedTask };
      }
      return { success: false, message: '更新任務失敗' };
    } catch (error: any) {
      return { success: false, message: error.message || '標記任務進行中失敗' };
    }
  },

  /**
   * 標記任務為待辦
   */
  markTaskTodo: async (taskId, expectedVersion) => {
    try {
      const updatedTask = await get().updateTask(taskId, expectedVersion, {
        status: 'todo',
        completed_by: undefined,
        completed_at: undefined
      });
      if (updatedTask) {
        // taskStore 已在 updateTask 中更新，不需要重複
        return { success: true, task: updatedTask };
      }
      return { success: false, message: '更新任務失敗' };
    } catch (error: any) {
      return { success: false, message: error.message || '標記任務待辦失敗' };
    }
  },

  /**
   * 執行任務動作（打卡、計數等）
   * 注意：這個方法會在內部處理錯誤，但不會顯示 toast
   * 如需顯示統一錯誤處理，請在組件中使用 wrapAsync 包裝
   */
  performTaskAction: async (taskId, actionType, params) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      // 添加詳細的 console log 來幫助調試
      console.log('🔄 TaskStore.performTaskAction 開始:', {
        taskId,
        actionType,
        params,
        userId: user.id,
        today,
        timestamp: now.toISOString()
      });
      
      const { data, error } = await supabase.rpc('perform_task_action_transaction', {
        p_task_id: taskId,
        p_action_type: actionType,
        p_action_date: new Date(today),
        p_action_timestamp: now.toISOString(),
        p_user_id: user.id,
        p_action_data: params || {}
      });
      
      if (error) {
        console.error('❌ Supabase RPC 錯誤:', error);
        throw error;
      }
      
      const result = data;
      console.log('📊 RPC 回傳結果:', result);
      
      if (!result.success) {
        console.warn('⚠️ 任務動作失敗:', result.message);
        return { success: false, message: result.message };
      }
      
      if (result.task) {
        set(state => ({
          tasks: { ...state.tasks, [taskId]: result.task }
        }));
      }
      
      console.log('✅ 任務動作成功完成');
      return { success: true, task: result.task };
    } catch (error: any) {
      console.error('❌ TaskStore.performTaskAction 錯誤:', {
        error: error.message,
        stack: error.stack,
        taskId,
        actionType,
        params
      });
      return { success: false, message: error.message || '執行任務動作失敗' };
    }
  },

  checkInTask: async (taskId) => {
    return await get().performTaskAction(taskId, 'check_in');
  },

  addTaskCount: async (taskId, count) => {
    return await get().performTaskAction(taskId, 'add_count', { count });
  },

  addTaskAmount: async (taskId, amount, unit) => {
    return await get().performTaskAction(taskId, 'add_amount', { amount, unit });
  },

  resetTaskProgress: async (taskId) => {
    return await get().performTaskAction(taskId, 'reset');
  },

  cancelTodayCheckIn: async (taskId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('cancel_today_check_in_transaction', {
        p_task_id: taskId,
        p_user_id: user.id,
        p_today: today
      });
      if (error) throw error;
      const result = data;
      if (!result.success) {
        return { success: false, message: result.message };
      }
      if (result.task) {
        set(state => ({
          tasks: { ...state.tasks, [taskId]: result.task }
        }));
      }
      return { success: true, task: result.task };
    } catch (error: any) {
      return { success: false, message: error.message || '取消今日打卡失敗' };
    }
  },

  /**
   * 獲取用戶的所有活躍任務
   */
  getActiveTasksForUser: async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_tasks_for_user');
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      return [];
    }
  },

  getTaskCheckInRecords: async (taskIds, date) => {
    try {
      const { data, error } = await supabase
        .from('task_actions')
        .select('task_id, action_date, action_timestamp')
        .eq('action_type', 'check_in')
        .eq('action_date', date)
        .in('task_id', taskIds);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  getTodayTaskActivities: async () => {
    try {
      const { data, error } = await supabase.rpc('get_today_task_activities');
      if (error) throw error;
      return data || {
        statusChanges: [],
        checkIns: [],
        records: [],
        totalActivities: 0
      };
    } catch {
      return {
        statusChanges: [],
        checkIns: [],
        records: [],
        totalActivities: 0
      };
    }
  },

  getTaskActivitiesForDate: async (date) => {
    try {
      const { data, error } = await supabase.rpc('get_task_activities_for_date', {
        p_date: date
      });
      if (error) throw error;
      return data || {
        statusChanges: [],
        checkIns: [],
        records: [],
        totalActivities: 0
      };
    } catch {
      return {
        statusChanges: [],
        checkIns: [],
        records: [],
        totalActivities: 0
      };
    }
  },

  getTaskTodayActions: async (taskId) => {
    try {
      const { data, error } = await supabase.rpc('get_task_today_actions', {
        p_task_id: taskId
      });
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  hasTaskActivityToday: async (taskId) => {
    try {
      const { data, error } = await supabase.rpc('has_task_activity_today', {
        p_task_id: taskId
      });
      if (error) throw error;
      return data || false;
    } catch {
      return false;
    }
  },

  getDailyActivityStats: async (startDate, endDate) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      const { data, error } = await supabase.rpc('get_daily_activity_stats_v2', {
        p_user_id: user.id,
        p_start_date: startDate,
        p_end_date: endDate
      });
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  getTasksWithFullData: async (filters) => {
    try {
      // 如果有日期範圍且只需要完成的任務，使用 get_completed_tasks_for_week
      if (filters?.date_range && !filters.include_actions && !filters.include_records) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return [];
        }
        const { data, error } = await supabase.rpc('get_completed_tasks_for_week', {
          week_start: filters.date_range.start,
          week_end: filters.date_range.end,
          user_id: user.id
        });
        if (error) throw error;
        // 將數據轉換為期望的格式
        return (data || []).map((task: any) => ({
          id: task.id,
          title: task.title,
          status: 'done',
          completed_at: task.completed_at,
          difficulty: task.difficulty,
          topic_title: task.topic_title,
          // 添加其他必要的字段
          goal_id: '',
          order_index: 0,
          created_at: task.completed_at,
          updated_at: task.completed_at,
          version: 1
        }));
      }
      // 對於其他情況，使用直接的數據庫查詢
      return [];
    } catch (error) {
      return [];
    }
  },

  // 支援單日與區間查詢
  getUserTaskActivitiesForDateRange: async (startDate: string, endDate: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.rpc('get_user_task_activities_summary', {
      p_user_id: user!.id,
      p_week_start: startDate,
      p_week_end: endDate
    });
    if (error) throw error;
    return data;
  },

  // 原本的單日查詢也保留
  getUserTaskActivitiesForDate: async (date: string) => {
    const arr = await get().getUserTaskActivitiesForDateRange(date, date);
    // 從 daily_data 中取出當天的資料
    const dayData = arr && arr[0]?.daily_data?.[0];
    if (!dayData) {
      return {
        completed_tasks: [],
        checked_in_tasks: [],
        recorded_tasks: [],
        all_activities: []
      };
    }
    // 整理活動資料
    const activeTasks = dayData.active_tasks || [];
    const completedTasks = activeTasks.filter(task => task.type === 'completed').map(task => ({
      id: task.id,
      title: task.title,
      topic_title: task.subject,
      goal_title: task.goal_title,
      completed_at: task.completed_at,
      type: 'completed' as const
    }));
    const checkedInTasks = activeTasks.filter(task => task.type === 'check_in').map(task => ({
      id: task.id,
      title: task.title,
      topic_title: task.subject,
      goal_title: task.goal_title,
      action_timestamp: task.action_timestamp,
      action_data: task.action_data,
      type: 'check_in' as const
    }));
    const recordedTasks = activeTasks.filter(task => task.type === 'record').map(task => ({
      id: task.id,
      title: task.title,
      topic_title: task.subject,
      goal_title: task.goal_title,
      record_id: task.action_data?.record_id,
      created_at: task.action_timestamp,
      type: 'record' as const
    }));
    // 合併所有活動並按時間排序
    const allActivities = [...completedTasks, ...checkedInTasks, ...recordedTasks]
      .sort((a, b) => {
        const timeA = a.type === 'completed' ? a.completed_at :
                     a.type === 'check_in' ? a.action_timestamp :
                     a.created_at;
        const timeB = b.type === 'completed' ? b.completed_at :
                     b.type === 'check_in' ? b.action_timestamp :
                     b.created_at;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
    return {
      completed_tasks: completedTasks,
      checked_in_tasks: checkedInTasks,
      recorded_tasks: recordedTasks,
      all_activities: allActivities
    };
  },
  /**
   * 更新任務求助訊息
   */
  updateTaskHelp: async (taskId, needHelp, helpMessage) => {
    try {
      const updateData: Partial<Task> = { need_help: needHelp };
      if (needHelp && helpMessage) {
        updateData.help_message = helpMessage;
      } else if (!needHelp) {
        updateData.help_message = undefined;
      }
      const updated = await get().updateTask(taskId, 0, updateData); // version 請自行傳正確
      return !!updated;
    } catch (error: any) {
      return false;
    }
  },

  /**
   * 設定任務負責人
   */
  setTaskOwner: async (taskId, userId) => {
    try {
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update({ owner_id: userId })
        .eq('id', taskId)
        .select()
        .single();
      if (error) return null;
      set(state => {
        const existingTask = state.tasks[taskId];
        if (existingTask) {
          return {
            tasks: { ...state.tasks, [taskId]: { ...existingTask, owner_id: userId } }
          };
        }
        return state;
      });
      return updatedTask as Task;
    } catch (error: any) {
      return null;
    }
  },

  /**
   * 添加任務協作者
   */
  addTaskCollaborator: async (taskId, userId) => {
    try {
      const { data: currentTask, error: getError } = await supabase
        .from('tasks')
        .select('collaborator_ids')
        .eq('id', taskId)
        .single();
      if (getError) return false;
      const currentCollaborators = currentTask.collaborator_ids || [];
      if (currentCollaborators.includes(userId)) return true;
      const updatedCollaborators = [...currentCollaborators, userId];
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ collaborator_ids: updatedCollaborators })
        .eq('id', taskId);
      if (updateError) return false;
      set(state => {
        const existingTask = state.tasks[taskId];
        if (existingTask) {
          return {
            tasks: { ...state.tasks, [taskId]: { ...existingTask, collaborator_ids: updatedCollaborators } }
          };
        }
        return state;
      });
      return true;
    } catch (error: any) {
      return false;
    }
  },

  /**
   * 移除任務協作者
   */
  removeTaskCollaborator: async (taskId, userId) => {
    try {
      const { data: currentTask, error: getError } = await supabase
        .from('tasks')
        .select('collaborator_ids')
        .eq('id', taskId)
        .single();
      if (getError) return false;
      const currentCollaborators = currentTask.collaborator_ids || [];
      if (!currentCollaborators.includes(userId)) return true;
      const updatedCollaborators = currentCollaborators.filter((id: string) => id !== userId);
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ collaborator_ids: updatedCollaborators })
        .eq('id', taskId);
      if (updateError) return false;
      set(state => {
        const existingTask = state.tasks[taskId];
        if (existingTask) {
          return {
            tasks: { ...state.tasks, [taskId]: { ...existingTask, collaborator_ids: updatedCollaborators } }
          };
        }
        return state;
      });
      return true;
    } catch (error: any) {
      return false;
    }
  },

  /**
   * 重新排序任務
   */
  reorderTasks: async (goalId, taskIds) => {
    try {
      for (let i = 0; i < taskIds.length; i++) {
        const taskId = taskIds[i];
        await get().updateTask(taskId, 0, { order_index: i }); // version 請自行傳正確
      }
      // 不 reload，直接假設成功
      return true;
    } catch (error: any) {
      return false;
    }
  },
}));
