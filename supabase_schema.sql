-- 用戶表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar TEXT,
  color VARCHAR(7) DEFAULT '#FF6B6B',
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'mentor', 'parent', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- RLS (Row Level Security) 政策
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 允許所有認證用戶讀取用戶資料
CREATE POLICY "Allow authenticated users to read users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- 允許用戶更新自己的資料
CREATE POLICY "Allow users to update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- 允許管理員/老師新增用戶
CREATE POLICY "Allow admins/teachers to insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('teacher', 'mentor')
    )
  );

-- 允許管理員/老師刪除用戶
CREATE POLICY "Allow admins/teachers to delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('teacher', 'mentor')
    )
  );

-- 插入一些範例資料
INSERT INTO users (name, email, avatar, color, role) VALUES
  ('管理員', 'admin@example.com', 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin&backgroundColor=fff3e0&clothing=shirt&accessories=glasses', '#45B7D1', 'admin'),
  ('小明', 'xiaoming@example.com', 'https://api.dicebear.com/7.x/adventurer/svg?seed=xiaoming&backgroundColor=ffd5dc&clothing=hoodie', '#FF6B6B', 'student'),
  ('小美', 'xiaomei@example.com', 'https://api.dicebear.com/7.x/adventurer/svg?seed=xiaomei&backgroundColor=e0f2fe&clothing=dress', '#4ECDC4', 'student'),
  ('王老師', 'teacher.wang@example.com', 'https://api.dicebear.com/7.x/adventurer/svg?seed=teacher&backgroundColor=fff3e0&clothing=shirt&accessories=glasses', '#45B7D1', 'teacher'),
  ('李同學', 'lixue@example.com', 'https://api.dicebear.com/7.x/adventurer/svg?seed=lixue&backgroundColor=f3e5f5&clothing=sweater', '#96CEB4', 'student'),
  ('張爸爸', 'papa.zhang@example.com', 'https://api.dicebear.com/7.x/adventurer/svg?seed=papa&backgroundColor=fff8e1&clothing=polo', '#FFEAA7', 'parent')
ON CONFLICT (email) DO NOTHING; 