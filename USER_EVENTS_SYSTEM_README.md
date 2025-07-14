# 統一事件追蹤系統 (User Events System)

## 🎯 系統概述

我們建立了一個統一的事件追蹤系統，通過 `user_events` 表記錄所有用戶行為，解決了之前數據分散、難以統計的問題。

## 📊 架構設計

### 核心概念
```
用戶行為 → 業務操作 + 事件記錄
                ↓
        [業務表] + [user_events]
```

### 表結構

#### `user_events` 表
```sql
CREATE TABLE user_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,           -- 用戶ID
  entity_type TEXT NOT NULL,       -- 實體類型: 'task', 'goal', 'topic'
  entity_id TEXT NOT NULL,         -- 實體ID
  event_type TEXT NOT NULL,        -- 事件類型: 'status_changed', 'check_in', 'record_added'
  content JSONB DEFAULT '{}',      -- 事件詳細內容
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 索引設計
```sql
-- 用戶+實體查詢優化
CREATE INDEX idx_user_events_user_entity ON user_events(user_id, entity_type, entity_id);

-- 用戶+事件類型查詢優化  
CREATE INDEX idx_user_events_user_event_type ON user_events(user_id, event_type);

-- 時間範圍查詢優化
CREATE INDEX idx_user_events_created_at ON user_events(created_at);

-- 近期活動查詢優化
CREATE INDEX idx_user_events_user_date_range ON user_events(user_id, created_at) 
WHERE created_at >= NOW() - INTERVAL '30 days';
```

## 🔧 事件類型定義

### Task 相關事件

| Event Type | 觸發時機 | Content 內容 | 對應業務表 |
|------------|----------|--------------|------------|
| `status_changed` | 任務狀態變更 | `{from_status, to_status, task_title, completed_at}` | `tasks` |
| `check_in` | 任務打卡動作 | `{action_id, action_type, action_data, task_title}` | `task_actions` |
| `record_added` | 新增學習記錄 | `{record_id, content_length, has_attachments, task_title}` | `task_records` |

### Goal 相關事件

| Event Type | 觸發時機 | Content 內容 |
|------------|----------|--------------|
| `created` | 目標創建 | `{goal_title, topic_id}` |
| `updated` | 目標更新 | `{changes, old_values}` |

### Topic 相關事件

| Event Type | 觸發時機 | Content 內容 |
|------------|----------|--------------|
| `created` | 主題創建 | `{topic_title, subject}` |
| `updated` | 主題更新 | `{changes, old_values}` |

## 🛠️ RPC 函數

### 1. 記錄事件
```sql
record_user_event(
  p_entity_type TEXT,
  p_entity_id TEXT, 
  p_event_type TEXT,
  p_content JSONB DEFAULT '{}'
) RETURNS UUID
```

### 2. 查詢事件統計
```sql
get_user_event_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_entity_type TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL
) RETURNS TABLE(date DATE, total_events BIGINT, event_breakdown JSONB)
```

### 3. 任務動作處理（帶事件記錄）
```sql
perform_task_action_transaction(
  p_task_id TEXT,
  p_action_type TEXT,
  p_action_date DATE,
  p_action_timestamp TIMESTAMP WITH TIME ZONE,
  p_user_id UUID,
  p_action_data JSONB DEFAULT '{}'
) RETURNS JSON
```

### 4. 任務記錄處理（帶事件記錄）
```sql
create_task_record_with_event(
  p_task_id TEXT,
  p_content TEXT,
  p_attachments JSONB DEFAULT '[]',
  p_is_ai_generated BOOLEAN DEFAULT false
) RETURNS JSON
```

### 5. 新版每日活動統計
```sql
get_daily_activity_stats_v2(
  p_user_id TEXT,
  p_start_date TEXT, 
  p_end_date TEXT
) RETURNS TABLE(
  date DATE,
  total_activities BIGINT,
  status_changes BIGINT,      -- 所有狀態變更
  completed_tasks BIGINT,     -- 完成任務數量
  check_ins BIGINT,           -- 打卡次數
  records BIGINT,             -- 學習記錄次數
  active_tasks JSONB          -- 詳細活動信息
)
```

## 🚀 實作流程

### 1. 資料庫遷移
```bash
# 1. 建立 user_events 表和相關函數
psql -f user_events_migration.sql

# 2. 更新 safe_update_task 函數
psql -f update_safe_update_task_with_events.sql

# 3. 建立新的事務處理函數
psql -f perform_task_action_with_events.sql

# 4. 建立新的統計查詢函數
psql -f new_get_daily_activity_stats_with_events.sql
```

### 2. 反向生成現有數據
```sql
-- 執行一次性的數據回填
SELECT backfill_user_events_from_existing_data();
```

### 3. 前端代碼調整

#### TopicStore 更新
- 更新頂部註解說明新架構
- 修正類型定義（`check_ins` vs `task_actions`）  
- 確保 `performTaskAction` 使用新的 RPC 函數

#### RetroStore 更新
- 修正欄位映射（`day.records` → `day.task_records`）
- 更新註解說明實際數據含義
- 使用新的統計邏輯

## 📈 效益分析

### 之前的問題
1. **數據分散**：狀態變更、打卡、記錄分別在不同表
2. **統計困難**：需要複雜的 JOIN 和聚合查詢
3. **語義不清**：`status_changes` 實際只計算完成任務
4. **性能問題**：多表查詢效率低

### 現在的優勢
1. **統一追蹤**：所有用戶行為都在 `user_events` 表
2. **高效查詢**：專門的索引優化時間範圍查詢
3. **語義清晰**：明確區分狀態變更、打卡、記錄
4. **擴展性強**：輕鬆添加新的事件類型

## 🔍 查詢範例

### 獲取用戶某天的所有活動
```sql
SELECT * FROM user_events 
WHERE user_id = 'xxx' 
  AND created_at::date = '2025-01-15'
ORDER BY created_at;
```

### 統計用戶每日打卡次數
```sql
SELECT 
  created_at::date as date,
  COUNT(*) as check_in_count
FROM user_events 
WHERE user_id = 'xxx' 
  AND event_type = 'check_in'
  AND created_at >= '2025-01-01'
GROUP BY created_at::date
ORDER BY date;
```

### 查看任務狀態變更歷史
```sql
SELECT 
  created_at,
  content->>'from_status' as from_status,
  content->>'to_status' as to_status,
  content->>'task_title' as task_title
FROM user_events 
WHERE entity_type = 'task' 
  AND entity_id = 'task_xxx'
  AND event_type = 'status_changed'
ORDER BY created_at;
```

## 🚨 注意事項

1. **事務一致性**：所有業務操作都使用帶事件記錄的 RPC 函數
2. **向後兼容**：保留舊的 API 介面，內部使用新的實現
3. **性能監控**：定期檢查索引效能和查詢計劃
4. **數據完整性**：確保反向生成的數據正確性

## 🔮 未來擴展

1. **更多事件類型**：協作邀請、檔案上傳等
2. **實時通知**：基於事件的即時推送
3. **行為分析**：用戶學習模式分析
4. **成就系統**：基於事件的成就觸發 