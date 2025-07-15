create extension if not exists "pgjwt" with schema "extensions";


create table "public"."backup_20240120_daily_journals" (
    "id" uuid,
    "user_id" uuid,
    "date" date,
    "mood" character varying(20),
    "motivation_level" integer,
    "content" text,
    "has_voice_note" boolean,
    "voice_note_url" text,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


create table "public"."backup_20240120_task_records" (
    "id" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "author_id" uuid,
    "title" text,
    "message" text,
    "files" jsonb,
    "topic_id" uuid,
    "task_id" text,
    "task_type" text,
    "completion_time" integer,
    "tags" text[],
    "difficulty" integer
);


create table "public"."backup_20240120_topic_collaborators" (
    "id" uuid,
    "topic_id" uuid,
    "user_id" uuid,
    "permission" text,
    "invited_by" uuid,
    "invited_at" timestamp with time zone
);


create table "public"."backup_20240120_topic_template_collaborators" (
    "id" uuid,
    "template_id" uuid,
    "user_id" uuid,
    "permission" text,
    "invited_by" uuid,
    "invited_at" timestamp with time zone
);


create table "public"."backup_20240120_topic_templates" (
    "id" uuid,
    "title" text,
    "description" text,
    "subject" text,
    "category" text,
    "template_type" text,
    "goals" jsonb,
    "bubbles" jsonb,
    "created_by" uuid,
    "is_public" boolean,
    "is_collaborative" boolean,
    "copy_count" integer,
    "usage_count" integer,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


create table "public"."backup_20240120_topics" (
    "id" uuid,
    "title" text,
    "description" text,
    "subject" text,
    "category" text,
    "status" text,
    "goals" jsonb,
    "bubbles" jsonb,
    "focus_element" jsonb,
    "template_id" uuid,
    "template_version" integer,
    "owner_id" uuid,
    "is_collaborative" boolean,
    "show_avatars" boolean,
    "progress" integer,
    "due_date" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "type" character varying(100)
);


create table "public"."backup_info" (
    "id" uuid not null default gen_random_uuid(),
    "backup_date" timestamp with time zone default now(),
    "backup_prefix" character varying(50) not null,
    "description" text,
    "table_count" integer,
    "total_records" integer
);


create table "public"."daily_journals" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "date" date not null,
    "mood" character varying(20) not null,
    "motivation_level" integer not null,
    "content" text,
    "has_voice_note" boolean default false,
    "voice_note_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "completed_tasks" jsonb default '[]'::jsonb
);


alter table "public"."daily_journals" enable row level security;

create table "public"."goals" (
    "id" uuid not null default gen_random_uuid(),
    "topic_id" uuid not null,
    "title" text not null,
    "description" text,
    "status" text not null default 'active'::text,
    "priority" text default 'medium'::text,
    "order_index" integer default 0,
    "version" integer not null default 1,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "need_help" boolean default false,
    "help_message" text,
    "help_resolved_at" timestamp with time zone,
    "owner_id" uuid,
    "collaborator_ids" uuid[] default '{}'::uuid[],
    "reference_info" jsonb default '{"links": [], "attachments": []}'::jsonb
);


alter table "public"."goals" enable row level security;

create table "public"."group_retro_questions" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "title" text not null,
    "content" text not null,
    "type" text not null,
    "order_index" integer default 0,
    "is_default" boolean default false,
    "guidance" text,
    "age_group" text default 'all'::text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."group_retro_questions" enable row level security;

create table "public"."group_retro_replies" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "question_id" uuid not null,
    "user_id" uuid not null,
    "content" text not null,
    "mood" text,
    "emoji" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."group_retro_replies" enable row level security;

create table "public"."group_retro_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "week_id" text not null,
    "created_by" uuid not null,
    "participant_ids" uuid[] default '{}'::uuid[],
    "status" text default 'preparing'::text,
    "settings" jsonb default '{"questionLimit": 5, "allowAnonymous": false, "maxParticipants": 8, "autoGenerateQuestions": true}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone
);


alter table "public"."group_retro_sessions" enable row level security;

create table "public"."retro_answers" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "date" date not null,
    "week_id" text not null,
    "question" jsonb not null,
    "is_custom_question" boolean default false,
    "custom_question" text,
    "answer" text not null,
    "mood" text not null,
    "emoji" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "session_id" uuid
);


alter table "public"."retro_answers" enable row level security;

create table "public"."retro_questions" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "question" text not null,
    "type" text not null,
    "age_group" text not null default 'all'::text,
    "difficulty" integer not null default 3,
    "tags" text[] default '{}'::text[],
    "hint" text,
    "example" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."retro_questions" enable row level security;

create table "public"."retro_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "week_id" text not null,
    "questions_drawn" jsonb default '[]'::jsonb,
    "answers_completed" integer default 0,
    "status" text default 'active'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."retro_sessions" enable row level security;

create table "public"."task_actions" (
    "id" uuid not null default gen_random_uuid(),
    "task_id" uuid not null,
    "user_id" uuid not null,
    "action_type" text not null,
    "action_data" jsonb default '{}'::jsonb,
    "action_date" date default CURRENT_DATE,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "action_timestamp" timestamp with time zone default now()
);


alter table "public"."task_actions" enable row level security;

create table "public"."task_records" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "author_id" uuid not null,
    "title" text not null,
    "message" text not null,
    "files" jsonb default '[]'::jsonb,
    "topic_id" uuid,
    "task_id" text,
    "task_type" text,
    "completion_time" integer,
    "tags" text[] default '{}'::text[],
    "difficulty" integer not null
);


alter table "public"."task_records" enable row level security;

create table "public"."tasks" (
    "id" uuid not null default gen_random_uuid(),
    "goal_id" uuid not null,
    "title" text not null,
    "description" text,
    "status" text not null default 'todo'::text,
    "priority" text default 'medium'::text,
    "order_index" integer default 0,
    "need_help" boolean default false,
    "help_message" text,
    "reply_message" text,
    "reply_at" timestamp with time zone,
    "replied_by" uuid,
    "completed_at" timestamp with time zone,
    "completed_by" uuid,
    "estimated_minutes" integer,
    "actual_minutes" integer,
    "version" integer not null default 1,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "owner_id" uuid,
    "collaborator_ids" uuid[] default '{}'::uuid[],
    "is_recurring" boolean default false,
    "recurring_config" jsonb default '{}'::jsonb,
    "reference_info" jsonb default '{"links": [], "attachments": []}'::jsonb,
    "task_type" text default 'single'::text,
    "task_config" jsonb default '{}'::jsonb,
    "cycle_config" jsonb default '{}'::jsonb,
    "progress_data" jsonb default '{}'::jsonb,
    "special_flags" text[] default '{}'::text[]
);


alter table "public"."tasks" enable row level security;

create table "public"."topic_collaborators" (
    "id" uuid not null default gen_random_uuid(),
    "topic_id" uuid,
    "user_id" uuid,
    "permission" text not null default 'edit'::text,
    "invited_by" uuid,
    "invited_at" timestamp with time zone default now()
);


create table "public"."topic_template_collaborators" (
    "id" uuid not null default gen_random_uuid(),
    "template_id" uuid,
    "user_id" uuid,
    "permission" text not null default 'edit'::text,
    "invited_by" uuid,
    "invited_at" timestamp with time zone default now()
);


alter table "public"."topic_template_collaborators" enable row level security;

create table "public"."topic_templates" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "subject" text,
    "category" text,
    "template_type" text,
    "goals" jsonb not null default '[]'::jsonb,
    "bubbles" jsonb default '[]'::jsonb,
    "created_by" uuid not null,
    "is_public" boolean default false,
    "is_collaborative" boolean default false,
    "copy_count" integer default 0,
    "usage_count" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "source_id" uuid,
    "reference_info" jsonb default '{"links": [], "attachments": []}'::jsonb,
    "status" text not null default 'active'::text
);


alter table "public"."topic_templates" enable row level security;

create table "public"."topics" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "title" text not null,
    "description" text,
    "subject" text,
    "category" text,
    "status" text not null default 'active'::text,
    "type" character varying(50),
    "template_id" uuid,
    "template_version" integer,
    "is_collaborative" boolean default false,
    "show_avatars" boolean default true,
    "due_date" timestamp with time zone,
    "focus_element" jsonb,
    "bubbles" jsonb default '[]'::jsonb,
    "version" integer not null default 1,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "topic_type" character varying(50),
    "reference_info" jsonb default '{"links": [], "attachments": []}'::jsonb
);


alter table "public"."topics" enable row level security;

create table "public"."topics_legacy" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "subject" text,
    "category" text,
    "status" text not null default 'active'::text,
    "goals" jsonb not null default '[]'::jsonb,
    "bubbles" jsonb default '[]'::jsonb,
    "focus_element" jsonb,
    "template_id" uuid,
    "template_version" integer,
    "owner_id" uuid not null,
    "is_collaborative" boolean default false,
    "show_avatars" boolean default true,
    "progress" integer default 0,
    "due_date" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "type" character varying(100)
);


create table "public"."user_events" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "entity_type" text not null,
    "entity_id" text not null,
    "event_type" text not null,
    "content" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."user_events" enable row level security;

create table "public"."weekly_challenge_check_ins" (
    "id" uuid not null default gen_random_uuid(),
    "challenge_id" uuid not null,
    "user_id" uuid not null,
    "checked_in_at" timestamp with time zone default now(),
    "check_in_date" date default CURRENT_DATE,
    "note" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."weekly_challenge_check_ins" enable row level security;

create table "public"."weekly_challenges" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "description" text,
    "start_date" date not null,
    "end_date" date not null,
    "target_days" integer default 7,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."weekly_challenges" enable row level security;

CREATE UNIQUE INDEX backup_info_pkey ON public.backup_info USING btree (id);

CREATE UNIQUE INDEX daily_journals_pkey ON public.daily_journals USING btree (id);

CREATE UNIQUE INDEX daily_journals_user_id_date_key ON public.daily_journals USING btree (user_id, date);

CREATE UNIQUE INDEX goals_pkey ON public.goals USING btree (id);

CREATE UNIQUE INDEX group_retro_questions_pkey ON public.group_retro_questions USING btree (id);

CREATE UNIQUE INDEX group_retro_replies_pkey ON public.group_retro_replies USING btree (id);

CREATE UNIQUE INDEX group_retro_sessions_pkey ON public.group_retro_sessions USING btree (id);

CREATE INDEX idx_daily_journals_mood ON public.daily_journals USING btree (mood);

CREATE INDEX idx_daily_journals_motivation ON public.daily_journals USING btree (motivation_level);

CREATE INDEX idx_daily_journals_user_date ON public.daily_journals USING btree (user_id, date DESC);

CREATE INDEX idx_goals_status ON public.goals USING btree (status);

CREATE INDEX idx_goals_topic_id ON public.goals USING btree (topic_id);

CREATE INDEX idx_goals_topic_status ON public.goals USING btree (topic_id, status);

CREATE INDEX idx_group_retro_questions_session_id ON public.group_retro_questions USING btree (session_id);

CREATE INDEX idx_group_retro_questions_type ON public.group_retro_questions USING btree (type);

CREATE INDEX idx_group_retro_replies_question_id ON public.group_retro_replies USING btree (question_id);

CREATE INDEX idx_group_retro_replies_session_id ON public.group_retro_replies USING btree (session_id);

CREATE INDEX idx_group_retro_replies_user_id ON public.group_retro_replies USING btree (user_id);

CREATE INDEX idx_group_retro_sessions_created_by ON public.group_retro_sessions USING btree (created_by);

CREATE INDEX idx_group_retro_sessions_status ON public.group_retro_sessions USING btree (status);

CREATE INDEX idx_group_retro_sessions_week_id ON public.group_retro_sessions USING btree (week_id);

CREATE INDEX idx_retro_answers_date ON public.retro_answers USING btree (date);

CREATE INDEX idx_retro_answers_mood ON public.retro_answers USING btree (mood);

CREATE INDEX idx_retro_answers_session_id ON public.retro_answers USING btree (session_id);

CREATE INDEX idx_retro_answers_user_id ON public.retro_answers USING btree (user_id);

CREATE INDEX idx_retro_answers_week_id ON public.retro_answers USING btree (week_id);

CREATE INDEX idx_retro_questions_active ON public.retro_questions USING btree (is_active);

CREATE INDEX idx_retro_questions_age_group ON public.retro_questions USING btree (age_group);

CREATE INDEX idx_retro_questions_type ON public.retro_questions USING btree (type);

CREATE INDEX idx_retro_sessions_status ON public.retro_sessions USING btree (status);

CREATE INDEX idx_retro_sessions_user_id ON public.retro_sessions USING btree (user_id);

CREATE INDEX idx_retro_sessions_week_id ON public.retro_sessions USING btree (week_id);

CREATE INDEX idx_task_actions_action_timestamp ON public.task_actions USING btree (action_timestamp);

CREATE INDEX idx_task_actions_task_id_action_date ON public.task_actions USING btree (task_id, action_date);

CREATE INDEX idx_task_records_author_id ON public.task_records USING btree (author_id);

CREATE INDEX idx_task_records_created_at ON public.task_records USING btree (created_at);

CREATE INDEX idx_task_records_task_id_created_at ON public.task_records USING btree (task_id, created_at DESC);

CREATE INDEX idx_task_records_topic_id ON public.task_records USING btree (topic_id);

CREATE INDEX idx_tasks_goal_id ON public.tasks USING btree (goal_id);

CREATE INDEX idx_tasks_goal_status ON public.tasks USING btree (goal_id, status);

CREATE INDEX idx_tasks_need_help ON public.tasks USING btree (need_help) WHERE (need_help = true);

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);

CREATE INDEX idx_tasks_status_created ON public.tasks USING btree (status, created_at DESC);

CREATE INDEX idx_template_collaborators_template_id ON public.topic_template_collaborators USING btree (template_id);

CREATE INDEX idx_template_collaborators_user_id ON public.topic_template_collaborators USING btree (user_id);

CREATE INDEX idx_topic_collaborators_invited_by ON public.topic_collaborators USING btree (invited_by);

CREATE INDEX idx_topic_collaborators_topic_id ON public.topic_collaborators USING btree (topic_id);

CREATE INDEX idx_topic_collaborators_user_id ON public.topic_collaborators USING btree (user_id);

CREATE INDEX idx_topic_template_collaborators_invited_by ON public.topic_template_collaborators USING btree (invited_by);

CREATE INDEX idx_topic_templates_collaborative ON public.topic_templates USING btree (is_collaborative) WHERE (is_collaborative = true);

CREATE INDEX idx_topic_templates_created_by ON public.topic_templates USING btree (created_by);

CREATE INDEX idx_topic_templates_public ON public.topic_templates USING btree (is_public) WHERE (is_public = true);

CREATE INDEX idx_topic_templates_status ON public.topic_templates USING btree (status);

CREATE INDEX idx_topic_templates_subject ON public.topic_templates USING btree (subject);

CREATE INDEX idx_topic_templates_updated_at ON public.topic_templates USING btree (updated_at DESC);

CREATE INDEX idx_topics_owner_id ON public.topics_legacy USING btree (owner_id);

CREATE INDEX idx_topics_status ON public.topics_legacy USING btree (status);

CREATE INDEX idx_topics_template_id ON public.topics_legacy USING btree (template_id);

CREATE INDEX idx_topics_updated_at ON public.topics_legacy USING btree (updated_at DESC);

CREATE INDEX idx_user_events_created_at ON public.user_events USING btree (created_at);

CREATE INDEX idx_user_events_user_date ON public.user_events USING btree (user_id, created_at);

CREATE INDEX idx_user_events_user_entity ON public.user_events USING btree (user_id, entity_type, entity_id);

CREATE INDEX idx_user_events_user_event_type ON public.user_events USING btree (user_id, event_type);

CREATE INDEX idx_weekly_challenge_check_ins_challenge_id ON public.weekly_challenge_check_ins USING btree (challenge_id);

