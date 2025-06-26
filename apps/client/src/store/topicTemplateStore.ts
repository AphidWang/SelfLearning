/**
 * Topic Template Store - 管理課程模板
 * 
 * 功能說明：
 * 1. 管理 mentor 建立的課程模板
 * 2. 支援模板的 CRUD 操作
 * 3. 支援模板複製和協作功能
 * 4. 與 Supabase 資料庫同步
 * 5. 權限控制和資料安全
 * 
 * 架構設計：
 * - 所有資料存儲在 Supabase
 * - 使用 RLS (Row Level Security) 控制權限
 * - 支援即時協作和權限管理
 */

import { create } from 'zustand';
import type { 
  TopicTemplate, 
  TopicTemplateCollaborator, 
  CopyTemplateParams,
  User,
  Goal,
  Bubble 
} from '../types/goal';
import { supabase } from '../services/supabase';

interface TopicTemplateStore {
  // 狀態
  templates: TopicTemplate[];
  selectedTemplateId: string | null;
  loading: boolean;
  error: string | null;

  // 基本 CRUD 操作
  fetchTemplates: () => Promise<void>;
  fetchMyTemplates: () => Promise<void>;
  fetchPublicTemplates: () => Promise<void>;
  fetchCollaborativeTemplates: () => Promise<void>;
  getTemplate: (id: string) => Promise<TopicTemplate | null>;
  createTemplate: (template: Omit<TopicTemplate, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'copy_count' | 'usage_count'>) => Promise<TopicTemplate | null>;
  updateTemplate: (id: string, updates: Partial<TopicTemplate>) => Promise<TopicTemplate | null>;
  deleteTemplate: (id: string) => Promise<boolean>;

  // 協作功能
  addCollaborator: (templateId: string, userId: string, permission: 'view' | 'edit' | 'admin') => Promise<boolean>;
  removeCollaborator: (templateId: string, userId: string) => Promise<boolean>;
  updateCollaboratorPermission: (templateId: string, userId: string, permission: 'view' | 'edit' | 'admin') => Promise<boolean>;
  getCollaborators: (templateId: string) => Promise<TopicTemplateCollaborator[]>;

  // 模板操作
  copyTemplate: (params: CopyTemplateParams) => Promise<TopicTemplate | null>;
  togglePublic: (templateId: string) => Promise<boolean>;
  toggleCollaborative: (templateId: string) => Promise<boolean>;

  // 內容管理
  addGoal: (templateId: string, goal: Omit<Goal, 'id'>) => Promise<Goal | null>;
  updateGoal: (templateId: string, goalId: string, updates: Partial<Goal>) => Promise<Goal | null>;
  deleteGoal: (templateId: string, goalId: string) => Promise<boolean>;
  addBubble: (templateId: string, bubble: Omit<Bubble, 'id'>) => Promise<Bubble | null>;
  updateBubble: (templateId: string, bubbleId: string, updates: Partial<Bubble>) => Promise<Bubble | null>;
  deleteBubble: (templateId: string, bubbleId: string) => Promise<boolean>;

  // 工具方法
  setSelectedTemplateId: (id: string | null) => void;
  clearError: () => void;
  refreshTemplate: (id: string) => Promise<void>;
}

