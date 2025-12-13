# 課程排程系統設定指南

## 1. 執行資料庫 Migration

**重要**：在使用課程排程功能之前，必須先執行資料庫 migration。

### 方法 A：使用 Supabase Dashboard

1. 登入 Supabase Dashboard
2. 進入你的專案
3. 點擊左側選單的 **SQL Editor**
4. 複製 `course_scheduler_schema_v2.sql` 的內容
5. 貼上並執行

### 方法 B：使用 Supabase CLI

```bash
# 如果有 Supabase CLI
supabase db reset
# 或
psql <your-connection-string> -f course_scheduler_schema_v2.sql
```

## 2. 驗證 Migration 是否成功

執行以下 SQL 查詢確認表已建立：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'course_%';
```

應該會看到：
- `course_sheets`
- `course_sheet_students`
- `course_sheet_rows`
- `google_calendar_events`

## 3. 檢查 RLS Policies

確認 RLS policies 已建立：

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'course_%';
```

## 4. 常見錯誤

### 錯誤：`relation "public.course_sheets" does not exist`
**解決方法**：執行 `course_scheduler_schema_v2.sql` migration

### 錯誤：`column "custom_fields" does not exist`
**解決方法**：執行 `course_scheduler_schema_v2.sql` migration（這是 V2 schema）

### 錯誤：`permission denied for table course_sheets`
**解決方法**：檢查 RLS policies 是否正確設定

## 5. 環境變數設定

確保 `apps/server/.env` 中有 Google Calendar 設定：

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=slowlearning@aphid-161707.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CALENDAR_ID=family05792779541548506447@group.calendar.google.com
```

**注意**：如果使用共享 calendar（group calendar），請確保：
1. Service Account 有權限存取該 calendar
2. 在 Google Calendar 中將該 calendar 分享給 Service Account 的 email（給予「可以管理活動」權限）

## 6. 測試

執行 migration 後，重啟 server 並測試建立 sheet 功能。
