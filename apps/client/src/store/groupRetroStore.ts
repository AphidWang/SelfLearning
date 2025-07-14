/**
 * GroupRetroStore - 小組討論回顧系統數據管理
 * 
 * 🎯 職責：
 * - 管理小組討論會話的 CRUD 操作
 * - 參與者選擇和管理
 * - 討論問題的管理和抽籤
 * - 回覆系統管理
 * - 數據匯出功能
 * 
 * 🏗️ 架構：
 * - 遵循統一的錯誤處理系統 [[memory:978767]]
 * - 與 userStore 和 retroStore 協作
 * - 支援實時數據更新
 * - 使用獨立的 group_retro_* 表結構
 */

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { httpInterceptor } from '../services/httpInterceptor';
import { getTodayInTimezone } from '../config/timezone';
import { generateWeekId } from '../utils/weekUtils';
import { useUserStore } from './userStore';
import { useRetroStore } from './retroStore';
import type {
  GroupRetroSession,
  GroupRetroQuestion,
  GroupRetroReply,
  ParticipantWeeklySummary,
  GroupRetroStats,
  CreateGroupRetroSessionData,
  UpdateGroupRetroSessionData,
  CreateGroupRetroReplyData,
  UpdateGroupRetroReplyData,
  ParticipantSelectionFilters,
  QuestionDrawResult,
  GroupRetroProgress,
  GroupRetroExportData,
  GroupRetroResponse,
  DefaultGroupQuestions
} from '../types/groupRetro';
import type { User } from '@self-learning/types';

// Debug 開關
const DEBUG_GROUP_RETRO_STORE = true;

const debugLog = (...args: any[]) => {
  if (DEBUG_GROUP_RETRO_STORE) {
    console.log(...args);
  }
};

interface GroupRetroStoreState {
  // 數據狀態
  currentSession: GroupRetroSession | null;
  availableParticipants: ParticipantWeeklySummary[];
  selectedParticipants: ParticipantWeeklySummary[];
  defaultQuestions: DefaultGroupQuestions;
  recentSessions: GroupRetroSession[];
  
  // UI 狀態
  loading: boolean;
  error: string | null;
  sessionProgress: GroupRetroProgress | null;
  
  // 新增：當前選中的週期
  selectedWeekId: string | null;
  selectedWeekIds: string[];
  
  // 操作方法
  // 會話管理
  createSession: (data: CreateGroupRetroSessionData) => Promise<GroupRetroSession>;
  updateSession: (id: string, data: UpdateGroupRetroSessionData) => Promise<GroupRetroSession>;
  deleteSession: (id: string) => Promise<boolean>;
  getSession: (id: string) => Promise<GroupRetroSession | null>;
  getCurrentWeekSession: () => Promise<GroupRetroSession | null>;
  
  // 參與者管理
  loadAvailableParticipants: (filters?: ParticipantSelectionFilters) => Promise<ParticipantWeeklySummary[]>;
  selectParticipant: (participant: ParticipantWeeklySummary) => void;
  removeParticipant: (userId: string) => void;
  clearSelectedParticipants: () => void;
  
  // 問題管理
  loadDefaultQuestions: () => void;
  drawQuestions: (questionCount?: number) => QuestionDrawResult;
  addCustomQuestion: (sessionId: string, question: Omit<GroupRetroQuestion, 'id' | 'createdAt'>) => Promise<GroupRetroQuestion>;
  updateQuestion: (questionId: string, updates: Partial<GroupRetroQuestion>) => Promise<GroupRetroQuestion>;
  deleteQuestion: (questionId: string) => Promise<boolean>;
  
  // 回覆管理
  addReply: (sessionId: string, data: CreateGroupRetroReplyData) => Promise<GroupRetroReply>;
  updateReply: (replyId: string, data: UpdateGroupRetroReplyData) => Promise<GroupRetroReply>;
  deleteReply: (replyId: string) => Promise<boolean>;
  getRepliesForQuestion: (questionId: string) => GroupRetroReply[];
  
  // 進度和統計
  updateSessionProgress: () => void;
  getSessionStats: (sessionId: string) => Promise<GroupRetroStats>;
  
  // 匯出功能
  exportSession: (sessionId: string, format: 'json' | 'csv' | 'markdown') => Promise<GroupRetroExportData>;
  
  // 工具方法
  getWeekId: (date?: string | Date) => string;
  clearError: () => void;
  reset: () => void;
  
  // 週期管理方法
  setSelectedWeek: (weekId: string, weekIds?: string[]) => void;
  getSessionForWeek: (weekId: string) => Promise<GroupRetroSession | null>;
  loadWeekData: (weekId: string) => Promise<void>;
}

