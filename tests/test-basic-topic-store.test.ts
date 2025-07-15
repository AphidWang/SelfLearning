import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { useTopicStore } from '../apps/client/src/store/topicStore';
import { useGoalStore } from '../apps/client/src/store/goalStore';
import { useTaskStore } from '../apps/client/src/store/taskStore';
import { initTestAuth } from '../vitest.setup';

describe('Topic Store - Basic Tests', () => {
  beforeAll(async () => {
    try {
      // 初始化測試認證
      const user = await initTestAuth();
      console.log('🔐 基本測試認證已初始化:', user.email);
    } catch (error) {
      console.error('❌ 基本測試認證初始化失敗:', error);
      throw error;
    }
  });

  beforeEach(() => {

  });

  it('應該有正確的初始狀態', () => {
    const store = useTopicStore.getState();
    
    expect(store.topics).toEqual([]);
    expect(store.selectedTopicId).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.syncing).toBe(false);
  });

  it('應該有所有必要的方法', () => {
    const topic = useTopicStore.getState();
    const goal = useGoalStore.getState();
    const task = useTaskStore.getState();

    // 核心 CRUD 方法
    expect(typeof topic.fetchTopicsWithActions).toBe('function');
    expect(typeof topic.getTopic).toBe('function');
    expect(typeof topic.createTopic).toBe('function');
    expect(typeof topic.updateTopic).toBe('function');
    expect(typeof topic.deleteTopic).toBe('function');

    // Goals 操作
    expect(typeof goal.addGoal).toBe('function');
    expect(typeof goal.updateGoal).toBe('function');
    expect(typeof goal.deleteGoal).toBe('function');

    // Tasks 操作
    expect(typeof task.addTask).toBe('function');
    expect(typeof task.updateTask).toBe('function');
    expect(typeof task.deleteTask).toBe('function');

    // 還原功能
    expect(typeof topic.restoreTopic).toBe('function');
    expect(typeof goal.restoreGoal).toBe('function');
    expect(typeof task.restoreTask).toBe('function');


    // 協作功能
    expect(typeof topic.enableTopicCollaboration).toBe('function');
    expect(typeof topic.disableTopicCollaboration).toBe('function');
  });

  it('應該有版本控制相關的方法', () => {
    const task = useTaskStore.getState();

    expect(typeof task.markTaskCompleted).toBe('function');
    expect(typeof task.markTaskInProgress).toBe('function');
    expect(typeof task.markTaskTodo).toBe('function');
  });

  it('應該有快速查詢方法', () => {
    const topic = useTopicStore.getState();
    const task = useTaskStore.getState();

    expect(typeof task.getActiveTasksForUser).toBe('function');
  });

  it('應該有任務動作相關的方法', () => {
    const task = useTaskStore.getState();

    expect(typeof task.performTaskAction).toBe('function');
    expect(typeof task.checkInTask).toBe('function');
    expect(typeof task.addTaskCount).toBe('function');
    expect(typeof task.addTaskAmount).toBe('function');
    expect(typeof task.resetTaskProgress).toBe('function');
    expect(typeof task.cancelTodayCheckIn).toBe('function');
  });

  it('應該能正確設置和重置狀態', () => {
    const store = useTopicStore.getState();
       
    // 檢查重置結果
    const stateAfterReset = useTopicStore.getState();
    expect(stateAfterReset.selectedTopicId).toBeNull();
    expect(stateAfterReset.loading).toBe(false);
    expect(stateAfterReset.error).toBeNull();
    expect(stateAfterReset.syncing).toBe(false);
    expect(stateAfterReset.topics).toEqual([]);
  });
}); 