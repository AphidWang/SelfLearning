/**
 * RetroStore - 個人回顧系統數據管理
 * 
 * 🎯 職責：
 * - 管理週統計數據整理和組合
 * - 問題庫管理和抽籤邏輯
 * - 回答記錄的 CRUD 操作
 * - 遊戲化功能和成就系統
 * 
 * 🏗️ 架構：
 * - 遵循統一的錯誤處理系統
 * - 通過其他 store 獲取數據，不直接查詢資料庫
 * - 負責數據整理和組合以滿足 UI 需求
 */

// 🔧 Debug 開關
const DEBUG_RETRO_STORE = true;

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { httpInterceptor } from '../services/httpInterceptor';
import { getTodayInTimezone } from '../config/timezone';
import { generateWeekId, parseWeekId } from '../utils/weekUtils';
import { useTopicStore } from './topicStore';
import { taskRecordStore } from './taskRecordStore';
import { journalStore } from './journalStore';
import type {
  WeeklyStats,
  RetroQuestion,
  RetroAnswer,
  RetroSession,
  QuestionDraw,
  RetroFilters,
  RetroStats,
  CreateRetroAnswerData,
  UpdateRetroAnswerData,
  DrawAnimationState,
  RetroAchievement,
  RetroResponse,
  DailyCheckIn
} from '../types/retro';

interface RetroStoreState {
  currentWeekStats: WeeklyStats | null;
  questionBank: RetroQuestion[];
  currentSession: RetroSession | null;
  recentAnswers: RetroAnswer[];
  achievements: RetroAchievement[];
  loading: boolean;
  error: string | null;
  drawAnimation: DrawAnimationState;
  
  // 新增：當前選中的週期
  selectedWeekId: string | null;
  selectedWeekIds: string[];

  // 核心功能
  getCurrentWeekStats: () => Promise<WeeklyStats | null>;
  drawQuestion: (filters?: RetroFilters) => Promise<QuestionDraw | null>;
  saveAnswer: (data: CreateRetroAnswerData) => Promise<RetroAnswer | null>;
  updateAnswer: (id: string, data: UpdateRetroAnswerData) => Promise<RetroAnswer | null>;
  deleteAnswer: (id: string) => Promise<boolean>;
  
  // 會話管理
  createSession: (weekStart: string, weekEnd: string) => Promise<RetroSession | null>;
  updateSession: (id: string, data: Partial<RetroSession>) => Promise<RetroSession | null>;
  getSessionHistory: (limit?: number) => Promise<RetroSession[]>;
  
  // 統計和分析
  getPersonalStats: (filters?: RetroFilters) => Promise<RetroStats | null>;
  getAchievements: () => Promise<RetroAchievement[]>;
  
  // 狀態管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCurrentSession: () => void;
  reset: () => void;
  
  // 其他方法
  getAnswerHistory: (filters?: RetroFilters) => Promise<RetroAnswer[]>;
  drawQuestions: (filters?: RetroFilters & { count?: number }) => Promise<QuestionDraw | null>;
  createAnswer: (data: CreateRetroAnswerData) => Promise<RetroAnswer | null>;
  getWeekId: (date?: string | Date) => string;
  clearError: () => void;
  
  // 新的 Session-based 方法
  getCurrentSession: () => Promise<RetroSession | null>;
  saveSessionAnswer: (sessionId: string, data: CreateRetroAnswerData) => Promise<RetroAnswer | null>;
  updateSessionQuestions: (sessionId: string, questions: RetroQuestion[]) => Promise<boolean>;
  completeSession: (sessionId: string) => Promise<boolean>;
  
  // 週期管理方法
  setSelectedWeek: (weekId: string, weekIds?: string[]) => void;
  getSessionForWeek: (weekId: string) => Promise<RetroSession | null>;
  getWeekStatsForWeek: (weekId: string) => Promise<WeeklyStats | null>;
  loadWeekData: (weekId: string) => Promise<void>;
}

