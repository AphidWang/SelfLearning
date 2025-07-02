/**
 * Topic Store - 正規化表格結構 + 版本控制版本
 * 
 * 🏗️ 架構改動：
 * - 從 JSONB 結構改為正規化三層表格：topics_new -> goals -> tasks
 * - 每一層都有獨立的版本控制，使用樂觀鎖定避免並發衝突
 * - 保留現有 API 接口，確保 UI 組件不需要大幅修改
 * 
 * 🔄 版本控制策略：
 * - 更新時檢查版本號，版本不匹配就返回錯誤
 * - 使用 safe_update_* 函數進行樂觀鎖定
 * - 錯誤時提示用戶重新載入數據
 * 
 * 📊 性能優化：
 * - TaskWall 使用 get_active_tasks_for_user() 函數快速查詢
 * - 避免在前端進行大量 JSON 遍歷
 * - 支援精確的 JOIN 查詢
 */

import { create } from 'zustand';
import { 
  User, Topic, Goal, Task, Bubble, GoalStatus, TaskStatus, TaskPriority,
  CreateTopicFromTemplateParams, SafeUpdateResult, TopicWithStructure, ActiveTaskResult
} from '../types/goal';
import type { TopicCollaborator } from '@self-learning/types';
import { supabase, authService } from '../services/supabase';
import { useUserStore } from './userStore';
import { taskRecordStore } from './taskRecordStore';

// Result 型別定義
export type MarkTaskResult = 
  | { success: true; task: Task }
  | { success: false; message: string; requiresRecord?: boolean };

// 版本衝突錯誤類型
export class VersionConflictError extends Error {
  constructor(
    message: string,
    public currentVersion: number,
    public expectedVersion: number
  ) {
    super(message);
    this.name = 'VersionConflictError';
  }
}

interface TopicStore {
  // 狀態
  topics: Topic[];
  selectedTopicId: string | null;
  loading: boolean;
  error: string | null;
  syncing: boolean;

  // === 核心 CRUD 操作（使用新表格結構） ===
  
