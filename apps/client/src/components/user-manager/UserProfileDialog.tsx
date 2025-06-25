import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User as UserIcon, Mail, Palette, Edit3, Loader2 } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { UserAvatar } from '../learning-map/UserAvatar';
import { AvatarSelectionDialog } from './AvatarSelectionDialog';
import type { User } from '../../types/goal';

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

interface FormData {
  name: string;
  email: string;
  color: string;
  avatar?: string;
}

const colorOptions = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#A569BD'
];

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const { updateUser, loading } = useUserStore();
  
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    color: user?.color || colorOptions[0],
    avatar: user?.avatar || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名';
    }

    if (!formData.email.trim()) {
      newErrors.email = '請輸入信箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的信箱格式';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await updateUser(user.id, formData);
      onClose();
    } catch (error) {
      console.error('更新用戶資料失敗:', error);
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
    // 從頭像 URL 中提取背景色，並轉換為 hex
    const bgColorMatch = avatar.match(/backgroundColor=([^&]+)/);
    if (bgColorMatch) {
      const bgColor = `#${bgColorMatch[1].replace(/^#/, '').toUpperCase()}`;
      setFormData(prev => ({ ...prev, avatar, color: bgColor }));
    } else {
      setFormData(prev => ({ ...prev, avatar }));
    }
  };

  const generateAvatar = () => {
    const seed = formData.name.toLowerCase().replace(/\s+/g, '');
    const bgColor = formData.color.replace('#', '');
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${bgColor}`;
    setFormData(prev => ({ ...prev, avatar }));
  };

  // 預覽用戶
  const previewUser: User = {
    ...user,
    name: formData.name || '預覽',
    email: formData.email,
    color: formData.color,
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
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
                    個人資料
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    編輯您的個人資訊
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-160px)]">
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

              {/* 姓名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  姓名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="請輸入姓名"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* 信箱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  信箱 *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="請輸入信箱"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* 代表顏色 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  代表顏色
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleInputChange('color', color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        formData.color === color ? 'border-gray-800 dark:border-white scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* 快速生成頭像 */}
              <div>
                <button
                  type="button"
                  onClick={generateAvatar}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
                >
                  <Palette className="w-4 h-4" />
                  根據姓名和顏色自動生成頭像
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? '儲存中...' : '儲存'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Avatar Selection Dialog */}
      <AvatarSelectionDialog
        isOpen={showAvatarDialog}
        onClose={() => setShowAvatarDialog(false)}
        selectedAvatar={formData.avatar}
        selectedColor={formData.color?.replace('#', '') || 'ffd5dc'}
        onSelect={handleAvatarSelect}
      />
    </>
  );
}; 