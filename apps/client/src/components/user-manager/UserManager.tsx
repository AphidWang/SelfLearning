import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import { UserCard, UserProfileDialog, PasswordResetDialog } from './index';
import type { User } from '@self-learning/types';
import { 
  Search, Filter, Loader2, 
  UserPlus, Users
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
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);


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



  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowProfileDialog(true);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowCreateDialog(true);
  };

  const handleCloseProfileDialog = () => {
    setShowProfileDialog(false);
    setEditingUser(null);
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    setEditingUser(null);
  };

  const handleCreateSuccess = (user: User) => {
    // 重新載入用戶列表
    getUsers();
  };

  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setShowPasswordResetDialog(true);
  };

  const handleClosePasswordResetDialog = () => {
    setShowPasswordResetDialog(false);
    setResetPasswordUser(null);
  };





  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>




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

          {/* 創建用戶按鈕 */}
          <button
            onClick={handleCreateUser}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            創建用戶
          </button>
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
                  <UserCard
                    user={user}
                    onEdit={handleEditUser}
                    onResetPassword={handleResetPassword}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 用戶表單 Modal */}
      <AnimatePresence>
        {showProfileDialog && editingUser && (
          <UserProfileDialog
            isOpen={showProfileDialog}
            user={editingUser}
            onClose={handleCloseProfileDialog}
            isAdminMode={true}
          />
        )}
        {showCreateDialog && (
          <UserProfileDialog
            isOpen={showCreateDialog}
            user={null}
            onClose={handleCloseCreateDialog}
            isAdminMode={true}
          />
        )}
        {showPasswordResetDialog && resetPasswordUser && (
          <PasswordResetDialog
            isOpen={showPasswordResetDialog}
            user={resetPasswordUser}
            onClose={handleClosePasswordResetDialog}
          />
        )}
      </AnimatePresence>
    </div>
  );
}; 