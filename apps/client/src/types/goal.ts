import { SubjectType } from '../constants/subjects';
import { TOPIC_STATUSES } from '../constants/topics';

export type TopicStatus = typeof TOPIC_STATUSES[keyof typeof TOPIC_STATUSES];
export type TopicType = '學習目標' | '個人成長' | '專案計畫' | '活動規劃';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'idea' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskRole = 'explore' | 'work' | 'present';

// 添加目標狀態類型
export type GoalStatus = 'todo' | 'pause' | 'focus' | 'finish' | 'complete' | 'archived';

// 用戶類型定義
export interface User {
  id: string;
  name: string;
  avatar?: string; // 頭像 URL 或 emoji
  color?: string; // 代表顏色
  email?: string;
  role?: 'student' | 'mentor' | 'parent' | 'admin';
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  type?: TopicType;
  status: TopicStatus;
  dueDate?: string;
  goals: Goal[];
  category?: string;
  templateType?: string;
  subject?: SubjectType;
  progress?: number;
  focusElement?: { type: 'goal' | 'task', id: string };
  bubbles?: Bubble[];
  // 協作相關字段
  isCollaborative?: boolean; // 是否為協作主題
  owner?: User; // 主要擁有者
  collaborators?: User[]; // 協作人列表
  showAvatars?: boolean; // 是否在 Radial 中顯示頭像
  // 移除 focusedGoalIds，改用目標的 status 字段來管理
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
  order?: number;
  status?: GoalStatus; // 改為 GoalStatus 類型
  needHelp?: boolean; // 是否需要幫助
  helpMessage?: string; // 幫助訊息
  helpResolvedAt?: string; // 幫助解決時間
  replyMessage?: string; // 老師回覆訊息
  replyAt?: string; // 老師回覆時間
  // 協作相關字段
  owner?: User; // 主要負責人
  collaborators?: User[]; // 協作人列表
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  priority?: TaskPriority;
  category?: string;
  role?: TaskRole;
  estimatedTime?: string;
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
  order?: number;
  challenge?: number;
  needHelp?: boolean; // 是否需要幫助
  helpMessage?: string; // 幫助訊息
  helpResolvedAt?: string; // 幫助解決時間
  replyMessage?: string; // 老師回覆訊息
  replyAt?: string; // 老師回覆時間
  // 協作相關字段
  owner?: User; // 主要負責人
  collaborators?: User[]; // 協作人列表
}

export interface Bubble {
  id: string;
  title: string;
  parentId: string;
  bubbleType: 'impression' | 'background';
  content?: string;
  position?: { x: number; y: number };
}

// 保持向後兼容的別名（過渡期使用）
export type Step = Goal;
export type { Topic as Goal_New, Goal as Step_New };

export interface ActionItem {
  id: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  estimatedTime?: string;
  priority: 'low' | 'medium' | 'high';
  addedToSchedule?: boolean;
}