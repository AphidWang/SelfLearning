import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Goal, ReferenceInfo, ReferenceAttachment, ReferenceLink } from '../types/goal';

interface GoalStoreState {
  goals: Record<string, Goal>;
  error?: string;
  
  // 組合查詢方法
  getGoalsForTopic: (topicId: string) => Goal[];
  getGoalById: (goalId: string) => Goal | undefined;
  getAllGoals: () => Goal[];
  
  // Goal CRUD 操作
  addGoal: (topicId: string, goalData: Omit<Goal, 'id' | 'topic_id' | 'version' | 'created_at' | 'updated_at' | 'creator_id'>) => Promise<Goal | null>;
  updateGoal: (goalId: string, expectedVersion: number, updates: Partial<Goal>) => Promise<Goal | null>;
  deleteGoal: (goalId: string) => Promise<boolean>;
  restoreGoal: (goalId: string) => Promise<boolean>;
  updateGoalHelp: (goalId: string, needHelp: boolean, helpMessage?: string) => Promise<boolean>;
  updateGoalReferenceInfo: (goalId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addGoalAttachment: (goalId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeGoalAttachment: (goalId: string, attachmentId: string) => Promise<boolean>;
  addGoalLink: (goalId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeGoalLink: (goalId: string, linkId: string) => Promise<boolean>;
  setGoalOwner: (goalId: string, userId: string) => Promise<Goal | null>;
  addGoalCollaborator: (goalId: string, userId: string) => Promise<boolean>;
  removeGoalCollaborator: (goalId: string, userId: string) => Promise<boolean>;
  
  // Batch operations for performance
  setGoals: (goals: Goal[]) => void;
  clearGoals: () => void;
}

export const useGoalStore = create<GoalStoreState>((set, get) => ({
  goals: {},
  error: undefined,

  // 組合查詢方法
  getGoalsForTopic: (topicId: string) => {
    const state = get();
    return Object.values(state.goals).filter(goal => goal.topic_id === topicId);
  },
  
  getGoalById: (goalId: string) => {
    const state = get();
    return state.goals[goalId];
  },
  
  getAllGoals: () => {
    const state = get();
    return Object.values(state.goals);
  },

  // Batch operations
  setGoals: (goals: Goal[]) => {
    set(state => {
      const goalsMap = { ...state.goals };
      goals.forEach(goal => {
        goalsMap[goal.id] = goal;
      });
      return { goals: goalsMap };
    });
  },

  clearGoals: () => {
    set({ goals: {} });
  },

  /**
   * 添加目標
   */
  addGoal: async (topicId, goalData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const goalDataWithDefaults = {
        title: goalData.title,
        description: goalData.description || '',
        status: goalData.status || 'todo',
        priority: goalData.priority || 'medium',
        order_index: goalData.order_index || 0,
        need_help: goalData.need_help || false,
        topic_id: topicId,
        creator_id: user.id
      };

      const { data, error } = await supabase
        .from('goals')
        .insert([goalDataWithDefaults])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        goals: { ...state.goals, [data.id]: data }
      }));
      return data;
    } catch (error: any) {
      console.error('添加目標失敗:', error);
      set({ error: error.message || '添加目標失敗' });
      return null;
    }
  },

  /**
   * 更新目標（帶版本控制）
   */
  updateGoal: async (goalId, expectedVersion, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const { data, error } = await supabase.rpc('safe_update_goal', {
        p_id: goalId,
        p_expected_version: expectedVersion,
        p_user_id: user.id,
        p_title: updates.title,
        p_description: updates.description,
        p_status: updates.status,
        p_priority: updates.priority,
        p_order_index: updates.order_index,
        p_need_help: updates.need_help,
        p_help_message: updates.help_message,
        p_creator_id: null
      });

      if (error) throw error;
      const result = data as any;
      if (!result || !result.success) {
        if (result && result.message === 'Version conflict detected') {
          throw new Error('目標已被其他用戶修改，請重新載入');
        }
        throw new Error(result?.message || '更新目標失敗');
      }

      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();
      if (goalError) throw goalError;
      
      set(state => ({
        goals: { ...state.goals, [goalId]: goalData }
      }));
      return goalData;
    } catch (error: any) {
      console.error('更新目標失敗:', error);
      set({ error: error.message || '更新目標失敗' });
      throw error;
    }
  },