export const useTopicTemplateStore = create<TopicTemplateStore>((set, get) => ({
  // 初始狀態
  templates: [],
  selectedTemplateId: null,
  loading: false,
  error: null,

  // 基本 CRUD 操作
  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('topic_templates')
        .select(`
          *,
          topic_template_collaborators (
            id,
            user_id,
            permission,
            invited_by,
            invited_at
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const templates = data?.map(template => ({
        ...template,
        collaborators: template.topic_template_collaborators || []
      })) || [];

      set({ templates, loading: false });
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch templates', loading: false });
    }
  },

  fetchMyTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('topic_templates')
        .select(`
          *,
          topic_template_collaborators (
            id,
            user_id,
            permission,
            invited_by,
            invited_at
          )
        `)
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const templates = data?.map(template => ({
        ...template,
        collaborators: template.topic_template_collaborators || []
      })) || [];

      set({ templates, loading: false });
    } catch (error) {
      console.error('Failed to fetch my templates:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch my templates', loading: false });
    }
  },

  fetchPublicTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('topic_templates')
        .select(`
          *,
          topic_template_collaborators (
            id,
            user_id,
            permission,
            invited_by,
            invited_at
          )
        `)
        .eq('is_public', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      const templates = data?.map(template => ({
        ...template,
        collaborators: template.topic_template_collaborators || []
      })) || [];

      set({ templates, loading: false });
    } catch (error) {
      console.error('Failed to fetch public templates:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch public templates', loading: false });
    }
  },

  fetchCollaborativeTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('topic_templates')
        .select(`
          *,
          topic_template_collaborators!inner (
            id,
            user_id,
            permission,
            invited_by,
            invited_at
          )
        `)
        .eq('topic_template_collaborators.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const templates = data?.map(template => ({
        ...template,
        collaborators: template.topic_template_collaborators || []
      })) || [];

      set({ templates, loading: false });
    } catch (error) {
      console.error('Failed to fetch collaborative templates:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch collaborative templates', loading: false });
    }
  },

  getTemplate: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('topic_templates')
        .select(`
          *,
          topic_template_collaborators (
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
        collaborators: data.topic_template_collaborators || []
      };
    } catch (error) {
      console.error('Failed to get template:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to get template' });
      return null;
    }
  },

  createTemplate: async (templateData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('topic_templates')
        .insert({
          ...templateData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // 更新本地狀態
      const newTemplate = { ...data, collaborators: [] };
      set(state => ({
        templates: [newTemplate, ...state.templates]
      }));

      return newTemplate;
    } catch (error) {
      console.error('Failed to create template:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create template' });
      return null;
    }
  },

  updateTemplate: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('topic_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        templates: state.templates.map(template =>
          template.id === id 
            ? { ...template, ...data }
            : template
        )
      }));

      return data;
    } catch (error) {
      console.error('Failed to update template:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update template' });
      return null;
    }
  },

  deleteTemplate: async (id) => {
    try {
      const { error } = await supabase
        .from('topic_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        templates: state.templates.filter(template => template.id !== id),
        selectedTemplateId: state.selectedTemplateId === id ? null : state.selectedTemplateId
      }));

      return true;
    } catch (error) {
      console.error('Failed to delete template:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete template' });
      return false;
    }
  },

  // 協作功能
  addCollaborator: async (templateId, userId, permission) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('topic_template_collaborators')
        .insert({
          template_id: templateId,
          user_id: userId,
          permission,
          invited_by: user.id
        });

      if (error) throw error;

      // 重新取得模板資料以更新協作者列表
      await get().refreshTemplate(templateId);
      return true;
    } catch (error) {
      console.error('Failed to add collaborator:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add collaborator' });
      return false;
    }
  },

  removeCollaborator: async (templateId, userId) => {
    try {
      const { error } = await supabase
        .from('topic_template_collaborators')
        .delete()
        .eq('template_id', templateId)
        .eq('user_id', userId);

      if (error) throw error;

      // 重新取得模板資料以更新協作者列表
      await get().refreshTemplate(templateId);
      return true;
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to remove collaborator' });
      return false;
    }
  },

  updateCollaboratorPermission: async (templateId, userId, permission) => {
    try {
      const { error } = await supabase
        .from('topic_template_collaborators')
        .update({ permission })
        .eq('template_id', templateId)
        .eq('user_id', userId);

      if (error) throw error;

      // 重新取得模板資料以更新協作者列表
      await get().refreshTemplate(templateId);
      return true;
    } catch (error) {
      console.error('Failed to update collaborator permission:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update collaborator permission' });
      return false;
    }
  },

  getCollaborators: async (templateId) => {
    try {
      const { data, error } = await supabase
        .from('topic_template_collaborators')
        .select('*')
        .eq('template_id', templateId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get collaborators:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to get collaborators' });
      return [];
    }
  },

  // 模板操作
  copyTemplate: async (params) => {
    try {
      const sourceTemplate = await get().getTemplate(params.source_template_id);
      if (!sourceTemplate) throw new Error('Source template not found');

      // 建立新模板
      const newTemplate = await get().createTemplate({
        title: params.title || `${sourceTemplate.title} (複製)`,
        description: params.description || sourceTemplate.description,
        subject: sourceTemplate.subject,
        category: sourceTemplate.category,
        template_type: sourceTemplate.template_type,
        goals: sourceTemplate.goals,
        bubbles: sourceTemplate.bubbles,
        is_public: params.is_public || false,
        is_collaborative: sourceTemplate.is_collaborative
      });

      if (newTemplate) {
        // 更新原模板的複製次數
        await supabase
          .from('topic_templates')
          .update({ copy_count: sourceTemplate.copy_count + 1 })
          .eq('id', params.source_template_id);
      }

      return newTemplate;
    } catch (error) {
      console.error('Failed to copy template:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to copy template' });
      return null;
    }
  },

  togglePublic: async (templateId) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const { error } = await supabase
        .from('topic_templates')
        .update({ is_public: !template.is_public })
        .eq('id', templateId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        templates: state.templates.map(t =>
          t.id === templateId
            ? { ...t, is_public: !t.is_public }
            : t
        )
      }));

      return true;
    } catch (error) {
      console.error('Failed to toggle public status:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to toggle public status' });
      return false;
    }
  },

  toggleCollaborative: async (templateId) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const { error } = await supabase
        .from('topic_templates')
        .update({ is_collaborative: !template.is_collaborative })
        .eq('id', templateId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        templates: state.templates.map(t =>
          t.id === templateId
            ? { ...t, is_collaborative: !t.is_collaborative }
            : t
        )
      }));

      return true;
    } catch (error) {
      console.error('Failed to toggle collaborative status:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to toggle collaborative status' });
      return false;
    }
  },

  // 內容管理 (Goal 和 Bubble 的詳細實作會根據需要加入)
  addGoal: async (templateId, goalData) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const newGoal = {
        ...goalData,
        id: crypto.randomUUID()
      };

      const updatedGoals = [...template.goals, newGoal];

      const { error } = await supabase
        .from('topic_templates')
        .update({ goals: updatedGoals })
        .eq('id', templateId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        templates: state.templates.map(t =>
          t.id === templateId
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

  updateGoal: async (templateId, goalId, updates) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const updatedGoals = template.goals.map(goal =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      );

      const { error } = await supabase
        .from('topic_templates')
        .update({ goals: updatedGoals })
        .eq('id', templateId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        templates: state.templates.map(t =>
          t.id === templateId
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

  deleteGoal: async (templateId, goalId) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const updatedGoals = template.goals.filter(goal => goal.id !== goalId);

      const { error } = await supabase
        .from('topic_templates')
        .update({ goals: updatedGoals })
        .eq('id', templateId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        templates: state.templates.map(t =>
          t.id === templateId
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

  addBubble: async (templateId, bubbleData) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const newBubble = {
        ...bubbleData,
        id: crypto.randomUUID()
      };

      const updatedBubbles = [...(template.bubbles || []), newBubble];

      const { error } = await supabase
        .from('topic_templates')
        .update({ bubbles: updatedBubbles })
        .eq('id', templateId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        templates: state.templates.map(t =>
          t.id === templateId
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

  updateBubble: async (templateId, bubbleId, updates) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const updatedBubbles = (template.bubbles || []).map(bubble =>
        bubble.id === bubbleId ? { ...bubble, ...updates } : bubble
      );

      const { error } = await supabase
        .from('topic_templates')
        .update({ bubbles: updatedBubbles })
        .eq('id', templateId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        templates: state.templates.map(t =>
          t.id === templateId
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

  deleteBubble: async (templateId, bubbleId) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const updatedBubbles = (template.bubbles || []).filter(bubble => bubble.id !== bubbleId);

      const { error } = await supabase
        .from('topic_templates')
        .update({ bubbles: updatedBubbles })
        .eq('id', templateId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        templates: state.templates.map(t =>
          t.id === templateId
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

  // 工具方法
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),

  clearError: () => set({ error: null }),

  refreshTemplate: async (id) => {
    try {
      const template = await get().getTemplate(id);
      if (template) {
        set(state => ({
          templates: state.templates.map(t =>
            t.id === id ? template : t
          )
        }));
      }
    } catch (error) {
      console.error('Failed to refresh template:', error);
    }
  }
})); 