  // Topics 操作
  fetchTopics: () => Promise<void>;
  getTopic: (id: string) => Promise<Topic | null>;
  createTopic: (topic: Omit<Topic, 'id' | 'owner_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Topic | null>;
  updateTopic: (id: string, expectedVersion: number, updates: Partial<Topic>) => Promise<Topic | null>;
  deleteTopic: (id: string) => Promise<boolean>;
  
  // Goals 操作
  addGoal: (topicId: string, goal: Omit<Goal, 'id' | 'topic_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Goal | null>;
  updateGoal: (goalId: string, expectedVersion: number, updates: Partial<Goal>) => Promise<Goal | null>;
  deleteGoal: (goalId: string) => Promise<boolean>;
  
  // Tasks 操作
  addTask: (goalId: string, task: Omit<Task, 'id' | 'goal_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  updateTask: (taskId: string, expectedVersion: number, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;

  // === 專門的狀態切換函數（推薦使用） ===
  markTaskCompleted: (taskId: string, expectedVersion: number, requireRecord?: boolean) => Promise<MarkTaskResult>;
  markTaskInProgress: (taskId: string, expectedVersion: number) => Promise<MarkTaskResult>;
  markTaskTodo: (taskId: string, expectedVersion: number) => Promise<MarkTaskResult>;

  // === 快速查詢函數（性能優化） ===
  getActiveTasksForUser: () => Promise<ActiveTaskResult[]>;
  getTopicWithStructure: (topicId: string) => Promise<TopicWithStructure | null>;

  // === 兼容性 API（保持舊接口） ===
  addTopic: (topic: Omit<Topic, 'id' | 'owner_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Topic | null>;
  fetchMyTopics: () => Promise<void>;
  fetchCollaborativeTopics: () => Promise<void>;
  createTopicFromTemplate: (params: CreateTopicFromTemplateParams) => Promise<Topic | null>;
  
  // 協作功能（兼容舊 API）
  addCollaborator: (topicId: string, userId: string, permission: 'view' | 'edit') => Promise<boolean>;
  removeCollaborator: (topicId: string, userId: string) => Promise<boolean>;
  getCollaborators: (topicId: string) => Promise<User[]>;
  
  // 計算和工具方法
  getCompletionRate: (topicId: string) => number;
  calculateProgress: (topic: Topic) => number;
  hasTaskRecord: (taskId: string) => Promise<boolean>;
  
  // 狀態管理
  setSelectedTopicId: (id: string | null) => void;
  clearError: () => void;
  setSyncing: (syncing: boolean) => void;
  reset: () => void;
  refreshTopic: (id: string) => Promise<void>;
}

export const useTopicStore = create<TopicStore>((set, get) => ({
  // 初始狀態
  topics: [],
  selectedTopicId: null,
  loading: false,
  error: null,
  syncing: false,

  // === 核心 CRUD 操作 ===

  /**
   * 獲取用戶的所有主題（包含完整結構）
   */
  fetchTopics: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      // 查詢用戶擁有的主題
      const { data: ownTopics, error: ownError } = await supabase
        .from('topics_new')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      if (ownError) throw ownError;

      // 查詢協作主題
      const { data: collabTopics, error: collabError } = await supabase
        .from('topics_new')
        .select(`
          *,
          topic_collaborators!inner(*)
        `)
        .eq('topic_collaborators.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (collabError) throw collabError;

      // 合併並去重主題
      const allTopics = [...(ownTopics || []), ...(collabTopics || [])];
      const uniqueTopics = allTopics.filter((topic, index, self) =>
        index === self.findIndex((t) => t.id === topic.id)
      );

      // 為每個主題獲取完整結構
      const topicsWithStructure = await Promise.all(
        uniqueTopics.map(async (topic) => {
          // 獲取 goals
          const { data: goals, error: goalsError } = await supabase
            .from('goals')
            .select('*')
            .eq('topic_id', topic.id)
            .eq('status', 'active')
            .order('order_index', { ascending: true });

          if (goalsError) {
            console.warn(`獲取主題 ${topic.id} 的目標失敗:`, goalsError);
            return { ...topic, goals: [], progress: 0 };
          }

          // 為每個 goal 獲取 tasks
          const goalsWithTasks = await Promise.all(
            (goals || []).map(async (goal) => {
              const { data: tasks, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('goal_id', goal.id)
                .neq('status', 'archived')
                .order('order_index', { ascending: true });

              if (tasksError) {
                console.warn(`獲取目標 ${goal.id} 的任務失敗:`, tasksError);
                return { ...goal, tasks: [] };
              }

              return { ...goal, tasks: tasks || [] };
            })
          );

          // 計算進度
          const allTasks = goalsWithTasks.flatMap(g => g.tasks || []);
          const completedTasks = allTasks.filter(t => t.status === 'done');
          const progress = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

          return {
            ...topic,
            goals: goalsWithTasks,
            progress
          };
        })
      );

      set({ topics: topicsWithStructure, loading: false });
    } catch (error: any) {
      console.error('獲取主題失敗:', error);
      set({ loading: false, error: error.message || '獲取主題失敗' });
    }
  },

  /**
   * 獲取單一主題的完整結構
   */
  getTopic: async (id: string) => {
    try {
      const { data, error } = await supabase.rpc('get_topic_with_structure', {
        p_topic_id: id
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const result = data[0];
      return {
        ...result.topic_data,
        goals: result.goals_data || [],
        tasks: result.tasks_data || []
      };
    } catch (error: any) {
      console.error('獲取主題失敗:', error);
      set({ error: error.message || '獲取主題失敗' });
      return null;
    }
  },

  /**
   * 創建新主題
   */
  createTopic: async (topicData) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const { data, error } = await supabase
        .from('topics_new')
        .insert([{
          ...topicData,
          owner_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const newTopic = { ...data, goals: [], progress: 0 };
      
      // 更新本地狀態
      set(state => ({
        topics: [newTopic, ...state.topics],
        loading: false
      }));

      return newTopic;
    } catch (error: any) {
      console.error('創建主題失敗:', error);
      set({ loading: false, error: error.message || '創建主題失敗' });
      return null;
    }
  },

  /**
   * 更新主題（帶版本控制）
   */
  updateTopic: async (id: string, expectedVersion: number, updates: Partial<Topic>) => {
    try {
      const { data, error } = await supabase.rpc('safe_update_topic', {
        p_id: id,
        p_expected_version: expectedVersion,
        p_title: updates.title,
        p_description: updates.description,
        p_status: updates.status,
        p_subject: updates.subject,
        p_category: updates.category,
        p_is_collaborative: updates.is_collaborative,
        p_show_avatars: updates.show_avatars,
        p_due_date: updates.due_date,
        p_focus_element: updates.focus_element,
        p_bubbles: updates.bubbles
      });

      if (error) throw error;
      
      const result = data[0] as SafeUpdateResult;
      
      if (!result.success) {
        if (result.message === 'Version conflict detected') {
          throw new VersionConflictError(
            '主題已被其他用戶修改，請重新載入',
            result.current_version,
            expectedVersion
          );
        }
        throw new Error(result.message);
      }

      // 重新獲取完整的主題數據
      const updatedTopic = await get().getTopic(id);
      if (updatedTopic) {
        set(state => ({
          topics: state.topics.map(t => t.id === id ? updatedTopic : t)
        }));
        return updatedTopic;
      }

      return null;
    } catch (error: any) {
      console.error('更新主題失敗:', error);
      set({ error: error.message || '更新主題失敗' });
      throw error;
    }
  },

  /**
   * 刪除主題
   */
  deleteTopic: async (id: string) => {
    try {
      const { error } = await supabase
        .from('topics_new')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.filter(t => t.id !== id)
      }));

      return true;
    } catch (error: any) {
      console.error('刪除主題失敗:', error);
      set({ error: error.message || '刪除主題失敗' });
      return false;
    }
  },

  /**
   * 添加目標
   */
  addGoal: async (topicId: string, goalData) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([{
          ...goalData,
          topic_id: topicId
        }])
        .select()
        .single();

      if (error) throw error;

      const newGoal = { ...data, tasks: [] };

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(topic => 
          topic.id === topicId 
            ? { ...topic, goals: [...(topic.goals || []), newGoal] }
            : topic
        )
      }));

      return newGoal;
    } catch (error: any) {
      console.error('添加目標失敗:', error);
      set({ error: error.message || '添加目標失敗' });
      return null;
    }
  },

  /**
   * 更新目標（帶版本控制）
   */
  updateGoal: async (goalId: string, expectedVersion: number, updates: Partial<Goal>) => {
    try {
      const { data, error } = await supabase.rpc('safe_update_goal', {
        p_id: goalId,
        p_expected_version: expectedVersion,
        p_title: updates.title,
        p_description: updates.description,
        p_status: updates.status,
        p_priority: updates.priority,
        p_order_index: updates.order_index
      });

      if (error) throw error;
      
      const result = data[0] as SafeUpdateResult;
      
      if (!result.success) {
        if (result.message === 'Version conflict detected') {
          throw new VersionConflictError(
            '目標已被其他用戶修改，請重新載入',
            result.current_version,
            expectedVersion
          );
        }
        throw new Error(result.message);
      }

      // 重新獲取目標數據
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError) throw goalError;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(topic => ({
          ...topic,
          goals: (topic.goals || []).map(goal => 
            goal.id === goalId ? { ...goal, ...goalData } : goal
          )
        }))
      }));

      return goalData;
    } catch (error: any) {
      console.error('更新目標失敗:', error);
      set({ error: error.message || '更新目標失敗' });
      throw error;
    }
  },

  /**
   * 刪除目標
   */
  deleteGoal: async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(topic => ({
          ...topic,
          goals: (topic.goals || []).filter(goal => goal.id !== goalId)
        }))
      }));

      return true;
    } catch (error: any) {
      console.error('刪除目標失敗:', error);
      set({ error: error.message || '刪除目標失敗' });
      return false;
    }
  },

  /**
   * 添加任務
   */
  addTask: async (goalId: string, taskData) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          goal_id: goalId
        }])
        .select()
        .single();

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(topic => ({
          ...topic,
          goals: (topic.goals || []).map(goal => 
            goal.id === goalId 
              ? { ...goal, tasks: [...(goal.tasks || []), data] }
              : goal
          )
        }))
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
  updateTask: async (taskId: string, expectedVersion: number, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase.rpc('safe_update_task', {
        p_id: taskId,
        p_expected_version: expectedVersion,
        p_title: updates.title,
        p_description: updates.description,
        p_status: updates.status,
        p_priority: updates.priority,
        p_order_index: updates.order_index,
        p_need_help: updates.need_help,
        p_help_message: updates.help_message,
        p_reply_message: updates.reply_message,
        p_replied_by: updates.replied_by,
        p_completed_by: updates.completed_by,
        p_estimated_minutes: updates.estimated_minutes,
        p_actual_minutes: updates.actual_minutes
      });

      if (error) throw error;
      
      const result = data[0] as SafeUpdateResult;
      
      if (!result.success) {
        if (result.message === 'Version conflict detected') {
          throw new VersionConflictError(
            '任務已被其他用戶修改，請重新載入',
            result.current_version,
            expectedVersion
          );
        }
        throw new Error(result.message);
      }

      // 重新獲取任務數據
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(topic => ({
          ...topic,
          goals: (topic.goals || []).map(goal => ({
            ...goal,
            tasks: (goal.tasks || []).map(task => 
              task.id === taskId ? { ...task, ...taskData } : task
            )
          }))
        }))
      }));

      return taskData;
    } catch (error: any) {
      console.error('更新任務失敗:', error);
      set({ error: error.message || '更新任務失敗' });
      throw error;
    }
  },

  /**
   * 刪除任務
   */
  deleteTask: async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(topic => ({
          ...topic,
          goals: (topic.goals || []).map(goal => ({
            ...goal,
            tasks: (goal.tasks || []).filter(task => task.id !== taskId)
          }))
        }))
      }));

      return true;
    } catch (error: any) {
      console.error('刪除任務失敗:', error);
      set({ error: error.message || '刪除任務失敗' });
      return false;
    }
  },

  // === 專門的狀態切換函數 ===

  /**
   * 標記任務為完成
   */
  markTaskCompleted: async (taskId: string, expectedVersion: number, requireRecord = true) => {
    try {
      // 檢查是否需要學習記錄
      if (requireRecord) {
        const hasRecord = await get().hasTaskRecord(taskId);
        if (!hasRecord) {
          return {
            success: false,
            message: '請先記錄學習心得',
            requiresRecord: true
          };
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const updatedTask = await get().updateTask(taskId, expectedVersion, {
        status: 'done',
        completed_by: user.id,
        completed_at: new Date().toISOString()
      });

      if (updatedTask) {
        return { success: true, task: updatedTask };
      }

      return { success: false, message: '更新任務失敗' };
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        return { success: false, message: error.message };
      }
      return { success: false, message: error.message || '標記任務完成失敗' };
    }
  },

  /**
   * 標記任務為進行中
   */
  markTaskInProgress: async (taskId: string, expectedVersion: number) => {
    try {
      const updatedTask = await get().updateTask(taskId, expectedVersion, {
        status: 'in_progress'
      });

      if (updatedTask) {
        return { success: true, task: updatedTask };
      }

      return { success: false, message: '更新任務失敗' };
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        return { success: false, message: error.message };
      }
      return { success: false, message: error.message || '標記任務進行中失敗' };
    }
  },

  /**
   * 標記任務為待辦
   */
  markTaskTodo: async (taskId: string, expectedVersion: number) => {
    try {
      const updatedTask = await get().updateTask(taskId, expectedVersion, {
        status: 'todo',
        completed_at: undefined,
        completed_by: undefined
      });

      if (updatedTask) {
        return { success: true, task: updatedTask };
      }

      return { success: false, message: '更新任務失敗' };
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        return { success: false, message: error.message };
      }
      return { success: false, message: error.message || '標記任務待辦失敗' };
    }
  },

  // === 快速查詢函數 ===

  /**
   * 獲取用戶的所有活躍任務（用於 TaskWall）
   */
  getActiveTasksForUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const { data, error } = await supabase.rpc('get_active_tasks_for_user', {
        p_user_id: user.id
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('獲取活躍任務失敗:', error);
      set({ error: error.message || '獲取活躍任務失敗' });
      return [];
    }
  },

  /**
   * 獲取主題的完整結構
   */
  getTopicWithStructure: async (topicId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_topic_with_structure', {
        p_topic_id: topicId
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data[0];
    } catch (error: any) {
      console.error('獲取主題結構失敗:', error);
      set({ error: error.message || '獲取主題結構失敗' });
      return null;
    }
  },

  // === 兼容性 API ===

  addTopic: async (topicData) => {
    return get().createTopic(topicData);
  },

  fetchMyTopics: async () => {
    return get().fetchTopics();
  },

  fetchCollaborativeTopics: async () => {
    return get().fetchTopics();
  },

  createTopicFromTemplate: async (params) => {
    // TODO: 實作從模板創建主題
    console.warn('createTopicFromTemplate 尚未實作');
    return null;
  },

  addCollaborator: async (topicId: string, userId: string, permission: 'view' | 'edit') => {
    try {
      const { error } = await supabase
        .from('topic_collaborators')
        .insert([{
          topic_id: topicId,
          user_id: userId,
          permission,
          invited_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      return !error;
    } catch (error) {
      console.error('添加協作者失敗:', error);
      return false;
    }
  },

  removeCollaborator: async (topicId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('topic_collaborators')
        .delete()
        .eq('topic_id', topicId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('移除協作者失敗:', error);
      return false;
    }
  },

  getCollaborators: async (topicId: string) => {
    try {
      // TODO: 實作獲取協作者列表
      return [];
    } catch (error) {
      console.error('獲取協作者失敗:', error);
      return [];
    }
  },

  // === 計算和工具方法 ===

  getCompletionRate: (topicId: string) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic || !topic.goals) return 0;

    const allTasks = topic.goals.flatMap(g => g.tasks || []);
    if (allTasks.length === 0) return 0;

    const completedTasks = allTasks.filter(t => t.status === 'done');
    return Math.round((completedTasks.length / allTasks.length) * 100);
  },

  calculateProgress: (topic: Topic) => {
    if (!topic.goals) return 0;

    const allTasks = topic.goals.flatMap(g => g.tasks || []);
    if (allTasks.length === 0) return 0;

    const completedTasks = allTasks.filter(t => t.status === 'done');
    return Math.round((completedTasks.length / allTasks.length) * 100);
  },

  hasTaskRecord: async (taskId: string) => {
    try {
      return await taskRecordStore.hasRecord(taskId);
    } catch (error) {
      console.error('檢查任務記錄失敗:', error);
      return false;
    }
  },

  // === 狀態管理 ===

  setSelectedTopicId: (id: string | null) => {
    set({ selectedTopicId: id });
  },

  clearError: () => {
    set({ error: null });
  },

  setSyncing: (syncing: boolean) => {
    set({ syncing });
  },

  reset: () => {
    set({
      topics: [],
      selectedTopicId: null,
      loading: false,
      error: null,
      syncing: false
    });
  },

  refreshTopic: async (id: string) => {
    const topic = await get().getTopic(id);
    if (topic) {
      set(state => ({
        topics: state.topics.map(t => t.id === id ? topic : t)
      }));
    }
  }
})); 