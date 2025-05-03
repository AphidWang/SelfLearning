import { Task } from './task';

/**
 * 教師的週任務規劃
 * 用於規劃課程進度和建議任務
 */
export interface WeekPlan {
  id: number;                // 週次
  nodeIds: string[];        // 課程節點 ID，用於追蹤課程進度
  tasks: Task[];            // 該週建議的任務列表
  
  startDate?: string;       // 週開始日期
  endDate?: string;         // 週結束日期
  description?: string;     // 週計畫說明
  
  // 補充規劃相關
  objectives?: string[];    // 週學習目標
  subjectId: string;        // 科目 ID
  creatorId: string;        // 建立教師
  createdAt: string;        // 建立時間
  updatedAt: string;        // 更新時間
}

/**
 * 任務分配記錄
 * 用於追蹤任務分配狀態
 */
export interface TaskAssignment {
  id: string;              // 分配記錄 ID
  taskId: string;          // 任務 ID
  studentId: string;       // 學生 ID
  weekId: number;          // 分配的週次
  assignedAt: string;      // 分配時間
  assignedBy: string;      // 分配教師
  status: 'pending' | 'accepted' | 'rejected';  // 分配狀態
  
  // 補充回應相關
  respondedAt?: string;    // 學生回應時間
  responseNote?: string;   // 學生回應說明
}

/**
 * 週任務規劃的篩選條件
 */
export interface WeekPlanFilter {
  subjectId?: string;
  startDate?: string;
  endDate?: string;
  creatorId?: string;
} 