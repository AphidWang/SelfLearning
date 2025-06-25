import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 調試環境變數
console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');

// 使用 service role key 以獲得完整權限
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface ServerUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color?: string;
  role: 'student' | 'teacher' | 'mentor' | 'parent' | 'admin';
  created_at: string;
  updated_at: string;
}

export const userService = {
  // 獲取所有用戶 (使用 auth.users)
  async getUsers(): Promise<ServerUser[]> {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    
    return (data.users || []).map(user => ({
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      email: user.email || '',
      avatar: user.user_metadata?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}&backgroundColor=ffd5dc`,
      color: user.user_metadata?.color || '#FF6B6B',
      role: user.user_metadata?.role || 'student',
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at
    }));
  },

  // 根據 ID 獲取用戶
  async getUserById(id: string): Promise<ServerUser | null> {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);

    if (error) return null;

    if (!data.user) return null;

    const user = data.user;
    return {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      email: user.email || '',
      avatar: user.user_metadata?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}&backgroundColor=ffd5dc`,
      color: user.user_metadata?.color || '#FF6B6B',
      role: user.user_metadata?.role || 'student',
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
    const { role, name, avatar, color } = updates;
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: {
        role,
        name,
        avatar,
        color
      }
    });

    if (error) throw new Error(`Failed to update user: ${error.message}`);

    const user = data.user;
    return {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      email: user.email || '',
      avatar: user.user_metadata?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}&backgroundColor=ffd5dc`,
      color: user.user_metadata?.color || '#FF6B6B',
      role: user.user_metadata?.role || 'student',
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
    return allUsers.filter(user => user.role === role);
  }
}; 