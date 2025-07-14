-- 資料庫架構說明
-- 
-- 此專案使用 Supabase Auth 內建的認證系統，不需要自定義的 users 表。
-- 用戶資料儲存在 auth.users 表的 user_metadata 欄位中。
--
-- auth.users 表結構 (Supabase 內建):
-- - id (uuid, 主鍵)
-- - email (varchar, 唯一)  
-- - encrypted_password (varchar)
-- - email_confirmed_at (timestamptz)
-- - created_at (timestamptz)
-- - updated_at (timestamptz)
-- - raw_user_meta_data (jsonb) - 儲存自定義用戶資料
-- - raw_app_meta_data (jsonb)
-- - last_sign_in_at (timestamptz)
-- - is_super_admin (boolean)
-- - phone (text)
-- - phone_confirmed_at (timestamptz)
-- - confirmed_at (timestamptz, 自動計算)
-- - 其他認證相關欄位...
--
-- user_metadata 結構範例:
-- {
--   "name": "用戶暱稱",
--   "role": "student|mentor|parent|admin", 
--   "avatar": "頭像 URL",
--   "color": "#FF6B6B",
--   "email_verified": true
-- }
--
-- 角色說明:
-- - student: 學生
-- - mentor: 導師/老師
-- - parent: 家長
-- - admin: 管理員
--
-- 注意事項:
-- 1. 用戶創建和管理通過 Supabase Auth API 進行
-- 2. 用戶資料更新使用 supabase.auth.updateUser() 方法
-- 3. RLS (Row Level Security) 由 Supabase Auth 自動處理
-- 4. 無需手動建立 users 表或相關觸發器
-- 5. 用戶認證狀態由 Supabase Auth 自動管理

-- 如果需要額外的業務資料表，可以在此添加
-- 例如: 學習記錄、任務、目標等
-- 這些表應該通過 auth.uid() 函數連接到 auth.users.id

-- 範例: 學習記錄表 (未實作)
-- CREATE TABLE IF NOT EXISTS learning_records (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--   subject VARCHAR(100) NOT NULL,
--   progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- ========================================
-- 主要表格結構（清理後的版本）
-- ========================================

-- 用戶表（已存在於 auth schema）
-- auth.users 表由 Supabase 自動管理

-- 學習主題模板表
CREATE TABLE IF NOT EXISTS topic_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  category VARCHAR(100),
  content JSONB NOT NULL DEFAULT '{"goals": [], "bubbles": []}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  is_collaborative BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 主題模板協作者表
CREATE TABLE IF NOT EXISTS topic_template_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES topic_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(20) DEFAULT 'edit' CHECK (permission IN ('view', 'edit')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- 學習主題表（正規化版本）
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  type VARCHAR(50) DEFAULT 'learning',
  template_id UUID REFERENCES topic_templates(id) ON DELETE SET NULL,
  template_version INTEGER DEFAULT 1,
  is_collaborative BOOLEAN DEFAULT false,
  show_avatars BOOLEAN DEFAULT true,
  focus_element JSONB,
  bubbles JSONB DEFAULT '[]'::jsonb,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date TIMESTAMP WITH TIME ZONE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 主題協作者表
CREATE TABLE IF NOT EXISTS topic_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(20) DEFAULT 'edit' CHECK (permission IN ('view', 'edit')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic_id, user_id)
);

-- 目標表
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  order_index INTEGER DEFAULT 0,
  need_help BOOLEAN DEFAULT false,
  help_message TEXT,
  help_resolved_at TIMESTAMP WITH TIME ZONE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  collaborator_ids JSONB DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任務表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  order_index INTEGER DEFAULT 0,
  need_help BOOLEAN DEFAULT false,
  help_message TEXT,
  help_resolved_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_time INTEGER, -- 估計時間（分鐘）
  completion_time INTEGER, -- 實際完成時間（分鐘）
  completed_at TIMESTAMP WITH TIME ZONE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  collaborator_ids JSONB DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任務記錄表
CREATE TABLE IF NOT EXISTS task_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  completion_time INTEGER, -- 完成時間（分鐘）
  tags JSONB DEFAULT '[]'::jsonb,
  files JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任務動作記錄表（打卡、狀態變更等）
CREATE TABLE IF NOT EXISTS task_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('check_in', 'add_count', 'add_amount', 'complete', 'reset', 'status_change')),
  action_data JSONB DEFAULT '{}'::jsonb, -- 動作相關數據（如：計數、累計量等）
  action_date DATE NOT NULL, -- 動作日期（用於業務邏輯，如防止重複打卡）
  action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 精確的動作時間戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 防止同一任務同一天重複特定動作的約束
  UNIQUE(task_id, action_type, action_date, user_id)
);

