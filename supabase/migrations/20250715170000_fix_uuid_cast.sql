-- 修正 get_topics_full_structure uuid 型別比對
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
            where t.goal_id = g.id::uuid and t.status != 'archived'
          ) task_obj
        ) as tasks
      from goals g
      where g.topic_id = topic_row.id::uuid and g.status != 'archived'
    ) goal_obj;

    result := result || jsonb_build_array(
      to_jsonb(topic_row) || jsonb_build_object('goals', topic_goals)
    );
  end loop;
  return result;
end;
$$; 