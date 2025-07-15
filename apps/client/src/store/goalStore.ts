import { useTopicStore } from './topicStore.full';
import type { Goal, ReferenceInfo, ReferenceAttachment, ReferenceLink } from '../types/goal';
import type { MarkTaskResult } from './topicStore.full';

/**
 * Goal specific store exposing only goal related methods.
 */
interface GoalStore {
  addGoal: (topicId: string, goal: Omit<Goal, 'id' | 'topic_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Goal | null>;
  updateGoal: (goalId: string, expectedVersion: number, updates: Partial<Goal>) => Promise<Goal | null>;
  deleteGoal: (goalId: string) => Promise<boolean>;
  restoreGoal: (goalId: string) => Promise<boolean>;

  updateGoalReferenceInfo: (goalId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addGoalAttachment: (goalId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeGoalAttachment: (goalId: string, attachmentId: string) => Promise<boolean>;
  addGoalLink: (goalId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeGoalLink: (goalId: string, linkId: string) => Promise<boolean>;

  updateGoalCompat: (topicId: string, goalId: string, updates: Partial<Goal>) => Promise<Goal | null>;
  updateGoalHelp: (topicId: string, goalId: string, needHelp: boolean, helpMessage?: string) => Promise<boolean>;
  setGoalOwner: (topicId: string, goalId: string, userId: string) => Promise<Goal | null>;
  addGoalCollaborator: (topicId: string, goalId: string, userId: string) => Promise<boolean>;
  removeGoalCollaborator: (topicId: string, goalId: string, userId: string) => Promise<boolean>;
}

export const useGoalStore = useTopicStore as unknown as typeof useTopicStore & { getState: () => GoalStore };
