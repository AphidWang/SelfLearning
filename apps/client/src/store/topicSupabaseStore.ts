/**
 * Topic Supabase Store - 基於 Supabase 的學習主題管理
 * 
 * 功能說明：
 * 1. 管理學生的學習主題 (從 TopicTemplate 建立或自創)
 * 2. 支援主題的 CRUD 操作
 * 3. 支援主題協作功能
 * 4. 與 Supabase 資料庫同步
 * 5. 權限控制和資料安全
 * 6. 從 TopicTemplate 建立新主題
 * 
 * 架構設計：
 * - 所有資料存儲在 Supabase
 * - 使用 RLS (Row Level Security) 控制權限
 * - 支援即時協作和權限管理
 * - 整合 TopicTemplate 系統
 */

import { create } from 'zustand';
import type { 
  Topic,
  TopicWithSupabase, 
  TopicCollaborator, 
  CreateTopicFromTemplateParams,
  Goal,
  Task,
  Bubble,
  GoalStatus,
  User 
} from '../types/goal';
import { supabase } from '../services/supabase';

interface TopicSupabaseStore {
  // 狀態
  topics: TopicWithSupabase[];
  selectedTopicId: string | null;
  loading: boolean;
  error: string | null;

  // 基本 CRUD 操作
  fetchTopics: () => Promise<void>;
  fetchMyTopics: () => Promise<void>;
  fetchCollaborativeTopics: () => Promise<void>;
  getTopic: (id: string) => Promise<TopicWithSupabase | null>;
  createTopic: (topic: Omit<TopicWithSupabase, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<TopicWithSupabase | null>;
  createTopicFromTemplate: (params: CreateTopicFromTemplateParams) => Promise<TopicWithSupabase | null>;
  updateTopic: (id: string, updates: Partial<TopicWithSupabase>) => Promise<TopicWithSupabase | null>;
  deleteTopic: (id: string) => Promise<boolean>;

  // 協作功能
  addCollaborator: (topicId: string, userId: string, permission: 'view' | 'edit') => Promise<boolean>;
  removeCollaborator: (topicId: string, userId: string) => Promise<boolean>;
  updateCollaboratorPermission: (topicId: string, userId: string, permission: 'view' | 'edit') => Promise<boolean>;
  getCollaborators: (topicId: string) => Promise<TopicCollaborator[]>;

  // 內容管理
  addGoal: (topicId: string, goal: Omit<Goal, 'id'>) => Promise<Goal | null>;
  updateGoal: (topicId: string, goalId: string, updates: Partial<Goal>) => Promise<Goal | null>;
  deleteGoal: (topicId: string, goalId: string) => Promise<boolean>;
  addTask: (topicId: string, goalId: string, task: Omit<Task, 'id'>) => Promise<Task | null>;
  updateTask: (topicId: string, goalId: string, taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (topicId: string, goalId: string, taskId: string) => Promise<boolean>;
  addBubble: (topicId: string, bubble: Omit<Bubble, 'id'>) => Promise<Bubble | null>;
  updateBubble: (topicId: string, bubbleId: string, updates: Partial<Bubble>) => Promise<Bubble | null>;
  deleteBubble: (topicId: string, bubbleId: string) => Promise<boolean>;

  // 主題狀態管理
  setTopicStatus: (topicId: string, status: Topic['status']) => Promise<boolean>;
  setFocusElement: (topicId: string, focusElement: { type: 'goal' | 'task', id: string } | undefined) => Promise<boolean>;
  updateProgress: (topicId: string) => Promise<boolean>; // 自動計算並更新進度

  // 協作功能
  toggleTopicCollaborative: (topicId: string) => Promise<boolean>;
  toggleAvatarDisplay: (topicId: string) => Promise<boolean>;

  // 工具方法
  setSelectedTopicId: (id: string | null) => void;
  clearError: () => void;
  refreshTopic: (id: string) => Promise<void>;
  calculateProgress: (topic: TopicWithSupabase) => number; // 計算完成率
}

export const useTopicSupabaseStore = create<TopicSupabaseStore>((set, get) => ({
  // 初始狀態
  topics: [],
  selectedTopicId: null,
  loading: false,
  error: null,

  // 基本 CRUD 操作
  fetchTopics: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          topic_collaborators (
            id,
            user_id,
            permission,
            invited_by,
            invited_at
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const topics = data?.map(topic => ({
        ...topic,
        topic_collaborators: topic.topic_collaborators || []
      })) || [];

      set({ topics, loading: false });
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch topics', loading: false });
    }
  },

  fetchMyTopics: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          topic_collaborators (
            id,
            user_id,
            permission,
            invited_by,
            invited_at
          )
        `)
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const topics = data?.map(topic => ({
        ...topic,
        topic_collaborators: topic.topic_collaborators || []
      })) || [];

      set({ topics, loading: false });
    } catch (error) {
      console.error('Failed to fetch my topics:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch my topics', loading: false });
    }
  },

  fetchCollaborativeTopics: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          topic_collaborators!inner (
            id,
            user_id,
            permission,
            invited_by,
            invited_at
          )
        `)
        .eq('topic_collaborators.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const topics = data?.map(topic => ({
        ...topic,
        topic_collaborators: topic.topic_collaborators || []
      })) || [];

