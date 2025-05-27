import { SubjectType } from '../constants/subjects';
import { GOAL_STATUSES } from '../constants/goals';

export type GoalStatus = typeof GOAL_STATUSES[keyof typeof GOAL_STATUSES];
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'idea';
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
  focusElement?: { type: 'step' | 'task', id: string };
}

export interface Step {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
  order?: number;
  status?: 'active' | 'archived';
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