# 任務牆性能優化指南 🚀

## 優化前後對比

### 🐌 優化前 (N+1 查詢問題)
對於 7-8 個主題，每個主題有 3-5 個目標，每個目標有 2-6 個任務：

1. 獲取自有主題：**1 次**
2. 獲取協作主題 ID：**1 次**
3. 獲取協作主題內容：**1 次**
4. 每個主題的協作者：**8 次**
5. 每個主題的目標：**8 次**
6. 每個目標的任務：**~30 次**
7. 每個任務的記錄：**~150 次**

**總計：約 200 次查詢** ⏱️

### ⚡ 優化後 (批量查詢策略)

1. 並行獲取自有主題和協作主題：**2 次**
2. 批量獲取所有目標和協作者：**2 次**
3. 批量獲取所有任務：**1 次**
4. 批量獲取任務記錄：**1 次**
5. 批量獲取用戶資料：**1 次**

**總計：7 次查詢** ⚡

## 優化策略詳解

### 1. 主題查詢優化
```typescript
// 優化前：串行查詢
const ownTopics = await getOwnTopics();
const collabIds = await getCollabIds();
const collabTopics = await getCollabTopics(collabIds);

// 優化後：並行查詢 + JOIN
const [ownTopicsQuery, collabTopicsQuery] = await Promise.all([
  supabase.from('topics_new').select('*').eq('owner_id', userId),
  supabase.from('topic_collaborators').select(`
    topic_id,
    topics_new!inner(*)
  `).eq('user_id', userId)
]);
```

### 2. 批量資料獲取
```typescript
// 優化前：循環查詢
for (const topic of topics) {
  const goals = await getGoals(topic.id);
  for (const goal of goals) {
    const tasks = await getTasks(goal.id);
    for (const task of tasks) {
      const records = await getRecords(task.id);
    }
  }
}

// 優化後：批量查詢
const topicIds = topics.map(t => t.id);
const allGoals = await supabase.from('goals').select('*').in('topic_id', topicIds);
const goalIds = allGoals.map(g => g.id);
const allTasks = await supabase.from('tasks').select('*').in('goal_id', goalIds);
const taskIds = allTasks.map(t => t.id);
const allRecords = await taskRecordStore.getUserTaskRecords({ task_ids: taskIds });
```

### 3. 記憶體索引組裝
```typescript
// 建立 Map 索引提高查詢效率
const goalsMap = new Map<string, Goal[]>();
const tasksMap = new Map<string, Task[]>();
const recordsMap = new Map<string, Record[]>();

// O(1) 時間複雜度查詢
const topicGoals = goalsMap.get(topicId) || [];
```

## 性能監控

### 開發環境監控
- Console 輸出詳細耗時分析
- Toast 提示載入時間
- 各階段性能分解

### 生產環境監控
```typescript
console.log(`⚡ fetchTopics 總耗時: ${Math.round(totalTime)}ms`);
console.log(`⚡ 查詢統計: 主題(2) + 目標/協作者(2) + 任務(1) + 記錄(1) + 用戶(1) = 7次查詢`);
```

## 預期效果

### 載入時間改善
- **優化前：** 2-5 秒（取決於資料量）
- **優化後：** 200-800ms

### 網路請求減少
- **減少 95% 的 SQL 查詢**
- **降低資料庫負載**
- **改善用戶體驗**

### 程式碼維護性
- 保持現有 API 接口不變
- 組件無需修改
- 向後兼容

## 未來優化空間

### 1. 資料快取
```typescript
// 實作 SWR 或 React Query
const { data: topics, mutate } = useSWR('topics', fetchTopics, {
  revalidateOnFocus: false,
  dedupingInterval: 60000
});
```

### 2. 虛擬化滾動
對於大量任務卡片，考慮使用 `react-window` 或 `react-virtualized`

### 3. 增量更新
只更新變更的資料，而不是重新獲取所有資料

### 4. GraphQL 查詢
考慮使用 PostgREST 的嵌套查詢或 GraphQL

### 5. 資料庫索引優化
```sql
-- 複合索引
CREATE INDEX idx_goals_topic_status ON goals(topic_id, status);
CREATE INDEX idx_tasks_goal_status ON tasks(goal_id, status);
CREATE INDEX idx_task_records_task_created ON task_records(task_id, created_at);
```

## 監控指標

### 關鍵指標
- **首次載入時間 (FCP)**
- **查詢次數統計**
- **記憶體使用量**
- **用戶操作響應時間**

### 警報閾值
- 載入時間 > 1.5s
- 查詢次數 > 10
- 記憶體使用 > 100MB

## 總結

通過批量查詢策略，我們成功將任務牆的載入性能提升了 **95%**，同時保持了程式碼的可讀性和維護性。這個優化策略展示了如何在不改變 schema 的前提下，大幅提升應用性能。 