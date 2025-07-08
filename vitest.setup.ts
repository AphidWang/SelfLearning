import { vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// 設置測試環境的 base URL
Object.defineProperty(global, 'location', {
  value: {
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
});

// 讀取認證 token
let tokenData = null;
try {
  const tokenFile = path.join(process.cwd(), 'temp-token.json');
  tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
  console.log('✅ 已載入測試認證 token');
  
  // 檢查 token 是否過期
  const now = Date.now() / 1000;
  if (tokenData.expires_at && tokenData.expires_at < now) {
    console.error('❌ Token 已過期，請重新執行：node tests/test-login.js');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 找不到 temp-token.json，請先執行：node tests/test-login.js');
  process.exit(1);
}

// 設置環境變數（確保 Supabase client 能正確初始化）
if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'http://127.0.0.1:54321';
}
if (!process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
}

// Mock fetch 來攔截 API 調用
const originalFetch = global.fetch;
global.fetch = vi.fn((input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  
  // 攔截 /api/users 相關的調用並返回模擬數據
  if (url.includes('/api/users/collaborator-candidates')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([
        {
          id: 'test-user-1',
          name: 'Test User 1',
          email: 'test1@example.com',
          role: 'student',
          roles: ['student']
        }
      ]),
    } as Response);
  }
  
  // 對於其他 API 調用，使用原始的 fetch
  return originalFetch(input, init);
});

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
let isAuthInitialized = false;

// 測試用的初始化函數
export async function initTestAuth() {
  // 如果已經初始化過，直接返回
  if (isAuthInitialized && supabaseClient) {
    // 驗證當前認證狀態
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
      console.log('✅ 測試認證已存在:', user.email);
      return user;
    }
  }
  
  // 動態導入 Supabase 服務（確保環境變數已設置）
  const { supabase } = await import('./apps/client/src/services/supabase');
  supabaseClient = supabase;
  
  try {
    // 清除現有 session
    await supabase.auth.signOut();
    
    // 設置新的認證 session
    const { data, error } = await supabase.auth.setSession({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token
    });
    
    if (error) {
      console.error('❌ 設置認證 session 失敗:', error.message);
      
      // 如果是 refresh token 問題，提示重新生成
      if (error.message.includes('Refresh Token')) {
        console.error('💡 請重新執行：node tests/test-login.js');
        process.exit(1);
      }
      
      throw error;
    }
    
    // 驗證認證狀態
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ 認證驗證失敗:', userError?.message);
      throw userError || new Error('認證失敗');
    }
    
    isAuthInitialized = true;
    console.log('✅ 測試認證設置成功:', user.email);
    return user;
    
  } catch (error) {
    console.error('❌ 認證初始化失敗:', error);
    throw error;
  }
}

// 清理測試資料的函數
export async function cleanupTestData() {
  if (!supabaseClient) return;
  
  try {
    // 清理測試數據 - 刪除所有測試創建的主題
    const { data: topics } = await supabaseClient
      .from('topics')
      .select('id')
      .like('title', '%測試%');
    
    if (topics && topics.length > 0) {
      console.log(`🧹 清理 ${topics.length} 個測試主題...`);
      
      for (const topic of topics) {
        await supabaseClient
          .from('topics')
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
  if (!isAuthInitialized) {
    await initTestAuth();
  }
  
  console.log('🔄 測試環境已重置');
}); 