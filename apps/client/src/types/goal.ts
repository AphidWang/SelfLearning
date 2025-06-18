import { SubjectType } from '../constants/subjects';
import { TOPIC_STATUSES } from '../constants/topics';

export type TopicStatus = typeof TOPIC_STATUSES[keyof typeof TOPIC_STATUSES];
export type TopicType = '學習目標' | '個人成長' | '專案計畫' | '活動規劃';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'idea' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskRole = 'explore' | 'work' | 'present';

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
}

export interface Goal {
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
  order?: number;
  challenge?: number;
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
export type GoalStatus = TopicStatus;
export type { Topic as Goal_New, Goal as Step_New };