-- 明確指定所有 id/foreign key 欄位型別，避免 text/uuid 比對錯誤
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
    select id::uuid as id, owner_id::uuid as owner_id, title, description, subject, category, topic_type, status, is_collaborative, show_avatars, due_date, focus_element, bubbles, version, created_at, updated_at, reference_info
    from topics
    where id = any(topic_ids) and status != 'archived'
  loop
    -- 取 goals
    select coalesce(jsonb_agg(goal_obj), '[]'::jsonb) into topic_goals
    from (
      select
        g.id::uuid as id,
        g.topic_id::uuid as topic_id,
        g.title,
        g.description,
        g.status,
        g.priority,
        g.order_index,
        g.need_help,
        g.help_message,
        g.owner_id::uuid as owner_id,
        g.collaborator_ids,
        g.version,
        g.created_at,
        g.updated_at,
        g.reference_info,
        -- 取 tasks
        (
          select coalesce(jsonb_agg(task_obj), '[]'::jsonb)
          from (
            select
              t.id::uuid as id,
              t.goal_id::uuid as goal_id,
              t.title,
              t.description,
              t.status,
              t.priority,
              t.order_index,
              t.need_help,
              t.help_message,
              t.owner_id::uuid as owner_id,
              t.collaborator_ids,
              t.task_type,
              t.task_config,
              t.cycle_config,
              t.progress_data,
              t.special_flags,
              t.version,
              t.created_at,
              t.updated_at,
              t.reference_info,
              -- 取 actions
              (
                select coalesce(jsonb_agg(a), '[]'::jsonb)
                from task_actions a
                where a.task_id = t.id::uuid
              ) as actions,
              -- 取 records
              (
                select coalesce(jsonb_agg(r), '[]'::jsonb)
                from task_records r
                where r.task_id = t.id::uuid
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