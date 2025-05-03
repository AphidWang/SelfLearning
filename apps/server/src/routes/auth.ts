import express from 'express';
import type { User, LoginCredentials } from '@self-learning/types';
import { generateToken } from '../utils/jwt';

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password }: LoginCredentials = req.body;
  
  // Demo 帳號處理
  if (email.includes('demo')) {
    const user: User = email.includes('student')
      ? {
          id: '1',
          name: 'Alex Student',
          role: 'student',
          avatar: 'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=150'
        }
      : {
          id: '2',
          name: 'Sam Mentor',
          role: 'mentor',
          avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150'
        };
    
    const token = generateToken(user);
    return res.json({ user, token });
  }

  // TODO: 實作真正的登入邏輯
  res.status(401).json({ message: '無效的帳號或密碼' });
});

router.post('/logout', (req, res) => {
  // 在這裡可以添加 token 黑名單等邏輯
  res.json({ message: '登出成功' });
});

export default router; 