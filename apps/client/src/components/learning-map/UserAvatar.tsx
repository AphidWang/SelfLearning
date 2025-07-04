import React from 'react';
import type { User } from '@self-learning/types';

interface UserAvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const sizeClasses = {
  xs: 'w-12 h-12 text-xs',    // 32px - 小頭像
  sm: 'w-16 h-16 text-sm',  // 48px - 中頭像  
  md: 'w-20 h-20 text-base', // 64px - 大頭像
  lg: 'w-24 h-24 text-lg'   // 80px - 超大頭像
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'sm',
  showTooltip = true,
  className = '',
  onClick,
  style
}) => {
  const sizeClass = sizeClasses[size];
  
  const avatarContent = user.avatar || user.name.charAt(0).toUpperCase();
  const backgroundColor = user.color || generateColorFromName(user.name);
  
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-medium cursor-pointer transition-all hover:scale-110 shadow-sm border-2 border-white ${className}`}
      style={{ backgroundColor, ...style }}
      onClick={onClick}
      title={showTooltip ? user.name : undefined}
    >
      {user.avatar && user.avatar.startsWith('http') ? (
        <img 
          src={user.avatar} 
          alt={user.name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span className="text-white font-bold">
          {avatarContent}
        </span>
      )}
    </div>
  );
};

// 根據用戶名稱生成一致的顏色
function generateColorFromName(name: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#A569BD'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// 用戶頭像組
interface UserAvatarGroupProps {
  users: User[];
  maxDisplay?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onUserClick?: (user: User) => void;
  className?: string;
}

export const UserAvatarGroup: React.FC<UserAvatarGroupProps> = ({
  users,
  maxDisplay = 3,
  size = 'sm',
  onUserClick,
  className = ''
}) => {
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = Math.max(0, users.length - maxDisplay);
  
  return (
    <div className={`flex items-center -space-x-1 ${className}`}>
      {displayUsers.map((user, index) => (
        <UserAvatar
          key={user.id}
          user={user}
          size={size}
          onClick={() => onUserClick?.(user)}
          className="hover:z-10 relative"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-gray-400 text-white font-medium border-2 border-white`}
        >
          <span className="text-xs">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}; 