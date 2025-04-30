export const GOAL_CATEGORIES = {
  LEARNING: 'learning',
  PERSONAL: 'personal',
  PROJECT: 'project',
} as const;

export const GOAL_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  IN_PROGRESS: 'in-progress',
  OVERDUE: 'overdue',
  PAUSED: 'paused'
} as const;

export const GOAL_SOURCES = {
  MENTOR: 'mentor',
  STUDENT: 'student',
} as const;

// 統一兩個組件中的狀態定義
export type GoalStatus = typeof GOAL_STATUSES[keyof typeof GOAL_STATUSES];
export type GoalCategory = typeof GOAL_CATEGORIES[keyof typeof GOAL_CATEGORIES];
export type GoalSource = typeof GOAL_SOURCES[keyof typeof GOAL_SOURCES]; 