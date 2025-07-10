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
 */

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { httpInterceptor } from '../services/httpInterceptor';
import { getTodayInTimezone, getWeekStart, getWeekEnd } from '../config/timezone';
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
  getWeekId: (date?: string) => string;
  clearError: () => void;
  reset: () => void;
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

      // 準備預設問題
      const defaultQuestions = get().defaultQuestions;
      const questions: GroupRetroQuestion[] = [];
      
      // 如果啟用自動產生問題，選擇預設問題
      if (data.settings?.autoGenerateQuestions !== false) {
        const allDefaultQuestions = [
          ...defaultQuestions.appreciation,
          ...defaultQuestions.learning,
          ...defaultQuestions.collaboration
        ];
        
        // 隨機選擇 2 個問題
        const shuffled = allDefaultQuestions.sort(() => Math.random() - 0.5);
        questions.push(...shuffled.slice(0, 2));
      }
      
      // 添加自訂問題
      if (data.customQuestions) {
        data.customQuestions.forEach((q, index) => {
          questions.push({
            ...q,
            id: `custom_${Date.now()}_${index}`,
            createdAt: new Date().toISOString()
          });
        });
      }

      const sessionData: Omit<GroupRetroSession, 'id' | 'createdAt' | 'updatedAt'> = {
        title: data.title,
        weekId: data.weekId,
        createdBy: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '匿名用戶',
          roles: user.user_metadata?.roles || ['student']
        },
        participants: selectedParticipants,
        questions,
        replies: [],
        status: 'preparing',
        settings: {
          allowAnonymous: false,
          autoGenerateQuestions: true,
          maxParticipants: 8,
          questionLimit: 5,
          ...data.settings
        }
      };

      // 這裡應該調用後端 API 保存會話
      // 暫時模擬本地儲存
      const newSession: GroupRetroSession = {
        ...sessionData,
        id: `session_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
      
      const currentSession = get().currentSession;
      if (!currentSession || currentSession.id !== id) {
        throw new Error('找不到指定的會話');
      }

      // 這裡應該調用後端 API 更新會話
      const updatedSession: GroupRetroSession = {
        ...currentSession,
        ...data,
        settings: {
          ...currentSession.settings,
          ...data.settings
        },
        updatedAt: new Date().toISOString()
      };

      set({ currentSession: updatedSession, loading: false });
      return updatedSession;
      
    } catch (error: any) {
      console.error('更新會話失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteSession: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      // 這裡應該調用後端 API 刪除會話
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
      
      // 這裡應該調用後端 API 獲取會話
      const session = null; // 暫時返回 null
      
      set({ loading: false });
      return session;
      
    } catch (error: any) {
      console.error('獲取會話失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getCurrentWeekSession: async () => {
    try {
      const weekId = get().getWeekId();
      
      // 這裡應該查詢當前週的會話
      // 暫時返回 currentSession 如果週 ID 匹配
      const currentSession = get().currentSession;
      if (currentSession && currentSession.weekId === weekId) {
        return currentSession;
      }
      
      return null;
      
    } catch (error: any) {
      console.error('獲取當前週會話失敗:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // 參與者管理
  loadAvailableParticipants: async (filters?: ParticipantSelectionFilters) => {
    try {
      set({ loading: true, error: null });
      
      // 獲取用戶列表 - 使用協作者候選人 API
      const userStore = useUserStore.getState();
      await userStore.getCollaboratorCandidates();
      const allUsers = userStore.users;
      
      // 獲取當前週統計數據
      const weekId = get().getWeekId();
      
      const participants: ParticipantWeeklySummary[] = [];
      
      for (const user of allUsers) {
        try {
          // 暫時使用模擬數據來生成週統計
          // TODO: 實現真正的多用戶週統計查詢
          const weeklyStats = {
            weekId,
            completedTasks: Math.floor(Math.random() * 15) + 5,
            checkInDays: Math.floor(Math.random() * 7) + 1,
            averageEnergy: Math.floor(Math.random() * 5) + 1,
            mainTopics: [
              { id: '1', title: '數學學習', subject: '數學', progress: Math.random() * 100, taskCount: 10, completedTaskCount: Math.floor(Math.random() * 5) + 1 },
              { id: '2', title: '閱讀理解', subject: '語文', progress: Math.random() * 100, taskCount: 8, completedTaskCount: Math.floor(Math.random() * 3) + 1 },
              { id: '3', title: '程式設計', subject: '電腦', progress: Math.random() * 100, taskCount: 12, completedTaskCount: Math.floor(Math.random() * 4) + 1 }
            ],
            weeklyGoal: '提升學習效率',
            currentStreak: Math.floor(Math.random() * 30) + 1,
            achievements: [],
            checkInCount: Math.floor(Math.random() * 7) + 1,
            completedTaskCount: Math.floor(Math.random() * 15) + 5,
            mainTasks: [],
            weekRange: { start: '2024-01-01', end: '2024-01-07' },
            // 添加缺少的屬性
            dailyCheckIns: [],
            energyTimeline: [],
            inProgressTasks: [],
            weekSummary: { keywords: [], summary: '', mostActiveSubject: '', mostChallengingTask: null, learningPattern: 'balanced' as const },
            socialInteractions: { collaborativeTaskCount: 0, collaborators: [], helpReceived: 0, helpProvided: 0 }
          };
          
          // 檢查是否完成個人 Retro (暫時隨機)
          const hasCompletedPersonalRetro = Math.random() > 0.3;
          
          // 生成主要主題
          const mainTopics = weeklyStats.mainTopics
            .slice(0, 3)
            .map(topic => topic.title);
          
          // 生成能量描述
          const energyDescriptions = ['充滿活力', '還不錯', '普通', '有點累', '需要休息'];
          const energyDescription = energyDescriptions[Math.max(0, weeklyStats.averageEnergy - 1)] || '普通';
          
          // 生成顏色主題
          const colorThemes = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500'];
          const colorTheme = colorThemes[Math.floor(Math.random() * colorThemes.length)];
          
          participants.push({
            user,
            weeklyStats,
            hasCompletedPersonalRetro,
            mainTopics,
            energyDescription,
            colorTheme
          });
        } catch (userError) {
          console.warn(`獲取用戶 ${user.id} 數據失敗:`, userError);
        }
      }
      
      // 應用篩選條件
      let filteredParticipants = participants;
      
      if (filters?.hasCompletedPersonalRetro !== undefined) {
        filteredParticipants = filteredParticipants.filter(p => 
          p.hasCompletedPersonalRetro === filters.hasCompletedPersonalRetro
        );
      }
      
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
      
      const newQuestion: GroupRetroQuestion = {
        ...question,
        id: `custom_${Date.now()}`,
        createdAt: new Date().toISOString()
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
      
      const currentSession = get().currentSession;
      if (currentSession) {
        const questions = currentSession.questions.map(q => 
          q.id === questionId ? { ...q, ...updates } : q
        );
        
        const updatedSession = {
          ...currentSession,
          questions,
          updatedAt: new Date().toISOString()
        };
        
        set({ currentSession: updatedSession });
      }
      
      set({ loading: false });
      return {} as GroupRetroQuestion; // 暫時返回空物件
      
    } catch (error: any) {
      console.error('更新問題失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteQuestion: async (questionId: string) => {
    try {
      set({ loading: true, error: null });
      
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
      
      const newReply: GroupRetroReply = {
        id: `reply_${Date.now()}`,
        questionId: data.questionId,
        userId: user.id,
        user: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '匿名用戶',
          roles: user.user_metadata?.roles || ['student']
        },
        content: data.content,
        mood: data.mood,
        emoji: data.emoji,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const currentSession = get().currentSession;
      if (currentSession && currentSession.id === sessionId) {
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
      
      const currentSession = get().currentSession;
      if (currentSession) {
        const replies = currentSession.replies.map(r => 
          r.id === replyId 
            ? { ...r, ...data, updatedAt: new Date().toISOString() } 
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
      return {} as GroupRetroReply; // 暫時返回空物件
      
    } catch (error: any) {
      console.error('更新回覆失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteReply: async (replyId: string) => {
    try {
      set({ loading: true, error: null });
      
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

  // 工具方法
  getWeekId: (date?: string) => {
    const targetDate = date ? new Date(date) : new Date();
    const year = targetDate.getFullYear();
    const week = Math.ceil(
      ((targetDate.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
    );
    return `${year}-W${week.toString().padStart(2, '0')}`;
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
      sessionProgress: null
    });
  }
})); 