// 內建問題庫
const DEFAULT_QUESTIONS: RetroQuestion[] = [
  // 反思類問題
  {
    id: 'reflection_1',
    question: '這週學習時，什麼時候讓你覺得最有成就感？',
    type: 'reflection',
    ageGroup: 'all',
    difficulty: 2,
    tags: ['成就感', '學習'],
    hint: '想想完成某個任務或理解某個概念的瞬間',
    example: '當我終於理解了數學題的解法，感覺很棒！'
  },
  {
    id: 'reflection_2',
    question: '遇到困難時，你用了什麼方法來解決？',
    type: 'reflection',
    ageGroup: 'all',
    difficulty: 3,
    tags: ['解決問題', '困難'],
    hint: '可以是求助、查資料、換個角度思考等',
    example: '我先試著自己想，然後問了同學，最後上網查了資料'
  },
  {
    id: 'reflection_3',
    question: '這週的學習節奏如何？太快、太慢、還是剛好？',
    type: 'reflection',
    ageGroup: 'all',
    difficulty: 2,
    tags: ['學習節奏', '自我認知'],
    hint: '想想自己的學習速度和理解程度',
    example: '有點太快了，有些地方還沒完全理解就進入下一個主題'
  },
  
  // 成長類問題
  {
    id: 'growth_1',
    question: '這週你學到了什麼新技能或知識？',
    type: 'growth',
    ageGroup: 'all',
    difficulty: 1,
    tags: ['新技能', '知識'],
    hint: '不管多小的進步都算！',
    example: '學會了用新的方法記憶英文單字'
  },
  {
    id: 'growth_2',
    question: '比起上週，你在哪方面有進步？',
    type: 'growth',
    ageGroup: 'all',
    difficulty: 2,
    tags: ['進步', '比較'],
    hint: '可以是學習方法、專注力、理解速度等',
    example: '專注力比上週好很多，可以連續讀書更長時間'
  },
  {
    id: 'growth_3',
    question: '如果要教別人你這週學到的東西，你會怎麼教？',
    type: 'growth',
    ageGroup: 'all',
    difficulty: 4,
    tags: ['教學', '理解'],
    hint: '用自己的話說出來，看看是否真的理解了',
    example: '我會用畫圖的方式解釋這個科學概念'
  },
  
  // 挑戰類問題
  {
    id: 'challenge_1',
    question: '這週最大的挑戰是什麼？你是如何面對的？',
    type: 'challenge',
    ageGroup: 'all',
    difficulty: 3,
    tags: ['挑戰', '面對困難'],
    hint: '想想讓你感到困難或緊張的情況',
    example: '數學考試讓我很緊張，但我提前多做了練習題'
  },
  {
    id: 'challenge_2',
    question: '有沒有想要放棄的時候？後來怎麼繼續的？',
    type: 'challenge',
    ageGroup: 'all',
    difficulty: 4,
    tags: ['堅持', '放棄'],
    hint: '想想是什麼讓你重新振作起來',
    example: '背英文單字很無聊，但想到能看懂更多英文書就繼續了'
  },
  
  // 感恩類問題
  {
    id: 'gratitude_1',
    question: '這週有誰幫助了你的學習？想對他們說什麼？',
    type: 'gratitude',
    ageGroup: 'all',
    difficulty: 1,
    tags: ['感謝', '幫助'],
    hint: '可以是老師、同學、家人或朋友',
    example: '謝謝媽媽耐心地陪我複習，還準備了好吃的點心'
  },
  {
    id: 'gratitude_2',
    question: '這週學習過程中，什麼讓你感到開心或有趣？',
    type: 'gratitude',
    ageGroup: 'all',
    difficulty: 2,
    tags: ['開心', '有趣'],
    hint: '可以是有趣的課程、好玩的實驗或愉快的討論',
    example: '科學實驗太有趣了，看到化學反應的瞬間很興奮'
  },
  
  // 計劃類問題
  {
    id: 'planning_1',
    question: '下週你想重點加強哪個方面？',
    type: 'planning',
    ageGroup: 'all',
    difficulty: 2,
    tags: ['計劃', '改進'],
    hint: '想想哪些地方還需要更多練習',
    example: '想要加強英文口語，多練習對話'
  },
  {
    id: 'planning_2',
    question: '這週的經驗，對下週的學習有什麼啟發？',
    type: 'planning',
    ageGroup: 'all',
    difficulty: 3,
    tags: ['啟發', '改進'],
    hint: '想想可以改進的學習方法或策略',
    example: '發現做筆記很有用，下週要養成邊聽邊記的習慣'
  },
  {
    id: 'planning_3',
    question: '下週你想嘗試什麼新的學習方法？',
    type: 'planning',
    ageGroup: 'all',
    difficulty: 2,
    tags: ['新方法', '嘗試'],
    hint: '可以是新的記憶技巧、學習工具或時間安排',
    example: '想試試番茄工作法，看看能不能提高專注力'
  }
];

