import axios from 'axios';

/**
 * API 服務
 * 
 * 使用 VITE_API_URL 環境變數來指定 API 端點
 * 如果未設定，預設使用相對路徑 '/api'（同 domain 時）
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://selflearning.zeabur.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 60000, // 60 秒 timeout
});

// 請求攔截器：添加認證 token
api.interceptors.request.use(
  async (config) => {
    // TODO: 從 Supabase session 獲取 token
    // const { data: { session } } = await supabase.auth.getSession();
    // if (session?.access_token) {
    //   config.headers.Authorization = `Bearer ${session.access_token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器：處理錯誤
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // TODO: 處理 401 錯誤，刷新 token
    return Promise.reject(error);
  }
);

