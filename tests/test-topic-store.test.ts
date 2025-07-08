import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { useTopicStore } from '../apps/client/src/store/topicStore';
import { SUBJECTS } from '../apps/client/src/constants/subjects';
import { Topic } from '../apps/client/src/types/goal';
import { initTestAuth, cleanupTestData } from '../vitest.setup';
import { supabase } from '../apps/client/src/services/supabase';

describe('TopicStore', () => {
  let store: ReturnType<typeof useTopicStore.getState>;
  let createdTopics: string[] = [];
  
  beforeAll(async () => {
    // 初始化測試認證
    await initTestAuth();
    console.log('🔐 測試認證已初始化');
  });

  beforeEach(() => {
    store = useTopicStore.getState();
    store.reset();
  });

  afterEach(async () => {
    // 清理測試資料
    for (const id of createdTopics) {
      try {
        await store.deleteTopic(id);
      } catch (error) {
        console.warn(`清理主題 ${id} 失敗:`, error);
      }
    }
    createdTopics = [];
  });
  
  afterAll(async () => {
    // 額外清理，確保沒有遺留的測試數據
    await cleanupTestData();
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
      is_collaborative: false,
      show_avatars: true
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
      const result = await store.updateTopicCompat(topic!.id, { title: updatedTitle });
      expect(result).toBeDefined();
      expect(result?.title).toBe(updatedTitle);
      expect(result?.goals).toEqual([]);
      expect(result?.bubbles).toEqual([]);

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(topic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.title).toBe(updatedTitle);
    });

    it('應該能刪除主題（歸檔）', async () => {
      const topic = await store.createTopic(mockTopic);
      if (topic?.id) createdTopics.push(topic.id);
      expect(topic).toBeDefined();
      
      const result = await store.deleteTopic(topic!.id);
      expect(result).toBe(true);
      
      // 主題應該被歸檔而不是完全刪除
      const archivedTopic = await store.getTopic(topic!.id);
      expect(archivedTopic).toBeNull(); // 因為查詢會過濾掉 archived 狀態的記錄
      
      // 驗證資料庫中主題仍存在但狀態為 archived
      const { data: dbTopic } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topic!.id)
        .single();
      expect(dbTopic).toBeDefined();
      expect(dbTopic.status).toBe('archived');
    });

    it('應該能還原歸檔的主題', async () => {
      const topic = await store.createTopic(mockTopic);
      if (topic?.id) createdTopics.push(topic.id);
      expect(topic).toBeDefined();
      
      // 先歸檔主題
      await store.deleteTopic(topic!.id);
      
      // 然後還原主題
      const restoreResult = await store.restoreTopic(topic!.id);
      expect(restoreResult).toBe(true);
      
      // 驗證主題已還原
      const restoredTopic = await store.getTopic(topic!.id);
      expect(restoredTopic).toBeDefined();
      expect(restoredTopic?.status).toBe('active');
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
        is_collaborative: false,
        show_avatars: true
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
        priority: 'medium' as const,
        order_index: 0,
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
      expect(savedTopic?.goals?.[0].title).toBe(goal.title);
      expect(savedTopic?.goals?.[0].tasks).toEqual([]);
    });

    it('應該能更新目標', async () => {
      const goal = await store.addGoal(testTopic!.id, {
        title: '測試目標',
        description: '這是一個測試目標',
        status: 'todo' as const,
        priority: 'medium' as const,
        order_index: 0,
        tasks: []
      });
      expect(goal).toBeDefined();

      const updatedTitle = '更新後的目標';
      const result = await store.updateGoalCompat(testTopic!.id, goal!.id, { title: updatedTitle });
      expect(result).toBeDefined();
      expect(result?.title).toBe(updatedTitle);
      expect(result?.tasks).toEqual([]);

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals).toHaveLength(1);
      expect(savedTopic?.goals?.[0].title).toBe(updatedTitle);
    });

    it('應該能刪除目標（歸檔）', async () => {
      const goal = await store.addGoal(testTopic!.id, {
        title: '測試目標',
        description: '這是一個測試目標',
        status: 'todo' as const,
        priority: 'medium' as const,
        order_index: 0,
        tasks: []
      });
      expect(goal).toBeDefined();

      const result = await store.deleteGoal(goal!.id);
      expect(result).toBe(true);

      // 驗證目標被歸檔而不是完全刪除
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals).toHaveLength(0); // 查詢會過濾掉 archived 狀態的記錄
      
      // 驗證資料庫中目標仍存在但狀態為 archived
      const { data: dbGoal } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goal!.id)
        .single();
      expect(dbGoal).toBeDefined();
      expect(dbGoal.status).toBe('archived');
    });

    it('應該能還原歸檔的目標', async () => {
      const goal = await store.addGoal(testTopic!.id, {
        title: '測試目標',
        description: '這是一個測試目標',
        status: 'todo' as const,
        priority: 'medium' as const,
        order_index: 0,
        tasks: []
      });
      expect(goal).toBeDefined();

      // 先歸檔目標
      await store.deleteGoal(goal!.id);

      // 然後還原目標
      const restoreResult = await store.restoreGoal(goal!.id);
      expect(restoreResult).toBe(true);

      // 驗證目標已還原
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals).toHaveLength(1);
      expect(savedTopic?.goals?.[0].status).toBe('todo');
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
        is_collaborative: false,
        show_avatars: true
      });
      if (testTopic?.id) createdTopics.push(testTopic.id);
      expect(testTopic).toBeDefined();

      testGoal = await store.addGoal(testTopic!.id, {
        title: '測試目標',
        description: '這是一個測試目標',
        status: 'todo' as const,
        priority: 'medium' as const,
        order_index: 0,
        tasks: []
      });
      expect(testGoal).toBeDefined();
    });

    it('應該能新增任務', async () => {
      const task = {
        title: '測試任務',
        description: '這是一個測試任務',
        status: 'todo' as const,
        priority: 'medium' as const,
        order_index: 0,
        need_help: false,
        dueDate: new Date().toISOString()
      };

      const result = await store.addTask(testGoal!.id, task);
      expect(result).toBeDefined();
      expect(result?.title).toBe(task.title);

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals?.[0].tasks).toHaveLength(1);
      expect(savedTopic?.goals?.[0].tasks?.[0].title).toBe(task.title);
    });

    it('應該能更新任務狀態', async () => {
      const task = await store.addTask(testGoal!.id, {
        title: '測試任務',
        description: '這是一個測試任務',
        status: 'todo' as const,
        priority: 'medium' as const,
        order_index: 0,
        need_help: false,
        dueDate: new Date().toISOString()
      });
      expect(task).toBeDefined();

      const result = await store.updateTaskCompat(testTopic!.id, testGoal!.id, task!.id, { status: 'done' });
      expect(result).toBeDefined();
      expect(result?.status).toBe('done');

      // 驗證資料庫中的資料
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals?.[0].tasks?.[0].status).toBe('done');
    });

    it('應該能刪除任務（歸檔）', async () => {
      const task = await store.addTask(testGoal!.id, {
        title: '測試任務',
        description: '這是一個測試任務',
        status: 'todo' as const,
        priority: 'medium' as const,
        order_index: 0,
        need_help: false,
        dueDate: new Date().toISOString()
      });
      expect(task).toBeDefined();

      const result = await store.deleteTask(task!.id);
      expect(result).toBe(true);

      // 驗證任務被歸檔而不是完全刪除
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals?.[0].tasks).toHaveLength(0); // 查詢會過濾掉 archived 狀態的記錄
      
      // 驗證資料庫中任務仍存在但狀態為 archived
      const { data: dbTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', task!.id)
        .single();
      expect(dbTask).toBeDefined();
      expect(dbTask.status).toBe('archived');
    });

    it('應該能還原歸檔的任務', async () => {
      const task = await store.addTask(testGoal!.id, {
        title: '測試任務',
        description: '這是一個測試任務',
        status: 'todo' as const,
        priority: 'medium' as const,
        order_index: 0,
        need_help: false,
        dueDate: new Date().toISOString()
      });
      expect(task).toBeDefined();

      // 先歸檔任務
      await store.deleteTask(task!.id);

      // 然後還原任務
      const restoreResult = await store.restoreTask(task!.id);
      expect(restoreResult).toBe(true);

      // 驗證任務已還原
      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.goals?.[0].tasks).toHaveLength(1);
      expect(savedTopic?.goals?.[0].tasks?.[0].status).toBe('todo');
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
        is_collaborative: false,
        show_avatars: true
      });
      if (testTopic?.id) createdTopics.push(testTopic.id);
      expect(testTopic).toBeDefined();
    });

    it('應該能啟用協作狀態', async () => {
      const result = await store.enableTopicCollaboration(testTopic!.id);
      expect(result).toBeDefined();

      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.is_collaborative).toBe(true);
    });

    it('應該能停用協作狀態', async () => {
      // 先啟用協作
      await store.enableTopicCollaboration(testTopic!.id);
      
      // 再停用協作
      const result = await store.disableTopicCollaboration(testTopic!.id);
      expect(result).toBeDefined();

      const savedTopic = await store.getTopic(testTopic!.id);
      expect(savedTopic).toBeDefined();
      expect(savedTopic?.is_collaborative).toBe(false);
    });
  });
}); 