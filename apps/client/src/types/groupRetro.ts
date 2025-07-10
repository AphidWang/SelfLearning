/**
 * 小組討論 Retro 系統類型定義
 * 
 * 🎯 功能：
 * - 多人參與的共學討論
 * - 參與者選擇和管理
 * - 週進度概覽展示
 * - 共同討論問題
 * - 多人回覆系統
 * - 記錄匯出功能
 */

import type { RetroAnswer, WeeklyStats } from './retro';
import type { User } from '@self-learning/types';

/** 參與者週總結 */
export interface ParticipantWeeklySummary {
  /** 用戶基本信息 */
  user: User;
  /** 本週統計數據 */
  weeklyStats: WeeklyStats;
  /** 個人 Retro 完成狀態 */
  hasCompletedPersonalRetro: boolean;
  /** 最新的個人 Retro 回答 */
  latestPersonalRetro?: RetroAnswer;
  /** 參與者主要主題 (最多3個) */
  mainTopics: string[];
  /** 參與者本週能量等級描述 */
  energyDescription: string;
  /** 參與者顏色標識 */
  colorTheme: string;
}

/** 小組討論問題 */
export interface GroupRetroQuestion {
  id: string;
  /** 問題標題 */
  title: string;
  /** 問題內容 */
  content: string;
  /** 問題類型 */
  type: 'appreciation' | 'learning' | 'collaboration' | 'reflection' | 'planning' | 'custom';
  /** 問題順序 */
  order: number;
  /** 是否為預設問題 */
  isDefault: boolean;
  /** 問題的引導提示 */
  guidance?: string;
  /** 適用年齡層 */
  ageGroup: 'all' | 'elementary' | 'middle' | 'high';
  /** 創建時間 */
  createdAt: string;
}

/** 參與者回覆 */
export interface GroupRetroReply {
  id: string;
  /** 問題ID */
  questionId: string;
  /** 回覆者用戶ID */
  userId: string;
  /** 回覆者信息 */
  user: User;
  /** 回覆內容 */
  content: string;
  /** 回覆情緒 */
  mood?: 'excited' | 'happy' | 'thoughtful' | 'grateful' | 'inspired' | 'neutral' | 'surprised';
  /** 附加表情符號 */
  emoji?: string;
  /** 創建時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
}

/** 小組討論會話 */
export interface GroupRetroSession {
  id: string;
  /** 會話標題 */
  title: string;
  /** 週標識符 (YYYY-WW) */
  weekId: string;
  /** 會話創建者 */
  createdBy: User;
  /** 參與者清單 */
  participants: ParticipantWeeklySummary[];
  /** 討論問題清單 */
  questions: GroupRetroQuestion[];
  /** 所有回覆 */
  replies: GroupRetroReply[];
  /** 會話狀態 */
  status: 'preparing' | 'discussing' | 'completed' | 'archived';
  /** 會話設定 */
  settings: {
    /** 是否允許匿名回覆 */
    allowAnonymous: boolean;
    /** 是否自動產生問題 */
    autoGenerateQuestions: boolean;
    /** 最大參與者數量 */
    maxParticipants: number;
    /** 問題數量限制 */
    questionLimit: number;
  };
  /** 創建時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
  /** 完成時間 */
  completedAt?: string;
}

/** 預設討論問題清單 */
export interface DefaultGroupQuestions {
  appreciation: GroupRetroQuestion[];
  learning: GroupRetroQuestion[];
  collaboration: GroupRetroQuestion[];
  reflection: GroupRetroQuestion[];
  planning: GroupRetroQuestion[];
}

/** 小組討論統計 */
export interface GroupRetroStats {
  /** 總會話數 */
  totalSessions: number;
  /** 總參與次數 */
  totalParticipations: number;
  /** 平均參與者數量 */
  averageParticipants: number;
  /** 最活躍的週份 */
  mostActiveWeek: string;
  /** 最受歡迎的問題類型 */
  popularQuestionTypes: Record<GroupRetroQuestion['type'], number>;
  /** 回覆長度統計 */
  replyLengthStats: {
    average: number;
    min: number;
    max: number;
  };
}

/** 創建小組討論會話數據 */
export interface CreateGroupRetroSessionData {
  title: string;
  weekId: string;
  participantIds: string[];
  customQuestions?: Omit<GroupRetroQuestion, 'id' | 'createdAt'>[];
  settings?: Partial<GroupRetroSession['settings']>;
}

/** 更新小組討論會話數據 */
export interface UpdateGroupRetroSessionData {
  title?: string;
  participantIds?: string[];
  questions?: GroupRetroQuestion[];
  status?: GroupRetroSession['status'];
  settings?: Partial<GroupRetroSession['settings']>;
}

/** 創建回覆數據 */
export interface CreateGroupRetroReplyData {
  questionId: string;
  content: string;
  mood?: GroupRetroReply['mood'];
  emoji?: string;
}

/** 更新回覆數據 */
export interface UpdateGroupRetroReplyData {
  content?: string;
  mood?: GroupRetroReply['mood'];
  emoji?: string;
}

/** 會話匯出數據格式 */
export interface GroupRetroExportData {
  session: GroupRetroSession;
  exportedAt: string;
  format: 'json' | 'csv' | 'pdf' | 'markdown';
  metadata: {
    participantCount: number;
    questionCount: number;
    replyCount: number;
    weekRange: string;
  };
}

/** 參與者選擇篩選條件 */
export interface ParticipantSelectionFilters {
  /** 是否已完成個人 Retro */
  hasCompletedPersonalRetro?: boolean;
  /** 年齡範圍 */
  ageRange?: {
    min: number;
    max: number;
  };
  /** 排除的用戶ID */
  excludeUserIds?: string[];
  /** 搜索關鍵字 */
  searchQuery?: string;
}

/** 問題抽籤結果 */
export interface QuestionDrawResult {
  /** 抽中的問題 */
  questions: GroupRetroQuestion[];
  /** 抽籤時間 */
  drawTime: string;
  /** 是否可以重新抽籤 */
  canRedraw: boolean;
}

/** 小組討論進度 */
export interface GroupRetroProgress {
  /** 已回覆的參與者數量 */
  repliedParticipants: number;
  /** 總參與者數量 */
  totalParticipants: number;
  /** 已回覆的問題數量 */
  repliedQuestions: number;
  /** 總問題數量 */
  totalQuestions: number;
  /** 整體完成百分比 */
  completionPercentage: number;
  /** 每個問題的回覆統計 */
  questionProgress: Array<{
    questionId: string;
    questionTitle: string;
    replyCount: number;
    participantCount: number;
  }>;
}

/** 錯誤處理 */
export interface GroupRetroError {
  code: string;
  message: string;
  details?: any;
}

/** API 回應包裝 */
export interface GroupRetroResponse<T> {
  success: boolean;
  data?: T;
  error?: GroupRetroError;
}

/** 會話操作類型 */
export type GroupRetroAction = 
  | 'create_session'
  | 'update_session' 
  | 'delete_session'
  | 'add_participant'
  | 'remove_participant'
  | 'add_question'
  | 'update_question'
  | 'delete_question'
  | 'add_reply'
  | 'update_reply'
  | 'delete_reply'
  | 'complete_session'
  | 'export_session'; 