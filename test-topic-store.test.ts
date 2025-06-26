import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTopicStore } from '@/store/topicStore';
import { SUBJECTS } from '@/constants/subjects';
import { Topic } from '@/types/goal';

describe('TopicStore', () => {
  let store: ReturnType<typeof useTopicStore.getState>;
  let createdTopics: string[] = [];

  beforeEach(() => {
    store = useTopicStore.getState();
    store.reset();
  });

  afterEach(async () => {
    // 清理測試資料
    for (const id of createdTopics) {
      await store.deleteTopic(id);
    }
    createdTopics = [];
  });

  describe('基本 CRUD 操作', () => {
    const mockTopic = {
      title: '測試主題',
      description: '這是一個測試主題',
      subject: SUBJECTS.MATH,
      type: '學習目標' as const,
      category: 'learning',
      status: 'active' as const,
      goals: [],
      bubbles: [],
      is_collaborative: false
    };

    it('應該能創建新主題', async () => {
      const result = await store.createTopic(mockTopic);
      expect(result).toBeDefined();
      expect(result?.id).toBeDefined();
      expect(result?.title).toBe(mockTopic.title);
      expect(result?.goals).toEqual([]);
      expect(result?.bubbles).toEqual([]);
      if (result?.id) createdTopics.push(result.id);

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(result!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.title).toBe(mockTopic.title);
      expect(savedTopic?.goals).toEqual([]);
      expect(savedTopic?.bubbles).toEqual([]);
    });

    it('應該能更新主題', async () => {
      const topic = await store.createTopic(mockTopic);
      if (topic?.id) createdTopics.push(topic.id);
      expect(topic).toBeDefined();
      
      const updatedTitle = '更新後的主題';
      const result = await store.updateTopic(topic!.id, { title: updatedTitle });
      expect(result).toBeDefined();
      expect(result?.title).toBe(updatedTitle);
      expect(result?.goals).toEqual([]);
      expect(result?.bubbles).toEqual([]);

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(topic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.title).toBe(updatedTitle);
    });

    it('應該能刪除主題', async () => {
      const topic = await store.createTopic(mockTopic);
      if (topic?.id) createdTopics.push(topic.id);
      expect(topic).toBeDefined();
      
      const result = await store.deleteTopic(topic!.id);
      expect(result).toBe(true);
      
      const deletedTopic = await store.getTopic(topic!.id);
      expect(deletedTopic).toBeNull();
    });
  });

  describe('目標管理', () => {
    let testTopic;

    beforeEach(async () => {
      testTopic = await store.createTopic({
        title: '測試主題',
        description: '這是一個測試主題',
        subject: SUBJECTS.MATH,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false
      });
      if (testTopic?.id) createdTopics.push(testTopic.id);
      expect(testTopic).toBeDefined();
      expect(testTopic?.goals).toEqual([]);
    });

    it('應該能新增目標', async () => {
      const goal = {
        title: '測試目標',
        description: '這是一個測試目標',
        status: 'todo' as const,
        tasks: []
      };

      const result = await store.addGoal(testTopic!.id, goal);
      expect(result).toBeDefined();
      expect(result?.title).toBe(goal.title);
      expect(result?.tasks).toEqual([]);

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals).toHaveLength(1);
      expect(savedTopic?.goals[0].title).toBe(goal.title);
      expect(savedTopic?.goals[0].tasks).toEqual([]);
    });

    it('應該能更新目標', async () => {
      const goal = await store.addGoal(testTopic!.id, {
        title: '測試目標',
        description: '這是一個測試目標',
        status: 'todo' as const,
        tasks: []
      });
      expect(goal).toBeDefined();

      const updatedTitle = '更新後的目標';
      const result = await store.updateGoal(testTopic!.id, goal!.id, { title: updatedTitle });
      expect(result).toBeDefined();
      expect(result?.title).toBe(updatedTitle);
      expect(result?.tasks).toEqual([]);

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals).toHaveLength(1);
      expect(savedTopic?.goals[0].title).toBe(updatedTitle);
    });

    it('應該能刪除目標', async () => {
      const goal = await store.addGoal(testTopic!.id, {
        title: '測試目標',
        description: '這是一個測試目標',
        status: 'todo' as const,
        tasks: []
      });
      expect(goal).toBeDefined();

      const result = await store.deleteGoal(testTopic!.id, goal!.id);
      expect(result).toBe(true);

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals).toHaveLength(0);
    });
  });

  describe('任務管理', () => {
    let testTopic;
    let testGoal;

    beforeEach(async () => {
      testTopic = await store.createTopic({
        title: '測試主題',
        description: '這是一個測試主題',
        subject: SUBJECTS.MATH,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false
      });
      if (testTopic?.id) createdTopics.push(testTopic.id);
      expect(testTopic).toBeDefined();

      testGoal = await store.addGoal(testTopic!.id, {
        title: '測試目標',
        description: '這是一個測試目標',
        status: 'todo' as const,
        tasks: []
      });
      expect(testGoal).toBeDefined();
    });

    it('應該能新增任務', async () => {
      const task = {
        title: '測試任務',
        description: '這是一個測試任務',
        status: 'todo' as const,
        dueDate: new Date().toISOString()
      };

      const result = await store.addTask(testTopic!.id, testGoal!.id, task);
      expect(result).toBeDefined();
      expect(result?.title).toBe(task.title);

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals[0].tasks).toHaveLength(1);
      expect(savedTopic?.goals[0].tasks[0].title).toBe(task.title);
    });

    it('應該能更新任務狀態', async () => {
      const task = await store.addTask(testTopic!.id, testGoal!.id, {
        title: '測試任務',
        description: '這是一個測試任務',
        status: 'todo' as const,
        dueDate: new Date().toISOString()
      });
      expect(task).toBeDefined();

      const result = await store.updateTask(testTopic!.id, testGoal!.id, task!.id, { status: 'done' });
      expect(result).toBeDefined();
      expect(result?.status).toBe('done');

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals[0].tasks[0].status).toBe('done');
    });

    it('應該能刪除任務', async () => {
      const task = await store.addTask(testTopic!.id, testGoal!.id, {
        title: '測試任務',
        description: '這是一個測試任務',
        status: 'todo' as const,
        dueDate: new Date().toISOString()
      });
      expect(task).toBeDefined();

      const result = await store.deleteTask(testTopic!.id, testGoal!.id, task!.id);
      expect(result).toBe(true);

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals[0].tasks).toHaveLength(0);
    });
  });

  describe('協作功能', () => {
    let testTopic: Topic | null = null;

    beforeEach(async () => {
      testTopic = await store.createTopic({
        title: '測試主題',
        description: '這是一個測試主題',
        subject: SUBJECTS.MATH,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false
      });
      if (testTopic?.id) createdTopics.push(testTopic.id);
      expect(testTopic).toBeDefined();
    });

    it('應該能切換協作狀態', async () => {
      const result = await store.toggleTopicCollaborative(testTopic!.id);
      expect(result).toBe(true);

      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.is_collaborative).toBe(true);
    });
  });
}); 