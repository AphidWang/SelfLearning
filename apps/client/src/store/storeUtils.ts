/**
 * Store Utilities
 * 
 * 共用的 store 工具函數，處理用戶資料附加等功能
 */

import type { Topic, Goal, Task } from '../types/goal';
import type { User } from '@self-learning/types';

/**
 * 為實體附加用戶資料（owner, collaborators）
 * 支援 Topic, Goal, Task
 */
function attachUserProfileToEntity(users: User[], entity: any): any {
  if (!entity) return entity;

  // 處理 owner
  if (entity.owner_id) {
    entity.owner = users.find(u => u.id === entity.owner_id) || {
      id: entity.owner_id,
      name: `User-${entity.owner_id?.slice?.(0, 8) || ''}`,
      email: '',
      avatar: undefined,
      role: 'student',
      roles: ['student']
    };
  }

  // 處理 creator
  if (entity.creator_id && !entity.creator) {
    entity.creator = users.find(u => u.id === entity.creator_id) || {
      id: entity.creator_id,
      name: `User-${entity.creator_id?.slice?.(0, 8) || ''}`,
      email: '',
      avatar: undefined,
      role: 'student',
      roles: ['student']
    };
  }

  // 處理 collaborators（Topic 的 topic_collaborators）
  if (Array.isArray(entity.topic_collaborators)) {
    entity.collaborators = entity.topic_collaborators.map((collab: any) => {
      const id = typeof collab === 'string' ? collab : collab.user_id;
      const permission = collab.permission;
      const invited_at = collab.invited_at;
      const user = users.find(u => u.id === id) || {
        id,
        name: `User-${id?.slice?.(0, 8) || ''}`,
        email: '',
        avatar: undefined,
        role: 'student',
        roles: ['student']
      };
      return { ...user, permission, invited_at };
    });
  }

  // 處理 collaborator_ids（Goal, Task 的協作者 ID 列表）
  if (Array.isArray(entity.collaborator_ids)) {
    entity.collaborators = entity.collaborator_ids.map((id: string) => {
      return users.find(u => u.id === id) || {
        id,
        name: `User-${id?.slice?.(0, 8) || ''}`,
        email: '',
        avatar: undefined,
        role: 'student',
        roles: ['student']
      };
    });
  }

  return entity;
}

/**
 * 為 Topic 附加用戶資料
 */
export function attachUserProfilesToTopic(users: User[], topic: Topic): Topic {
  return attachUserProfileToEntity(users, topic);
}

/**
 * 為 Goal 附加用戶資料
 */
export function attachUserProfilesToGoal(users: User[], goal: Goal): Goal {
  return attachUserProfileToEntity(users, goal);
}

/**
 * 為 Task 附加用戶資料
 */
export function attachUserProfilesToTask(users: User[], task: Task): Task {
  return attachUserProfileToEntity(users, task);
}

/**
 * 批量處理 Topics
 */
export function attachUserProfilesToTopics(users: User[], topics: Topic[]): Topic[] {
  return topics.map(topic => attachUserProfilesToTopic(users, topic));
}

/**
 * 批量處理 Goals
 */
export function attachUserProfilesToGoals(users: User[], goals: Goal[]): Goal[] {
  return goals.map(goal => attachUserProfilesToGoal(users, goal));
}

/**
 * 批量處理 Tasks
 */
export function attachUserProfilesToTasks(users: User[], tasks: Task[]): Task[] {
  return tasks.map(task => attachUserProfilesToTask(users, task));
}

