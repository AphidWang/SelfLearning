# Task 獨立性重構計劃 (更新版)

## 🎯 重構目標

1. **解決 Store 架構問題**：避免 topicStore 和 taskStore 間的數據重複和同步問題
2. **實現 Task 獨立性**：讓 Task 可以被單獨建立（不需要依賴於 Topic）
3. **提供獨立 Task 查詢**：有方法可以撈到獨立的 Task

## 📋 目前架構分析

### 現有依賴關係
```
Topic (owner_id) → Goal (owner_id, topic_id) → Task (owner_id, goal_id)
```

### ⚠️ 當前嚴重問題
1. **數據重複**：同一個 task 存在於 taskStore 和 topicStore 中
2. **同步複雜性**：每次 task 更新需要同時更新兩個 store
3. **一致性風險**：容易出現數據不一致的情況（剛解決的畫面不更新問題）
4. **維護成本**：新增功能時需要考慮多個 store 的同步

### 其他架構問題
5. Task 必須依賴 Goal
6. Goal 必須依賴 Topic  
7. 沒有 creator_id 概念，只有 owner_id
8. 無法創建獨立的 Task
9. 無法查詢獨立的 Task

## 🏗️ 重構計劃（重新排序優先級）

---

## === 階段 0：立即修復 Store 架構問題 ===

### 🎯 目標
- 解決數據重複和狀態同步問題
- 為後續重構奠定穩固基礎
- 立即改善開發體驗

### ✅ 已完成的修復
- [x] 統一 TaskWithContext 類型定義
- [x] 修復 SPECIAL_TASK_FLAGS 匯入錯誤
- [x] 讓 taskStore 同時更新 topicStore 狀態（臨時解決方案）
- [x] 確保 version 欄位在所有 TaskWithContext 實例中可用

### 🔧 當前臨時解決方案問題
```typescript
// 問題：在 taskStore 中手動同步 topicStore
markTaskCompleted: async (taskId, expectedVersion, requireRecord = true) => {
  // ... 更新 taskStore
  
  // 臨時解決方案：手動同步 topicStore
  const { useTopicStore } = await import('./topicStore');
  useTopicStore.setState(state => ({
    topics: state.topics?.map(topic => ({
      ...topic,
      goals: topic.goals?.map(goal => ({
        ...goal,
        tasks: goal.tasks?.map(task => 
          task.id === taskId ? { ...task, ...updatedTask } : task
        )
      }))
    }))
  }));
}
```

### 📊 推薦的最終解決方案：分離數據架構

#### 方案 A：數據結構分離（強烈推薦）
```typescript
// topicStore 只管理結構關係
interface Topic {
  id: string;
  title: string;
  goals: Goal[];
}

interface Goal {
  id: string;
  title: string;
  taskIds: string[]; // 只存 ID，不存完整 task
}

// taskStore 管理完整 task 數據
interface TaskStore {
  tasks: Record<string, Task>; // 以 ID 為 key 的 map
  
  // 組合查詢方法
  getTasksForGoal(goalId: string): Task[];
  getTasksForTopic(topicId: string): Task[];
  getTaskById(taskId: string): Task | undefined;
}

// 在組件中使用
const TaskWallPage = () => {
  const { topics } = useTopicStore();
  const { getTasksForTopic } = useTaskStore();
  
  const allTasks = useMemo(() => {
    return topics.flatMap(topic => getTasksForTopic(topic.id));
  }, [topics, getTasksForTopic]);
}
```

#### 方案 B：統一 Store（備選方案）
```typescript
interface UnifiedStore {
  topics: Topic[];
  goals: Goal[];
  tasks: Task[];
  
  // 組合查詢方法
  getTasksForGoal(goalId: string): Task[];
  getTasksForTopic(topicId: string): Task[];
  getTopicWithTasks(topicId: string): TopicWithTasks;
}
```

### 🚨 立即決策需求
**需要立即決定使用哪個方案**，因為：
1. 當前臨時解決方案會累積更多技術債務
2. 每次新增功能都會遇到同步問題
3. 影響開發效率和代碼質量

---

## === 第一階段：新增 creator_id 支援 ===

