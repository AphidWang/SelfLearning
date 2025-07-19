# Task Independence Refactor 實施指南

## 🎯 重構目標
將巢狀的 `topic.goals.tasks` 結構重構為獨立的 store 架構，消除數據重複和同步問題。

---

## 📋 需要重構的 Patterns

### ❌ Pattern 1: 直接訪問巢狀結構

#### 錯誤示例
```typescript
// ❌ 錯誤：直接訪問 topic.goals
const goals = topic.goals.filter(goal => goal.status !== 'archived');

// ❌ 錯誤：直接訪問 goal.tasks  
const tasks = goal.tasks.filter(task => task.status === 'done');

// ❌ 錯誤：巢狀遍歷
topic.goals.forEach(goal => {
  goal.tasks.forEach(task => {
    // 處理 task
  });
});

// ❌ 錯誤：巢狀 reduce
const completedCount = topic.goals.reduce((acc, goal) => 
  acc + (goal.tasks?.filter(task => task.status === 'done').length || 0), 0
);
```

#### ✅ 正確替代方式
```typescript
// ✅ 正確：使用 helper functions
import { getGoalsForTopic, getTasksForGoal } from '../../store/helpers';

const goals = getGoalsForTopic(topicId).filter(goal => goal.status !== 'archived');
const tasks = getTasksForGoal(goalId).filter(task => task.status === 'done');

// ✅ 正確：使用組合查詢
const completedCount = getTopicProgress(topicId).completedTasks;
```

---

### ❌ Pattern 2: JSX 中的巢狀渲染

#### 錯誤示例
```jsx
// ❌ 錯誤：JSX 中直接訪問巢狀數據
{topic.goals?.map(goal => (
  <div key={goal.id}>
    {goal.tasks?.map(task => (
      <TaskItem key={task.id} task={task} />
    ))}
  </div>
))}

// ❌ 錯誤：條件渲染中的巢狀訪問
{selectedTopic?.goals?.length > 0 && (
  <GoalsList goals={selectedTopic.goals} />
)}
```

#### ✅ 正確替代方式
```jsx
// ✅ 正確：先獲取數據，再渲染
const goals = selectedTopic ? getGoalsForTopic(selectedTopic.id) : [];
const tasks = goalId ? getTasksForGoal(goalId) : [];

{goals.map(goal => (
  <div key={goal.id}>
    {getTasksForGoal(goal.id).map(task => (
      <TaskItem key={task.id} task={task} />
    ))}
  </div>
))}

// ✅ 正確：條件渲染
{goals.length > 0 && <GoalsList goals={goals} />}
```

---

### ❌ Pattern 3: 統計和計算

#### 錯誤示例
```typescript
// ❌ 錯誤：手動統計
const totalTasks = topic.goals.reduce((acc, goal) => acc + goal.tasks.length, 0);
const completedTasks = topic.goals.reduce((acc, goal) => 
  acc + goal.tasks.filter(t => t.status === 'done').length, 0
);
const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

// ❌ 錯誤：複雜的查找邏輯
const task = topic.goals
  .find(g => g.tasks.some(t => t.id === taskId))
  ?.tasks.find(t => t.id === taskId);
```

#### ✅ 正確替代方式
```typescript
// ✅ 正確：使用統計 helper
const { totalTasks, completedTasks, completionRate } = getTopicProgress(topicId);

// ✅ 正確：直接查詢
const task = getTaskById(taskId);
```

---

### ❌ Pattern 4: 響應式數據監聽

#### 錯誤示例
```typescript
// ❌ 錯誤：訂閱巢狀結構變化
useEffect(() => {
  const unsubscribe = useTopicStore.subscribe((state) => {
    const topic = state.topics.find(t => t.id === topicId);
    if (topic?.goals) {
      setGoals(topic.goals);
    }
  });
  return unsubscribe;
}, [topicId]);
```

#### ✅ 正確替代方式
```typescript
// ✅ 正確：使用響應式 selectors
import { useActiveGoalsForTopic } from '../../store/selectors';

const goals = useActiveGoalsForTopic(topicId); // 自動響應變化

// 或者使用 helper functions（非響應式）
const [goals, setGoals] = useState<Goal[]>([]);
useEffect(() => {
  setGoals(getGoalsForTopic(topicId));
}, [topicId, /* 其他依賴 */]);
```

---

### ❌ Pattern 5: 數據查找和過濾

#### 錯誤示例
```typescript
// ❌ 錯誤：在巢狀結構中查找
const findTaskInTopic = (topicId: string, taskId: string) => {
  const topic = topics.find(t => t.id === topicId);
  if (!topic?.goals) return null;
  
  for (const goal of topic.goals) {
    const task = goal.tasks?.find(t => t.id === taskId);
    if (task) return task;
  }
  return null;
};

// ❌ 錯誤：複雜的過濾邏輯
const getTasksNeedingHelp = (topicId: string) => {
  const topic = topics.find(t => t.id === topicId);
  return topic?.goals?.flatMap(g => 
    g.tasks?.filter(t => t.need_help) || []
  ) || [];
};
```

#### ✅ 正確替代方式
```typescript
// ✅ 正確：直接查詢
const task = getTaskById(taskId);

// ✅ 正確：使用專用查詢函數
const tasksNeedingHelp = getAllTasksForTopic(topicId)
  .filter(task => task.need_help);
```

---

## 🛠️ 重構步驟