export const useRetroStore = create<RetroStoreState>((set, get) => ({
  // 初始狀態
  currentWeekStats: null,
  questionBank: DEFAULT_QUESTIONS,
  currentSession: null,
  recentAnswers: [],
  achievements: [],
  loading: false,
  error: null,
  drawAnimation: {
    isAnimating: false,
    currentStep: 'idle',
    progress: 0
  },
  
  // 週期狀態
  selectedWeekId: null,
  selectedWeekIds: [],

  // 獲取當前週統計 - 統一調用 getWeekStatsForWeek 確保邏輯一致
  getCurrentWeekStats: async () => {
    try {
      // 獲取當前週期 ID
      const today = getTodayInTimezone();
      const weekId = generateWeekId(today);
      
      DEBUG_RETRO_STORE && console.log('🔍 獲取當前週統計，weekId:', weekId);
      
      // 直接調用 getWeekStatsForWeek 確保邏輯一致
      const weekStats = await get().getWeekStatsForWeek(weekId);
      
      // 更新 store 狀態，但不覆蓋用戶選擇的週期
      set({ 
        currentWeekStats: weekStats
        // 移除 selectedWeekId: weekId，避免覆蓋用戶選擇
      });
      
      return weekStats;
    } catch (error: any) {
      console.error('獲取當前週統計失敗:', error);
      set({ loading: false, error: error.message || '獲取當前週統計失敗' });
      return null;
    }
  },

  // 問題抽取
  drawQuestion: async (filters?: RetroFilters) => {
    try {
      const questionBank = get().questionBank;
      const availableQuestions = questionBank.filter(q => !filters?.excludeIds?.includes(q.id));
      
      if (availableQuestions.length === 0) {
        return null;
      }
      
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const selectedQuestion = availableQuestions[randomIndex];
      
      return {
        question: selectedQuestion,
        totalQuestions: questionBank.length,
        remainingQuestions: availableQuestions.length - 1
      };
    } catch (error) {
      console.error('抽取問題失敗:', error);
      return null;
    }
  },

  // 保存回答
  saveAnswer: async (data: CreateRetroAnswerData) => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      // 轉換欄位名稱以匹配資料庫表結構
      const dbData = {
        user_id: user.id,
        date: getTodayInTimezone(), // 添加日期欄位
        week_id: data.weekId,
        question: data.question,
        is_custom_question: data.isCustomQuestion,
        custom_question: data.customQuestion,
        answer: data.answer,
        mood: data.mood,
        emoji: data.emoji
      };
      
      const { data: answer, error } = await supabase
        .from('retro_answers')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      
      set({ loading: false });
      return answer;
    } catch (error: any) {
      console.error('保存回答失敗:', error);
      set({ loading: false, error: error.message });
      return null;
    }
  },

  // 更新回答
  updateAnswer: async (id: string, data: UpdateRetroAnswerData) => {
    try {
      set({ loading: true, error: null });
      
      const { data: answer, error } = await supabase
        .from('retro_answers')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set({ loading: false });
      return answer;
    } catch (error: any) {
      console.error('更新回答失敗:', error);
      set({ loading: false, error: error.message });
      return null;
    }
  },

  // 刪除回答
  deleteAnswer: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('retro_answers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error('刪除回答失敗:', error);
      set({ loading: false, error: error.message });
      return false;
    }
  },

  // 創建會話
  createSession: async (weekStart: string, weekEnd: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      const { data: session, error } = await supabase
        .from('retro_sessions')
        .insert([{
          user_id: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          status: 'active'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      set({ currentSession: session, loading: false });
      return session;
    } catch (error: any) {
      console.error('創建會話失敗:', error);
      set({ loading: false, error: error.message });
      return null;
    }
  },

  // 更新會話
  updateSession: async (id: string, data: Partial<RetroSession>) => {
    try {
      set({ loading: true, error: null });
      
      const { data: session, error } = await supabase
        .from('retro_sessions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set({ currentSession: session, loading: false });
      return session;
    } catch (error: any) {
      console.error('更新會話失敗:', error);
      set({ loading: false, error: error.message });
      return null;
    }
  },

  // 獲取會話歷史
  getSessionHistory: async (limit = 10) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      const { data: sessions, error } = await supabase
        .from('retro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return sessions || [];
    } catch (error: any) {
      console.error('獲取會話歷史失敗:', error);
      return [];
    }
  },

  // 獲取個人統計
  getPersonalStats: async (filters?: RetroFilters) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      let query = supabase
        .from('retro_answers')
        .select('*')
        .eq('user_id', user.id);
      
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters?.mood) {
        query = query.eq('mood', filters.mood);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // TODO: 處理統計數據
      return null;
    } catch (error: any) {
      console.error('獲取個人統計失敗:', error);
      return null;
    }
  },

  // 獲取成就
  getAchievements: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      // TODO: 實現成就查詢
      return [];
    } catch (error: any) {
      console.error('獲取成就失敗:', error);
      return [];
    }
  },

  // 獲取回答歷史
  getAnswerHistory: async (filters: RetroFilters = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      let query = supabase
        .from('retro_answers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // 應用篩選
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters.mood) {
        query = query.eq('mood', filters.mood);
      }
      
      const { data: answers, error } = await query;
      
      if (error) throw error;
      
      set({ recentAnswers: answers || [] });
      return answers || [];
    } catch (error: any) {
      console.error('獲取回答歷史失敗:', error);
      throw error;
    }
  },

  // 獲取統計數據
  getRetroStats: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      const { data: answers } = await supabase
        .from('retro_answers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      const allAnswers = answers || [];
      
      // 計算統計
      const stats: RetroStats = {
        totalAnswers: allAnswers.length,
        streakWeeks: 0, // TODO: 計算連續週數
        favoriteQuestionType: 'reflection',
        moodDistribution: {
          excited: 0,
          happy: 0,
          okay: 0,
          tired: 0,
          stressed: 0
        },
        recentAnswers: allAnswers.slice(0, 5)
      };
      
      // 計算心情分佈
      allAnswers.forEach(answer => {
        if (answer.mood) {
          stats.moodDistribution[answer.mood]++;
        }
      });
      
      return stats;
    } catch (error: any) {
      console.error('獲取統計數據失敗:', error);
      throw error;
    }
  },

  // 檢查成就
  checkAchievements: async () => {
    try {
      // TODO: 實現成就檢查邏輯
      console.log('檢查成就...');
    } catch (error: any) {
      console.error('檢查成就失敗:', error);
    }
  },

  // 解鎖成就
  unlockAchievement: async (id: string) => {
    try {
      // TODO: 實現成就解鎖邏輯
      console.log('解鎖成就:', id);
    } catch (error: any) {
      console.error('解鎖成就失敗:', error);
    }
  },

  // 獲取週ID (委託到統一的工具函數)
  getWeekId: (date?: string | Date) => {
    return generateWeekId(date);
  },

  // 清除錯誤
  clearError: () => {
    set({ error: null });
  },

  // 狀態管理
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearCurrentSession: () => set({ currentSession: null }),
  reset: () => set({
    currentWeekStats: null,
    currentSession: null,
    recentAnswers: [],
    achievements: [],
    loading: false,
    error: null,
    drawAnimation: {
      isAnimating: false,
      currentStep: 'idle',
      progress: 0
    }
  }),

  // 其他方法實現
  drawQuestions: async (filters?: RetroFilters & { count?: number }) => {
    try {
      const questionBank = get().questionBank;
      const count = filters?.count || 3; // 預設抽取3個問題
      const availableQuestions = questionBank.filter(q => !filters?.excludeIds?.includes(q.id));
      
      if (availableQuestions.length === 0) {
        return null;
      }
      
      // 隨機洗牌並選取指定數量的問題
      const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));
      
      return {
        questions: selectedQuestions,
        totalQuestions: questionBank.length,
        remainingQuestions: availableQuestions.length - selectedQuestions.length
      };
    } catch (error) {
      console.error('抽取問題失敗:', error);
      return null;
    }
  },
  
  createAnswer: async (data: CreateRetroAnswerData) => {
    return await get().saveAnswer(data);
  },

  // 獲取指定日期的週統計
  getWeekStatsForDate: async (date: string) => {
    try {
      const weekId = generateWeekId(date);
      return await get().getWeekStatsForWeek(weekId);
    } catch (error: any) {
      console.error('獲取指定日期週統計失敗:', error);
      return null;
    }
  },

  // === 新的 Session-based 方法 ===
  
  // 獲取或創建當前週的回顧 session
  getCurrentSession: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      const weekId = get().getWeekId();
      
      // 調用 RPC 函數獲取或創建 session
      const { data, error } = await supabase.rpc('get_or_create_retro_session', {
        p_user_id: user.id,
        p_week_id: weekId
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const sessionData = data[0];
        
        // 將週統計數據轉換為前端期望的格式
        let weeklyStats: WeeklyStats | null = null;
        if (sessionData.week_stats && Array.isArray(sessionData.week_stats)) {
          // 使用現有的 getCurrentWeekStats 邏輯來處理數據
          const currentStats = get().currentWeekStats;
          if (currentStats) {
            weeklyStats = {
              ...currentStats,
              // 保持現有的週統計數據，只添加 session 特有的信息
              sessionAnswers: sessionData.session_answers || []
            } as WeeklyStats;
          }
        }
        
        // 轉換為前端格式
        const session: RetroSession = {
          id: sessionData.id,
          weekId: sessionData.week_id,
          userId: sessionData.user_id,
          weeklyStats: weeklyStats || {} as WeeklyStats,
          drawnQuestions: sessionData.questions_drawn || [],
          status: sessionData.answers_completed >= 2 ? 'completed' : 'draft',
          createdAt: sessionData.created_at,
          updatedAt: sessionData.updated_at
        };
        
        // 添加 sessionAnswers 到 session 中（作為額外屬性）
        (session as any).sessionAnswers = sessionData.session_answers || [];
        
        set({ currentSession: session, loading: false });
        return session;
      }
      
      set({ loading: false });
      return null;
    } catch (error: any) {
      console.error('獲取當前 session 失敗:', error);
      set({ loading: false, error: error.message });
      return null;
    }
  },
  
  // 保存 session 答案
  saveSessionAnswer: async (sessionId: string, data: CreateRetroAnswerData) => {
    try {
      set({ loading: true, error: null });
      
      // 調用 RPC 函數保存答案
      const { data: result, error } = await supabase.rpc('save_retro_answer', {
        p_session_id: sessionId,
        p_question: data.question,
        p_answer: data.answer,
        p_mood: data.mood,
        p_is_custom_question: data.isCustomQuestion,
        p_custom_question: data.customQuestion,
        p_emoji: data.emoji
      });
      
      if (error) throw error;
      
      if (result && result.length > 0) {
        const answerData = result[0];
        
        const answer: RetroAnswer = {
          id: answerData.id,
          date: getTodayInTimezone(),
          weekId: data.weekId,
          userId: answerData.session_id, // 這裡需要調整
          question: data.question,
          isCustomQuestion: data.isCustomQuestion,
          customQuestion: data.customQuestion,
          answer: answerData.answer,
          mood: answerData.mood,
          emoji: answerData.emoji,
          createdAt: answerData.created_at,
          updatedAt: answerData.created_at
        };
        
        set({ loading: false });
        return answer;
      }
      
      set({ loading: false });
      return null;
    } catch (error: any) {
      console.error('保存 session 答案失敗:', error);
      set({ loading: false, error: error.message });
      return null;
    }
  },
  
  // 更新 session 的抽取問題
  updateSessionQuestions: async (sessionId: string, questions: RetroQuestion[]) => {
    try {
      const { data, error } = await supabase.rpc('update_session_questions', {
        p_session_id: sessionId,
        p_questions: questions
      });
      
      if (error) throw error;
      
      return data || false;
    } catch (error: any) {
      console.error('更新 session 問題失敗:', error);
      return false;
    }
  },
  
  // 完成 session
  completeSession: async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('retro_sessions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      return true;
    } catch (error: any) {
      console.error('完成 session 失敗:', error);
      return false;
    }
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
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      // 調用 RPC 函數獲取或創建指定週期的 session
      const { data, error } = await supabase.rpc('get_or_create_retro_session', {
        p_user_id: user.id,
        p_week_id: weekId
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const sessionData = data[0];
        
        // 轉換為前端格式
        const session: RetroSession = {
          id: sessionData.id,
          weekId: sessionData.week_id,
          userId: sessionData.user_id,
          weeklyStats: {} as WeeklyStats, // 將在 loadWeekData 中載入
          drawnQuestions: sessionData.questions_drawn || [],
          status: sessionData.answers_completed >= 2 ? 'completed' : 'draft',
          createdAt: sessionData.created_at,
          updatedAt: sessionData.updated_at
        };
        
        // 添加 sessionAnswers 到 session 中（作為額外屬性）
        (session as any).sessionAnswers = sessionData.session_answers || [];
        
        set({ currentSession: session, loading: false });
        return session;
      }
      
      set({ loading: false });
      return null;
    } catch (error: any) {
      console.error('獲取週期 session 失敗:', error);
      set({ loading: false, error: error.message });
      return null;
    }
  },

  // 獲取指定週期的統計資料 - 🆕 使用 topicStore 的統一 RPC 方法
  getWeekStatsForWeek: async (weekId: string) => {
    try {
      // 使用統一的週期解析邏輯
      const { parseWeekId } = await import('../utils/weekUtils');
      const weekInfo = parseWeekId(weekId);
      
      if (!weekInfo) {
        throw new Error(`無效的週期 ID: ${weekId}`);
      }
      
      const weekStartStr = weekInfo.startDate;
      const weekEndStr = weekInfo.endDate;
      
      DEBUG_RETRO_STORE && console.log('🔍 retroStore.getWeekStatsForWeek - 使用統一 RPC:', { weekId, weekStartStr, weekEndStr });
      
      set({ loading: true, error: null });
      
      // 🆕 調用 topicStore 的統一 RPC 方法
      const topicStore = useTopicStore.getState();
      const retroSummary = await topicStore.getRetroWeekSummary(weekStartStr, weekEndStr);
      
      DEBUG_RETRO_STORE && console.log('📊 RPC 返回數據:', {
        dailyDays: retroSummary.daily_data.length,
        weekTotals: retroSummary.week_data,
        completedTasks: retroSummary.completed_data.length,
        activeTopics: retroSummary.topics_data.length
      });

      // 🔄 轉換為前端期望的格式
      const dailyCheckIns = retroSummary.daily_data.map(day => ({
        date: day.date,
        dayOfWeek: day.dayOfWeek,
        checkInCount: day.check_ins,
        taskRecordCount: day.records,
        totalActivities: day.total_activities,
        completedTasks: day.active_tasks
          ? day.active_tasks.filter((t: any) => t.task_status === 'done').map((t: any) => ({
              id: t.id,
              title: t.title,
              subject: t.subject
            }))
          : [],
        topics: day.active_tasks || [],
        mood: null,
        energy: null
      }));
      
      // 🧮 從 RPC 數據計算週總統計
      const totalCheckIns = retroSummary.week_data.total_check_ins;
      const totalTaskRecords = retroSummary.week_data.total_records;
      const totalActivities = retroSummary.week_data.total_activities;
      const totalCompletions = retroSummary.week_data.total_completed;
      
      // 🎯 轉換主要任務清單
      const mainTasks = retroSummary.completed_data.map(task => ({
        id: task.id,
        title: task.title,
        topic: task.topic,
        completedAt: task.completed_at,
        difficulty: task.difficulty
      }));
      
      // 🎯 轉換主要主題清單
      const mainTopics = retroSummary.topics_data.map(topic => ({
        id: topic.id,
        title: topic.title,
        subject: topic.subject,
        progress: topic.progress,
        taskCount: topic.total_tasks,
        completedTaskCount: topic.completed_tasks,
        hasActivity: topic.has_activity,
        weeklyProgress: {
          total_tasks: topic.total_tasks,
          completed_tasks: topic.completed_tasks,
          completion_rate: topic.progress,
          status_changes: topic.week_activities,
          check_ins: 0,
          records: 0
        }
      })).slice(0, 5);

      // 📊 建構完整的週統計對象
      const weeklyStats: WeeklyStats = {
        weekId,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        completedTaskCount: totalCompletions,
        averageEnergy: null,
        totalCheckIns,
        totalTaskRecords,
        totalActivities,
        inProgressTasks: [],
        mainTasks,
        activeTasks: [],
        dailyCheckIns,
        learningPatterns: [],
        weekSummary: {
          totalLearningHours: totalActivities,
          completedGoals: 0,
          averageEfficiency: 0.75,
          learningPattern: 'morning',
          topPerformanceDay: dailyCheckIns.reduce((prev, current) => 
            (current.totalActivities > prev.totalActivities) ? current : prev, dailyCheckIns[0]
          )?.dayOfWeek || '無',
          improvementAreas: []
        }
      };

      // 設置 store 狀態
      set({ 
        currentWeekStats: weeklyStats,
        loading: false
      });

      DEBUG_RETRO_STORE && console.log('✅ retroStore.getWeekStatsForWeek 完成 (使用統一 RPC):', {
        weekId,
        completedTasks: weeklyStats.completedTaskCount,
        totalCheckIns: weeklyStats.totalCheckIns,
        totalTaskRecords: weeklyStats.totalTaskRecords,
        totalActivities: weeklyStats.totalActivities,
        dailyDays: weeklyStats.dailyCheckIns.length
      });

      return weeklyStats;
    } catch (error: any) {
      console.error('❌ retroStore.getWeekStatsForWeek 失敗:', error);
      set({ loading: false, error: error.message });
      return null;
    }
  },

  // 載入指定週期的完整數據
  loadWeekData: async (weekId: string) => {
    try {
      set({ loading: true, error: null });
      
      DEBUG_RETRO_STORE && console.log('🔄 載入週期數據:', weekId);
      
      // 並行載入 session 和統計數據
      const [session, stats] = await Promise.all([
        get().getSessionForWeek(weekId),
        get().getWeekStatsForWeek(weekId)
      ]);
      
      // 如果有 session，更新其中的週統計數據
      if (session && stats) {
        const updatedSession = {
          ...session,
          weeklyStats: stats
        };
        set({ currentSession: updatedSession });
      }
      
      // 更新選中的週期
      set({ 
        selectedWeekId: weekId,
        selectedWeekIds: [weekId]
      });
      
      set({ loading: false });
      
      DEBUG_RETRO_STORE && console.log('✅ 週期數據載入完成:', { weekId, hasSession: !!session, hasStats: !!stats });
    } catch (error: any) {
      console.error('載入週期數據失敗:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  }
}));

// 創建 store 實例供外部使用
export const retroStore = useRetroStore.getState(); 