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
  roles?: ('student' | 'mentor' | 'parent' | 'admin')[]; // 改為複數陣列支援多角色
  
  // 向後兼容：保留單角色屬性（已棄用）
  /** @deprecated 請使用 roles 陣列，此欄位僅為向後兼容 */
  role?: 'student' | 'mentor' | 'parent' | 'admin';
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  type?: TopicType;
  status: TopicStatus;
  due_date?: string; // 對應 Supabase schema
  goals: Goal[];
  category?: string;
  template_type?: string; // 對應 Supabase schema
  subject?: SubjectType;
  progress?: number;
  focus_element?: { type: 'goal' | 'task', id: string }; // 對應 Supabase schema
  bubbles?: Bubble[];
  
  // Supabase 相關字段
  template_id?: string;
  template_version?: number;
  owner_id: string;
  is_collaborative?: boolean; // 對應 Supabase schema
  show_avatars?: boolean; // 對應 Supabase schema
  created_at: string;
  updated_at: string;
  
  // 前端額外欄位 (從查詢時會填入)
  owner?: User; // 擁有者資訊
  template?: TopicTemplate; // 來源模板資訊
  topic_collaborators?: TopicCollaborator[]; // 協作者列表
  collaborators?: User[]; // 從 topic_collaborators 轉換而來的協作者列表
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
  // 協作相關字段 - 只存儲 ID
  owner_id?: string; // 主要負責人 ID
  collaborator_ids?: string[]; // 協作人 ID 列表
  
  // 前端計算字段 - 不存儲在資料庫，由前端從 userStore 動態組合
  owner?: User; // 主要負責人（前端組合）
  collaborators?: User[]; // 協作人列表（前端組合）
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
  // 協作相關字段 - 只存儲 ID
  owner_id?: string; // 主要負責人 ID
  collaborator_ids?: string[]; // 協作人 ID 列表
  
  // 前端計算字段 - 不存儲在資料庫，由前端從 userStore 動態組合
  owner?: User; // 主要負責人（前端組合）
  collaborators?: User[]; // 協作人列表（前端組合）
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

// ===== Supabase 相關類型定義 =====

/**
 * Topic Template - mentor 建立的課程模板
 */
export interface TopicTemplate {
  id: string;
  title: string;
  description?: string;
  subject?: SubjectType;
  category?: string;
  template_type?: string;
  
  // 結構化資料
  goals: Goal[];
  bubbles?: Bubble[];
  
  // 權限相關
  created_by: string; // 建立者 UUID
  is_public: boolean; // 是否公開
  is_collaborative: boolean; // 是否允許協作
  
  // 統計資料
  copy_count: number; // 被複製次數
  usage_count: number; // 被使用次數
  
  // 時間戳記
  created_at: string;
  updated_at: string;
  
  // 前端額外欄位 (從 Supabase 查詢時會填入)
  creator?: User; // 建立者資訊
  collaborators?: TopicTemplateCollaborator[]; // 協作者列表
}

/**
 * Topic Template 協作者
 */
export interface TopicTemplateCollaborator {
  id: string;
  template_id: string;
  user_id: string;
  permission: 'view' | 'edit' | 'admin';
  invited_by?: string;
  invited_at: string;
  
  // 前端額外欄位
  user?: User; // 用戶資訊
}

// TopicWithSupabase 已合併到 Topic，不再需要

/**
 * Topic 協作者
 */
export interface TopicCollaborator {
  id: string;
  topic_id: string;
  user_id: string;
  permission: 'view' | 'edit';
  invited_by?: string;
  invited_at: string;
  
  // 前端額外欄位
  user?: User; // 用戶資訊
}

/**
 * 從 Template 建立 Topic 的參數
 */
export interface CreateTopicFromTemplateParams {
  template_id: string;
  title?: string; // 可覆寫標題
  description?: string; // 可覆寫描述
  is_collaborative?: boolean; // 是否要設為協作模式
}

/**
 * 複製 Template 的參數
 */
export interface CopyTemplateParams {
  source_template_id: string;
  title?: string; // 可覆寫標題
  description?: string; // 可覆寫描述
  is_public?: boolean; // 是否設為公開
}