import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import { UserAvatar } from '../learning-map/UserAvatar';
import { AvatarSelectionDialog } from './AvatarSelectionDialog';
import type { User } from '../../types/goal';
import { 
  X, Save, User as UserIcon, Mail, Palette, Camera,
  Crown, GraduationCap, Users, Heart, Loader2 
} from 'lucide-react';

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  role: User['role'];
  color: string;
  avatar?: string;
}

const roleOptions = [
  { value: 'student', label: '學生', icon: GraduationCap, color: 'text-blue-600' },

  { value: 'mentor', label: '導師', icon: Crown, color: 'text-purple-600' },
  { value: 'parent', label: '家長', icon: Heart, color: 'text-pink-600' }
] as const;

const colorOptions = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#A569BD'
];

export const UserForm: React.FC<UserFormProps> = ({ user, onClose }) => {
  const { createAuthUser, updateUser, loading } = useUserStore();
  
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'student',
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

    if (!formData.role) {
      newErrors.role = '請選擇角色';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (user) {
        // 編輯模式
        await updateUser(user.id, formData);
      } else {
        // 新增模式 - 需要提供密碼用於創建認證用戶
        await createAuthUser({
          ...formData,
          password: 'TempPassword123!' // 臨時密碼，實際應該由管理員設定
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save user:', error);
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

  const generateAvatar = () => {
    const seed = formData.name.toLowerCase().replace(/\s+/g, '');
    const bgColor = formData.color.replace('#', '');
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${bgColor}`;
    setFormData(prev => ({ ...prev, avatar }));
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

  // 預覽用戶
  const previewUser: User = {
    id: user?.id || 'preview',
    name: formData.name || '預覽',
    email: formData.email,
    role: formData.role,
    color: formData.color,
    avatar: formData.avatar
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {user ? '編輯用戶' : '新增用戶'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user ? '修改用戶資訊' : '建立新的用戶帳號'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* 姓名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              信箱 *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="請輸入信箱"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* 角色 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              角色 *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.role === option.value;
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('role', option.value)}
                    className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? option.color : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* 顏色選擇 */}
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

          {/* 頭像選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              頭像
            </label>
            
            <div className="flex items-center gap-3">
              {/* 當前頭像預覽 */}
              <div className="relative">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="選擇的頭像"
                    className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                    <Camera className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* 按鈕區域 */}
              <div className="flex-1">
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setShowAvatarDialog(true)}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    選擇頭像
                  </button>
                  <button
                    type="button"
                    onClick={generateAvatar}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <Palette className="w-4 h-4" />
                    自動生成
                  </button>
                </div>
                
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => handleInputChange('avatar', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                  placeholder="或輸入自訂頭像 URL"
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              點擊「選擇頭像」可選擇預設樣式和背景色
            </p>
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? '儲存中...' : (user ? '更新' : '新增')}
            </button>
          </div>
        </form>

        {/* Avatar Selection Dialog */}
        <AvatarSelectionDialog
          isOpen={showAvatarDialog}
          onClose={() => setShowAvatarDialog(false)}
          selectedAvatar={formData.avatar}
          selectedColor={formData.color?.replace('#', '') || 'ffd5dc'}
          onSelect={handleAvatarSelect}
        />
      </motion.div>
    </motion.div>
  );
}; 