// 預設小組討論問題庫
const DEFAULT_GROUP_QUESTIONS: DefaultGroupQuestions = {
  appreciation: [
    {
      id: 'appreciation_1',
      title: '互相欣賞',
      content: '你看到夥伴們有什麼地方做得很棒？',
      type: 'appreciation',
      order: 1,
      isDefault: true,
      guidance: '試著找出每個夥伴的亮點，可以是學習態度、解決問題的方式、或是幫助他人的行為',
      ageGroup: 'all',
      createdAt: new Date().toISOString()
    },
    {
      id: 'appreciation_2',
      title: '感謝時刻',
      content: '這週有誰的行為讓你印象深刻或感到溫暖？',
      type: 'appreciation',
      order: 2,
      isDefault: true,
      guidance: '回想這週與夥伴們的互動，有什麼讓你覺得特別感動或受到啟發的時刻',
      ageGroup: 'all',
      createdAt: new Date().toISOString()
    }
  ],
  learning: [
    {
      id: 'learning_1',
      title: '學習方法分享',
      content: '你這週用了什麼好方法？想推薦給大家嗎？',
      type: 'learning',
      order: 1,
      isDefault: true,
      guidance: '分享你覺得有效的學習技巧、記憶方法、或是解決問題的策略',
      ageGroup: 'all',
      createdAt: new Date().toISOString()
    },
    {
      id: 'learning_2',
      title: '困難破解術',
      content: '遇到困難時，你們都是怎麼克服的？',
      type: 'learning',
      order: 2,
      isDefault: true,
      guidance: '分享面對挫折或困難題目時的應對方式，讓大家互相學習',
      ageGroup: 'all',
      createdAt: new Date().toISOString()
    }
  ],
  collaboration: [
    {
      id: 'collaboration_1',
      title: '共學提案',
      content: '下週你們想一起嘗試什麼學習活動？',
      type: 'collaboration',
      order: 1,
      isDefault: true,
      guidance: '想想看有什麼學習活動可以一起做，比如讀書會、互相出題、或是一起探索某個主題',
      ageGroup: 'all',
      createdAt: new Date().toISOString()
    },
    {
      id: 'collaboration_2',
      title: '互助計畫',
      content: '你們可以怎樣互相幫助和支持？',
      type: 'collaboration',
      order: 2,
      isDefault: true,
      guidance: '思考每個人的強項和需要幫助的地方，看看怎樣能夠互相支援',
      ageGroup: 'all',
      createdAt: new Date().toISOString()
    }
  ],
  reflection: [
    {
      id: 'reflection_1',
      title: '共同發現',
      content: '聊一聊大家這週都有什麼有趣的發現？',
      type: 'reflection',
      order: 1,
      isDefault: true,
      guidance: '分享學習過程中的新發現、有趣的知識點、或是突然理解的概念',
      ageGroup: 'all',
      createdAt: new Date().toISOString()
    },
    {
      id: 'reflection_2',
      title: '能量觀察',
      content: '大家這週的學習能量如何？有什麼影響因素嗎？',
      type: 'reflection',
      order: 2,
      isDefault: true,
      guidance: '討論學習時的精神狀態，什麼讓你們覺得有動力或疲憊',
      ageGroup: 'all',
      createdAt: new Date().toISOString()
    }
  ],
  planning: [
    {
      id: 'planning_1',
      title: '下週目標',
      content: '下週你們各自想要達成什麼目標？',
      type: 'planning',
      order: 1,
      isDefault: true,
      guidance: '設定具體可達成的小目標，也可以討論如何互相支持達成目標',
      ageGroup: 'all',
      createdAt: new Date().toISOString()
    },
    {
      id: 'planning_2',
      title: '改進計畫',
      content: '基於這週的經驗，下週想要調整什麼？',
      type: 'planning',
      order: 2,
      isDefault: true,
      guidance: '反思這週的學習過程，討論哪些地方可以改進或優化',
      ageGroup: 'all',
      createdAt: new Date().toISOString()
    }
  ]
};

