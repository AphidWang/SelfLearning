-- 這個腳本需要在 Supabase Dashboard 的 Authentication > Users 中手動執行
-- 或者使用 Supabase CLI

-- 1. 首先，我們需要在 SQL Editor 中執行這個函數來創建認證用戶
-- 注意：這個函數只能用一次，建立對應的 auth.users 記錄

-- 創建一個臨時函數來插入認證用戶
CREATE OR REPLACE FUNCTION create_auth_users()
RETURNS void AS $$
BEGIN
  -- 插入管理員認證用戶
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    'admin@example.com',
    crypt('admin123', gen_salt('bf')), -- 密碼: admin123
    NOW(),
    NOW(),
    NOW(),
    '{"name": "管理員", "role": "admin"}'::jsonb
  ) ON CONFLICT (email) DO NOTHING;

  -- 插入測試學生用戶
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    'xiaoming@example.com',
    crypt('student123', gen_salt('bf')), -- 密碼: student123
    NOW(),
    NOW(),
    NOW(),
    '{"name": "小明", "role": "student"}'::jsonb
  ) ON CONFLICT (email) DO NOTHING;

  -- 插入測試老師用戶
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    'teacher.wang@example.com',
    crypt('teacher123', gen_salt('bf')), -- 密碼: teacher123
    NOW(),
    NOW(),
    NOW(),
    '{"name": "王老師", "role": "teacher"}'::jsonb
  ) ON CONFLICT (email) DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 執行函數
SELECT create_auth_users();

-- 清理函數
DROP FUNCTION create_auth_users(); 