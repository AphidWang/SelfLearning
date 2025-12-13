/**
 * CORS Middleware
 * 統一管理 CORS 設定，方便維護
 */

import cors from 'cors';

// 允許的來源列表
const allowedOrigins = [
  'http://self-learning.zeabur.app',
  'https://self-learning.zeabur.app',
  'http://selflearning.zeabur.app',
  'https://selflearning.zeabur.app',
  'http://localhost:5173',  // Legacy Client 開發環境
  'http://localhost:5174',  // New Platform 開發環境
];

// 從環境變數讀取額外的允許來源
const additionalOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [];

const allAllowedOrigins = [...allowedOrigins, ...additionalOrigins];

/**
 * CORS 設定
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // 允許沒有 origin 的請求（例如：Postman, curl, 同源請求）
    if (!origin) {
      return callback(null, true);
    }

    // 檢查是否在允許列表中
    if (allAllowedOrigins.some(allowedOrigin => {
      // 支援完整匹配和通配符匹配
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return origin === allowedOrigin || origin.startsWith(allowedOrigin);
    })) {
      callback(null, true);
    } else {
      console.warn(`[CORS] 拒絕來源: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};

/**
 * CORS Middleware
 */
export const corsMiddleware = cors(corsOptions);

