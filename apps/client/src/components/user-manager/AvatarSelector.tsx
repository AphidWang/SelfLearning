import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface AvatarSelectorProps {
  selectedAvatar?: string;
  onAvatarSelect: (avatar: string) => void;
  onClose?: () => void;
  className?: string;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar,
  onAvatarSelect,
  onClose,
  className = ''
}) => {
  const [avatars, setAvatars] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // 預設頭像列表 (基於 topicStore 的 EXAMPLE_USERS)
  const defaultAvatars = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=xiaoming&backgroundColor=ffd5dc&clothing=hoodie',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=xiaomei&backgroundColor=e0f2fe&clothing=dress',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=teacher&backgroundColor=fff3e0&clothing=shirt&accessories=glasses',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=lixue&backgroundColor=f3e5f5&clothing=sweater',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=papa&backgroundColor=fff8e1&clothing=polo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=maya&backgroundColor=e8f5e8&clothing=hoodie',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=alex&backgroundColor=fff0f5&clothing=shirt',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=sam&backgroundColor=f0f8ff&clothing=dress',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=jordan&backgroundColor=fef7e0&clothing=sweater',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=robin&backgroundColor=f5f0ff&clothing=polo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=casey&backgroundColor=fff5f5&clothing=hoodie&accessories=glasses',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=taylor&backgroundColor=f0fff0&clothing=shirt',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=morgan&backgroundColor=fffacd&clothing=dress',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=riley&backgroundColor=f5fffa&clothing=sweater',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=jamie&backgroundColor=fff0f8&clothing=polo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=avery&backgroundColor=f0f0ff&clothing=hoodie',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=drew&backgroundColor=fffff0&clothing=shirt&accessories=glasses',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=quinn&backgroundColor=f8f8ff&clothing=dress',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=sage&backgroundColor=fff8dc&clothing=sweater',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=river&backgroundColor=f5f5dc&clothing=polo'
  ];

  useEffect(() => {
    // 先使用默認頭像
    setAvatars(defaultAvatars);
    setLoading(false);

    // 嘗試從 API 獲取頭像列表
    fetch('/api/users/avatars/list')
      .then(res => res.json())
      .then(data => {
        if (data.avatars && Array.isArray(data.avatars)) {
          setAvatars(data.avatars);
        }
      })
      .catch(error => {
        console.warn('Failed to fetch avatars from API, using defaults:', error);
      });
  }, []);

  const handleAvatarClick = (avatar: string) => {
    onAvatarSelect(avatar);
    if (onClose) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-300 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const visibleAvatars = isExpanded ? avatars : avatars.slice(0, 12);

  return (
    <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          選擇頭像
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-6 gap-2 mb-3">
        {visibleAvatars.map((avatar, index) => (
          <button
            key={index}
            onClick={() => handleAvatarClick(avatar)}
            className={`
              relative h-12 w-12 rounded-full border-2 overflow-hidden
              transition-all duration-200 hover:scale-105
              ${selectedAvatar === avatar 
                ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' 
                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
              }
            `}
          >
            <img
              src={avatar}
              alt={`Avatar ${index + 1}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                // 如果頭像載入失敗，使用預設樣式
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-purple-500');
                  parent.innerHTML = `<span class="text-white text-xs font-bold">${index + 1}</span>`;
                }
              }}
            />
            
            {selectedAvatar === avatar && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </button>
        ))}
      </div>

      {avatars.length > 12 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1 py-2 px-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              顯示較少
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              顯示更多 ({avatars.length - 12} 個)
            </>
          )}
        </button>
      )}
    </div>
  );
}; 