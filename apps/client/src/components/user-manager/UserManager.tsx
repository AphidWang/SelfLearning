import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import { UserCard, UserForm, CreateUserForm, ResetPasswordDialog } from './index';
import type { User } from '../../types/goal';
import { 
  Users, Search, Filter, Loader2, 
  UserPlus, Crown, GraduationCap, Heart, Settings 
} from 'lucide-react';

interface UserManagerProps {
  className?: string;
}

export const UserManager: React.FC<UserManagerProps> = ({ className = '' }) => {
  const {
    users,
    loading,
    error,
    getUsers,
    searchUsers,
    getUsersByRole,
    resetUserPassword,
    clearError
  } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<User['role'] | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(null);

  // 載入用戶數據
  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // 篩選用戶
  const filteredUsers = React.useMemo(() => {
    let result = users;
    
    // 角色篩選
    if (selectedRole) {
      result = getUsersByRole(selectedRole);
    }
    
    // 搜尋篩選
    if (searchQuery.trim()) {
      result = searchUsers(searchQuery);
    }
    
    return result;
  }, [users, selectedRole, searchQuery, getUsersByRole, searchUsers]);

  // 統計數據
  const stats = React.useMemo(() => {
    const studentCount = users.filter(u => u.role === 'student').length;
    const mentorCount = users.filter(u => u.role === 'mentor').length;
    const parentCount = users.filter(u => u.role === 'parent').length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    
    return {
      total: users.length,
      students: studentCount,
      mentors: mentorCount,
      parents: parentCount,
      admins: adminCount
    };
  }, [users]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleCreateUser = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleCreateSuccess = (user: User) => {
    // 重新載入用戶列表
    getUsers();
  };

  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setShowResetPasswordDialog(true);
  };

  const handleResetPasswordConfirm = async (userId: string, newPassword: string) => {
    await resetUserPassword(userId, newPassword);
    setShowResetPasswordDialog(false);
    setResetPasswordUser(null);
  };

  const handleCloseResetPasswordDialog = () => {
    setShowResetPasswordDialog(false);
    setResetPasswordUser(null);
  };

  // 更新用戶角色
  const handleUpdateRole = async (userId: string, newRole: User['role']) => {
    if (!newRole) return;
    
    setRoleUpdateLoading(userId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || '更新角色失敗');
      }

      // 重新載入用戶列表
      await getUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      alert(error.message || '更新角色失敗');
    } finally {
      setRoleUpdateLoading(null);
    }
  };

  const roleIcons = {
    student: GraduationCap,
    mentor: Crown,
    parent: Heart,
    admin: Settings
  };

  const roleLabels = {
    student: '學生',
    mentor: '導師',
    parent: '家長',
    admin: '管理員'
  };

  const roleColors = {
    student: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    mentor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    parent: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 標題區域 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">用戶管理</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">管理系統中的所有用戶</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            新增用戶
          </button>
          <button
            onClick={handleCreateUser}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            創建用戶
          </button>
        </div>
      </div>

      {/* 統計區域 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">總用戶</div>
          </div>
          
          {(['student', 'mentor', 'parent', 'admin'] as const).map((role) => {
            const Icon = roleIcons[role];
            const count = stats[role === 'student' ? 'students' : 
                              role === 'mentor' ? 'mentors' : 
                              role === 'parent' ? 'parents' : 'admins'];
            
            return (
              <div key={role} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-white">{count}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{roleLabels[role]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 搜尋和篩選區域 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜尋框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋用戶名稱或信箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>

          {/* 角色篩選 */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as User['role'] | '')}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="">所有角色</option>
              <option value="student">學生</option>
              <option value="mentor">導師</option>
              <option value="parent">家長</option>
              <option value="admin">管理員</option>
            </select>
          </div>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="p-4 mx-6 mt-4 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 用戶列表 */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">載入中...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || selectedRole ? '沒有找到符合條件的用戶' : '尚無用戶'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-shadow">
                    <UserCard
                      user={user}
                      onEdit={handleEditUser}
                      onResetPassword={handleResetPassword}
                      roleColor={roleColors[user.role || 'student']}
                      roleLabel={roleLabels[user.role || 'student']}
                    />
                    
                    {/* 角色切換下拉選單 */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        角色設定
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role || 'student'}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value as User['role'])}
                          disabled={roleUpdateLoading === user.id}
                          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white disabled:opacity-50"
                        >
                          <option value="student">學生</option>
                          <option value="mentor">導師</option>
                          <option value="parent">家長</option>
                          <option value="admin">管理員</option>
                        </select>
                        {roleUpdateLoading === user.id && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 用戶表單 Modal */}
      <AnimatePresence>
        {showForm && (
          <UserForm
            user={editingUser}
            onClose={handleCloseForm}
          />
        )}
        {showCreateForm && (
          <CreateUserForm
            onClose={handleCloseCreateForm}
            onSuccess={handleCreateSuccess}
          />
        )}
        {showResetPasswordDialog && resetPasswordUser && (
          <ResetPasswordDialog
            user={resetPasswordUser}
            onClose={handleCloseResetPasswordDialog}
            onConfirm={handleResetPasswordConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}; 