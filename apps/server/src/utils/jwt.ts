import jwt from 'jsonwebtoken';
import type { User } from '@self-learning/types';

const secret = process.env.JWT_SECRET || 'development-secret-key';

export const generateToken = (user: User): string => {
  return jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}; 