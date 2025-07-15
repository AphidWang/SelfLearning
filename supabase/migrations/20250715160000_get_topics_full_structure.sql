-- 建立 get_topics_full_structure
create or replace function get_topics_full_structure(topic_ids uuid[])
returns jsonb
language plpgsql
as $$
declare
  result jsonb := '[]'::jsonb;
  topic_row record;
  topic_goals jsonb;
begin
  for topic_row in
    select * from topics where id = any(topic_ids) and status != 'archived'
  loop
    -- 取 goals
    select coalesce(jsonb_agg(goal_obj), '[]'::jsonb) into topic_goals
    from (
      select
        g.*,
        -- 取 tasks
        (
          select coalesce(jsonb_agg(task_obj), '[]'::jsonb)
          from (
            select
              t.*,
              -- 取 actions
              (
                select coalesce(jsonb_agg(a), '[]'::jsonb)
                from task_actions a
                where a.task_id = t.id
              ) as actions,
              -- 取 records
              (
                select coalesce(jsonb_agg(r), '[]'::jsonb)
                from task_records r
                where r.task_id = t.id
              ) as records
            from tasks t
            where t.goal_id = g.id and t.status != 'archived'
          ) task_obj
        ) as tasks
      from goals g
      where g.topic_id = topic_row.id and g.status != 'archived'
    ) goal_obj;

    result := result || jsonb_build_array(
      to_jsonb(topic_row) || jsonb_build_object('goals', topic_goals)
    );
  end loop;
  return result;
end;
$$;

-- 建立 get_user_topics_with_structure
create or replace function get_user_topics_with_structure(p_user_id uuid)
returns jsonb
language plpgsql
as $$
declare
  topic_ids uuid[] := '{}';
  collab_ids uuid[] := '{}';
  topics_json jsonb;
begin
  -- 查自己擁有的 topic
  select array_agg(id) into topic_ids
  from topics
  where owner_id = p_user_id and status != 'archived';

  -- 查協作 topic
  select array_agg(tc.topic_id) into collab_ids
  from topic_collaborators tc
  join topics t on t.id = tc.topic_id
  where tc.user_id = p_user_id and t.status != 'archived';

  -- 合併去重
  topic_ids := array(select distinct unnest(coalesce(topic_ids, '{}') || coalesce(collab_ids, '{}')));

  -- 呼叫組裝 function
  topics_json := get_topics_full_structure(topic_ids);

  return topics_json;
end;
$$; 