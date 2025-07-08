import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTopicTemplateStore } from '@/store/topicTemplateStore';
import { SUBJECTS } from '@/constants/subjects';

describe('TopicTemplateStore', () => {
  let store: ReturnType<typeof useTopicTemplateStore.getState>;
  let createdTemplates: string[] = [];

  beforeEach(() => {
    store = useTopicTemplateStore.getState();
    store.reset();
  });

  afterEach(async () => {
    // 清理測試資料
    for (const id of createdTemplates) {
      await store.deleteTemplate(id);
    }
    createdTemplates = [];
  });

  describe('基本 CRUD 操作', () => {
    const mockTemplate = {
      title: '測試模板',
      description: '這是一個測試模板',
      subject: SUBJECTS.MATH,
      template_type: '學習目標' as const,
      category: 'learning',
      is_public: false,
      is_collaborative: false,
      goals: [],
      bubbles: []
    };

    it('應該能創建新模板', async () => {
      const result = await store.createTemplate(mockTemplate);
      expect(result).toBeDefined();
      expect(result?.id).toBeDefined();
      expect(result?.title).toBe(mockTemplate.title);
      expect(result?.goals).toEqual([]);
      expect(result?.bubbles).toEqual([]);
      if (result?.id) createdTemplates.push(result.id);

      // 驗證資料庫中的資料
      const savedTemplate = await store.getTemplate(result!.id);
      expect(savedTemplate).toBeDefined();
      expect(savedTemplate?.title).toBe(mockTemplate.title);
      expect(savedTemplate?.goals).toEqual([]);
      expect(savedTemplate?.bubbles).toEqual([]);
    });

    it('應該能更新模板', async () => {
      const template = await store.createTemplate(mockTemplate);
      if (template?.id) createdTemplates.push(template.id);
      expect(template).toBeDefined();
      
      const updatedTitle = '更新後的模板';
      const result = await store.updateTemplate(template!.id, { title: updatedTitle });
      expect(result).toBeDefined();
      expect(result?.title).toBe(updatedTitle);
      expect(result?.goals).toEqual([]);
      expect(result?.bubbles).toEqual([]);

      // 驗證資料庫中的資料
      const savedTemplate = await store.getTemplate(template!.id);
      expect(savedTemplate).toBeDefined();
      expect(savedTemplate?.title).toBe(updatedTitle);
    });

    it('應該能刪除模板', async () => {
      const template = await store.createTemplate(mockTemplate);
      if (template?.id) createdTemplates.push(template.id);
      expect(template).toBeDefined();
      
      const result = await store.deleteTemplate(template!.id);
      expect(result).toBe(true);
      
      const deletedTemplate = await store.getTemplate(template!.id);
      expect(deletedTemplate).toBeNull();
    });

    it('應該能歸檔模板', async () => {
      const template = await store.createTemplate(mockTemplate);
      if (template?.id) createdTemplates.push(template.id);
      expect(template).toBeDefined();
      expect(template?.status).toBe('active');
      
      const result = await store.archiveTemplate(template!.id);
      expect(result).toBe(true);
      
      // 歸檔後，應該無法通過一般查詢取得（因為會過濾 archived 狀態）
      const archivedTemplate = await store.getTemplate(template!.id);
      expect(archivedTemplate).toBeNull();
    });

    it('載入模板時應該過濾掉已歸檔的模板', async () => {
      // 創建一個模板
      const template = await store.createTemplate({
        ...mockTemplate,
        title: '測試歸檔過濾'
      });
      
      if (template?.id) createdTemplates.push(template.id);
      expect(template).toBeDefined();
      expect(template?.status).toBe('active');
      
      // 確認模板可以被查詢到
      const activeTemplate = await store.getTemplate(template!.id);
      expect(activeTemplate).toBeDefined();
      expect(activeTemplate?.status).toBe('active');
      
      // 歸檔模板
      const archiveResult = await store.archiveTemplate(template!.id);
      expect(archiveResult).toBe(true);
      
      // 歸檔後應該無法通過 getTemplate 查詢到（因為會過濾 archived 狀態）
      const archivedTemplate = await store.getTemplate(template!.id);
      expect(archivedTemplate).toBeNull();
    });
  });

  describe('目標管理', () => {
    let testTemplate;

    beforeEach(async () => {
      testTemplate = await store.createTemplate({
        title: '測試模板',
        description: '這是一個測試模板',
        subject: SUBJECTS.MATH,
        template_type: '學習目標' as const,
        category: 'learning',
        is_public: false,
        is_collaborative: false,
        goals: [],
        bubbles: []
      });
      if (testTemplate?.id) createdTemplates.push(testTemplate.id);
      expect(testTemplate).toBeDefined();
      expect(testTemplate?.goals).toEqual([]);
    });

    it('應該能新增目標', async () => {
      const goal = {
        title: '測試目標',
        description: '這是一個測試目標',
        status: 'todo' as const,
        tasks: []
      };

      const result = await store.addGoal(testTemplate!.id, goal);
      expect(result).toBeDefined();
      expect(result?.title).toBe(goal.title);
      expect(result?.tasks).toEqual([]);

      // 驗證資料庫中的資料
      const savedTemplate = await store.getTemplate(testTemplate!.id);
      expect(savedTemplate).toBeDefined();
      expect(savedTemplate?.goals).toHaveLength(1);
      expect(savedTemplate?.goals[0].title).toBe(goal.title);
      expect(savedTemplate?.goals[0].tasks).toEqual([]);
    });

    it('應該能更新目標', async () => {
      const goal = await store.addGoal(testTemplate!.id, {
        title: '測試目標',
        description: '這是一個測試目標',
        status: 'todo' as const,
        tasks: []
      });
      expect(goal).toBeDefined();

      const updatedTitle = '更新後的目標';
      const result = await store.updateGoal(testTemplate!.id, goal!.id, { title: updatedTitle });
      expect(result).toBeDefined();
      expect(result?.title).toBe(updatedTitle);
      expect(result?.tasks).toEqual([]);

      // 驗證資料庫中的資料
      const savedTemplate = await store.getTemplate(testTemplate!.id);
      expect(savedTemplate).toBeDefined();
      expect(savedTemplate?.goals).toHaveLength(1);
      expect(savedTemplate?.goals[0].title).toBe(updatedTitle);
    });

    it('應該能刪除目標', async () => {
      const goal = await store.addGoal(testTemplate!.id, {
        title: '測試目標',
        description: '這是一個測試目標',
        status: 'todo' as const,
        tasks: []
      });
      expect(goal).toBeDefined();

      const result = await store.deleteGoal(testTemplate!.id, goal!.id);
      expect(result).toBe(true);

      // 驗證資料庫中的資料
      const savedTemplate = await store.getTemplate(testTemplate!.id);
      expect(savedTemplate).toBeDefined();
      expect(savedTemplate?.goals).toHaveLength(0);
    });
  });

  describe('公開設定', () => {
    let testTemplate;

    beforeEach(async () => {
      testTemplate = await store.createTemplate({
        title: '測試模板',
        description: '這是一個測試模板',
        subject: SUBJECTS.MATH,
        template_type: '學習目標' as const,
        category: 'learning',
        is_public: false,
        is_collaborative: false,
        goals: [],
        bubbles: []
      });
      if (testTemplate?.id) createdTemplates.push(testTemplate.id);
      expect(testTemplate).toBeDefined();
    });

    it('應該能切換公開狀態', async () => {
      const result = await store.togglePublic(testTemplate!.id);
      expect(result).toBe(true);

      // 驗證資料庫中的資料
      const savedTemplate = await store.getTemplate(testTemplate!.id);
      expect(savedTemplate).toBeDefined();
      expect(savedTemplate?.is_public).toBe(true);
    });
  });
}); 