/**
 * RetroStore - 個人回顧系統數據管理
 * 
 * 🎯 職責：
 * - 管理週統計數據獲取
 * - 問題庫管理和抽籤邏輯
 * - 回答記錄的 CRUD 操作
 * - 遊戲化功能和成就系統
 * 
 * 🏗️ 架構：
 * - 遵循統一的錯誤處理系統
 * - 與 topicStore 和 taskRecordStore 協作
 * - 支援離線優先的數據管理
 */

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { httpInterceptor } from '../services/httpInterceptor';
import { getTodayInTimezone, getWeekStart, getWeekEnd } from '../config/timezone';
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
  RetroResponse
} from '../types/retro';

interface RetroStoreState {
  // 數據狀態
  currentWeekStats: WeeklyStats | null;
  questionBank: RetroQuestion[];
  currentSession: RetroSession | null;
  recentAnswers: RetroAnswer[];
  achievements: RetroAchievement[];
  
  // UI 狀態
  loading: boolean;
  error: string | null;
  drawAnimation: DrawAnimationState;
  
  // 操作方法
  // 週統計
  getCurrentWeekStats: () => Promise<WeeklyStats>;
  getWeekStatsForDate: (date: string) => Promise<WeeklyStats>;
  
  // 問題庫管理
  loadQuestionBank: () => Promise<void>;
  drawQuestions: (excludeIds?: string[]) => QuestionDraw;
  
  // 回答管理
  getCurrentSession: () => Promise<RetroSession | null>;
  createAnswer: (data: CreateRetroAnswerData) => Promise<RetroAnswer>;
  updateAnswer: (id: string, data: UpdateRetroAnswerData) => Promise<RetroAnswer>;
  deleteAnswer: (id: string) => Promise<boolean>;
  
  // 歷史記錄
  getAnswerHistory: (filters?: RetroFilters) => Promise<RetroAnswer[]>;
  getRetroStats: () => Promise<RetroStats>;
  
  // 成就系統
  checkAchievements: () => Promise<void>;
  unlockAchievement: (id: string) => Promise<void>;
  
  // 工具方法
  getWeekId: (date?: string) => string;
  clearError: () => void;
  reset: () => void;
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

  // 獲取當前週統計
  getCurrentWeekStats: async () => {
    try {
      set({ loading: true, error: null });
      
      const today = getTodayInTimezone();
      const weekStart = getWeekStart(today);
      const weekEnd = getWeekEnd(today);
      
      console.log('🔍 獲取週統計:', { today, weekStart, weekEnd });
      
      // 獲取當前用戶
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用戶未認證');
      }
      
      // 並行獲取各種數據
      const [
        // 從 topicStore 獲取任務數據
        completedTasks,
        // 從 taskRecordStore 獲取記錄
        taskRecords,
        // 從 journalStore 獲取心情數據
        journals
      ] = await Promise.all([
        // 獲取本週完成的任務
        supabase.rpc('get_completed_tasks_for_week', {
          week_start: weekStart,
          week_end: weekEnd,
          user_id: user.id
        }),
        // 獲取本週任務記錄
        taskRecordStore.getUserTaskRecords({
          start_date: weekStart,
          end_date: weekEnd
        }),
        // 獲取本週日記
        supabase
          .from('daily_journals')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', weekStart)
          .lte('date', weekEnd)
      ]);
      
      // 處理任務數據
      const tasks = completedTasks.data || [];
      const records = taskRecords || [];
      const journalData = journals.data || [];
      
      // 計算打卡次數 (基於任務記錄)
      const checkInCount = records.length;
      
      // 計算完成任務數
      const completedTaskCount = tasks.length;
      
      // 計算平均能量 (基於日記的 motivation_level)
      const motivationLevels = journalData
        .map(j => j.motivation_level)
        .filter(level => level != null);
      const averageEnergy = motivationLevels.length > 0 
        ? Math.round(motivationLevels.reduce((a, b) => a + b, 0) / motivationLevels.length)
        : 3; // 預設值
      
      // 處理主要任務清單
      const mainTasks = tasks.slice(0, 5).map((task: any) => ({
        id: task.id,
        title: task.title,
        topic: task.topic_title || '未分類',
        completedAt: task.completed_at,
        difficulty: task.difficulty || 3
      }));
      
      // 獲取主要主題清單
      const topicStore = useTopicStore.getState();
      const topics = topicStore.topics || [];
      const mainTopics = topics
        .filter(topic => topic.status !== 'archived')
        .map(topic => ({
          id: topic.id,
          title: topic.title,
          subject: topic.subject || '未分類',
          progress: topic.progress || 0,
          taskCount: topic.goals?.reduce((sum, goal) => sum + (goal.tasks?.length || 0), 0) || 0,
          completedTaskCount: topic.goals?.reduce((sum, goal) => 
            sum + (goal.tasks?.filter(task => task.status === 'done').length || 0), 0) || 0
        }))
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 3);
      
