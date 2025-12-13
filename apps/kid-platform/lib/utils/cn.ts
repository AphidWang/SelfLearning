import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合併 className 的工具函數
 * 結合 clsx 和 tailwind-merge 的功能
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
