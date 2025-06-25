import { Router } from 'express';
import chatRouter from './chat';
import userRouter from './users';
import authRouter from './auth';

const router = Router();

router.use('/api', chatRouter);
router.use('/api/users', userRouter);
router.use('/api/auth', authRouter);

export default router; 