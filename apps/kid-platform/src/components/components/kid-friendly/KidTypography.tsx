/**
 * KidTypography - 針對小朋友優化的文字元件
 * - 更大的字體
 * - 高對比度
 * - 鮮豔顏色選項
 */

import React from 'react';
import { Typography, TypographyProps } from '@/components/ui/typography';
import { cn } from '@/lib/utils/cn';

interface KidTypographyProps extends Omit<TypographyProps, 'size' | 'colorful'> {
  size?: 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  colorful?: boolean;
}

const kidSizeMap: Record<NonNullable<KidTypographyProps['size']>, TypographyProps['size']> = {
  lg: 'lg',
  xl: 'xl',
  '2xl': '2xl',
  '3xl': '3xl',
  '4xl': '4xl',
};

export const KidTypography: React.FC<KidTypographyProps> = ({
  size = 'xl',
  colorful = true,
  weight = 'bold',
  className,
  ...props
}) => {
  return (
    <Typography
      size={kidSizeMap[size]}
      weight={weight}
      colorful={colorful}
      className={cn('leading-relaxed', className)}
      {...props}
    />
  );
};
