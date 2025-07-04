/**
 * 圖片處理模組
 * 
 * 功能：
 * - 支援 JPG/PNG/HEIC/WebP 等格式轉換
 * - 智能壓縮，支援最大 4096x4096 像素
 * - 根據瀏覽器能力選擇最佳處理方法
 * - Canvas fallback 限制在 2500x2500 (Supabase 限制)
 * - 提供友善的錯誤訊息和進度追蹤
 * 
 * 依賴庫 (全部 MIT 授權)：
 * - pica: 高品質圖片縮放
 * - heic2any: HEIC 轉換
 * - browser-image-compression: 圖片壓縮
 */

export { ImageProcessor } from './processor';
export { ImageCapabilities } from './capabilities';
export type { 
  ProcessorOptions, 
  ProcessorResult, 
  SupportedFormat,
  CompressionOptions
} from './types';
export { 
  validateImageFile, 
  getImageDimensions,
  calculateScaledDimensions,
  formatFileSize,
  createFriendlyError,
  isHeicFormat,
  needsResizing,
  needsCompression
} from './utils'; 