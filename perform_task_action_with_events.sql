-- 建立新的 perform_task_action_transaction 函數
-- 同時記錄到 task_actions 和 user_events 表

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

-- 建立用於記錄任務記錄並同時記錄事件的函數
CREATE OR REPLACE FUNCTION create_task_record_with_event(
  p_task_id TEXT,
  p_content TEXT,
  p_attachments JSONB DEFAULT '[]',
  p_is_ai_generated BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_id UUID;
  event_id UUID;
  task_title TEXT;
  current_user_id UUID;
BEGIN
  -- 獲取當前用戶
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not authenticated');
  END IF;
  
  -- 獲取任務標題用於事件記錄
  SELECT title INTO task_title FROM tasks WHERE id = p_task_id::uuid;
  
  IF task_title IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  -- 1. 記錄到 task_records 表
  INSERT INTO task_records (
    task_id,
    author_id,
    content,
    attachments,
    is_ai_generated
  )
  VALUES (
    p_task_id,
    current_user_id,
    p_content,
    p_attachments,
    p_is_ai_generated
  )
  RETURNING id INTO record_id;
  
  -- 2. 記錄到 user_events 表
  SELECT record_user_event(
    'task',
    p_task_id,
    'record_added',
    jsonb_build_object(
      'record_id', record_id,
      'content_length', length(p_content),
      'has_attachments', (p_attachments IS NOT NULL AND jsonb_array_length(p_attachments) > 0),
      'is_ai_generated', p_is_ai_generated,
      'task_title', task_title
    )
  ) INTO event_id;
  
  -- 返回成功結果
  RETURN json_build_object(
    'success', true,
    'message', 'Task record created successfully',
    'record_id', record_id,
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