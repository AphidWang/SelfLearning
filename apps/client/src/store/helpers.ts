/**
 * Store Helper Functions
 * 
 * 簡單的 helper functions 幫助其他地方從 store 獲取數據
 * 不創建巢狀結構，只是提供便利的訪問方法
 */

import { useTopicStore } from './topicStore';
import { useGoalStore } from './goalStore';
import { useTaskStore } from './taskStore';
import type { Topic, Goal, Task } from '../types/goal';

/**
 * 從 topic 獲取 goals[]（不巢狀）
 */
export function getGoalsForTopic(topicId: string): Goal[] {
  return useGoalStore.getState().getGoalsForTopic(topicId);
}

/**
 * 從 goal 獲取 tasks[]（不巢狀）
 */
export function getTasksForGoal(goalId: string): Task[] {
  return useTaskStore.getState().getTasksForGoal(goalId);
}

/**
 * 獲取 topic 的活躍 goals
 */
export function getActiveGoalsForTopic(topicId: string): Goal[] {
  return getGoalsForTopic(topicId).filter(goal => goal.status !== 'archived');
}

/**
 * 獲取 goal 的活躍 tasks
 */
export function getActiveTasksForGoal(goalId: string): Task[] {
  return getTasksForGoal(goalId).filter(task => task.status !== 'archived');
}

/**
 * 獲取 topic 的所有 tasks（跨 goals，但不巢狀）
 */
export function getAllTasksForTopic(topicId: string): Task[] {
  const goals = getGoalsForTopic(topicId);
  const allTasks: Task[] = [];
  
  goals.forEach(goal => {
    const tasks = getTasksForGoal(goal.id);
    allTasks.push(...tasks);
  });
  
  return allTasks;
}

/**
 * 獲取 topic 進度統計
 */
export function getTopicProgress(topicId: string): {
  totalTasks: number;
  completedTasks: number;
  todoTasks: number;
  completionRate: number;
} {
  const tasks = getAllTasksForTopic(topicId);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  return {
    totalTasks,
    completedTasks,
    todoTasks,
    completionRate
  };
}

/**
 * 獲取單個實體 by ID
 */
export function getTopicById(topicId: string): Topic | undefined {
  return useTopicStore.getState().topics.find(t => t.id === topicId);
}

export function getGoalById(goalId: string): Goal | undefined {
  return useGoalStore.getState().getGoalById(goalId);
}

export function getTaskById(taskId: string): Task | undefined {
  return useTaskStore.getState().getTaskById(taskId);
} 