import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User as UserIcon, Mail, Lock, Eye, EyeOff, Shield, GraduationCap, Users, Heart, Crown } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { AvatarSelectionDialog } from './AvatarSelectionDialog';
import type { User } from '../../types/goal';

interface CreateUserFormProps {
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: User['role'];
  color: string;
  avatar?: string;
}

const roleOptions = [
  { value: 'student' as const, label: '學生', icon: GraduationCap, color: 'text-blue-600' },

  { value: 'mentor' as const, label: '導師', icon: Crown, color: 'text-purple-600' },
  { value: 'parent' as const, label: '家長', icon: Heart, color: 'text-pink-600' },
  { value: 'admin' as const, label: '管理員', icon: Shield, color: 'text-red-600' },
];

const colorOptions = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#A569BD'
];

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onClose, onSuccess }) => {
  const { createAuthUser } = useUserStore();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: 'student',
    color: colorOptions[0] || '#FF6B6B' // 確保有有效的預設顏色
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '請輸入姓名';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '請輸入信箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的信箱格式';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = '請輸入密碼';
    } else if (formData.password.length < 6) {
      newErrors.password = '密碼至少需要 6 個字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const newUser = await createAuthUser(formData);
      if (onSuccess) {
        onSuccess(newUser);
      }
      onClose();
    } catch (error) {
      console.error('創建用戶失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    // 如果是顏色欄位，確保值在 colorOptions 中
    if (field === 'color' && !colorOptions.includes(value)) {
      console.warn(`無效的顏色值: ${value}，使用預設顏色`);
      value = colorOptions[0] || '#FF6B6B';
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
    let finalColor = formData.color; // 保持當前顏色作為預設
    
    if (bgColorMatch) {
      const bgColor = `#${bgColorMatch[1].replace(/^#/, '').toUpperCase()}`;
      // 檢查提取的顏色是否在 colorOptions 中
      if (colorOptions.includes(bgColor)) {
        finalColor = bgColor;
      }
      // 如果不在 colorOptions 中，保持當前的顏色不變
    }
    
    setFormData(prev => ({ ...prev, avatar, color: finalColor }));
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
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <UserIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                創建新用戶
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                創建新的認證用戶帳號
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 姓名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="請輸入用戶顯示名稱"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* 信箱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="請輸入信箱"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* 密碼 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${
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
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? option.color : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
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
            
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="選擇的頭像"
                    className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAvatarDialog(true)}
                  className="px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg transition-colors text-sm"
                >
                  選擇頭像
                </button>
                <button
                  type="button"
                  onClick={generateAvatar}
                  className="px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors text-sm"
                >
                  自動生成
                </button>
              </div>
            </div>

            <AvatarSelectionDialog
              isOpen={showAvatarDialog}
              onClose={() => setShowAvatarDialog(false)}
              selectedAvatar={formData.avatar}
              selectedColor={formData.color?.replace('#', '') || 'ffd5dc'}
              onSelect={handleAvatarSelect}
            />
          </div>

          {/* 提交按鈕 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  創建中...
                </>
              ) : (
                '創建用戶'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}; 