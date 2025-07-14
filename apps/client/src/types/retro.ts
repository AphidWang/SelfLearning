/**
 * 個人 Retro 系統類型定義
 * 
 * 🎯 功能：
 * - 週統計數據類型
 * - 問題庫和抽籤系統
 * - 回答記錄和儲存
 * - 遊戲化介面元素
 */

export interface WeeklyStats {
  /** 週期標識 */
  weekId: string;
  /** 週開始日期 */
  weekStart: string;
  /** 週結束日期 */
  weekEnd: string;
  /** 完成的任務數量 */
  completedTaskCount: number;
  /** 本週平均能量/情緒指標 (1-5) */
  averageEnergy: number | null;
  /** 本週總打卡次數（狀態變化） */
  totalCheckIns: number;
  /** 本週總任務記錄數量（學習記錄） */
  totalTaskRecords: number;
  /** 本週總活動數量（打卡 + 任務記錄） */
  totalActivities: number;
  /** 本週主要完成的任務清單 */
  mainTasks: {
    id: string;
    title: string;
    topic: string;
    completedAt: string;
    difficulty: number;
  }[];
  /** 進行中的任務 */
  inProgressTasks: {
    id: string;
    title: string;
    topic: string;
    status: 'in_progress' | 'pending';
    priority: 'low' | 'medium' | 'high';
    daysInProgress: number;
  }[];
  /** 活躍任務清單 */
  activeTasks: {
    id: string;
    title: string;
    subject: string;
    progress: number;
    taskCount: number;
    completedTaskCount: number;
    hasActivity: boolean;
    weeklyProgress: {
      total_tasks: number;
      completed_tasks: number;
      completion_rate: number;
      status_changes: number;
      check_ins: number;
      records: number;
    };
  }[];
  
  // 🎯 新增：更詳細的脈絡資訊
  /** 每日打卡詳情 */
  dailyCheckIns: {
    date: string;
    dayOfWeek: string;
    checkInCount: number;      // 打卡次數（狀態變化）
    taskRecordCount: number;   // 任務記錄次數（學習記錄）
    totalActivities: number;   // 總活動數
    completedTasks: Array<{
      id: string;
      title: string;
      subject: string;
    }>;
    topics: Array<{
      id: string;
      title: string;
      subject: string;
      recordCount: number;
      taskRecords: Array<{
        id: string;
        timestamp: string;
      }>;
    }>;
    mood?: string | null;
    energy?: number | null;
  }[];
  
  /** 學習模式 */
  learningPatterns: string[];
  
  /** 週摘要 */
  weekSummary: {
    /** 總學習時數 */
    totalLearningHours: number;
    /** 完成的目標數 */
    completedGoals: number;
    /** 平均效率 */
    averageEfficiency: number;
    /** 本週學習模式 */
    learningPattern: 'morning' | 'evening' | 'consistent' | 'burst' | 'irregular' | 'balanced';
    /** 表現最好的日子 */
    topPerformanceDay: string;
    /** 改善建議 */
    improvementAreas: string[];
  };
}

export interface RetroQuestion {
  id: string;
  /** 問題文本 */
  question: string;
  /** 問題類型 */
  type: 'reflection' | 'growth' | 'challenge' | 'gratitude' | 'planning';
  /** 問題適用的年齡層 */
  ageGroup: 'all' | 'elementary' | 'middle' | 'high' | 'adult';
  /** 問題難度 (1-5) */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** 問題標籤 */
  tags: string[];
  /** 問題的溫馨提示 */
  hint?: string;
  /** 問題的示例回答 */
  example?: string;
}

export interface RetroAnswer {
  id: string;
  /** 回答日期 */
  date: string;
  /** 週標識符 (YYYY-WW) */
  weekId: string;
  /** 用戶ID */
  userId: string;
  /** 選中的問題 */
  question: RetroQuestion;
  /** 是否為自訂問題 */
  isCustomQuestion: boolean;
  /** 自訂問題內容 (如果是自訂問題) */
  customQuestion?: string;
  /** 用戶的回答 */
  answer: string;
  /** 回答時的心情 */
  mood: 'excited' | 'happy' | 'okay' | 'tired' | 'stressed';
  /** 附加的表情符號 */
  emoji?: string;
  /** 創建時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
}

export interface RetroSession {
  id: string;
  /** 週標識符 */
  weekId: string;
  /** 用戶ID */
  userId: string;
  /** 本週統計數據 */
  weeklyStats: WeeklyStats;
  /** 抽到的三個問題 */
  drawnQuestions: RetroQuestion[];
  /** 用戶的回答 (可選) */
  answer?: RetroAnswer;
  /** 會話狀態 */
  status: 'draft' | 'completed';
  /** 創建時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
}

export interface QuestionDraw {
  /** 抽籤的問題（支援單個或多個） */
  question?: RetroQuestion;
  questions?: RetroQuestion[];
  /** 抽籤時間 */
  drawTime?: string;
  /** 可重抽次數 */
  rerollsLeft?: number;
  /** 問題庫總數 */
  totalQuestions?: number;
  /** 剩餘問題數 */
  remainingQuestions?: number;
}

export interface RetroFilters {
  /** 開始日期 */
  startDate?: string;
  /** 結束日期 */
  endDate?: string;
  /** 問題類型 */
  questionType?: RetroQuestion['type'];
  /** 心情篩選 */
  mood?: RetroAnswer['mood'];
  /** 排除的問題ID列表 */
  excludeIds?: string[];
  /** 抽取問題數量 */
  count?: number;
}

export interface RetroStats {
  /** 總回答數 */
  totalAnswers: number;
  /** 連續回答週數 */
  streakWeeks: number;
  /** 最常選擇的問題類型 */
  favoriteQuestionType: RetroQuestion['type'];
  /** 心情分佈 */
  moodDistribution: Record<RetroAnswer['mood'], number>;
  /** 最近的回答 */
  recentAnswers: RetroAnswer[];
}

export interface CreateRetroAnswerData {
  weekId: string;
  question: RetroQuestion;
  isCustomQuestion: boolean;
  customQuestion?: string;
  answer: string;
  mood: RetroAnswer['mood'];
  emoji?: string;
}

export interface UpdateRetroAnswerData {
  answer?: string;
  mood?: RetroAnswer['mood'];
  emoji?: string;
}

/** 遊戲化元素：抽籤動畫狀態 */
export interface DrawAnimationState {
  isAnimating: boolean;
  currentStep: 'idle' | 'shuffling' | 'drawing' | 'revealing' | 'completed';
  progress: number;
}

/** 遊戲化元素：成就系統 */
export interface RetroAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'streak' | 'depth' | 'variety' | 'consistency';
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

/** 錯誤處理 */
export interface RetroError {
  code: string;
  message: string;
  details?: any;
}

/** API 回應包裝 */
export interface RetroResponse<T> {
  success: boolean;
  data?: T;
  error?: RetroError;
}

// 導出 DailyCheckIn 類型供其他模組使用
export type DailyCheckIn = WeeklyStats['dailyCheckIns'][0]; 