### 🎯 目標
- 引入 creator_id 概念，區分「創建者」與「擁有者」
- 保持現有功能完全相容
- 為第二階段的獨立 Task 奠定基礎

### ✅ 已完成的工作
- [x] 創建遷移腳本並測試 creator_id 功能
- [x] 更新 TypeScript 類型定義（Topic, Goal, Task interfaces）
- [x] 更新 topicStore.createTopic：設定 creator_id
- [x] 更新 goalStore.addGoal：設定 creator_id  
- [x] 更新 taskStore.addTask：設定 creator_id
- [x] 修復版本衝突問題（TaskWallPage 等組件傳遞正確版本號）
- [x] 完成第一階段測試：驗證現有功能正常，新建實體有正確 creator_id

### 📊 已執行的資料庫遷移

#### ✅ 已完成的遷移
```sql
-- ✅ 已在生產環境執行
-- 新增 creator_id 欄位到 topics, goals, tasks
-- 遷移現有資料：creator_id = owner_id  
-- 建立索引：creator_id 相關的查詢優化索引
-- 更新 RPC Functions：safe_update_topic, safe_update_goal, safe_update_task 支援 creator_id
```

### 🎯 TODO List 狀態檢查
```
✅ task-independence-1.1: 資料庫遷移：新增 creator_id 欄位到 topics, goals, tasks 表
✅ task-independence-1.2: 執行資料遷移腳本：將現有 owner_id 複製到 creator_id
✅ task-independence-1.3: 建立索引：creator_id 相關的查詢優化索引
✅ task-independence-1.4: 更新 RPC Functions：safe_update_topic, safe_update_goal, safe_update_task 支援 creator_id
✅ task-independence-1.5: 更新 TypeScript 類型定義：新增 creator_id 欄位到 Topic, Goal, Task interfaces
✅ task-independence-1.6: 更新 topicStore.createTopic：設定 creator_id
✅ task-independence-1.7: 更新 goalStore.addGoal：設定 creator_id
✅ task-independence-1.8: 更新 taskStore.addTask：設定 creator_id
✅ task-independence-1.9: 第一階段測試：驗證現有功能正常，新建實體有正確 creator_id
```

---

## === 第二階段：支援獨立 Task ===

### 🎯 目標
- Task 可以不依賴 Goal/Topic 單獨存在
- 提供獨立 Task 的查詢 API
- 支援協作者功能

### 📋 待完成的工作
```
⏳ task-independence-2.1: 調整資料庫約束：讓 tasks.goal_id 可為 NULL，新增獨立任務檢查約束
⏳ task-independence-2.2: 建立 RPC Functions：get_independent_tasks_by_creator 和 get_independent_tasks_as_collaborator
⏳ task-independence-2.3: TaskStore 新增獨立任務功能：createIndependentTask, getMyIndependentTasks, getCollaborativeIndependentTasks
⏳ task-independence-2.4: 創建獨立任務 UI 頁面：IndependentTasksPage.tsx
⏳ task-independence-2.5: 更新導航和路由：新增獨立任務選項到 Sidebar
⏳ task-independence-2.6: 實作向後相容策略：擴展 addTask 支援獨立模式
⏳ task-independence-2.7: 第二階段測試：驗證獨立任務完整功能，確保現有功能不受影響
```

### 📊 資料庫更新計劃

#### 2.1 調整表格約束
```sql
-- 讓 goal_id 可為 NULL（獨立 Task）
ALTER TABLE tasks ALTER COLUMN goal_id DROP NOT NULL;

-- 新增檢查約束：獨立任務必須有明確的擁有者
ALTER TABLE tasks ADD CONSTRAINT check_independent_task 
CHECK (
  (goal_id IS NOT NULL) OR 
  (goal_id IS NULL AND owner_id IS NOT NULL)
);
```

