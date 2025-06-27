/**
 * Topic Store - 基於 Supabase 的學習主題管理 (樂觀更新版本)
 * 
 * 功能說明：
 * 1. 管理學生的學習主題 (從 TopicTemplate 建立或自創)
 * 2. 支援主題的 CRUD 操作
 * 3. 支援主題協作功能
 * 4. 與 Supabase 資料庫同步
 * 5. 權限控制和資料安全
 * 6. 從 TopicTemplate 建立新主題
 * 7. 樂觀更新機制，提供流暢的用戶體驗
 * 
 * 架構設計：
 * - 所有資料存儲在 Supabase
 * - 使用 RLS (Row Level Security) 控制權限
 * - 支援即時協作和權限管理
 * - 整合 TopicTemplate 系統
 * - 樂觀更新：先更新本地狀態，後同步到資料庫
 * - 失敗時自動回滾並顯示錯誤訊息
 */

import { create } from 'zustand';
import { User, Topic, Goal, Task, Bubble, GoalStatus, CreateTopicFromTemplateParams } from '../types/goal';
import type { TopicCollaborator } from '@self-learning/types';
import { supabase, authService } from '../services/supabase';
import { useUserStore } from './userStore';

// 簡化的狀態管理類型

interface TopicStore {
  // 狀態
  topics: Topic[];
  selectedTopicId: string | null;
  loading: boolean;
  error: string | null;
  
  // 同步狀態
  syncing: boolean;

