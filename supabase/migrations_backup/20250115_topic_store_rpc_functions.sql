-- 首先建立 exec_sql 函數
CREATE OR REPLACE FUNCTION public.exec_sql(sql_statement text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_statement;
END;
$$;

-- 原本的 RPC 函數定義
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

-- 重命名並保持相同功能的 RPC 函數
CREATE OR REPLACE FUNCTION public.get_user_task_activities_summary(
  p_user_id uuid,
  p_week_start date,
  p_week_end date
)
RETURNS TABLE(
  daily_data jsonb,
  week_data jsonb,
  completed_data jsonb,
  topics_data jsonb
)
LANGUAGE plpgsql
AS $function$
DECLARE
  daily_data JSONB;
  week_data JSONB;
  completed_data JSONB;
  topics_data JSONB;
BEGIN
  -- 1. daily_data: 每日 event + 任務 join
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', day_series.date,
      'dayOfWeek', CASE EXTRACT(DOW FROM day_series.date)
        WHEN 0 THEN '日'
        WHEN 1 THEN '一'
        WHEN 2 THEN '二'
        WHEN 3 THEN '三'
        WHEN 4 THEN '四'
        WHEN 5 THEN '五'
        WHEN 6 THEN '六'
      END,
      'check_ins', COALESCE(day_counts.check_ins, 0),
      'records', COALESCE(day_counts.records, 0),
      'completed_tasks', COALESCE(day_counts.completed_tasks, 0),
      'total_activities', COALESCE(day_counts.total_activities, 0),
      'active_tasks', COALESCE(day_counts.active_tasks, '[]'::jsonb)
    )
    ORDER BY day_series.date
  ) INTO daily_data
  FROM generate_series(p_week_start, p_week_end, '1 day'::interval) AS day_series(date)
  LEFT JOIN (
    SELECT 
      DATE(ue.created_at) as event_date,
      COUNT(*) FILTER (WHERE ue.event_type = 'task.check_in') as check_ins,
      COUNT(*) FILTER (WHERE ue.event_type = 'task.record_added') as records,
      COUNT(*) FILTER (WHERE ue.event_type = 'task.status_changed' AND (ue.content->>'to_status') = 'done') as completed_tasks,
      COUNT(DISTINCT ue.entity_id) as total_activities,
      jsonb_agg(
        jsonb_build_object(
          'id', ue.entity_id,
          'title', t.title,
          'subject', COALESCE(topic.subject, '未分類'),
          'goal_title', g.title,
          'task_status', t.status,
          'completed_at', t.completed_at,
          'type', CASE 
            WHEN ue.event_type = 'task.check_in' THEN 'check_in'
            WHEN ue.event_type = 'task.record_added' THEN 'record'
            WHEN ue.event_type = 'task.status_changed' AND (ue.content->>'to_status') = 'done' THEN 'completed'
            ELSE 'other'
          END,
          'action_timestamp', ue.created_at,
          'action_data', ue.content
        )
      ) as active_tasks
    FROM user_events ue
    LEFT JOIN tasks t ON t.id::text = ue.entity_id
    LEFT JOIN goals g ON t.goal_id = g.id
    LEFT JOIN topics topic ON g.topic_id = topic.id
    WHERE ue.user_id = p_user_id
      AND ue.entity_type = 'task'
      AND DATE(ue.created_at) BETWEEN p_week_start AND p_week_end
    GROUP BY DATE(ue.created_at)
  ) day_counts ON day_series.date = day_counts.event_date;

  -- 2. week_data: 週聚合
  SELECT jsonb_build_object(
    'total_check_ins', COALESCE(SUM(CASE WHEN ue.event_type = 'task.check_in' THEN 1 ELSE 0 END), 0),
    'total_records', COALESCE(SUM(CASE WHEN ue.event_type = 'task.record_added' THEN 1 ELSE 0 END), 0),
    'total_completed', COALESCE(SUM(CASE WHEN ue.event_type = 'task.status_changed' AND (ue.content->>'to_status') = 'done' THEN 1 ELSE 0 END), 0),
    'total_activities', COALESCE(COUNT(DISTINCT ue.entity_id), 0),
    'active_days', COALESCE(COUNT(DISTINCT DATE(ue.created_at)), 0)
  ) INTO week_data
  FROM user_events ue
  WHERE ue.user_id = p_user_id
    AND ue.entity_type = 'task'
    AND DATE(ue.created_at) BETWEEN p_week_start AND p_week_end;

  -- 3. completed_data: 用 daily_data 的 active_tasks 算
  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO completed_data
  FROM (
    SELECT DISTINCT ON (t.id)
      jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'topic', COALESCE(topic.subject, '未分類'),
        'goal_title', g.title,
        'completed_at', t.completed_at
      ) AS x
    FROM user_events ue
    LEFT JOIN tasks t ON t.id::text = ue.entity_id
    LEFT JOIN goals g ON t.goal_id = g.id
    LEFT JOIN topics topic ON g.topic_id = topic.id
    WHERE ue.user_id = p_user_id
      AND ue.entity_type = 'task'
      AND t.status = 'done'
      AND t.completed_at IS NOT NULL
      AND DATE(t.completed_at) BETWEEN p_week_start AND p_week_end
    ORDER BY t.id, t.completed_at DESC
    LIMIT 10
  ) sub;

  -- 4. topics_data: 活躍主題摘要
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', topic.id,
      'title', topic.title,
      'subject', COALESCE(topic.subject, '未分類'),
      'progress', CASE 
        WHEN topic_stats.total_tasks = 0 THEN 0
        ELSE CAST((topic_stats.completed_tasks::NUMERIC / topic_stats.total_tasks::NUMERIC) * 100 AS INTEGER)
      END,
      'total_tasks', topic_stats.total_tasks,
      'completed_tasks', topic_stats.completed_tasks,
      'has_activity', topic_stats.week_activities > 0,
      'week_activities', topic_stats.week_activities
    )
    ORDER BY topic_stats.week_activities DESC, topic_stats.completed_tasks DESC
  ), '[]'::jsonb) INTO topics_data
  FROM topics topic
  LEFT JOIN (
    SELECT 
      topic.id as topic_id,
      COUNT(t.id) as total_tasks,
      COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
      COUNT(DISTINCT ue.entity_id) FILTER (WHERE DATE(ue.created_at) BETWEEN p_week_start AND p_week_end) as week_activities
    FROM topics topic
    LEFT JOIN goals g ON topic.id = g.topic_id AND g.status != 'archived'
    LEFT JOIN tasks t ON g.id = t.goal_id AND t.status != 'archived'
    LEFT JOIN user_events ue ON t.id::TEXT = ue.entity_id 
      AND ue.entity_type = 'task'
      AND ue.user_id = p_user_id
    WHERE topic.owner_id = p_user_id AND topic.status != 'archived'
    GROUP BY topic.id
  ) topic_stats ON topic.id = topic_stats.topic_id
  WHERE topic.owner_id = p_user_id AND topic.status != 'archived'
  LIMIT 5;

  -- 返回結果
  RETURN QUERY SELECT daily_data, week_data, completed_data, topics_data;
END;
$function$;

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