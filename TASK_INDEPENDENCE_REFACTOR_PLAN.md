# Task 獨立性重構計劃

## 🎯 重構目標

讓 Task 可以被單獨建立（不需要依賴於 Topic），並且有方法可以撈到獨立的 Task。

## 📋 目前架構分析

### 現有依賴關係
```
Topic (owner_id) → Goal (owner_id, topic_id) → Task (owner_id, goal_id)
```

### 現有問題
1. Task 必須依賴 Goal
2. Goal 必須依賴 Topic  
3. 沒有 creator_id 概念，只有 owner_id
4. 無法創建獨立的 Task
5. 無法查詢獨立的 Task

## 🏗️ 階段性重構計劃

---

## === 第一階段：新增 creator_id 支援 ===

### 🎯 目標
- 引入 creator_id 概念，區分「創建者」與「擁有者」
- 保持現有功能完全相容
- 為第二階段的獨立 Task 奠定基礎

### 📊 資料庫遷移

#### 1.1 新增 creator_id 欄位
```sql
-- 新增 Topic creator_id
ALTER TABLE topics 
ADD COLUMN creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 新增 Goal creator_id  
ALTER TABLE goals
ADD COLUMN creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 新增 Task creator_id
ALTER TABLE tasks
ADD COLUMN creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

#### 1.2 資料遷移腳本
```sql
-- 遷移現有資料：creator_id = owner_id
UPDATE topics SET creator_id = owner_id WHERE creator_id IS NULL;
UPDATE goals SET creator_id = (SELECT owner_id FROM topics WHERE topics.id = goals.topic_id) WHERE creator_id IS NULL;
UPDATE tasks SET creator_id = (SELECT owner_id FROM topics WHERE topics.id = (SELECT topic_id FROM goals WHERE goals.id = tasks.goal_id)) WHERE creator_id IS NULL;
```

#### 1.3 索引優化
```sql
-- 創建者查詢索引
CREATE INDEX idx_topics_creator_id ON topics(creator_id);
CREATE INDEX idx_goals_creator_id ON goals(creator_id);  
CREATE INDEX idx_tasks_creator_id ON tasks(creator_id);

-- 複合索引用於獨立 Task 查詢
CREATE INDEX idx_tasks_creator_goal ON tasks(creator_id, goal_id);
```

### 🔧 RPC Functions 更新

#### 1.4 更新現有 RPC Functions
需要修改的 RPC Functions：
- `safe_update_topic` - 新增 creator_id 支援
- `safe_update_goal` - 新增 creator_id 支援  
- `safe_update_task` - 新增 creator_id 支援
- `get_active_tasks_for_user` - 考慮 creator_id
- `get_topic_with_structure` - 回傳 creator_id

### 💻 前端程式碼更新

#### 1.5 Types 更新
```typescript
// apps/client/src/types/goal.ts
export interface Topic {
  // ... 現有欄位
  creator_id: string;    // 新增
}

export interface Goal {
  // ... 現有欄位  
  creator_id: string;    // 新增
}

export interface Task {
  // ... 現有欄位
  creator_id: string;    // 新增
}
```

#### 1.6 Store 更新

**topicStore.ts:**
```typescript
createTopic: async (topicData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('用戶未認證');
  
  const dbTopicData = {
    ...topicData,
    owner_id: user.id,
    creator_id: user.id  // 新增
  };
  // ... 其餘邏輯
}
```

**goalStore.ts:**
```typescript
addGoal: async (topicId, goalData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('用戶未認證');

  const goalDataWithDefaults = {
    ...goalData,
    topic_id: topicId,
    creator_id: user.id  // 新增
  };
  // ... 其餘邏輯
}
```

**taskStore.ts:**
```typescript
addTask: async (goalId, taskData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('用戶未認證');

  const taskDataWithDefaults = {
    ...taskData,
    goal_id: goalId,
    creator_id: user.id  // 新增
  };
  // ... 其餘邏輯
}
```

### ✅ 第一階段驗收標準
- [ ] 所有表格都有 creator_id 欄位
- [ ] 現有資料正確遷移
- [ ] 新建的 Topic/Goal/Task 都有正確的 creator_id
- [ ] 現有功能完全正常運作
- [ ] 所有測試通過

---

## === 第二階段：支援獨立 Task ===

### 🎯 目標
- Task 可以不依賴 Goal/Topic 單獨存在
- 提供獨立 Task 的查詢 API
- 支援協作者功能

### 📊 資料庫更新

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
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, t.title, t.description, t.status, t.priority,
    t.creator_id, t.owner_id, t.collaborator_ids,
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
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, t.title, t.description, t.status, t.priority,
    t.creator_id, t.owner_id, t.collaborator_ids,
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

### 💻 前端程式碼更新

#### 2.3 TaskStore 新增獨立 Task 功能
```typescript
interface TaskStoreState {
  // ... 現有欄位

