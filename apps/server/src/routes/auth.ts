import express from 'express';
import { supabaseAdmin } from '../services/supabase';

const router = express.Router();

// 驗證 Supabase token 的中間件
const authenticateSupabaseToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供 token' });
  }

  try {
    // 使用 Supabase 驗證 token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: '無效的 token' });
    }

    // 將用戶信息添加到 req 中
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token 驗證失敗' });
  }
};

// 檢查管理員權限的中間件
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: '未認證' });
  }

  try {
    // 從 user_metadata 獲取用戶角色
    const role = user.user_metadata?.role || 'student';

    if (role !== 'admin') {
      return res.status(403).json({ message: '需要管理員權限' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: '權限檢查失敗' });
  }
};

// 獲取當前用戶信息
router.get('/me', authenticateSupabaseToken, async (req, res) => {
  try {
    const supabaseUser = (req as any).user;
    
    // 從 user_metadata 獲取用戶資料
    const userData = {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email,
      avatar: supabaseUser.user_metadata?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${supabaseUser.id}&backgroundColor=ffd5dc`,
      color: supabaseUser.user_metadata?.color || '#FF6B6B',
      role: supabaseUser.user_metadata?.role || 'student'
    };

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: '獲取用戶信息失敗' });
  }
});

// 驗證 token 狀態的路由
router.get('/verify-token', authenticateSupabaseToken, (req, res) => {
  const user = (req as any).user;
  
  res.json({ 
    valid: true, 
    user: {
      id: user.id,
      email: user.email
    },
    message: 'Token 有效'
  });
});

export { authenticateSupabaseToken, requireAdmin };
export default router; 