-- 基於 user_events 的新 get_daily_activity_stats 函數
-- 這個函數將統一從 user_events 表中獲取用戶活動數據

CREATE OR REPLACE FUNCTION get_daily_activity_stats_v2(
  p_user_id TEXT, 
  p_start_date TEXT, 
  p_end_date TEXT
)
RETURNS TABLE(
  date DATE,
  total_activities BIGINT,
  status_changes BIGINT,     -- 狀態變更次數（包括完成、進行中等）
  completed_tasks BIGINT,    -- 完成任務數量
  check_ins BIGINT,          -- 打卡次數
  records BIGINT,            -- 學習記錄次數
  active_tasks JSONB         -- 詳細的活動任務信息
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date::date, p_end_date::date, '1 day'::interval)::date as date
  ),
  daily_events AS (
    SELECT 
      ds.date,
      -- 從 user_events 統計各類活動
      COUNT(ue.id) FILTER (WHERE ue.event_type = 'status_changed') as status_changes,
      COUNT(ue.id) FILTER (WHERE ue.event_type = 'status_changed' 
                           AND ue.content->>'to_status' = 'done') as completed_tasks,
      COUNT(ue.id) FILTER (WHERE ue.event_type = 'check_in') as check_ins,
      COUNT(ue.id) FILTER (WHERE ue.event_type = 'record_added') as records,
      COUNT(DISTINCT ue.entity_id) FILTER (WHERE ue.entity_type = 'task') as total_activities,
      
      -- 收集詳細的任務活動信息
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', ue.entity_id,
            'event_type', ue.event_type,
            'content', ue.content,
            'created_at', ue.created_at,
            -- 從相關表獲取任務詳細信息
            'task_info', (
              SELECT jsonb_build_object(
                'title', t.title,
                'status', t.status,
                'goal_title', g.title,
                'topic_title', tp.title,
                'topic_subject', tp.subject
              )
              FROM tasks t
              JOIN goals g ON g.id = t.goal_id
              JOIN topics tp ON tp.id = g.topic_id
              WHERE t.id::text = ue.entity_id
            )
          )
        ) FILTER (WHERE ue.id IS NOT NULL),
        '[]'::jsonb
      ) as active_tasks
      
    FROM date_series ds
    LEFT JOIN user_events ue ON ue.created_at::date = ds.date
      AND ue.user_id = p_user_id::uuid
      AND ue.entity_type = 'task'
    GROUP BY ds.date
  )
  SELECT 
    de.date,
    COALESCE(de.total_activities, 0) as total_activities,
    COALESCE(de.status_changes, 0) as status_changes,
    COALESCE(de.completed_tasks, 0) as completed_tasks,
    COALESCE(de.check_ins, 0) as check_ins,
    COALESCE(de.records, 0) as records,
    de.active_tasks
  FROM daily_events de
  ORDER BY de.date;
END;
$$;

-- 建立相容的舊版本函數（向後兼容）
-- 這個函數維持舊的介面，但內部調用新的 user_events 版本
CREATE OR REPLACE FUNCTION get_daily_activity_stats(
  p_user_id TEXT, 
  p_start_date TEXT, 
  p_end_date TEXT
)
RETURNS TABLE(
  date DATE,
  total_activities BIGINT,
  status_changes BIGINT,  -- 這裡實際返回完成任務數量（向後兼容）
  check_ins BIGINT,
  records BIGINT,
  active_tasks JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v2.date,
    v2.total_activities,
    v2.completed_tasks as status_changes,  -- 為了向後兼容，這裡返回完成任務數
    v2.check_ins,
    v2.records,
    v2.active_tasks
  FROM get_daily_activity_stats_v2(p_user_id, p_start_date, p_end_date) v2;
END;
$$; 