/**
 * Supabase 後端服務 (Admin API)
 * 
 * 架構說明：
 * - 使用 Service Role Key 進行管理員級別操作
 * - 管理 auth.users 表中的用戶資料
 * - 用戶自定義資料儲存在 raw_user_meta_data (user_metadata) 中
 * - 支援用戶的 CRUD 操作和角色管理
 * 
 * 重要：不再使用自定義的 public.users 表
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 調試環境變數
console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');

// 使用 service role key 以獲得完整權限
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 伺服器端用戶資料介面
 * 對應 auth.users 表 + user_metadata 結構
 */
export interface ServerUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color?: string;
  roles: ('student' | 'teacher' | 'mentor' | 'parent' | 'admin')[]; // 改為複數陣列支援多角色
  created_at: string;
  updated_at: string;
  
  // 向後兼容：保留單角色屬性（已棄用）
  /** @deprecated 請使用 roles 陣列，此欄位僅為向後兼容 */
  role?: 'student' | 'teacher' | 'mentor' | 'parent' | 'admin';
}

export const userService = {
  // 獲取所有用戶 (使用 auth.users)
  async getUsers(): Promise<ServerUser[]> {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    
    return (data.users || []).map(user => {
      // 支援新的多角色系統，同時向後兼容單角色
      const roles = user.user_metadata?.roles || 
                   (user.user_metadata?.role ? [user.user_metadata.role] : ['student']);
      
      return {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
        email: user.email || '',
        avatar: user.user_metadata?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}&backgroundColor=ffd5dc`,
        color: user.user_metadata?.color || '#FF6B6B',
        roles: roles,
        role: roles[0], // 向後兼容：取第一個角色作為主要角色
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at
      };
    });
  },

  // 根據 ID 獲取用戶
  async getUserById(id: string): Promise<ServerUser | null> {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);

    if (error) return null;

    if (!data.user) return null;

    const user = data.user;
    // 支援新的多角色系統，同時向後兼容單角色
    const roles = user.user_metadata?.roles || 
                 (user.user_metadata?.role ? [user.user_metadata.role] : ['student']);
    
    return {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      email: user.email || '',
      avatar: user.user_metadata?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}&backgroundColor=ffd5dc`,
      color: user.user_metadata?.color || '#FF6B6B',
      roles: roles,
      role: roles[0], // 向後兼容：取第一個角色作為主要角色
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at
    };
  },

  // 新增用戶 (在 auth.users 中創建)
  async createUser(userData: Omit<ServerUser, 'id' | 'created_at' | 'updated_at'>): Promise<ServerUser> {
    // 這個方法不適用於直接創建 auth 用戶，應該使用 create-auth-user endpoint
    throw new Error('請使用 create-auth-user endpoint 來創建包含認證的用戶');
  },

  // 更新用戶 (更新 auth.users 的 user_metadata)
  async updateUser(id: string, updates: Partial<ServerUser>): Promise<ServerUser> {
    const { roles, role, name, avatar, color } = updates;
    
    // 支援新的多角色系統，同時向後兼容單角色
    const updateData: any = { name, avatar, color };
    
    if (roles) {
      updateData.roles = roles;
      updateData.role = roles[0]; // 向後兼容：設定主要角色
    } else if (role) {
      updateData.role = role;
      updateData.roles = [role]; // 向前兼容：將單角色轉為多角色
    }
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: updateData
    });

    if (error) throw new Error(`Failed to update user: ${error.message}`);

    const user = data.user;
    // 支援新的多角色系統，同時向後兼容單角色
    const userRoles = user.user_metadata?.roles || 
                     (user.user_metadata?.role ? [user.user_metadata.role] : ['student']);
    
    return {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      email: user.email || '',
      avatar: user.user_metadata?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}&backgroundColor=ffd5dc`,
      color: user.user_metadata?.color || '#FF6B6B',
      roles: userRoles,
      role: userRoles[0], // 向後兼容：取第一個角色作為主要角色
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at
    };
  },

  // 刪除用戶
  async deleteUser(id: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw new Error(`Failed to delete user: ${error.message}`);
  },

  // 搜尋用戶 (先獲取所有用戶再篩選)
  async searchUsers(query: string): Promise<ServerUser[]> {
    const allUsers = await this.getUsers();
    const lowerQuery = query.toLowerCase();
    
    return allUsers.filter(user => 
      user.name.toLowerCase().includes(lowerQuery) || 
      user.email.toLowerCase().includes(lowerQuery)
    );
  },

  // 根據角色獲取用戶 (先獲取所有用戶再篩選)
  async getUsersByRole(role: string): Promise<ServerUser[]> {
    const allUsers = await this.getUsers();
    return allUsers.filter(user => 
      user.roles.includes(role as any) || user.role === role // 支援多角色和單角色查詢
    );
  }
}; 