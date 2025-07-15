-- Topic Store RPC Functions Migration
-- 定義所有 topicStore 相關的 RPC 函數
-- Created: 2025-01-15

-- ============================================================================
-- 1. Safe Update Functions (樂觀鎖定)
-- ============================================================================

-- Safe update topic with version control
CREATE OR REPLACE FUNCTION public.safe_update_topic(
  p_id UUID,
  p_expected_version INTEGER,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_subject TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_topic_type TEXT DEFAULT NULL,
  p_is_collaborative BOOLEAN DEFAULT NULL,
  p_show_avatars BOOLEAN DEFAULT NULL,
  p_due_date TIMESTAMPTZ DEFAULT NULL,
  p_focus_element TEXT DEFAULT NULL,
  p_bubbles JSONB DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  current_version INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_version INTEGER;
  v_updated_count INTEGER;
BEGIN
  -- 檢查當前版本
  SELECT version INTO v_current_version
  FROM topics
  WHERE id = p_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Topic not found', 0;
    RETURN;
  END IF;
  
  -- 檢查版本衝突
  IF v_current_version != p_expected_version THEN
    RETURN QUERY SELECT FALSE, 'Version conflict detected', v_current_version;
    RETURN;
  END IF;
  
  -- 執行更新
  UPDATE topics SET
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    status = COALESCE(p_status, status),
    subject = COALESCE(p_subject, subject),
    category = COALESCE(p_category, category),
    topic_type = COALESCE(p_topic_type, topic_type),
    is_collaborative = COALESCE(p_is_collaborative, is_collaborative),
    show_avatars = COALESCE(p_show_avatars, show_avatars),
    due_date = COALESCE(p_due_date, due_date),
    focus_element = COALESCE(p_focus_element, focus_element),
    bubbles = COALESCE(p_bubbles, bubbles),
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_id AND version = p_expected_version;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  IF v_updated_count = 0 THEN
    RETURN QUERY SELECT FALSE, 'Update failed - concurrent modification', v_current_version;
  ELSE
    RETURN QUERY SELECT TRUE, 'Update successful', v_current_version + 1;
  END IF;
END;
$$;

-- Safe update goal with version control
CREATE OR REPLACE FUNCTION public.safe_update_goal(
  p_id UUID,
  p_expected_version INTEGER,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_order_index INTEGER DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  current_version INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_version INTEGER;
  v_updated_count INTEGER;
BEGIN
  -- 檢查當前版本
  SELECT version INTO v_current_version
  FROM goals
  WHERE id = p_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Goal not found', 0;
    RETURN;
  END IF;
  
  -- 檢查版本衝突
  IF v_current_version != p_expected_version THEN
    RETURN QUERY SELECT FALSE, 'Version conflict detected', v_current_version;
    RETURN;
  END IF;
  
  -- 執行更新
  UPDATE goals SET
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    status = COALESCE(p_status, status),
    priority = COALESCE(p_priority, priority),
    order_index = COALESCE(p_order_index, order_index),
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_id AND version = p_expected_version;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  IF v_updated_count = 0 THEN
    RETURN QUERY SELECT FALSE, 'Update failed - concurrent modification', v_current_version;
  ELSE
    RETURN QUERY SELECT TRUE, 'Update successful', v_current_version + 1;
  END IF;
END;
$$;

-- Safe update task with version control
CREATE OR REPLACE FUNCTION public.safe_update_task(
  p_id UUID,
  p_expected_version INTEGER,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_order_index INTEGER DEFAULT NULL,
  p_need_help BOOLEAN DEFAULT NULL,
  p_help_message TEXT DEFAULT NULL,
  p_reply_message TEXT DEFAULT NULL,
  p_reply_at TIMESTAMPTZ DEFAULT NULL,
  p_replied_by UUID DEFAULT NULL,
  p_completed_at TIMESTAMPTZ DEFAULT NULL,
  p_completed_by UUID DEFAULT NULL,
  p_estimated_minutes INTEGER DEFAULT NULL,
  p_actual_minutes INTEGER DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  current_version INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_version INTEGER;
  v_updated_count INTEGER;
BEGIN
  -- 檢查當前版本
  SELECT version INTO v_current_version
  FROM tasks
  WHERE id = p_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Task not found', 0;
    RETURN;
  END IF;
  
  -- 檢查版本衝突
  IF v_current_version != p_expected_version THEN
    RETURN QUERY SELECT FALSE, 'Version conflict detected', v_current_version;
    RETURN;
  END IF;
  
  -- 執行更新
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
    completed_at = COALESCE(p_completed_at, completed_at),
    completed_by = COALESCE(p_completed_by, completed_by),
    estimated_minutes = COALESCE(p_estimated_minutes, estimated_minutes),
    actual_minutes = COALESCE(p_actual_minutes, actual_minutes),
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_id AND version = p_expected_version;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  IF v_updated_count = 0 THEN
    RETURN QUERY SELECT FALSE, 'Update failed - concurrent modification', v_current_version;
  ELSE
    RETURN QUERY SELECT TRUE, 'Update successful', v_current_version + 1;
  END IF;
END;
$$;

-- ============================================================================
-- 2. Task Action Functions (任務動作處理)
-- ============================================================================

-- 執行任務動作事務（打卡、計數等）
CREATE OR REPLACE FUNCTION public.perform_task_action_transaction(
  p_task_id UUID,
  p_action_type TEXT,
  p_action_date DATE,
  p_action_timestamp TIMESTAMPTZ,
  p_user_id UUID,
  p_action_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  action_id UUID,
  event_id UUID,
  task JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action_id UUID;
  v_event_id UUID;
  v_task_record RECORD;
  v_duplicate_count INTEGER;
BEGIN
  -- 檢查是否已經執行過同樣的動作（避免重複打卡）
  IF p_action_type = 'check_in' THEN
    SELECT COUNT(*) INTO v_duplicate_count
    FROM task_actions
    WHERE task_id = p_task_id
      AND action_type = p_action_type
      AND action_date = p_action_date
      AND user_id = p_user_id;
    
    IF v_duplicate_count > 0 THEN
      RETURN QUERY SELECT FALSE, '今天已經執行過這個動作了', NULL::UUID, NULL::UUID, NULL::JSONB;
      RETURN;
    END IF;
  END IF;
  
  -- 插入任務動作記錄
  INSERT INTO task_actions (
    task_id, action_type, action_date, action_timestamp, user_id, action_data
  ) VALUES (
    p_task_id, p_action_type, p_action_date, p_action_timestamp, p_user_id, p_action_data
  ) RETURNING id INTO v_action_id;
  
  -- 插入統一事件記錄
  INSERT INTO user_events (
    user_id, entity_type, entity_id, event_type, content, created_at
  ) VALUES (
    p_user_id, 'task', p_task_id, 'task.' || p_action_type,
    jsonb_build_object(
      'action_id', v_action_id,
      'action_type', p_action_type,
      'action_data', p_action_data,
      'action_timestamp', p_action_timestamp
    ),
    p_action_timestamp
  ) RETURNING id INTO v_event_id;
  
  -- 獲取更新後的任務資料
  SELECT * INTO v_task_record FROM tasks WHERE id = p_task_id;
  
  RETURN QUERY SELECT TRUE, 'Action performed successfully', v_action_id, v_event_id, to_jsonb(v_task_record);
END;
$$;

-- 取消今日打卡事務
CREATE OR REPLACE FUNCTION public.cancel_today_check_in_transaction(
  p_task_id UUID,
  p_user_id UUID,
  p_today DATE
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  task JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_task_record RECORD;
BEGIN
  -- 刪除今日的打卡記錄
  DELETE FROM task_actions
  WHERE task_id = p_task_id
    AND user_id = p_user_id
    AND action_type = 'check_in'
    AND action_date = p_today;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count = 0 THEN
    RETURN QUERY SELECT FALSE, '今天沒有打卡記錄可以取消', NULL::JSONB;
    RETURN;
  END IF;
  
  -- 同時刪除對應的事件記錄
  DELETE FROM user_events
  WHERE user_id = p_user_id
    AND entity_type = 'task'
    AND entity_id = p_task_id
    AND event_type = 'task.check_in'
    AND DATE(created_at) = p_today;
  
  -- 獲取任務資料
  SELECT * INTO v_task_record FROM tasks WHERE id = p_task_id;
  
  RETURN QUERY SELECT TRUE, 'Check-in cancelled successfully', to_jsonb(v_task_record);
END;
$$;

-- ============================================================================
-- 3. Query Functions (查詢函數)
-- ============================================================================

-- 獲取用戶活躍任務
CREATE OR REPLACE FUNCTION public.get_active_tasks_for_user(
  p_user_id UUID
)
RETURNS TABLE(
  task_id UUID,
  task_title TEXT,
  task_status TEXT,
  task_priority TEXT,
  goal_title TEXT,
  topic_title TEXT,
  topic_subject TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    t.id as task_id,
    t.title as task_title,
    t.status as task_status,
    t.priority as task_priority,
    g.title as goal_title,
    tp.title as topic_title,
    tp.subject as topic_subject
  FROM tasks t
  JOIN goals g ON t.goal_id = g.id
  JOIN topics tp ON g.topic_id = tp.id
  WHERE (t.owner_id = p_user_id OR tp.owner_id = p_user_id)
    AND t.status IN ('todo', 'in_progress')
    AND g.status != 'archived'
    AND tp.status != 'archived'
  ORDER BY 
    CASE t.priority
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 3
      ELSE 4
    END,
    t.order_index,
    t.created_at DESC;
$$;

-- 獲取每日活動統計 v2（基於 user_events）
CREATE OR REPLACE FUNCTION public.get_daily_activity_stats_v2(
  p_user_id UUID,
  p_start_date TEXT,
  p_end_date TEXT
)
RETURNS TABLE(
  date TEXT,
  total_activities BIGINT,
  completed_tasks BIGINT,
  check_ins BIGINT,
  records BIGINT,
  active_tasks JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH date_series AS (
    SELECT generate_series(
      p_start_date::date,
      p_end_date::date,
      interval '1 day'
    )::date as date
  ),
  daily_events AS (
    SELECT 
      DATE(ue.created_at) as event_date,
      ue.event_type,
      ue.entity_id,
      COUNT(*) as event_count
    FROM user_events ue
    WHERE ue.user_id = p_user_id
      AND DATE(ue.created_at) BETWEEN p_start_date::date AND p_end_date::date
      AND ue.entity_type = 'task'
    GROUP BY DATE(ue.created_at), ue.event_type, ue.entity_id
  )
  SELECT 
    ds.date::text,
    COALESCE(SUM(de.event_count), 0) as total_activities,
    COALESCE(SUM(CASE WHEN de.event_type = 'task.status_changed' THEN de.event_count ELSE 0 END), 0) as completed_tasks,
    COALESCE(SUM(CASE WHEN de.event_type = 'task.check_in' THEN de.event_count ELSE 0 END), 0) as check_ins,
    COALESCE(SUM(CASE WHEN de.event_type = 'task.record_added' THEN de.event_count ELSE 0 END), 0) as records,
    COALESCE(
      jsonb_agg(DISTINCT de.entity_id) FILTER (WHERE de.entity_id IS NOT NULL),
      '[]'::jsonb
    ) as active_tasks
  FROM date_series ds
  LEFT JOIN daily_events de ON ds.date = de.event_date
  GROUP BY ds.date
  ORDER BY ds.date;
$$;

-- 獲取回顧週摘要
CREATE OR REPLACE FUNCTION public.get_retro_week_summary(
  p_user_id UUID,
  p_week_start DATE,
  p_week_end DATE
)
RETURNS TABLE(
  daily_data JSONB,
  week_data JSONB,
  completed_data JSONB,
  topics_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_data JSONB;
  v_week_data JSONB;
  v_completed_data JSONB;
  v_topics_data JSONB;
BEGIN
  -- 每日數據統計
  WITH daily_stats AS (
    SELECT 
      DATE(ue.created_at) as date,
      COUNT(*) FILTER (WHERE ue.event_type = 'task.check_in') as check_ins,
      COUNT(*) FILTER (WHERE ue.event_type = 'task.record_added') as records,
      COUNT(*) FILTER (WHERE ue.event_type = 'task.status_changed') as completed_tasks,
      COUNT(*) as total_activities
    FROM user_events ue
    WHERE ue.user_id = p_user_id
      AND DATE(ue.created_at) BETWEEN p_week_start AND p_week_end
      AND ue.entity_type = 'task'
    GROUP BY DATE(ue.created_at)
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', ds.date,
      'dayOfWeek', EXTRACT(dow FROM ds.date),
      'check_ins', COALESCE(dst.check_ins, 0),
      'records', COALESCE(dst.records, 0),
      'completed_tasks', COALESCE(dst.completed_tasks, 0),
      'total_activities', COALESCE(dst.total_activities, 0),
      'active_tasks', '[]'::jsonb
    ) ORDER BY ds.date
  ) INTO v_daily_data
  FROM generate_series(p_week_start, p_week_end, interval '1 day') ds(date)
  LEFT JOIN daily_stats dst ON ds.date::date = dst.date;
  
  -- 週總計數據
  SELECT jsonb_build_object(
    'total_check_ins', COUNT(*) FILTER (WHERE ue.event_type = 'task.check_in'),
    'total_records', COUNT(*) FILTER (WHERE ue.event_type = 'task.record_added'),
    'total_completed', COUNT(*) FILTER (WHERE ue.event_type = 'task.status_changed'),
    'total_activities', COUNT(*),
    'active_days', COUNT(DISTINCT DATE(ue.created_at))
  ) INTO v_week_data
  FROM user_events ue
  WHERE ue.user_id = p_user_id
    AND DATE(ue.created_at) BETWEEN p_week_start AND p_week_end
    AND ue.entity_type = 'task';
  
  -- 完成的任務數據
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'title', t.title,
      'topic', tp.title,
      'goal_title', g.title,
      'completed_at', t.completed_at,
      'difficulty', 3
    )
  ) INTO v_completed_data
  FROM tasks t
  JOIN goals g ON t.goal_id = g.id
  JOIN topics tp ON g.topic_id = tp.id
  WHERE t.status = 'done'
    AND t.completed_at BETWEEN p_week_start AND p_week_end + interval '1 day'
    AND (t.completed_by = p_user_id OR tp.owner_id = p_user_id);
  
  -- 主題數據
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tp.id,
      'title', tp.title,
      'subject', tp.subject,
      'progress', COALESCE(
        ROUND(
          (COUNT(t.id) FILTER (WHERE t.status = 'done'))::numeric * 100.0 / 
          NULLIF(COUNT(t.id), 0), 0
        ), 0
      ),
      'total_tasks', COUNT(t.id),
      'completed_tasks', COUNT(t.id) FILTER (WHERE t.status = 'done'),
      'has_activity', COUNT(ue.id) > 0,
      'week_activities', COUNT(ue.id)
    )
  ) INTO v_topics_data
  FROM topics tp
  LEFT JOIN goals g ON tp.id = g.topic_id
  LEFT JOIN tasks t ON g.id = t.goal_id
  LEFT JOIN user_events ue ON (
    ue.entity_id = t.id 
    AND ue.entity_type = 'task'
    AND ue.user_id = p_user_id
    AND DATE(ue.created_at) BETWEEN p_week_start AND p_week_end
  )
  WHERE tp.owner_id = p_user_id
    AND tp.status != 'archived'
  GROUP BY tp.id, tp.title, tp.subject;
  
  RETURN QUERY SELECT v_daily_data, v_week_data, v_completed_data, v_topics_data;
END;
$$;

-- ============================================================================
-- Grant permissions
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.safe_update_topic TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_update_goal TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_update_task TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_task_action_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_today_check_in_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_tasks_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_activity_stats_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_retro_week_summary TO authenticated; 