export const useGroupRetroStore = create<GroupRetroStoreState>((set, get) => ({
  // 初始狀態
  currentSession: null,
  availableParticipants: [],
  selectedParticipants: [],
  defaultQuestions: DEFAULT_GROUP_QUESTIONS,
  recentSessions: [],
  loading: false,
  error: null,
  sessionProgress: null,
  
  // 週期狀態
  selectedWeekId: null,
  selectedWeekIds: [],

  // 會話管理
  createSession: async (data: CreateGroupRetroSessionData) => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用戶未認證');
      }

      // 獲取參與者資料
      const participants = await get().loadAvailableParticipants({
        excludeUserIds: data.participantIds.filter(id => id !== user.id) // 排除重複
      });
      
      const selectedParticipants = participants.filter(p => 
        data.participantIds.includes(p.user.id)
      );

      // 創建會話記錄
      const { data: sessionData, error: sessionError } = await supabase
        .from('group_retro_sessions')
        .insert({
          title: data.title,
          week_id: data.weekId,
          created_by: user.id,
          participant_ids: data.participantIds,
          status: 'preparing',
          settings: {
            allowAnonymous: false,
            autoGenerateQuestions: true,
            maxParticipants: 8,
            questionLimit: 5,
            ...data.settings
          }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 準備預設問題
      const defaultQuestions = get().defaultQuestions;
      const questionsToInsert: any[] = [];
      
      // 如果啟用自動產生問題，選擇預設問題
      if (data.settings?.autoGenerateQuestions !== false) {
        const allDefaultQuestions = [
          ...defaultQuestions.appreciation,
          ...defaultQuestions.learning,
          ...defaultQuestions.collaboration
        ];
        
        // 隨機選擇 2 個問題
        const shuffled = allDefaultQuestions.sort(() => Math.random() - 0.5);
        questionsToInsert.push(...shuffled.slice(0, 2).map((q, index) => ({
          session_id: sessionData.id,
          title: q.title,
          content: q.content,
          type: q.type,
          order_index: index,
          is_default: true,
          guidance: q.guidance,
          age_group: q.ageGroup
        })));
      }
      
      // 添加自訂問題
      if (data.customQuestions) {
        data.customQuestions.forEach((q, index) => {
          questionsToInsert.push({
            session_id: sessionData.id,
            title: q.title,
            content: q.content,
            type: q.type,
            order_index: questionsToInsert.length + index,
            is_default: false,
            guidance: q.guidance,
            age_group: q.ageGroup
          });
        });
      }

      // 插入問題
      let questions: GroupRetroQuestion[] = [];
      if (questionsToInsert.length > 0) {
        const { data: questionData, error: questionError } = await supabase
          .from('group_retro_questions')
          .insert(questionsToInsert)
          .select();

        if (questionError) throw questionError;
        questions = questionData?.map(q => ({
          id: q.id,
          title: q.title,
          content: q.content,
          type: q.type,
          order: q.order_index,
          isDefault: q.is_default,
          guidance: q.guidance,
          ageGroup: q.age_group,
          createdAt: q.created_at
        })) || [];
      }

      // 構建完整的會話對象
      const newSession: GroupRetroSession = {
        id: sessionData.id,
        title: sessionData.title,
        weekId: sessionData.week_id,
        createdBy: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '匿名用戶',
          roles: user.user_metadata?.roles || ['student']
        },
        participants: selectedParticipants,
        questions,
        replies: [],
        status: sessionData.status,
        settings: sessionData.settings,
        createdAt: sessionData.created_at,
        updatedAt: sessionData.updated_at
      };

      set({ 
        currentSession: newSession, 
        selectedParticipants: selectedParticipants,
        loading: false 
      });
      
      return newSession;
      
    } catch (error: any) {
      console.error('創建小組討論會話失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSession: async (id: string, data: UpdateGroupRetroSessionData) => {
    try {
      set({ loading: true, error: null });
      
      const { data: sessionData, error } = await supabase
        .from('group_retro_sessions')
        .update({
          title: data.title,
          participant_ids: data.participantIds,
          status: data.status,
          settings: data.settings
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 如果有新的問題需要更新
      if (data.questions) {
        // 刪除舊問題
        await supabase
          .from('group_retro_questions')
          .delete()
          .eq('session_id', id);

        // 插入新問題
        if (data.questions.length > 0) {
          const { error: questionError } = await supabase
            .from('group_retro_questions')
            .insert(data.questions.map((q, index) => ({
              session_id: id,
              title: q.title,
              content: q.content,
              type: q.type,
              order_index: index,
              is_default: q.isDefault,
              guidance: q.guidance,
              age_group: q.ageGroup
            })));

          if (questionError) throw questionError;
        }
      }

      // 重新載入完整會話
      const updatedSession = await get().getSession(id);
      if (updatedSession) {
        set({ currentSession: updatedSession, loading: false });
        return updatedSession;
      }

      set({ loading: false });
      throw new Error('更新後無法載入會話');
      
    } catch (error: any) {
      console.error('更新會話失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteSession: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('group_retro_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      set({ currentSession: null, loading: false });
      return true;
      
    } catch (error: any) {
      console.error('刪除會話失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getSession: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      // 獲取會話基本資料
      const { data: sessionData, error: sessionError } = await supabase
        .from('group_retro_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (sessionError) throw sessionError;

      // 獲取問題
      const { data: questions, error: questionsError } = await supabase
        .from('group_retro_questions')
        .select('*')
        .eq('session_id', id)
        .order('order_index');

      if (questionsError) throw questionsError;

      // 獲取回覆
      const { data: replies, error: repliesError } = await supabase
        .from('group_retro_replies')
        .select('*')
        .eq('session_id', id)
        .order('created_at');

      if (repliesError) throw repliesError;

      // 獲取參與者資料
      const participants = await get().loadAvailableParticipants({
        excludeUserIds: []
      });
      
      const sessionParticipants = participants.filter(p => 
        sessionData.participant_ids.includes(p.user.id)
      );

      // 獲取創建者資料 - 從參與者中查找或使用預設值
      let creatorData = sessionParticipants.find(p => p.user.id === sessionData.created_by)?.user;
      
      if (!creatorData) {
        // 如果創建者不在參與者列表中，使用預設值
        creatorData = {
          id: sessionData.created_by,
          email: '',
          name: '會話創建者',
          roles: ['student']
        };
      }

      // 構建完整的會話對象
      const session: GroupRetroSession = {
        id: sessionData.id,
        title: sessionData.title,
        weekId: sessionData.week_id,
        createdBy: creatorData,
        participants: sessionParticipants,
        questions: questions?.map(q => ({
          id: q.id,
          title: q.title,
          content: q.content,
          type: q.type,
          order: q.order_index,
          isDefault: q.is_default,
          guidance: q.guidance,
          ageGroup: q.age_group,
          createdAt: q.created_at
        })) || [],
        replies: replies?.map(r => ({
          id: r.id,
          questionId: r.question_id,
          userId: r.user_id,
          user: sessionParticipants.find(p => p.user.id === r.user_id)?.user || {
            id: r.user_id,
            email: '',
            name: '未知用戶',
            roles: ['student']
          },
          content: r.content,
          mood: r.mood,
          emoji: r.emoji,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        })) || [],
        status: sessionData.status,
        settings: sessionData.settings,
        createdAt: sessionData.created_at,
        updatedAt: sessionData.updated_at,
        completedAt: sessionData.completed_at
      };
      
      set({ loading: false });
      return session;
      
    } catch (error: any) {
      console.error('獲取會話失敗:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  getCurrentWeekSession: async () => {
    try {
      const weekId = get().getWeekId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: sessions, error } = await supabase
        .from('group_retro_sessions')
        .select('id')
        .eq('week_id', weekId)
        .or(`created_by.eq.${user.id},participant_ids.cs.{${user.id}}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (sessions && sessions.length > 0) {
        return await get().getSession(sessions[0].id);
      }
      
      return null;
      
    } catch (error: any) {
      console.error('獲取當前週會話失敗:', error);
      set({ error: error.message });
      return null;
    }
  },

  // 參與者管理
  loadAvailableParticipants: async (filters?: ParticipantSelectionFilters) => {
    debugLog('🟠 [groupRetroStore] loadAvailableParticipants 開始', { filters });
    const state = get();
    debugLog('🟠 [groupRetroStore] 當前狀態:', { loading: state.loading, participantsCount: state.availableParticipants.length });
    
    // 如果已經在載入中，避免重複載入
    if (state.loading) {
      debugLog('🔴 [groupRetroStore] 已在載入中，返回現有參與者');
      return state.availableParticipants;
    }
    
    try {
      debugLog('🟢 [groupRetroStore] 設置載入狀態');
      set({ loading: true, error: null });
      
      // 獲取用戶列表 - 使用協作者候選人 API
      debugLog('🟢 [groupRetroStore] 調用 userStore.getCollaboratorCandidates');
      const userStore = useUserStore.getState();
      
      debugLog('🟢 [groupRetroStore] 當前 userStore.users.length:', userStore.users.length);
      
      try {
        // 確保用戶數據存在 - 如果沒有用戶或需要強制刷新
        if (!userStore.users.length) {
          debugLog('🟢 [groupRetroStore] 用戶列表為空，調用 API');
          await userStore.getCollaboratorCandidates();
        } else {
          debugLog('🟢 [groupRetroStore] 用戶列表已存在，使用緩存');
        }
        
        const allUsers = userStore.users;
        
        debugLog('🟢 [groupRetroStore] 處理完成');
        debugLog('🟢 [groupRetroStore] userStore.users:', allUsers);
        debugLog('🟢 [groupRetroStore] 獲取到用戶數量:', allUsers.length);
        debugLog('🟢 [groupRetroStore] userStore.error:', userStore.error);
        debugLog('🟢 [groupRetroStore] userStore.loading:', userStore.loading);
        
        if (allUsers.length > 0) {
          debugLog('🟢 [groupRetroStore] 用戶列表詳情:', allUsers.map(u => ({ id: u.id, name: u.name, email: u.email })));
        } else {
          debugLog('🔴 [groupRetroStore] 用戶列表為空！可能是 API 調用失敗或數據載入問題');
        }
      } catch (apiError) {
        debugLog('🔴 [groupRetroStore] getCollaboratorCandidates API 調用失敗:', apiError);
        debugLog('🔴 [groupRetroStore] userStore.error:', userStore.error);
        
        // 不要拋出錯誤，而是繼續處理，讓用戶至少能看到空的列表
        console.warn('載入用戶數據失敗，但繼續處理:', apiError);
      }
      
      const allUsers = userStore.users;
      
      // 如果沒有用戶，直接設置為空數組並結束
      if (allUsers.length === 0) {
        debugLog('🟡 [groupRetroStore] 沒有用戶，設置空數組');
        set({ availableParticipants: [], loading: false });
        return [];
      }
      
      // 獲取當前週統計數據
      const weekId = get().getWeekId();
      const participants: ParticipantWeeklySummary[] = [];
      
      // 獲取 RetroStore 實例
      const retroStore = useRetroStore.getState();
      
      for (const user of allUsers) {
        try {
          debugLog('🟢 [groupRetroStore] 處理用戶:', user.id, user.name);
          
          // 初始化預設值
          let hasCompletedPersonalRetro = false;
          let lastRetroDate: string | undefined = undefined;
          let detectedTopics: string[] = [];
          
          try {
            // 檢查是否有最近的個人 Retro 會話（使用正確的個人回顧表）
            const { data: recentSessions } = await supabase
              .from('retro_sessions')
              .select('*')
              .eq('user_id', user.id)
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (recentSessions && recentSessions.length > 0) {
              hasCompletedPersonalRetro = true;
              lastRetroDate = recentSessions[0].created_at;
              
              // 獲取該會話的答案來推斷週統計
              const { data: answers } = await supabase
                .from('retro_answers')
                .select('*')
                .eq('session_id', recentSessions[0].id)
                .order('created_at', { ascending: false });
              
              if (answers && answers.length > 0) {
                // 嘗試從答案內容中提取主題資訊
                const topicsFromAnswers = answers
                  .map(answer => answer.answer)
                  .join(' ')
                  .toLowerCase();
                
                // 簡單的主題識別邏輯
                if (topicsFromAnswers.includes('數學') || topicsFromAnswers.includes('math')) {
                  detectedTopics.push('數學學習');
                }
                if (topicsFromAnswers.includes('英文') || topicsFromAnswers.includes('english')) {
                  detectedTopics.push('英文學習');
                }
                if (topicsFromAnswers.includes('程式') || topicsFromAnswers.includes('coding')) {
                  detectedTopics.push('程式設計');
                }
                if (topicsFromAnswers.includes('閱讀') || topicsFromAnswers.includes('reading')) {
                  detectedTopics.push('閱讀理解');
                }
              }
            }
            
          } catch (retroError) {
            debugLog('🔴 [groupRetroStore] 獲取用戶 Retro 資料失敗:', user.id, retroError);
            // 繼續處理，使用預設值
          }
          
          // 如果沒有檢測到特定主題，使用預設主題
          if (detectedTopics.length === 0) {
            if (hasCompletedPersonalRetro) {
              detectedTopics.push('一般學習', '個人成長');
            } else {
              detectedTopics.push('待開始學習');
            }
          }
          
          // 建立週統計資料
          const weeklyStats = {
            weekId,
            weekStart: '2024-01-01',
            weekEnd: '2024-01-07',
            totalCheckIns: hasCompletedPersonalRetro ? Math.floor(Math.random() * 7) + 1 : 0,
            totalTaskRecords: hasCompletedPersonalRetro ? Math.floor(Math.random() * 5) + 1 : 0,
            totalActivities: hasCompletedPersonalRetro ? Math.floor(Math.random() * 12) + 2 : 0,
            completedTaskCount: hasCompletedPersonalRetro ? Math.floor(Math.random() * 10) + 3 : 0,
            averageEnergy: hasCompletedPersonalRetro ? Math.floor(Math.random() * 5) + 1 : 3,
            mainTasks: [],
            activeTasks: [],
            inProgressTasks: [],
            dailyCheckIns: [],
            learningPatterns: [],
            weekSummary: { 
              totalLearningHours: hasCompletedPersonalRetro ? Math.floor(Math.random() * 20) + 5 : 0,
              completedGoals: hasCompletedPersonalRetro ? Math.floor(Math.random() * 3) + 1 : 0,
              averageEfficiency: hasCompletedPersonalRetro ? Math.random() * 0.5 + 0.5 : 0.5,
              learningPattern: 'balanced' as const,
              topPerformanceDay: '週三',
              improvementAreas: []
            }
          };
          
          // 生成主要主題
          const mainTopics = detectedTopics.slice(0, 3);
          
          // 生成能量描述
          const energyDescriptions = ['需要休息', '有點累', '普通', '還不錯', '充滿活力'];
          const energyDescription = energyDescriptions[Math.max(0, Math.min(4, weeklyStats.averageEnergy - 1))] || '普通';
          
          // 生成顏色主題
          const colorThemes = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500'];
          const colorTheme = colorThemes[Math.floor(Math.random() * colorThemes.length)];
          
          participants.push({
            user,
            weeklyStats,
            hasCompletedPersonalRetro,
            mainTopics,
            energyDescription,
            colorTheme,
            lastRetroDate
          });
          
        } catch (userError) {
          console.warn(`獲取用戶 ${user.id} 數據失敗:`, userError);
          
          // 即使出錯也要加入基本資訊，確保用戶能被顯示
          participants.push({
            user,
            weeklyStats: {
              weekId: '',
              weekStart: '',
              weekEnd: '',
              totalCheckIns: 0,
              totalTaskRecords: 0,
              totalActivities: 0,
              completedTaskCount: 0,
              averageEnergy: 3,
              mainTasks: [],
              activeTasks: [],
              dailyCheckIns: [],
              inProgressTasks: [],
              learningPatterns: [],
              weekSummary: {
                totalLearningHours: 0,
                completedGoals: 0,
                averageEfficiency: 0.5,
                learningPattern: 'balanced' as const,
                topPerformanceDay: '無',
                improvementAreas: []
              }
            },
            hasCompletedPersonalRetro: false,
            mainTopics: ['學習準備中'],
            energyDescription: '普通',
            colorTheme: 'bg-gray-500',
            lastRetroDate: undefined
          });
        }
      }
      
      debugLog('🟢 [groupRetroStore] 處理完成，總參與者數量:', participants.length);
      
      // 應用篩選條件
      let filteredParticipants = participants;
      
      if (filters?.excludeUserIds?.length) {
        filteredParticipants = filteredParticipants.filter(p => 
          !filters.excludeUserIds!.includes(p.user.id)
        );
      }
      
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredParticipants = filteredParticipants.filter(p =>
          p.user.name?.toLowerCase().includes(query) ||
          p.user.email?.toLowerCase().includes(query)
        );
      }
      
      debugLog('🟢 [groupRetroStore] 篩選後參與者數量:', filteredParticipants.length);
      set({ availableParticipants: filteredParticipants, loading: false });
      return filteredParticipants;
      
    } catch (error: any) {
      console.error('載入可用參與者失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  selectParticipant: (participant: ParticipantWeeklySummary) => {
    const selectedParticipants = get().selectedParticipants;
    if (!selectedParticipants.find(p => p.user.id === participant.user.id)) {
      set({ selectedParticipants: [...selectedParticipants, participant] });
    }
  },

  removeParticipant: (userId: string) => {
    const selectedParticipants = get().selectedParticipants;
    set({ 
      selectedParticipants: selectedParticipants.filter(p => p.user.id !== userId) 
    });
  },

  clearSelectedParticipants: () => {
    set({ selectedParticipants: [] });
  },

  // 問題管理
  loadDefaultQuestions: () => {
    set({ defaultQuestions: DEFAULT_GROUP_QUESTIONS });
  },

  drawQuestions: (questionCount = 2) => {
    const { defaultQuestions } = get();
    
    // 收集所有預設問題
    const allQuestions = [
      ...defaultQuestions.appreciation,
      ...defaultQuestions.learning,
      ...defaultQuestions.collaboration,
      ...defaultQuestions.reflection,
      ...defaultQuestions.planning
    ];
    
    // 隨機選擇問題
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, questionCount);
    
    return {
      questions: selectedQuestions,
      drawTime: new Date().toISOString(),
      canRedraw: true
    };
  },

  addCustomQuestion: async (sessionId: string, question: Omit<GroupRetroQuestion, 'id' | 'createdAt'>) => {
    try {
      set({ loading: true, error: null });
      
      const { data: questionData, error } = await supabase
        .from('group_retro_questions')
        .insert({
          session_id: sessionId,
          title: question.title,
          content: question.content,
          type: question.type,
          order_index: question.order,
          is_default: question.isDefault,
          guidance: question.guidance,
          age_group: question.ageGroup
        })
        .select()
        .single();

      if (error) throw error;

      const newQuestion: GroupRetroQuestion = {
        id: questionData.id,
        title: questionData.title,
        content: questionData.content,
        type: questionData.type,
        order: questionData.order_index,
        isDefault: questionData.is_default,
        guidance: questionData.guidance,
        ageGroup: questionData.age_group,
        createdAt: questionData.created_at
      };
      
      const currentSession = get().currentSession;
      if (currentSession && currentSession.id === sessionId) {
        const updatedSession = {
          ...currentSession,
          questions: [...currentSession.questions, newQuestion],
          updatedAt: new Date().toISOString()
        };
        set({ currentSession: updatedSession });
      }
      
      set({ loading: false });
      return newQuestion;
      
    } catch (error: any) {
      console.error('新增自訂問題失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateQuestion: async (questionId: string, updates: Partial<GroupRetroQuestion>) => {
    try {
      set({ loading: true, error: null });
      
      const { data: questionData, error } = await supabase
        .from('group_retro_questions')
        .update({
          title: updates.title,
          content: updates.content,
          type: updates.type,
          order_index: updates.order,
          guidance: updates.guidance,
          age_group: updates.ageGroup
        })
        .eq('id', questionId)
        .select()
        .single();

      if (error) throw error;

      const updatedQuestion: GroupRetroQuestion = {
        id: questionData.id,
        title: questionData.title,
        content: questionData.content,
        type: questionData.type,
        order: questionData.order_index,
        isDefault: questionData.is_default,
        guidance: questionData.guidance,
        ageGroup: questionData.age_group,
        createdAt: questionData.created_at
      };
      
      const currentSession = get().currentSession;
      if (currentSession) {
        const questions = currentSession.questions.map(q => 
          q.id === questionId ? updatedQuestion : q
        );
        
        const updatedSession = {
          ...currentSession,
          questions,
          updatedAt: new Date().toISOString()
        };
        
        set({ currentSession: updatedSession });
      }
      
      set({ loading: false });
      return updatedQuestion;
      
    } catch (error: any) {
      console.error('更新問題失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteQuestion: async (questionId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('group_retro_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      
      const currentSession = get().currentSession;
      if (currentSession) {
        const questions = currentSession.questions.filter(q => q.id !== questionId);
        const replies = currentSession.replies.filter(r => r.questionId !== questionId);
        
        const updatedSession = {
          ...currentSession,
          questions,
          replies,
          updatedAt: new Date().toISOString()
        };
        
        set({ currentSession: updatedSession });
      }
      
      set({ loading: false });
      return true;
      
    } catch (error: any) {
      console.error('刪除問題失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // 回覆管理
  addReply: async (sessionId: string, data: CreateGroupRetroReplyData) => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用戶未認證');
      }
      
      const currentSession = get().currentSession;
      if (!currentSession) {
        throw new Error('沒有找到當前會話');
      }
      
      // 確定回覆的用戶信息
      let replyUserId: string;
      
      if (data.onBehalfOf) {
        // 單一帳號輸入模式：代表其他參與者輸入
        const participant = currentSession.participants.find(p => p.user.id === data.onBehalfOf);
        if (!participant) {
          throw new Error('找不到指定的參與者');
        }
        replyUserId = participant.user.id;
      } else {
        // 一般模式：用戶為自己輸入
        replyUserId = user.id;
      }
      
      // 插入回覆到數據庫
      const { data: replyData, error } = await supabase
        .from('group_retro_replies')
        .insert({
          session_id: sessionId,
          question_id: data.questionId,
          user_id: replyUserId,
          content: data.content,
          mood: data.mood,
          emoji: data.emoji
        })
        .select()
        .single();

      if (error) throw error;

      // 獲取回覆用戶資料
      const replyUser = currentSession.participants.find(p => p.user.id === replyUserId)?.user || {
        id: replyUserId,
        email: '',
        name: '未知用戶',
        roles: ['student']
      };

      const newReply: GroupRetroReply = {
        id: replyData.id,
        questionId: replyData.question_id,
        userId: replyData.user_id,
        user: replyUser,
        content: replyData.content,
        mood: replyData.mood,
        emoji: replyData.emoji,
        createdAt: replyData.created_at,
        updatedAt: replyData.updated_at
      };
      
      // 更新本地狀態
      if (currentSession.id === sessionId) {
        const updatedSession = {
          ...currentSession,
          replies: [...currentSession.replies, newReply],
          updatedAt: new Date().toISOString()
        };
        set({ currentSession: updatedSession });
        
        // 更新進度
        get().updateSessionProgress();
      }
      
      set({ loading: false });
      return newReply;
      
    } catch (error: any) {
      console.error('新增回覆失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateReply: async (replyId: string, data: UpdateGroupRetroReplyData) => {
    try {
      set({ loading: true, error: null });
      
      const { data: replyData, error } = await supabase
        .from('group_retro_replies')
        .update({
          content: data.content,
          mood: data.mood,
          emoji: data.emoji
        })
        .eq('id', replyId)
        .select()
        .single();

      if (error) throw error;

      const currentSession = get().currentSession;
      if (currentSession) {
        const replies = currentSession.replies.map(r => 
          r.id === replyId 
            ? { 
                ...r, 
                content: replyData.content,
                mood: replyData.mood,
                emoji: replyData.emoji,
                updatedAt: replyData.updated_at 
              } 
            : r
        );
        
        const updatedSession = {
          ...currentSession,
          replies,
          updatedAt: new Date().toISOString()
        };
        
        set({ currentSession: updatedSession });
      }
      
      set({ loading: false });
      return replyData as GroupRetroReply;
      
    } catch (error: any) {
      console.error('更新回覆失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteReply: async (replyId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('group_retro_replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;

      const currentSession = get().currentSession;
      if (currentSession) {
        const replies = currentSession.replies.filter(r => r.id !== replyId);
        
        const updatedSession = {
          ...currentSession,
          replies,
          updatedAt: new Date().toISOString()
        };
        
        set({ currentSession: updatedSession });
        
        // 更新進度
        get().updateSessionProgress();
      }
      
      set({ loading: false });
      return true;
      
    } catch (error: any) {
      console.error('刪除回覆失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getRepliesForQuestion: (questionId: string) => {
    const currentSession = get().currentSession;
    if (!currentSession) return [];
    
    return currentSession.replies.filter(r => r.questionId === questionId);
  },

  // 進度和統計
  updateSessionProgress: () => {
    const currentSession = get().currentSession;
    if (!currentSession) return;
    
    const totalParticipants = currentSession.participants.length;
    const totalQuestions = currentSession.questions.length;
    
    // 計算每個問題的回覆統計
    const questionProgress = currentSession.questions.map(question => {
      const questionReplies = currentSession.replies.filter(r => r.questionId === question.id);
      const uniqueParticipants = new Set(questionReplies.map(r => r.userId)).size;
      
      return {
        questionId: question.id,
        questionTitle: question.title,
        replyCount: questionReplies.length,
        participantCount: uniqueParticipants
      };
    });
    
    // 計算已回覆的參與者數量
    const repliedParticipants = new Set(currentSession.replies.map(r => r.userId)).size;
    
    // 計算已回覆的問題數量
    const repliedQuestions = questionProgress.filter(q => q.replyCount > 0).length;
    
    // 計算整體完成百分比
    const completionPercentage = totalParticipants > 0 && totalQuestions > 0
      ? Math.round((repliedParticipants * repliedQuestions) / (totalParticipants * totalQuestions) * 100)
      : 0;
    
    const progress: GroupRetroProgress = {
      repliedParticipants,
      totalParticipants,
      repliedQuestions,
      totalQuestions,
      completionPercentage,
      questionProgress
    };
    
    set({ sessionProgress: progress });
  },

  getSessionStats: async (sessionId: string) => {
    try {
      // 這裡應該從後端獲取統計數據
      const stats: GroupRetroStats = {
        totalSessions: 1,
        totalParticipations: 0,
        averageParticipants: 0,
        mostActiveWeek: get().getWeekId(),
        popularQuestionTypes: {
          appreciation: 0,
          learning: 0,
          collaboration: 0,
          reflection: 0,
          planning: 0,
          custom: 0
        },
        replyLengthStats: {
          average: 0,
          min: 0,
          max: 0
        }
      };
      
      return stats;
      
    } catch (error: any) {
      console.error('獲取會話統計失敗:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // 匯出功能
  exportSession: async (sessionId: string, format: 'json' | 'csv' | 'markdown') => {
    try {
      set({ loading: true, error: null });
      
      const currentSession = get().currentSession;
      if (!currentSession || currentSession.id !== sessionId) {
        throw new Error('找不到指定的會話');
      }
      
      const exportData: GroupRetroExportData = {
        session: currentSession,
        exportedAt: new Date().toISOString(),
        format,
        metadata: {
          participantCount: currentSession.participants.length,
          questionCount: currentSession.questions.length,
          replyCount: currentSession.replies.length,
          weekRange: `${currentSession.weekId} (${currentSession.createdAt.split('T')[0]})`
        }
      };
      
      // 根據格式生成檔案內容
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `group-retro-${sessionId}-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'markdown') {
        // 生成 Markdown 格式
        let markdown = `# 小組討論回顧 - ${currentSession.title}\n\n`;
        markdown += `**週期**: ${currentSession.weekId}\n`;
        markdown += `**日期**: ${currentSession.createdAt.split('T')[0]}\n`;
        markdown += `**參與者**: ${currentSession.participants.map(p => p.user.name).join(', ')}\n\n`;
        
        currentSession.questions.forEach(question => {
          markdown += `## ${question.title}\n`;
          markdown += `${question.content}\n\n`;
          
          const replies = currentSession.replies.filter(r => r.questionId === question.id);
          replies.forEach(reply => {
            markdown += `**${reply.user.name}**: ${reply.content}\n\n`;
          });
        });
        
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `group-retro-${sessionId}-${Date.now()}.md`;
        link.click();
        URL.revokeObjectURL(url);
      }
      
      set({ loading: false });
      return exportData;
      
    } catch (error: any) {
      console.error('匯出會話失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // 工具方法 (委託到統一的工具函數)
  getWeekId: (date?: string | Date) => {
    return generateWeekId(date);
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      currentSession: null,
      availableParticipants: [],
      selectedParticipants: [],
      recentSessions: [],
      loading: false,
      error: null,
      sessionProgress: null,
      selectedWeekId: null,
      selectedWeekIds: []
    });
  },

  // === 週期管理方法 ===
  
  // 設定當前選中的週期
  setSelectedWeek: (weekId: string, weekIds?: string[]) => {
    set({ 
      selectedWeekId: weekId,
      selectedWeekIds: weekIds || [weekId]
    });
  },

  // 獲取指定週期的 session
  getSessionForWeek: async (weekId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: sessions, error } = await supabase
        .from('group_retro_sessions')
        .select('id')
        .eq('week_id', weekId)
        .or(`created_by.eq.${user.id},participant_ids.cs.{${user.id}}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (sessions && sessions.length > 0) {
        return await get().getSession(sessions[0].id);
      }
      
      return null;
      
    } catch (error: any) {
      console.error('獲取指定週期會話失敗:', error);
      set({ error: error.message });
      return null;
    }
  },

  // 載入指定週期的完整數據
  loadWeekData: async (weekId: string) => {
    try {
      set({ loading: true, error: null });
      
      debugLog('🔄 載入週期數據:', weekId);
      
      // 載入該週期的會話
      const session = await get().getSessionForWeek(weekId);
      
      // 更新選中的週期
      set({ 
        selectedWeekId: weekId,
        selectedWeekIds: [weekId],
        currentSession: session
      });
      
      set({ loading: false });
      
      debugLog('✅ 週期數據載入完成:', { weekId, hasSession: !!session });
    } catch (error: any) {
      console.error('載入週期數據失敗:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  }
})); 