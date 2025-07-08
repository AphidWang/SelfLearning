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
  TemplateGoal,
  TemplateTask,
  Bubble,
  ReferenceInfo,
  ReferenceAttachment,
  ReferenceLink
} from '../types/goal';
import type { User } from '@self-learning/types';
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
  fetchAllTemplates: () => Promise<void>; // 新增統一的載入方法
  getTemplate: (id: string) => Promise<TopicTemplate | null>;
  createTemplate: (template: Omit<TopicTemplate, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'copy_count' | 'usage_count' | 'status'>) => Promise<TopicTemplate | null>;
  updateTemplate: (id: string, updates: Partial<TopicTemplate>) => Promise<TopicTemplate | null>;
  archiveTemplate: (id: string) => Promise<boolean>; // 改名為 archiveTemplate
  deleteTemplate: (id: string) => Promise<boolean>; // 保留舊方法名稱以向後兼容

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
  addGoal: (templateId: string, goal: Omit<TemplateGoal, 'id'>) => Promise<TemplateGoal | null>;
  updateGoal: (templateId: string, goalId: string, updates: Partial<TemplateGoal>) => Promise<TemplateGoal | null>;
  deleteGoal: (templateId: string, goalId: string) => Promise<boolean>;
  addTask: (templateId: string, goalId: string, task: Omit<TemplateTask, 'id'>) => Promise<TemplateTask | null>;
  updateTask: (templateId: string, goalId: string, taskId: string, updates: Partial<TemplateTask>) => Promise<TemplateTask | null>;
  deleteTask: (templateId: string, goalId: string, taskId: string) => Promise<boolean>;
  addBubble: (templateId: string, bubble: Omit<Bubble, 'id'>) => Promise<Bubble | null>;
  updateBubble: (templateId: string, bubbleId: string, updates: Partial<Bubble>) => Promise<Bubble | null>;
  deleteBubble: (templateId: string, bubbleId: string) => Promise<boolean>;

  // 參考資訊管理
  updateTemplateReferenceInfo: (templateId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addTemplateAttachment: (templateId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeTemplateAttachment: (templateId: string, attachmentId: string) => Promise<boolean>;
  addTemplateLink: (templateId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeTemplateLink: (templateId: string, linkId: string) => Promise<boolean>;
  
  // 目標參考資訊管理
  updateGoalReferenceInfo: (templateId: string, goalId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addGoalAttachment: (templateId: string, goalId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeGoalAttachment: (templateId: string, goalId: string, attachmentId: string) => Promise<boolean>;
  addGoalLink: (templateId: string, goalId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeGoalLink: (templateId: string, goalId: string, linkId: string) => Promise<boolean>;
  
  // 任務參考資訊管理
  updateTaskReferenceInfo: (templateId: string, goalId: string, taskId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addTaskAttachment: (templateId: string, goalId: string, taskId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeTaskAttachment: (templateId: string, goalId: string, taskId: string, attachmentId: string) => Promise<boolean>;
  addTaskLink: (templateId: string, goalId: string, taskId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeTaskLink: (templateId: string, goalId: string, taskId: string, linkId: string) => Promise<boolean>;

  // 工具方法
  setSelectedTemplateId: (id: string | null) => void;
  clearError: () => void;
  refreshTemplate: (id: string) => Promise<void>;

  reset: () => void;
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
        .eq('status', 'active')
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
        .eq('status', 'active')
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
      // 先嘗試不包含 collaborators 的簡單查詢
      const { data, error } = await supabase
        .from('topic_templates')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'active')
        .order('usage_count', { ascending: false });

      if (error) throw error;

      const templates = data?.map(template => ({
        ...template,
        collaborators: [] // 暫時設為空陣列
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
        .eq('status', 'active')
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

  fetchAllTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 並行載入三種類型的模板
      const [myTemplatesResult, publicTemplatesResult, collaborativeTemplatesResult] = await Promise.allSettled([
        // 我的模板
        supabase
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
          .eq('status', 'active')
          .order('updated_at', { ascending: false }),
        
        // 公開模板
        supabase
          .from('topic_templates')
          .select('*')
          .eq('is_public', true)
          .eq('status', 'active')
          .order('usage_count', { ascending: false }),
        
        // 協作模板
        supabase
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
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
      ]);

      // 合併所有結果
      const allTemplates: TopicTemplate[] = [];
      const templateIds = new Set<string>();

      // 處理我的模板
      if (myTemplatesResult.status === 'fulfilled' && myTemplatesResult.value.data) {
        const myTemplates = myTemplatesResult.value.data.map(template => ({
          ...template,
          collaborators: template.topic_template_collaborators || [],
          _category: 'my' as const
        }));
        myTemplates.forEach(template => {
          if (!templateIds.has(template.id)) {
            templateIds.add(template.id);
            allTemplates.push(template);
          }
        });
      }

      // 處理公開模板
      if (publicTemplatesResult.status === 'fulfilled' && publicTemplatesResult.value.data) {
        const publicTemplates = publicTemplatesResult.value.data.map(template => ({
          ...template,
          collaborators: [],
          _category: 'public' as const
        }));
        publicTemplates.forEach(template => {
          if (!templateIds.has(template.id)) {
            templateIds.add(template.id);
            allTemplates.push(template);
          }
        });
      }

      // 處理協作模板
      if (collaborativeTemplatesResult.status === 'fulfilled' && collaborativeTemplatesResult.value.data) {
        const collaborativeTemplates = collaborativeTemplatesResult.value.data.map(template => ({
          ...template,
          collaborators: template.topic_template_collaborators || [],
          _category: 'collaborative' as const
        }));
        collaborativeTemplates.forEach(template => {
          if (!templateIds.has(template.id)) {
            templateIds.add(template.id);
            allTemplates.push(template);
          }
        });
      }

      // 按更新時間排序
      allTemplates.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      set({ templates: allTemplates, loading: false });
    } catch (error) {
      console.error('Failed to fetch all templates:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch all templates', loading: false });
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
        .eq('status', 'active')
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

      // 確保必要欄位存在
      const requiredFields = ['title', 'subject', 'category'];
      const missingFields = requiredFields.filter(field => !templateData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // 設定預設值
      const templateWithDefaults = {
        ...templateData,
        template_type: templateData.template_type || 'learning',
        description: templateData.description || '',
        goals: templateData.goals || [],
        bubbles: templateData.bubbles || [],
        is_public: templateData.is_public || false,
        is_collaborative: templateData.is_collaborative || false,
        status: 'active' as const,
        copy_count: 0,
        usage_count: 0,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('topic_templates')
        .insert(templateWithDefaults)
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
        .single();

      if (error) throw error;
      if (!data) return null;

      // 更新本地狀態
      const newTemplate = { ...data, collaborators: data.topic_template_collaborators || [] };
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
        .single();

      if (error) throw error;
      if (!data) return null;

      // 更新本地狀態
      const updatedTemplate = { ...data, collaborators: data.topic_template_collaborators || [] };
      set(state => ({
        templates: state.templates.map(t => t.id === id ? updatedTemplate : t)
      }));

      return updatedTemplate;
    } catch (error) {
      console.error('Failed to update template:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update template' });
      return null;
    }
  },

  archiveTemplate: async (id) => {
    try {
      const { error } = await supabase
        .from('topic_templates')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;

             // 更新本地狀態 - 過濾掉已歸檔的模板
       set(state => ({
         templates: state.templates.filter(t => t.id !== id),
         selectedTemplateId: state.selectedTemplateId === id ? null : state.selectedTemplateId
       }));

      return true;
    } catch (error) {
      console.error('Failed to archive template:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to archive template' });
      return false;
    }
  },

  deleteTemplate: async (id) => {
    // 為了向後兼容，deleteTemplate 現在調用 archiveTemplate
    return await get().archiveTemplate(id);
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

      const { data, error } = await supabase
        .from('topic_templates')
        .update({ is_public: !template.is_public })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      if (!data) return false;

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
  },

  // 參考資訊管理實作
  updateTemplateReferenceInfo: async (templateId, referenceInfo) => {
    try {
      const { error } = await supabase
        .from('topic_templates')
        .update({ reference_info: referenceInfo })
        .eq('id', templateId);

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        templates: state.templates.map(template =>
          template.id === templateId
            ? { ...template, reference_info: referenceInfo }
            : template
        )
      }));

      return true;
    } catch (error) {
      console.error('更新模板參考資訊失敗:', error);
      set({ error: error instanceof Error ? error.message : '更新參考資訊失敗' });
      return false;
    }
  },

  addTemplateAttachment: async (templateId, attachment) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return false;

    const newAttachment: ReferenceAttachment = {
      ...attachment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = template.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      attachments: [...currentReferenceInfo.attachments, newAttachment]
    };

    return await get().updateTemplateReferenceInfo(templateId, updatedReferenceInfo);
  },

  removeTemplateAttachment: async (templateId, attachmentId) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template || !template.reference_info) return false;

    const updatedReferenceInfo = {
      ...template.reference_info,
      attachments: template.reference_info.attachments.filter(a => a.id !== attachmentId)
    };

    return await get().updateTemplateReferenceInfo(templateId, updatedReferenceInfo);
  },

  addTemplateLink: async (templateId, link) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return false;

    const newLink: ReferenceLink = {
      ...link,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = template.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      links: [...currentReferenceInfo.links, newLink]
    };

    return await get().updateTemplateReferenceInfo(templateId, updatedReferenceInfo);
  },

  removeTemplateLink: async (templateId, linkId) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template || !template.reference_info) return false;

    const updatedReferenceInfo = {
      ...template.reference_info,
      links: template.reference_info.links.filter(l => l.id !== linkId)
    };

    return await get().updateTemplateReferenceInfo(templateId, updatedReferenceInfo);
  },

  // 任務管理方法
  addTask: async (templateId, goalId, taskData) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const goal = template.goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      const newTask = {
        ...taskData,
        id: crypto.randomUUID()
      };

      const updatedTasks = [...(goal.tasks || []), newTask];
      const updatedGoals = template.goals.map(g =>
        g.id === goalId ? { ...g, tasks: updatedTasks } : g
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

      return newTask;
    } catch (error) {
      console.error('Failed to add task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add task' });
      return null;
    }
  },

  updateTask: async (templateId, goalId, taskId, updates) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const goal = template.goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      const updatedTasks = (goal.tasks || []).map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      );

      const updatedGoals = template.goals.map(g =>
        g.id === goalId ? { ...g, tasks: updatedTasks } : g
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

      const updatedTask = updatedTasks.find(t => t.id === taskId);
      return updatedTask || null;
    } catch (error) {
      console.error('Failed to update task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update task' });
      return null;
    }
  },

  deleteTask: async (templateId, goalId, taskId) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const goal = template.goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      const updatedTasks = (goal.tasks || []).filter(task => task.id !== taskId);
      const updatedGoals = template.goals.map(g =>
        g.id === goalId ? { ...g, tasks: updatedTasks } : g
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

      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete task' });
      return false;
    }
  },

  // 目標參考資訊管理
  updateGoalReferenceInfo: async (templateId, goalId, referenceInfo) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const updatedGoals = template.goals.map(goal =>
        goal.id === goalId ? { ...goal, reference_info: referenceInfo } : goal
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

      return true;
    } catch (error) {
      console.error('Failed to update goal reference info:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update goal reference info' });
      return false;
    }
  },

  addGoalAttachment: async (templateId, goalId, attachment) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return false;

    const goal = template.goals.find(g => g.id === goalId);
    if (!goal) return false;

    const newAttachment: ReferenceAttachment = {
      ...attachment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = goal.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      attachments: [...currentReferenceInfo.attachments, newAttachment]
    };

    return await get().updateGoalReferenceInfo(templateId, goalId, updatedReferenceInfo);
  },

  removeGoalAttachment: async (templateId, goalId, attachmentId) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return false;

    const goal = template.goals.find(g => g.id === goalId);
    if (!goal || !goal.reference_info) return false;

    const updatedReferenceInfo = {
      ...goal.reference_info,
      attachments: goal.reference_info.attachments.filter(a => a.id !== attachmentId)
    };

    return await get().updateGoalReferenceInfo(templateId, goalId, updatedReferenceInfo);
  },

  addGoalLink: async (templateId, goalId, link) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return false;

    const goal = template.goals.find(g => g.id === goalId);
    if (!goal) return false;

    const newLink: ReferenceLink = {
      ...link,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = goal.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      links: [...currentReferenceInfo.links, newLink]
    };

    return await get().updateGoalReferenceInfo(templateId, goalId, updatedReferenceInfo);
  },

  removeGoalLink: async (templateId, goalId, linkId) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return false;

    const goal = template.goals.find(g => g.id === goalId);
    if (!goal || !goal.reference_info) return false;

    const updatedReferenceInfo = {
      ...goal.reference_info,
      links: goal.reference_info.links.filter(l => l.id !== linkId)
    };

    return await get().updateGoalReferenceInfo(templateId, goalId, updatedReferenceInfo);
  },

  // 任務參考資訊管理
  updateTaskReferenceInfo: async (templateId, goalId, taskId, referenceInfo) => {
    try {
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const updatedGoals = template.goals.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              tasks: (goal.tasks || []).map(task =>
                task.id === taskId ? { ...task, reference_info: referenceInfo } : task
              )
            }
          : goal
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

      return true;
    } catch (error) {
      console.error('Failed to update task reference info:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update task reference info' });
      return false;
    }
  },

  addTaskAttachment: async (templateId, goalId, taskId, attachment) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return false;

    const goal = template.goals.find(g => g.id === goalId);
    if (!goal) return false;

    const task = (goal.tasks || []).find(t => t.id === taskId);
    if (!task) return false;

    const newAttachment: ReferenceAttachment = {
      ...attachment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = task.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      attachments: [...currentReferenceInfo.attachments, newAttachment]
    };

    return await get().updateTaskReferenceInfo(templateId, goalId, taskId, updatedReferenceInfo);
  },

  removeTaskAttachment: async (templateId, goalId, taskId, attachmentId) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return false;

    const goal = template.goals.find(g => g.id === goalId);
    if (!goal) return false;

    const task = (goal.tasks || []).find(t => t.id === taskId);
    if (!task || !task.reference_info) return false;

    const updatedReferenceInfo = {
      ...task.reference_info,
      attachments: task.reference_info.attachments.filter(a => a.id !== attachmentId)
    };

    return await get().updateTaskReferenceInfo(templateId, goalId, taskId, updatedReferenceInfo);
  },

  addTaskLink: async (templateId, goalId, taskId, link) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return false;

    const goal = template.goals.find(g => g.id === goalId);
    if (!goal) return false;

    const task = (goal.tasks || []).find(t => t.id === taskId);
    if (!task) return false;

    const newLink: ReferenceLink = {
      ...link,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = task.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      links: [...currentReferenceInfo.links, newLink]
    };

    return await get().updateTaskReferenceInfo(templateId, goalId, taskId, updatedReferenceInfo);
  },

  removeTaskLink: async (templateId, goalId, taskId, linkId) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return false;

    const goal = template.goals.find(g => g.id === goalId);
    if (!goal) return false;

    const task = (goal.tasks || []).find(t => t.id === taskId);
    if (!task || !task.reference_info) return false;

    const updatedReferenceInfo = {
      ...task.reference_info,
      links: task.reference_info.links.filter(l => l.id !== linkId)
    };

    return await get().updateTaskReferenceInfo(templateId, goalId, taskId, updatedReferenceInfo);
  },

  reset: () => set({
    templates: [],
    selectedTemplateId: null,
    loading: false,
    error: null
  })
})); 