-- ========================================
-- 索引優化
-- ========================================

-- topic_templates 索引
CREATE INDEX IF NOT EXISTS idx_topic_templates_created_by ON topic_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_topic_templates_public ON topic_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_topic_templates_collaborative ON topic_templates(is_collaborative) WHERE is_collaborative = true;
CREATE INDEX IF NOT EXISTS idx_topic_templates_subject ON topic_templates(subject);
CREATE INDEX IF NOT EXISTS idx_topic_templates_updated_at ON topic_templates(updated_at DESC);

-- topic_template_collaborators 索引
CREATE INDEX IF NOT EXISTS idx_template_collaborators_template_id ON topic_template_collaborators(template_id);
CREATE INDEX IF NOT EXISTS idx_template_collaborators_user_id ON topic_template_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_collaborators_topic_id ON topic_collaborators(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_collaborators_user_id ON topic_collaborators(user_id);

-- topics 索引
CREATE INDEX IF NOT EXISTS idx_topics_owner_id ON topics(owner_id);
CREATE INDEX IF NOT EXISTS idx_topics_template_id ON topics(template_id);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_updated_at ON topics(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_collaborative ON topics(is_collaborative) WHERE is_collaborative = true;

-- goals 索引
CREATE INDEX IF NOT EXISTS idx_goals_topic_id ON goals(topic_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_owner_id ON goals(owner_id);
CREATE INDEX IF NOT EXISTS idx_goals_order_index ON goals(order_index);
CREATE INDEX IF NOT EXISTS idx_goals_updated_at ON goals(updated_at DESC);

-- tasks 索引
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at DESC);

-- task_records 索引
CREATE INDEX IF NOT EXISTS idx_task_records_task_id ON task_records(task_id);
CREATE INDEX IF NOT EXISTS idx_task_records_topic_id ON task_records(topic_id);
CREATE INDEX IF NOT EXISTS idx_task_records_user_id ON task_records(user_id);
CREATE INDEX IF NOT EXISTS idx_task_records_created_at ON task_records(created_at DESC);

-- task_actions 索引
CREATE INDEX IF NOT EXISTS idx_task_actions_task_id ON task_actions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_actions_user_id ON task_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_actions_action_date ON task_actions(action_date);
CREATE INDEX IF NOT EXISTS idx_task_actions_action_type ON task_actions(action_type);

-- 複合索引（性能優化）
CREATE INDEX IF NOT EXISTS idx_goals_topic_status ON goals(topic_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_status ON tasks(goal_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_status_user ON tasks(status, owner_id);

-- ========================================
-- 觸發器函數
-- ========================================

-- 更新 updated_at 欄位的觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 觸發器
CREATE TRIGGER update_topic_templates_updated_at
  BEFORE UPDATE ON topic_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_records_updated_at
  BEFORE UPDATE ON task_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_actions_updated_at
  BEFORE UPDATE ON task_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Row Level Security (RLS) 政策
-- ========================================

-- 啟用 RLS
ALTER TABLE topic_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_template_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_actions ENABLE ROW LEVEL SECURITY;

-- 清理和重建所有 RLS 政策
DO $$ 
BEGIN
    -- 清理課程模板的 policy
    DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON topic_templates;
    DROP POLICY IF EXISTS "Users can view own templates" ON topic_templates;
    DROP POLICY IF EXISTS "Collaborators can view collaborative templates" ON topic_templates;
    DROP POLICY IF EXISTS "Users can create templates" ON topic_templates;
    DROP POLICY IF EXISTS "Owners and admins can update templates" ON topic_templates;
    DROP POLICY IF EXISTS "Only owners can delete templates" ON topic_templates;

    -- 清理課程模板協作者的 policy
    DROP POLICY IF EXISTS "Template members can view collaborators" ON topic_template_collaborators;
    DROP POLICY IF EXISTS "Owners and admins can invite collaborators" ON topic_template_collaborators;
    DROP POLICY IF EXISTS "Owners and admins can update collaborator permissions" ON topic_template_collaborators;
    DROP POLICY IF EXISTS "Owners and admins can remove collaborators" ON topic_template_collaborators;

    -- 清理學習主題的 policy
    DROP POLICY IF EXISTS "Users can view own topics" ON topics;
    DROP POLICY IF EXISTS "Collaborators can view collaborative topics" ON topics;
    DROP POLICY IF EXISTS "Users can create topics" ON topics;
    DROP POLICY IF EXISTS "Owners and editors can update topics" ON topics;
    DROP POLICY IF EXISTS "Only owners can delete topics" ON topics;

    -- 清理主題協作者的 policy
    DROP POLICY IF EXISTS "Topic members can view collaborators" ON topic_collaborators;
    DROP POLICY IF EXISTS "Owners can invite collaborators" ON topic_collaborators;

    -- 清理可能存在的重複 policy
    DROP POLICY IF EXISTS "Anyone can view public topic templates" ON topic_templates;
    DROP POLICY IF EXISTS "Users can manage their own topic templates" ON topic_templates;
    DROP POLICY IF EXISTS "Collaborators can access templates" ON topic_templates;
    DROP POLICY IF EXISTS "Only owners can update templates" ON topic_templates;
    DROP POLICY IF EXISTS "Users can view own and collaborative topics" ON topics;
    DROP POLICY IF EXISTS "Users can view and manage collaborators" ON topic_collaborators;
    DROP POLICY IF EXISTS "Template creators can manage collaborators" ON topic_template_collaborators;
    DROP POLICY IF EXISTS "Template owners can remove collaborators" ON topic_template_collaborators;
    DROP POLICY IF EXISTS "Template owners can invite collaborators" ON topic_template_collaborators;
    DROP POLICY IF EXISTS "Collaborators can view other collaborators" ON topic_template_collaborators;
    DROP POLICY IF EXISTS "Template owners can view collaborators" ON topic_template_collaborators;
    DROP POLICY IF EXISTS "Collaborators can view their own access" ON topic_template_collaborators;
    DROP POLICY IF EXISTS "Template owners can update collaborator permissions" ON topic_template_collaborators;
END $$;

-- 重建課程模板的 policy
DO $$ 
BEGIN
    -- 1. 查看權限
    CREATE POLICY "Public templates are viewable by everyone" ON topic_templates
        FOR SELECT USING (is_public = true);

    CREATE POLICY "Users can view own templates" ON topic_templates
        FOR SELECT USING ((SELECT auth.uid()) = created_by);

    CREATE POLICY "Collaborators can view collaborative templates" ON topic_templates
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM topic_template_collaborators
                WHERE template_id = topic_templates.id
                AND user_id = (SELECT auth.uid())
            )
        );

    -- 2. 修改權限
    CREATE POLICY "Users can create templates" ON topic_templates
        FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

    CREATE POLICY "Owners and admins can update templates" ON topic_templates
        FOR UPDATE USING (
            (SELECT auth.uid()) = created_by OR
            EXISTS (
                SELECT 1 FROM topic_template_collaborators
                WHERE template_id = topic_templates.id
                AND user_id = (SELECT auth.uid())
                AND permission IN ('edit', 'admin')
            )
        );

    CREATE POLICY "Only owners can delete templates" ON topic_templates
        FOR DELETE USING ((SELECT auth.uid()) = created_by);
END $$;

-- 重建課程模板協作者的 policy
DO $$ 
BEGIN
    CREATE POLICY "Template members can view collaborators" ON topic_template_collaborators
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM topic_templates
                WHERE id = template_id
                AND ((SELECT auth.uid()) = created_by OR 
                    EXISTS (
                        SELECT 1 FROM topic_template_collaborators tc
                        WHERE tc.template_id = topic_templates.id
                        AND tc.user_id = (SELECT auth.uid())
                    ))
            )
        );

    CREATE POLICY "Owners and admins can invite collaborators" ON topic_template_collaborators
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM topic_templates
                WHERE id = template_id
                AND ((SELECT auth.uid()) = created_by OR
                    EXISTS (
                        SELECT 1 FROM topic_template_collaborators tc
                        WHERE tc.template_id = topic_templates.id
                        AND tc.user_id = (SELECT auth.uid())
                        AND tc.permission = 'admin'
                    ))
            )
        );

    CREATE POLICY "Owners and admins can update collaborator permissions" ON topic_template_collaborators
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM topic_templates
                WHERE id = template_id
                AND ((SELECT auth.uid()) = created_by OR
                    EXISTS (
                        SELECT 1 FROM topic_template_collaborators tc
                        WHERE tc.template_id = topic_templates.id
                        AND tc.user_id = (SELECT auth.uid())
                        AND tc.permission = 'admin'
                    ))
            )
        );

    CREATE POLICY "Owners and admins can remove collaborators" ON topic_template_collaborators
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM topic_templates
                WHERE id = template_id
                AND ((SELECT auth.uid()) = created_by OR
                    EXISTS (
                        SELECT 1 FROM topic_template_collaborators tc
                        WHERE tc.template_id = topic_templates.id
                        AND tc.user_id = (SELECT auth.uid())
                        AND tc.permission = 'admin'
                    ))
            )
        );
