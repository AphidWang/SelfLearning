import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import { UserAvatar } from '../learning-map/UserAvatar';
import type { User } from '@self-learning/types';
import { 
  Edit3, Trash2, Mail, MoreVertical, 
  AlertTriangle, Key, GraduationCap, Crown, Heart, Shield, Settings, Check, X
} from 'lucide-react';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
}

// 角色配置
const roleConfig = {
  student: { 
    label: '學生', 
    icon: GraduationCap, 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30', 
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-700'
  },
  mentor: { 
    label: '導師', 
    icon: Crown, 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30', 
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-700'
  },
  parent: { 
    label: '家長', 
    icon: Heart, 
    bgColor: 'bg-pink-100 dark:bg-pink-900/30', 
    textColor: 'text-pink-700 dark:text-pink-300',
    borderColor: 'border-pink-200 dark:border-pink-700'
  },
  admin: { 
    label: '管理員', 
    icon: Shield, 
    bgColor: 'bg-red-100 dark:bg-red-900/30', 
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-700'
  }
};

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onEdit, 
  onResetPassword
}) => {
  const { deleteUser, updateUser, loading } = useUserStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRoleEdit, setShowRoleEdit] = useState(false);
  const [updatingRoles, setUpdatingRoles] = useState(false);

  // 獲取用戶的所有角色（支援新舊格式）
  const userRoles = user.roles || (user.role ? [user.role] : ['student']);
  
  // 臨時角色狀態（用於編輯時的暫存）
  const [tempRoles, setTempRoles] = useState<string[]>(userRoles);

  const handleDelete = async () => {
    try {
      await deleteUser(user.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // 處理角色選擇（不立即提交）
  const handleRoleToggle = (role: 'student' | 'mentor' | 'parent' | 'admin') => {
    setTempRoles(current => {
      const isSelected = current.includes(role);
      
      let newRoles: string[];
      if (isSelected) {
        // 取消選擇，但至少要有一個角色
        newRoles = current.filter(r => r !== role);
        if (newRoles.length === 0) {
          newRoles = ['student']; // 預設保留學生角色
        }
      } else {
        // 添加角色
        newRoles = [...current, role];
      }
      
      return newRoles;
    });
  };

  // 確認角色更新
  const handleConfirmRoleUpdate = async () => {
    if (updatingRoles) return;

    setUpdatingRoles(true);
    try {
      // 更新用戶角色
      await updateUser(user.id, {
        roles: tempRoles as User['roles'],
        role: tempRoles[0] as User['role'] // 向後兼容，設置主要角色
      });
      
      setShowRoleEdit(false);
    } catch (error) {
      console.error('Failed to update user roles:', error);
      // 發生錯誤時重置臨時狀態
      setTempRoles(userRoles);
    } finally {
      setUpdatingRoles(false);
    }
  };

  // 取消角色編輯
  const handleCancelRoleEdit = () => {
    setTempRoles(userRoles); // 重置為原始角色
    setShowRoleEdit(false);
  };

  // 打開角色編輯時重置臨時狀態
  const handleOpenRoleEdit = () => {
    setTempRoles(userRoles);
    setShowRoleEdit(true);
  };

  // 檢查是否有變更
  const hasRoleChanges = JSON.stringify(tempRoles.sort()) !== JSON.stringify(userRoles.sort());

  return (
    <motion.div
      className="relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
      whileHover={{ y: -2 }}
    >
      {/* 用戶信息 */}
      <div className="flex items-start gap-3 mb-3">
        <UserAvatar user={user} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-800 dark:text-white truncate">
              {user.name}
            </h3>
            <button
              onClick={() => onEdit(user)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors flex-shrink-0"
              title="編輯用戶資料"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          {user.email && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 truncate">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
        </div>
        
        {/* 刪除按鈕 */}
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
              className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 w-24"
            >
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

      {/* 多角色標籤顯示 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {userRoles.map((role, index) => {
          const config = roleConfig[role as keyof typeof roleConfig];
          if (!config) return null;
          
          const Icon = config.icon;
          const isPrimary = index === 0;
          
          return (
            <div
              key={role}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${
                role === 'admin' ? 'ring-2 ring-offset-1 ring-current ring-opacity-20' : ''
              }`}
              title={isPrimary ? `主要角色：${config.label}` : config.label}
            >
              <Icon className="w-3 h-3" />
              <span>{config.label}</span>
              {isPrimary && <span className="text-[8px] opacity-60">●</span>}
            </div>
          );
        })}
      </div>

      {/* 角色編輯區域 */}
      {showRoleEdit && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">角色設定</span>
            <button
              onClick={handleCancelRoleEdit}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            {Object.entries(roleConfig).map(([roleKey, config]) => {
              const role = roleKey as keyof typeof roleConfig;
              const Icon = config.icon;
              const isSelected = tempRoles.includes(role);
              
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleToggle(role)}
                  className={`flex items-center gap-2 p-2 text-xs border rounded-lg transition-colors ${
                    isSelected
                      ? `${config.bgColor} ${config.textColor} ${config.borderColor}`
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{config.label}</span>
                  {isSelected && (
                    <div className="ml-auto w-1.5 h-1.5 bg-current rounded-full opacity-60"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-2">
            <button
              onClick={handleCancelRoleEdit}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded transition-colors"
            >
              <X className="w-3 h-3" />
              取消
            </button>
            <button
              onClick={handleConfirmRoleUpdate}
              disabled={!hasRoleChanges || updatingRoles}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              {updatingRoles ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  更新中
                </>
              ) : (
                <>
                  <Check className="w-3 h-3" />
                  {hasRoleChanges ? '確認修改' : '無變更'}
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            選擇的第一個角色將作為主要角色
          </p>
        </motion.div>
      )}

      {/* 操作按鈕區域 */}
      <div className="flex gap-2">
        <button
          onClick={handleOpenRoleEdit}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
            showRoleEdit 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>角色設定</span>
        </button>
        <button
          onClick={() => onResetPassword(user)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-yellow-300 dark:border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg transition-colors"
        >
          <Key className="w-4 h-4" />
          <span>重置密碼</span>
        </button>
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