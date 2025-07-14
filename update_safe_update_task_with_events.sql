-- 更新 safe_update_task 函數以支援自動事件記錄
CREATE OR REPLACE FUNCTION public.safe_update_task(
  p_id uuid, 
  p_expected_version integer, 
  p_title text DEFAULT NULL::text, 
  p_description text DEFAULT NULL::text, 
  p_status text DEFAULT NULL::text, 
  p_priority text DEFAULT NULL::text, 
  p_order_index integer DEFAULT NULL::integer, 
  p_need_help boolean DEFAULT NULL::boolean, 
  p_help_message text DEFAULT NULL::text, 
  p_reply_message text DEFAULT NULL::text, 
  p_reply_at timestamp with time zone DEFAULT NULL::timestamp with time zone, 
  p_replied_by uuid DEFAULT NULL::uuid, 
  p_completed_at timestamp with time zone DEFAULT NULL::timestamp with time zone, 
  p_completed_by uuid DEFAULT NULL::uuid, 
  p_estimated_minutes integer DEFAULT NULL::integer, 
  p_actual_minutes integer DEFAULT NULL::integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_version INTEGER;
  new_version INTEGER;
  old_status TEXT;
  current_user_id UUID;
  result JSON;
  event_id UUID;
BEGIN
  -- 獲取當前用戶
  current_user_id := auth.uid();
  
  -- 檢查當前版本和狀態
  SELECT version, status INTO current_version, old_status FROM tasks WHERE id = p_id;
  
  IF current_version IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  IF current_version != p_expected_version THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Version conflict detected',
      'current_version', current_version,
      'expected_version', p_expected_version
    );
  END IF;
  
  new_version := current_version + 1;
  
  -- 更新任務，特別處理 completed_at 和 completed_by
  UPDATE tasks SET
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    status = COALESCE(p_status, status),
    priority = COALESCE(p_priority, priority),
    order_index = COALESCE(p_order_index, order_index),
    need_help = COALESCE(p_need_help, need_help),
    help_message = COALESCE(p_help_message, help_message),
    reply_message = COALESCE(p_reply_message, reply_message),
    reply_at = COALESCE(p_reply_at, reply_at),
    replied_by = COALESCE(p_replied_by, replied_by),
    -- 特別處理 completed_at: 如果狀態不是 'done' 且明確傳遞了 NULL，則設為 NULL
    completed_at = CASE 
      WHEN p_status IS NOT NULL AND p_status != 'done' THEN NULL
      WHEN p_completed_at IS NOT NULL THEN p_completed_at
      WHEN p_status = 'done' AND completed_at IS NULL THEN NOW()
      ELSE completed_at
    END,
    -- 特別處理 completed_by: 如果狀態不是 'done' 且明確傳遞了 NULL，則設為 NULL
    completed_by = CASE 
      WHEN p_status IS NOT NULL AND p_status != 'done' THEN NULL
      WHEN p_completed_by IS NOT NULL THEN p_completed_by
      WHEN p_status = 'done' AND completed_by IS NULL THEN current_user_id
      ELSE completed_by
    END,
    estimated_minutes = COALESCE(p_estimated_minutes, estimated_minutes),
    actual_minutes = COALESCE(p_actual_minutes, actual_minutes),
    version = new_version,
    updated_at = now()
  WHERE id = p_id;
  
  -- 如果狀態有變更，記錄事件到 user_events
  IF p_status IS NOT NULL AND p_status != old_status AND current_user_id IS NOT NULL THEN
    SELECT record_user_event(
      'task',
      p_id::text,
      'status_changed',
      jsonb_build_object(
        'from_status', old_status,
        'to_status', p_status,
        'task_title', COALESCE(p_title, (SELECT title FROM tasks WHERE id = p_id)),
        'completed_at', CASE 
          WHEN p_status = 'done' THEN COALESCE(p_completed_at, NOW())
          ELSE NULL 
        END
      )
    ) INTO event_id;
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Task updated successfully',
    'new_version', new_version,
    'event_id', event_id
  );
END;
$function$ 