  // 基本 CRUD 操作
  fetchTopics: () => Promise<void>;
  fetchMyTopics: () => Promise<void>;
  fetchCollaborativeTopics: () => Promise<void>;
  getTopic: (id: string) => Promise<Topic | null>;
  createTopic: (topic: Omit<Topic, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<Topic | null>;
  addTopic: (topic: Omit<Topic, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<Topic | null>; // 別名，兼容舊代碼
  createTopicFromTemplate: (params: CreateTopicFromTemplateParams) => Promise<Topic | null>;
  updateTopic: (id: string, updates: Partial<Topic>) => Promise<Topic | null>;
  deleteTopic: (id: string) => Promise<boolean>;

  // 協作功能
  addCollaborator: (topicId: string, userId: string, permission: 'view' | 'edit') => Promise<boolean>;
  removeCollaborator: (topicId: string, userId: string) => Promise<boolean>;
  updateCollaboratorPermission: (topicId: string, userId: string, permission: 'view' | 'edit') => Promise<boolean>;
  getCollaborators: (topicId: string) => Promise<User[]>;

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

  // 新增：缺少的工具方法
  reorderTasks: (topicId: string, goalId: string, sourceIndex: number, destinationIndex: number) => Promise<boolean>;
  getActiveGoals: (topicId: string) => Goal[];
  getActiveTasks: (topicId: string, goalId: string) => Task[];
  getCompletionRate: (topicId: string) => number;
  getActiveTopics: () => Topic[];
  setGoalStatus: (topicId: string, goalId: string, status: GoalStatus) => Promise<boolean>;
  getGoalsByStatus: (topicId: string, status: GoalStatus) => Goal[];
  getFocusedGoals: (topicId: string) => Goal[];
  updateGoalHelp: (topicId: string, goalId: string, needHelp: boolean, helpMessage?: string) => Promise<boolean>;
  updateTaskHelp: (topicId: string, goalId: string, taskId: string, needHelp: boolean, helpMessage?: string) => Promise<boolean>;
  setGoalReply: (topicId: string, goalId: string, replyMessage: string) => Promise<boolean>;
  setTaskReply: (topicId: string, goalId: string, taskId: string, replyMessage: string) => Promise<boolean>;

  // 新增：協作相關方法
  setGoalOwner: (topicId: string, goalId: string, owner: User) => Promise<boolean>;
  setTaskOwner: (topicId: string, goalId: string, taskId: string, owner: User) => Promise<boolean>;
  addGoalCollaborator: (topicId: string, goalId: string, collaborator: User) => Promise<boolean>;
  removeGoalCollaborator: (topicId: string, goalId: string, collaboratorId: string) => Promise<boolean>;
  addTaskCollaborator: (topicId: string, goalId: string, taskId: string, collaborator: User) => Promise<boolean>;
  removeTaskCollaborator: (topicId: string, goalId: string, taskId: string, collaboratorId: string) => Promise<boolean>;
  getAvailableUsers: () => User[];

  // 工具方法
  setSyncing: (syncing: boolean) => void;

  // 工具方法
  setSelectedTopicId: (id: string | null) => void;
  clearError: () => void;
  refreshTopic: (id: string) => Promise<void>;
  calculateProgress: (topic: Topic) => number; // 計算完成率

  reset: () => void;  // 主題協作邀請管理
  inviteTopicCollaborator: (topicId: string, userId: string, permission?: 'view' | 'edit') => Promise<boolean>;
  removeTopicCollaborator: (topicId: string, userId: string) => Promise<boolean>;
  getTopicInvitedCollaborators: (topicId: string) => Promise<TopicCollaborator[]>;
}

export const useTopicStore = create<TopicStore>((set, get) => ({
  // 初始狀態
  topics: [],
  selectedTopicId: null,
  loading: false,
  error: null,

  // 同步狀態
  syncing: false,

  // 基本 CRUD 操作
  fetchTopics: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 獲取用戶自己的主題
      const { data: ownTopics, error: ownError } = await supabase
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

      if (ownError) throw ownError;

      // 獲取協作主題
      const { data: collabTopics, error: collabError } = await supabase
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

      if (collabError) throw collabError;

      // 合併並去重
      const allTopics = [...(ownTopics || []), ...(collabTopics || [])];
      const uniqueTopics = allTopics.filter((topic, index, self) =>
        index === self.findIndex((t) => t.id === topic.id)
      );

      const topics = uniqueTopics.map(topic => ({
        ...topic,
        topic_collaborators: topic.topic_collaborators || []
      }));

      set({ topics, loading: false });
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch topics', loading: false });
    }
  },

  fetchMyTopics: async () => {
    set({ loading: true, error: null });
    try {
      const user = await authService.getCurrentUser();
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
      const user = await authService.getCurrentUser();
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
          topic_collaborators!topic_collaborators_topic_id_fkey (
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

      console.log('Topic data from DB:', JSON.stringify(data, null, 2));

      // 使用 userStore 獲取用戶資訊
      const userState = useUserStore.getState();
      
      // 最多嘗試 3 次獲取用戶資料
      let retryCount = 0;
      let allUsers = userState.users;
      
      while (allUsers.length === 0 && retryCount < 3) {
        console.log(`Attempting to fetch users (attempt ${retryCount + 1})`);
        await userState.getUsers();
        allUsers = useUserStore.getState().users;
        retryCount++;
        
        if (allUsers.length === 0 && retryCount < 3) {
          // 等待一小段時間再重試
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('All users from userStore:', allUsers);

      if (allUsers.length === 0) {
        console.error('Failed to fetch users after multiple attempts');
        throw new Error('無法獲取用戶資料');
      }

      // 組合完整的協作者資訊
      const collaborators = data.topic_collaborators?.map(tc => {
        const user = allUsers.find(u => u.id === tc.user_id);
        if (!user) return null;
        return {
          ...user,
          permission: tc.permission
        };
      }).filter(Boolean) || [];

      console.log('Final collaborators:', collaborators);

      return {
        ...data,
        collaborators: collaborators,
        topic_collaborators: collaborators  // 保留這個以維持向後兼容
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

      // 確保必要欄位存在
      const requiredFields = ['title', 'description', 'type', 'subject', 'category', 'status'];
      const missingFields = requiredFields.filter(field => !topicData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // 設定預設值
      const topicWithDefaults = {
        ...topicData,
        goals: topicData.goals || [],
        bubbles: topicData.bubbles || [],
        progress: topicData.progress || 0,
        is_collaborative: topicData.is_collaborative || false,
        show_avatars: topicData.show_avatars || true,
        owner_id: user.id
      };

      const { data: newTopic, error } = await supabase
        .from('topics')
        .insert(topicWithDefaults)
        .select()
        .single();

      if (error) throw error;
      if (!newTopic) return null;

      // 更新本地狀態
      const finalTopic = {
        ...newTopic,
        topic_collaborators: []  // 新主題還沒有協作者
      };

      set(state => ({
        topics: [finalTopic, ...state.topics]
      }));

      return finalTopic;
    } catch (error) {
      console.error('Failed to create topic:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create topic' });
      return null;
    }
  },

  // 別名方法，兼容舊代碼
  addTopic: async (topicData) => {
    return get().createTopic(topicData);
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
      // 先更新主題
      const { data: updatedTopic, error: updateError } = await supabase
        .from('topics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!updatedTopic) return null;

      // 再獲取協作者資訊
      const { data: collaborators, error: collabError } = await supabase
        .from('topic_collaborators')
        .select('*')
        .eq('topic_id', id);

      if (collabError) throw collabError;

      // 組合資料
      const finalTopic = {
        ...updatedTopic,
        topic_collaborators: collaborators || []
      };

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(t => t.id === id ? finalTopic : t)
      }));

      return finalTopic;
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
        topics: state.topics.filter(t => t.id !== id),
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
  inviteTopicCollaborator: async (topicId, userId, permission = 'view') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 檢查是否已經是協作者
      const { data: existing } = await supabase
        .from('topic_collaborators')
        .select('id')
        .eq('topic_id', topicId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        console.log('User is already a collaborator');
        return true; // 已經是協作者，返回成功
      }

      const { error } = await supabase
        .from('topic_collaborators')
        .insert({
          topic_id: topicId,
          user_id: userId,
          permission,
          invited_by: user.id
        });

      if (error) {
        if (error.code === '23505') { // unique constraint violation
          console.log('User is already a collaborator (duplicate key)');
          return true;
        }
        throw error;
      }

      // 重新取得主題資料以更新協作者列表
      await get().refreshTopic(topicId);
      return true;
    } catch (error) {
      console.error('Failed to invite collaborator:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to invite collaborator' });
      return false;
    }
  },

  addCollaborator: async (topicId, userId, permission) => {
    return get().inviteTopicCollaborator(topicId, userId, permission);
  },

  removeTopicCollaborator: async (topicId, userId) => {
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

  removeCollaborator: async (topicId, userId) => {
    return get().removeTopicCollaborator(topicId, userId);
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

  getTopicInvitedCollaborators: async (topicId) => {
    try {
      const { data, error } = await supabase
        .from('topic_collaborators')
        .select('user_id, permission')
        .eq('topic_id', topicId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }

      const userState = useUserStore.getState();
      if (userState.users.length === 0) {
        await userState.getUsers();
      }
      const allUsers = useUserStore.getState().users;
      
      return data
        .map(tc => {
          const user = allUsers.find(u => u.id === tc.user_id);
          if (!user || !['view', 'edit'].includes(tc.permission)) return undefined;
          return {
            id: user.id,
            name: user.name,
            roles: user.roles,
            avatar: user.avatar,
            email: user.email,
            color: user.color,
            role: user.role,
            permission: tc.permission as 'view' | 'edit'
          } as TopicCollaborator;
        })
        .filter((user): user is TopicCollaborator => user !== undefined);
    } catch (error) {
      console.error('Error getting topic collaborators:', error);
      return [];
    }
  },

  getCollaborators: async (topicId) => {
    try {
      // 如果 topic 已經在本地狀態中，直接返回協作者列表
      const topic = get().topics.find(t => t.id === topicId);
      if (topic && topic.collaborators) {
        return topic.collaborators;
      }

      // 否則查詢資料庫
      const { data, error } = await supabase
        .from('topic_collaborators')
        .select('user_id')
        .eq('topic_id', topicId);

      if (error) throw error;
      
      const userIds = data?.map(tc => tc.user_id) || [];
      const availableUsers = get().getAvailableUsers();
      return availableUsers.filter(user => userIds.includes(user.id));
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

      const { data, error } = await supabase
        .from('topics')
        .update({ is_collaborative: !topic.is_collaborative })
        .eq('id', topicId)
        .select()
        .single();

      if (error) throw error;
      if (!data) return false;

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

  // 新增：缺少的工具方法
  reorderTasks: async (topicId, goalId, sourceIndex, destinationIndex) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const goal = topic.goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      const newTasks = Array.from(goal.tasks);
      const [removed] = newTasks.splice(sourceIndex, 1);
      newTasks.splice(destinationIndex, 0, removed);

      const updatedTasks = newTasks.map((task, index) => ({
        ...task,
        order: index
      }));

      const updatedGoals = topic.goals.map(g =>
        g.id === goalId ? { ...g, tasks: updatedTasks } : g
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
      console.error('Failed to reorder tasks:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to reorder tasks' });
      return false;
    }
  },

  getActiveGoals: (topicId) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic) return [];
    
    return topic.goals
      .filter(goal => !goal.status || goal.status !== 'archived')
      .map(goal => ({
        ...goal,
        // 如果沒有設置狀態，默認為 'todo'
        status: goal.status || 'todo',
        tasks: goal.tasks.filter(task => !task.status || task.status !== 'archived')
      }));
  },

  getActiveTasks: (topicId, goalId) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic) return [];
    
    const goal = topic.goals.find(g => g.id === goalId);
    if (!goal || goal.status === 'archived') return [];
    
    return goal.tasks.filter(task => task.status !== 'archived');
  },

