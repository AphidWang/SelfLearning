alter table "public"."daily_journals" drop constraint "daily_journals_mood_check";

alter table "public"."daily_journals" add constraint "daily_journals_mood_check" CHECK (((mood)::text = ANY ((ARRAY['excited'::character varying, 'happy'::character varying, 'okay'::character varying, 'tired'::character varying, 'stressed'::character varying])::text[]))) not valid;

alter table "public"."daily_journals" validate constraint "daily_journals_mood_check";