CREATE INDEX idx_weekly_challenge_check_ins_date ON public.weekly_challenge_check_ins USING btree (check_in_date);

CREATE UNIQUE INDEX idx_weekly_challenge_check_ins_unique_daily ON public.weekly_challenge_check_ins USING btree (challenge_id, user_id, check_in_date);

CREATE INDEX idx_weekly_challenge_check_ins_user_id ON public.weekly_challenge_check_ins USING btree (user_id);

CREATE INDEX idx_weekly_challenges_active ON public.weekly_challenges USING btree (is_active);

CREATE INDEX idx_weekly_challenges_dates ON public.weekly_challenges USING btree (start_date, end_date);

CREATE INDEX idx_weekly_challenges_user_id ON public.weekly_challenges USING btree (user_id);

CREATE UNIQUE INDEX retro_answers_pkey ON public.retro_answers USING btree (id);

CREATE UNIQUE INDEX retro_questions_pkey ON public.retro_questions USING btree (id);

CREATE UNIQUE INDEX retro_sessions_pkey ON public.retro_sessions USING btree (id);

CREATE UNIQUE INDEX retro_sessions_user_id_week_id_key ON public.retro_sessions USING btree (user_id, week_id);

CREATE INDEX task_actions_action_date_idx ON public.task_actions USING btree (action_date);

CREATE UNIQUE INDEX task_actions_pkey ON public.task_actions USING btree (id);

CREATE INDEX task_actions_task_id_idx ON public.task_actions USING btree (task_id);

CREATE INDEX task_actions_type_date_idx ON public.task_actions USING btree (action_type, action_date);

CREATE UNIQUE INDEX task_actions_unique_daily_checkin ON public.task_actions USING btree (task_id, user_id, action_date) WHERE (action_type = 'check_in'::text);

CREATE INDEX task_actions_user_id_idx ON public.task_actions USING btree (user_id);

CREATE UNIQUE INDEX task_records_pkey ON public.task_records USING btree (id);

CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);

CREATE UNIQUE INDEX topic_collaborators_pkey ON public.topic_collaborators USING btree (id);

CREATE UNIQUE INDEX topic_collaborators_topic_id_user_id_key ON public.topic_collaborators USING btree (topic_id, user_id);

CREATE UNIQUE INDEX topic_template_collaborators_pkey ON public.topic_template_collaborators USING btree (id);

CREATE UNIQUE INDEX topic_template_collaborators_template_id_user_id_key ON public.topic_template_collaborators USING btree (template_id, user_id);

CREATE UNIQUE INDEX topic_templates_pkey ON public.topic_templates USING btree (id);

CREATE UNIQUE INDEX topics_legacy_pkey ON public.topics_legacy USING btree (id);

CREATE UNIQUE INDEX topics_pkey ON public.topics USING btree (id);

CREATE UNIQUE INDEX user_events_pkey ON public.user_events USING btree (id);

CREATE UNIQUE INDEX weekly_challenge_check_ins_pkey ON public.weekly_challenge_check_ins USING btree (id);

CREATE UNIQUE INDEX weekly_challenges_pkey ON public.weekly_challenges USING btree (id);

alter table "public"."backup_info" add constraint "backup_info_pkey" PRIMARY KEY using index "backup_info_pkey";

alter table "public"."daily_journals" add constraint "daily_journals_pkey" PRIMARY KEY using index "daily_journals_pkey";

alter table "public"."goals" add constraint "goals_pkey" PRIMARY KEY using index "goals_pkey";

alter table "public"."group_retro_questions" add constraint "group_retro_questions_pkey" PRIMARY KEY using index "group_retro_questions_pkey";

alter table "public"."group_retro_replies" add constraint "group_retro_replies_pkey" PRIMARY KEY using index "group_retro_replies_pkey";

alter table "public"."group_retro_sessions" add constraint "group_retro_sessions_pkey" PRIMARY KEY using index "group_retro_sessions_pkey";

alter table "public"."retro_answers" add constraint "retro_answers_pkey" PRIMARY KEY using index "retro_answers_pkey";

alter table "public"."retro_questions" add constraint "retro_questions_pkey" PRIMARY KEY using index "retro_questions_pkey";

alter table "public"."retro_sessions" add constraint "retro_sessions_pkey" PRIMARY KEY using index "retro_sessions_pkey";

alter table "public"."task_actions" add constraint "task_actions_pkey" PRIMARY KEY using index "task_actions_pkey";

alter table "public"."task_records" add constraint "task_records_pkey" PRIMARY KEY using index "task_records_pkey";

alter table "public"."tasks" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."topic_collaborators" add constraint "topic_collaborators_pkey" PRIMARY KEY using index "topic_collaborators_pkey";

alter table "public"."topic_template_collaborators" add constraint "topic_template_collaborators_pkey" PRIMARY KEY using index "topic_template_collaborators_pkey";

alter table "public"."topic_templates" add constraint "topic_templates_pkey" PRIMARY KEY using index "topic_templates_pkey";

alter table "public"."topics" add constraint "topics_pkey" PRIMARY KEY using index "topics_pkey";

alter table "public"."topics_legacy" add constraint "topics_legacy_pkey" PRIMARY KEY using index "topics_legacy_pkey";

alter table "public"."user_events" add constraint "user_events_pkey" PRIMARY KEY using index "user_events_pkey";

alter table "public"."weekly_challenge_check_ins" add constraint "weekly_challenge_check_ins_pkey" PRIMARY KEY using index "weekly_challenge_check_ins_pkey";

alter table "public"."weekly_challenges" add constraint "weekly_challenges_pkey" PRIMARY KEY using index "weekly_challenges_pkey";

alter table "public"."daily_journals" add constraint "daily_journals_mood_check" CHECK (((mood)::text = ANY ((ARRAY['excited'::character varying, 'happy'::character varying, 'okay'::character varying, 'tired'::character varying, 'stressed'::character varying])::text[]))) not valid;

alter table "public"."daily_journals" validate constraint "daily_journals_mood_check";

alter table "public"."daily_journals" add constraint "daily_journals_motivation_level_check" CHECK (((motivation_level >= 1) AND (motivation_level <= 10))) not valid;

alter table "public"."daily_journals" validate constraint "daily_journals_motivation_level_check";

alter table "public"."daily_journals" add constraint "daily_journals_user_id_date_key" UNIQUE using index "daily_journals_user_id_date_key";

alter table "public"."daily_journals" add constraint "daily_journals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."daily_journals" validate constraint "daily_journals_user_id_fkey";

alter table "public"."goals" add constraint "goals_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) not valid;

alter table "public"."goals" validate constraint "goals_owner_id_fkey";

alter table "public"."goals" add constraint "goals_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))) not valid;

alter table "public"."goals" validate constraint "goals_priority_check";

alter table "public"."goals" add constraint "goals_status_check" CHECK ((status = ANY (ARRAY['todo'::text, 'pause'::text, 'focus'::text, 'finish'::text, 'complete'::text, 'archived'::text]))) not valid;

alter table "public"."goals" validate constraint "goals_status_check";

alter table "public"."goals" add constraint "goals_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE not valid;

alter table "public"."goals" validate constraint "goals_topic_id_fkey";

alter table "public"."group_retro_questions" add constraint "group_retro_questions_age_group_check" CHECK ((age_group = ANY (ARRAY['all'::text, 'elementary'::text, 'middle'::text, 'high'::text]))) not valid;

alter table "public"."group_retro_questions" validate constraint "group_retro_questions_age_group_check";

alter table "public"."group_retro_questions" add constraint "group_retro_questions_session_id_fkey" FOREIGN KEY (session_id) REFERENCES group_retro_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."group_retro_questions" validate constraint "group_retro_questions_session_id_fkey";

alter table "public"."group_retro_questions" add constraint "group_retro_questions_type_check" CHECK ((type = ANY (ARRAY['appreciation'::text, 'learning'::text, 'collaboration'::text, 'reflection'::text, 'planning'::text, 'custom'::text]))) not valid;

alter table "public"."group_retro_questions" validate constraint "group_retro_questions_type_check";

alter table "public"."group_retro_replies" add constraint "group_retro_replies_mood_check" CHECK ((mood = ANY (ARRAY['excited'::text, 'happy'::text, 'thoughtful'::text, 'grateful'::text, 'inspired'::text, 'neutral'::text, 'surprised'::text]))) not valid;

alter table "public"."group_retro_replies" validate constraint "group_retro_replies_mood_check";

alter table "public"."group_retro_replies" add constraint "group_retro_replies_question_id_fkey" FOREIGN KEY (question_id) REFERENCES group_retro_questions(id) ON DELETE CASCADE not valid;

alter table "public"."group_retro_replies" validate constraint "group_retro_replies_question_id_fkey";

alter table "public"."group_retro_replies" add constraint "group_retro_replies_session_id_fkey" FOREIGN KEY (session_id) REFERENCES group_retro_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."group_retro_replies" validate constraint "group_retro_replies_session_id_fkey";

alter table "public"."group_retro_replies" add constraint "group_retro_replies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."group_retro_replies" validate constraint "group_retro_replies_user_id_fkey";

alter table "public"."group_retro_sessions" add constraint "group_retro_sessions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."group_retro_sessions" validate constraint "group_retro_sessions_created_by_fkey";

alter table "public"."group_retro_sessions" add constraint "group_retro_sessions_status_check" CHECK ((status = ANY (ARRAY['preparing'::text, 'discussing'::text, 'completed'::text, 'archived'::text]))) not valid;

alter table "public"."group_retro_sessions" validate constraint "group_retro_sessions_status_check";

alter table "public"."retro_answers" add constraint "retro_answers_mood_check" CHECK ((mood = ANY (ARRAY['excited'::text, 'happy'::text, 'okay'::text, 'tired'::text, 'stressed'::text]))) not valid;

alter table "public"."retro_answers" validate constraint "retro_answers_mood_check";

alter table "public"."retro_answers" add constraint "retro_answers_session_id_fkey" FOREIGN KEY (session_id) REFERENCES retro_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."retro_answers" validate constraint "retro_answers_session_id_fkey";

alter table "public"."retro_answers" add constraint "retro_answers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."retro_answers" validate constraint "retro_answers_user_id_fkey";

alter table "public"."retro_questions" add constraint "retro_questions_age_group_check" CHECK ((age_group = ANY (ARRAY['children'::text, 'teens'::text, 'adults'::text, 'all'::text]))) not valid;

alter table "public"."retro_questions" validate constraint "retro_questions_age_group_check";

alter table "public"."retro_questions" add constraint "retro_questions_difficulty_check" CHECK (((difficulty >= 1) AND (difficulty <= 5))) not valid;

alter table "public"."retro_questions" validate constraint "retro_questions_difficulty_check";

alter table "public"."retro_questions" add constraint "retro_questions_type_check" CHECK ((type = ANY (ARRAY['appreciation'::text, 'learning'::text, 'collaboration'::text, 'reflection'::text, 'planning'::text, 'custom'::text]))) not valid;

alter table "public"."retro_questions" validate constraint "retro_questions_type_check";

alter table "public"."retro_sessions" add constraint "retro_sessions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text]))) not valid;

alter table "public"."retro_sessions" validate constraint "retro_sessions_status_check";

alter table "public"."retro_sessions" add constraint "retro_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."retro_sessions" validate constraint "retro_sessions_user_id_fkey";

alter table "public"."retro_sessions" add constraint "retro_sessions_user_id_week_id_key" UNIQUE using index "retro_sessions_user_id_week_id_key";

alter table "public"."task_actions" add constraint "task_actions_action_type_check" CHECK ((action_type = ANY (ARRAY['check_in'::text, 'add_count'::text, 'add_amount'::text, 'complete'::text, 'reset'::text]))) not valid;

alter table "public"."task_actions" validate constraint "task_actions_action_type_check";

alter table "public"."task_actions" add constraint "task_actions_task_id_fkey" FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE not valid;

alter table "public"."task_actions" validate constraint "task_actions_task_id_fkey";

alter table "public"."task_actions" add constraint "task_actions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."task_actions" validate constraint "task_actions_user_id_fkey";

alter table "public"."task_records" add constraint "task_records_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."task_records" validate constraint "task_records_author_id_fkey";

alter table "public"."task_records" add constraint "task_records_difficulty_check" CHECK (((difficulty >= 1) AND (difficulty <= 5))) not valid;

alter table "public"."task_records" validate constraint "task_records_difficulty_check";

alter table "public"."task_records" add constraint "task_records_files_check" CHECK ((jsonb_typeof(files) = 'array'::text)) not valid;

alter table "public"."task_records" validate constraint "task_records_files_check";

alter table "public"."task_records" add constraint "task_records_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE not valid;

alter table "public"."task_records" validate constraint "task_records_topic_id_fkey";

alter table "public"."tasks" add constraint "tasks_completed_by_fkey" FOREIGN KEY (completed_by) REFERENCES auth.users(id) not valid;

alter table "public"."tasks" validate constraint "tasks_completed_by_fkey";

alter table "public"."tasks" add constraint "tasks_goal_id_fkey" FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_goal_id_fkey";

alter table "public"."tasks" add constraint "tasks_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) not valid;

alter table "public"."tasks" validate constraint "tasks_owner_id_fkey";

alter table "public"."tasks" add constraint "tasks_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))) not valid;

alter table "public"."tasks" validate constraint "tasks_priority_check";

alter table "public"."tasks" add constraint "tasks_replied_by_fkey" FOREIGN KEY (replied_by) REFERENCES auth.users(id) not valid;

alter table "public"."tasks" validate constraint "tasks_replied_by_fkey";

alter table "public"."tasks" add constraint "tasks_status_check" CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'done'::text, 'archived'::text]))) not valid;

alter table "public"."tasks" validate constraint "tasks_status_check";

alter table "public"."tasks" add constraint "tasks_task_type_check" CHECK ((task_type = ANY (ARRAY['single'::text, 'count'::text, 'streak'::text, 'accumulative'::text]))) not valid;

alter table "public"."tasks" validate constraint "tasks_task_type_check";

alter table "public"."topic_collaborators" add constraint "topic_collaborators_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) not valid;

alter table "public"."topic_collaborators" validate constraint "topic_collaborators_invited_by_fkey";

alter table "public"."topic_collaborators" add constraint "topic_collaborators_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE not valid;

alter table "public"."topic_collaborators" validate constraint "topic_collaborators_topic_id_fkey";

alter table "public"."topic_collaborators" add constraint "topic_collaborators_topic_id_user_id_key" UNIQUE using index "topic_collaborators_topic_id_user_id_key";

alter table "public"."topic_collaborators" add constraint "topic_collaborators_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."topic_collaborators" validate constraint "topic_collaborators_user_id_fkey";

alter table "public"."topic_template_collaborators" add constraint "topic_template_collaborators_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) not valid;

alter table "public"."topic_template_collaborators" validate constraint "topic_template_collaborators_invited_by_fkey";

alter table "public"."topic_template_collaborators" add constraint "topic_template_collaborators_template_id_fkey" FOREIGN KEY (template_id) REFERENCES topic_templates(id) ON DELETE CASCADE not valid;

alter table "public"."topic_template_collaborators" validate constraint "topic_template_collaborators_template_id_fkey";

alter table "public"."topic_template_collaborators" add constraint "topic_template_collaborators_template_id_user_id_key" UNIQUE using index "topic_template_collaborators_template_id_user_id_key";

alter table "public"."topic_template_collaborators" add constraint "topic_template_collaborators_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."topic_template_collaborators" validate constraint "topic_template_collaborators_user_id_fkey";

alter table "public"."topic_templates" add constraint "bubbles_is_array" CHECK ((jsonb_typeof(bubbles) = 'array'::text)) not valid;

alter table "public"."topic_templates" validate constraint "bubbles_is_array";

alter table "public"."topic_templates" add constraint "goals_is_array" CHECK ((jsonb_typeof(goals) = 'array'::text)) not valid;

alter table "public"."topic_templates" validate constraint "goals_is_array";

alter table "public"."topic_templates" add constraint "topic_templates_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."topic_templates" validate constraint "topic_templates_created_by_fkey";