END $$;

-- 重建學習主題相關的 policy
DO $$ 
BEGIN
    -- 學習主題的 policy
    CREATE POLICY "Users can view own topics" ON topics
        FOR SELECT USING ((SELECT auth.uid()) = owner_id);

    CREATE POLICY "Collaborators can view collaborative topics" ON topics
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM topic_collaborators
                WHERE topic_id = topics.id
                AND user_id = (SELECT auth.uid())
            )
        );

    CREATE POLICY "Users can create topics" ON topics
        FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

    CREATE POLICY "Owners and editors can update topics" ON topics
        FOR UPDATE USING (
            (SELECT auth.uid()) = owner_id OR
            EXISTS (
                SELECT 1 FROM topic_collaborators
                WHERE topic_id = topics.id
                AND user_id = (SELECT auth.uid())
                AND permission = 'edit'
            )
        );

    CREATE POLICY "Only owners can delete topics" ON topics
        FOR DELETE USING ((SELECT auth.uid()) = owner_id);

    -- 主題協作者的 policy
    CREATE POLICY "Topic members can view collaborators" ON topic_collaborators
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM topics
                WHERE id = topic_id
                AND ((SELECT auth.uid()) = owner_id OR 
                    EXISTS (
                        SELECT 1 FROM topic_collaborators tc
                        WHERE tc.topic_id = topics.id
                        AND tc.user_id = (SELECT auth.uid())
                    ))
            )
        );

    CREATE POLICY "Owners can invite collaborators" ON topic_collaborators
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM topics
                WHERE id = topic_id
                AND (SELECT auth.uid()) = owner_id
            )
        );
