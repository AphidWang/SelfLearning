import { Router } from 'express';
import chatRouter from './chat';
import userRouter from './users';
import authRouter from './auth';
import reportRouter from './report';
import courseSchedulerRouter from './courseScheduler';

const router = Router();

router.use('/api', chatRouter);
router.use('/api/users', userRouter);
router.use('/api/auth', authRouter);
router.use('/api', reportRouter);
router.use('/api/course-scheduler', courseSchedulerRouter);

export default router; 