      set({ topics, loading: false });
    } catch (error) {
      console.error('Failed to fetch collaborative topics:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch collaborative topics', loading: false });
    }
  },

  getTopic: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          topic_collaborators (
            id,
            user_id,
            permission,
            invited_by,
            invited_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        topic_collaborators: data.topic_collaborators || []
      };
    } catch (error) {
      console.error('Failed to get topic:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to get topic' });
      return null;
    }
  },

  createTopic: async (topicData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('topics')
        .insert({
          ...topicData,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // 更新本地狀態
      const newTopic = { ...data, topic_collaborators: [] };
      set(state => ({
        topics: [newTopic, ...state.topics]
      }));

      return newTopic;
    } catch (error) {
      console.error('Failed to create topic:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create topic' });
      return null;
    }
  },

  createTopicFromTemplate: async (params) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 先取得模板資料
      const { data: templateData, error: templateError } = await supabase
        .from('topic_templates')
        .select('*')
        .eq('id', params.template_id)
        .single();

      if (templateError) throw templateError;
      if (!templateData) throw new Error('Template not found');

      // 從模板建立新主題
      const { data, error } = await supabase
        .from('topics')
        .insert({
          title: params.title || templateData.title,
          description: params.description || templateData.description,
          subject: templateData.subject,
          category: templateData.category,
          goals: templateData.goals,
          bubbles: templateData.bubbles,
          template_id: params.template_id,
          template_version: 1, // TODO: 實作版本控制
          owner_id: user.id,
          is_collaborative: params.is_collaborative || false,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // 更新模板使用次數
      await supabase
        .from('topic_templates')
        .update({ usage_count: templateData.usage_count + 1 })
        .eq('id', params.template_id);

      // 更新本地狀態
      const newTopic = { ...data, topic_collaborators: [] };
      set(state => ({
        topics: [newTopic, ...state.topics]
      }));

      return newTopic;
    } catch (error) {
      console.error('Failed to create topic from template:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create topic from template' });
      return null;
    }
  },

  updateTopic: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(topic =>
          topic.id === id 
            ? { ...topic, ...data }
            : topic
        )
      }));

      return data;
    } catch (error) {
      console.error('Failed to update topic:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update topic' });
      return null;
    }
  },

  deleteTopic: async (id) => {
    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.filter(topic => topic.id !== id),
        selectedTopicId: state.selectedTopicId === id ? null : state.selectedTopicId
      }));

      return true;
    } catch (error) {
      console.error('Failed to delete topic:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete topic' });
      return false;
    }
  },

  // 協作功能
  addCollaborator: async (topicId, userId, permission) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('topic_collaborators')
        .insert({
          topic_id: topicId,
          user_id: userId,
          permission,
          invited_by: user.id
        });

      if (error) throw error;

      // 重新取得主題資料以更新協作者列表
      await get().refreshTopic(topicId);
      return true;
    } catch (error) {
      console.error('Failed to add collaborator:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add collaborator' });
      return false;
    }
  },

  removeCollaborator: async (topicId, userId) => {
    try {
      const { error } = await supabase
        .from('topic_collaborators')
        .delete()
        .eq('topic_id', topicId)
        .eq('user_id', userId);

      if (error) throw error;

      // 重新取得主題資料以更新協作者列表
      await get().refreshTopic(topicId);
      return true;
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to remove collaborator' });
      return false;
    }
  },

  updateCollaboratorPermission: async (topicId, userId, permission) => {
    try {
      const { error } = await supabase
        .from('topic_collaborators')
        .update({ permission })
        .eq('topic_id', topicId)
        .eq('user_id', userId);

      if (error) throw error;

      // 重新取得主題資料以更新協作者列表
      await get().refreshTopic(topicId);
      return true;
    } catch (error) {
      console.error('Failed to update collaborator permission:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update collaborator permission' });
      return false;
    }
  },

  getCollaborators: async (topicId) => {
    try {
      const { data, error } = await supabase
        .from('topic_collaborators')
        .select('*')
        .eq('topic_id', topicId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get collaborators:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to get collaborators' });
      return [];
    }
  },

  // 內容管理 (Goal, Task, Bubble 操作)
  addGoal: async (topicId, goalData) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const newGoal = {
        ...goalData,
        id: crypto.randomUUID()
      };

      const updatedGoals = [...topic.goals, newGoal];

      const { error } = await supabase
        .from('topics')
        .update({ goals: updatedGoals })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, goals: updatedGoals }
            : t
        )
      }));

      return newGoal;
    } catch (error) {
      console.error('Failed to add goal:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add goal' });
      return null;
    }
  },

  updateGoal: async (topicId, goalId, updates) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      );

      const { error } = await supabase
        .from('topics')
        .update({ goals: updatedGoals })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, goals: updatedGoals }
            : t
        )
      }));

      const updatedGoal = updatedGoals.find(g => g.id === goalId);
      return updatedGoal || null;
    } catch (error) {
      console.error('Failed to update goal:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update goal' });
      return null;
    }
  },

  deleteGoal: async (topicId, goalId) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedGoals = topic.goals.filter(goal => goal.id !== goalId);

      const { error } = await supabase
        .from('topics')
        .update({ goals: updatedGoals })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, goals: updatedGoals }
            : t
        )
      }));

      return true;
    } catch (error) {
      console.error('Failed to delete goal:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete goal' });
      return false;
    }
  },

  addTask: async (topicId, goalId, taskData) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const newTask = {
        ...taskData,
        id: crypto.randomUUID()
      };

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId
          ? { ...goal, tasks: [...goal.tasks, newTask] }
          : goal
      );

      const { error } = await supabase
        .from('topics')
        .update({ goals: updatedGoals })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, goals: updatedGoals }
            : t
        )
      }));

      return newTask;
    } catch (error) {
      console.error('Failed to add task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add task' });
      return null;
    }
  },

  updateTask: async (topicId, goalId, taskId, updates) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              tasks: goal.tasks.map(task =>
                task.id === taskId ? { ...task, ...updates } : task
              )
            }
          : goal
      );

      const { error } = await supabase
        .from('topics')
        .update({ goals: updatedGoals })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, goals: updatedGoals }
            : t
        )
      }));

      // 找到並返回更新後的任務
      const updatedGoal = updatedGoals.find(g => g.id === goalId);
      const updatedTask = updatedGoal?.tasks.find(t => t.id === taskId);
      return updatedTask || null;
    } catch (error) {
      console.error('Failed to update task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update task' });
      return null;
    }
  },

  deleteTask: async (topicId, goalId, taskId) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId
          ? { ...goal, tasks: goal.tasks.filter(task => task.id !== taskId) }
          : goal
      );

      const { error } = await supabase
        .from('topics')
        .update({ goals: updatedGoals })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, goals: updatedGoals }
            : t
        )
      }));

      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete task' });
      return false;
    }
  },

  addBubble: async (topicId, bubbleData) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const newBubble = {
        ...bubbleData,
        id: crypto.randomUUID()
      };

      const updatedBubbles = [...(topic.bubbles || []), newBubble];

      const { error } = await supabase
        .from('topics')
        .update({ bubbles: updatedBubbles })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, bubbles: updatedBubbles }
            : t
        )
      }));

      return newBubble;
    } catch (error) {
      console.error('Failed to add bubble:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add bubble' });
      return null;
    }
  },

  updateBubble: async (topicId, bubbleId, updates) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedBubbles = (topic.bubbles || []).map(bubble =>
        bubble.id === bubbleId ? { ...bubble, ...updates } : bubble
      );

      const { error } = await supabase
        .from('topics')
        .update({ bubbles: updatedBubbles })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, bubbles: updatedBubbles }
            : t
        )
      }));

      const updatedBubble = updatedBubbles.find(b => b.id === bubbleId);
      return updatedBubble || null;
    } catch (error) {
      console.error('Failed to update bubble:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update bubble' });
      return null;
    }
  },

  deleteBubble: async (topicId, bubbleId) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedBubbles = (topic.bubbles || []).filter(bubble => bubble.id !== bubbleId);

      const { error } = await supabase
        .from('topics')
        .update({ bubbles: updatedBubbles })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, bubbles: updatedBubbles }
            : t
        )
      }));

      return true;
    } catch (error) {
      console.error('Failed to delete bubble:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete bubble' });
      return false;
    }
  },

  // 主題狀態管理
  setTopicStatus: async (topicId, status) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ status })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, status }
            : t
        )
      }));

      return true;
    } catch (error) {
      console.error('Failed to set topic status:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to set topic status' });
      return false;
    }
  },

  setFocusElement: async (topicId, focusElement) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ focus_element: focusElement })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, focus_element: focusElement }
            : t
        )
      }));

      return true;
    } catch (error) {
      console.error('Failed to set focus element:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to set focus element' });
      return false;
    }
  },

  updateProgress: async (topicId) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const progress = get().calculateProgress(topic);

      const { error } = await supabase
        .from('topics')
        .update({ progress })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, progress }
            : t
        )
      }));

      return true;
    } catch (error) {
      console.error('Failed to update progress:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update progress' });
      return false;
    }
  },

  // 協作功能
  toggleTopicCollaborative: async (topicId) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const { error } = await supabase
        .from('topics')
        .update({ is_collaborative: !topic.is_collaborative })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, is_collaborative: !t.is_collaborative }
            : t
        )
      }));

      return true;
    } catch (error) {
      console.error('Failed to toggle collaborative:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to toggle collaborative' });
      return false;
    }
  },

  toggleAvatarDisplay: async (topicId) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const { error } = await supabase
        .from('topics')
        .update({ show_avatars: !topic.show_avatars })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t =>
          t.id === topicId
            ? { ...t, show_avatars: !t.show_avatars }
            : t
        )
      }));

      return true;
    } catch (error) {
      console.error('Failed to toggle avatar display:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to toggle avatar display' });
      return false;
    }
  },

  // 工具方法
  setSelectedTopicId: (id) => set({ selectedTopicId: id }),

  clearError: () => set({ error: null }),

  refreshTopic: async (id) => {
    try {
      const topic = await get().getTopic(id);
      if (topic) {
        set(state => ({
          topics: state.topics.map(t =>
            t.id === id ? topic : t
          )
        }));
      }
    } catch (error) {
      console.error('Failed to refresh topic:', error);
    }
  },

  calculateProgress: (topic) => {
    const totalTasks = topic.goals.reduce((sum, goal) => sum + goal.tasks.length, 0);
    if (totalTasks === 0) return 0;
    
    const completedTasks = topic.goals.reduce(
      (sum, goal) => sum + goal.tasks.filter(task => task.status === 'done').length,
      0
    );
    
    return Math.round((completedTasks / totalTasks) * 100);
  }
})); 