END $$;

-- ========================================
-- 範例資料 (可選)
-- ========================================

-- 插入一些範例課程模板 (需要真實的 user_id)
-- INSERT INTO topic_templates (title, description, subject, category, is_public, created_by) VALUES
-- ('數學基礎', '小學數學基礎概念', '數學', '基礎教育', true, 'user-uuid-here'),
-- ('英語入門', '英語字母和基本單字', '英語', '語言學習', true, 'user-uuid-here');

-- 目前資料庫架構狀態: ✅ 完整的模板和主題管理系統
-- 最後更新: 2025-01-02

-- ========================================
-- 樂觀鎖定函數（版本控制）
-- ========================================

-- 安全更新主題函數
CREATE OR REPLACE FUNCTION safe_update_topic(
  p_topic_id UUID,
  p_expected_version INTEGER,
  p_updates JSONB
) RETURNS JSONB AS $$
DECLARE
  v_current_version INTEGER;
  v_result JSONB;
BEGIN
  -- 檢查版本號
  SELECT version INTO v_current_version
  FROM topics
  WHERE id = p_topic_id;

  IF v_current_version IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '主題不存在');
  END IF;

  IF v_current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', '版本衝突',
      'current_version', v_current_version
    );
  END IF;

  -- 執行更新，版本號+1
  UPDATE topics 
  SET 
    title = COALESCE((p_updates->>'title')::VARCHAR, title),
    description = COALESCE(p_updates->>'description', description),
    subject = COALESCE(p_updates->>'subject', subject),
    status = COALESCE(p_updates->>'status', status),
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_topic_id
  RETURNING to_jsonb(topics.*) INTO v_result;

  RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 安全更新目標函數
