/**
 * 認證 Token 建立工具
 * 
 * 用途：建立 temp-token.json 文件供其他測試使用
 * 使用方式：node test-login.js
 * 
 * 環境變數：
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY 
 * - TEST_EMAIL (預設: admin@example.com)
 * - TEST_PASSWORD (預設: admin123)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const testEmail = process.env.TEST_EMAIL;
const testPassword = process.env.TEST_PASSWORD;

// 檢查必要的環境變數
if (!supabaseUrl || !supabaseKey || !testEmail || !testPassword) {
  console.error('❌ 缺少必要的環境變數，請檢查 .env 文件：');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  console.error('   - TEST_EMAIL');
  console.error('   - TEST_PASSWORD');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function login() {
  try {
    console.log('🔐 正在登入...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.error('❌ 登入失敗:', error.message);
      return;
    }

    if (data.session) {
      // 存儲 token 到暫存檔案
      const tokenData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user_id: data.user.id,
        expires_at: data.session.expires_at,
        created_at: new Date().toISOString()
      };

      fs.writeFileSync('temp-token.json', JSON.stringify(tokenData, null, 2));
      console.log('✅ 登入成功! Token 已存儲到 temp-token.json');
      console.log('👤 User ID:', data.user.id);
      console.log('📧 Email:', data.user.email);
    }
  } catch (error) {
    console.error('💥 登入過程發生錯誤:', error);
  }
}

login(); 