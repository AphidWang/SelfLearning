# Supabase RPC 函數文檔

本文檔記錄了專案中所有的 Supabase RPC (Remote Procedure Call) 函數，包括其功能、參數和使用場景。

## 📋 目錄

- [任務管理系統](#任務管理系統)
- [版本控制與樂觀鎖定](#版本控制與樂觀鎖定)
- [任務動作與打卡系統](#任務動作與打卡系統)
- [週挑戰系統](#週挑戰系統)
- [日記系統](#日記系統)
- [工具函數](#工具函數)

---

## 任務管理系統

### `get_active_tasks_for_user(p_user_id uuid)`
**功能**: 獲取用戶的所有活躍任務  
**用途**: TaskWall 頁面快速查詢用戶的進行中任務  
**返回**: 任務列表，包含任務詳情和進度信息  
**調用位置**: `topicStore.getActiveTasksForUser()`

### `get_completed_tasks_for_date(target_date date, target_user_id uuid)`
**功能**: 獲取指定日期用戶完成的任務  
**用途**: 日記系統自動載入當天完成的任務  
**返回**: 指定日期完成的任務列表  
**調用位置**: `journalStore.saveJournalEntry()`

---

## 版本控制與樂觀鎖定

### `safe_update_topic(p_id uuid, p_expected_version integer, ...)`
**功能**: 安全更新主題，帶版本控制  
**用途**: 防止並發編輯衝突  
**參數**: 
- `p_id`: 主題 ID
- `p_expected_version`: 期望的版本號
- 其他更新欄位...
**返回**: 更新結果，包含是否成功和當前版本號  
**調用位置**: `topicStore.updateTopic()`

### `safe_update_goal(p_id uuid, p_expected_version integer, ...)`
**功能**: 安全更新目標，帶版本控制  
**用途**: 防止並發編輯衝突  
**參數**: 
- `p_id`: 目標 ID
- `p_expected_version`: 期望的版本號
- 其他更新欄位...
**返回**: 更新結果，包含是否成功和當前版本號  
**調用位置**: `topicStore.updateGoal()`

### `safe_update_task(p_id uuid, p_expected_version integer, ...)`
**功能**: 安全更新任務，帶版本控制  
**用途**: 防止並發編輯衝突  
**參數**: 
- `p_id`: 任務 ID
- `p_expected_version`: 期望的版本號
- 其他更新欄位...
**返回**: 更新結果，包含是否成功和當前版本號  
**調用位置**: `topicStore.updateTask()`

---

## 任務動作與打卡系統

### `perform_task_action_transaction(p_task_id uuid, p_action_type text, p_action_date date, p_action_timestamp timestamp, p_user_id uuid, p_action_data jsonb)`
**功能**: 執行任務動作的完整事務處理  
**用途**: 確保任務動作記錄和進度更新的原子性  
**參數**: 
- `p_task_id`: 任務 ID
- `p_action_type`: 動作類型 ('check_in', 'reset' 等)
- `p_action_date`: 動作日期
- `p_action_timestamp`: 動作時間戳
- `p_user_id`: 用戶 ID
- `p_action_data`: 額外數據 (可選)
**返回**: 執行結果和更新後的任務數據  
**調用位置**: `topicStore.performTaskAction()`  
**特點**: 🔒 **Transaction 保證數據一致性**

### `get_tasks_with_full_data(p_task_ids uuid[], p_goal_ids uuid[], p_topic_ids uuid[], p_start_date date, p_end_date date, p_include_actions boolean, p_include_records boolean)`
**功能**: 獲取完整的 Task 數據，一次性 JOIN 所有相關數據  
**用途**: 統一的 Task 數據獲取，避免多次查詢  
**參數**: 
- `p_task_ids`: 指定任務 ID 列表 (可選)
- `p_goal_ids`: 指定目標 ID 列表 (可選)
- `p_topic_ids`: 指定主題 ID 列表 (可選)
- `p_start_date`: 日期範圍開始 (可選)
- `p_end_date`: 日期範圍結束 (可選)
- `p_include_actions`: 是否包含 task_actions
- `p_include_records`: 是否包含 task_records
**返回**: Task 列表，包含完整的 actions 和 records 數據  
**調用位置**: `topicStore.getTasksWithFullData()`  
**特點**: 🚀 **O(1) JOIN 查詢，高性能**

### `get_user_task_activities_for_date(p_date date)`
**功能**: 獲取指定日期的用戶任務活動摘要  
**用途**: 為 DailyJournal 提供完整的當日活動數據  
**參數**: 
- `p_date`: 查詢日期
**返回**: 包含完成任務、打卡記錄、學習記錄的完整活動列表  
**調用位置**: `topicStore.getUserTaskActivitiesForDate()`  
**特點**: 🎯 **專為 DailyJournal 優化**

### `get_topics_progress_for_week(p_week_start date, p_week_end date)`
**功能**: 獲取指定週期的主題進度摘要  
**用途**: 為 retroStore 提供週回顧數據，包含沒有活動的主題  
**參數**: 
- `p_week_start`: 週開始日期
- `p_week_end`: 週結束日期
**返回**: 主題列表，包含進度快照和活動統計  
**調用位置**: `topicStore.getTopicsProgressForWeek()`  
**特點**: 📊 **包含所有活躍主題，即使沒有本週活動**

### `get_active_topics_with_progress()`
**功能**: 獲取所有活躍主題及其進度信息  
**用途**: 為 retroStore 提供完整的主題列表和進度  
**返回**: 活躍主題列表，包含完成率和最近活動狀態  
**調用位置**: `topicStore.getActiveTopicsWithProgress()`  
**特點**: 🔄 **包含最近活動檢查**

### `cancel_today_check_in_transaction(p_task_id uuid, p_user_id uuid, p_today date)`
**功能**: 取消今日打卡的完整事務處理  
**用途**: 確保取消打卡記錄和進度更新的原子性  
**參數**: 
- `p_task_id`: 任務 ID
- `p_user_id`: 用戶 ID
- `p_today`: 今天的日期
**返回**: 執行結果和更新後的任務數據  
**調用位置**: `topicStore.cancelTodayCheckIn()`  
**特點**: 🔒 **Transaction 保證數據一致性**

### `task_check_in(task_uuid uuid, user_uuid uuid, note_text text)`
**功能**: 任務打卡 (舊版本)  
**狀態**: ⚠️ **已棄用**，請使用 `perform_task_action_transaction`  
**用途**: 記錄任務打卡

### `cancel_task_check_in(task_uuid uuid, user_uuid uuid)`
**功能**: 取消任務打卡 (舊版本)  
**狀態**: ⚠️ **已棄用**，請使用 `cancel_today_check_in_transaction`  
**用途**: 取消任務打卡記錄

### `get_task_check_in_history(task_uuid uuid, user_uuid uuid)`
**功能**: 獲取任務打卡歷史記錄  
**用途**: 顯示任務的打卡歷史  
**返回**: 打卡記錄列表  
**調用位置**: TaskCard 背面顯示打卡歷史

---

## 週挑戰系統

### `get_current_weekly_challenge(user_uuid uuid)`
**功能**: 獲取用戶當前的週挑戰  
**用途**: 載入用戶的週挑戰任務  
**返回**: 當前週挑戰信息

### `weekly_challenge_check_in(challenge_uuid uuid, user_uuid uuid, note_text text)`
**功能**: 週挑戰打卡  
**用途**: 記錄週挑戰的打卡動作  
**參數**: 
- `challenge_uuid`: 週挑戰 ID
- `user_uuid`: 用戶 ID
- `note_text`: 打卡備註

### `cancel_weekly_challenge_check_in(challenge_uuid uuid, user_uuid uuid)`
**功能**: 取消週挑戰打卡  
**用途**: 取消今日的週挑戰打卡記錄

### `get_today_check_in_status(challenge_uuid uuid, user_uuid uuid)`
**功能**: 獲取今日週挑戰打卡狀態  
**用途**: 檢查用戶今天是否已經完成週挑戰打卡  
**返回**: 打卡狀態信息

### `get_weekly_challenge_stats(challenge_uuid uuid)`
**功能**: 獲取週挑戰統計信息  
**用途**: 顯示週挑戰的完成情況統計  
**返回**: 週挑戰統計數據

### `check_daily_check_in(challenge_uuid uuid, user_uuid uuid)`
**功能**: 檢查每日打卡狀態  
**用途**: 驗證用戶的每日打卡記錄

---

## 日記系統

### `get_completed_tasks_for_date(target_date date, target_user_id uuid)`
**功能**: 獲取指定日期完成的任務  
**用途**: 日記系統自動載入當天完成的任務  
**返回**: 任務列表  
**調用位置**: `journalStore.saveJournalEntry()`

---

## 工具函數

### `update_updated_at_column()`
**功能**: 更新 updated_at 欄位的觸發器函數  
**用途**: 自動更新記錄的修改時間  
**類型**: 觸發器函數

### `update_version_and_timestamp()`
**功能**: 更新版本號和時間戳的觸發器函數  
**用途**: 自動遞增版本號並更新時間戳  
**類型**: 觸發器函數

### `update_daily_journals_updated_at()`
**功能**: 更新日記的修改時間  
**用途**: 日記表的時間戳維護  
**類型**: 觸發器函數

### `update_task_actions_updated_at()`
**功能**: 更新任務動作的修改時間  
**用途**: 任務動作表的時間戳維護  
**類型**: 觸發器函數

---

## 🔧 開發指南

### 新增 RPC 函數時的注意事項

1. **命名規範**: 使用描述性的名稱，遵循 `動詞_名詞_補充` 的格式
2. **參數命名**: 使用 `p_` 前綴表示參數
3. **錯誤處理**: 始終包含適當的錯誤處理邏輯
4. **文檔更新**: 新增函數後務必更新此文檔
5. **測試**: 為新增的 RPC 函數編寫對應的測試用例

### Transaction 函數的特點

- ✅ 保證數據一致性
- ✅ 支援錯誤回滾
- ✅ 適用於複雜的多表操作
- ⚠️ 需要仔細處理錯誤情況

### 已棄用的函數

以下函數已被新的 transaction 版本取代：
- `task_check_in` → `perform_task_action_transaction`
- `cancel_task_check_in` → `cancel_today_check_in_transaction`

---

## 📊 函數統計

- **總函數數量**: 20 個
- **任務管理**: 3 個
- **版本控制**: 3 個
- **任務動作**: 6 個 (包含 2 個新的 transaction 函數)
- **週挑戰**: 6 個
- **日記系統**: 1 個
- **工具函數**: 4 個

---

## 🔄 最近更新

- **2024-01-08**: 新增 `perform_task_action_transaction` 和 `cancel_today_check_in_transaction` 函數
- **2024-01-08**: 標記舊版本的打卡函數為已棄用
- **2024-01-08**: 建立此文檔 

---
# Supabase RPC Function SQL 實作

---
-- safe_update_topic
---
```sql
CREATE OR REPLACE FUNCTION safe_update_topic(
  p_topic_id UUID,
  p_expected_version INTEGER,
  p_updates JSONB
) RETURNS JSONB AS $$
DECLARE
  v_current_version INTEGER;
  v_result JSONB;
BEGIN
  -- 檢查版本號
  SELECT version INTO v_current_version
  FROM topics
  WHERE id = p_topic_id;

  IF v_current_version IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '主題不存在');
  END IF;

  IF v_current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', '版本衝突',
      'current_version', v_current_version
    );
  END IF;

  -- 執行更新，版本號+1
  UPDATE topics 
  SET 
    title = COALESCE((p_updates->>'title')::VARCHAR, title),
    description = COALESCE(p_updates->>'description', description),
    subject = COALESCE(p_updates->>'subject', subject),
    status = COALESCE(p_updates->>'status', status),
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_topic_id
  RETURNING to_jsonb(topics.*) INTO v_result;

  RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---
-- safe_update_goal
---
```sql
CREATE OR REPLACE FUNCTION safe_update_goal(
  p_goal_id UUID,
  p_expected_version INTEGER,
  p_updates JSONB
) RETURNS JSONB AS $$
DECLARE
  v_current_version INTEGER;
  v_result JSONB;
BEGIN
  -- 檢查版本號
  SELECT version INTO v_current_version
  FROM goals
  WHERE id = p_goal_id;

  IF v_current_version IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '目標不存在');
  END IF;

  IF v_current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', '版本衝突',
      'current_version', v_current_version
    );
  END IF;

  -- 執行更新，版本號+1
  UPDATE goals 
  SET 
    title = COALESCE((p_updates->>'title')::VARCHAR, title),
    description = COALESCE(p_updates->>'description', description),
    status = COALESCE(p_updates->>'status', status),
    priority = COALESCE(p_updates->>'priority', priority),
    need_help = COALESCE((p_updates->>'need_help')::BOOLEAN, need_help),
    help_message = COALESCE(p_updates->>'help_message', help_message),
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_goal_id
  RETURNING to_jsonb(goals.*) INTO v_result;

  RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---
-- safe_update_task
---
```sql
CREATE OR REPLACE FUNCTION safe_update_task(
  p_task_id UUID,
  p_expected_version INTEGER,
  p_updates JSONB
) RETURNS JSONB AS $$
DECLARE
  v_current_version INTEGER;
  v_result JSONB;
BEGIN
  -- 檢查版本號
  SELECT version INTO v_current_version
  FROM tasks
  WHERE id = p_task_id;

  IF v_current_version IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '任務不存在');
  END IF;

  IF v_current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', '版本衝突',
      'current_version', v_current_version
    );
  END IF;

  -- 執行更新，版本號+1
  UPDATE tasks 
  SET 
    title = COALESCE((p_updates->>'title')::VARCHAR, title),
    description = COALESCE(p_updates->>'description', description),
    status = COALESCE(p_updates->>'status', status),
    priority = COALESCE(p_updates->>'priority', priority),
    need_help = COALESCE((p_updates->>'need_help')::BOOLEAN, need_help),
    help_message = COALESCE(p_updates->>'help_message', help_message),
    completed_at = CASE 
      WHEN p_updates->>'status' = 'done' THEN NOW()
      WHEN p_updates->>'status' != 'done' THEN NULL
      ELSE completed_at
    END,
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_task_id
  RETURNING to_jsonb(tasks.*) INTO v_result;

  RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---
-- get_active_tasks_for_user
---
```sql
CREATE OR REPLACE FUNCTION get_active_tasks_for_user(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  task_id UUID,
  task_title VARCHAR,
  task_description TEXT,
  task_status VARCHAR,
  task_priority VARCHAR,
  task_due_date TIMESTAMP WITH TIME ZONE,
  task_need_help BOOLEAN,
  goal_id UUID,
  goal_title VARCHAR,
  topic_id UUID,
  topic_title VARCHAR,
  topic_subject VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.need_help,
    g.id,
    g.title,
    tn.id,
    tn.title,
    tn.subject
  FROM tasks t
  JOIN goals g ON t.goal_id = g.id
  JOIN topics tn ON g.topic_id = tn.id
  LEFT JOIN topic_collaborators tc ON tn.id = tc.topic_id
  WHERE 
    t.status IN ('todo', 'in_progress')
    AND g.status != 'archived'
    AND tn.status != 'archived'
    AND (
      tn.owner_id = COALESCE(p_user_id, auth.uid()) OR
      tc.user_id = COALESCE(p_user_id, auth.uid())
    )
  ORDER BY 
    CASE t.status WHEN 'in_progress' THEN 1 ELSE 2 END,
    CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    t.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---
-- get_topic_with_structure
---
```sql
CREATE OR REPLACE FUNCTION get_topic_with_structure(p_topic_id UUID)
RETURNS TABLE (
  topic_data JSONB,
  goals_data JSONB,
  tasks_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_info AS (
    SELECT to_jsonb(tn.*) as topic_json
    FROM topics tn
    WHERE tn.id = p_topic_id
  ),
  goals_info AS (
    SELECT jsonb_agg(to_jsonb(g.*)) as goals_json
    FROM goals g
    WHERE g.topic_id = p_topic_id
    AND g.status != 'archived'
  ),
  tasks_info AS (
    SELECT jsonb_agg(to_jsonb(t.*)) as tasks_json
    FROM tasks t
    JOIN goals g ON t.goal_id = g.id
    WHERE g.topic_id = p_topic_id
    AND t.status != 'archived'
    AND g.status != 'archived'
  )
  SELECT 
    ti.topic_json,
    COALESCE(gi.goals_json, '[]'::jsonb),
    COALESCE(tsi.tasks_json, '[]'::jsonb)
  FROM topic_info ti
  CROSS JOIN goals_info gi
  CROSS JOIN tasks_info tsi;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---
-- perform_task_action_transaction
---
```sql
CREATE OR REPLACE FUNCTION perform_task_action_transaction(
  p_task_id TEXT,
  p_action_type TEXT,
  p_action_date DATE,
  p_action_timestamp TIMESTAMP WITH TIME ZONE,
  p_user_id UUID,
  p_action_data JSONB DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_id UUID;
  event_id UUID;
  task_title TEXT;
  result JSON;
BEGIN
  -- 檢查用戶權限
  IF auth.uid() != p_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;
  
  -- 獲取任務標題用於事件記錄
  SELECT title INTO task_title FROM tasks WHERE id = p_task_id::uuid;
  
  IF task_title IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  -- 檢查是否今天已經執行過相同動作（避免重複打卡）
  IF EXISTS (
    SELECT 1 FROM task_actions 
    WHERE task_id = p_task_id 
      AND action_type = p_action_type 
      AND action_timestamp::date = p_action_date
      AND user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Action already performed today');
  END IF;
  
  -- 1. 記錄到 task_actions 表
  INSERT INTO task_actions (
    task_id, 
    action_type, 
    action_timestamp,
    action_date,
    user_id, 
    action_data
  )
  VALUES (
    p_task_id,
    p_action_type,
    p_action_timestamp,
    p_action_date,
    p_user_id,
    p_action_data
  )
  RETURNING id INTO action_id;
  
  -- 2. 記錄到 user_events 表
  SELECT record_user_event(
    'task',
    p_task_id,
    'check_in',
    jsonb_build_object(
      'action_id', action_id,
      'action_type', p_action_type,
      'action_data', p_action_data,
      'task_title', task_title
    )
  ) INTO event_id;
  
  -- 返回成功結果
  RETURN json_build_object(
    'success', true,
    'message', 'Task action recorded successfully',
    'action_id', action_id,
    'event_id', event_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- 發生錯誤時回滾事務
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;
``` 