CREATE OR REPLACE FUNCTION safe_update_goal(
  p_goal_id UUID,
  p_expected_version INTEGER,
  p_updates JSONB
) RETURNS JSONB AS $$
DECLARE
  v_current_version INTEGER;
  v_result JSONB;
BEGIN
  -- 檢查版本號
  SELECT version INTO v_current_version
  FROM goals
  WHERE id = p_goal_id;

  IF v_current_version IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '目標不存在');
  END IF;

  IF v_current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', '版本衝突',
      'current_version', v_current_version
    );
  END IF;

  -- 執行更新，版本號+1
  UPDATE goals 
  SET 
    title = COALESCE((p_updates->>'title')::VARCHAR, title),
    description = COALESCE(p_updates->>'description', description),
    status = COALESCE(p_updates->>'status', status),
    priority = COALESCE(p_updates->>'priority', priority),
    need_help = COALESCE((p_updates->>'need_help')::BOOLEAN, need_help),
    help_message = COALESCE(p_updates->>'help_message', help_message),
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_goal_id
  RETURNING to_jsonb(goals.*) INTO v_result;

  RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 安全更新任務函數
CREATE OR REPLACE FUNCTION safe_update_task(
  p_task_id UUID,
  p_expected_version INTEGER,
  p_updates JSONB
) RETURNS JSONB AS $$
DECLARE
  v_current_version INTEGER;
  v_result JSONB;
BEGIN
  -- 檢查版本號
  SELECT version INTO v_current_version
  FROM tasks
  WHERE id = p_task_id;

  IF v_current_version IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '任務不存在');
  END IF;

  IF v_current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', '版本衝突',
      'current_version', v_current_version
    );
  END IF;

  -- 執行更新，版本號+1
  UPDATE tasks 
  SET 
    title = COALESCE((p_updates->>'title')::VARCHAR, title),
    description = COALESCE(p_updates->>'description', description),
    status = COALESCE(p_updates->>'status', status),
    priority = COALESCE(p_updates->>'priority', priority),
    need_help = COALESCE((p_updates->>'need_help')::BOOLEAN, need_help),
    help_message = COALESCE(p_updates->>'help_message', help_message),
    completed_at = CASE 
      WHEN p_updates->>'status' = 'done' THEN NOW()
      WHEN p_updates->>'status' != 'done' THEN NULL
      ELSE completed_at
    END,
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_task_id
  RETURNING to_jsonb(tasks.*) INTO v_result;

  RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 高性能查詢函數
-- ========================================

