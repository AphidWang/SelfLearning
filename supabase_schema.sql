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
-- 課程模板系統資料表
-- ========================================

-- 課程模板表
CREATE TABLE IF NOT EXISTS topic_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  category VARCHAR(100),
  template_type VARCHAR(50) DEFAULT 'course',
  goals JSONB DEFAULT '[]'::jsonb,
  bubbles JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  is_collaborative BOOLEAN DEFAULT false,
  copy_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 課程模板協作者表
CREATE TABLE IF NOT EXISTS topic_template_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES topic_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(20) DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- 學習主題表
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  goals JSONB DEFAULT '[]'::jsonb,
  bubbles JSONB DEFAULT '[]'::jsonb,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  template_id UUID REFERENCES topic_templates(id) ON DELETE SET NULL,
  template_version INTEGER DEFAULT 1,
  is_collaborative BOOLEAN DEFAULT false,
  show_avatars BOOLEAN DEFAULT true,
  focus_element JSONB,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 學習主題協作者表
CREATE TABLE IF NOT EXISTS topic_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(20) DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic_id, user_id)
);

-- ========================================
-- 索引優化
-- ========================================

-- 課程模板索引
CREATE INDEX IF NOT EXISTS idx_topic_templates_created_by ON topic_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_topic_templates_public ON topic_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_topic_templates_collaborative ON topic_templates(is_collaborative) WHERE is_collaborative = true;
CREATE INDEX IF NOT EXISTS idx_topic_templates_subject ON topic_templates(subject);
CREATE INDEX IF NOT EXISTS idx_topic_templates_updated_at ON topic_templates(updated_at DESC);

-- 協作者索引
CREATE INDEX IF NOT EXISTS idx_template_collaborators_template_id ON topic_template_collaborators(template_id);
CREATE INDEX IF NOT EXISTS idx_template_collaborators_user_id ON topic_template_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_collaborators_topic_id ON topic_collaborators(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_collaborators_user_id ON topic_collaborators(user_id);

-- 學習主題索引
CREATE INDEX IF NOT EXISTS idx_topics_owner_id ON topics(owner_id);
CREATE INDEX IF NOT EXISTS idx_topics_template_id ON topics(template_id);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_updated_at ON topics(updated_at DESC);

-- ========================================
-- 觸發器和函數
-- ========================================

-- 更新 updated_at 觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

-- 為各表添加 updated_at 觸發器
DROP TRIGGER IF EXISTS update_topic_templates_updated_at ON topic_templates;
CREATE TRIGGER update_topic_templates_updated_at
  BEFORE UPDATE ON topic_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON topics
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

-- 課程模板 RLS 政策
-- 1. 任何人都可以查看公開模板
CREATE POLICY "Public templates are viewable by everyone" ON topic_templates
  FOR SELECT USING (is_public = true);

-- 2. 用戶可以查看自己建立的模板
CREATE POLICY "Users can view own templates" ON topic_templates
  FOR SELECT USING (auth.uid() = created_by);

-- 3. 協作者可以查看協作模板
CREATE POLICY "Collaborators can view collaborative templates" ON topic_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topic_template_collaborators
      WHERE template_id = topic_templates.id
      AND user_id = auth.uid()
    )
  );

-- 4. 用戶可以建立模板
CREATE POLICY "Users can create templates" ON topic_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 5. 擁有者和管理協作者可以更新模板
CREATE POLICY "Owners and admins can update templates" ON topic_templates
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM topic_template_collaborators
      WHERE template_id = topic_templates.id
      AND user_id = auth.uid()
      AND permission IN ('edit', 'admin')
    )
  );

-- 6. 只有擁有者可以刪除模板
CREATE POLICY "Only owners can delete templates" ON topic_templates
  FOR DELETE USING (auth.uid() = created_by);

-- 協作者表 RLS 政策
-- 1. 模板擁有者和協作者可以查看協作者列表
CREATE POLICY "Template members can view collaborators" ON topic_template_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topic_templates
      WHERE id = template_id
      AND (created_by = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM topic_template_collaborators tc
             WHERE tc.template_id = topic_templates.id
             AND tc.user_id = auth.uid()
           ))
    )
  );

