import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User as UserIcon, Mail, Edit3, Loader2, Lock, Eye, EyeOff, Crown, GraduationCap, Heart, Shield } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { UserAvatar } from '../learning-map/UserAvatar';
import { AvatarSelectionDialog } from './AvatarSelectionDialog';
import type { User } from '../../types/goal';
import { authService } from '../../services/auth';

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null; // 支援創建新用戶 (null = 創建模式)
  isAdminMode?: boolean; // 新增: 是否為管理員模式
}

interface FormData {
  name: string;
  email: string;
  roles?: User['roles']; // 改為多角色
  role?: User['role']; // 向後兼容
  password?: string;
  avatar?: string;
}

const roleOptions = [
  { value: 'student' as const, label: '學生', icon: GraduationCap, color: 'text-blue-600' },
  { value: 'mentor' as const, label: '導師', icon: Crown, color: 'text-purple-600' },
  { value: 'parent' as const, label: '家長', icon: Heart, color: 'text-pink-600' },
  { value: 'admin' as const, label: '管理員', icon: Shield, color: 'text-red-600' },
];

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  isOpen,
  onClose,
  user,
  isAdminMode = false
}) => {
  const { updateUser, createAuthUser, loading } = useUserStore();
  
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    roles: user?.roles || (user?.role ? [user.role] : ['student']), // 支援多角色
    role: user?.role || 'student', // 向後兼容
    password: '',
    avatar: user?.avatar || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const isCreateMode = !user;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '請輸入暱稱';
    }

    if (!formData.email.trim()) {
      newErrors.email = '請輸入信箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的信箱格式';
    }

    // 創建模式下密碼必填，編輯模式下可選
    if (isCreateMode) {
      if (!formData.password?.trim()) {
        newErrors.password = '請輸入密碼';
      } else if (formData.password.length < 6) {
        newErrors.password = '密碼至少需要 6 個字符';
      }
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = '密碼至少需要 6 個字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (isCreateMode) {
        // 創建新用戶 - 只能通過管理員 API
        await createAuthUser(formData as Required<FormData>);
      } else {
        // 更新用戶 - 根據模式使用不同的 API
        const updateData = { ...formData };
        if (!formData.password) {
          delete (updateData as any).password; // 不更新密碼
        }
        
        if (isAdminMode) {
          // 管理員模式：使用管理員 API
          await updateUser(user!.id, updateData);
        } else {
          // 普通用戶模式：直接使用 Supabase
          await authService.updateCurrentUser(updateData);
        }
      }
      onClose();
    } catch (error) {
      console.error(isCreateMode ? '創建用戶失敗:' : '更新用戶資料失敗:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleAvatarSelect = (avatar: string, color: string) => {
    setFormData(prev => ({ ...prev, avatar }));
  };

  // 處理角色多選
  const handleRoleToggle = (role: 'student' | 'mentor' | 'parent' | 'admin') => {
    setFormData(prev => {
      const currentRoles = prev.roles || [];
      const isSelected = currentRoles.includes(role);
      
      let newRoles: typeof currentRoles;
      if (isSelected) {
        // 取消選擇，但至少要有一個角色
        newRoles = currentRoles.filter(r => r !== role);
        if (newRoles.length === 0) {
          newRoles = ['student']; // 預設保留學生角色
        }
      } else {
        // 添加角色
        newRoles = [...currentRoles, role];
      }
      
      return {
        ...prev,
        roles: newRoles,
        role: newRoles[0] // 更新主要角色為第一個
      };
    });
  };

  // 預覽用戶
  const previewUser: User = {
    id: user?.id || 'preview',
    name: formData.name || '暱稱預覽',
    email: formData.email,
    roles: formData.roles || ['student'],
    role: formData.roles?.[0] || 'student', // 向後兼容
    color: user?.color || '#4ECDC4',
    avatar: formData.avatar
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isCreateMode ? '創建新用戶' : '個人資料'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isCreateMode ? '創建新的認證用戶帳號' : '編輯您的個人資訊'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
              {/* 頭像預覽和選擇 */}
              <div className="text-center">
                <div className="inline-block relative">
                  <UserAvatar user={previewUser} size="lg" className="mx-auto" />
                  <button
                    type="button"
                    onClick={() => setShowAvatarDialog(true)}
                    className="absolute -bottom-1 -right-1 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors"
                    title="更換頭像"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  點擊右下角按鈕更換頭像
                </p>
              </div>

              {/* 暱稱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  暱稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="請輸入暱稱"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

                            {/* 信箱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  信箱 {isCreateMode ? '*' : '(不可修改)'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isCreateMode}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isCreateMode 
                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white' 
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    } ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={isCreateMode ? "請輸入信箱" : "信箱不可修改"}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
                {!isCreateMode && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    信箱是帳號的唯一識別，無法修改
                  </p>
                )}
              </div>

              {/* 角色選擇 (僅在創建模式顯示) */}
              {isCreateMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    角色 * <span className="text-xs text-gray-500">(可多選)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {roleOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.roles?.includes(option.value) || false;
                      
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleRoleToggle(option.value)}
                          className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                            isSelected
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? option.color : 'text-gray-400'}`} />
                          <span className="text-sm font-medium">{option.label}</span>
                          {isSelected && (
                            <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    選擇的第一個角色將作為主要角色
                  </p>
                </div>
              )}

              {/* 密碼 (創建模式必填，編輯模式可選) */}
              {isCreateMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    密碼 *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password || ''}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                        errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="請輸入密碼"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              )}

              </form>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                              <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? (isCreateMode ? '創建中...' : '儲存中...') : (isCreateMode ? '創建' : '儲存')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Avatar Selection Dialog */}
      <AvatarSelectionDialog
        isOpen={showAvatarDialog}
        onClose={() => setShowAvatarDialog(false)}
        selectedAvatar={formData.avatar}
        selectedColor={user?.color?.replace('#', '') || 'ffd5dc'}
        onSelect={handleAvatarSelect}
      />
    </>
  );
}; 