alter table "public"."topic_templates" add constraint "topic_templates_source_id_fkey" FOREIGN KEY (source_id) REFERENCES topics(id) not valid;

alter table "public"."topic_templates" validate constraint "topic_templates_source_id_fkey";

alter table "public"."topic_templates" add constraint "topic_templates_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text]))) not valid;

alter table "public"."topic_templates" validate constraint "topic_templates_status_check";

alter table "public"."topics" add constraint "topics_bubbles_check" CHECK ((jsonb_typeof(bubbles) = 'array'::text)) not valid;

alter table "public"."topics" validate constraint "topics_bubbles_check";

alter table "public"."topics" add constraint "topics_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."topics" validate constraint "topics_owner_id_fkey";

alter table "public"."topics" add constraint "topics_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text, 'completed'::text, 'hidden'::text, 'in-progress'::text, 'overdue'::text, 'paused'::text]))) not valid;

alter table "public"."topics" validate constraint "topics_status_check";

alter table "public"."topics" add constraint "topics_template_id_fkey" FOREIGN KEY (template_id) REFERENCES topic_templates(id) not valid;

alter table "public"."topics" validate constraint "topics_template_id_fkey";

alter table "public"."topics_legacy" add constraint "bubbles_is_array" CHECK ((jsonb_typeof(bubbles) = 'array'::text)) not valid;

alter table "public"."topics_legacy" validate constraint "bubbles_is_array";

alter table "public"."topics_legacy" add constraint "goals_is_array" CHECK ((jsonb_typeof(goals) = 'array'::text)) not valid;

alter table "public"."topics_legacy" validate constraint "goals_is_array";

alter table "public"."topics_legacy" add constraint "topics_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) not valid;

alter table "public"."topics_legacy" validate constraint "topics_owner_id_fkey";

alter table "public"."topics_legacy" add constraint "topics_template_id_fkey" FOREIGN KEY (template_id) REFERENCES topic_templates(id) not valid;

alter table "public"."topics_legacy" validate constraint "topics_template_id_fkey";

alter table "public"."user_events" add constraint "user_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_events" validate constraint "user_events_user_id_fkey";

alter table "public"."user_events" add constraint "valid_entity_type" CHECK ((entity_type = ANY (ARRAY['task'::text, 'goal'::text, 'topic'::text]))) not valid;

alter table "public"."user_events" validate constraint "valid_entity_type";

alter table "public"."user_events" add constraint "valid_event_type" CHECK ((event_type = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'restored'::text, 'task.status_changed'::text, 'task.check_in'::text, 'task.record_added'::text, 'status_changed'::text, 'check_in'::text, 'record_added'::text, 'collaborator_added'::text, 'collaborator_removed'::text]))) not valid;

alter table "public"."user_events" validate constraint "valid_event_type";

alter table "public"."weekly_challenge_check_ins" add constraint "weekly_challenge_check_ins_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES weekly_challenges(id) ON DELETE CASCADE not valid;

alter table "public"."weekly_challenge_check_ins" validate constraint "weekly_challenge_check_ins_challenge_id_fkey";

alter table "public"."weekly_challenge_check_ins" add constraint "weekly_challenge_check_ins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."weekly_challenge_check_ins" validate constraint "weekly_challenge_check_ins_user_id_fkey";

alter table "public"."weekly_challenges" add constraint "weekly_challenges_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."weekly_challenges" validate constraint "weekly_challenges_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.backfill_user_events_from_existing_data()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  record_count INTEGER := 0;
  action_count INTEGER := 0;
  task_count INTEGER := 0;
