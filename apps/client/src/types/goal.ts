import { SubjectType } from '../constants/subjects';
import { TOPIC_STATUSES } from '../constants/topics';
import { User } from '@self-learning/types';

export type TopicStatus = typeof TOPIC_STATUSES[keyof typeof TOPIC_STATUSES];
export type TopicType = '學習目標' | '個人成長' | '專案計畫' | '活動規劃';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'idea' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskRole = 'explore' | 'work' | 'present';

// 添加目標狀態類型
export type GoalStatus = 'todo' | 'pause' | 'focus' | 'finish' | 'complete' | 'archived';

export interface Topic {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  reference_info?: ReferenceInfo;
  subject?: string;
  category?: string;
  status: TopicStatus;
  type?: TopicType;
  topic_type?: TopicType; // 別名，向後兼容
  template_id?: string;
  template_version?: number;
  is_collaborative: boolean;
  show_avatars: boolean;
  due_date?: string;
  focus_element?: any;
  bubbles?: Bubble[];
  
  // 版本控制
  version: number;
  created_at?: string;
  updated_at?: string;
  
  // 關聯數據（從其他表 JOIN 來的）
  goals?: Goal[];
  topic_collaborators?: any[];
  progress?: number; // 計算得出的進度
  
  // 前端額外欄位 (從查詢時會填入)
  owner?: User; // 擁有者資訊
  template?: TopicTemplate; // 來源模板資訊
  collaborators?: User[]; // 從 topic_collaborators 轉換而來的協作者列表
}

export interface Goal {
  id: string;
  topic_id: string;
  title: string;
  description?: string;
  reference_info?: ReferenceInfo;
  status: GoalStatus;
  priority: TaskPriority;
  order_index: number;
  
  // 協作相關
  need_help?: boolean;
  help_message?: string;
  help_resolved_at?: string;
  
  // 版本控制
  version: number;
  created_at?: string;
  updated_at?: string;
  
  // 關聯數據
  tasks?: Task[];
  
  // 協作相關字段 - 只存儲 ID
  collaborator_ids?: string[]; // 協作人 ID 列表
  
  // 前端計算字段 - 不存儲在資料庫，由前端從 userStore 動態組合
  owner?: User; // 負責人（前端組合）
  collaborators?: User[]; // 協作人列表（前端組合）
}

export interface Task {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  reference_info?: ReferenceInfo;
  status: TaskStatus;
  priority: TaskPriority;
  order_index: number;
  
  // 協作相關
  need_help: boolean;
  help_message?: string;
  reply_message?: string;
  reply_at?: string;
  replied_by?: string;
  
  // 完成相關
  completed_at?: string;
  completed_by?: string;
  
  // 時間追蹤
  estimated_minutes?: number;
  actual_minutes?: number;
  
  // 學習記錄
  records?: { id: string; content?: string; created_at?: string }[];
  
  // 版本控制
  version: number;
  created_at?: string;
  updated_at?: string;
  
  // 舊字段兼容（逐步移除）
  category?: string;
  role?: string;
  estimatedTime?: number; // 映射到 estimated_minutes
  notes?: string; // 映射到 description
  challenge?: string;
  dueDate?: string;
  assignedTo?: string[];
  order?: number; // 映射到 order_index
  
  // 前端計算字段 - 不存儲在資料庫，由前端動態組合
  owner?: User; // 負責人（前端組合）
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
 * Template Goal - 模板中的目標結構（JSONB 格式）
 */
export interface TemplateGoal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  priority?: TaskPriority;
  tasks?: TemplateTask[];
}

/**
 * Template Task - 模板中的任務結構（JSONB 格式）
 */
export interface TemplateTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
}

/**
 * Topic Template - mentor 建立的課程模板
 */
export interface TopicTemplate {
  id: string;
  title: string;
  description?: string;
  reference_info?: ReferenceInfo;
  subject?: SubjectType;
  category?: string;
  template_type?: string;
  
  // 結構化資料 - 使用 JSONB 格式的簡化結構
  goals: TemplateGoal[];
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
  _category?: 'my' | 'public' | 'collaborative'; // 用於前端分類過濾
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

// 版本控制相關類型
export interface VersionControlResult {
  success: boolean;
  current_version: number;
  message: string;
}

// 數據庫函數返回結果類型
export interface SafeUpdateResult {
  success: boolean;
  current_version: number;
  message: string;
}

// Topic 查詢結果類型（包含完整結構）
export interface TopicWithStructure {
  topic_data: Topic;
  goals_data: Goal[];
  tasks_data: Task[];
}

// 活躍任務查詢結果類型
export interface ActiveTaskResult {
  task_id: string;
  task_title: string;
  task_description?: string;
  task_status: TaskStatus;
  task_priority: TaskPriority;
  task_need_help: boolean;
  task_version: number;
  task_created_at: string;
  task_updated_at: string;
  goal_id: string;
  goal_title: string;
  goal_status: GoalStatus;
  topic_id: string;
  topic_title: string;
  topic_subject?: string;
  topic_status: TopicStatus;
}

export interface TaskWithContext extends Task {
  topicId: string;
  topicTitle: string;
  topicSubject: string;
  goalId: string;
  goalTitle: string;
  subjectStyle: any;
  records: {
    id: string;
    created_at: string;
    title: string;
    message: string;
    difficulty: number;
    completion_time?: number;
    files?: any[];
    tags?: string[];
  }[];
}

// 參考資訊相關類型
export type AttachmentType = 'image' | 'video' | 'pdf' | 'document' | 'audio' | 'other';
export type LinkType = 'website' | 'youtube' | 'github' | 'drive' | 'other';

export interface ReferenceAttachment {
  id: string;
  title: string;
  url: string;
  type: AttachmentType;
  size?: number; // 檔案大小（bytes）
  thumbnail?: string; // 縮圖 URL
  created_at: string;
  created_by?: string;
}

export interface ReferenceLink {
  id: string;
  title: string;
  url: string;
  type: LinkType;
  description?: string;
  thumbnail?: string; // 網站截圖或 favicon
  created_at: string;
  created_by?: string;
}

export interface ReferenceInfo {
  attachments: ReferenceAttachment[];
  links: ReferenceLink[];
}