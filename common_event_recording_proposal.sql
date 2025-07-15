-- 通用 Event 記錄機制提案
-- 這個檔案展示如何建立一個統一的 event 記錄系統

-- 1. 改進現有的 record_user_event 函數，增加更多驗證和錯誤處理
CREATE OR REPLACE FUNCTION public.record_user_event_enhanced(
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_event_type TEXT,
  p_content JSONB DEFAULT '{}'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb -- 新增 metadata 欄位用於額外資訊
)
RETURNS TABLE(
  success BOOLEAN,
  event_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_event_id UUID;
  domain_prefix TEXT;
BEGIN
  -- 驗證 entity_type 是否有效
  IF p_entity_type NOT IN ('task', 'goal', 'topic', 'user', 'retro', 'challenge') THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Invalid entity_type: ' || p_entity_type;
    RETURN;
  END IF;
  
  -- 確保 event_type 有 domain prefix (按照記憶中的規範)
  domain_prefix := split_part(p_event_type, '.', 1);
  IF domain_prefix = p_event_type THEN
    -- 沒有 domain prefix，自動加上
    p_event_type := p_entity_type || '.' || p_event_type;
  END IF;
  
  -- 插入事件記錄
  INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content, metadata)
  VALUES (p_user_id, p_entity_type, p_entity_id, p_event_type, p_content, p_metadata)
  RETURNING id INTO new_event_id;
  
  RETURN QUERY SELECT true, new_event_id, 'Event recorded successfully';
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Error recording event: ' || SQLERRM;
END;
$$;

-- 2. 通用的 "帶事件記錄的動作執行" 函數
CREATE OR REPLACE FUNCTION public.execute_action_with_event(
  p_action_type TEXT, -- 'task_action', 'task_record', 'status_change', etc.
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_action_data JSONB,
  p_event_type TEXT DEFAULT NULL, -- 如果為 NULL 會自動生成
  p_event_content JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  success BOOLEAN,
  action_result JSONB,
  event_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_type TEXT;
  v_event_id UUID;
  v_action_result JSONB;
  v_event_result RECORD;
BEGIN
  -- 自動生成 event_type 如果沒有提供
  IF p_event_type IS NULL THEN
    v_event_type := p_entity_type || '.' || p_action_type;
  ELSE
    v_event_type := p_event_type;
  END IF;
  
  -- 根據 action_type 執行不同的動作
  CASE p_action_type
    WHEN 'task_action' THEN
      -- 執行任務動作（打卡等）
      INSERT INTO task_actions (
        task_id, user_id, action_type, action_date, action_timestamp, action_data
      ) VALUES (
        p_entity_id::UUID, p_user_id, 
        p_action_data->>'action_type',
        (p_action_data->>'action_date')::DATE,
        (p_action_data->>'action_timestamp')::TIMESTAMP WITH TIME ZONE,
        p_action_data
      );
      v_action_result := jsonb_build_object('type', 'task_action', 'task_id', p_entity_id);
      
    WHEN 'task_record' THEN
      -- 建立任務記錄
      DECLARE
        record_id UUID;
      BEGIN
        INSERT INTO task_records (task_id, user_id, content, attachments, is_ai_generated)
        VALUES (
          p_entity_id, p_user_id,
          p_action_data->>'content',
          COALESCE(p_action_data->'attachments', '[]'::jsonb),
          COALESCE((p_action_data->>'is_ai_generated')::BOOLEAN, false)
        ) RETURNING id INTO record_id;
        
        v_action_result := jsonb_build_object('type', 'task_record', 'record_id', record_id);
      END;
      
    WHEN 'status_change' THEN
      -- 狀態變更（需要根據 entity_type 決定更新哪個表）
      IF p_entity_type = 'task' THEN
        UPDATE tasks SET 
          status = p_action_data->>'new_status',
          completed_at = CASE 
            WHEN p_action_data->>'new_status' = 'done' THEN NOW()
            ELSE completed_at
          END,
          completed_by = CASE 
            WHEN p_action_data->>'new_status' = 'done' THEN p_user_id
            ELSE completed_by
          END,
          updated_at = NOW()
        WHERE id = p_entity_id::UUID;
      END IF;
      
      v_action_result := jsonb_build_object(
        'type', 'status_change', 
        'entity_id', p_entity_id,
        'old_status', p_action_data->>'old_status',
        'new_status', p_action_data->>'new_status'
      );
      
    ELSE
      RETURN QUERY SELECT false, NULL::JSONB, NULL::UUID, 'Unknown action_type: ' || p_action_type;
      RETURN;
  END CASE;
  
  -- 記錄事件
  SELECT * INTO v_event_result
  FROM record_user_event_enhanced(
    p_user_id, p_entity_type, p_entity_id, v_event_type, 
    p_event_content || jsonb_build_object('action_data', p_action_data)
  );
  
  IF v_event_result.success THEN
    RETURN QUERY SELECT true, v_action_result, v_event_result.event_id, 'Action completed with event recorded';
  ELSE
    -- 如果事件記錄失敗，回滾整個 transaction
    RAISE EXCEPTION 'Failed to record event: %', v_event_result.message;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::JSONB, NULL::UUID, 'Transaction failed: ' || SQLERRM;
END;
$$;

-- 3. 簡化的包裝函數範例 - 任務打卡
CREATE OR REPLACE FUNCTION public.task_check_in_with_event(
  p_task_id TEXT,
  p_user_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  event_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result
  FROM execute_action_with_event(
    'task_action',
    p_user_id,
    'task',
    p_task_id,
    jsonb_build_object(
      'action_type', 'check_in',
      'action_date', CURRENT_DATE,
      'action_timestamp', NOW(),
      'note', p_note
    ),
    'task.check_in',
    jsonb_build_object('note', p_note)
  );
  
  RETURN QUERY SELECT v_result.success, v_result.message, v_result.event_id;
END;
$$;

-- 4. 簡化的包裝函數範例 - 任務完成
CREATE OR REPLACE FUNCTION public.complete_task_with_event(
  p_task_id TEXT,
  p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  event_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result RECORD;
  v_old_status TEXT;
BEGIN
  -- 獲取舊狀態
  SELECT status INTO v_old_status FROM tasks WHERE id = p_task_id::UUID;
  
  SELECT * INTO v_result
  FROM execute_action_with_event(
    'status_change',
    p_user_id,
    'task',
    p_task_id,
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', 'done'
    ),
    'task.status_changed',
    jsonb_build_object(
      'from_status', v_old_status,
      'to_status', 'done',
      'completed_at', NOW()
    )
  );
  
  RETURN QUERY SELECT v_result.success, v_result.message, v_result.event_id;
END;
$$;

-- 使用範例說明:
/*
1. 統一的事件記錄:
   SELECT * FROM record_user_event_enhanced(
     '550e8400-e29b-41d4-a716-446655440000'::UUID,
     'task', 'task-123', 'custom_action', 
     '{"data": "value"}'::jsonb
   );

2. 通用動作執行:
   SELECT * FROM execute_action_with_event(
     'task_action', 
     '550e8400-e29b-41d4-a716-446655440000'::UUID,
     'task', 'task-123',
     '{"action_type": "check_in", "note": "完成今日練習"}'::jsonb
   );

3. 簡化的專用函數:
   SELECT * FROM task_check_in_with_event('task-123', user_id, '今日完成');
   SELECT * FROM complete_task_with_event('task-123', user_id);
*/ 