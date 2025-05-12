import { SubjectType } from '../constants/subjects';
import { GOAL_STATUSES } from '../constants/goals';

export type GoalStatus = typeof GOAL_STATUSES[keyof typeof GOAL_STATUSES];
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskRole = 'explore' | 'work' | 'present';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  dueDate?: string;
  steps: Step[];
  category?: string;
  templateType?: string;
  subject?: SubjectType;
  progress?: number;
}

export interface Step {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
  order?: number;
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
}

// 用於創建新實例的工廠函數
export const createTask = (partial: Partial<Task>): Task => ({
  id: crypto.randomUUID(),
  title: '',
  status: 'todo',
  ...partial
});

export const createStep = (partial: Partial<Step>): Step => ({
  id: crypto.randomUUID(),
  title: '',
  tasks: [],
  ...partial
});

export const createGoal = (partial: Partial<Goal>): Goal => ({
  id: crypto.randomUUID(),
  title: '',
  status: 'active',
  steps: [],
  ...partial
}); 