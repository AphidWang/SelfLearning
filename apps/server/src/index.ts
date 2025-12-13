import dotenv from 'dotenv';

// 必須在所有其他 import 之前載入環境變數
dotenv.config();

import express from 'express';
import authRouter from './routes/auth';
import chatRouter from './routes/chat';
import usersRouter from './routes/users';
import reportRouter from './routes/report';
import courseSchedulerRouter from './routes/courseScheduler';
import taiwaneseRouter from './routes/taiwanese';
import { corsMiddleware } from './middleware/cors';
import path from 'path';

// 主要 App（API + Legacy Client）- Port 5200
export const app = express();
const apiPort = process.env.PORT || 5200;

// CORS Middleware（必須在其他 middleware 之前）
app.use(corsMiddleware);

// Body parser middleware
app.use(express.json());

// 測試路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 添加一些日誌
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/users', usersRouter);
app.use('/api', reportRouter);
app.use('/api/course-scheduler', courseSchedulerRouter);
app.use('/api/taiwanese', taiwaneseRouter);

// Legacy Client 靜態檔案
app.use(express.static(path.join(__dirname, '../../client/dist')));

// 確保所有路由都返回 index.html（Legacy Client）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// New Platform App - Port 5174
const newPlatformApp = express();
const newPlatformPort = process.env.NEW_PLATFORM_PORT || 5174;

// CORS Middleware（必須在其他 middleware 之前）
newPlatformApp.use(corsMiddleware);

// New Platform 靜態檔案
newPlatformApp.use(express.static(path.join(__dirname, '../../kid-platform/dist')));

// 確保所有路由都返回 index.html（New Platform）
newPlatformApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../kid-platform/dist/index.html'));
});

// 啟動服務
if (process.env.NODE_ENV !== 'test') {
  // API + Legacy Client Server (Port 5200)
  app.listen(apiPort, () => {
    console.log(`🚀 API + Legacy Client Server running on port ${apiPort}`);
  });

  // New Platform Server (Port 5174)
  newPlatformApp.listen(newPlatformPort, () => {
    console.log(`🚀 New Platform Server running on port ${newPlatformPort}`);
  });
}