-- 獲取用戶的活躍任務（TaskWall 優化）
CREATE OR REPLACE FUNCTION get_active_tasks_for_user(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  task_id UUID,
  task_title VARCHAR,
  task_description TEXT,
  task_status VARCHAR,
  task_priority VARCHAR,
  task_due_date TIMESTAMP WITH TIME ZONE,
  task_need_help BOOLEAN,
  goal_id UUID,
  goal_title VARCHAR,
  topic_id UUID,
  topic_title VARCHAR,
  topic_subject VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.need_help,
    g.id,
    g.title,
    tn.id,
    tn.title,
    tn.subject
  FROM tasks t
  JOIN goals g ON t.goal_id = g.id
  JOIN topics tn ON g.topic_id = tn.id
  LEFT JOIN topic_collaborators tc ON tn.id = tc.topic_id
  WHERE 
    t.status IN ('todo', 'in_progress')
    AND g.status != 'archived'
    AND tn.status != 'archived'
    AND (
      tn.owner_id = COALESCE(p_user_id, auth.uid()) OR
      tc.user_id = COALESCE(p_user_id, auth.uid())
    )
  ORDER BY 
    CASE t.status WHEN 'in_progress' THEN 1 ELSE 2 END,
    CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    t.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 獲取主題完整結構（含目標和任務）
CREATE OR REPLACE FUNCTION get_topic_with_structure(p_topic_id UUID)
RETURNS TABLE (
  topic_data JSONB,
  goals_data JSONB,
  tasks_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_info AS (
    SELECT to_jsonb(tn.*) as topic_json
    FROM topics tn
    WHERE tn.id = p_topic_id
  ),
  goals_info AS (
    SELECT jsonb_agg(to_jsonb(g.*)) as goals_json
    FROM goals g
    WHERE g.topic_id = p_topic_id
    AND g.status != 'archived'
  ),
  tasks_info AS (
    SELECT jsonb_agg(to_jsonb(t.*)) as tasks_json
    FROM tasks t
    JOIN goals g ON t.goal_id = g.id
    WHERE g.topic_id = p_topic_id
    AND t.status != 'archived'
    AND g.status != 'archived'
  )
  SELECT 
    ti.topic_json,
    COALESCE(gi.goals_json, '[]'::jsonb),
    COALESCE(tsi.tasks_json, '[]'::jsonb)
  FROM topic_info ti
  CROSS JOIN goals_info gi
  CROSS JOIN tasks_info tsi;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 架構狀態更新
-- ========================================
-- 資料庫架構狀態: ✅ 完整的模板和主題管理系統 + 正規化結構
-- 包含: 舊 JSONB 結構 + 新正規化結構 + 完整 RLS + 版本控制 + 高性能查詢
-- 最後更新: 2025-01-06

-- ========================================
-- Task Records 和 Task Actions 的 RLS 政策
-- ========================================

-- Task Records 政策
DO $$ 
BEGIN
    -- 清理可能存在的舊政策
    DROP POLICY IF EXISTS "Users can view own task records" ON task_records;
    DROP POLICY IF EXISTS "Users can create task records" ON task_records;
    DROP POLICY IF EXISTS "Users can update own task records" ON task_records;
    DROP POLICY IF EXISTS "Users can delete own task records" ON task_records;

    -- 創建新政策
    CREATE POLICY "Users can view own task records" ON task_records
        FOR SELECT USING (user_id = auth.uid());

    CREATE POLICY "Users can create task records" ON task_records
        FOR INSERT WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update own task records" ON task_records
        FOR UPDATE USING (user_id = auth.uid());

    CREATE POLICY "Users can delete own task records" ON task_records
        FOR DELETE USING (user_id = auth.uid());
END $$;

-- Task Actions 政策
DO $$ 
BEGIN
    -- 清理可能存在的舊政策
    DROP POLICY IF EXISTS "Users can view own task actions" ON task_actions;
    DROP POLICY IF EXISTS "Users can create task actions" ON task_actions;
    DROP POLICY IF EXISTS "Users can update own task actions" ON task_actions;
    DROP POLICY IF EXISTS "Users can delete own task actions" ON task_actions;

    -- 創建新政策
    CREATE POLICY "Users can view own task actions" ON task_actions
        FOR SELECT USING (user_id = auth.uid());

    CREATE POLICY "Users can create task actions" ON task_actions
        FOR INSERT WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update own task actions" ON task_actions
        FOR UPDATE USING (user_id = auth.uid());

    CREATE POLICY "Users can delete own task actions" ON task_actions
        FOR DELETE USING (user_id = auth.uid());
END $$;