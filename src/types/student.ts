import { Task, TaskStatus } from './task';

/**
 * 學生的週計畫
 * 由學生確認或自我規劃的週任務計畫
 */
export interface StudentWeeklyPlan {
  id: string;              // 週計畫 ID
  weekId: number;          // 對應的週次
  subject: string;         // 科目
  curriculum: string;      // 課程名稱
  tasks: Task[];          // 確認/規劃的任務列表
  
  // 學生自我規劃相關
  goals?: string[];        // 週目標
  notes?: string;          // 學習筆記
  selfReflection?: string; // 自我反思
  
  // 時間相關
  createdAt: string;       // 建立時間
  updatedAt: string;       // 更新時間
  startDate: string;       // 計畫開始日期
  endDate: string;         // 計畫結束日期
}

/**
 * 學生資料
 * 包含基本資料和學習狀態
 */
export interface Student {
  id: string;
  name: string;
  avatar: string;
  
  // 學習進度
  progress: number;
  subjects: {
    name: string;
    progress: number;
  }[];
  
  // 任務完成情況
  completedTasks: number;
  totalTasks: number;
  lastActive: string;
  pendingFeedback: number;
  
  // 個人週計畫
  weeklyPlans?: StudentWeeklyPlan[];
}

/**
 * 學生的任務進度
 * 用於追蹤個別任務的完成狀況
 */
export interface StudentTaskProgress {
  taskId: string;
  studentId: string;
  status: TaskStatus;
  progress: number;
  
  // 時間追蹤
  startedAt?: string;
  completedAt?: string;
  
  // 學習回饋
  feedback?: string;
  reflection?: string;     // 學生的學習心得
  timeSpent?: number;      // 花費時間（分鐘）
  difficulties?: string[]; // 遇到的困難
} 