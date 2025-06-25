import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 15000 // 15 秒 timeout
});

// 防止重複刷新 token 的標誌
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// 處理等待隊列
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// 添加請求攔截器
api.interceptors.request.use(config => {
  // 優先使用 accessToken，其次使用舊的 token
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// 響應攔截器
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // 如果是 401 錯誤且不是刷新 token 的請求
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      // 如果有 refresh token，嘗試刷新
      if (refreshToken && !isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;
        
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/api/auth/refresh`,
            { refreshToken },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 5000
            }
          );
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // 更新儲存的 token
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // 更新原始請求的 Authorization header
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          // 處理等待隊列
          processQueue(null, accessToken);
          
          isRefreshing = false;
          
          // 重新發送原始請求
          return api(originalRequest);
          
        } catch (refreshError) {
          // 刷新失敗，清除所有 token 並重定向到登入頁
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // 重定向到登入頁
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          
          return Promise.reject(refreshError);
        }
      } else if (isRefreshing) {
        // 如果正在刷新 token，將請求加入隊列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      } else {
        // 沒有 refresh token 或其他情況，清除 token 並重定向
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    }
    
    return Promise.reject(error);
  }
); 