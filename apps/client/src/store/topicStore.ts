import { useTopicStore as fullUseTopicStore, VersionConflictError, type MarkTaskResult, type TaskActionResult } from './topicStore.full';
import type { Topic, Goal, Task, Bubble, GoalStatus, TaskStatus, TaskPriority, CreateTopicFromTemplateParams, TopicWithStructure, ActiveTaskResult, ReferenceInfo, ReferenceAttachment, ReferenceLink } from '../types/goal';
import type { TopicCollaborator, User } from '@self-learning/types';

/**
 * Topic-only store interface after refactor.
 * Contains only Topic related methods.
 */
interface TopicStore {
  topics: Topic[];
  selectedTopicId: string | null;
  loading: boolean;
  error: string | null;
  syncing: boolean;

  // Topic CRUD
  fetchTopics: () => Promise<void>;
  fetchTopicsWithActions: () => Promise<void>;
  getTopic: (id: string) => Promise<Topic | null>;
  createTopic: (topic: Omit<Topic, 'id' | 'owner_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Topic | null>;
  updateTopic: (id: string, expectedVersion: number, updates: Partial<Topic>) => Promise<Topic | null>;
  deleteTopic: (id: string) => Promise<boolean>;
  restoreTopic: (id: string) => Promise<boolean>;

  // Topic reference info
  updateTopicReferenceInfo: (topicId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addTopicAttachment: (topicId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeTopicAttachment: (topicId: string, attachmentId: string) => Promise<boolean>;
  addTopicLink: (topicId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeTopicLink: (topicId: string, linkId: string) => Promise<boolean>;

  // Quick queries
  getTopicWithStructure: (topicId: string) => Promise<TopicWithStructure | null>;

  // Compatibility API
  addTopic: (topic: Omit<Topic, 'id' | 'owner_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Topic | null>;
  fetchMyTopics: () => Promise<void>;
  fetchCollaborativeTopics: () => Promise<void>;
  createTopicFromTemplate: (params: CreateTopicFromTemplateParams) => Promise<Topic | null>;
  updateTopicCompat: (topicId: string, updates: Partial<Topic>) => Promise<Topic | null>;

  // Utility
  getActiveGoals: (topicId: string) => Goal[];
  getFocusedGoals: (topicId: string) => Goal[];
  getActiveTopics: () => Topic[];

  // Collaboration helpers
  enableTopicCollaboration: (topicId: string) => Promise<Topic | null>;
  disableTopicCollaboration: (topicId: string) => Promise<Topic | null>;
  inviteTopicCollaborator: (topicId: string, userId: string, permission?: 'view' | 'edit') => Promise<boolean>;
  removeTopicCollaborator: (topicId: string, userId: string) => Promise<boolean>;

  // Calculation helpers
  getCompletionRate: (topicId: string) => number;
  calculateProgress: (topic: Topic) => number;

  // State management
  setSelectedTopicId: (id: string | null) => void;
  clearError: () => void;
  setSyncing: (syncing: boolean) => void;
  reset: () => void;
  refreshTopic: (id: string) => Promise<void>;
}

export const useTopicStore = fullUseTopicStore as unknown as typeof fullUseTopicStore & { getState: () => TopicStore };

export { VersionConflictError, type MarkTaskResult, type TaskActionResult };