      const weeklyStats: WeeklyStats = {
        checkInCount,
        completedTaskCount,
        averageEnergy,
        mainTasks,
        mainTopics,
        weekRange: {
          start: weekStart,
          end: weekEnd
        }
      };
      
      set({ currentWeekStats: weeklyStats, loading: false });
      return weeklyStats;
      
    } catch (error: any) {
      console.error('獲取週統計失敗:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // 獲取指定日期的週統計
  getWeekStatsForDate: async (date: string) => {
    try {
      const weekStart = getWeekStart(date);
      const weekEnd = getWeekEnd(date);
      
      // 類似 getCurrentWeekStats 的邏輯，但用指定的日期範圍
      // 這裡簡化實現，實際可以提取共同邏輯
      return get().getCurrentWeekStats();
    } catch (error: any) {
      console.error('獲取指定日期週統計失敗:', error);
      throw error;
    }
  },

  // 載入問題庫
  loadQuestionBank: async () => {
    try {
      set({ loading: true, error: null });
      
      // 可以從後端載入自訂問題庫
      // 目前使用內建問題庫
      const { data: customQuestions } = await supabase
        .from('retro_questions')
        .select('*')
        .eq('is_active', true);
      
      const allQuestions = [
        ...DEFAULT_QUESTIONS,
        ...(customQuestions || [])
      ];
      
      set({ questionBank: allQuestions, loading: false });
    } catch (error: any) {
      console.error('載入問題庫失敗:', error);
      set({ error: error.message, loading: false });
    }
  },

  // 遊戲化抽籤
  drawQuestions: (excludeIds = []) => {
    const { questionBank } = get();
    
    // 過濾掉排除的問題
    const availableQuestions = questionBank.filter(q => !excludeIds.includes(q.id));
    
    if (availableQuestions.length < 3) {
      throw new Error('可用問題不足');
    }
    
    // 隨機選擇 3 個問題
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, 3);
    
    return {
      questions: selectedQuestions,
      drawTime: new Date().toISOString(),
      rerollsLeft: 1 // 可重抽一次
    };
  },

  // 獲取當前會話
  getCurrentSession: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      const weekId = get().getWeekId();
      
      const { data: session } = await supabase
        .from('retro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_id', weekId)
        .single();
      
      if (session) {
        set({ currentSession: session });
        return session;
      }
      
      return null;
    } catch (error: any) {
      console.error('獲取當前會話失敗:', error);
      return null;
    }
  },

  // 創建回答
  createAnswer: async (data: CreateRetroAnswerData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');
      
      const answerData = {
        user_id: user.id,
        date: getTodayInTimezone(),
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
        .insert(answerData)
        .select()
        .single();
      
      if (error) throw error;
      
      // 更新本地狀態
      set(state => ({
        recentAnswers: [answer, ...state.recentAnswers]
      }));
      
      // 檢查成就
      get().checkAchievements();
      
      return answer;
    } catch (error: any) {
      console.error('創建回答失敗:', error);
      throw error;
    }
  },

  // 更新回答
  updateAnswer: async (id: string, data: UpdateRetroAnswerData) => {
    try {
      const { data: answer, error } = await supabase
        .from('retro_answers')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // 更新本地狀態
      set(state => ({
        recentAnswers: state.recentAnswers.map(a => 
          a.id === id ? answer : a
        )
      }));
      
      return answer;
    } catch (error: any) {
      console.error('更新回答失敗:', error);
      throw error;
    }
  },

  // 刪除回答
  deleteAnswer: async (id: string) => {
    try {
      const { error } = await supabase
        .from('retro_answers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 更新本地狀態
      set(state => ({
        recentAnswers: state.recentAnswers.filter(a => a.id !== id)
      }));
      
      return true;
    } catch (error: any) {
      console.error('刪除回答失敗:', error);
      throw error;
    }
  },

  // 獲取回答歷史
  getAnswerHistory: async (filters = {}) => {
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

  // 獲取週ID
  getWeekId: (date?: string) => {
    const targetDate = date ? new Date(date) : new Date();
    const year = targetDate.getFullYear();
    const weekNum = Math.ceil((targetDate.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${weekNum.toString().padStart(2, '0')}`;
  },

  // 清除錯誤
  clearError: () => {
    set({ error: null });
  },

  // 重置狀態
  reset: () => {
    set({
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
    });
  }
}));

// 創建 store 實例供外部使用
export const retroStore = useRetroStore.getState(); 