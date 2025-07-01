/**
 * 用戶管理 API 路由
 * 
 * 架構設計：
 * - 此檔案只用於管理員功能（管理其他用戶）
 * - 需要特殊權限檢查和認證
 * - 普通用戶操作（獲取/更新自己的資料）應直接使用前端 Supabase client
 * 
 * 安全考量：
 * - 所有路由都需要 authenticateSupabaseToken 中間件
 * - 管理員操作會有額外的權限檢查
 */

import express, { Request, Response } from 'express';
import { userService, supabaseAdmin } from '../services/supabase';
import { authenticateSupabaseToken, requireAdmin } from './auth';

const router = express.Router();

// 臨時測試路由 - 檢查系統狀態（不需要認證）
router.get('/debug/status', async (req: Request, res: Response) => {
  try {
    // 檢查能否連接到 Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      return res.json({
        status: 'error',
        message: error.message,
        hasUsers: false
      });
    }
    
    const users = data.users || [];
    res.json({
      status: 'success',
      hasUsers: users.length > 0,
      userCount: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.user_metadata?.role || 'student',
        name: u.user_metadata?.name || 'Unknown',
        avatar: u.user_metadata?.avatar || 'No avatar',
        color: u.user_metadata?.color || 'No color',
        user_metadata: u.user_metadata, // 顯示完整的 metadata
        created_at: u.created_at
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      hasUsers: false
    });
  }
});

// 需要管理員權限的中間件
const adminAuthMiddleware = [authenticateSupabaseToken, requireAdmin];

// 獲取所有用戶
router.get('/', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message || '獲取用戶失敗' });
  }
});

// 根據 ID 獲取用戶
router.get('/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '用戶未找到' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || '獲取用戶失敗' });
  }
});

// 新增用戶
router.post('/', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, email, roles, role, avatar, color } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: '名稱和信箱為必填' });
    }

    const userData = {
      name,
      email,
      roles: roles || (role ? [role] : ['student']), // 支援多角色
      role: role || 'student', // 向後兼容
      avatar,
      color
    };

    const newUser = await userService.createUser(userData);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message || '新增用戶失敗' });
  }
});

// 更新用戶
router.put('/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    const updatedUser = await userService.updateUser(userId, updates);
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message || '更新用戶失敗' });
  }
});

// 刪除用戶（軟刪除）
router.delete('/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ message: '用戶已刪除（軟刪除）' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || '刪除用戶失敗' });
  }
});

// 停用用戶
router.put('/:id/ban', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { banUntil } = req.body; // 可選：停用到某個時間點
    
    const banDate = banUntil ? new Date(banUntil) : undefined;
    await userService.banUser(userId, banDate);
    
    res.json({ 
      message: banDate ? `用戶已停用至 ${banDate.toISOString()}` : '用戶已永久停用' 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || '停用用戶失敗' });
  }
});

// 恢復用戶
router.put('/:id/unban', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    await userService.unbanUser(req.params.id);
    res.json({ message: '用戶已恢復' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || '恢復用戶失敗' });
  }
});

// 搜尋用戶
router.get('/search/:query', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const query = req.params.query;
    const users = await userService.searchUsers(query);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message || '搜尋用戶失敗' });
  }
});

// 根據角色獲取用戶
router.get('/role/:role', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const role = req.params.role;
    const users = await userService.getUsersByRole(role);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message || '獲取用戶失敗' });
  }
});

