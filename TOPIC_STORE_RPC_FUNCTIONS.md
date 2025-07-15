# Topic Store RPC Functions Documentation

## 📄 RPC 函數清單

本文檔記錄所有 topicStore 相關的 RPC 函數，包括用途、參數和使用方式。

## 架構設計

```
Frontend UI → TopicStore (Zustand) → Supabase RPC Functions → Database
```

### 設計原則

1. **統一管理**: 所有 RPC 函數定義在單一 migration 文件中
2. **直接調用**: TopicStore 直接調用 RPC 函數，保持簡潔
3. **清晰註解**: 每個 RPC 調用都有詳細的註解說明
4. **版本控制**: 所有 RPC 定義可通過 git 追蹤變更

### 使用範例

在 TopicStore 中直接調用 RPC 函數：

```typescript
// 🔄 RPC: 安全更新主題（樂觀鎖定）
// 參數: 主題ID、期望版本號、更新欄位
// 返回: { success: boolean, message: string, current_version?: number }
const { data, error } = await supabase.rpc('safe_update_topic', {
  p_id: topicId,
  p_expected_version: expectedVersion,
  p_title: updates.title,
  p_description: updates.description,
  // ... 其他參數
});
```

---

## 🔒 Safe Update Functions (樂觀鎖定更新)

### `safe_update_topic`
**用途**: 安全更新主題，使用樂觀鎖定避免並發衝突

**參數**:
- `p_id: UUID` - 主題 ID
- `p_expected_version: INTEGER` - 期望的版本號
- `p_title: TEXT` - 標題 (可選)
- `p_description: TEXT` - 描述 (可選)
- `p_status: TEXT` - 狀態 (可選)
- `p_subject: TEXT` - 科目 (可選)
- `p_category: TEXT` - 分類 (可選)
- `p_topic_type: TEXT` - 主題類型 (可選)
- `p_is_collaborative: BOOLEAN` - 是否協作 (可選)
- `p_show_avatars: BOOLEAN` - 顯示頭像 (可選)
- `p_due_date: TIMESTAMPTZ` - 截止日期 (可選)
- `p_focus_element: TEXT` - 焦點元素 (可選)
- `p_bubbles: JSONB` - 泡泡數據 (可選)

**返回**:
```typescript
{
  success: boolean;
  message: string;
  current_version: number;
}
```

**使用示例**:
```typescript
import { safeUpdateTopic } from '../services/topicService';

const result = await safeUpdateTopic('topic-id', 5, {
  title: '新標題',
  status: 'active'
});
```

---

### `safe_update_goal`
**用途**: 安全更新目標，使用樂觀鎖定避免並發衝突

**參數**:
- `p_id: UUID` - 目標 ID
- `p_expected_version: INTEGER` - 期望的版本號
- `p_title: TEXT` - 標題 (可選)
- `p_description: TEXT` - 描述 (可選)
- `p_status: TEXT` - 狀態 (可選)
- `p_priority: TEXT` - 優先級 (可選)
- `p_order_index: INTEGER` - 排序索引 (可選)

**返回**: 同 `safe_update_topic`

---

### `safe_update_task`
**用途**: 安全更新任務，使用樂觀鎖定避免並發衝突

**參數**:
- `p_id: UUID` - 任務 ID
- `p_expected_version: INTEGER` - 期望的版本號
- `p_title: TEXT` - 標題 (可選)
- `p_description: TEXT` - 描述 (可選)
- `p_status: TEXT` - 狀態 (可選)
- `p_priority: TEXT` - 優先級 (可選)
- `p_order_index: INTEGER` - 排序索引 (可選)
- `p_need_help: BOOLEAN` - 需要幫助 (可選)
- `p_help_message: TEXT` - 求助訊息 (可選)
- `p_reply_message: TEXT` - 回覆訊息 (可選)
- `p_reply_at: TIMESTAMPTZ` - 回覆時間 (可選)
- `p_replied_by: UUID` - 回覆者 (可選)
- `p_completed_at: TIMESTAMPTZ` - 完成時間 (可選)
- `p_completed_by: UUID` - 完成者 (可選)
- `p_estimated_minutes: INTEGER` - 預估時間 (可選)
- `p_actual_minutes: INTEGER` - 實際時間 (可選)

**返回**: 同 `safe_update_topic`

---

## 🎯 Task Action Functions (任務動作處理)

### `perform_task_action_transaction`
**用途**: 執行任務動作事務（打卡、計數等），同時記錄到 task_actions 和 user_events

**參數**:
- `p_task_id: UUID` - 任務 ID
- `p_action_type: TEXT` - 動作類型 ('check_in', 'add_count', 'add_amount', 'reset')
- `p_action_date: DATE` - 動作日期
- `p_action_timestamp: TIMESTAMPTZ` - 動作時間戳
- `p_user_id: UUID` - 用戶 ID
- `p_action_data: JSONB` - 動作數據 (預設: {})

**返回**:
```typescript
{
  success: boolean;
  message: string;
  action_id: UUID;
  event_id: UUID;
  task: JSONB;
}
```

