import axios from 'axios';
import { supabase } from './supabase';

export const api = axios.create({
  // 使用相對路徑讓 Vite proxy 生效（開發環境）
  // 或使用環境變數指定的完整 URL（生產環境）
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:5200'),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 60000 // 60 秒 timeout（TTS 需要較長時間）
});

// 防止重複刷新 token 的標誌
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// 處理等待隊列
const processQueue = (error: any, token: string | null = null) => {
  console.log(`🔄 [Token] 處理等待隊列，隊列長度: ${failedQueue.length}`, { error: !!error, token: !!token });
  
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// 獲取有效的 token
const getValidToken = async (): Promise<string | null> => {
  try {
    // 先檢查 localStorage
    const storedToken = localStorage.getItem('token');
    console.log(`🔍 [Token] localStorage token 存在: ${!!storedToken}`);
    
    // 從 Supabase session 獲取最新的 token
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ [Token] 獲取 session 失敗:', error);
      return storedToken; // 降級使用 localStorage 的 token
    }
    
    if (!session) {
      console.warn('⚠️ [Token] 沒有 session，用戶可能未登入');
      return null;
    }
    
    const { access_token, expires_at } = session;
    const now = Math.floor(Date.now() / 1000);
    const timeToExpiry = expires_at ? expires_at - now : 0;
    
    console.log(`📊 [Token] Session 資訊:`, {
      hasToken: !!access_token,
      expiresAt: expires_at,
      timeToExpiry: timeToExpiry,
      willExpireSoon: timeToExpiry < 300 // 5 分鐘內
    });
    
    // 如果 token 即將過期（5 分鐘內），嘗試刷新
    if (timeToExpiry < 300) {
      console.log('⏰ [Token] Token 即將過期，嘗試刷新...');
      return await refreshSupabaseToken();
    }
    
    // 更新 localStorage 中的 token
    if (access_token && access_token !== storedToken) {
      console.log('🔄 [Token] 更新 localStorage token');
      localStorage.setItem('token', access_token);
    }
    
    return access_token;
  } catch (error) {
    console.error('❌ [Token] getValidToken 失敗:', error);
    return localStorage.getItem('token'); // 降級使用 localStorage
  }
};

// 使用 Supabase 刷新 token
const refreshSupabaseToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 [Token] 開始 Supabase token 刷新...');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ [Token] Supabase 刷新失敗:', error);
      
      // 如果是 refresh token 過期，強制登出
      if (error.message?.includes('refresh_token') || 
          error.message?.includes('expired') ||
          error.message?.includes('invalid')) {
        console.warn('⚠️ [Token] Refresh token 無效，準備登出');
        await handleForceLogout('refresh_token_invalid');
      }
      
      return null;
    }
    
    if (data.session) {
      const newToken = data.session.access_token;
      console.log('✅ [Token] Supabase 刷新成功');
      
      // 更新 localStorage
      localStorage.setItem('token', newToken);
      
      return newToken;
    }
    
    console.warn('⚠️ [Token] Supabase 刷新後沒有 session');
    return null;
  } catch (error) {
    console.error('❌ [Token] refreshSupabaseToken 錯誤:', error);
    return null;
  }
};

// 強制登出處理
const handleForceLogout = async (reason: string) => {
  console.warn(`🚪 [Auth] 強制登出，原因: ${reason}`);
  
  // 清除所有本地存儲
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  // 登出 Supabase
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('❌ [Auth] Supabase 登出失敗:', error);
  }
  
  // 重定向到登入頁
  if (typeof window !== 'undefined') {
    console.log('🔄 [Auth] 重定向到登入頁');
    window.location.href = '/';
  }
};

// 添加請求攔截器
api.interceptors.request.use(async config => {
  const token = await getValidToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('📤 [Request] 添加 Authorization header');
  } else {
    console.warn('⚠️ [Request] 沒有可用的 token');
  }
  
  return config;
});

// 響應攔截器
api.interceptors.response.use(
  response => {
    console.log(`✅ [Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async error => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    console.error(`❌ [Response] ${originalRequest.method?.toUpperCase()} ${originalRequest.url} - ${status}`, {
      errorData,
      isRetry: !!originalRequest._retry
    });
    
    // 如果是 401 錯誤且不是重試請求
    if (status === 401 && !originalRequest._retry) {
      console.log('🔐 [Auth] 收到 401 錯誤，開始處理...');
      
      // 如果正在刷新 token，將請求加入隊列
      if (isRefreshing) {
        console.log('⏳ [Auth] 正在刷新 token，將請求加入隊列');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          console.log('🔄 [Auth] 使用新 token 重試請求');
          return api(originalRequest);
        }).catch(err => {
          console.error('❌ [Auth] 隊列請求失敗:', err);
          return Promise.reject(err);
        });
      }
      
      // 開始刷新 token
      isRefreshing = true;
      originalRequest._retry = true;
      
      try {
        console.log('🔄 [Auth] 嘗試刷新 token...');
        const newToken = await refreshSupabaseToken();
        
        if (newToken) {
          console.log('✅ [Auth] Token 刷新成功，重試原始請求');
          
          // 更新原始請求的 Authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // 處理等待隊列
          processQueue(null, newToken);
          
          isRefreshing = false;
          
          // 重新發送原始請求
          return api(originalRequest);
        } else {
          console.warn('⚠️ [Auth] Token 刷新失敗');
          throw new Error('Token refresh failed');
        }
        
      } catch (refreshError) {
        console.error('❌ [Auth] Token 刷新過程中發生錯誤:', refreshError);
        
        // 處理等待隊列
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // 強制登出
        await handleForceLogout('token_refresh_failed');
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
); 