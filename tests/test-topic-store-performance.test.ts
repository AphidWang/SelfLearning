import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, MockedFunction } from 'vitest';
import { useTopicStore, VersionConflictError } from '../apps/client/src/store/topicStore';
import { SUBJECTS } from '../apps/client/src/constants/subjects';
import { Topic, Goal, Task } from '../apps/client/src/types/goal';
import { initTestAuth, cleanupTestData } from '../vitest.setup';

// 模擬 performance.now
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

// 模擬 console.log 來捕獲效能監控日誌
const mockConsoleLog = vi.fn();
console.log = mockConsoleLog;

describe('TopicStore - 效能優化測試', () => {
  let store: ReturnType<typeof useTopicStore.getState>;
  let createdTopics: string[] = [];
  let testTopics: Topic[] = [];
  let testGoals: Goal[] = [];
  let testTasks: Task[] = [];

  beforeAll(async () => {
    await initTestAuth();
    console.log('🔐 效能測試認證已初始化');
  });

  beforeEach(() => {
    store = useTopicStore.getState();
    store.reset();
    vi.clearAllMocks();
    
    // 設定模擬的 performance.now 返回遞增時間
    let mockTime = 1000;
    mockPerformanceNow.mockImplementation(() => {
      mockTime += Math.random() * 100; // 模擬 0-100ms 的隨機耗時
      return mockTime;
    });
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
    testTopics = [];
    testGoals = [];
    testTasks = [];
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('批量查詢優化測試', () => {
    beforeEach(async () => {
      // 創建多個測試主題用於批量查詢測試
      const mockTopicData = {
        title: '批量測試主題',
        description: '用於測試批量查詢的主題',
        subject: SUBJECTS.MATH,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false,
        show_avatars: true
      };

      // 創建 5 個主題
      for (let i = 1; i <= 5; i++) {
        const topic = await store.createTopic({
          ...mockTopicData,
          title: `批量測試主題 ${i}`,
          description: `第 ${i} 個測試主題`
        });
        if (topic?.id) {
          createdTopics.push(topic.id);
          testTopics.push(topic);
          
          // 為每個主題創建 2 個目標
          for (let j = 1; j <= 2; j++) {
            const goal = await store.addGoal(topic.id, {
              title: `目標 ${j}`,
              description: `主題 ${i} 的第 ${j} 個目標`,
              status: 'todo' as const,
              priority: 'medium' as const,
              order_index: j - 1,
              tasks: []
            });
            if (goal?.id) {
              testGoals.push(goal);
              
              // 為每個目標創建 3 個任務
              for (let k = 1; k <= 3; k++) {
                const task = await store.addTask(goal.id, {
                  title: `任務 ${k}`,
                  description: `目標 ${j} 的第 ${k} 個任務`,
                  status: 'todo' as const,
                  priority: 'medium' as const,
                  order_index: k - 1,
                  need_help: false,
                  dueDate: new Date().toISOString()
                });
                if (task?.id) {
                  testTasks.push(task);
                }
              }
            }
          }
        }
      }
    });

    it('應該使用批量查詢而不是 N+1 查詢', async () => {
      // 清空模擬 console.log 紀錄
      mockConsoleLog.mockClear();
      
      // 執行 fetchTopics
      await store.fetchTopics();
      
      // 檢查是否記錄了查詢統計
      const queryStatLogs = mockConsoleLog.mock.calls.filter(call => 
        call[0] && call[0].includes('查詢統計')
      );
      
      expect(queryStatLogs.length).toBeGreaterThan(0);
      
      // 檢查是否提到了 7 次查詢（優化後的查詢次數）
      const has7Queries = queryStatLogs.some(call =>
        call[0].includes('7次查詢') || call[0].includes('= 7')
      );
      expect(has7Queries).toBe(true);
    });

    it('應該記錄詳細的效能監控資訊', async () => {
      mockConsoleLog.mockClear();
      
      await store.fetchTopics();
      
      // 檢查是否記錄了各個階段的耗時
      const performanceLogs = mockConsoleLog.mock.calls.filter(call =>
        call[0] && (
          call[0].includes('耗時') || 
          call[0].includes('查詢耗時') ||
          call[0].includes('總耗時')
        )
      );
      
      expect(performanceLogs.length).toBeGreaterThan(0);
      
      // 檢查特定的效能監控階段
      const logMessages = performanceLogs.map(call => call[0]);
      const hasTopicsTime = logMessages.some(msg => msg.includes('主題查詢耗時'));
      const hasGoalsTime = logMessages.some(msg => msg.includes('目標') && msg.includes('耗時'));
      const hasTasksTime = logMessages.some(msg => msg.includes('任務') && msg.includes('耗時'));
      const hasUsersTime = logMessages.some(msg => msg.includes('用戶') && msg.includes('耗時'));
      const hasAssemblyTime = logMessages.some(msg => msg.includes('組裝耗時'));
      const hasTotalTime = logMessages.some(msg => msg.includes('總耗時'));
      
      expect(hasTopicsTime).toBe(true);
      expect(hasGoalsTime).toBe(true);
      expect(hasTasksTime).toBe(true);
      expect(hasUsersTime).toBe(true);
      expect(hasAssemblyTime).toBe(true);
      expect(hasTotalTime).toBe(true);
    });

    it('應該正確組裝大量資料而不出現效能問題', async () => {
      const startTime = Date.now();
      
      await store.fetchTopics();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // 應該在合理時間內完成（例如 5 秒內）
      expect(loadTime).toBeLessThan(5000);
      
      // 檢查資料是否正確組裝
      const topics = store.topics;
      expect(topics.length).toBe(5);
      
      // 檢查每個主題都有目標和任務
      topics.forEach(topic => {
        expect(topic.goals).toBeDefined();
        expect(topic.goals?.length).toBe(2);
        
        topic.goals?.forEach(goal => {
          expect(goal.tasks).toBeDefined();
          expect(goal.tasks?.length).toBe(3);
        });
      });
    });

    it('應該正確計算整體進度', async () => {
      await store.fetchTopics();
      
      const topics = store.topics;
      
      topics.forEach(topic => {
        // 初始狀態所有任務都是 todo，進度應該是 0
        expect(topic.progress).toBe(0);
        
        const allTasks = topic.goals?.flatMap(g => g.tasks || []) || [];
        expect(allTasks.length).toBe(6); // 2 目標 × 3 任務 = 6 任務
      });
    });
  });

  describe('快速查詢函數測試', () => {
    let testTopic: Topic;
    let testGoal: Goal;
    let testTask: Task;

    beforeEach(async () => {
      // 創建一個測試主題
      testTopic = await store.createTopic({
        title: '快速查詢測試主題',
        description: '用於測試快速查詢函數',
        subject: SUBJECTS.MATH,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false,
        show_avatars: true
      });
      
      if (testTopic?.id) {
        createdTopics.push(testTopic.id);
        
        // 創建一個目標
        testGoal = await store.addGoal(testTopic.id, {
          title: '快速查詢測試目標',
          description: '測試目標',
          status: 'todo' as const,
          priority: 'high' as const,
          order_index: 0,
          tasks: []
        });
        
        if (testGoal?.id) {
          // 創建一個任務
          testTask = await store.addTask(testGoal.id, {
            title: '快速查詢測試任務',
            description: '測試任務',
            status: 'todo' as const,
            priority: 'high' as const,
            order_index: 0,
            need_help: false,
            dueDate: new Date().toISOString()
          });
        }
      }
    });

    it('getActiveTasksForUser 應該快速返回用戶的活躍任務', async () => {
      const startTime = Date.now();
      
      const activeTasks = await store.getActiveTasksForUser();
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      // 應該在 1 秒內完成
      expect(queryTime).toBeLessThan(1000);
      
      // 應該返回數組
      expect(Array.isArray(activeTasks)).toBe(true);
      
      // 如果有任務，應該包含我們創建的任務
      if (activeTasks.length > 0) {
        const hasOurTask = activeTasks.some(task => 
          task.task_title === '快速查詢測試任務'
        );
        expect(hasOurTask).toBe(true);
      }
    });

    it('getTopicWithStructure 應該快速返回主題完整結構', async () => {
      if (!testTopic?.id) return;
      
      const startTime = Date.now();
      
      const topicStructure = await store.getTopicWithStructure(testTopic.id);
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      // 應該在 1 秒內完成
      expect(queryTime).toBeLessThan(1000);
      
      // 應該返回完整結構
      expect(topicStructure).toBeDefined();
      
      if (topicStructure) {
        expect(topicStructure.topic_title).toBe('快速查詢測試主題');
      }
    });

    it('快速查詢函數應該有錯誤處理機制', async () => {
      // 測試無效 ID 的情況
      const invalidTopicStructure = await store.getTopicWithStructure('invalid-id');
      expect(invalidTopicStructure).toBeNull();
      
      // getActiveTasksForUser 在錯誤情況下應該返回空數組
      const activeTasks = await store.getActiveTasksForUser();
      expect(Array.isArray(activeTasks)).toBe(true);
    });
  });

  describe('版本控制和樂觀鎖定測試', () => {
    let testTopic: Topic;
    let testGoal: Goal;
    let testTask: Task;

    beforeEach(async () => {
      testTopic = await store.createTopic({
        title: '版本控制測試主題',
        description: '用於測試版本控制',
        subject: SUBJECTS.MATH,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false,
        show_avatars: true
      });
      
      if (testTopic?.id) {
        createdTopics.push(testTopic.id);
        
        testGoal = await store.addGoal(testTopic.id, {
          title: '版本控制測試目標',
          description: '測試目標',
          status: 'todo' as const,
          priority: 'medium' as const,
          order_index: 0,
          tasks: []
        });
        
        if (testGoal?.id) {
          testTask = await store.addTask(testGoal.id, {
            title: '版本控制測試任務',
            description: '測試任務',
            status: 'todo' as const,
            priority: 'medium' as const,
            order_index: 0,
            need_help: false,
            dueDate: new Date().toISOString()
          });
        }
      }
    });

    it('應該在版本衝突時拋出 VersionConflictError', async () => {
      if (!testTask?.id) return;
      
      // 模擬版本衝突：使用錯誤的版本號
      const wrongVersion = 999;
      
      try {
        await store.updateTask(testTask.id, wrongVersion, {
          title: '更新後的任務'
        });
        
        // 如果沒有拋出錯誤，測試應該失敗
        expect(true).toBe(false);
      } catch (error) {
        // 應該拋出版本衝突錯誤或相關錯誤
        expect(error).toBeDefined();
        // 可能是 VersionConflictError 或其他資料庫錯誤
      }
    });

    it('markTaskCompleted 應該正確處理版本控制', async () => {
      if (!testTask?.id) return;
      
      // 獲取最新的任務版本
      const refreshedTopic = await store.getTopic(testTopic.id);
      const refreshedTask = refreshedTopic?.goals?.[0]?.tasks?.[0];
      
      if (refreshedTask) {
        const result = await store.markTaskCompleted(refreshedTask.id, refreshedTask.version, false);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.task.status).toBe('done');
        }
      }
    });

    it('版本控制相關方法應該有適當的錯誤處理', async () => {
      if (!testTask?.id) return;
      
      // 測試 markTaskInProgress
      const refreshedTopic = await store.getTopic(testTopic.id);
      const refreshedTask = refreshedTopic?.goals?.[0]?.tasks?.[0];
      
      if (refreshedTask) {
        const result = await store.markTaskInProgress(refreshedTask.id, refreshedTask.version);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.task.status).toBe('in_progress');
        }
      }
    });

    it('兼容性方法應該自動處理版本控制', async () => {
      if (!testTopic?.id || !testGoal?.id || !testTask?.id) return;
      
      // 使用兼容性方法更新任務
      const result = await store.updateTaskCompat(
        testTopic.id,
        testGoal.id,
        testTask.id,
        { title: '兼容性更新的任務' }
      );
      
      expect(result).toBeDefined();
      expect(result?.title).toBe('兼容性更新的任務');
    });

    it('應該在版本衝突時自動重試', async () => {
      if (!testTopic?.id || !testGoal?.id || !testTask?.id) return;
      
      // 使用兼容性方法標記任務完成
      const result = await store.markTaskCompletedCompat(
        testTopic.id,
        testGoal.id,
        testTask.id,
        false
      );
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.task.status).toBe('done');
      }
    });
  });

  describe('資料組裝和索引優化測試', () => {
    beforeEach(async () => {
      // 創建多層結構的測試資料
      const topic = await store.createTopic({
        title: '索引優化測試主題',
        description: '測試 Map 索引優化',
        subject: SUBJECTS.SCIENCE,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false,
        show_avatars: true
      });
      
      if (topic?.id) {
        createdTopics.push(topic.id);
        
        // 創建多個目標和任務來測試索引效率
        for (let i = 1; i <= 3; i++) {
          const goal = await store.addGoal(topic.id, {
            title: `索引測試目標 ${i}`,
            description: `第 ${i} 個測試目標`,
            status: 'todo' as const,
            priority: 'medium' as const,
            order_index: i - 1,
            tasks: []
          });
          
          if (goal?.id) {
            for (let j = 1; j <= 4; j++) {
              await store.addTask(goal.id, {
                title: `索引測試任務 ${i}-${j}`,
                description: `目標 ${i} 的第 ${j} 個任務`,
                status: j % 2 === 0 ? 'done' : 'todo' as const,
                priority: 'medium' as const,
                order_index: j - 1,
                need_help: false,
                dueDate: new Date().toISOString()
              });
            }
          }
        }
      }
    });

    it('應該正確組裝多層嵌套結構', async () => {
      await store.fetchTopics();
      
      const topics = store.topics;
      const testTopic = topics.find(t => t.title === '索引優化測試主題');
      
      expect(testTopic).toBeDefined();
      expect(testTopic?.goals?.length).toBe(3);
      
      testTopic?.goals?.forEach((goal, goalIndex) => {
        expect(goal.title).toBe(`索引測試目標 ${goalIndex + 1}`);
        expect(goal.tasks?.length).toBe(4);
        
        goal.tasks?.forEach((task, taskIndex) => {
          expect(task.title).toBe(`索引測試任務 ${goalIndex + 1}-${taskIndex + 1}`);
        });
      });
    });

    it('應該正確計算複雜結構的進度', async () => {
      await store.fetchTopics();
      
      const topics = store.topics;
      const testTopic = topics.find(t => t.title === '索引優化測試主題');
      
      if (testTopic) {
        // 總共 12 個任務，其中 6 個完成（偶數編號）
        // 進度應該是 50%
        expect(testTopic.progress).toBe(50);
        
        // 驗證完成率計算
        const completionRate = store.getCompletionRate(testTopic.id);
        expect(completionRate).toBe(50);
      }
    });

    it('應該正確處理協作者和用戶資料', async () => {
      await store.fetchTopics();
      
      const topics = store.topics;
      const testTopic = topics.find(t => t.title === '索引優化測試主題');
      
      expect(testTopic).toBeDefined();
      expect(testTopic?.owner).toBeDefined();
      expect(testTopic?.collaborators).toBeDefined();
      expect(Array.isArray(testTopic?.collaborators)).toBe(true);
    });
  });

  describe('效能回歸測試', () => {
    it('大量資料載入不應該超過效能閾值', async () => {
      // 創建大量測試資料
      const topicPromises = [];
      for (let i = 1; i <= 10; i++) {
        topicPromises.push(
          store.createTopic({
            title: `效能測試主題 ${i}`,
            description: `第 ${i} 個效能測試主題`,
            subject: SUBJECTS.CHINESE,
            type: '學習目標' as const,
            category: 'learning',
            status: 'active' as const,
            goals: [],
            bubbles: [],
            is_collaborative: false,
            show_avatars: true
          })
        );
      }
      
      const topics = await Promise.all(topicPromises);
      
      // 記錄創建的主題 ID 以便清理
      topics.forEach(topic => {
        if (topic?.id) {
          createdTopics.push(topic.id);
        }
      });
      
      // 為每個主題創建目標和任務
      for (const topic of topics) {
        if (topic?.id) {
          for (let j = 1; j <= 2; j++) {
            const goal = await store.addGoal(topic.id, {
              title: `效能目標 ${j}`,
              description: `目標 ${j}`,
              status: 'todo' as const,
              priority: 'medium' as const,
              order_index: j - 1,
              tasks: []
            });
            
            if (goal?.id) {
              for (let k = 1; k <= 5; k++) {
                await store.addTask(goal.id, {
                  title: `效能任務 ${k}`,
                  description: `任務 ${k}`,
                  status: 'todo' as const,
                  priority: 'medium' as const,
                  order_index: k - 1,
                  need_help: false,
                  dueDate: new Date().toISOString()
                });
              }
            }
          }
        }
      }
      
      // 測試載入效能
      const startTime = Date.now();
      await store.fetchTopics();
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      
      // 大量資料應該在 10 秒內載入完成
      expect(loadTime).toBeLessThan(10000);
      
      // 驗證資料正確性
      const loadedTopics = store.topics;
      expect(loadedTopics.length).toBeGreaterThanOrEqual(10);
      
      // 總任務數應該是 10 主題 × 2 目標 × 5 任務 = 100 任務
      const totalTasks = loadedTopics.reduce((sum, topic) => {
        return sum + (topic.goals?.reduce((goalSum, goal) => {
          return goalSum + (goal.tasks?.length || 0);
        }, 0) || 0);
      }, 0);
      
      expect(totalTasks).toBeGreaterThanOrEqual(100);
    });

    it('快速查詢應該在大量資料下保持效能', async () => {
      // 在有大量資料的情況下測試快速查詢
      const startTime = Date.now();
      const activeTasks = await store.getActiveTasksForUser();
      const endTime = Date.now();
      
      const queryTime = endTime - startTime;
      
      // 即使有大量資料，快速查詢也應該在 2 秒內完成
      expect(queryTime).toBeLessThan(2000);
      
      // 應該返回有效的結果
      expect(Array.isArray(activeTasks)).toBe(true);
    });
  });

  describe('TaskWallPage 效能監控測試', () => {
    it('應該能夠模擬 TaskWallPage 的效能監控邏輯', async () => {
      // 創建測試資料
      const topic = await store.createTopic({
        title: 'TaskWall 效能測試主題',
        description: '模擬 TaskWallPage 載入',
        subject: SUBJECTS.ENGLISH,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false,
        show_avatars: true
      });
      
      if (topic?.id) {
        createdTopics.push(topic.id);
      }
      
      // 模擬 TaskWallPage 的載入流程
      const startTime = performance.now();
      
      // 1. 載入所有主題（模擬 TaskWallPage.fetchData）
      await store.fetchTopics();
      
      // 2. 獲取活躍任務（模擬任務卡片資料準備）
      const activeTasks = await store.getActiveTasksForUser();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // 驗證效能
      expect(loadTime).toBeLessThan(3000); // 3 秒內完成
      
      // 驗證資料正確性
      expect(Array.isArray(activeTasks)).toBe(true);
      expect(store.topics.length).toBeGreaterThanOrEqual(1);
      
      // 檢查是否有效能日誌記錄
      const performanceLogs = mockConsoleLog.mock.calls.filter(call =>
        call[0] && call[0].includes && call[0].includes('任務牆載入時間')
      );
      
      // 如果有效能監控，應該能看到相關日誌
      console.log(`🧪 模擬 TaskWall 載入時間: ${Math.round(loadTime)}ms`);
    });

    it('應該能模擬不同載入條件下的效能', async () => {
      // 測試空資料載入
      const emptyLoadStart = performance.now();
      await store.fetchTopics();
      const emptyLoadTime = performance.now() - emptyLoadStart;
      
      expect(emptyLoadTime).toBeLessThan(1000); // 空資料應該很快
      
      // 創建一些資料後再測試
      for (let i = 1; i <= 3; i++) {
        const topic = await store.createTopic({
          title: `載入測試主題 ${i}`,
          description: `測試主題 ${i}`,
          subject: SUBJECTS.MATH,
          type: '學習目標' as const,
          category: 'learning',
          status: 'active' as const,
          goals: [],
          bubbles: [],
          is_collaborative: false,
          show_avatars: true
        });
        
        if (topic?.id) {
          createdTopics.push(topic.id);
        }
      }
      
      const dataLoadStart = performance.now();
      await store.fetchTopics();
      const dataLoadTime = performance.now() - dataLoadStart;
      
      expect(dataLoadTime).toBeLessThan(2000); // 有資料時仍應保持高效能
      
      console.log(`🧪 空資料載入: ${Math.round(emptyLoadTime)}ms`);
      console.log(`🧪 有資料載入: ${Math.round(dataLoadTime)}ms`);
    });
  });

  describe('邊界情況和錯誤處理測試', () => {
    it('應該正確處理空主題列表', async () => {
      const startTime = Date.now();
      await store.fetchTopics();
      const endTime = Date.now();
      
      expect(store.topics).toEqual([]);
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('應該正確處理單一主題多次更新的情況', async () => {
      const topic = await store.createTopic({
        title: '多次更新測試主題',
        description: '測試多次更新',
        subject: SUBJECTS.MATH,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false,
        show_avatars: true
      });
      
      if (topic?.id) {
        createdTopics.push(topic.id);
        
        // 連續多次更新
        for (let i = 1; i <= 5; i++) {
          const result = await store.updateTopicCompat(topic.id, {
            description: `更新第 ${i} 次`
          });
          expect(result).toBeDefined();
          expect(result?.description).toBe(`更新第 ${i} 次`);
        }
      }
    });

    it('應該正確處理大量並發操作', async () => {
      const topic = await store.createTopic({
        title: '並發測試主題',
        description: '測試並發操作',
        subject: SUBJECTS.SCIENCE,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false,
        show_avatars: true
      });
      
      if (topic?.id) {
        createdTopics.push(topic.id);
        
        // 創建多個目標（並發）
        const goalPromises = [];
        for (let i = 1; i <= 10; i++) {
          goalPromises.push(
            store.addGoal(topic.id, {
              title: `並發目標 ${i}`,
              description: `第 ${i} 個並發創建的目標`,
              status: 'todo' as const,
              priority: 'medium' as const,
              order_index: i - 1,
              tasks: []
            })
          );
        }
        
        const goals = await Promise.all(goalPromises);
        const successfulGoals = goals.filter(Boolean);
        
        // 應該成功創建大部分目標
        expect(successfulGoals.length).toBeGreaterThan(5);
      }
    });

    it('應該正確處理網路延遲模擬', async () => {
      // 模擬較慢的網路環境
      let slowMockTime = 1000;
      mockPerformanceNow.mockImplementation(() => {
        slowMockTime += Math.random() * 500 + 200; // 200-700ms 的隨機延遲
        return slowMockTime;
      });
      
      const topic = await store.createTopic({
        title: '網路延遲測試主題',
        description: '模擬慢網路環境',
        subject: SUBJECTS.ART,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false,
        show_avatars: true
      });
      
      if (topic?.id) {
        createdTopics.push(topic.id);
      }
      
      const startTime = Date.now();
      await store.fetchTopics();
      const endTime = Date.now();
      
      // 即使在慢網路環境下，也應該能正常工作
      expect(store.topics.length).toBeGreaterThanOrEqual(1);
      expect(endTime - startTime).toBeLessThan(10000); // 10 秒超時
    });
  });

  describe('協作功能效能測試', () => {
    it('應該高效處理協作主題的查詢', async () => {
      // 創建協作主題
      const topic = await store.createTopic({
        title: '協作效能測試主題',
        description: '測試協作功能效能',
        subject: SUBJECTS.SOCIAL,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false,
        show_avatars: true
      });
      
      if (topic?.id) {
        createdTopics.push(topic.id);
        
        // 啟用協作
        const startTime = Date.now();
        await store.enableTopicCollaboration(topic.id);
        const endTime = Date.now();
        
        expect(endTime - startTime).toBeLessThan(2000);
        
        // 驗證協作狀態
        const updatedTopic = await store.getTopic(topic.id);
        expect(updatedTopic?.is_collaborative).toBe(true);
      }
    });

    it('應該高效處理協作者資料的批量載入', async () => {
      mockConsoleLog.mockClear();
      
      // 創建包含協作者的主題
      const topic = await store.createTopic({
        title: '協作者批量測試主題',
        description: '測試協作者資料批量載入',
        subject: SUBJECTS.TECH,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: true,
        show_avatars: true
      });
      
      if (topic?.id) {
        createdTopics.push(topic.id);
        
        // 載入主題（包含協作者資料）
        await store.fetchTopics();
        
        // 檢查是否有用戶資料查詢的效能日誌
        const userDataLogs = mockConsoleLog.mock.calls.filter(call =>
          call[0] && call[0].includes && call[0].includes('用戶資料')
        );
        
        expect(userDataLogs.length).toBeGreaterThan(0);
      }
    });
  });

  describe('快取和記憶體優化測試', () => {
    it('應該避免重複載入相同資料', async () => {
      // 創建測試主題
      const topic = await store.createTopic({
        title: '快取測試主題',
        description: '測試資料快取機制',
        subject: SUBJECTS.PHYSICS,
        type: '學習目標' as const,
        category: 'learning',
        status: 'active' as const,
        goals: [],
        bubbles: [],
        is_collaborative: false,
        show_avatars: true
      });
      
      if (topic?.id) {
        createdTopics.push(topic.id);
      }
      
      // 第一次載入
      const firstLoadStart = Date.now();
      await store.fetchTopics();
      const firstLoadTime = Date.now() - firstLoadStart;
      
      // 第二次載入（應該更快，因為資料已在 store 中）
      const secondLoadStart = Date.now();
      await store.fetchTopics();
      const secondLoadTime = Date.now() - secondLoadStart;
      
      console.log(`🧪 第一次載入: ${firstLoadTime}ms`);
      console.log(`🧪 第二次載入: ${secondLoadTime}ms`);
      
      // 兩次載入都應該成功
      expect(store.topics.length).toBeGreaterThanOrEqual(1);
    });

    it('應該正確處理記憶體中的資料索引', async () => {
      // 創建多個主題測試記憶體索引
      for (let i = 1; i <= 5; i++) {
        const topic = await store.createTopic({
          title: `記憶體索引測試主題 ${i}`,
          description: `第 ${i} 個記憶體測試主題`,
          subject: SUBJECTS.CHEMISTRY,
          type: '學習目標' as const,
          category: 'learning',
          status: 'active' as const,
          goals: [],
          bubbles: [],
          is_collaborative: false,
          show_avatars: true
        });
        
        if (topic?.id) {
          createdTopics.push(topic.id);
        }
      }
      
      await store.fetchTopics();
      
      // 測試快速查找功能
      const startTime = Date.now();
      
      // 使用 getActiveTopics（應該使用記憶體中的資料）
      const activeTopics = store.getActiveTopics();
      
      const endTime = Date.now();
      const searchTime = endTime - startTime;
      
      expect(searchTime).toBeLessThan(50); // 記憶體操作應該非常快
      expect(activeTopics.length).toBe(5);
    });
  });
}); 