BEGIN
  -- 1. 從 task_records 反向生成 record_added 事件（過濾掉 null task_id）
  INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content, created_at)
  SELECT 
    tr.author_id,
    'task',
    tr.task_id, -- task_records.task_id 已經是 TEXT 類型
    'record_added',
    jsonb_build_object(
      'record_id', tr.id,
      'content_length', length(COALESCE(tr.message, '')),
      'has_attachments', (tr.files IS NOT NULL AND jsonb_array_length(tr.files) > 0)
    ),
    tr.created_at
  FROM task_records tr
  WHERE tr.task_id IS NOT NULL 
    AND tr.author_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM user_events ue 
      WHERE ue.user_id = tr.author_id 
        AND ue.entity_type = 'task' 
        AND ue.entity_id = tr.task_id 
        AND ue.event_type = 'record_added'
        AND ue.created_at = tr.created_at
    );
  
  GET DIAGNOSTICS record_count = ROW_COUNT;
  
  -- 2. 從 task_actions 反向生成 check_in 事件（過濾掉 null task_id，並轉換類型）
  INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content, created_at)
  SELECT 
    ta.user_id,
    'task',
    ta.task_id::text, -- 轉換 UUID 為 TEXT
    'check_in',
    jsonb_build_object(
      'action_id', ta.id,
      'action_type', ta.action_type,
      'action_data', ta.action_data
    ),
    ta.action_timestamp
  FROM task_actions ta
  WHERE ta.task_id IS NOT NULL 
    AND ta.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM user_events ue 
      WHERE ue.user_id = ta.user_id 
        AND ue.entity_type = 'task' 
        AND ue.entity_id = ta.task_id::text 
        AND ue.event_type = 'check_in'
        AND ue.created_at = ta.action_timestamp
    );
  
  GET DIAGNOSTICS action_count = ROW_COUNT;
  
  -- 3. 從 tasks 表為所有非 todo 狀態的任務生成 status_changed 事件
  INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content, created_at)
  SELECT 
    COALESCE(t.completed_by, tp.owner_id) as user_id,
    'task',
    t.id::text, -- 轉換 UUID 為 TEXT
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
    AND t.id IS NOT NULL
    AND COALESCE(t.completed_by, tp.owner_id) IS NOT NULL
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
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_task_check_in(task_uuid uuid, user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
    deleted_count INTEGER;
BEGIN
    -- 刪除今日的打卡記錄
    DELETE FROM task_check_ins 
    WHERE task_id = task_uuid 
        AND user_id = user_uuid 
        AND check_in_date = CURRENT_DATE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        result := jsonb_build_object(
            'success', true,
            'message', '已取消今日打卡',
            'deleted_count', deleted_count
        );
    ELSE
        result := jsonb_build_object(
            'success', false,
            'message', '今日沒有打卡記錄可取消'
        );
    END IF;
    
    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_today_check_in_transaction(p_task_id uuid, p_user_id uuid, p_today date)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_task_data jsonb;
  v_progress_data jsonb;
  v_check_in_dates jsonb;
  v_new_progress_data jsonb;
  v_target_count int;
  v_current_count int;
  v_completion_percentage float;
  v_new_status text;
  v_updated_task tasks%ROWTYPE;
  v_config jsonb;
BEGIN
  -- 獲取任務資料
  SELECT to_jsonb(t.*) INTO v_task_data
  FROM tasks t
  WHERE t.id = p_task_id;

  IF v_task_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '找不到任務'
    );
  END IF;

  -- 開始 transaction
  BEGIN
    -- 1. 刪除今天的打卡記錄
    DELETE FROM task_actions
    WHERE task_id = p_task_id
      AND user_id = p_user_id
      AND action_type = 'check_in'
      AND action_date = p_today;

    -- 2. 更新任務進度
    v_progress_data := COALESCE(v_task_data->>'progress_data', '{}')::jsonb;
    v_check_in_dates := COALESCE(v_progress_data->'check_in_dates', '[]'::jsonb);
    v_config := COALESCE(v_task_data->>'task_config', '{}')::jsonb;
    
    -- 移除今天的日期
    v_check_in_dates := (
      SELECT jsonb_agg(value)
      FROM jsonb_array_elements_text(v_check_in_dates) AS value
      WHERE value != p_today::text
    );
    
    -- 處理空陣列情況
    IF v_check_in_dates IS NULL THEN
      v_check_in_dates := '[]'::jsonb;
    END IF;
    
    -- 計算新的進度數據
    IF (v_task_data->>'task_type') = 'count' THEN
      v_target_count := COALESCE((v_config->>'target_count')::int, 7);
      v_current_count := jsonb_array_length(v_check_in_dates);
      v_completion_percentage := CASE 
        WHEN v_target_count > 0 THEN (v_current_count::float / v_target_count::float) * 100
        ELSE 0
      END;
      
      v_new_progress_data := jsonb_build_object(
        'check_in_dates', v_check_in_dates,
        'current_count', v_current_count,
        'target_count', v_target_count,
        'completion_percentage', v_completion_percentage,
        'last_updated', now()
      );
    ELSIF (v_task_data->>'task_type') = 'streak' THEN
      -- 連續型任務邏輯（簡化版）
      v_new_progress_data := jsonb_build_object(
        'check_in_dates', v_check_in_dates,
        'current_streak', jsonb_array_length(v_check_in_dates),
        'max_streak', COALESCE((v_progress_data->>'max_streak')::int, 0),
        'last_updated', now()
      );
      v_completion_percentage := 0;
    END IF;
    
    -- 確定新狀態
    v_new_status := CASE 
      WHEN v_completion_percentage >= 100 THEN 'done'
      WHEN jsonb_array_length(v_check_in_dates) > 0 THEN 'in_progress'
      ELSE 'todo'
    END;

    -- 3. 更新任務進度
    UPDATE tasks 
    SET 
      progress_data = v_new_progress_data,
      status = v_new_status,
      updated_at = now()
    WHERE id = p_task_id
    RETURNING * INTO v_updated_task;

    -- 返回成功結果
    RETURN jsonb_build_object(
      'success', true,
      'task', to_jsonb(v_updated_task)
    );

  EXCEPTION WHEN OTHERS THEN
    -- 回滾 transaction
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM
    );
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_weekly_challenge_check_in(challenge_uuid uuid, user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
    deleted_count INTEGER;
    challenge_info RECORD;
BEGIN
    -- 檢查挑戰是否存在且活躍
    SELECT * INTO challenge_info 
    FROM weekly_challenges 
    WHERE id = challenge_uuid 
        AND user_id = user_uuid 
        AND is_active = true
        AND CURRENT_DATE BETWEEN start_date AND end_date;
    
    IF NOT FOUND THEN
        result := jsonb_build_object(
            'success', false,
            'message', '挑戰不存在或已結束'
        );
        RETURN result;
    END IF;
    
    -- 刪除今日的打卡記錄
    DELETE FROM weekly_challenge_check_ins 
    WHERE challenge_id = challenge_uuid 
        AND user_id = user_uuid 
        AND check_in_date = CURRENT_DATE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        result := jsonb_build_object(
            'success', true,
            'message', '已取消今日打卡',
            'deleted_count', deleted_count
        );
    ELSE
        result := jsonb_build_object(
            'success', false,
            'message', '今日沒有打卡記錄可取消'
        );
    END IF;
    
    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_daily_check_in(challenge_uuid uuid, user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM weekly_challenge_check_ins 
        WHERE challenge_id = challenge_uuid 
            AND user_id = user_uuid 
            AND check_in_date = CURRENT_DATE
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_task_record_with_event(p_task_id uuid, p_user_id uuid, p_content text, p_attachments jsonb DEFAULT '[]'::jsonb, p_is_ai_generated boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  record_id UUID;
  event_id UUID;
  task_record RECORD;
BEGIN
  -- 檢查任務是否存在
  SELECT * INTO task_record FROM tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  -- 插入任務記錄
  INSERT INTO task_records (task_id, user_id, content, attachments, is_ai_generated)
  VALUES (p_task_id, p_user_id, p_content, p_attachments, p_is_ai_generated)
  RETURNING id INTO record_id;
  
  -- 記錄事件
  INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content)
  VALUES (
    p_user_id, 'task', p_task_id::TEXT, 'task.record_added',
    jsonb_build_object('record_id', record_id, 'content', p_content, 'is_ai_generated', p_is_ai_generated)
  ) RETURNING id INTO event_id;
  
  RETURN jsonb_build_object('success', true, 'record_id', record_id, 'event_id', event_id);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_active_tasks_for_user(p_user_id uuid)
 RETURNS TABLE(task_id uuid, task_title text, task_description text, task_status text, task_priority text, task_need_help boolean, task_version integer, task_created_at timestamp with time zone, task_updated_at timestamp with time zone, goal_id uuid, goal_title text, goal_status text, topic_id uuid, topic_title text, topic_subject text, topic_status text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tk.id as task_id,
    tk.title as task_title,
    tk.description as task_description,
    tk.status as task_status,
    tk.priority as task_priority,
    tk.need_help as task_need_help,
    tk.version as task_version,
    tk.created_at as task_created_at,
    tk.updated_at as task_updated_at,
    g.id as goal_id,
    g.title as goal_title,
    g.status as goal_status,
    t.id as topic_id,
    t.title as topic_title,
    t.subject as topic_subject,
    t.status as topic_status
  FROM tasks tk
  JOIN goals g ON tk.goal_id = g.id
  JOIN topics_new t ON g.topic_id = t.id
  WHERE t.owner_id = p_user_id
    AND t.status = 'active'
    AND g.status = 'active'
    AND tk.status IN ('todo', 'in_progress')
  ORDER BY 
    CASE tk.status WHEN 'in_progress' THEN 1 ELSE 2 END,
    CASE tk.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    tk.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_active_topics_with_progress()
 RETURNS TABLE(topic_id text, topic_title text, topic_subject text, status text, total_tasks bigint, completed_tasks bigint, completion_rate numeric, last_activity_date date, has_recent_activity boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH topic_stats AS (
    SELECT 
      tp.id as topic_id,
      tp.title as topic_title,
      tp.subject as topic_subject,
      tp.status,
      COUNT(DISTINCT t.id) as total_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
      MAX(GREATEST(
        COALESCE(ta.action_date, '1970-01-01'::date),
        COALESCE(tr.created_at::date, '1970-01-01'::date),
        COALESCE(t.completed_at::date, '1970-01-01'::date)
      )) as last_activity_date
    FROM topics tp
    LEFT JOIN goals g ON tp.id = g.topic_id AND g.status != 'archived'
    LEFT JOIN tasks t ON g.id = t.goal_id AND t.status != 'archived'
    LEFT JOIN task_actions ta ON t.id::text = ta.task_id::text
    LEFT JOIN task_records tr ON t.id::text = tr.task_id::text
    WHERE tp.status IN ('active', 'in_progress')
    GROUP BY tp.id, tp.title, tp.subject, tp.status
  )
  SELECT 
    ts.topic_id::TEXT,
    ts.topic_title,
    ts.topic_subject,
    ts.status,
    ts.total_tasks,
    ts.completed_tasks,
    CASE WHEN ts.total_tasks > 0 THEN ROUND((ts.completed_tasks::numeric / ts.total_tasks::numeric) * 100, 2) ELSE 0 END as completion_rate,
    CASE WHEN ts.last_activity_date = '1970-01-01'::date THEN NULL ELSE ts.last_activity_date END as last_activity_date,
    CASE WHEN ts.last_activity_date >= (CURRENT_DATE - INTERVAL '7 days')::date THEN true ELSE false END as has_recent_activity
  FROM topic_stats ts
  ORDER BY ts.last_activity_date DESC NULLS LAST, ts.topic_title;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_completed_tasks_for_date(target_date date, target_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- 合併任務記錄和已完成任務
  WITH task_data AS (
    -- 從 task_records 獲取記錄
    SELECT 
      tr.task_id::text as id,
      tr.title,
      'recorded' as type,
      tr.difficulty,
      tr.created_at::text as time,
      NULL as category,
      NULL as assigned_to
    FROM task_records tr
    WHERE 
      tr.author_id = target_user_id
      AND DATE(tr.created_at) = target_date
      AND tr.task_id IS NOT NULL
    
    UNION ALL
    
    -- 從 tasks 獲取完成的任務
    SELECT 
      t.id::text,
      t.title,
      'completed' as type,
      NULL as difficulty,
      t.completed_at::text as time,
      top.title as category,
      g.title as assigned_to
    FROM tasks t
    JOIN goals g ON t.goal_id = g.id
    JOIN topics top ON g.topic_id = top.id
    WHERE 
      t.completed_by = target_user_id
      AND DATE(t.completed_at) = target_date
      AND t.status = 'done'
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'type', type,
      'difficulty', difficulty,
      'time', time,
      'category', category,
      'assignedTo', assigned_to
    )
  ) INTO result
  FROM task_data;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_completed_tasks_for_week(week_start date, week_end date, user_id uuid)
 RETURNS TABLE(id uuid, title text, topic_title text, completed_at timestamp with time zone, difficulty integer)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT 
        t.id,
        t.title,
        tp.title as topic_title,
        COALESCE(t.completed_at, t.updated_at) as completed_at,
        3 as difficulty  -- 預設難度，可以根據需要調整
    FROM tasks t
    JOIN goals g ON t.goal_id = g.id
    JOIN topics tp ON g.topic_id = tp.id
    WHERE t.status = 'done'
      AND t.owner_id = user_id
      AND COALESCE(t.completed_at, t.updated_at)::DATE >= week_start
      AND COALESCE(t.completed_at, t.updated_at)::DATE <= week_end
    ORDER BY COALESCE(t.completed_at, t.updated_at) DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_weekly_challenge(user_uuid uuid)
 RETURNS TABLE(id uuid, title text, description text, start_date date, end_date date, target_days integer, check_in_count bigint, is_completed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        wc.id,
        wc.title,
        wc.description,
        wc.start_date,
        wc.end_date,
        wc.target_days,
        COALESCE(COUNT(wcci.id), 0) as check_in_count,
        COALESCE(COUNT(wcci.id), 0) >= wc.target_days as is_completed
    FROM weekly_challenges wc
    LEFT JOIN weekly_challenge_check_ins wcci ON wc.id = wcci.challenge_id
    WHERE wc.user_id = user_uuid 
        AND wc.is_active = true
        AND CURRENT_DATE BETWEEN wc.start_date AND wc.end_date
    GROUP BY wc.id, wc.title, wc.description, wc.start_date, wc.end_date, wc.target_days
    ORDER BY wc.created_at DESC
    LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_daily_activity_stats(p_user_id text, p_start_date text, p_end_date text)
 RETURNS TABLE(date date, total_activities bigint, status_changes bigint, check_ins bigint, records bigint, active_tasks jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_daily_activity_stats_v2(p_user_id text, p_start_date text, p_end_date text)
 RETURNS TABLE(date date, total_activities bigint, status_changes bigint, completed_tasks bigint, check_ins bigint, records bigint, active_tasks jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date::date, p_end_date::date, '1 day'::interval)::date as date
  ),
  daily_events AS (
    SELECT 
      ds.date,
      COUNT(ue.id) FILTER (WHERE ue.event_type = 'status_changed') as status_changes,
      COUNT(ue.id) FILTER (WHERE ue.event_type = 'status_changed' AND ue.content->>'to_status' = 'done') as completed_tasks,
      COUNT(ue.id) FILTER (WHERE ue.event_type = 'check_in') as check_ins,
      COUNT(ue.id) FILTER (WHERE ue.event_type = 'record_added') as records,
      COUNT(DISTINCT ue.entity_id) FILTER (WHERE ue.entity_type = 'task') as total_activities,
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', ue.entity_id,
            'event_type', ue.event_type,
            'content', ue.content,
            'created_at', ue.created_at,
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_daily_activity_stats_v2(p_user_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(date date, total_activities bigint, status_changes bigint, completed_tasks bigint, check_ins bigint, records bigint, active_tasks jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::DATE as event_date
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
      AND DATE(ue.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(ue.created_at)
  )
  SELECT 
    ds.event_date,
    COALESCE(de.total_activities, 0)::BIGINT,
    COALESCE(de.completed_tasks, 0)::BIGINT,  -- status_changes 欄位，實際是完成任務數
    COALESCE(de.completed_tasks, 0)::BIGINT,  -- completed_tasks 欄位
    COALESCE(de.check_ins, 0)::BIGINT,
    COALESCE(de.records, 0)::BIGINT,
    COALESCE(de.active_task_ids, '[]'::jsonb) as active_tasks
  FROM date_series ds
  LEFT JOIN daily_events de ON ds.event_date = de.event_date
  ORDER BY ds.event_date;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_retro_session(p_user_id uuid, p_week_id text)
 RETURNS TABLE(id uuid, user_id uuid, week_id text, questions_drawn jsonb, answers_completed integer, status text, created_at timestamp with time zone, updated_at timestamp with time zone, week_stats jsonb, session_answers jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    session_record retro_sessions%ROWTYPE;
    stats_data jsonb;
    answers_data jsonb;
    week_start_date date;
    week_end_date date;
BEGIN
    -- 嘗試獲取現有的 session
    SELECT * INTO session_record
    FROM retro_sessions rs
    WHERE rs.user_id = p_user_id AND rs.week_id = p_week_id;
    
    -- 如果不存在，創建新的 session
    IF NOT FOUND THEN
        INSERT INTO retro_sessions (user_id, week_id, status)
        VALUES (p_user_id, p_week_id, 'active')
        RETURNING * INTO session_record;
    END IF;
    
    -- 計算週開始和結束日期 (假設 week_id 格式為 YYYY-WW)
    -- 這裡使用簡化的計算，實際可能需要更精確的週計算
    week_start_date := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer;
    week_end_date := week_start_date + 6;
    
    -- 獲取週統計數據 (使用現有的 RPC 函數)
    SELECT jsonb_agg(to_jsonb(stats.*)) INTO stats_data
    FROM get_daily_activity_stats(p_user_id::text, week_start_date::text, week_end_date::text) stats;
    
    -- 獲取該 session 的所有答案
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', ra.id,
            'question', ra.question,
            'isCustomQuestion', ra.is_custom_question,
            'customQuestion', ra.custom_question,
            'answer', ra.answer,
            'mood', ra.mood,
            'emoji', ra.emoji,
            'createdAt', ra.created_at
        ) ORDER BY ra.created_at
    ), '[]'::jsonb) INTO answers_data
    FROM retro_answers ra
    WHERE ra.session_id = session_record.id;
    
    -- 返回完整的 session 數據
    RETURN QUERY SELECT
        session_record.id,
        session_record.user_id,
        session_record.week_id,
        session_record.questions_drawn,
        session_record.answers_completed,
        session_record.status,
        session_record.created_at,
        session_record.updated_at,
        COALESCE(stats_data, '[]'::jsonb),
        answers_data;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_retro_week_summary(p_user_id uuid, p_week_start date, p_week_end date)
 RETURNS TABLE(daily_data jsonb, week_data jsonb, completed_data jsonb, topics_data jsonb)
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
          'completed_at', t.completed_at
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_task_activities_for_date(p_user_id text, p_date text)
 RETURNS TABLE(statuschanges jsonb, checkins jsonb, records jsonb, totalactivities bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH date_events AS (
    SELECT
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'task_id', ue.entity_id,
          'task_title', t.title,
          'old_status', (ue.content->>'from_status'),
          'new_status', (ue.content->>'to_status'),
          'changed_at', ue.created_at,
          'topic_title', tp.title,
          'goal_title', g.title
        )
      ) FILTER (WHERE ue.event_type = 'task.status_changed'), '[]'::jsonb) as status_changes,
      
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'task_id', ue.entity_id,
          'task_title', t.title,
          'action_timestamp', ue.created_at,
          'action_data', ue.content,
          'topic_title', tp.title,
          'goal_title', g.title
        )
      ) FILTER (WHERE ue.event_type = 'task.check_in'), '[]'::jsonb) as check_ins,
      
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'task_id', ue.entity_id,
          'task_title', t.title,
          'record_id', (ue.content->>'record_id'),
          'created_at', ue.created_at,
          'topic_title', tp.title,
          'goal_title', g.title
        )
      ) FILTER (WHERE ue.event_type = 'task.record_added'), '[]'::jsonb) as records,
      
      COUNT(DISTINCT ue.entity_id) as total_activities
      
    FROM user_events ue
    LEFT JOIN tasks t ON t.id::TEXT = ue.entity_id
    LEFT JOIN goals g ON t.goal_id = g.id
    LEFT JOIN topics tp ON g.topic_id = tp.id
    WHERE ue.user_id = p_user_id::uuid
      AND ue.entity_type = 'task'
      AND DATE(ue.created_at) = p_date::date
  )
  SELECT 
    de.status_changes,
    de.check_ins,
    de.records,
    de.total_activities
  FROM date_events de;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_task_check_in_history(task_uuid uuid, user_uuid uuid)
 RETURNS TABLE(id uuid, checked_in_at timestamp with time zone, check_in_date date, note text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        tci.id,
        tci.checked_in_at,
        tci.check_in_date,
        tci.note
    FROM task_check_ins tci
    WHERE tci.task_id = task_uuid 
        AND tci.user_id = user_uuid
    ORDER BY tci.check_in_date DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_task_today_actions(p_task_id text)
 RETURNS TABLE(action_type text, action_timestamp timestamp with time zone, action_data jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ta.action_type,
    ta.action_timestamp,
    ta.action_data
  FROM task_actions ta
  WHERE ta.task_id = p_task_id::uuid
    AND ta.action_date = CURRENT_DATE
  ORDER BY ta.action_timestamp DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_today_check_in_status(challenge_uuid uuid, user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
    check_in_record RECORD;
BEGIN
    -- 查找今日的打卡記錄
    SELECT * INTO check_in_record
    FROM weekly_challenge_check_ins 
    WHERE challenge_id = challenge_uuid 
        AND user_id = user_uuid 
        AND check_in_date = CURRENT_DATE;
    
    IF FOUND THEN
        result := jsonb_build_object(
            'is_checked_in', true,
            'check_in_id', check_in_record.id::TEXT,
            'checked_in_at', check_in_record.checked_in_at,
            'note', check_in_record.note
        );
    ELSE
        result := jsonb_build_object(
            'is_checked_in', false,
            'check_in_id', null,
            'checked_in_at', null,
            'note', null
        );
    END IF;
    
    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_today_task_activities(p_user_id text)
 RETURNS TABLE(statuschanges jsonb, checkins jsonb, records jsonb, totalactivities bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH today_date AS (
    SELECT CURRENT_DATE as today
  ),
  today_events AS (
    SELECT
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'task_id', ue.entity_id,
          'task_title', t.title,
          'old_status', (ue.content->>'from_status'),
          'new_status', (ue.content->>'to_status'),
          'changed_at', ue.created_at,
          'topic_title', tp.title,
          'goal_title', g.title
        )
      ) FILTER (WHERE ue.event_type = 'task.status_changed'), '[]'::jsonb) as status_changes,
      
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'task_id', ue.entity_id,
          'task_title', t.title,
          'action_timestamp', ue.created_at,
          'action_data', ue.content,
          'topic_title', tp.title,
          'goal_title', g.title
        )
      ) FILTER (WHERE ue.event_type = 'task.check_in'), '[]'::jsonb) as check_ins,
      
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'task_id', ue.entity_id,
          'task_title', t.title,
          'record_id', (ue.content->>'record_id'),
          'created_at', ue.created_at,
          'topic_title', tp.title,
          'goal_title', g.title
        )
      ) FILTER (WHERE ue.event_type = 'task.record_added'), '[]'::jsonb) as records,
      
      COUNT(DISTINCT ue.entity_id) as total_activities
      
    FROM user_events ue
    LEFT JOIN tasks t ON t.id::TEXT = ue.entity_id
    LEFT JOIN goals g ON t.goal_id = g.id  
    LEFT JOIN topics tp ON g.topic_id = tp.id
    WHERE ue.user_id = p_user_id::uuid
      AND ue.entity_type = 'task'
      AND DATE(ue.created_at) = CURRENT_DATE
  )
  SELECT 
    te.status_changes,
    te.check_ins, 
    te.records,
    te.total_activities
  FROM today_events te;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_topic_with_structure(p_topic_id uuid)
 RETURNS TABLE(topic_data jsonb, goals_data jsonb, tasks_data jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(t.*) as topic_data,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'title', g.title,
          'description', g.description,
          'status', g.status,
          'priority', g.priority,
          'order_index', g.order_index,
          'version', g.version,
          'created_at', g.created_at,
          'updated_at', g.updated_at
        ) ORDER BY g.order_index, g.created_at
      ) FILTER (WHERE g.id IS NOT NULL),
      '[]'::jsonb
    ) as goals_data,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', tk.id,
          'goal_id', tk.goal_id,
          'title', tk.title,
          'description', tk.description,
          'status', tk.status,
          'priority', tk.priority,
          'order_index', tk.order_index,
          'need_help', tk.need_help,
          'help_message', tk.help_message,
          'reply_message', tk.reply_message,
          'reply_at', tk.reply_at,
          'replied_by', tk.replied_by,
          'completed_at', tk.completed_at,
          'completed_by', tk.completed_by,
          'estimated_minutes', tk.estimated_minutes,
          'actual_minutes', tk.actual_minutes,
          'version', tk.version,
          'created_at', tk.created_at,
          'updated_at', tk.updated_at
        ) ORDER BY tk.order_index, tk.created_at
      ) FILTER (WHERE tk.id IS NOT NULL),
      '[]'::jsonb
    ) as tasks_data
  FROM topics t
  LEFT JOIN goals g ON t.id = g.topic_id AND g.status != 'archived'
  LEFT JOIN tasks tk ON g.id = tk.goal_id AND tk.status != 'archived'
  WHERE t.id = p_topic_id AND t.status != 'archived'
  GROUP BY t.id, t.owner_id, t.title, t.description, t.subject, t.category, 
           t.status, t.topic_type, t.template_id, t.template_version, t.is_collaborative, 
           t.show_avatars, t.due_date, t.focus_element, t.bubbles, t.version, 
           t.created_at, t.updated_at;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_topics_progress_for_week(p_week_start text, p_week_end text)
 RETURNS TABLE(topic_id text, topic_title text, topic_subject text, is_active boolean, progress_snapshot jsonb, goals_summary jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH week_activities AS (
    -- 獲取本週的所有活動
    SELECT 
      t.id as task_id,
      t.goal_id,
      g.topic_id,
      COUNT(CASE WHEN ta.action_type = 'check_in' THEN 1 END) as check_ins,
      COUNT(CASE WHEN tr.id IS NOT NULL THEN 1 END) as records,
      COUNT(CASE WHEN t.status = 'done' AND t.completed_at::date >= p_week_start::date AND t.completed_at::date <= p_week_end::date THEN 1 END) as status_changes
    FROM tasks t
    LEFT JOIN goals g ON t.goal_id = g.id
    LEFT JOIN task_actions ta ON t.id::text = ta.task_id::text
      AND ta.action_date >= p_week_start::date 
      AND ta.action_date <= p_week_end::date
    LEFT JOIN task_records tr ON t.id::text = tr.task_id::text
      AND tr.created_at::date >= p_week_start::date 
      AND tr.created_at::date <= p_week_end::date
    WHERE t.status != 'archived' 
      AND g.status != 'archived'
    GROUP BY t.id, t.goal_id, g.topic_id
  ),
  topic_stats AS (
    -- 計算每個主題的統計
    SELECT 
      tp.id as topic_id,
      tp.title as topic_title,
      tp.subject as topic_subject,
      COUNT(DISTINCT t.id) as total_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
      COALESCE(SUM(wa.check_ins), 0) as total_check_ins,
      COALESCE(SUM(wa.records), 0) as total_records,
      COALESCE(SUM(wa.status_changes), 0) as total_status_changes,
      CASE WHEN SUM(wa.check_ins + wa.records + wa.status_changes) > 0 THEN true ELSE false END as is_active
    FROM topics tp
    LEFT JOIN goals g ON tp.id = g.topic_id AND g.status != 'archived'
    LEFT JOIN tasks t ON g.id = t.goal_id AND t.status != 'archived'
    LEFT JOIN week_activities wa ON t.id = wa.task_id
    WHERE tp.status != 'archived'
    GROUP BY tp.id, tp.title, tp.subject
  ),
  goals_data AS (
    -- 獲取每個主題的目標摘要
    SELECT 
      tp.id as topic_id,
      jsonb_agg(
        jsonb_build_object(
          'goal_id', g.id,
          'goal_title', g.title,
          'total_tasks', COALESCE(goal_task_count.task_count, 0),
          'completed_tasks', COALESCE(goal_task_count.completed_count, 0),
          'has_activity', COALESCE(goal_activity.has_activity, false)
        )
      ) FILTER (WHERE g.id IS NOT NULL) as goals_summary
    FROM topics tp
    LEFT JOIN goals g ON tp.id = g.topic_id AND g.status != 'archived'
    LEFT JOIN (
      SELECT 
        goal_id,
        COUNT(*) as task_count,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_count
      FROM tasks 
      WHERE status != 'archived'
      GROUP BY goal_id
    ) goal_task_count ON g.id = goal_task_count.goal_id
    LEFT JOIN (
      SELECT 
        g.id as goal_id,
        CASE WHEN COUNT(wa.task_id) > 0 THEN true ELSE false END as has_activity
      FROM goals g
      LEFT JOIN week_activities wa ON g.id = wa.goal_id
      GROUP BY g.id
    ) goal_activity ON g.id = goal_activity.goal_id
    WHERE tp.status != 'archived'
    GROUP BY tp.id
  )
  SELECT 
    ts.topic_id::TEXT,
    ts.topic_title,
    ts.topic_subject,
    ts.is_active,
    jsonb_build_object(
      'total_tasks', ts.total_tasks,
      'completed_tasks', ts.completed_tasks,
      'completion_rate', CASE WHEN ts.total_tasks > 0 THEN ROUND((ts.completed_tasks::numeric / ts.total_tasks::numeric) * 100, 2) ELSE 0 END,
      'status_changes', ts.total_status_changes,
      'check_ins', ts.total_check_ins,
      'records', ts.total_records
    ) as progress_snapshot,
    COALESCE(gd.goals_summary, '[]'::jsonb) as goals_summary
  FROM topic_stats ts
  LEFT JOIN goals_data gd ON ts.topic_id = gd.topic_id
  ORDER BY ts.is_active DESC, ts.topic_title;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_event_stats(p_user_id uuid, p_start_date date, p_end_date date, p_entity_type text DEFAULT NULL::text, p_event_type text DEFAULT NULL::text)
 RETURNS TABLE(date date, total_events bigint, event_breakdown jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_task_activities_for_date(p_date text)
 RETURNS TABLE(completed_tasks jsonb, checked_in_tasks jsonb, recorded_tasks jsonb, all_activities jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH date_activities AS (
    SELECT
      -- 完成的任務
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', ue.entity_id,
          'title', t.title,
          'topic_title', tp.title,
          'goal_title', g.title,
          'completed_at', ue.created_at,
          'type', 'completed'
        )
      ) FILTER (WHERE ue.event_type = 'task.status_changed' AND (ue.content->>'to_status') = 'done'), '[]'::jsonb) as completed,
      
      -- 打卡的任務
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', ue.entity_id,
          'title', t.title,
          'topic_title', tp.title,
          'goal_title', g.title,
          'action_timestamp', ue.created_at,
          'action_data', ue.content,
          'type', 'check_in'
        )
      ) FILTER (WHERE ue.event_type = 'task.check_in'), '[]'::jsonb) as checked_in,
      
      -- 記錄的任務
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', ue.entity_id,
          'title', t.title,
          'topic_title', tp.title,
          'goal_title', g.title,
          'record_id', (ue.content->>'record_id'),
          'created_at', ue.created_at,
          'type', 'record'
        )
      ) FILTER (WHERE ue.event_type = 'task.record_added'), '[]'::jsonb) as recorded,
      
      -- 所有活動
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', ue.entity_id,
          'title', t.title,
          'topic_title', tp.title,
          'goal_title', g.title,
          'timestamp', ue.created_at,
          'type', CASE 
            WHEN ue.event_type = 'task.status_changed' AND (ue.content->>'to_status') = 'done' THEN 'completed'
            WHEN ue.event_type = 'task.check_in' THEN 'check_in'
            WHEN ue.event_type = 'task.record_added' THEN 'record'
            ELSE 'other'
          END,
          'data', ue.content
        )
      ), '[]'::jsonb) as all_activities
      
    FROM user_events ue
    LEFT JOIN tasks t ON t.id::TEXT = ue.entity_id
    LEFT JOIN goals g ON t.goal_id = g.id
    LEFT JOIN topics tp ON g.topic_id = tp.id
    WHERE ue.entity_type = 'task'
      AND DATE(ue.created_at) = p_date::date
  )
  SELECT 
    da.completed,
    da.checked_in,
    da.recorded,
    da.all_activities
  FROM date_activities da;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_weekly_challenge_stats(challenge_uuid uuid)
 RETURNS TABLE(total_days integer, completed_days bigint, completion_rate numeric, check_in_dates date[])
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        (wc.end_date - wc.start_date + 1)::INTEGER as total_days,
        COUNT(wcci.id) as completed_days,
        ROUND((COUNT(wcci.id)::NUMERIC / (wc.end_date - wc.start_date + 1)::NUMERIC) * 100, 2) as completion_rate,
        ARRAY_AGG(wcci.check_in_date ORDER BY wcci.check_in_date) as check_in_dates
    FROM weekly_challenges wc
    LEFT JOIN weekly_challenge_check_ins wcci ON wc.id = wcci.challenge_id
    WHERE wc.id = challenge_uuid
    GROUP BY wc.id, wc.start_date, wc.end_date;
