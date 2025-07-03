import { vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// 讀取認證 token
let tokenData = null;
try {
  const tokenFile = path.join(process.cwd(), 'temp-token.json');
  tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
  console.log('✅ 已載入測試認證 token');
} catch (error) {
  console.error('❌ 找不到 temp-token.json，請先執行：node test-login.js');
  process.exit(1);
}

// 設置環境變數（確保 Supabase client 能正確初始化）
if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'http://127.0.0.1:54321';
}
if (!process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
}

// 設置 localStorage mock（測試環境需要）
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
  }
});

// 設置 crypto mock
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  }
});

// 重要：在模組載入前設置認證 session
let supabaseClient = null;

// 測試用的初始化函數
export async function initTestAuth() {
  // 動態導入 Supabase 服務（確保環境變數已設置）
  const { supabase } = await import('./apps/client/src/services/supabase');
  supabaseClient = supabase;
  
  // 設置認證 session
  const { error } = await supabase.auth.setSession({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token
  });
  
  if (error) {
    console.error('❌ 設置認證 session 失敗:', error.message);
    throw error;
  }
  
  // 驗證認證狀態
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ 認證驗證失敗:', userError?.message);
    throw userError || new Error('認證失敗');
  }
  
  console.log('✅ 測試認證設置成功:', user.email);
  return user;
}

// 清理測試資料的函數
export async function cleanupTestData() {
  if (!supabaseClient) return;
  
  try {
    // 清理測試數據 - 刪除所有測試創建的主題
    const { data: topics } = await supabaseClient
      .from('topics_new')
      .select('id')
      .like('title', '%測試%');
    
    if (topics && topics.length > 0) {
      console.log(`🧹 清理 ${topics.length} 個測試主題...`);
      
      for (const topic of topics) {
        await supabaseClient
          .from('topics_new')
          .delete()
          .eq('id', topic.id);
      }
    }
  } catch (error) {
    console.warn('⚠️ 清理測試資料時發生錯誤:', error.message);
  }
}

// 每個測試前重置狀態
beforeEach(async () => {
  vi.clearAllMocks();
  
  // 重置 localStorage mock
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockImplementation(() => {});
  localStorageMock.removeItem.mockImplementation(() => {});
  localStorageMock.clear.mockImplementation(() => {});
  
  // 確保認證狀態正確
  if (!supabaseClient) {
    await initTestAuth();
  }
  
  console.log('🔄 測試環境已重置');
}); 