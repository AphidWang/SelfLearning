export type TaskStatus = 
  | 'pending'      // 未開始
  | 'in_progress'  // 進行中
  | 'completed'    // 已完成
  | 'overdue'      // 已逾期
  | 'waiting_feedback'; // 待回饋

export type TaskPriority = 'high' | 'medium' | 'low';
export type RewardType = 'points' | 'badge' | 'experience';

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'document' | 'link';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  subject: string;
  
  // 時程相關
  startDate?: string;
  endDate: string;
  
  // 進度相關
  progress: number;
  
  // 分配相關
  assignedBy: string;
  priority?: TaskPriority;
  
  // 關聯資料
  courseId?: string;    // 若任務來自課程
  weekId?: number;      // 規劃的週次
  subjectId: string;    // 科目
  creatorId: string;    // 建立者（老師）
  
  // 任務設定
  required: boolean;    // 是否必修
  points?: number;      // 獲得點數
  requirements?: string[]; // 前置任務
  assignedTo?: string;
  rewards?: {
    type: RewardType;
    value: number;
    icon: string;
  }[];
  resources?: Resource[];
  students: string[];  // 添加這個屬性
}

export interface WeeklyPlan {
  subject: string;
  curriculum: string;
  tasks: Task[];
}

export type TaskType = 
  | 'course'       // 課程任務
  | 'assignment'   // 作業
  | 'quiz'         // 測驗
  | 'practice'     // 練習
  | 'project';     // 專案

export interface TaskProgress {
  taskId: string;
  studentId: string;
  status: TaskStatus;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  feedback?: string;
}

export interface TaskFilter {
  subject?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  endDate?: string;
}