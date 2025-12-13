-- ========================================
-- 課程排程系統 (Course Scheduler) 資料庫架構 V2
-- 採用混合設計：核心欄位固定，擴充欄位使用 JSONB
-- ========================================

-- 課程 Sheet 表（每個老師可以建立多個 sheet）
-- Sheet 本身保持固定欄位，因為是核心結構
CREATE TABLE IF NOT EXISTS course_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL, -- 科目
  teacher_email VARCHAR(255) NOT NULL, -- 老師的 email
  default_email_title VARCHAR(255) DEFAULT '課程通知', -- 預設信件標題
  regular_schedule JSONB DEFAULT '[]'::jsonb, -- 日常課程時間 [{dayOfWeek: 0-6, startTime: "HH:mm", endTime: "HH:mm"}]
  custom_fields JSONB DEFAULT '{}'::jsonb, -- 老師自訂欄位（例如：教室、教材連結等）
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sheet 學生表（每個 sheet 可以有多個學生）
-- 學生資訊保持固定欄位，因為需要查詢和關聯
CREATE TABLE IF NOT EXISTS course_sheet_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id UUID REFERENCES course_sheets(id) ON DELETE CASCADE NOT NULL,
  student_nickname VARCHAR(100) NOT NULL, -- 學生暱稱
  student_email VARCHAR(255) NOT NULL, -- 學生 email
  order_index INTEGER DEFAULT 0, -- 排序
  custom_data JSONB DEFAULT '{}'::jsonb, -- 學生自訂資料（例如：家長聯絡方式、特殊需求等）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sheet_id, student_email)
);

-- Sheet 課程行表（每行代表一個課程）
-- 採用混合設計：核心欄位固定，內容欄位使用 JSONB
CREATE TABLE IF NOT EXISTS course_sheet_rows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id UUID REFERENCES course_sheets(id) ON DELETE CASCADE NOT NULL,
  
  -- 核心欄位（固定，方便查詢和索引）
  title VARCHAR(255), -- 主題
  scheduled_time TIMESTAMP WITH TIME ZONE, -- 課程時間（重要，需要索引）
  student_ids JSONB DEFAULT '[]'::jsonb, -- 學生 ID 列表（空陣列表示全部學生）
  order_index INTEGER DEFAULT 0, -- 排序
  
  -- 內容欄位（JSONB，方便擴充）
  -- 預設包含：suggested_approach, learning_objectives
  -- 未來可以擴充：materials, homework, notes, attachments 等
  data JSONB DEFAULT '{
    "suggested_approach": null,
    "learning_objectives": null,
    "materials": [],
    "homework": null,
    "notes": null,
    "attachments": []
  }'::jsonb,
  
  -- 自訂欄位（JSONB，讓老師可以自由擴充）
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google Calendar Events 對應表
CREATE TABLE IF NOT EXISTS google_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  row_id UUID REFERENCES course_sheet_rows(id) ON DELETE CASCADE NOT NULL,
  sheet_id UUID REFERENCES course_sheets(id) ON DELETE CASCADE NOT NULL,
  google_event_id VARCHAR(255) NOT NULL, -- Google Calendar Event ID
  calendar_id VARCHAR(255), -- Google Calendar ID（如果有多個 calendar）
  event_data JSONB DEFAULT '{}'::jsonb, -- 儲存 event 的完整資料（方便同步和恢復）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(row_id) -- 每個 row 只能有一個 calendar event
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_course_sheets_owner_id ON course_sheets(owner_id);
CREATE INDEX IF NOT EXISTS idx_course_sheets_subject ON course_sheets(subject);
CREATE INDEX IF NOT EXISTS idx_course_sheet_students_sheet_id ON course_sheet_students(sheet_id);
CREATE INDEX IF NOT EXISTS idx_course_sheet_rows_sheet_id ON course_sheet_rows(sheet_id);
CREATE INDEX IF NOT EXISTS idx_course_sheet_rows_scheduled_time ON course_sheet_rows(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_google_calendar_events_row_id ON google_calendar_events(row_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_events_sheet_id ON google_calendar_events(sheet_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_events_google_event_id ON google_calendar_events(google_event_id);

-- JSONB 欄位的 GIN 索引（用於高效查詢 JSON 內容）
CREATE INDEX IF NOT EXISTS idx_course_sheets_custom_fields ON course_sheets USING GIN (custom_fields);
CREATE INDEX IF NOT EXISTS idx_course_sheet_rows_data ON course_sheet_rows USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_course_sheet_rows_custom_fields ON course_sheet_rows USING GIN (custom_fields);
CREATE INDEX IF NOT EXISTS idx_course_sheet_students_custom_data ON course_sheet_students USING GIN (custom_data);

-- 觸發器：更新 updated_at
CREATE TRIGGER update_course_sheets_updated_at
  BEFORE UPDATE ON course_sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_sheet_rows_updated_at
  BEFORE UPDATE ON course_sheet_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_calendar_events_updated_at
  BEFORE UPDATE ON google_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 政策
ALTER TABLE course_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sheet_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sheet_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;

-- 政策：用戶只能看到和操作自己建立的 sheets
CREATE POLICY "Users can view their own course_sheets"
  ON course_sheets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own course_sheets"
  ON course_sheets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own course_sheets"
  ON course_sheets FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own course_sheets"
  ON course_sheets FOR DELETE
  USING (auth.uid() = owner_id);

-- 政策：用戶只能操作自己 sheets 的學生
CREATE POLICY "Users can view students of their sheets"
  ON course_sheet_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_sheets 
      WHERE course_sheets.id = course_sheet_students.sheet_id 
      AND course_sheets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage students of their sheets"
  ON course_sheet_students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM course_sheets 
      WHERE course_sheets.id = course_sheet_students.sheet_id 
      AND course_sheets.owner_id = auth.uid()
    )
  );

-- 政策：用戶只能操作自己 sheets 的 rows
CREATE POLICY "Users can view rows of their sheets"
  ON course_sheet_rows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_sheets 
      WHERE course_sheets.id = course_sheet_rows.sheet_id 
      AND course_sheets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage rows of their sheets"
  ON course_sheet_rows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM course_sheets 
      WHERE course_sheets.id = course_sheet_rows.sheet_id 
      AND course_sheets.owner_id = auth.uid()
    )
  );

-- 政策：用戶只能操作自己 sheets 的 calendar events
CREATE POLICY "Users can view calendar events of their sheets"
  ON google_calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_sheets 
      WHERE course_sheets.id = google_calendar_events.sheet_id 
      AND course_sheets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage calendar events of their sheets"
  ON google_calendar_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM course_sheets 
      WHERE course_sheets.id = google_calendar_events.sheet_id 
      AND course_sheets.owner_id = auth.uid()
    )
  );
