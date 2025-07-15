-- Drop all overloads
DROP FUNCTION IF EXISTS get_daily_activity_stats_v2(text, text, text);
DROP FUNCTION IF EXISTS get_daily_activity_stats_v2(uuid, text, text);
DROP FUNCTION IF EXISTS get_daily_activity_stats_v2(uuid, date, date);
DROP FUNCTION IF EXISTS get_daily_activity_stats_v2(text, date, date);

-- Create the canonical version
CREATE OR REPLACE FUNCTION get_daily_activity_stats_v2(
  p_user_id uuid,
  p_start_date text,
  p_end_date text
)
RETURNS TABLE (
  event_date date,
  total_activities bigint,
  completed_tasks bigint,
  check_ins bigint,
  records bigint,
  active_tasks jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date::date, p_end_date::date, '1 day'::interval)::date as event_date
  ),
  daily_events AS (
    SELECT
      DATE(ue.created_at) as event_date,
      COUNT(*) as total_activities,
      COUNT(*) FILTER (WHERE ue.event_type = 'task.status_changed' AND (ue.content->>'to_status') = 'done') as completed_tasks,
      COUNT(*) FILTER (WHERE ue.event_type = 'task.check_in') as check_ins,
      COUNT(*) FILTER (WHERE ue.event_type = 'task.record_added') as records,
      jsonb_agg(DISTINCT ue.entity_id) as active_task_ids
    FROM user_events ue
    WHERE ue.user_id = p_user_id
      AND ue.entity_type = 'task'
      AND DATE(ue.created_at) BETWEEN p_start_date::date AND p_end_date::date
    GROUP BY DATE(ue.created_at)
  )
  SELECT
    ds.event_date,
    COALESCE(de.total_activities, 0)::BIGINT,
    COALESCE(de.completed_tasks, 0)::BIGINT,
    COALESCE(de.check_ins, 0)::BIGINT,
    COALESCE(de.records, 0)::BIGINT,
    COALESCE(de.active_task_ids, '[]'::jsonb) as active_tasks
  FROM date_series ds
  LEFT JOIN daily_events de ON ds.event_date = de.event_date
  ORDER BY ds.event_date;
END;
$$ LANGUAGE plpgsql; 