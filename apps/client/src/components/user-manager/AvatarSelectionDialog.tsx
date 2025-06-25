import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette, Shuffle } from 'lucide-react';

interface AvatarSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAvatar?: string;
  selectedColor?: string;
  onSelect: (avatar: string, color: string) => void;
}

const avatarSeeds = [
  'xiaoming', 'xiaomei', 'teacher', 'lixue', 'papa', 'maya', 'alex', 'sam', 
  'jordan', 'robin', 'casey', 'taylor', 'morgan', 'riley', 'jamie', 'avery',
  'drew', 'quinn', 'sage', 'river', 'nova', 'eden', 'sky', 'forest', 'ocean',
  'moon', 'star', 'sun', 'cloud', 'rain', 'wind', 'fire', 'earth', 'space'
];

const backgroundColors = [
  { name: '粉紅', value: 'ffd5dc', hex: '#FFD5DC' },
  { name: '淺藍', value: 'e0f2fe', hex: '#E0F2FE' },
  { name: '淺橙', value: 'fff3e0', hex: '#FFF3E0' },
  { name: '淺紫', value: 'f3e5f5', hex: '#F3E5F5' },
  { name: '淺黃', value: 'fff8e1', hex: '#FFF8E1' },
  { name: '淺綠', value: 'e8f5e8', hex: '#E8F5E8' },
  { name: '淺桃', value: 'fce4ec', hex: '#FCE4EC' },
  { name: '淺天藍', value: 'e3f2fd', hex: '#E3F2FD' },
  { name: '淺檸檬', value: 'fffde7', hex: '#FFFDE7' },
  { name: '淺薄荷', value: 'f1f8e9', hex: '#F1F8E9' },
  { name: '淺紫羅蘭', value: 'fef7ff', hex: '#FEF7FF' },
  { name: '淺青', value: 'e0f7fa', hex: '#E0F7FA' }
];

export const AvatarSelectionDialog: React.FC<AvatarSelectionDialogProps> = ({
  isOpen,
  onClose,
  selectedAvatar,
  selectedColor = 'ffd5dc',
  onSelect
}) => {
  const [currentColor, setCurrentColor] = useState(selectedColor);
  const [currentAvatar, setCurrentAvatar] = useState(selectedAvatar || '');
  const [avatars, setAvatars] = useState<string[]>([]);

  useEffect(() => {
    // 生成頭像 URL
    const generatedAvatars = avatarSeeds.map(seed => 
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${currentColor}`
    );
    setAvatars(generatedAvatars);
  }, [currentColor]);

  const handleColorChange = (colorValue: string) => {
    setCurrentColor(colorValue);
    // 如果已選擇頭像，更新其背景色
    if (currentAvatar) {
      const seed = extractSeedFromUrl(currentAvatar);
      if (seed) {
        const newAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${colorValue}`;
        setCurrentAvatar(newAvatar);
      }
    }
  };

  const handleAvatarSelect = (avatar: string) => {
    setCurrentAvatar(avatar);
  };

  const handleConfirm = () => {
    if (currentAvatar) {
      onSelect(currentAvatar, currentColor);
      onClose();
    }
  };

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const randomColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${randomSeed}&backgroundColor=${randomColor.value}`;
    setCurrentAvatar(avatar);
    setCurrentColor(randomColor.value);
  };

  const extractSeedFromUrl = (url: string): string | null => {
    const match = url.match(/seed=([^&]+)/);
    return match ? match[1] : null;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  選擇頭像
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  先選背景色，再選擇喜歡的頭像
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

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
            {/* 當前選擇預覽 */}
            {currentAvatar && (
              <div className="flex items-center justify-center mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <img
                  src={currentAvatar}
                  alt="預覽頭像"
                  className="w-20 h-20 rounded-full border-2 border-white shadow-lg"
                />
              </div>
            )}

            {/* 背景色選擇 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  背景顏色
                </h3>
                <button
                  onClick={generateRandomAvatar}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <Shuffle className="w-3 h-3" />
                  隨機
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {backgroundColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={`relative w-full h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                      currentColor === color.value 
                        ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' 
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {currentColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-4 h-4 text-gray-700" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 頭像選擇 */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                選擇頭像
              </h3>
              <div className="grid grid-cols-6 gap-3">
                {avatars.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`relative w-full h-16 rounded-lg border-2 overflow-hidden transition-all hover:scale-105 ${
                      currentAvatar === avatar 
                        ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={`頭像 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {currentAvatar === avatar && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!currentAvatar}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              確認選擇
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 