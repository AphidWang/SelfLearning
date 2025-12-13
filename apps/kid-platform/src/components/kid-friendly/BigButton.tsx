/**
 * BigButton - 針對小朋友優化的按鈕元件
 * - 最小 48x48px 觸控區域
 * - 鮮豔的顏色
 * - 大尺寸文字
 * - 明顯的視覺反饋
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { LucideIcon } from 'lucide-react';

interface BigButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  colorful?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white',
  secondary: 'bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-white',
  success: 'bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white',
  danger: 'bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white',
};

const sizeClasses = {
  sm: 'min-h-[48px] px-4 py-2 text-base',
  md: 'min-h-[52px] px-6 py-3 text-lg',
  lg: 'min-h-[56px] px-8 py-4 text-xl',
  xl: 'min-h-[64px] px-10 py-5 text-2xl',
};

export const BigButton: React.FC<BigButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  colorful = true,
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'rounded-xl font-semibold',
        'transition-all duration-200',
        'transform hover:scale-105 active:scale-95',
        'shadow-lg hover:shadow-xl',
        'focus:outline-none focus:ring-4 focus:ring-offset-2',
        colorful ? variantClasses[variant] : 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed transform-none',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
    </button>
  );
};