#### 2.2 新增獨立 Task 查詢 RPC
```sql
-- 獲取用戶創建的獨立 Task
CREATE OR REPLACE FUNCTION get_independent_tasks_by_creator(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50),
  priority VARCHAR(20),
  creator_id UUID,
  owner_id UUID,
  collaborator_ids JSONB,
  task_type VARCHAR(50),
  task_config JSONB,
  cycle_config JSONB,
  special_flags JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, t.title, t.description, t.status, t.priority,
    t.creator_id, t.owner_id, t.collaborator_ids,
    t.task_type, t.task_config, t.cycle_config, t.special_flags,
    t.created_at, t.updated_at
  FROM tasks t
  WHERE 
    t.goal_id IS NULL 
    AND t.creator_id = p_user_id
    AND t.status != 'archived'
  ORDER BY t.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 獲取用戶協作的獨立 Task
CREATE OR REPLACE FUNCTION get_independent_tasks_as_collaborator(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50),
  priority VARCHAR(20),
  creator_id UUID,
  owner_id UUID,
  collaborator_ids JSONB,
  task_type VARCHAR(50),
  task_config JSONB,
  cycle_config JSONB,
  special_flags JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, t.title, t.description, t.status, t.priority,
    t.creator_id, t.owner_id, t.collaborator_ids,
    t.task_type, t.task_config, t.cycle_config, t.special_flags,
    t.created_at, t.updated_at
  FROM tasks t
  WHERE 
    t.goal_id IS NULL 
    AND t.status != 'archived'
    AND (
      t.owner_id = p_user_id OR
      t.collaborator_ids @> to_jsonb(p_user_id::text)
    )
  ORDER BY t.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## === 第三階段：完善和優化 ===

### 🎯 目標
- 完整測試和效能優化
- 撰寫文檔和使用指南
- 監控和效能分析

### 📋 待完成的工作
```
⏳ task-independence-3.1: 撰寫完整的單元測試和整合測試
⏳ task-independence-3.2: 效能測試：監控查詢效能和記憶體使用
⏳ task-independence-3.3: 文檔更新：使用指南和 API 文檔
```

---

## 🚨 立即決策需求

### ❗ 高優先級（需立即處理）
1. **決定 Store 架構方案**：方案 A（分離數據）vs 方案 B（統一 Store）
2. **移除臨時同步代碼**：當前的手動同步會累積技術債務

### ⚡ 中優先級（本週內處理）
3. **完成第二階段遷移**：獨立 Task 功能
4. **創建獨立任務 UI**：新的頁面和導航

### 🔄 低優先級（可延後）
5. **效能優化和測試**：在基礎架構穩定後進行

---

## 📅 建議實施時間軸

### 立即行動（今天-明天）
- **決定 Store 架構方案**
- **實施選定的架構方案**  
- **移除臨時同步代碼**

### 本週內
- **完成第二階段資料庫遷移**
- **實作獨立 Task 功能**
- **創建基礎 UI**

### 下週
- **完善 UI 和用戶體驗**
- **撰寫測試和文檔**
- **效能優化**

---

## 🧪 測試策略

### 已完成的測試
- [x] 第一階段功能測試：creator_id 支援和版本控制
- [x] TaskWithContext 統一性測試

### 待完成的測試
- [ ] Store 架構重構後的完整測試
- [ ] 獨立 Task CRUD 操作測試
- [ ] 獨立 Task 與依賴 Task 混合場景測試
- [ ] 協作功能測試
- [ ] 效能和壓力測試

---

## 📝 相關文檔和參考

### 已建立的文檔
- `TASK_INDEPENDENCE_REFACTOR_PLAN.md` (本文檔)
- `USER_EVENTS_SYSTEM_DEPLOYMENT_SUMMARY.md`
- `TOPIC_STORE_MIGRATION_GUIDE.md`

### 需要更新的文檔
- API 文檔（新增獨立 Task 相關 API）
- 用戶使用指南（獨立 Task 功能說明）
- 開發者指南（新的 Store 架構說明）

---

## 💡 總結和下一步

### 當前狀況
- ✅ 第一階段（creator_id 支援）已完成
- ⚠️ Store 架構問題需要立即解決
- ⏳ 第二階段（獨立 Task）待開始

### 立即行動計劃
1. **今天**：決定並實施 Store 架構解決方案
2. **明天**：移除臨時同步代碼，測試新架構
3. **本週**：開始第二階段獨立 Task 功能開發

### 成功指標
- Store 間不再有數據重複
- Task 狀態更新即時反映
- 可以創建和管理獨立 Task
- 現有功能完全正常運作
- 開發體驗明顯改善 