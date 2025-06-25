import dotenv from 'dotenv';

// 必須在所有其他 import 之前載入環境變數
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import chatRouter from './routes/chat';
import usersRouter from './routes/users';
import path from 'path';

export const app = express();
const port = process.env.PORT || 3000;

// CORS 設置必須在其他 middleware 之前
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

app.use(express.static(path.join(__dirname, '../../client/dist')));

// 確保所有路由都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}