END;
$function$
;

create or replace view "public"."group_retro_session_summary" as  SELECT s.id,
    s.title,
    s.week_id,
    s.created_by,
    s.status,
    s.created_at,
    s.completed_at,
    array_length(s.participant_ids, 1) AS participant_count,
    count(DISTINCT q.id) AS question_count,
    count(DISTINCT r.id) AS reply_count,
    count(DISTINCT r.user_id) AS replied_participant_count
   FROM ((group_retro_sessions s
     LEFT JOIN group_retro_questions q ON ((s.id = q.session_id)))
     LEFT JOIN group_retro_replies r ON ((s.id = r.session_id)))
  GROUP BY s.id, s.title, s.week_id, s.created_by, s.status, s.created_at, s.completed_at, s.participant_ids;


CREATE OR REPLACE FUNCTION public.has_task_activity_today(p_task_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_events ue
    WHERE ue.entity_id = p_task_id
      AND ue.entity_type = 'task'
      AND DATE(ue.created_at) = CURRENT_DATE
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.perform_task_action_transaction(p_task_id uuid, p_action_type text, p_action_date date, p_action_timestamp timestamp with time zone, p_user_id uuid, p_action_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  task_record RECORD;
  action_id UUID;
  event_id UUID;
BEGIN
  -- 檢查任務是否存在
  SELECT * INTO task_record FROM tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  -- 檢查今天是否已經執行過此動作
  IF p_action_type = 'check_in' THEN
    IF EXISTS (
      SELECT 1 FROM task_actions 
      WHERE task_id = p_task_id 
        AND action_type = p_action_type 
        AND action_date = p_action_date
        AND user_id = p_user_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'message', 'Action already performed today');
    END IF;
  END IF;
  
  -- 插入動作記錄
  INSERT INTO task_actions (task_id, user_id, action_type, action_date, action_timestamp, action_data)
  VALUES (p_task_id, p_user_id, p_action_type, p_action_date, p_action_timestamp, p_action_data)
  RETURNING id INTO action_id;
  
  -- 記錄事件
  INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content)
  VALUES (
    p_user_id, 'task', p_task_id::TEXT, 'task.' || p_action_type,
    jsonb_build_object('action_id', action_id, 'action_type', p_action_type, 'action_data', p_action_data)
  ) RETURNING id INTO event_id;
  
  -- 重新獲取任務
  SELECT * INTO task_record FROM tasks WHERE id = p_task_id;
  
  RETURN jsonb_build_object('success', true, 'action_id', action_id, 'event_id', event_id, 'task', row_to_json(task_record));
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_user_event(p_user_id uuid, p_entity_type text, p_entity_id text, p_event_type text, p_content jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content)
  VALUES (p_user_id, p_entity_type, p_entity_id, p_event_type, p_content)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.safe_update_goal(p_id uuid, p_expected_version integer, p_title text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_priority text DEFAULT NULL::text, p_order_index integer DEFAULT NULL::integer, p_need_help boolean DEFAULT NULL::boolean, p_help_message text DEFAULT NULL::text, p_help_resolved_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  current_version INTEGER;
  new_version INTEGER;
  result JSON;
BEGIN
  -- 檢查當前版本
  SELECT version INTO current_version FROM goals WHERE id = p_id;
  
  IF current_version IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Goal not found');
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
  
  -- 更新目標
  UPDATE goals SET
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    status = COALESCE(p_status, status),
    priority = COALESCE(p_priority, priority),
    order_index = COALESCE(p_order_index, order_index),
    need_help = COALESCE(p_need_help, need_help),
    help_message = COALESCE(p_help_message, help_message),
    help_resolved_at = COALESCE(p_help_resolved_at, help_resolved_at),
    version = new_version,
    updated_at = now()
  WHERE id = p_id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Goal updated successfully',
    'new_version', new_version
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.safe_update_task(p_id uuid, p_expected_version integer, p_title text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_priority text DEFAULT NULL::text, p_order_index integer DEFAULT NULL::integer, p_need_help boolean DEFAULT NULL::boolean, p_help_message text DEFAULT NULL::text, p_reply_message text DEFAULT NULL::text, p_reply_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_replied_by uuid DEFAULT NULL::uuid, p_completed_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_completed_by uuid DEFAULT NULL::uuid, p_estimated_minutes integer DEFAULT NULL::integer, p_actual_minutes integer DEFAULT NULL::integer)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  current_task RECORD;
  old_status TEXT;
  new_status TEXT;
  event_id UUID;
  result JSON;
BEGIN
  -- 獲取當前任務並檢查版本
  SELECT * INTO current_task FROM tasks WHERE id = p_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  IF current_task.version != p_expected_version THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Version conflict detected',
      'current_version', current_task.version
    );
  END IF;
  
  -- 記錄舊狀態以便事件記錄
  old_status := current_task.status;
  new_status := COALESCE(p_status, old_status);
  
  -- 執行更新
  UPDATE tasks 
  SET 
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
  WHERE id = p_id;
  
  -- 如果狀態發生變化，記錄事件
  IF old_status != new_status AND p_completed_by IS NOT NULL THEN
    INSERT INTO user_events (user_id, entity_type, entity_id, event_type, content)
    VALUES (
      p_completed_by,
      'task',
      p_id::TEXT,
      'task.status_changed',
      json_build_object(
        'from_status', old_status,
        'to_status', new_status,
        'completed_at', p_completed_at
      )::jsonb
    ) RETURNING id INTO event_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Task updated successfully',
    'event_id', event_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.safe_update_topic(p_id uuid, p_expected_version integer, p_title text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_subject text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_topic_type text DEFAULT NULL::text, p_is_collaborative boolean DEFAULT NULL::boolean, p_show_avatars boolean DEFAULT NULL::boolean, p_due_date timestamp without time zone DEFAULT NULL::timestamp without time zone, p_focus_element jsonb DEFAULT NULL::jsonb, p_bubbles jsonb DEFAULT NULL::jsonb)
 RETURNS TABLE(success boolean, current_version integer, message text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  current_ver INTEGER;
BEGIN
  -- 獲取當前版本
  SELECT version INTO current_ver FROM topics WHERE id = p_id;
  
  -- 檢查記錄是否存在
  IF current_ver IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'Record not found';
    RETURN;
  END IF;
  
  -- 檢查版本衝突
  IF current_ver != p_expected_version THEN
    RETURN QUERY SELECT FALSE, current_ver, 'Version conflict detected';
    RETURN;
  END IF;
  
  -- 執行更新
  UPDATE topics 
  SET 
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
  WHERE id = p_id;
  
  RETURN QUERY SELECT TRUE, current_ver + 1, 'Update successful';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.save_retro_answer(p_session_id uuid, p_question jsonb, p_answer text, p_mood text, p_is_custom_question boolean DEFAULT false, p_custom_question text DEFAULT NULL::text, p_emoji text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, session_id uuid, question jsonb, answer text, mood text, emoji text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    answer_record retro_answers%ROWTYPE;
    session_user_id uuid;
    session_week_id text;
BEGIN
    -- 獲取 session 信息以確保權限
    SELECT user_id, week_id INTO session_user_id, session_week_id
    FROM retro_sessions
    WHERE retro_sessions.id = p_session_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found';
    END IF;
    
    -- 檢查當前用戶是否有權限
    IF session_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access to session';
    END IF;
    
    -- 插入答案記錄
    INSERT INTO retro_answers (
        user_id,
        session_id,
        date,
        week_id,
        question,
        is_custom_question,
        custom_question,
        answer,
        mood,
        emoji
    ) VALUES (
        session_user_id,
        p_session_id,
        CURRENT_DATE,
        session_week_id,
        p_question,
        p_is_custom_question,
        p_custom_question,
        p_answer,
        p_mood,
        p_emoji
    )
    RETURNING * INTO answer_record;
    
    -- 返回新創建的答案
    RETURN QUERY SELECT
        answer_record.id,
        answer_record.session_id,
        answer_record.question,
        answer_record.answer,
        answer_record.mood,
        answer_record.emoji,
        answer_record.created_at;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.task_check_in(task_uuid uuid, user_uuid uuid, note_text text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
    existing_check_in RECORD;
    new_check_in_id UUID;
BEGIN
    -- 檢查是否已經打卡
    SELECT * INTO existing_check_in 
    FROM task_check_ins 
    WHERE task_id = task_uuid 
        AND user_id = user_uuid 
        AND check_in_date = CURRENT_DATE;
    
    IF FOUND THEN
        result := jsonb_build_object(
            'success', false,
            'message', '今日已經打卡了',
            'check_in_id', existing_check_in.id::TEXT
        );
    ELSE
        -- 插入新的打卡記錄
        INSERT INTO task_check_ins (task_id, user_id, note, check_in_date)
        VALUES (task_uuid, user_uuid, note_text, CURRENT_DATE)
        RETURNING id INTO new_check_in_id;
        
        result := jsonb_build_object(
            'success', true,
            'message', '打卡成功',
            'check_in_id', new_check_in_id::TEXT
        );
    END IF;
    
    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_daily_journals_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_retro_session_answers_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- 當新增答案時，更新 session 的 answers_completed 計數
    IF TG_OP = 'INSERT' AND NEW.session_id IS NOT NULL THEN
        UPDATE retro_sessions 
        SET answers_completed = answers_completed + 1,
            updated_at = now()
        WHERE id = NEW.session_id;
    END IF;
    
    -- 當刪除答案時，減少 session 的 answers_completed 計數
    IF TG_OP = 'DELETE' AND OLD.session_id IS NOT NULL THEN
        UPDATE retro_sessions 
        SET answers_completed = GREATEST(0, answers_completed - 1),
            updated_at = now()
        WHERE id = OLD.session_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_session_questions(p_session_id uuid, p_questions jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE retro_sessions
    SET questions_drawn = p_questions,
        updated_at = now()
    WHERE id = p_session_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_task_actions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_version_and_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- 更新版本號和時間戳
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.weekly_challenge_check_in(challenge_uuid uuid, user_uuid uuid, note_text text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
    existing_check_in RECORD;
    challenge_info RECORD;
    new_check_in_id UUID;
BEGIN
    -- 檢查挑戰是否存在且活躍
    SELECT * INTO challenge_info 
    FROM weekly_challenges 
    WHERE id = challenge_uuid 
        AND user_id = user_uuid 
        AND is_active = true
        AND CURRENT_DATE BETWEEN start_date AND end_date;
    
    IF NOT FOUND THEN
        result := jsonb_build_object(
            'success', false,
            'message', '挑戰不存在或已結束'
        );
        RETURN result;
    END IF;
    
    -- 檢查是否已經打卡
    SELECT * INTO existing_check_in 
    FROM weekly_challenge_check_ins 
    WHERE challenge_id = challenge_uuid 
        AND user_id = user_uuid 
        AND check_in_date = CURRENT_DATE;
    
    IF FOUND THEN
        result := jsonb_build_object(
            'success', false,
            'message', '今日已經打卡了',
            'check_in_id', existing_check_in.id::TEXT
        );
    ELSE
        -- 插入新的打卡記錄
        INSERT INTO weekly_challenge_check_ins (challenge_id, user_id, note, check_in_date)
        VALUES (challenge_uuid, user_uuid, note_text, CURRENT_DATE)
        RETURNING id INTO new_check_in_id;
        
        result := jsonb_build_object(
            'success', true,
            'message', '打卡成功',
            'check_in_id', new_check_in_id::TEXT
        );
    END IF;
    
    RETURN result;
END;
$function$
;

grant delete on table "public"."backup_20240120_daily_journals" to "anon";

grant insert on table "public"."backup_20240120_daily_journals" to "anon";

grant references on table "public"."backup_20240120_daily_journals" to "anon";

grant select on table "public"."backup_20240120_daily_journals" to "anon";

grant trigger on table "public"."backup_20240120_daily_journals" to "anon";

grant truncate on table "public"."backup_20240120_daily_journals" to "anon";

grant update on table "public"."backup_20240120_daily_journals" to "anon";

grant delete on table "public"."backup_20240120_daily_journals" to "authenticated";

grant insert on table "public"."backup_20240120_daily_journals" to "authenticated";

grant references on table "public"."backup_20240120_daily_journals" to "authenticated";

grant select on table "public"."backup_20240120_daily_journals" to "authenticated";

grant trigger on table "public"."backup_20240120_daily_journals" to "authenticated";

grant truncate on table "public"."backup_20240120_daily_journals" to "authenticated";

grant update on table "public"."backup_20240120_daily_journals" to "authenticated";

grant delete on table "public"."backup_20240120_daily_journals" to "service_role";

grant insert on table "public"."backup_20240120_daily_journals" to "service_role";

grant references on table "public"."backup_20240120_daily_journals" to "service_role";

grant select on table "public"."backup_20240120_daily_journals" to "service_role";

grant trigger on table "public"."backup_20240120_daily_journals" to "service_role";

grant truncate on table "public"."backup_20240120_daily_journals" to "service_role";

grant update on table "public"."backup_20240120_daily_journals" to "service_role";

grant delete on table "public"."backup_20240120_task_records" to "anon";

grant insert on table "public"."backup_20240120_task_records" to "anon";

grant references on table "public"."backup_20240120_task_records" to "anon";

grant select on table "public"."backup_20240120_task_records" to "anon";

grant trigger on table "public"."backup_20240120_task_records" to "anon";

grant truncate on table "public"."backup_20240120_task_records" to "anon";

grant update on table "public"."backup_20240120_task_records" to "anon";

grant delete on table "public"."backup_20240120_task_records" to "authenticated";

grant insert on table "public"."backup_20240120_task_records" to "authenticated";

grant references on table "public"."backup_20240120_task_records" to "authenticated";

grant select on table "public"."backup_20240120_task_records" to "authenticated";

grant trigger on table "public"."backup_20240120_task_records" to "authenticated";

grant truncate on table "public"."backup_20240120_task_records" to "authenticated";

grant update on table "public"."backup_20240120_task_records" to "authenticated";

grant delete on table "public"."backup_20240120_task_records" to "service_role";

grant insert on table "public"."backup_20240120_task_records" to "service_role";

grant references on table "public"."backup_20240120_task_records" to "service_role";

grant select on table "public"."backup_20240120_task_records" to "service_role";

grant trigger on table "public"."backup_20240120_task_records" to "service_role";

grant truncate on table "public"."backup_20240120_task_records" to "service_role";

grant update on table "public"."backup_20240120_task_records" to "service_role";

grant delete on table "public"."backup_20240120_topic_collaborators" to "anon";

grant insert on table "public"."backup_20240120_topic_collaborators" to "anon";

grant references on table "public"."backup_20240120_topic_collaborators" to "anon";

grant select on table "public"."backup_20240120_topic_collaborators" to "anon";

grant trigger on table "public"."backup_20240120_topic_collaborators" to "anon";

grant truncate on table "public"."backup_20240120_topic_collaborators" to "anon";

grant update on table "public"."backup_20240120_topic_collaborators" to "anon";

grant delete on table "public"."backup_20240120_topic_collaborators" to "authenticated";

grant insert on table "public"."backup_20240120_topic_collaborators" to "authenticated";

grant references on table "public"."backup_20240120_topic_collaborators" to "authenticated";

grant select on table "public"."backup_20240120_topic_collaborators" to "authenticated";

grant trigger on table "public"."backup_20240120_topic_collaborators" to "authenticated";

grant truncate on table "public"."backup_20240120_topic_collaborators" to "authenticated";

grant update on table "public"."backup_20240120_topic_collaborators" to "authenticated";

grant delete on table "public"."backup_20240120_topic_collaborators" to "service_role";

grant insert on table "public"."backup_20240120_topic_collaborators" to "service_role";

grant references on table "public"."backup_20240120_topic_collaborators" to "service_role";

grant select on table "public"."backup_20240120_topic_collaborators" to "service_role";

grant trigger on table "public"."backup_20240120_topic_collaborators" to "service_role";

grant truncate on table "public"."backup_20240120_topic_collaborators" to "service_role";

grant update on table "public"."backup_20240120_topic_collaborators" to "service_role";

grant delete on table "public"."backup_20240120_topic_template_collaborators" to "anon";

grant insert on table "public"."backup_20240120_topic_template_collaborators" to "anon";

grant references on table "public"."backup_20240120_topic_template_collaborators" to "anon";

grant select on table "public"."backup_20240120_topic_template_collaborators" to "anon";

grant trigger on table "public"."backup_20240120_topic_template_collaborators" to "anon";

grant truncate on table "public"."backup_20240120_topic_template_collaborators" to "anon";

grant update on table "public"."backup_20240120_topic_template_collaborators" to "anon";

grant delete on table "public"."backup_20240120_topic_template_collaborators" to "authenticated";

grant insert on table "public"."backup_20240120_topic_template_collaborators" to "authenticated";

grant references on table "public"."backup_20240120_topic_template_collaborators" to "authenticated";

grant select on table "public"."backup_20240120_topic_template_collaborators" to "authenticated";

grant trigger on table "public"."backup_20240120_topic_template_collaborators" to "authenticated";

grant truncate on table "public"."backup_20240120_topic_template_collaborators" to "authenticated";

grant update on table "public"."backup_20240120_topic_template_collaborators" to "authenticated";

grant delete on table "public"."backup_20240120_topic_template_collaborators" to "service_role";

grant insert on table "public"."backup_20240120_topic_template_collaborators" to "service_role";

grant references on table "public"."backup_20240120_topic_template_collaborators" to "service_role";

grant select on table "public"."backup_20240120_topic_template_collaborators" to "service_role";

grant trigger on table "public"."backup_20240120_topic_template_collaborators" to "service_role";

grant truncate on table "public"."backup_20240120_topic_template_collaborators" to "service_role";

grant update on table "public"."backup_20240120_topic_template_collaborators" to "service_role";

grant delete on table "public"."backup_20240120_topic_templates" to "anon";

grant insert on table "public"."backup_20240120_topic_templates" to "anon";

grant references on table "public"."backup_20240120_topic_templates" to "anon";

grant select on table "public"."backup_20240120_topic_templates" to "anon";

grant trigger on table "public"."backup_20240120_topic_templates" to "anon";

grant truncate on table "public"."backup_20240120_topic_templates" to "anon";

grant update on table "public"."backup_20240120_topic_templates" to "anon";

grant delete on table "public"."backup_20240120_topic_templates" to "authenticated";

grant insert on table "public"."backup_20240120_topic_templates" to "authenticated";

grant references on table "public"."backup_20240120_topic_templates" to "authenticated";

grant select on table "public"."backup_20240120_topic_templates" to "authenticated";

grant trigger on table "public"."backup_20240120_topic_templates" to "authenticated";

grant truncate on table "public"."backup_20240120_topic_templates" to "authenticated";

grant update on table "public"."backup_20240120_topic_templates" to "authenticated";

grant delete on table "public"."backup_20240120_topic_templates" to "service_role";

grant insert on table "public"."backup_20240120_topic_templates" to "service_role";

grant references on table "public"."backup_20240120_topic_templates" to "service_role";

grant select on table "public"."backup_20240120_topic_templates" to "service_role";

grant trigger on table "public"."backup_20240120_topic_templates" to "service_role";

grant truncate on table "public"."backup_20240120_topic_templates" to "service_role";

grant update on table "public"."backup_20240120_topic_templates" to "service_role";

grant delete on table "public"."backup_20240120_topics" to "anon";

grant insert on table "public"."backup_20240120_topics" to "anon";

grant references on table "public"."backup_20240120_topics" to "anon";

grant select on table "public"."backup_20240120_topics" to "anon";

grant trigger on table "public"."backup_20240120_topics" to "anon";

grant truncate on table "public"."backup_20240120_topics" to "anon";

grant update on table "public"."backup_20240120_topics" to "anon";

grant delete on table "public"."backup_20240120_topics" to "authenticated";

grant insert on table "public"."backup_20240120_topics" to "authenticated";

grant references on table "public"."backup_20240120_topics" to "authenticated";

grant select on table "public"."backup_20240120_topics" to "authenticated";

grant trigger on table "public"."backup_20240120_topics" to "authenticated";

grant truncate on table "public"."backup_20240120_topics" to "authenticated";

grant update on table "public"."backup_20240120_topics" to "authenticated";

grant delete on table "public"."backup_20240120_topics" to "service_role";

grant insert on table "public"."backup_20240120_topics" to "service_role";

grant references on table "public"."backup_20240120_topics" to "service_role";

grant select on table "public"."backup_20240120_topics" to "service_role";

grant trigger on table "public"."backup_20240120_topics" to "service_role";

grant truncate on table "public"."backup_20240120_topics" to "service_role";

grant update on table "public"."backup_20240120_topics" to "service_role";

grant delete on table "public"."backup_info" to "anon";

grant insert on table "public"."backup_info" to "anon";

grant references on table "public"."backup_info" to "anon";

grant select on table "public"."backup_info" to "anon";

grant trigger on table "public"."backup_info" to "anon";

grant truncate on table "public"."backup_info" to "anon";

grant update on table "public"."backup_info" to "anon";

grant delete on table "public"."backup_info" to "authenticated";

grant insert on table "public"."backup_info" to "authenticated";

grant references on table "public"."backup_info" to "authenticated";

grant select on table "public"."backup_info" to "authenticated";

grant trigger on table "public"."backup_info" to "authenticated";

grant truncate on table "public"."backup_info" to "authenticated";

grant update on table "public"."backup_info" to "authenticated";

grant delete on table "public"."backup_info" to "service_role";

grant insert on table "public"."backup_info" to "service_role";

grant references on table "public"."backup_info" to "service_role";

grant select on table "public"."backup_info" to "service_role";

grant trigger on table "public"."backup_info" to "service_role";

grant truncate on table "public"."backup_info" to "service_role";

grant update on table "public"."backup_info" to "service_role";

grant delete on table "public"."daily_journals" to "anon";

grant insert on table "public"."daily_journals" to "anon";

grant references on table "public"."daily_journals" to "anon";

grant select on table "public"."daily_journals" to "anon";

grant trigger on table "public"."daily_journals" to "anon";

grant truncate on table "public"."daily_journals" to "anon";

grant update on table "public"."daily_journals" to "anon";

grant delete on table "public"."daily_journals" to "authenticated";

grant insert on table "public"."daily_journals" to "authenticated";

grant references on table "public"."daily_journals" to "authenticated";

grant select on table "public"."daily_journals" to "authenticated";

grant trigger on table "public"."daily_journals" to "authenticated";

grant truncate on table "public"."daily_journals" to "authenticated";

grant update on table "public"."daily_journals" to "authenticated";

grant delete on table "public"."daily_journals" to "service_role";

grant insert on table "public"."daily_journals" to "service_role";

grant references on table "public"."daily_journals" to "service_role";

grant select on table "public"."daily_journals" to "service_role";

grant trigger on table "public"."daily_journals" to "service_role";

grant truncate on table "public"."daily_journals" to "service_role";

grant update on table "public"."daily_journals" to "service_role";

grant delete on table "public"."goals" to "anon";

grant insert on table "public"."goals" to "anon";

grant references on table "public"."goals" to "anon";

grant select on table "public"."goals" to "anon";

grant trigger on table "public"."goals" to "anon";

grant truncate on table "public"."goals" to "anon";

grant update on table "public"."goals" to "anon";

grant delete on table "public"."goals" to "authenticated";

grant insert on table "public"."goals" to "authenticated";

grant references on table "public"."goals" to "authenticated";

grant select on table "public"."goals" to "authenticated";

grant trigger on table "public"."goals" to "authenticated";

grant truncate on table "public"."goals" to "authenticated";

grant update on table "public"."goals" to "authenticated";

grant delete on table "public"."goals" to "service_role";

grant insert on table "public"."goals" to "service_role";

grant references on table "public"."goals" to "service_role";

grant select on table "public"."goals" to "service_role";

grant trigger on table "public"."goals" to "service_role";

grant truncate on table "public"."goals" to "service_role";

grant update on table "public"."goals" to "service_role";

grant delete on table "public"."group_retro_questions" to "anon";

grant insert on table "public"."group_retro_questions" to "anon";

grant references on table "public"."group_retro_questions" to "anon";

grant select on table "public"."group_retro_questions" to "anon";

grant trigger on table "public"."group_retro_questions" to "anon";

grant truncate on table "public"."group_retro_questions" to "anon";

grant update on table "public"."group_retro_questions" to "anon";

grant delete on table "public"."group_retro_questions" to "authenticated";

grant insert on table "public"."group_retro_questions" to "authenticated";

grant references on table "public"."group_retro_questions" to "authenticated";

grant select on table "public"."group_retro_questions" to "authenticated";

grant trigger on table "public"."group_retro_questions" to "authenticated";

grant truncate on table "public"."group_retro_questions" to "authenticated";

grant update on table "public"."group_retro_questions" to "authenticated";

grant delete on table "public"."group_retro_questions" to "service_role";

grant insert on table "public"."group_retro_questions" to "service_role";

grant references on table "public"."group_retro_questions" to "service_role";

grant select on table "public"."group_retro_questions" to "service_role";

grant trigger on table "public"."group_retro_questions" to "service_role";

grant truncate on table "public"."group_retro_questions" to "service_role";

grant update on table "public"."group_retro_questions" to "service_role";

grant delete on table "public"."group_retro_replies" to "anon";

grant insert on table "public"."group_retro_replies" to "anon";

grant references on table "public"."group_retro_replies" to "anon";

grant select on table "public"."group_retro_replies" to "anon";

grant trigger on table "public"."group_retro_replies" to "anon";

grant truncate on table "public"."group_retro_replies" to "anon";

grant update on table "public"."group_retro_replies" to "anon";

grant delete on table "public"."group_retro_replies" to "authenticated";

grant insert on table "public"."group_retro_replies" to "authenticated";

grant references on table "public"."group_retro_replies" to "authenticated";

grant select on table "public"."group_retro_replies" to "authenticated";

grant trigger on table "public"."group_retro_replies" to "authenticated";

grant truncate on table "public"."group_retro_replies" to "authenticated";

grant update on table "public"."group_retro_replies" to "authenticated";

grant delete on table "public"."group_retro_replies" to "service_role";

grant insert on table "public"."group_retro_replies" to "service_role";

grant references on table "public"."group_retro_replies" to "service_role";

grant select on table "public"."group_retro_replies" to "service_role";

grant trigger on table "public"."group_retro_replies" to "service_role";

grant truncate on table "public"."group_retro_replies" to "service_role";

grant update on table "public"."group_retro_replies" to "service_role";

grant delete on table "public"."group_retro_sessions" to "anon";

grant insert on table "public"."group_retro_sessions" to "anon";

grant references on table "public"."group_retro_sessions" to "anon";

grant select on table "public"."group_retro_sessions" to "anon";

grant trigger on table "public"."group_retro_sessions" to "anon";

grant truncate on table "public"."group_retro_sessions" to "anon";

grant update on table "public"."group_retro_sessions" to "anon";

grant delete on table "public"."group_retro_sessions" to "authenticated";

grant insert on table "public"."group_retro_sessions" to "authenticated";

grant references on table "public"."group_retro_sessions" to "authenticated";

grant select on table "public"."group_retro_sessions" to "authenticated";

grant trigger on table "public"."group_retro_sessions" to "authenticated";

grant truncate on table "public"."group_retro_sessions" to "authenticated";

grant update on table "public"."group_retro_sessions" to "authenticated";

grant delete on table "public"."group_retro_sessions" to "service_role";

grant insert on table "public"."group_retro_sessions" to "service_role";

grant references on table "public"."group_retro_sessions" to "service_role";

grant select on table "public"."group_retro_sessions" to "service_role";

grant trigger on table "public"."group_retro_sessions" to "service_role";

grant truncate on table "public"."group_retro_sessions" to "service_role";

grant update on table "public"."group_retro_sessions" to "service_role";

grant delete on table "public"."retro_answers" to "anon";

grant insert on table "public"."retro_answers" to "anon";

grant references on table "public"."retro_answers" to "anon";

grant select on table "public"."retro_answers" to "anon";

grant trigger on table "public"."retro_answers" to "anon";

grant truncate on table "public"."retro_answers" to "anon";

grant update on table "public"."retro_answers" to "anon";

grant delete on table "public"."retro_answers" to "authenticated";

grant insert on table "public"."retro_answers" to "authenticated";

grant references on table "public"."retro_answers" to "authenticated";

grant select on table "public"."retro_answers" to "authenticated";

grant trigger on table "public"."retro_answers" to "authenticated";

grant truncate on table "public"."retro_answers" to "authenticated";

grant update on table "public"."retro_answers" to "authenticated";

grant delete on table "public"."retro_answers" to "service_role";

grant insert on table "public"."retro_answers" to "service_role";

grant references on table "public"."retro_answers" to "service_role";

grant select on table "public"."retro_answers" to "service_role";

grant trigger on table "public"."retro_answers" to "service_role";

grant truncate on table "public"."retro_answers" to "service_role";

grant update on table "public"."retro_answers" to "service_role";

grant delete on table "public"."retro_questions" to "anon";

grant insert on table "public"."retro_questions" to "anon";

grant references on table "public"."retro_questions" to "anon";

grant select on table "public"."retro_questions" to "anon";

grant trigger on table "public"."retro_questions" to "anon";

grant truncate on table "public"."retro_questions" to "anon";

grant update on table "public"."retro_questions" to "anon";

grant delete on table "public"."retro_questions" to "authenticated";

grant insert on table "public"."retro_questions" to "authenticated";

grant references on table "public"."retro_questions" to "authenticated";

grant select on table "public"."retro_questions" to "authenticated";

grant trigger on table "public"."retro_questions" to "authenticated";

grant truncate on table "public"."retro_questions" to "authenticated";

grant update on table "public"."retro_questions" to "authenticated";

grant delete on table "public"."retro_questions" to "service_role";

grant insert on table "public"."retro_questions" to "service_role";

grant references on table "public"."retro_questions" to "service_role";

grant select on table "public"."retro_questions" to "service_role";

grant trigger on table "public"."retro_questions" to "service_role";

grant truncate on table "public"."retro_questions" to "service_role";

grant update on table "public"."retro_questions" to "service_role";

grant delete on table "public"."retro_sessions" to "anon";

grant insert on table "public"."retro_sessions" to "anon";

grant references on table "public"."retro_sessions" to "anon";

grant select on table "public"."retro_sessions" to "anon";

grant trigger on table "public"."retro_sessions" to "anon";

grant truncate on table "public"."retro_sessions" to "anon";

grant update on table "public"."retro_sessions" to "anon";

grant delete on table "public"."retro_sessions" to "authenticated";

grant insert on table "public"."retro_sessions" to "authenticated";

grant references on table "public"."retro_sessions" to "authenticated";

grant select on table "public"."retro_sessions" to "authenticated";

grant trigger on table "public"."retro_sessions" to "authenticated";

grant truncate on table "public"."retro_sessions" to "authenticated";

grant update on table "public"."retro_sessions" to "authenticated";

grant delete on table "public"."retro_sessions" to "service_role";

grant insert on table "public"."retro_sessions" to "service_role";

grant references on table "public"."retro_sessions" to "service_role";

grant select on table "public"."retro_sessions" to "service_role";

grant trigger on table "public"."retro_sessions" to "service_role";

grant truncate on table "public"."retro_sessions" to "service_role";

grant update on table "public"."retro_sessions" to "service_role";

grant delete on table "public"."task_actions" to "anon";

grant insert on table "public"."task_actions" to "anon";

grant references on table "public"."task_actions" to "anon";

grant select on table "public"."task_actions" to "anon";

grant trigger on table "public"."task_actions" to "anon";

grant truncate on table "public"."task_actions" to "anon";

grant update on table "public"."task_actions" to "anon";

grant delete on table "public"."task_actions" to "authenticated";

grant insert on table "public"."task_actions" to "authenticated";

grant references on table "public"."task_actions" to "authenticated";

grant select on table "public"."task_actions" to "authenticated";

grant trigger on table "public"."task_actions" to "authenticated";

grant truncate on table "public"."task_actions" to "authenticated";

grant update on table "public"."task_actions" to "authenticated";

grant delete on table "public"."task_actions" to "service_role";

grant insert on table "public"."task_actions" to "service_role";

grant references on table "public"."task_actions" to "service_role";

grant select on table "public"."task_actions" to "service_role";

grant trigger on table "public"."task_actions" to "service_role";

grant truncate on table "public"."task_actions" to "service_role";

grant update on table "public"."task_actions" to "service_role";

grant delete on table "public"."task_records" to "anon";

grant insert on table "public"."task_records" to "anon";

grant references on table "public"."task_records" to "anon";

grant select on table "public"."task_records" to "anon";

grant trigger on table "public"."task_records" to "anon";

grant truncate on table "public"."task_records" to "anon";

grant update on table "public"."task_records" to "anon";

grant delete on table "public"."task_records" to "authenticated";

grant insert on table "public"."task_records" to "authenticated";

grant references on table "public"."task_records" to "authenticated";

grant select on table "public"."task_records" to "authenticated";

grant trigger on table "public"."task_records" to "authenticated";

grant truncate on table "public"."task_records" to "authenticated";

grant update on table "public"."task_records" to "authenticated";

grant delete on table "public"."task_records" to "service_role";

grant insert on table "public"."task_records" to "service_role";

grant references on table "public"."task_records" to "service_role";

grant select on table "public"."task_records" to "service_role";

grant trigger on table "public"."task_records" to "service_role";

grant truncate on table "public"."task_records" to "service_role";

grant update on table "public"."task_records" to "service_role";

grant delete on table "public"."tasks" to "anon";

grant insert on table "public"."tasks" to "anon";

grant references on table "public"."tasks" to "anon";

grant select on table "public"."tasks" to "anon";

grant trigger on table "public"."tasks" to "anon";

grant truncate on table "public"."tasks" to "anon";

grant update on table "public"."tasks" to "anon";

grant delete on table "public"."tasks" to "authenticated";

grant insert on table "public"."tasks" to "authenticated";

grant references on table "public"."tasks" to "authenticated";

grant select on table "public"."tasks" to "authenticated";

grant trigger on table "public"."tasks" to "authenticated";

grant truncate on table "public"."tasks" to "authenticated";

grant update on table "public"."tasks" to "authenticated";

grant delete on table "public"."tasks" to "service_role";

grant insert on table "public"."tasks" to "service_role";

grant references on table "public"."tasks" to "service_role";

grant select on table "public"."tasks" to "service_role";

grant trigger on table "public"."tasks" to "service_role";

grant truncate on table "public"."tasks" to "service_role";

grant update on table "public"."tasks" to "service_role";

grant delete on table "public"."topic_collaborators" to "anon";

grant insert on table "public"."topic_collaborators" to "anon";

grant references on table "public"."topic_collaborators" to "anon";

grant select on table "public"."topic_collaborators" to "anon";

grant trigger on table "public"."topic_collaborators" to "anon";

grant truncate on table "public"."topic_collaborators" to "anon";

grant update on table "public"."topic_collaborators" to "anon";

grant delete on table "public"."topic_collaborators" to "authenticated";

grant insert on table "public"."topic_collaborators" to "authenticated";

grant references on table "public"."topic_collaborators" to "authenticated";

grant select on table "public"."topic_collaborators" to "authenticated";

grant trigger on table "public"."topic_collaborators" to "authenticated";

grant truncate on table "public"."topic_collaborators" to "authenticated";

grant update on table "public"."topic_collaborators" to "authenticated";

grant delete on table "public"."topic_collaborators" to "service_role";

grant insert on table "public"."topic_collaborators" to "service_role";

grant references on table "public"."topic_collaborators" to "service_role";

grant select on table "public"."topic_collaborators" to "service_role";

grant trigger on table "public"."topic_collaborators" to "service_role";

grant truncate on table "public"."topic_collaborators" to "service_role";

grant update on table "public"."topic_collaborators" to "service_role";

grant delete on table "public"."topic_template_collaborators" to "anon";

grant insert on table "public"."topic_template_collaborators" to "anon";

grant references on table "public"."topic_template_collaborators" to "anon";

grant select on table "public"."topic_template_collaborators" to "anon";

grant trigger on table "public"."topic_template_collaborators" to "anon";

grant truncate on table "public"."topic_template_collaborators" to "anon";

grant update on table "public"."topic_template_collaborators" to "anon";

grant delete on table "public"."topic_template_collaborators" to "authenticated";

grant insert on table "public"."topic_template_collaborators" to "authenticated";

grant references on table "public"."topic_template_collaborators" to "authenticated";

grant select on table "public"."topic_template_collaborators" to "authenticated";

grant trigger on table "public"."topic_template_collaborators" to "authenticated";

grant truncate on table "public"."topic_template_collaborators" to "authenticated";

grant update on table "public"."topic_template_collaborators" to "authenticated";

grant delete on table "public"."topic_template_collaborators" to "service_role";

grant insert on table "public"."topic_template_collaborators" to "service_role";

grant references on table "public"."topic_template_collaborators" to "service_role";

grant select on table "public"."topic_template_collaborators" to "service_role";

grant trigger on table "public"."topic_template_collaborators" to "service_role";

grant truncate on table "public"."topic_template_collaborators" to "service_role";

grant update on table "public"."topic_template_collaborators" to "service_role";

grant delete on table "public"."topic_templates" to "anon";

grant insert on table "public"."topic_templates" to "anon";

grant references on table "public"."topic_templates" to "anon";

grant select on table "public"."topic_templates" to "anon";

grant trigger on table "public"."topic_templates" to "anon";

grant truncate on table "public"."topic_templates" to "anon";

grant update on table "public"."topic_templates" to "anon";

grant delete on table "public"."topic_templates" to "authenticated";

grant insert on table "public"."topic_templates" to "authenticated";

grant references on table "public"."topic_templates" to "authenticated";

grant select on table "public"."topic_templates" to "authenticated";

grant trigger on table "public"."topic_templates" to "authenticated";

grant truncate on table "public"."topic_templates" to "authenticated";

grant update on table "public"."topic_templates" to "authenticated";

grant delete on table "public"."topic_templates" to "service_role";

grant insert on table "public"."topic_templates" to "service_role";

grant references on table "public"."topic_templates" to "service_role";

grant select on table "public"."topic_templates" to "service_role";

grant trigger on table "public"."topic_templates" to "service_role";

grant truncate on table "public"."topic_templates" to "service_role";

grant update on table "public"."topic_templates" to "service_role";

grant delete on table "public"."topics" to "anon";

grant insert on table "public"."topics" to "anon";

grant references on table "public"."topics" to "anon";

grant select on table "public"."topics" to "anon";

grant trigger on table "public"."topics" to "anon";

grant truncate on table "public"."topics" to "anon";

grant update on table "public"."topics" to "anon";

grant delete on table "public"."topics" to "authenticated";

grant insert on table "public"."topics" to "authenticated";

grant references on table "public"."topics" to "authenticated";

grant select on table "public"."topics" to "authenticated";

grant trigger on table "public"."topics" to "authenticated";

grant truncate on table "public"."topics" to "authenticated";

grant update on table "public"."topics" to "authenticated";

grant delete on table "public"."topics" to "service_role";

grant insert on table "public"."topics" to "service_role";

grant references on table "public"."topics" to "service_role";

grant select on table "public"."topics" to "service_role";

grant trigger on table "public"."topics" to "service_role";

grant truncate on table "public"."topics" to "service_role";

grant update on table "public"."topics" to "service_role";

grant delete on table "public"."topics_legacy" to "anon";

grant insert on table "public"."topics_legacy" to "anon";

grant references on table "public"."topics_legacy" to "anon";

grant select on table "public"."topics_legacy" to "anon";

grant trigger on table "public"."topics_legacy" to "anon";

grant truncate on table "public"."topics_legacy" to "anon";

grant update on table "public"."topics_legacy" to "anon";

grant delete on table "public"."topics_legacy" to "authenticated";

grant insert on table "public"."topics_legacy" to "authenticated";

grant references on table "public"."topics_legacy" to "authenticated";

grant select on table "public"."topics_legacy" to "authenticated";

grant trigger on table "public"."topics_legacy" to "authenticated";

grant truncate on table "public"."topics_legacy" to "authenticated";

grant update on table "public"."topics_legacy" to "authenticated";

grant delete on table "public"."topics_legacy" to "service_role";

grant insert on table "public"."topics_legacy" to "service_role";

grant references on table "public"."topics_legacy" to "service_role";

grant select on table "public"."topics_legacy" to "service_role";

grant trigger on table "public"."topics_legacy" to "service_role";

grant truncate on table "public"."topics_legacy" to "service_role";

grant update on table "public"."topics_legacy" to "service_role";

grant delete on table "public"."user_events" to "anon";

grant insert on table "public"."user_events" to "anon";

grant references on table "public"."user_events" to "anon";

grant select on table "public"."user_events" to "anon";

grant trigger on table "public"."user_events" to "anon";

grant truncate on table "public"."user_events" to "anon";

grant update on table "public"."user_events" to "anon";

grant delete on table "public"."user_events" to "authenticated";

grant insert on table "public"."user_events" to "authenticated";

grant references on table "public"."user_events" to "authenticated";

grant select on table "public"."user_events" to "authenticated";

grant trigger on table "public"."user_events" to "authenticated";

grant truncate on table "public"."user_events" to "authenticated";

grant update on table "public"."user_events" to "authenticated";

grant delete on table "public"."user_events" to "service_role";

grant insert on table "public"."user_events" to "service_role";

grant references on table "public"."user_events" to "service_role";

grant select on table "public"."user_events" to "service_role";

grant trigger on table "public"."user_events" to "service_role";

grant truncate on table "public"."user_events" to "service_role";

grant update on table "public"."user_events" to "service_role";

grant delete on table "public"."weekly_challenge_check_ins" to "anon";

grant insert on table "public"."weekly_challenge_check_ins" to "anon";

grant references on table "public"."weekly_challenge_check_ins" to "anon";

grant select on table "public"."weekly_challenge_check_ins" to "anon";

grant trigger on table "public"."weekly_challenge_check_ins" to "anon";

grant truncate on table "public"."weekly_challenge_check_ins" to "anon";

grant update on table "public"."weekly_challenge_check_ins" to "anon";

grant delete on table "public"."weekly_challenge_check_ins" to "authenticated";

grant insert on table "public"."weekly_challenge_check_ins" to "authenticated";

grant references on table "public"."weekly_challenge_check_ins" to "authenticated";

grant select on table "public"."weekly_challenge_check_ins" to "authenticated";

grant trigger on table "public"."weekly_challenge_check_ins" to "authenticated";

grant truncate on table "public"."weekly_challenge_check_ins" to "authenticated";

grant update on table "public"."weekly_challenge_check_ins" to "authenticated";

grant delete on table "public"."weekly_challenge_check_ins" to "service_role";

grant insert on table "public"."weekly_challenge_check_ins" to "service_role";

grant references on table "public"."weekly_challenge_check_ins" to "service_role";

grant select on table "public"."weekly_challenge_check_ins" to "service_role";

grant trigger on table "public"."weekly_challenge_check_ins" to "service_role";

grant truncate on table "public"."weekly_challenge_check_ins" to "service_role";

grant update on table "public"."weekly_challenge_check_ins" to "service_role";

grant delete on table "public"."weekly_challenges" to "anon";

grant insert on table "public"."weekly_challenges" to "anon";

grant references on table "public"."weekly_challenges" to "anon";

grant select on table "public"."weekly_challenges" to "anon";

grant trigger on table "public"."weekly_challenges" to "anon";

grant truncate on table "public"."weekly_challenges" to "anon";

grant update on table "public"."weekly_challenges" to "anon";

grant delete on table "public"."weekly_challenges" to "authenticated";

grant insert on table "public"."weekly_challenges" to "authenticated";

grant references on table "public"."weekly_challenges" to "authenticated";

grant select on table "public"."weekly_challenges" to "authenticated";

grant trigger on table "public"."weekly_challenges" to "authenticated";

grant truncate on table "public"."weekly_challenges" to "authenticated";

grant update on table "public"."weekly_challenges" to "authenticated";

grant delete on table "public"."weekly_challenges" to "service_role";

grant insert on table "public"."weekly_challenges" to "service_role";

grant references on table "public"."weekly_challenges" to "service_role";

grant select on table "public"."weekly_challenges" to "service_role";

grant trigger on table "public"."weekly_challenges" to "service_role";

grant truncate on table "public"."weekly_challenges" to "service_role";

grant update on table "public"."weekly_challenges" to "service_role";

create policy "Users can create own journals"
on "public"."daily_journals"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete own journals"
on "public"."daily_journals"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update own journals"
on "public"."daily_journals"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own journals"
on "public"."daily_journals"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Collaborators can create collaborative goals"
on "public"."goals"
as permissive
for insert
to public
with check ((topic_id IN ( SELECT t.id
   FROM (topics t
     JOIN topic_collaborators tc ON ((t.id = tc.topic_id)))
  WHERE ((t.is_collaborative = true) AND (tc.user_id = auth.uid()) AND (tc.permission = ANY (ARRAY['edit'::text, 'admin'::text]))))));


create policy "Collaborators can update collaborative goals"
on "public"."goals"
as permissive
for update
to public
using ((topic_id IN ( SELECT t.id
   FROM (topics t
     JOIN topic_collaborators tc ON ((t.id = tc.topic_id)))
  WHERE ((t.is_collaborative = true) AND (tc.user_id = auth.uid()) AND (tc.permission = ANY (ARRAY['edit'::text, 'admin'::text]))))));


create policy "Collaborators can view collaborative goals"
on "public"."goals"
as permissive
for select
to public
using ((topic_id IN ( SELECT t.id
   FROM (topics t
     JOIN topic_collaborators tc ON ((t.id = tc.topic_id)))
  WHERE ((t.is_collaborative = true) AND (tc.user_id = auth.uid())))));


create policy "Users can create goals for their topics"
on "public"."goals"
as permissive
for insert
to public
with check ((topic_id IN ( SELECT topics.id
   FROM topics
  WHERE (topics.owner_id = auth.uid()))));


create policy "Users can delete goals of their topics"
on "public"."goals"
as permissive
for delete
to public
using ((topic_id IN ( SELECT topics.id
   FROM topics
  WHERE (topics.owner_id = auth.uid()))));


create policy "Users can update goals of their topics"
on "public"."goals"
as permissive
for update
to public
using ((topic_id IN ( SELECT topics.id
   FROM topics
  WHERE (topics.owner_id = auth.uid()))));


create policy "Users can view goals of their topics"
on "public"."goals"
as permissive
for select
to public
using ((topic_id IN ( SELECT topics.id
   FROM topics
  WHERE (topics.owner_id = auth.uid()))));


create policy "小組討論問題權限"
on "public"."group_retro_questions"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM group_retro_sessions
  WHERE ((group_retro_sessions.id = group_retro_questions.session_id) AND ((group_retro_sessions.created_by = auth.uid()) OR (auth.uid() = ANY (group_retro_sessions.participant_ids)))))))
with check ((EXISTS ( SELECT 1
   FROM group_retro_sessions
  WHERE ((group_retro_sessions.id = group_retro_questions.session_id) AND ((group_retro_sessions.created_by = auth.uid()) OR (auth.uid() = ANY (group_retro_sessions.participant_ids)))))));


create policy "小組討論回覆刪除權限"
on "public"."group_retro_replies"
as permissive
for delete
to authenticated
using ((user_id = auth.uid()));


create policy "小組討論回覆新增權限"
on "public"."group_retro_replies"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM group_retro_sessions
  WHERE ((group_retro_sessions.id = group_retro_replies.session_id) AND ((group_retro_sessions.created_by = auth.uid()) OR ((auth.uid() = ANY (group_retro_sessions.participant_ids)) AND (group_retro_replies.user_id = auth.uid())) OR ((auth.uid() = ANY (group_retro_sessions.participant_ids)) AND (group_retro_replies.user_id = ANY (group_retro_sessions.participant_ids))))))));


