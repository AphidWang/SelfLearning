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

// === 新增：擴展任務類型 ===

/**
 * 任務類型定義
 */
export type TaskType = 
  | 'single'        // 單次任務（現有的傳統任務）
  | 'count'         // 計數型（累積做幾次）
  | 'streak'        // 連續型（支援打卡算連續天數）
  | 'accumulative'; // 累計型（每天可完成多次，單位自訂）

/**
 * 週期類型定義
 */
export type CycleType = 
  | 'none'          // 無週期
  | 'weekly'        // 週循環
  | 'monthly';      // 月循環

/**
 * 計數型任務配置
 */
export interface CountTaskConfig {
  type: 'count';
  target_count: number;           // 目標次數
  current_count: number;          // 當前次數
  reset_frequency: CycleType;     // 重置頻率
}

/**
 * 連續型任務配置
 */
export interface StreakTaskConfig {
  type: 'streak';
  target_days: number;            // 目標連續天數
  current_streak: number;         // 當前連續天數
  max_streak: number;             // 最高連續紀錄
  check_in_dates: string[];       // 打卡日期列表
}

/**
 * 累計型任務配置
 */
export interface AccumulativeTaskConfig {
  type: 'accumulative';
  target_amount: number;          // 目標累計量
  current_amount: number;         // 當前累計量
  unit: string;                   // 單位（分鐘、次數、頁數等）
  daily_records: Array<{          // 每日記錄
    date: string;
    amount: number;
  }>;
}

/**
 * 單次任務配置
 */
export interface SingleTaskConfig {
  type: 'single';
  // 單次任務不需要額外配置，使用現有的 status 即可
}

/**
 * 任務配置聯合類型
 */
export type TaskConfig = 
  | SingleTaskConfig 
  | CountTaskConfig 
  | StreakTaskConfig 
  | AccumulativeTaskConfig;

/**
 * 週期配置
 */
export interface CycleConfig {
  cycle_type: CycleType;          // 週期類型
  cycle_start_date?: string;      // 週期開始日期（週一或月初）
  due_date?: string;              // 截止日期
  auto_reset: boolean;            // 是否自動重置
}

/**
 * 任務進度數據
 */
export interface TaskProgressData {
  last_updated: string;           // 最後更新時間
  completion_percentage: number;  // 完成百分比
  
  // 連續型任務專用欄位
  current_streak?: number;        // 當前連續天數
  max_streak?: number;            // 最高連續紀錄
  check_in_dates?: string[];      // 打卡日期列表
  
  // 計數型任務專用欄位
  current_count?: number;         // 當前計數
  target_count?: number;          // 目標計數
  
  // 累計型任務專用欄位
  current_amount?: number;        // 當前累計量
  target_amount?: number;         // 目標累計量
  unit?: string;                  // 單位
  
  // 通用統計數據
  streak_data?: {                 // 連續型專用（舊格式，向後兼容）
    longest_streak: number;
    current_streak: number;
    last_check_in: string;
  };
  weekly_summary?: {              // 週期總結
    week_start: string;
    total_count: number;
    daily_breakdown: Array<{
      date: string;
      count: number;
    }>;
  };
}

/**
 * 任務動作類型
 */
export type TaskActionType = 
  | 'check_in'      // 打卡
  | 'add_count'     // 增加計數
  | 'add_amount'    // 增加累計量
  | 'complete'      // 完成
  | 'reset';        // 重置

// 特殊任務標記常量
export const SPECIAL_TASK_FLAGS = {
  WEEKLY_QUICK_CHALLENGE: 'weekly_quick_challenge', // 週挑戰快速創建任務
  DAILY_HABIT: 'daily_habit',                       // 每日習慣任務
  MONTHLY_GOAL: 'monthly_goal',                     // 月度目標任務
} as const;

export type SpecialTaskFlag = typeof SPECIAL_TASK_FLAGS[keyof typeof SPECIAL_TASK_FLAGS];

/**
 * 任務動作記錄
 */
export interface TaskAction {
  id: string;
  task_id: string;
  user_id: string;
  action_type: TaskActionType;
  action_data: Record<string, any>;  // 動作相關數據
  action_date: string;               // 動作日期
  created_at: string;
  updated_at: string;
}

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
  
  // === 新增：擴展任務類型支援 ===
  task_type: TaskType;              // 任務類型
  task_config: TaskConfig;          // 任務配置
  cycle_config: CycleConfig;        // 週期配置
  progress_data: TaskProgressData;  // 進度數據
  special_flags?: string[];         // 特殊標記（如：'weekly_quick_challenge'）
  
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
  records?: TaskRecord[];
  
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

/**
 * 擴展的學習記錄介面（用於 task_records 表）
 */
export interface TaskRecord {
  id: string;
  created_at: string;
  title: string;
  message: string;
  difficulty: number;
  completion_time?: number;
  files?: any[];
  tags?: string[];
}

export interface TaskWithContext extends Task {
  topicId: string;
  topicTitle: string;
  topicSubject: string;
  goalId: string;
  goalTitle: string;
  subjectStyle: any;
  records: TaskRecord[];
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

// === 輔助函數：創建預設配置 ===

/**
 * 創建預設的任務配置
 */
export function createDefaultTaskConfig(type: TaskType): TaskConfig {
  switch (type) {
    case 'single':
      return { type: 'single' };
    case 'count':
      return {
        type: 'count',
        target_count: 7,
        current_count: 0,
        reset_frequency: 'weekly'
      };
    case 'streak':
      return {
        type: 'streak',
        target_days: 7,
        current_streak: 0,
        max_streak: 0,
        check_in_dates: []
      };
    case 'accumulative':
      return {
        type: 'accumulative',
        target_amount: 100,
        current_amount: 0,
        unit: '分鐘',
        daily_records: []
      };
    default:
      return { type: 'single' };
  }
}

/**
 * 創建預設的週期配置
 */
export function createDefaultCycleConfig(): CycleConfig {
  return {
    cycle_type: 'none',
    auto_reset: false
  };
}

/**
 * 創建預設的進度數據
 */
export function createDefaultProgressData(): TaskProgressData {
  return {
    last_updated: new Date().toISOString(),
    completion_percentage: 0
  };
}

/**
 * 檢查任務是否為擴展類型（非單次任務）
 */
export function isExtendedTaskType(task: Task): boolean {
  return task.task_type !== 'single';
}

/**
 * 獲取任務的顯示進度
 */
export function getTaskDisplayProgress(task: Task): number {
  if (task.task_type === 'single') {
    return task.status === 'done' ? 100 : 0;
  }
  return task.progress_data?.completion_percentage || 0;
}

/**
 * 檢查任務是否可以今天執行動作
 */
export function canPerformTodayAction(task: Task): boolean {
  if (task.task_type === 'single') {
    return task.status !== 'done';
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  if (task.task_type === 'streak') {
    const config = task.task_config as StreakTaskConfig;
    return !config.check_in_dates.includes(today);
  }
  
  return true; // count 和 accumulative 都可以每天多次操作
}

/**
 * 檢查任務是否有特定標記
 */
export function hasSpecialFlag(task: Task, flag: SpecialTaskFlag): boolean {
  return task.special_flags?.includes(flag) || false;
}

/**
 * 檢查是否存在週挑戰快速創建任務
 */
export function hasWeeklyQuickChallenge(tasks: Task[]): boolean {
  return tasks.some(task => hasSpecialFlag(task, SPECIAL_TASK_FLAGS.WEEKLY_QUICK_CHALLENGE));
}