-- 2. 模板擁有者和管理協作者可以邀請新協作者
CREATE POLICY "Owners and admins can invite collaborators" ON topic_template_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM topic_templates
      WHERE id = template_id
      AND (created_by = auth.uid() OR
           EXISTS (
             SELECT 1 FROM topic_template_collaborators tc
             WHERE tc.template_id = topic_templates.id
             AND tc.user_id = auth.uid()
             AND tc.permission = 'admin'
           ))
    )
  );

-- 3. 模板擁有者和管理協作者可以更新協作者權限
CREATE POLICY "Owners and admins can update collaborator permissions" ON topic_template_collaborators
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM topic_templates
      WHERE id = template_id
      AND (created_by = auth.uid() OR
           EXISTS (
             SELECT 1 FROM topic_template_collaborators tc
             WHERE tc.template_id = topic_templates.id
             AND tc.user_id = auth.uid()
             AND tc.permission = 'admin'
           ))
    )
  );

-- 4. 模板擁有者和管理協作者可以移除協作者
CREATE POLICY "Owners and admins can remove collaborators" ON topic_template_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM topic_templates
      WHERE id = template_id
      AND (created_by = auth.uid() OR
           EXISTS (
             SELECT 1 FROM topic_template_collaborators tc
             WHERE tc.template_id = topic_templates.id
             AND tc.user_id = auth.uid()
             AND tc.permission = 'admin'
           ))
    )
  );

-- 學習主題 RLS 政策
-- 1. 用戶可以查看自己的主題
CREATE POLICY "Users can view own topics" ON topics
  FOR SELECT USING (auth.uid() = owner_id);

-- 2. 協作者可以查看協作主題
CREATE POLICY "Collaborators can view collaborative topics" ON topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topic_collaborators
      WHERE topic_id = topics.id
      AND user_id = auth.uid()
    )
  );

-- 3. 用戶可以建立主題
CREATE POLICY "Users can create topics" ON topics
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 4. 擁有者和編輯協作者可以更新主題
CREATE POLICY "Owners and editors can update topics" ON topics
  FOR UPDATE USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM topic_collaborators
      WHERE topic_id = topics.id
      AND user_id = auth.uid()
      AND permission = 'edit'
    )
  );

-- 5. 只有擁有者可以刪除主題
CREATE POLICY "Only owners can delete topics" ON topics
  FOR DELETE USING (auth.uid() = owner_id);

-- 主題協作者表 RLS 政策
-- 1. 主題成員可以查看協作者列表
CREATE POLICY "Topic members can view collaborators" ON topic_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE id = topic_id
      AND (owner_id = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM topic_collaborators tc
             WHERE tc.topic_id = topics.id
             AND tc.user_id = auth.uid()
           ))
    )
  );

-- 2. 主題擁有者可以邀請協作者
CREATE POLICY "Topic owners can invite collaborators" ON topic_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics
      WHERE id = topic_id
      AND owner_id = auth.uid()
    )
  );

-- 3. 主題擁有者可以更新協作者權限
CREATE POLICY "Topic owners can update collaborator permissions" ON topic_collaborators
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE id = topic_id
      AND owner_id = auth.uid()
    )
  );

-- 4. 主題擁有者可以移除協作者
CREATE POLICY "Topic owners can remove collaborators" ON topic_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE id = topic_id
      AND owner_id = auth.uid()
    )
  );

-- ========================================
-- 範例資料 (可選)
-- ========================================

-- 插入一些範例課程模板 (需要真實的 user_id)
-- INSERT INTO topic_templates (title, description, subject, category, is_public, created_by) VALUES
-- ('數學基礎', '小學數學基礎概念', '數學', '基礎教育', true, 'user-uuid-here'),
-- ('英語入門', '英語字母和基本單字', '英語', '語言學習', true, 'user-uuid-here');

-- 目前資料庫架構狀態: ✅ 完整的模板和主題管理系統
-- 最後更新: 2025-01-02 