  getCompletionRate: (topicId) => {
    const activeGoals = get().getActiveGoals(topicId);
    const totalTasks = activeGoals.reduce((sum, goal) => sum + goal.tasks.length, 0);
    const completedTasks = activeGoals.reduce(
      (sum, goal) => sum + goal.tasks.filter(task => task.status === 'done').length,
      0
    );
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  },

  getActiveTopics: () => {
    return get().topics.filter(topic => topic.status !== 'archived');
  },

  setGoalStatus: async (topicId, goalId, status) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId ? { ...goal, status } : goal
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
      console.error('Failed to set goal status:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to set goal status' });
      return false;
    }
  },

  getGoalsByStatus: (topicId, status) => {
    const activeGoals = get().getActiveGoals(topicId);
    return activeGoals.filter(goal => goal.status === status);
  },

  getFocusedGoals: (topicId) => {
    return get().getGoalsByStatus(topicId, 'focus');
  },

  updateGoalHelp: async (topicId, goalId, needHelp, helpMessage) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId ? { ...goal, needHelp, helpMessage } : goal
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
      console.error('Failed to update goal help:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update goal help' });
      return false;
    }
  },

  updateTaskHelp: async (topicId, goalId, taskId, needHelp, helpMessage) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              tasks: goal.tasks.map(task =>
                task.id === taskId ? { ...task, needHelp, helpMessage } : task
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

      return true;
    } catch (error) {
      console.error('Failed to update task help:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update task help' });
      return false;
    }
  },

  setGoalReply: async (topicId, goalId, replyMessage) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId ? { ...goal, replyMessage } : goal
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
      console.error('Failed to set goal reply:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to set goal reply' });
      return false;
    }
  },

  setTaskReply: async (topicId, goalId, taskId, replyMessage) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              tasks: goal.tasks.map(task =>
                task.id === taskId ? { ...task, replyMessage } : task
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

      return true;
    } catch (error) {
      console.error('Failed to set task reply:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to set task reply' });
      return false;
    }
  },

  // 新增：協作相關方法
  setGoalOwner: async (topicId, goalId, owner) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      // 檢查 owner 是否是主題的協作者或擁有者
      const invitedCollaborators = await get().getTopicInvitedCollaborators(topicId);
      const isValidOwner = invitedCollaborators.some(collaborator => collaborator.id === owner.id) || 
                          topic.owner_id === owner.id;
      
      if (!isValidOwner) {
        throw new Error('只能指派主題協作者為目標負責人');
      }

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId ? { ...goal, owner } : goal
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
      console.error('Failed to set goal owner:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to set goal owner' });
      return false;
    }
  },

  setTaskOwner: async (topicId, goalId, taskId, owner) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      // 檢查 owner 是否是主題的協作者或擁有者
      const invitedCollaborators = await get().getTopicInvitedCollaborators(topicId);
      const isValidOwner = invitedCollaborators.some(collaborator => collaborator.id === owner.id) || 
                          topic.owner_id === owner.id;
      
      if (!isValidOwner) {
        throw new Error('只能指派主題協作者為任務負責人');
      }

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              tasks: goal.tasks.map(task =>
                task.id === taskId ? { ...task, owner } : task
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

      return true;
    } catch (error) {
      console.error('Failed to set task owner:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to set task owner' });
      return false;
    }
  },

  addGoalCollaborator: async (topicId, goalId, collaborator) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      // 檢查協作者是否是主題的協作者或擁有者
      const invitedCollaborators = await get().getTopicInvitedCollaborators(topicId);
      const isValidCollaborator = invitedCollaborators.some(invited => invited.id === collaborator.id) || 
                                 topic.owner_id === collaborator.id;
      
      if (!isValidCollaborator) {
        throw new Error('只能指派主題協作者為目標協作者');
      }

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId ? { 
          ...goal, 
          collaborators: [...(goal.collaborators || []), collaborator].filter((user, index, self) => 
            // 去重
            index === self.findIndex((u) => u.id === user.id)
          ) 
        } : goal
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
      console.error('Failed to add goal collaborator:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add goal collaborator' });
      return false;
    }
  },

  removeGoalCollaborator: async (topicId, goalId, collaboratorId) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId ? { ...goal, collaborators: (goal.collaborators || []).filter(c => c.id !== collaboratorId) } : goal
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
      console.error('Failed to remove goal collaborator:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to remove goal collaborator' });
      return false;
    }
  },

  addTaskCollaborator: async (topicId, goalId, taskId, collaborator) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      // 檢查協作者是否是主題的協作者或擁有者
      const invitedCollaborators = await get().getTopicInvitedCollaborators(topicId);
      const isValidCollaborator = invitedCollaborators.some(invited => invited.id === collaborator.id) || 
                                 topic.owner_id === collaborator.id;
      
      if (!isValidCollaborator) {
        throw new Error('只能指派主題協作者為任務協作者');
      }

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              tasks: goal.tasks.map(task =>
                task.id === taskId ? { ...task, collaborators: [...(task.collaborators || []), collaborator] } : task
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

      return true;
    } catch (error) {
      console.error('Failed to add task collaborator:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add task collaborator' });
      return false;
    }
  },

  removeTaskCollaborator: async (topicId, goalId, taskId, collaboratorId) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const updatedGoals = topic.goals.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              tasks: goal.tasks.map(task =>
                task.id === taskId ? { ...task, collaborators: (task.collaborators || []).filter(c => c.id !== collaboratorId) } : task
              )
            }
          : goal
      );

      const { error } = await supabase
        .from('topics')
        .update({ goals: updatedGoals })
        .eq('id', topicId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to remove task collaborator:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to remove task collaborator' });
      return false;
    }
  },

  getAvailableUsers: () => {
    // 注意：由於架構分層原則，這個方法應該被棄用
    // 調用方應該直接使用 userStore.users
    console.warn('getAvailableUsers 應該被棄用，請直接使用 userStore.users');
    
    // 範例用戶數據（作為後備）
    const EXAMPLE_USERS: User[] = [
      {
        id: 'user-1',
        name: '小明',
        email: 'xiaoming@example.com',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=xiaoming&backgroundColor=ffd5dc&clothing=hoodie',
        color: '#FF6B6B',
        role: 'student'
      },
      {
        id: 'user-2', 
        name: '小美',
        email: 'xiaomei@example.com',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=xiaomei&backgroundColor=e0f2fe&clothing=dress',
        color: '#4ECDC4',
        role: 'student'
      },
      {
        id: 'user-3',
        name: '王老師',
        email: 'teacher.wang@example.com',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=teacher&backgroundColor=fff3e0&clothing=shirt&accessories=glasses',
        color: '#45B7D1',
        role: 'mentor'
      },
      {
        id: 'user-4',
        name: '李同學',
        email: 'lixue@example.com',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lixue&backgroundColor=f3e5f5&clothing=sweater',
        color: '#96CEB4',
        role: 'student'
      },
      {
        id: 'user-5',
        name: '張爸爸',
        email: 'papa.zhang@example.com',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=papa&backgroundColor=fff8e1&clothing=polo',
        color: '#FFEAA7',
        role: 'parent'
      }
    ];
    
    return EXAMPLE_USERS;
  },

  // 工具方法
  setSyncing: (syncing) => set({ syncing }),

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
  },

  reset: () => set({
    topics: [],
    selectedTopicId: null,
    loading: false,
    error: null
  }),
})); 