import express from 'express';
import type { User, LoginCredentials } from '@self-learning/types';
import { generateToken } from '../utils/jwt';

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password }: LoginCredentials = req.body;
  // TODO: 實作真正的登入邏輯
  const user = {
    id: '1',
    name: 'Test User',
    role: 'student' as const
  };
  
  const token = generateToken(user);
  res.json({ user, token });
});

export default router; 