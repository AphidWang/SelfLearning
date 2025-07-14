-- User Events Table Migration
-- 統一事件追蹤系統：記錄所有用戶行為事件

-- 建立 user_events 表
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'task', 'goal', 'topic'
  entity_id TEXT NOT NULL,   -- 對應的實體ID
  event_type TEXT NOT NULL,  -- 'created', 'updated', 'status_changed', 'check_in', 'record_added', 'deleted'
  content JSONB DEFAULT '{}', -- 事件詳細內容
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 約束條件
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('task', 'goal', 'topic')),
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'created', 'updated', 'deleted', 'restored',
    'status_changed', 'check_in', 'record_added',
    'collaborator_added', 'collaborator_removed'
  ))
);

-- 建立索引以優化查詢性能
CREATE INDEX IF NOT EXISTS idx_user_events_user_entity 
  ON user_events(user_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_user_events_user_event_type 
  ON user_events(user_id, event_type);

CREATE INDEX IF NOT EXISTS idx_user_events_created_at 
  ON user_events(created_at);

CREATE INDEX IF NOT EXISTS idx_user_events_user_date_range 
  ON user_events(user_id, created_at) 
  WHERE created_at >= NOW() - INTERVAL '30 days';

-- 啟用 RLS（Row Level Security）
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 政策：用戶只能查看自己的事件
CREATE POLICY user_events_select_own 
  ON user_events FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY user_events_insert_own 
  ON user_events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 建立用於記錄事件的 RPC 函數
CREATE OR REPLACE FUNCTION record_user_event(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_event_type TEXT,
  p_content JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
  current_user_id UUID;
BEGIN
  -- 獲取當前用戶ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- 插入事件記錄
  INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content)
  VALUES (current_user_id, p_entity_type, p_entity_id, p_event_type, p_content)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- 建立用於查詢用戶事件統計的 RPC 函數
CREATE OR REPLACE FUNCTION get_user_event_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_entity_type TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL
) RETURNS TABLE(
  date DATE,
  total_events BIGINT,
  event_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date as date
  ),
  daily_events AS (
    SELECT 
      ds.date,
      COUNT(ue.id) as total_events,
      jsonb_object_agg(
        ue.event_type, 
        COUNT(ue.id)
      ) FILTER (WHERE ue.id IS NOT NULL) as event_breakdown
    FROM date_series ds
    LEFT JOIN user_events ue ON ue.created_at::date = ds.date
      AND ue.user_id = p_user_id
      AND (p_entity_type IS NULL OR ue.entity_type = p_entity_type)
      AND (p_event_type IS NULL OR ue.event_type = p_event_type)
    GROUP BY ds.date
  )
  SELECT 
    de.date,
    COALESCE(de.total_events, 0) as total_events,
    COALESCE(de.event_breakdown, '{}'::jsonb) as event_breakdown
  FROM daily_events de
  ORDER BY de.date;
END;
$$;

-- 建立反向生成現有數據的函數（僅執行一次）
CREATE OR REPLACE FUNCTION backfill_user_events_from_existing_data()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_count INTEGER := 0;
  action_count INTEGER := 0;
  task_count INTEGER := 0;
BEGIN
  -- 1. 從 task_records 反向生成 record_added 事件
  INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content, created_at)
  SELECT 
    tr.author_id,
    'task',
    tr.task_id,
    'record_added',
    jsonb_build_object(
      'record_id', tr.id,
      'content_length', length(tr.content),
      'has_attachments', (tr.attachments IS NOT NULL AND tr.attachments != '[]'::jsonb)
    ),
    tr.created_at
  FROM task_records tr
  WHERE NOT EXISTS (
    SELECT 1 FROM user_events ue 
    WHERE ue.user_id = tr.author_id 
      AND ue.entity_type = 'task' 
      AND ue.entity_id = tr.task_id 
      AND ue.event_type = 'record_added'
      AND ue.created_at = tr.created_at
  );
  
  GET DIAGNOSTICS record_count = ROW_COUNT;
  
  -- 2. 從 task_actions 反向生成 check_in 事件
  INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content, created_at)
  SELECT 
    ta.user_id,
    'task',
    ta.task_id,
    'check_in',
    jsonb_build_object(
      'action_id', ta.id,
      'action_type', ta.action_type,
      'action_data', ta.action_data
    ),
    ta.action_timestamp
  FROM task_actions ta
  WHERE NOT EXISTS (
    SELECT 1 FROM user_events ue 
    WHERE ue.user_id = ta.user_id 
      AND ue.entity_type = 'task' 
      AND ue.entity_id = ta.task_id 
      AND ue.event_type = 'check_in'
      AND ue.created_at = ta.action_timestamp
  );
  
  GET DIAGNOSTICS action_count = ROW_COUNT;
  
  -- 3. 從 tasks 表為所有非 todo 狀態的任務生成 status_changed 事件
  INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content, created_at)
  SELECT 
    COALESCE(t.completed_by, tp.owner_id) as user_id,
    'task',
    t.id::text,
    'status_changed',
    jsonb_build_object(
      'from_status', 'todo',
      'to_status', t.status,
      'completed_at', t.completed_at
    ),
    COALESCE(t.completed_at, t.updated_at, t.created_at)
  FROM tasks t
  JOIN goals g ON g.id = t.goal_id
  JOIN topics tp ON tp.id = g.topic_id
  WHERE t.status != 'todo'
    AND NOT EXISTS (
      SELECT 1 FROM user_events ue 
      WHERE ue.user_id = COALESCE(t.completed_by, tp.owner_id)
        AND ue.entity_type = 'task' 
        AND ue.entity_id = t.id::text 
        AND ue.event_type = 'status_changed'
    );
  
  GET DIAGNOSTICS task_count = ROW_COUNT;
  
  RETURN format('反向生成完成：%s 個記錄事件，%s 個打卡事件，%s 個狀態變更事件', 
                record_count, action_count, task_count);
END;
$$; 