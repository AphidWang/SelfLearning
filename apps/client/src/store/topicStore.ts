import type { Topic, Goal, Task, Bubble, GoalStatus, TaskStatus, TaskPriority, CreateTopicFromTemplateParams, TopicWithStructure, ActiveTaskResult, ReferenceInfo, ReferenceAttachment, ReferenceLink } from '../types/goal';
import type { TopicCollaborator, User } from '@self-learning/types';
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { fetchTopicsWithActions, refreshTopicData } from './dataManager';
/**
 * Topic-only store interface after refactor.
 * Contains only Topic related methods.
 */
interface TopicStore {
  topics: Topic[];
  selectedTopicId: string | null;
  loading: boolean;
  error: string | null;
  syncing: boolean;

  // Topic CRUD (fetchTopicsWithActions moved to dataManager.ts)
  createTopic: (topic: Omit<Topic, 'id' | 'owner_id' | 'version' | 'created_at' | 'updated_at' | 'creator_id'>) => Promise<Topic | null>;
  updateTopic: (id: string, expectedVersion: number, updates: Partial<Topic>) => Promise<Topic | null>;
  deleteTopic: (id: string) => Promise<boolean>;
  restoreTopic: (id: string) => Promise<boolean>;

  // Topic reference info
  updateTopicReferenceInfo: (topicId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addTopicAttachment: (topicId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeTopicAttachment: (topicId: string, attachmentId: string) => Promise<boolean>;
  addTopicLink: (topicId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeTopicLink: (topicId: string, linkId: string) => Promise<boolean>;
  
  createTopicFromTemplate: (params: CreateTopicFromTemplateParams) => Promise<Topic | null>;

  // Utility
  getActiveGoals: (topicId: string) => Goal[];
  getFocusedGoals: (topicId: string) => Goal[];
  getActiveTopics: () => Topic[];

  // Collaboration helpers
  enableTopicCollaboration: (topicId: string) => Promise<Topic | null>;
  disableTopicCollaboration: (topicId: string) => Promise<Topic | null>;
  inviteTopicCollaborator: (topicId: string, userId: string, permission?: 'view' | 'edit') => Promise<boolean>;
  removeTopicCollaborator: (topicId: string, userId: string) => Promise<boolean>;

}

export const useTopicStore = create<TopicStore>((set, get) => ({
  topics: [],
  selectedTopicId: null,
  loading: false,
  error: null,
  syncing: false,


  createTopic: async (topicData) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      const { goals, bubbles, progress, owner_id, version, created_at, updated_at, ...dbTopicData } = topicData as any;
      const status = dbTopicData.status ?? 'active';
      const { data, error } = await supabase
        .from('topics')
        .insert([{ ...dbTopicData, owner_id: user.id, creator_id: user.id, status }])
        .select()
        .single();
      if (error) throw error;
      const newTopic = { ...data, goals: [], progress: 0 };
      set(state => ({ topics: [newTopic, ...state.topics], loading: false }));
      return newTopic;
    } catch (error: any) {
      set({ loading: false, error: error.message || '創建主題失敗' });
      return null;
    }
  },

  updateTopic: async (id, expectedVersion, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const { data, error } = await supabase.rpc('safe_update_topic', {
        p_id: id,
        p_expected_version: expectedVersion,
        p_user_id: user.id,
        p_title: updates.title,
        p_description: updates.description,
        p_status: updates.status,
        p_subject: updates.subject,
        p_category: updates.category,
        p_topic_type: updates.topic_type,
        p_is_collaborative: updates.is_collaborative,
        p_show_avatars: updates.show_avatars,
        p_due_date: updates.due_date,
        p_focus_element: updates.focus_element,
        p_bubbles: updates.bubbles
      });
      if (error) throw error;
      const result = data;
      if (!result || !result.success) {
        if (result && result.message === 'Version conflict detected') {
          throw new Error('主題已被其他用戶修改，請重新載入');
        }
        throw new Error(result?.message || '更新主題失敗');
      }
      const updatedTopic = await refreshTopicData(id);
      if (updatedTopic) {
        set(state => ({ topics: state.topics.map(t => t.id === id ? updatedTopic : t) }));
        return updatedTopic;
      }
      return null;
    } catch (error: any) {
      set({ error: error.message || '更新主題失敗' });
      throw error;
    }
  },

  deleteTopic: async (id: string) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ status: 'archived' })
        .eq('id', id);
      if (error) throw error;
      set(state => ({ topics: state.topics.filter(t => t.id !== id) }));
      return true;
    } catch (error: any) {
      set({ error: error.message || '歸檔主題失敗' });
      return false;
    }
  },

  restoreTopic: async (id: string) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ status: 'active' })
        .eq('id', id);
      if (error) throw error;

      await fetchTopicsWithActions()
      return true;
    } catch (error: any) {
      set({ error: error.message || '還原主題失敗' });
      return false;
    }
  },

  // Topic reference info
  updateTopicReferenceInfo: async (topicId, referenceInfo) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ reference_info: referenceInfo })
        .eq('id', topicId);
      if (error) throw error;
      set((state) => ({
        topics: state.topics.map((topic) =>
          topic.id === topicId
            ? { ...topic, reference_info: referenceInfo }
            : topic
        )
      }));
      return true;
    } catch (error: any) {
      set({ error: error.message || '更新 Topic 參考資訊失敗' });
      return false;
    }
  },
  addTopicAttachment: async (topicId, attachment) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic) return false;
    const newAttachment = {
      ...attachment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    const currentReferenceInfo = topic.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      attachments: [...currentReferenceInfo.attachments, newAttachment]
    };
    return await get().updateTopicReferenceInfo(topicId, updatedReferenceInfo);
  },
  removeTopicAttachment: async (topicId, attachmentId) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic || !topic.reference_info) return false;
    const updatedReferenceInfo = {
      ...topic.reference_info,
      attachments: topic.reference_info.attachments.filter(a => a.id !== attachmentId)
    };
    return await get().updateTopicReferenceInfo(topicId, updatedReferenceInfo);
  },
  addTopicLink: async (topicId, link) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic) return false;
    const newLink = {
      ...link,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    const currentReferenceInfo = topic.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      links: [...currentReferenceInfo.links, newLink]
    };
    return await get().updateTopicReferenceInfo(topicId, updatedReferenceInfo);
  },
  removeTopicLink: async (topicId, linkId) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic || !topic.reference_info) return false;
    const updatedReferenceInfo = {
      ...topic.reference_info,
      links: topic.reference_info.links.filter(l => l.id !== linkId)
    };
    return await get().updateTopicReferenceInfo(topicId, updatedReferenceInfo);
  },
  
  createTopicFromTemplate: async (params: CreateTopicFromTemplateParams) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      // 1. 獲取模板數據
      const { data: templateData, error: templateError } = await supabase
        .from('topic_templates')
        .select('*')
        .eq('id', params.template_id)
        .single();
      
      if (templateError) throw templateError;
      if (!templateData) throw new Error('模板不存在');

      // 2. 創建主題
      const topicData = {
        template_id: params.template_id,
        title: params.title || templateData.title,
        description: params.description || templateData.description,
        status: 'active' as const,
        subject: templateData.subject,
        category: templateData.category,
        topic_type: templateData.template_type || '學習目標',
        is_collaborative: params.is_collaborative || templateData.is_collaborative,
        show_avatars: true,
        due_date: null,
        focus_element: null,
        bubbles: templateData.bubbles || [],
        owner_id: user.id,
        creator_id: user.id,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .insert([topicData])
        .select()
        .single();
      
      if (topicError) throw topicError;

      // 3. 創建 Goals（從模板的巢狀結構轉換為獨立結構）
      if (templateData.goals && templateData.goals.length > 0) {
        for (const templateGoal of templateData.goals) {
          const goalData = {
            topic_id: topic.id,
            creator_id: user.id,
            owner_id: user.id,
            title: templateGoal.title,
            description: templateGoal.description,
            reference_info: templateGoal.reference_info,
            status: templateGoal.status || 'todo',
            priority: templateGoal.priority || 'medium',
            order_index: templateGoal.order_index || 0,
            need_help: false,
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: goal, error: goalError } = await supabase
            .from('goals')
            .insert([goalData])
            .select()
            .single();
          
          if (goalError) throw goalError;

          // 4. 創建 Tasks（從模板的巢狀結構轉換為獨立結構）
          if (templateGoal.tasks && templateGoal.tasks.length > 0) {
            for (const templateTask of templateGoal.tasks) {
              const taskData = {
                goal_id: goal.id,
                creator_id: user.id,
                owner_id: user.id,
                title: templateTask.title,
                description: templateTask.description,
                reference_info: templateTask.reference_info,
                status: templateTask.status || 'todo',
                priority: templateTask.priority || 'medium',
                order_index: templateTask.order_index || 0,
                task_type: 'single',
                task_config: { type: 'single' },
                cycle_config: { cycle_type: 'none', auto_reset: false },
                need_help: false,
                version: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const { data: task, error: taskError } = await supabase
                .from('tasks')
                .insert([taskData])
                .select()
                .single();
              
              if (taskError) throw taskError;
            }
          }

          // 5. 注意：goals 表沒有 taskIds 欄位，所以跳過這個更新
          // 任務和目標的關聯通過 tasks.goal_id 外鍵維護
        }
      }

      // 6. 注意：topics 表沒有 goalIds 欄位，所以跳過這個更新
      // 目標和主題的關聯通過 goals.topic_id 外鍵維護
      const finalTopic = {
        ...topic,
        progress: 0
      };

      set(state => ({ topics: [finalTopic, ...state.topics], loading: false }));
      return finalTopic;
    } catch (error: any) {
      console.error('從模板創建主題失敗:', error);
      const errorMessage = error.message || '從模板創建主題失敗';
      set({ loading: false, error: errorMessage });
      return null;
    }
  },

  // Utility methods - will be replaced by external composition
  getActiveGoals: (topicId) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic) return [];
    
    // Use new structure with goalIds
    if (topic.goalIds && topic.goalIds.length > 0) {
      // Return placeholder objects, real data should be fetched from goalStore
      return topic.goalIds.map(goalId => ({ id: goalId, topic_id: topicId, status: 'active' } as any));
    }
    
    return [];
  },
  getFocusedGoals: (topicId) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic) return [];
    
    // Use new structure with goalIds (filtered for focus goals should be done externally)
    if (topic.goalIds && topic.goalIds.length > 0) {
      // Return placeholder objects, real filtering should be done using goalStore
      return topic.goalIds.map(goalId => ({ id: goalId, topic_id: topicId, status: 'focus' } as any));
    }
    
    return [];
  },
  getActiveTopics: () => {
    return get().topics.filter(topic => {
      if (topic.status === 'active' || topic.status === 'in-progress') {
        return true;
      }
      // Note: 需要結合 taskStore 來判斷是否有活躍任務
      // 暫時只根據 status 判斷，之後組件層會處理
      return false;
    });
  },

  // Collaboration helpers
  enableTopicCollaboration: async (topicId) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('找不到主題');
      const updated = await get().updateTopic(topicId, topic.version, { is_collaborative: true });
      
      await fetchTopicsWithActions()
      return updated;
    } catch (error: any) {
      set({ error: error.message || '啟用協作模式失敗' });
      return null;
    }
  },
  disableTopicCollaboration: async (topicId) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('找不到主題');
      const updated = await get().updateTopic(topicId, topic.version, { is_collaborative: false });
      
      await fetchTopicsWithActions()
      return updated;
    } catch (error: any) {
      set({ error: error.message || '停用協作模式失敗' });
      return null;
    }
  },
  inviteTopicCollaborator: async (topicId, userId, permission = 'edit') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      const { error } = await supabase
        .from('topic_collaborators')
        .insert([{ topic_id: topicId, user_id: userId, permission, invited_by: user.id }]);
      if (error) throw error;
      
      await fetchTopicsWithActions()
      return true;
    } catch (error: any) {
      set({ error: error.message || '邀請協作者失敗' });
      return false;
    }
  },
  removeTopicCollaborator: async (topicId, userId) => {
    try {
      const { error } = await supabase
        .from('topic_collaborators')
        .delete()
        .eq('topic_id', topicId)
        .eq('user_id', userId);
      if (error) throw error;
      
      await fetchTopicsWithActions()
      return true;
    } catch (error: any) {
      set({ error: error.message || '移除協作者失敗' });
      return false;
    }
  },

  // State management
  setSelectedTopicId: (id) => set({ selectedTopicId: id }),
  clearError: () => set({ error: null }),
  setSyncing: (syncing) => set({ syncing }),
  reset: () => set({ topics: [], selectedTopicId: null, loading: false, error: null, syncing: false }),
  refreshTopic: async (id) => {
    const topic = await refreshTopicData(id);
    if (topic) {
      set(state => ({ topics: state.topics.map(t => t.id === id ? topic : t) }));
    }
  },
}));