create policy "小組討論回覆更新權限"
on "public"."group_retro_replies"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "小組討論回覆查看權限"
on "public"."group_retro_replies"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM group_retro_sessions
  WHERE ((group_retro_sessions.id = group_retro_replies.session_id) AND ((group_retro_sessions.created_by = auth.uid()) OR (auth.uid() = ANY (group_retro_sessions.participant_ids)))))));


create policy "小組討論會話權限"
on "public"."group_retro_sessions"
as permissive
for all
to authenticated
using (((created_by = auth.uid()) OR (auth.uid() = ANY (participant_ids))))
with check (((created_by = auth.uid()) OR (auth.uid() = ANY (participant_ids))));


create policy "Users can manage their own answers"
on "public"."retro_answers"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Anyone can read active questions"
on "public"."retro_questions"
as permissive
for select
to public
using ((is_active = true));


create policy "Users can manage their own sessions"
on "public"."retro_sessions"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "用戶只能管理自己的任務動作"
on "public"."task_actions"
as permissive
for all
to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM ((tasks t
     JOIN goals g ON ((t.goal_id = g.id)))
     JOIN topics tp ON ((g.topic_id = tp.id)))
  WHERE ((t.id = task_actions.task_id) AND ((tp.owner_id = auth.uid()) OR (tp.is_collaborative = true)))))));