  // 新增獨立 Task 功能
  createIndependentTask: (task: Omit<Task, 'id' | 'goal_id' | 'creator_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  getMyIndependentTasks: () => Promise<Task[]>;
  getCollaborativeIndependentTasks: () => Promise<Task[]>;
  inviteTaskCollaborator: (taskId: string, userId: string) => Promise<boolean>;
}

// 實作
createIndependentTask: async (taskData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用戶未認證');

    const taskDataWithDefaults = {
      ...taskData,
      goal_id: null,          // 獨立 Task
      creator_id: user.id,
      owner_id: user.id,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      need_help: taskData.need_help || false,
      task_type: taskData.task_type || 'single',
      task_config: taskData.task_config || { type: 'single' },
      cycle_config: taskData.cycle_config || { cycle_type: 'none', auto_reset: false },
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskDataWithDefaults])
      .select()
      .single();

    if (error) throw error;

    set(state => ({ tasks: [...state.tasks, data] }));
    return data;
  } catch (error: any) {
    console.error('創建獨立任務失敗:', error);
    set({ error: error.message || '創建獨立任務失敗' });
    return null;
  }
},

getMyIndependentTasks: async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用戶未認證');

    const { data, error } = await supabase.rpc('get_independent_tasks_by_creator', {
      p_user_id: user.id
    });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('獲取我的獨立任務失敗:', error);
    return [];
  }
},

getCollaborativeIndependentTasks: async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用戶未認證');

    const { data, error } = await supabase.rpc('get_independent_tasks_as_collaborator', {
      p_user_id: user.id
    });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('獲取協作獨立任務失敗:', error);
    return [];
  }
}
```

#### 2.4 UI 組件更新

**新增獨立任務頁面：**
```typescript
// apps/client/src/pages/student/IndependentTasksPage.tsx
export const IndependentTasksPage: React.FC = () => {
  const { 
    createIndependentTask, 
    getMyIndependentTasks,
    getCollaborativeIndependentTasks 
  } = useTaskStore();
  
  // ... 組件實作
};
```

**更新導航：**
- 在 Sidebar 新增「獨立任務」選項
- 更新路由配置

### 🔄 向後相容策略

#### 2.5 漸進式遷移
```typescript
// 擴展現有 addTask 方法支援獨立模式
addTask: async (goalIdOrNull: string | null, taskData) => {
  if (goalIdOrNull === null) {
    // 創建獨立任務
    return await get().createIndependentTask(taskData);
  } else {
    // 現有邏輯：創建依賴 Goal 的任務
    // ... 現有實作
  }
}
```

#### 2.6 API 一致性
- 現有 `addTask(goalId, taskData)` 保持不變
- 新增 `createIndependentTask(taskData)` 
- 統一的 Task 操作方法（updateTask, deleteTask 等）同時支援兩種模式

### ✅ 第二階段驗收標準
- [ ] 可以創建獨立的 Task（goal_id 為 NULL）
- [ ] 可以查詢自己創建的獨立 Task
- [ ] 可以查詢自己協作的獨立 Task
- [ ] 獨立 Task 支援完整的生命週期管理
- [ ] 現有依賴 Goal 的 Task 功能完全正常
- [ ] 所有測試通過

---

## 🚨 風險評估與注意事項

### 資料一致性風險
1. **遷移過程中的資料完整性**
   - 建議在非營業時間進行遷移
   - 完整備份資料庫
   - 分步驟執行並驗證每個步驟

2. **RPC Function 更新風險**
   - 逐一更新並測試每個 RPC
   - 保持向後相容性
   - 監控 Supabase 日誌

### 效能影響
1. **查詢效能**
   - 新增適當的索引
   - 監控查詢效能
   - 考慮分頁載入

2. **儲存空間**
   - creator_id 會增加一些儲存開銷
   - 評估是否需要定期清理歸檔資料

### 用戶體驗風險
1. **功能複雜度增加**
   - 提供清楚的 UI 區分獨立 Task 和依賴 Task
   - 完善的使用指南
   - 漸進式功能推出

---

## 📅 實施時間軸

### 第一階段（預估 1-2 週）
- **Week 1**: 資料庫遷移 + RPC 更新
- **Week 2**: 前端 Store 更新 + 測試

### 第二階段（預估 2-3 週）  
- **Week 1**: 資料庫約束調整 + 新 RPC Functions
- **Week 2**: TaskStore 獨立功能實作
- **Week 3**: UI 組件開發 + 整合測試

---

## 🧪 測試策略

### 單元測試
- [ ] 資料庫遷移測試
- [ ] RPC Function 測試  
- [ ] Store 方法測試

### 整合測試
- [ ] 完整的 Task 生命週期測試
- [ ] 獨立 Task 與依賴 Task 混合場景測試
- [ ] 協作功能測試

### 效能測試
- [ ] 大量資料下的查詢效能
- [ ] 併發創建 Task 的效能
- [ ] 記憶體使用量測試

---

## 📝 後續優化建議

1. **快取策略**：對頻繁查詢的獨立 Task 實施快取
2. **批次操作**：支援批次創建/更新獨立 Task
3. **進階篩選**：提供更豐富的獨立 Task 篩選和排序選項
4. **統計分析**：獨立 Task 的使用統計和分析報告 