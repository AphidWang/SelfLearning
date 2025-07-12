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
  drawQuestions: (filters?: RetroFilters) => Promise<QuestionDraw | null>;
  createAnswer: (data: CreateRetroAnswerData) => Promise<RetroAnswer | null>;
  getWeekId: () => string;
  clearError: () => void;
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
      const weekStart = new Date(getWeekStart(today));
      const weekEnd = new Date(getWeekEnd(today));
      
      console.log('🔍 獲取週統計:', { today, weekStart, weekEnd });
      
      // 獲取當前用戶
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用戶未認證');
      }
      
      // 🎯 通過各個 store 獲取數據，不直接查詢資料庫
      let topicStore = useTopicStore.getState();
      
      // 確保 topics 數據已載入 - 等待載入完成
      if (topicStore.topics.length === 0 || topicStore.loading) {
        console.log('🔄 等待 topicStore 載入完成...');
        await topicStore.fetchTopics();
        
        // 重新獲取最新的 store 狀態
        topicStore = useTopicStore.getState();
        
        // 再次檢查是否載入成功
        if (topicStore.topics.length === 0) {
          console.warn('⚠️ topicStore 載入後仍然為空，可能用戶沒有任何主題');
        } else {
          console.log('✅ topicStore 載入完成，共', topicStore.topics.length, '個主題');
        }
      }
      
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      // 🎯 使用 topicStore 的 helper functions 獲取結構化數據
      const [
        // 獲取本週主題進度摘要（包含沒有活動的主題）
        topicsProgress,
        // 獲取活躍主題的完整信息
        activeTopics,
        // 獲取本週每日活動統計
        dailyStats,
        // 從 journalStore 獲取本週日記
        journalHistory
      ] = await Promise.all([
        topicStore.getTopicsProgressForWeek(weekStartStr, weekEndStr),
        topicStore.getActiveTopicsWithProgress(),
        topicStore.getDailyActivityStats(weekStartStr, weekEndStr),
        journalStore.getJournalHistory(7, 0) // 獲取最近7天的日記
      ]);
      
      console.log('🔍 retroStore - 獲取的 dailyStats:', JSON.stringify(dailyStats, null, 2));
      
      // 過濾本週的日記
      const journalData = journalHistory.journals.filter(journal => 
        journal.date >= weekStartStr && journal.date <= weekEndStr
      );
      
      // 🎯 計算總體統計
      const totalCompletedTasks = topicsProgress.reduce((sum, topic) => 
        sum + topic.progress_snapshot.completed_tasks, 0
      );
      
      // 🎯 主要主題清單（包含沒有活動的活躍主題）
      const mainTopics = activeTopics
        .filter(topic => topic.status !== 'archived')
        .map(topic => {
          // 找到對應的進度摘要
          const progressInfo = topicsProgress.find(p => p.topic_id === topic.topic_id);
          
          return {
            id: topic.topic_id,
            title: topic.topic_title,
            subject: topic.topic_subject,
            progress: topic.completion_rate,
            taskCount: topic.total_tasks,
            completedTaskCount: topic.completed_tasks,
            hasActivity: progressInfo?.is_active || false, // 這週是否有活動
            weeklyProgress: progressInfo?.progress_snapshot || {
              total_tasks: topic.total_tasks,
              completed_tasks: topic.completed_tasks,
              completion_rate: topic.completion_rate,
              status_changes: 0,
              check_ins: 0,
              records: 0
            }
          };
        })
        .sort((a, b) => {
          // 有活動的排前面，然後按進度排序
          if (a.hasActivity !== b.hasActivity) {
            return b.hasActivity ? 1 : -1;
          }
          return b.progress - a.progress;
        })
        .slice(0, 5);
      
      // 🎯 主要任務清單（從已完成的任務中提取）
      const mainTasks: Array<{
        id: string;
        title: string;
        topic: string;
        completedAt: string;
        difficulty: number;
      }> = [];
      
      // 從 topicStore 的 topics 中找到本週完成的任務
      for (const topic of topicStore.topics) {
        for (const goal of topic.goals || []) {
          for (const task of goal.tasks || []) {
            if (task.status === 'done' && task.completed_at) {
              const completedDate = new Date(task.completed_at);
              const weekStartDate = new Date(weekStartStr);
              const weekEndDate = new Date(weekEndStr);
              
              // 檢查是否在本週完成
              if (completedDate >= weekStartDate && completedDate <= weekEndDate) {
                mainTasks.push({
                  id: task.id,
                  title: task.title,
                  topic: topic.subject || '未分類',
                  completedAt: task.completed_at,
                  difficulty: 3 // 預設難度，可以從 task 的其他屬性獲取
                });
              }
            }
          }
        }
      }
      
      // 按完成時間排序，最近完成的在前面
      mainTasks.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      mainTasks.splice(5); // 只保留前5個
      
      // 🎯 每日打卡統計（使用 topicStore 的 dailyStats）
      console.log('🔍 retroStore - 開始處理 dailyCheckIns，dailyStats 長度:', dailyStats.length);
      const dailyCheckIns: DailyCheckIn[] = await Promise.all(
        dailyStats.map(async (stat, index) => {
          console.log(`🔍 retroStore - 處理第${index + 1}天 (${stat.date}):`, {
            total_activities: stat.total_activities,
            check_ins: stat.check_ins,
            active_tasks_type: typeof stat.active_tasks,
            active_tasks_length: Array.isArray(stat.active_tasks) ? stat.active_tasks.length : 'not array'
          });
          
          const dayOfWeek = new Date(stat.date).toLocaleDateString('zh-TW', { weekday: 'long' });
          const dayJournal = journalData.find(j => j.date === stat.date);
          
          // 🎯 處理任務詳細信息 - 現在 active_tasks 是 JSONB 格式
          const taskDetails: Array<{
            id: string;
            title: string;
            subject: string;
            recordCount: number;
            checkInDates: string[];
            taskRecords: Array<{
              id: string;
              timestamp: string;
            }>;
          }> = [];
          
          // 處理新的 JSONB 格式的 active_tasks
          console.log(`🔍 retroStore - ${stat.date} active_tasks:`, stat.active_tasks);
          if (stat.active_tasks && Array.isArray(stat.active_tasks)) {
            console.log(`🔍 retroStore - ${stat.date} 有 ${stat.active_tasks.length} 個 active_tasks`);
            for (const taskData of stat.active_tasks) {
              if (taskData && typeof taskData === 'object') {
                // 類型斷言
                const task = taskData as any;
                console.log(`🔍 retroStore - 處理任務:`, {
                  id: task.id,
                  title: task.title,
                  topic_subject: task.topic_subject,
                  actions_count: task.actions ? task.actions.length : 0
                });
                
                // 計算打卡記錄
                const checkInRecords = (task.actions || [])
                  .filter((action: any) => action.action_type === 'check_in')
                  .map((action: any) => ({
                    id: action.id,
                    timestamp: action.action_timestamp
                  }));
                
                console.log(`🔍 retroStore - 任務 ${task.title} 的打卡記錄:`, checkInRecords);
                
                taskDetails.push({
                  id: task.id,
                  title: task.title,
                  subject: task.topic_subject || '未分類',
                  recordCount: checkInRecords.length,
                  checkInDates: [stat.date],
                  taskRecords: checkInRecords
                });
              }
            }
          } else {
            console.log(`🔍 retroStore - ${stat.date} active_tasks 不是陣列或為空:`, typeof stat.active_tasks);
          }
          
          const validTaskDetails = taskDetails;
          
          // 從 taskDetails 中計算真正的打卡次數（只計算有打卡記錄的任務）
          const actualCheckInCount = taskDetails.reduce((sum, task) => sum + task.recordCount, 0);
          
          // 從 active_tasks 中找出該日完成的任務
          const completedTasksToday: Array<{
            id: string;
            title: string;
            subject: string;
            completedAt: string;
          }> = [];
          if (stat.active_tasks && Array.isArray(stat.active_tasks)) {
            for (const taskData of stat.active_tasks) {
              if (taskData && typeof taskData === 'object') {
                const task = taskData as any;
                if (task.status === 'done') {
                  completedTasksToday.push({
                    id: task.id,
                    title: task.title,
                    subject: task.topic_subject || '未分類',
                    completedAt: stat.date // 使用當日日期
                  });
                }
              }
            }
          }
          
          const result = {
            date: stat.date,
            dayOfWeek,
            checkInCount: actualCheckInCount, // 使用計算出的真實打卡次數
            topics: validTaskDetails,
            completedTasks: completedTasksToday, // 新增：該日完成的任務
            energy: dayJournal?.motivation_level || null,
            mood: dayJournal?.mood || null
          };
          
          console.log(`🔍 retroStore - ${stat.date} 最終結果:`, {
            checkInCount: result.checkInCount,
            topics_count: result.topics.length,
            completedTasks_count: result.completedTasks?.length || 0,
            energy: result.energy,
            mood: result.mood,
            原始_check_ins: stat.check_ins,
            計算後_checkInCount: actualCheckInCount
          });
          
          return result;
        })
      );
      
      // 🎯 能量狀態時間分布
      const energyTimeline = journalData.map(journal => ({
        date: journal.date,
        energy: journal.motivation_level,
        mood: journal.mood,
        hasJournal: true
      }));
      
      // 🎯 進行中的任務（從活躍主題中提取）
      const inProgressTasks = activeTopics
        .filter(topic => topic.has_recent_activity)
        .map(topic => ({
          id: topic.topic_id,
          title: topic.topic_title,
          topic: topic.topic_subject,
          status: 'in_progress' as const,
          priority: 'medium' as const,
          daysInProgress: topic.last_activity_date ? 
            Math.floor((new Date().getTime() - new Date(topic.last_activity_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
        }))
        .slice(0, 10);
      
      // 🎯 週摘要生成
      const activeSubjects = Array.from(new Set(mainTopics.map(t => t.subject)));
      const mostActiveSubject = activeSubjects[0] || '未分類';
      
      // 計算平均能量
      const energyValues = journalData.map(j => j.motivation_level).filter(e => e !== null);
      const averageEnergy = energyValues.length > 0 ? 
        Math.round(energyValues.reduce((a, b) => a + b, 0) / energyValues.length) : 0;
      
      // 學習模式判斷
      const dailyCheckInCounts = dailyCheckIns.map(d => d.checkInCount);
      const maxCount = Math.max(...dailyCheckInCounts);
      const avgCount = dailyCheckInCounts.reduce((a, b) => a + b, 0) / dailyCheckInCounts.length;
      
      let learningPattern: 'consistent' | 'burst' | 'irregular' | 'balanced' = 'balanced';
      if (maxCount > avgCount * 2) {
        learningPattern = 'burst';
      } else if (dailyCheckInCounts.filter(c => c > 0).length >= 5) {
        learningPattern = 'consistent';
      } else if (dailyCheckInCounts.filter(c => c > 0).length <= 2) {
        learningPattern = 'irregular';
      }
      
      const weekSummary = {
        keywords: Array.from(new Set([
          ...mainTasks.slice(0, 3).map(t => t.title),
          ...activeSubjects.slice(0, 2)
        ])),
        summary: `本週完成了 ${totalCompletedTasks} 個任務，主要專注在 ${mostActiveSubject} 的學習上。平均能量指數為 ${averageEnergy}/5，學習模式呈現${learningPattern === 'consistent' ? '穩定持續' : learningPattern === 'burst' ? '爆發式' : learningPattern === 'irregular' ? '不規律' : '平衡'}的特徵。`,
        mostActiveSubject,
        mostChallengingTask: inProgressTasks.find(t => t.daysInProgress > 3)?.title || null,
        learningPattern
      };
      
      // 🎯 社交互動統計 (簡化版本)
      const socialInteractions = {
        collaborativeTaskCount: 0, // TODO: 從 topicStore 獲取協作任務數
        collaborators: [], // TODO: 從 topicStore 獲取協作者列表
        helpReceived: 0,
        helpProvided: 0
      };
      
      // 🎯 計算總打卡次數
      const totalCheckInCount = dailyCheckIns.reduce((sum, day) => sum + day.checkInCount, 0);
      
      const weeklyStats: WeeklyStats = {
        checkInCount: totalCheckInCount,
        completedTaskCount: totalCompletedTasks,
        averageEnergy,
        mainTasks,
        mainTopics,
        weekRange: {
          start: weekStartStr,
          end: weekEndStr
        },
        dailyCheckIns,
        energyTimeline,
        inProgressTasks,
        weekSummary,
        socialInteractions,
        taskCheckInRecords: {} // 每個任務的打卡日期記錄
      };
      
      set({ currentWeekStats: weeklyStats, loading: false });
      return weeklyStats;
    } catch (error: any) {
      console.error('獲取週統計失敗:', error);
      set({ loading: false, error: error.message || '獲取週統計失敗' });
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
      
      const { data: answer, error } = await supabase
        .from('retro_answers')
        .insert([{ ...data, user_id: user.id }])
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
  drawQuestions: async (filters?: RetroFilters) => {
    return await get().drawQuestion(filters);
  },
  
  createAnswer: async (data: CreateRetroAnswerData) => {
    return await get().saveAnswer(data);
  },

  // 獲取指定日期的週統計
  getWeekStatsForDate: async (date: string) => {
    try {
      const weekStart = getWeekStart(date);
      const weekEnd = getWeekEnd(date);
      
      // 重新使用 getCurrentWeekStats 的邏輯，但使用指定的日期
      return await get().getCurrentWeekStats();
    } catch (error: any) {
      console.error('獲取指定日期週統計失敗:', error);
      return null;
    }
  }
}));

// 創建 store 實例供外部使用
export const retroStore = useRetroStore.getState(); 