create policy "Users can delete their own task records"
on "public"."task_records"
as permissive
for delete
to public
using ((auth.uid() = author_id));


create policy "Users can insert their own task records"
on "public"."task_records"
as permissive
for insert
to public
with check ((auth.uid() = author_id));


create policy "Users can update their own task records"
on "public"."task_records"
as permissive
for update
to public
using ((auth.uid() = author_id))
with check ((auth.uid() = author_id));


create policy "Users can view their own task records"
on "public"."task_records"
as permissive
for select
to public
using ((auth.uid() = author_id));


create policy "Collaborators can create collaborative tasks"
on "public"."tasks"
as permissive
for insert
to public
with check ((goal_id IN ( SELECT g.id
   FROM ((goals g
     JOIN topics t ON ((g.topic_id = t.id)))
     JOIN topic_collaborators tc ON ((t.id = tc.topic_id)))
  WHERE ((t.is_collaborative = true) AND (tc.user_id = auth.uid()) AND (tc.permission = ANY (ARRAY['edit'::text, 'admin'::text]))))));


create policy "Collaborators can update collaborative tasks"
on "public"."tasks"
as permissive
for update
to public
using ((goal_id IN ( SELECT g.id
   FROM ((goals g
     JOIN topics t ON ((g.topic_id = t.id)))
     JOIN topic_collaborators tc ON ((t.id = tc.topic_id)))
  WHERE ((t.is_collaborative = true) AND (tc.user_id = auth.uid()) AND (tc.permission = ANY (ARRAY['edit'::text, 'admin'::text]))))));