// 創建認證用戶（包含 Supabase Auth 和資料庫記錄）
// 如果系統中沒有任何用戶，則允許無認證創建第一個 admin 用戶
router.post('/create-auth-user', async (req: Request, res: Response) => {
  try {
    const { email, password, name, roles, role, avatar, color } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ message: '信箱、密碼和姓名為必填' });
    }

    // 檢查系統中是否已有用戶
    const existingUsers = await userService.getUsers();
    const hasUsers = existingUsers.length > 0;
    
    // 如果系統中已有用戶，則需要認證
    if (hasUsers) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: '系統已有用戶，需要提供認證 token' });
      }

      try {
        // 驗證 token
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
          return res.status(401).json({ message: '無效的 token' });
        }
        
        // 檢查當前用戶是否有權限創建新用戶（可以之後加更嚴格的權限檢查）
        (req as any).user = user;
      } catch (error) {
        return res.status(401).json({ message: 'Token 驗證失敗' });
      }
    } else {
      console.log('系統中沒有用戶，允許創建第一個用戶');
    }

    // 在 Supabase Auth 中創建用戶（包含所有 metadata）
    const userRoles = roles || (role ? [role] : ['student']);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        roles: userRoles,
        role: userRoles[0], // 向後兼容
        avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}&backgroundColor=ffd5dc`,
        color: color || '#FF6B6B'
      },
      email_confirm: true // 自動確認郵件
    });

    if (authError || !authData.user) {
      return res.status(400).json({ message: authError?.message || '創建認證用戶失敗' });
    }

    // 轉換為我們的用戶格式
    const newUser = {
      id: authData.user.id,
      name,
      email,
      roles: userRoles,
      role: userRoles[0], // 向後兼容
      avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}&backgroundColor=ffd5dc`,
      color: color || '#FF6B6B',
      created_at: authData.user.created_at,
      updated_at: authData.user.updated_at || authData.user.created_at
    };
    
    res.status(201).json({
      message: hasUsers ? '用戶創建成功' : '第一個管理員用戶創建成功',
      user: newUser,
      authId: authData.user.id,
      isFirstUser: !hasUsers
    });
  } catch (error: any) {
    console.error('創建用戶錯誤:', error);
    res.status(500).json({ message: error.message || '創建用戶失敗' });
  }
});

// 更新用戶角色（包含 Supabase Auth metadata）
router.put('/:id/role', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { roles, role } = req.body;
    
    if (!roles && !role) {
      return res.status(400).json({ message: '角色為必填' });
    }

    // 支援多角色更新
    const updateData: any = {};
    if (roles) {
      updateData.roles = roles;
      updateData.role = roles[0]; // 向後兼容
    } else if (role) {
      updateData.role = role;
      updateData.roles = [role]; // 向前兼容
    }

    // 1. 更新資料庫中的角色
    const updatedUser = await userService.updateUser(userId, updateData);

    // 2. 更新 Supabase Auth 的 user_metadata
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: updateData
      }
    );

    if (metadataError) {
      console.warn('Failed to update user metadata:', metadataError.message);
      // 不拋出錯誤，因為資料庫已經更新了
    }

    res.json({
      message: '角色更新成功',
      user: updatedUser
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || '更新角色失敗' });
  }
});

// 重置用戶密碼
router.put('/:id/password', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: '新密碼為必填' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密碼至少需要 6 個字符' });
    }

    // 使用 Supabase Admin 更新用戶密碼
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password
    });

    if (error) {
      return res.status(400).json({ message: error.message || '重置密碼失敗' });
    }

    res.json({
      message: '密碼重置成功',
      userId: data.user.id
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || '重置密碼失敗' });
  }
});

// 獲取可用頭像列表
router.get('/avatars/list', adminAuthMiddleware, (req: Request, res: Response) => {
  const avatars = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=alex&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=sam&backgroundColor=e0f2fe',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=jamie&backgroundColor=fff3e0',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=taylor&backgroundColor=f3e5f5',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=casey&backgroundColor=fff8e1',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=jordan&backgroundColor=e8f5e8',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=riley&backgroundColor=fce4ec',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=sage&backgroundColor=e3f2fd',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=rowan&backgroundColor=fffde7',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=river&backgroundColor=f1f8e9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=nova&backgroundColor=fef7ff',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=eden&backgroundColor=e0f7fa',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=sky&backgroundColor=fff9c4',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=forest&backgroundColor=e8f5e8',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=ocean&backgroundColor=e1f5fe',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=moon&backgroundColor=f3e5f5',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=star&backgroundColor=fff8e1',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=sun&backgroundColor=fff3e0',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=cloud&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=rain&backgroundColor=e0f2fe'
  ];
  
  res.json(avatars);
});

// 臨時路由 - 修復現有用戶的 metadata（不需要認證）
router.post('/debug/fix-metadata/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { name, role, avatar, color } = req.body;
    
    // 更新用戶的 metadata
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        name: name || 'User',
        role: role || 'student',
        avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}&backgroundColor=ffd5dc`,
        color: color || '#FF6B6B',
        email_verified: true
      }
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({
      message: 'Metadata 更新成功',
      user: {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || '更新失敗' });
  }
});

export default router; 