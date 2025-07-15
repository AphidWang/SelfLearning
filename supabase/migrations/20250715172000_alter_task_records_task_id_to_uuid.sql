-- 將 task_records.task_id 型別從 text 轉成 uuid
ALTER TABLE task_records
ALTER COLUMN task_id TYPE uuid USING task_id::uuid; 