create policy "Collaborators can view collaborative tasks"
on "public"."tasks"
as permissive
for select
to public
using ((goal_id IN ( SELECT g.id
   FROM ((goals g
     JOIN topics t ON ((g.topic_id = t.id)))
     JOIN topic_collaborators tc ON ((t.id = tc.topic_id)))
  WHERE ((t.is_collaborative = true) AND (tc.user_id = auth.uid())))));


create policy "Users can create tasks for their goals"
on "public"."tasks"
as permissive
for insert
to public
with check ((goal_id IN ( SELECT g.id
   FROM (goals g
     JOIN topics t ON ((g.topic_id = t.id)))
  WHERE (t.owner_id = auth.uid()))));


create policy "Users can delete tasks of their goals"
on "public"."tasks"
as permissive
for delete
to public
using ((goal_id IN ( SELECT g.id
   FROM (goals g
     JOIN topics t ON ((g.topic_id = t.id)))
  WHERE (t.owner_id = auth.uid()))));


create policy "Users can update tasks of their goals"
on "public"."tasks"
as permissive
for update
to public
using ((goal_id IN ( SELECT g.id
   FROM (goals g
     JOIN topics t ON ((g.topic_id = t.id)))
  WHERE (t.owner_id = auth.uid()))));


create policy "Users can view tasks of their goals"
on "public"."tasks"
as permissive
for select
to public
using ((goal_id IN ( SELECT g.id
   FROM (goals g
     JOIN topics t ON ((g.topic_id = t.id)))
  WHERE (t.owner_id = auth.uid()))));


create policy "collaborators_basic_access"
on "public"."topic_collaborators"
as permissive
for all
to public
using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM topics_legacy t
  WHERE ((t.id = topic_collaborators.topic_id) AND (t.owner_id = ( SELECT auth.uid() AS uid)))))));


create policy "允許刪除協作關係"
on "public"."topic_template_collaborators"
as permissive
for delete
to authenticated
using (true);


create policy "允許插入協作關係"
on "public"."topic_template_collaborators"
as permissive
for insert
to authenticated
with check (true);


create policy "允許更新協作關係"
on "public"."topic_template_collaborators"
as permissive
for update
to authenticated
using (true);


create policy "允許讀取所有協作關係"
on "public"."topic_template_collaborators"
as permissive
for select
to authenticated
using (true);


create policy "允許創建者管理自己的模板"
on "public"."topic_templates"
as permissive
for all
to authenticated
using ((created_by = auth.uid()))
with check ((created_by = auth.uid()));


create policy "允許讀取公開模板"
on "public"."topic_templates"
as permissive
for select
to authenticated
using ((is_public = true));


create policy "Collaborators can update collaborative topics"
on "public"."topics"
as permissive
for update
to public
using (((is_collaborative = true) AND (id IN ( SELECT topic_collaborators.topic_id
   FROM topic_collaborators
  WHERE ((topic_collaborators.user_id = auth.uid()) AND (topic_collaborators.permission = ANY (ARRAY['edit'::text, 'admin'::text])))))));


create policy "Collaborators can view collaborative topics"
on "public"."topics"
as permissive
for select
to public
using (((is_collaborative = true) AND (id IN ( SELECT topic_collaborators.topic_id
   FROM topic_collaborators
  WHERE (topic_collaborators.user_id = auth.uid())))));


create policy "Users can create their own topics"
on "public"."topics"
as permissive
for insert
to public
with check ((owner_id = auth.uid()));


create policy "Users can delete their own topics"
on "public"."topics"
as permissive
for delete
to public
using ((owner_id = auth.uid()));


create policy "Users can update their own topics"
on "public"."topics"
as permissive
for update
to public
using ((owner_id = auth.uid()));


create policy "Users can view their own topics"
on "public"."topics"
as permissive
for select
to public
using ((owner_id = auth.uid()));


create policy "topics_delete_policy"
on "public"."topics"
as permissive
for delete
to public
using (((owner_id = auth.uid()) OR (id IN ( SELECT topic_collaborators.topic_id
   FROM topic_collaborators
  WHERE ((topic_collaborators.user_id = auth.uid()) AND (topic_collaborators.permission = 'admin'::text))))));


create policy "topics_insert_policy"
on "public"."topics"
as permissive
for insert
to public
with check ((owner_id = auth.uid()));


create policy "topics_select_policy"
on "public"."topics"
as permissive
for select
to public
using (((owner_id = auth.uid()) OR (id IN ( SELECT topic_collaborators.topic_id
   FROM topic_collaborators
  WHERE (topic_collaborators.user_id = auth.uid())))));


create policy "topics_update_policy"
on "public"."topics"
as permissive
for update
to public
using (((owner_id = auth.uid()) OR (id IN ( SELECT topic_collaborators.topic_id
   FROM topic_collaborators
  WHERE ((topic_collaborators.user_id = auth.uid()) AND (topic_collaborators.permission = ANY (ARRAY['edit'::text, 'admin'::text])))))));


create policy "topics_collaborator_access"
on "public"."topics_legacy"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM topic_collaborators tc
  WHERE ((tc.topic_id = topics_legacy.id) AND (tc.user_id = ( SELECT auth.uid() AS uid))))));


create policy "topics_owner_access"
on "public"."topics_legacy"
as permissive
for all
to public
using ((owner_id = ( SELECT auth.uid() AS uid)));


create policy "user_events_insert_own"
on "public"."user_events"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "user_events_select_own"
on "public"."user_events"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create their own challenge check-ins"
on "public"."weekly_challenge_check_ins"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own challenge check-ins"
on "public"."weekly_challenge_check_ins"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own challenge check-ins"
on "public"."weekly_challenge_check_ins"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own challenge check-ins"
on "public"."weekly_challenge_check_ins"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create their own challenges"
on "public"."weekly_challenges"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own challenges"
on "public"."weekly_challenges"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own challenges"
on "public"."weekly_challenges"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own challenges"
on "public"."weekly_challenges"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER trigger_update_daily_journals_updated_at BEFORE UPDATE ON public.daily_journals FOR EACH ROW EXECUTE FUNCTION update_daily_journals_updated_at();

CREATE TRIGGER goals_version_trigger BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_version_and_timestamp();

CREATE TRIGGER update_group_retro_replies_updated_at BEFORE UPDATE ON public.group_retro_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_retro_sessions_updated_at BEFORE UPDATE ON public.group_retro_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_retro_session_answers_count AFTER INSERT OR DELETE ON public.retro_answers FOR EACH ROW EXECUTE FUNCTION update_retro_session_answers_count();

CREATE TRIGGER update_retro_answers_updated_at BEFORE UPDATE ON public.retro_answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retro_questions_updated_at BEFORE UPDATE ON public.retro_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retro_sessions_updated_at BEFORE UPDATE ON public.retro_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER task_actions_updated_at_trigger BEFORE UPDATE ON public.task_actions FOR EACH ROW EXECUTE FUNCTION update_task_actions_updated_at();

CREATE TRIGGER update_task_records_updated_at BEFORE UPDATE ON public.task_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tasks_version_trigger BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_version_and_timestamp();

CREATE TRIGGER update_topic_templates_updated_at BEFORE UPDATE ON public.topic_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER topics_version_trigger BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION update_version_and_timestamp();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics_legacy FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


