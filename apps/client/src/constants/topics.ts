export const TOPIC_CATEGORIES = {
  LEARNING: 'learning',
  PERSONAL: 'personal',
  PROJECT: 'project',
} as const;

export const TOPIC_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  IN_PROGRESS: 'in-progress',
  OVERDUE: 'overdue',
  PAUSED: 'paused',
  HIDDEN: 'hidden'
} as const;

export const TOPIC_SOURCES = {
  MENTOR: 'mentor',
  STUDENT: 'student',
} as const;

export type TopicCategory = typeof TOPIC_CATEGORIES[keyof typeof TOPIC_CATEGORIES];
export type TopicStatus = typeof TOPIC_STATUSES[keyof typeof TOPIC_STATUSES];
export type TopicSource = typeof TOPIC_SOURCES[keyof typeof TOPIC_SOURCES]; 