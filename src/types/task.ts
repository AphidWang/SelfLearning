export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'waiting_feedback';
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
  description?: string;
  subject: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  startDate: Date;
  endDate: Date;
  assignedBy?: string;
  assignedTo?: string;
  weekId?: number;
  requirements?: string[];
  rewards?: {
    type: RewardType;
    value: number;
    icon: string;
  }[];
  resources?: Resource[];
}

export interface WeeklyPlan {
  subject: string;
  curriculum: string;
  tasks: Task[];
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  progress: number;
  subjects: {
    name: string;
    progress: number;
  }[];
  completedTasks: number;
  totalTasks: number;
  lastActive: string;
  pendingFeedback: number;
  weeklyPlans?: WeeklyPlan[];
} 