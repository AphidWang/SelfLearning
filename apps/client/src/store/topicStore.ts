import type { Topic, Goal, Task, Bubble, GoalStatus, TaskStatus, TaskPriority, CreateTopicFromTemplateParams, TopicWithStructure, ActiveTaskResult, ReferenceInfo, ReferenceAttachment, ReferenceLink } from '../types/goal';
import type { TopicCollaborator, User } from '@self-learning/types';
import { create } from 'zustand';
import { supabase } from '../services/supabase';
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

  // Topic CRUD
  fetchTopicsWithActions: () => Promise<void>;
  getTopic: (id: string) => Promise<Topic | null>;
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

// TODO: 之後要把 collaborator 的資料獲取移到顯示層，這裡暫時 patch 以保證 FE 不爆
function attachUserProfilesToCollaborators(users: any[], entity: any) {
  if (!entity) return entity;
  // owner
  if (entity.owner_id) {
    entity.owner = users.find(u => u.id === entity.owner_id) || {
      id: entity.owner_id,
      name: `User-${entity.owner_id?.slice?.(0, 8) || ''}`,
      email: '',
      avatar: undefined,
      role: 'student',
      roles: ['student']
    };
  }
  // collaborators (id 陣列 or物件陣列)
  if (Array.isArray(entity.collaborators)) {
    entity.collaborators = entity.collaborators.map((collab: any) => {
      const id = typeof collab === 'string' ? collab : collab.id;
      const permission = collab.permission;
      const invited_at = collab.invited_at;
      const user = users.find(u => u.id === id) || {
        id,
        name: `User-${id?.slice?.(0, 8) || ''}`,
        email: '',
        avatar: undefined,
        role: 'student',
        roles: ['student']
      };
      return { ...user, permission, invited_at };
    });
  }
  // 遞迴處理 goals
  if (Array.isArray(entity.goals)) {
    entity.goals = entity.goals.map(goal => attachUserProfilesToCollaborators(users, goal));
  }
  // 遞迴處理 tasks
  if (Array.isArray(entity.tasks)) {
    entity.tasks = entity.tasks.map(task => attachUserProfilesToCollaborators(users, task));
  }
  // goal 下的 tasks
  if (Array.isArray(entity.tasks)) {
    entity.tasks = entity.tasks.map(task => attachUserProfilesToCollaborators(users, task));
  }
  return entity;
}

export const useTopicStore = create<TopicStore>((set, get) => ({
  topics: [],
  selectedTopicId: null,
  loading: false,
  error: null,
  syncing: false,

  fetchTopicsWithActions: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false, topics: [], error: null });
        return [];
      }
      const { data, error } = await supabase.rpc('get_user_topics_with_structure', {
        p_user_id: user.id
      });
      if (error) {
        set({ loading: false, error: error.message });
        return [];
      }
      const userStore = await import('./userStore');
      const allUsers = userStore.useUserStore.getState().users || [];
      const { getCompletionRate } = await import('./progressQueries');
      const topicsWithRate = (data || []).map((topic: any) => {
        const patched = attachUserProfilesToCollaborators(allUsers, topic);
        return { ...patched, completionRate: getCompletionRate(patched) };
      });
      set({ topics: topicsWithRate, loading: false });
      return topicsWithRate;
    } catch (error: any) {
      set({ loading: false, error: error.message || '獲取主題失敗' });
      return [];
    }
  },

  getTopic: async (id: string) => {
    try {
      const { data, error } = await supabase.rpc('get_topics_full_structure', {
        topic_ids: [id]
      });
      if (error) throw error;
      if (!data || !Array.isArray(data) || data.length === 0) return null;
      const topic = data[0];
      const userStore = await import('./userStore');
      const allUsers = userStore.useUserStore.getState().users || [];
      const patched = attachUserProfilesToCollaborators(allUsers, topic);
      const { getCompletionRate } = await import('./progressQueries');
      return { ...patched, completionRate: getCompletionRate(patched) };
    } catch (error: any) {
      set({ error: error.message || '獲取主題失敗' });
      return null;
    }
  },

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
      const updatedTopic = await get().getTopic(id);
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
      // 重新載入主題列表以顯示還原的主題
      await get().fetchTopicsWithActions();
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
  
  createTopicFromTemplate: async (params) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      // 這裡 params 型別不完整，直接用 as any workaround
      const p = params as any;
      const { data, error } = await supabase
        .from('topics')
        .insert([{
          topic_template_id: p.topic_template_id,
          title: p.title,
          description: p.description,
          status: p.status,
          subject: p.subject,
          category: p.category,
          topic_type: p.topic_type,
          is_collaborative: p.is_collaborative,
          show_avatars: p.show_avatars,
          due_date: p.due_date,
          focus_element: p.focus_element,
          bubbles: p.bubbles,
          owner_id: user.id,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      if (error) throw error;
      const newTopic = { ...data, goals: [], progress: 0 };
      set(state => ({ topics: [newTopic, ...state.topics], loading: false }));
      return newTopic;
    } catch (error: any) {
      set({ loading: false, error: error.message || '從模板創建主題失敗' });
      return null;
    }
  },

  // Utility
  getActiveGoals: (topicId) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic || !Array.isArray(topic.goals)) return [];
    return topic.goals
      .filter(goal => goal.status !== 'archived')
      .map(goal => ({ ...goal, tasks: goal.tasks || [] }));
  },
  getFocusedGoals: (topicId) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic || !Array.isArray(topic.goals)) return [];
    return topic.goals
      .filter(goal => goal.status === 'focus')
      .map(goal => ({ ...goal, tasks: goal.tasks || [] }));
  },
  getActiveTopics: () => {
    return get().topics.filter(topic => {
      if (topic.status === 'active' || topic.status === 'in-progress') {
        return true;
      }
      if (Array.isArray(topic.goals) && topic.goals.length > 0) {
        const hasActiveTasks = topic.goals.some(goal =>
          Array.isArray(goal.tasks) && goal.tasks.some(task =>
            task.status === 'todo' || task.status === 'in_progress'
          )
        );
        return hasActiveTasks;
      }
      return false;
    });
  },

  // Collaboration helpers
  enableTopicCollaboration: async (topicId) => {
    try {
      const topic = get().topics.find(t => t.id === topicId);
      if (!topic) throw new Error('找不到主題');
      const updated = await get().updateTopic(topicId, topic.version, { is_collaborative: true });
      await get().fetchTopicsWithActions();
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
      await get().fetchTopicsWithActions();
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
      await get().fetchTopicsWithActions();
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
      await get().fetchTopicsWithActions();
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
    const topic = await get().getTopic(id);
    if (topic) {
      set(state => ({ topics: state.topics.map(t => t.id === id ? topic : t) }));
    }
  },
}));
