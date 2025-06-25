import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import { UserAvatar } from '../learning-map/UserAvatar';
import type { User } from '../../types/goal';
import { 
  Edit3, Trash2, Mail, MoreVertical, 
  AlertTriangle, Key, Lock
} from 'lucide-react';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  roleColor: string;
  roleLabel: string;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onEdit, 
  onResetPassword,
  roleColor, 
  roleLabel 
}) => {
  const { deleteUser, loading } = useUserStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteUser(user.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  return (
    <motion.div
      className="relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
      whileHover={{ y: -2 }}
    >
      {/* 用戶信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="md" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-800 dark:text-white">
              {user.name}
            </h3>
            {user.email && (
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Mail className="w-3 h-3" />
                {user.email}
              </div>
            )}
          </div>
        </div>
        
        {/* 操作選單 */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 w-36"
            >
              <button
                onClick={() => {
                  onEdit(user);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                編輯
              </button>
              <button
                onClick={() => {
                  onResetPassword(user);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
              >
                <Key className="w-3 h-3" />
                重置密碼
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                刪除
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* 角色標籤 */}
      <div className="flex justify-between items-center">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColor}`}>
          {roleLabel}
        </span>
        
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(user)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="編輯用戶"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 刪除確認 Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-white">確認刪除</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  此操作無法復原
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              您確定要刪除用戶 <strong>{user.name}</strong> 嗎？
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 點擊遮罩關閉選單 */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </motion.div>
  );
}; 