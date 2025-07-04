/**
 * 圖片處理工具函數
 */

import type { ValidationResult, SupportedFormat } from './types';
import { ImageCapabilities } from './capabilities';

/**
 * 支援的圖片格式
 */
const SUPPORTED_FORMATS: SupportedFormat[] = [
  'image/jpeg',
  'image/png', 
  'image/heic',
  'image/heif',
  'image/webp',
  'image/gif'
];

/**
 * 最大檔案大小 (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * 預設最大尺寸限制 (4096 像素)
 */
const DEFAULT_MAX_DIMENSION = 4096;

/**
 * Supabase 最大尺寸限制 (2500 像素)
 */
const SUPABASE_MAX_DIMENSION = 2500;

/**
 * 驗證圖片檔案
 */
export async function validateImageFile(file: File): Promise<ValidationResult> {
  // 檢查檔案是否存在
  if (!file) {
    return {
      isValid: false,
      error: '請選擇一個圖片檔案',
      errorType: 'INVALID_FILE'
    };
  }

  // 檢查檔案類型
  if (!SUPPORTED_FORMATS.includes(file.type as SupportedFormat)) {
    return {
      isValid: false,
      error: `不支援的檔案格式：${file.type}。支援格式：JPEG, PNG, HEIC, WebP, GIF`,
      errorType: 'UNSUPPORTED_FORMAT'
    };
  }

  // 檢查檔案大小
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `檔案過大：${formatFileSize(file.size)}。最大支援 ${formatFileSize(MAX_FILE_SIZE)}`,
      errorType: 'FILE_TOO_LARGE'
    };
  }

  // 檢查瀏覽器對該格式的支援
  const isSupported = await ImageCapabilities.isFormatSupported(file.type);
  if (!isSupported) {
    return {
      isValid: false,
      error: `您的瀏覽器不支援 ${file.type} 格式的處理`,
      errorType: 'UNSUPPORTED_FORMAT'
    };
  }

  // 檢查圖片尺寸 (如果可以)
  try {
    const dimensions = await getImageDimensions(file);
    if (dimensions.width > 10000 || dimensions.height > 10000) {
      return {
        isValid: false,
        error: `圖片尺寸過大：${dimensions.width}x${dimensions.height}。建議不超過 10000x10000，推薦 4096x4096 以內`,
        errorType: 'DIMENSIONS_TOO_LARGE'
      };
    }
  } catch (error) {
    // 無法獲取尺寸時不阻止，可能是 HEIC 格式需要轉換才能讀取
    console.warn('無法獲取圖片尺寸，跳過尺寸檢查:', error);
  }

  return { isValid: true };
}

/**
 * 獲取圖片尺寸
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('無法載入圖片以獲取尺寸'));
    };
    
    img.src = url;
  });
}

/**
 * 計算縮放後的尺寸 (保持長寬比)
 */
export function calculateScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  maxSize: number = DEFAULT_MAX_DIMENSION
): { width: number; height: number; scale: number } {
  if (originalWidth <= maxSize && originalHeight <= maxSize) {
    return {
      width: originalWidth,
      height: originalHeight,
      scale: 1
    };
  }

  const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight);
  
  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
    scale
  };
}

/**
 * 格式化檔案大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 建立友善的錯誤訊息
 */
export function createFriendlyError(error: unknown, context?: string): Error {
  let message = '圖片處理失敗';
  
  if (error instanceof Error) {
    // 針對常見錯誤提供友善訊息
    if (error.message.includes('network') || error.message.includes('fetch')) {
      message = '網路連線問題，請檢查網路後重試';
    } else if (error.message.includes('memory') || error.message.includes('quota')) {
      message = '記憶體不足，請嘗試處理較小的圖片';
    } else if (error.message.includes('canvas') || error.message.includes('2d')) {
      message = '瀏覽器不支援圖片處理功能';
    } else if (error.message.includes('heic') || error.message.includes('heif')) {
      message = 'HEIC 格式處理失敗，請嘗試轉換為 JPEG 格式';
    } else if (error.message.includes('webworker') || error.message.includes('worker')) {
      message = '圖片處理功能載入失敗，請重新載入頁面';
    } else {
      message = `圖片處理失敗：${error.message}`;
    }
  }
  
  if (context) {
    message = `${context} - ${message}`;
  }
  
  return new Error(message);
}

/**
 * 檢查檔案是否為 HEIC/HEIF 格式
 */
export function isHeicFormat(file: File): boolean {
  return file.type === 'image/heic' || file.type === 'image/heif' ||
         file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
}

/**
 * 檢查是否需要縮放
 */
export function needsResizing(width: number, height: number, maxSize: number = DEFAULT_MAX_DIMENSION): boolean {
  return width > maxSize || height > maxSize;
}

/**
 * 檢查是否需要壓縮
 */
export function needsCompression(fileSize: number, targetSizeMB: number = 5): boolean {
  return fileSize > targetSizeMB * 1024 * 1024;
}

/**
 * 建立壓縮進度追蹤器
 */
export function createProgressTracker(onProgress?: (progress: number) => void) {
  let currentProgress = 0;
  
  return {
    setProgress: (progress: number) => {
      currentProgress = Math.max(currentProgress, Math.min(100, progress));
      onProgress?.(currentProgress);
    },
    addProgress: (increment: number) => {
      currentProgress = Math.min(100, currentProgress + increment);
      onProgress?.(currentProgress);
    },
    finish: () => {
      currentProgress = 100;
      onProgress?.(100);
    }
  };
} 