**使用示例**:
```typescript
import { performTaskActionTransaction } from '../services/topicService';

const result = await performTaskActionTransaction(
  'task-id',
  'check_in',
  new Date(),
  new Date().toISOString(),
  'user-id',
  {}
);
```

---

### `cancel_today_check_in_transaction`
**用途**: 取消今日打卡，同時清理 task_actions 和 user_events

**參數**:
- `p_task_id: UUID` - 任務 ID
- `p_user_id: UUID` - 用戶 ID
- `p_today: DATE` - 今日日期

**返回**:
```typescript
{
  success: boolean;
  message: string;
  task: JSONB;
}
```

---

## 📊 Query Functions (查詢函數)

### `get_active_tasks_for_user`
**用途**: 獲取用戶的所有活躍任務（用於 TaskWall）

**參數**:
- `p_user_id: UUID` - 用戶 ID

**返回**:
```typescript
Array<{
  task_id: UUID;
  task_title: string;
  task_status: string;
  task_priority: string;
  goal_title: string;
  topic_title: string;
  topic_subject: string;
}>
```

---

### `get_daily_activity_stats_v2`
**用途**: 獲取每日活動統計（基於 user_events），用於回顧系統

**參數**:
- `p_user_id: UUID` - 用戶 ID
- `p_start_date: TEXT` - 開始日期 (YYYY-MM-DD)
- `p_end_date: TEXT` - 結束日期 (YYYY-MM-DD)

**返回**:
```typescript
Array<{
  date: string;
  total_activities: number;
  completed_tasks: number;
  check_ins: number;
  records: number;
  active_tasks: JSONB;
}>
```

**使用示例**:
```typescript
import { getDailyActivityStatsV2 } from '../services/topicService';

const stats = await getDailyActivityStatsV2(
  'user-id',
  '2025-01-01',
  '2025-01-07'
);
```

---

### `get_retro_week_summary`
**用途**: 獲取回顧週摘要，為 retroStore 提供統一的數據獲取接口

**參數**:
- `p_user_id: UUID` - 用戶 ID
- `p_week_start: DATE` - 週開始日期
- `p_week_end: DATE` - 週結束日期

**返回**:
```typescript
{
  daily_data: Array<{
    date: string;
    dayOfWeek: string;
    check_ins: number;
    records: number;
    completed_tasks: number;
    total_activities: number;
    active_tasks: any[];
  }>;
  week_data: {
    total_check_ins: number;
    total_records: number;
    total_completed: number;
    total_activities: number;
    active_days: number;
  };
  completed_data: Array<{
    id: string;
    title: string;
    topic: string;
    goal_title: string;
    completed_at: string;
    difficulty: number;
  }>;
  topics_data: Array<{
    id: string;
    title: string;
    subject: string;
    progress: number;
    total_tasks: number;
    completed_tasks: number;
    has_activity: boolean;
    week_activities: number;
  }>;
}
```

---

## 🚨 Legacy Functions (待遷移或淘汰)

### `get_user_topics_with_actions` ⚠️
**狀態**: Legacy - 可能不存在於所有環境
**用途**: 獲取用戶主題和動作（包含任務動作記錄）
**建議**: 使用普通查詢方法替代

### `get_topic_with_structure` ⚠️
**狀態**: Legacy - 可能不存在於所有環境
**用途**: 獲取主題的完整結構
**建議**: 使用普通查詢方法替代

---

## 🔧 維護指南

### 1. 新增 RPC 函數
1. 在 `supabase/migrations/` 創建新的 migration 文件
2. 在 `topicService.ts` 添加包裝函數
3. 更新此文檔
4. 撰寫測試

### 2. 修改現有 RPC 函數
1. 創建新的 migration 文件（使用 `CREATE OR REPLACE FUNCTION`）
2. 更新 `topicService.ts` 的對應函數
3. 更新此文檔
4. 測試向後兼容性

### 3. 移除 RPC 函數
1. 確認沒有程式碼依賴該函數
2. 創建 migration 文件（使用 `DROP FUNCTION`）
3. 從 `topicService.ts` 移除對應函數
4. 更新此文檔

### 4. 部署流程
```bash
# 本地測試
supabase db reset

# 部署到生產環境
supabase db push --linked
```

---

## 📊 統計資訊

**總 RPC 函數數量**: 8 個
- Safe Update: 3 個
- Task Action: 2 個  
- Query: 3 個
- Legacy: 2 個 (待處理)

**最後更新**: 2025-01-15

---

## 🔍 除錯工具

### 檢查 RPC 函數是否存在
```typescript
import { checkRpcFunctionExists } from '../services/topicService';

const exists = await checkRpcFunctionExists('safe_update_topic');
console.log('函數是否存在:', exists);
```

### 獲取可用的 RPC 函數列表
```typescript
import { getAvailableRpcFunctions } from '../services/topicService';

const functions = await getAvailableRpcFunctions();
console.log('可用函數:', functions);
``` 