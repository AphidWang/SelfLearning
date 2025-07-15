import { useTopicStore } from './topicStore.full';
import type { Task, ReferenceInfo, ReferenceAttachment, ReferenceLink, TaskAction, TaskRecord, TaskProgressData, TaskConfig, CycleConfig, TaskType } from '../types/goal';
import type { MarkTaskResult, TaskActionResult } from './topicStore.full';

/**
 * Task specific store exposing only task related methods.
 */
interface TaskStore {
  addTask: (goalId: string, task: Omit<Task, 'id' | 'goal_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  updateTask: (taskId: string, expectedVersion: number, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  restoreTask: (taskId: string) => Promise<boolean>;

  updateTaskReferenceInfo: (taskId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addTaskAttachment: (taskId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeTaskAttachment: (taskId: string, attachmentId: string) => Promise<boolean>;
  addTaskLink: (taskId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeTaskLink: (taskId: string, linkId: string) => Promise<boolean>;

  markTaskCompleted: (taskId: string, expectedVersion: number, requireRecord?: boolean) => Promise<MarkTaskResult>;
  markTaskInProgress: (taskId: string, expectedVersion: number) => Promise<MarkTaskResult>;
  markTaskTodo: (taskId: string, expectedVersion: number) => Promise<MarkTaskResult>;

  performTaskAction: (taskId: string, actionType: 'check_in' | 'add_count' | 'add_amount' | 'reset', params?: any) => Promise<TaskActionResult>;
  checkInTask: (taskId: string) => Promise<TaskActionResult>;
  addTaskCount: (taskId: string, count: number) => Promise<TaskActionResult>;
  addTaskAmount: (taskId: string, amount: number, unit?: string) => Promise<TaskActionResult>;
  resetTaskProgress: (taskId: string) => Promise<TaskActionResult>;
  cancelTodayCheckIn: (taskId: string) => Promise<TaskActionResult>;

  getActiveTasksForUser: () => Promise<any[]>;
  getTaskCheckInRecords: (taskIds: string[], date: string) => Promise<Array<{ task_id: string; action_date: string; action_timestamp: string }>>;
  getTodayTaskActivities: () => Promise<any>;
  getTaskActivitiesForDate: (date: string) => Promise<any>;
  getTaskTodayActions: (taskId: string) => Promise<Array<{ action_type: string; action_timestamp: string; action_data: any }>>;
  hasTaskActivityToday: (taskId: string) => Promise<boolean>;
  getDailyActivityStats: (startDate: string, endDate: string) => Promise<any[]>;
  getTasksWithFullData: (filters?: { task_ids?: string[]; goal_ids?: string[]; topic_ids?: string[]; date_range?: { start: string; end: string }; include_actions?: boolean; include_records?: boolean; }) => Promise<Array<Task & { actions?: TaskAction[]; records?: TaskRecord[] }>>;
  getUserTaskActivitiesForDate: (date: string) => Promise<any>;
  updateTaskCompat: (topicId: string, goalId: string, taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  markTaskCompletedCompat: (topicId: string, goalId: string, taskId: string, requireRecord?: boolean) => Promise<MarkTaskResult>;
  markTaskInProgressCompat: (topicId: string, goalId: string, taskId: string) => Promise<MarkTaskResult>;
  markTaskTodoCompat: (topicId: string, goalId: string, taskId: string) => Promise<MarkTaskResult>;
  updateTaskInfo: (topicId: string, goalId: string, taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  updateTaskHelp: (topicId: string, goalId: string, taskId: string, needHelp: boolean, helpMessage?: string) => Promise<boolean>;
  setTaskOwner: (topicId: string, goalId: string, taskId: string, userId: string) => Promise<Task | null>;
  addTaskCollaborator: (topicId: string, goalId: string, taskId: string, userId: string) => Promise<boolean>;
  removeTaskCollaborator: (topicId: string, goalId: string, taskId: string, userId: string) => Promise<boolean>;
  reorderTasks: (topicId: string, goalId: string, taskIds: string[]) => Promise<boolean>;
}

export const useTaskStore = useTopicStore as unknown as typeof useTopicStore & { getState: () => TaskStore };
