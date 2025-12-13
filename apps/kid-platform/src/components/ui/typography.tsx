/**
 * Typography 元件
 * 統一管理所有文字樣式
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

type TypographyTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
type TypographyVariant = 'title' | 'subtitle' | 'heading' | 'subheading' | 'caption' | 'link' | 'inherit';
type TypographySize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
type TypographyWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export interface TypographyProps {
  tag?: TypographyTag;
  variant?: TypographyVariant;
  size?: TypographySize;
  weight?: TypographyWeight;
  colorful?: boolean;
  className?: string;
  children: React.ReactNode;
}

const sizeClasses: Record<TypographySize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

const weightClasses: Record<TypographyWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const variantClasses: Record<TypographyVariant, string> = {
  title: 'text-gray-900',
  subtitle: 'text-gray-700',
  heading: 'text-gray-800',
  subheading: 'text-gray-600',
  caption: 'text-gray-500',
  link: 'text-blue-600 hover:text-blue-700 underline',
  inherit: '',
};

const colorfulClasses = 'bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent';

export const Typography: React.FC<TypographyProps> = ({
  tag = 'p',
  variant = 'inherit',
  size = 'base',
  weight = 'normal',
  colorful = false,
  className,
  children,
}) => {
  const Component = tag;

  const classes = cn(
    sizeClasses[size],
    weightClasses[weight],
    colorful ? colorfulClasses : variantClasses[variant],
    className
  );

  return <Component className={classes}>{children}</Component>;
};