### Step 1: 引入 Helper Functions
```typescript
// 在組件頂部引入需要的 helpers
import { 
  getGoalsForTopic, 
  getTasksForGoal, 
  getTopicProgress,
  getTaskById 
} from '../../store/helpers';
```

### Step 2: 識別巢狀訪問
搜尋以下 patterns：
- `\.goals(\[|\.|\.filter|\.map|\.find|\.reduce)`
- `\.tasks(\[|\.|\.filter|\.map|\.find|\.reduce)`
- `topic.goals`
- `goal.tasks`

### Step 3: 逐一替換
按照上面的 patterns 逐一替換成正確的方式。

### Step 4: 測試驗證
確保替換後功能正常，數據正確顯示。

---

## 📂 Available Helper Functions

### 基礎查詢
```typescript
// 獲取 Topic 的 Goals（不巢狀）
getGoalsForTopic(topicId: string): Goal[]

// 獲取 Goal 的 Tasks（不巢狀）  
getTasksForGoal(goalId: string): Task[]

// 獲取所有 Topic 的 Tasks（跨 Goals，但不巢狀）
getAllTasksForTopic(topicId: string): Task[]
```

### 過濾查詢
```typescript
// 獲取活躍的 Goals
getActiveGoalsForTopic(topicId: string): Goal[]

// 獲取活躍的 Tasks
getActiveTasksForGoal(goalId: string): Task[]
```

### 統計查詢
```typescript
// 獲取 Topic 進度統計
getTopicProgress(topicId: string): {
  totalTasks: number;
  completedTasks: number;
  todoTasks: number;
  completionRate: number;
}
```

### 單項查詢
```typescript
// 根據 ID 獲取實體
getTopicById(topicId: string): Topic | undefined
getGoalById(goalId: string): Goal | undefined  
getTaskById(taskId: string): Task | undefined
```

---

## 🎯 響應式查詢 (selectors.ts)

### 可用的響應式 Hooks
```typescript
// 響應式獲取 Topic 的 Goals
useGoalsForTopic(topicId: string): Goal[]
useActiveGoalsForTopic(topicId: string): Goal[]

// 響應式獲取 Goal 的 Tasks
useTasksForGoal(goalId: string): Task[]
useActiveTasksForGoal(goalId: string): Task[]

// 響應式統計
useTopicStats(topicId: string): TopicStats
useGoalStats(goalId: string): GoalStats

// 響應式單項查詢
useGoalById(goalId: string): Goal | undefined
useTaskById(taskId: string): Task | undefined
```

### 使用方式
```typescript
// ✅ 自動響應數據變化
const goals = useActiveGoalsForTopic(topicId);
const stats = useTopicStats(topicId);

// 不需要手動訂閱或 useEffect
```

---

## 🔍 常見重構場景

### 場景 1: 列表渲染
```typescript
// ❌ 之前
{topic.goals?.map(goal => <GoalItem key={goal.id} goal={goal} />)}

// ✅ 之後  
{getGoalsForTopic(topicId).map(goal => <GoalItem key={goal.id} goal={goal} />)}
```

### 場景 2: 條件顯示
```typescript
// ❌ 之前
{topic.goals && topic.goals.length > 0 && <GoalsList />}

// ✅ 之後
{getGoalsForTopic(topicId).length > 0 && <GoalsList />}
```

### 場景 3: 數據統計
```typescript
// ❌ 之前
const count = topic.goals?.reduce((acc, goal) => 
  acc + (goal.tasks?.filter(t => t.status === 'done').length || 0), 0
) || 0;

// ✅ 之後
const count = getTopicProgress(topicId).completedTasks;
```

### 場景 4: 事件處理
```typescript
// ❌ 之前
const handleTaskClick = (topicId: string, goalId: string, taskId: string) => {
  const topic = topics.find(t => t.id === topicId);
  const goal = topic?.goals?.find(g => g.id === goalId);
  const task = goal?.tasks?.find(t => t.id === taskId);
  // ...
};

// ✅ 之後
const handleTaskClick = (taskId: string) => {
  const task = getTaskById(taskId);
  // ...
};
```

---

## ⚡ 快速檢查清單

### 重構前檢查
- [ ] 確認已引入必要的 helper functions
- [ ] 識別所有巢狀訪問的地方
- [ ] 備份原始代碼（以防需要回滾）

### 重構中檢查  
- [ ] 替換所有 `topic.goals` 訪問
- [ ] 替換所有 `goal.tasks` 訪問
- [ ] 替換統計和計算邏輯
- [ ] 更新事件處理函數

### 重構後檢查
- [ ] 功能測試：所有原有功能正常
- [ ] 數據測試：顯示的數據正確
- [ ] 響應性測試：數據更新即時反映
- [ ] 無 linter 錯誤

---

## 🎯 最終目標

重構完成後應該達到：

1. **無巢狀依賴**：不再有 `topic.goals.tasks` 的直接訪問
2. **清晰的數據流**：每個 store 管理自己的數據
3. **高效查詢**：使用 helper functions 和 selectors
4. **響應式更新**：數據變化自動反映到 UI
5. **易於維護**：新功能不需要考慮複雜的同步邏輯

完成重構後，你應該能夠輕鬆地：
- 追蹤哪些地方已經重構完成
- 新增功能時不擔心數據同步問題  
- 清楚知道數據來自哪個 store
- 享受更好的開發體驗 🎉 