  /**
   * 刪除目標（歸檔）
   */
  deleteGoal: async (goalId) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ status: 'archived' })
        .eq('id', goalId);
      if (error) throw error;
      
      set(state => {
        const { [goalId]: deleted, ...remainingGoals } = state.goals;
        return { goals: remainingGoals };
      });
      console.log(`📍 deleteGoal - 成功歸檔目標 ${goalId}`);
      return true;
    } catch (error: any) {
      console.error('歸檔目標失敗:', error);
      set({ error: error.message || '歸檔目標失敗' });
      return false;
    }
  },

  /**
   * 還原歸檔的目標
   */
  restoreGoal: async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ status: 'todo' })
        .eq('id', goalId);

      if (error) throw error;

      set(state => {
        const existingGoal = state.goals[goalId];
        if (existingGoal) {
          return {
            goals: { ...state.goals, [goalId]: { ...existingGoal, status: 'todo' } }
          };
        }
        return state;
      });

      console.log(`📍 restoreGoal - 成功還原目標 ${goalId}`);
      return true;
    } catch (error: any) {
      console.error('還原目標失敗:', error);
      set({ error: error.message || '還原目標失敗' });
      return false;
    }
  },

  /**
   * 更新目標求助訊息
   */
  updateGoalHelp: async (goalId: string, needHelp: boolean, helpMessage?: string) => {
    try {
      const existingGoal = get().goals[goalId];
      if (!existingGoal) return false;

      const updateData: Partial<Goal> = {
        need_help: needHelp
      };
      if (needHelp && helpMessage) {
        updateData.help_message = helpMessage;
      } else if (!needHelp) {
        updateData.help_message = undefined;
      }
      
      const result = await get().updateGoal(goalId, existingGoal.version, updateData);
      return !!result;
    } catch (error: any) {
      console.error('更新目標求助訊息失敗:', error);
      return false;
    }
  },

  /**
   * 更新 Goal 參考資訊
   */
  updateGoalReferenceInfo: async (goalId, referenceInfo) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ reference_info: referenceInfo })
        .eq('id', goalId);
      if (error) throw error;
      
      set(state => {
        const existingGoal = state.goals[goalId];
        if (existingGoal) {
          return {
            goals: { ...state.goals, [goalId]: { ...existingGoal, reference_info: referenceInfo } }
          };
        }
        return state;
      });
      return true;
    } catch (error: any) {
      console.error('更新 Goal 參考資訊失敗:', error);
      set({ error: error.message || '更新 Goal 參考資訊失敗' });
      return false;
    }
  },

  /**
   * 新增 Goal 附件
   */
  addGoalAttachment: async (goalId, attachment) => {
    const state = get();
    const targetGoal = state.goals[goalId];
    if (!targetGoal) return false;
    const newAttachment: ReferenceAttachment = {
      ...attachment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    const currentReferenceInfo = targetGoal.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      attachments: [...currentReferenceInfo.attachments, newAttachment]
    };
    return await get().updateGoalReferenceInfo(goalId, updatedReferenceInfo);
  },

  /**
   * 移除 Goal 附件
   */
  removeGoalAttachment: async (goalId, attachmentId) => {
    const state = get();
    const targetGoal = state.goals[goalId];
    if (!targetGoal || !targetGoal.reference_info) return false;
    const updatedReferenceInfo = {
      ...targetGoal.reference_info,
      attachments: targetGoal.reference_info.attachments.filter(a => a.id !== attachmentId)
    };
    return await get().updateGoalReferenceInfo(goalId, updatedReferenceInfo);
  },

  /**
   * 新增 Goal 連結
   */
  addGoalLink: async (goalId, link) => {
    const state = get();
    const targetGoal = state.goals[goalId];
    if (!targetGoal) return false;
    const newLink: ReferenceLink = {
      ...link,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    const currentReferenceInfo = targetGoal.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      links: [...currentReferenceInfo.links, newLink]
    };
    return await get().updateGoalReferenceInfo(goalId, updatedReferenceInfo);
  },

  /**
   * 移除 Goal 連結
   */
  removeGoalLink: async (goalId, linkId) => {
    const state = get();
    const targetGoal = state.goals[goalId];
    if (!targetGoal || !targetGoal.reference_info) return false;
    const updatedReferenceInfo = {
      ...targetGoal.reference_info,
      links: targetGoal.reference_info.links.filter(l => l.id !== linkId)
    };
    return await get().updateGoalReferenceInfo(goalId, updatedReferenceInfo);
  },

  /**
   * 設定目標負責人
   */
  setGoalOwner: async (goalId, userId) => {
    try {
      const { data: updatedGoal, error } = await supabase
        .from('goals')
        .update({ owner_id: userId })
        .eq('id', goalId)
        .select()
        .single();
      if (error) {
        console.error('設置目標負責人失敗:', error);
        return null;
      }
      
      set(state => {
        const existingGoal = state.goals[goalId];
        if (existingGoal) {
          return {
            goals: { ...state.goals, [goalId]: { ...existingGoal, owner_id: userId } }
          };
        }
        return state;
      });
      console.log(`📍 setGoalOwner - 成功設置目標 ${goalId} 負責人為 ${userId}`);
      return updatedGoal as Goal;
    } catch (error: any) {
      console.error('設定目標負責人失敗:', error);
      return null;
    }
  },

  /**
   * 添加目標協作者
   */
  addGoalCollaborator: async (goalId, userId) => {
    try {
      const { data: currentGoal, error: getError } = await supabase
        .from('goals')
        .select('collaborator_ids')
        .eq('id', goalId)
        .single();
      if (getError) {
        console.error('獲取目標協作者失敗:', getError);
        return false;
      }
      const currentCollaborators = currentGoal.collaborator_ids || [];
      if (currentCollaborators.includes(userId)) {
        console.log(`用戶 ${userId} 已是目標 ${goalId} 的協作者`);
        return true;
      }
      const updatedCollaborators = [...currentCollaborators, userId];
      const { error: updateError } = await supabase
        .from('goals')
        .update({ collaborator_ids: updatedCollaborators })
        .eq('id', goalId);
      if (updateError) {
        console.error('更新目標協作者失敗:', updateError);
        return false;
      }
      
      set(state => {
        const existingGoal = state.goals[goalId];
        if (existingGoal) {
          return {
            goals: { ...state.goals, [goalId]: { ...existingGoal, collaborator_ids: updatedCollaborators } }
          };
        }
        return state;
      });
      console.log(`📍 addGoalCollaborator - 成功添加協作者 ${userId} 到目標 ${goalId}`);
      return true;
    } catch (error: any) {
      console.error('添加目標協作者失敗:', error);
      return false;
    }
  },

  /**
   * 移除目標協作者
   */
  removeGoalCollaborator: async (goalId, userId) => {
    try {
      // 先查現有協作者
      const { data: currentGoal, error: getError } = await supabase
        .from('goals')
        .select('collaborator_ids')
        .eq('id', goalId)
        .single();
      if (getError) {
        console.error('獲取目標協作者失敗:', getError);
        return false;
      }
      const currentCollaborators = currentGoal.collaborator_ids || [];
      if (!currentCollaborators.includes(userId)) {
        console.log(`用戶 ${userId} 本來就不是目標 ${goalId} 的協作者`);
        return true;
      }
      const updatedCollaborators = currentCollaborators.filter((id: string) => id !== userId);
      const { error: updateError } = await supabase
        .from('goals')
        .update({ collaborator_ids: updatedCollaborators })
        .eq('id', goalId);
      if (updateError) {
        console.error('更新目標協作者失敗:', updateError);
        return false;
      }
      
      set(state => {
        const existingGoal = state.goals[goalId];
        if (existingGoal) {
          return {
            goals: { ...state.goals, [goalId]: { ...existingGoal, collaborator_ids: updatedCollaborators } }
          };
        }
        return state;
      });
      console.log(`📍 removeGoalCollaborator - 成功移除協作者 ${userId} 從目標 ${goalId}`);
      return true;
    } catch (error: any) {
      console.error('移除目標協作者失敗:', error);
      return false;
    }
  },
}));
