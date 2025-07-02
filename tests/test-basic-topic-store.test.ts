import { describe, it, expect } from 'vitest';
import { useTopicStore } from '@/store/topicStore';

describe('Topic Store - Basic Tests', () => {
  it('應該有正確的初始狀態', () => {
    const store = useTopicStore.getState();
    
    expect(store.topics).toEqual([]);
    expect(store.selectedTopicId).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.syncing).toBe(false);
  });

  it('應該有所有必要的方法', () => {
    const store = useTopicStore.getState();
    
    // 核心 CRUD 方法
    expect(typeof store.fetchTopics).toBe('function');
    expect(typeof store.getTopic).toBe('function');
    expect(typeof store.createTopic).toBe('function');
    expect(typeof store.updateTopic).toBe('function');
    expect(typeof store.deleteTopic).toBe('function');
    
    // Goals 操作
    expect(typeof store.addGoal).toBe('function');
    expect(typeof store.updateGoal).toBe('function');
    expect(typeof store.deleteGoal).toBe('function');
    
    // Tasks 操作
    expect(typeof store.addTask).toBe('function');
    expect(typeof store.updateTask).toBe('function');
    expect(typeof store.deleteTask).toBe('function');
    
    // 兼容性方法
    expect(typeof store.updateTopicCompat).toBe('function');
    expect(typeof store.updateGoalCompat).toBe('function');
    expect(typeof store.updateTaskCompat).toBe('function');
    
    // 協作功能
    expect(typeof store.toggleTopicCollaborative).toBe('function');
  });

  it('應該有版本控制相關的方法', () => {
    const store = useTopicStore.getState();
    
    expect(typeof store.markTaskCompleted).toBe('function');
    expect(typeof store.markTaskInProgress).toBe('function');
    expect(typeof store.markTaskTodo).toBe('function');
  });

  it('應該有快速查詢方法', () => {
    const store = useTopicStore.getState();
    
    expect(typeof store.getActiveTasksForUser).toBe('function');
    expect(typeof store.getTopicWithStructure).toBe('function');
  });
}); 