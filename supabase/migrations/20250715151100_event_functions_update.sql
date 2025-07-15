-- 移除舊版本避免重複
DROP FUNCTION IF EXISTS public.get_daily_activity_stats_v2(uuid, text, text);
DROP FUNCTION IF EXISTS public.get_daily_activity_stats_v2(text, text, text);

-- Event/Statistics/Summary Functions Update
-- 來源：20250115_topic_store_rpc_functions.sql

-- get_daily_activity_stats_v2
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

-- get_user_task_activities_summary
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_daily_activity_stats_v2(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_task_activities_summary TO authenticated; 

-- 移除已廢棄的 retro week summary function
DROP FUNCTION IF EXISTS public.get_retro_week_summary(uuid, date, date); 