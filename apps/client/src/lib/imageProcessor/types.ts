/**
 * 圖片處理模組類型定義
 */

export type SupportedFormat = 'image/jpeg' | 'image/png' | 'image/heic' | 'image/heif' | 'image/webp' | 'image/gif';

export interface ProcessorOptions {
  /** 最大尺寸 (寬度或高度)，預設 4096 */
  maxSize?: number;
  /** 回退情況的最大尺寸 (當使用 canvas-fallback 時)，預設 2500 (Supabase 限制) */
  fallbackMaxSize?: number;
  /** 壓縮品質 (0-1)，預設 0.8 */
  quality?: number;
  /** 目標格式，預設保持原格式或轉為 JPEG */
  targetFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** 是否保持長寬比，預設 true */
  maintainAspectRatio?: boolean;
  /** 進度回調 */
  onProgress?: (progress: number) => void;
}

export interface CompressionOptions {
  /** 最大檔案大小 (MB) */
  maxSizeMB?: number;
  /** 最大寬度或高度 */
  maxWidthOrHeight?: number;
  /** 初始品質 */
  initialQuality?: number;
  /** 是否使用 WebWorker */
  useWebWorker?: boolean;
}

export interface ProcessorResult {
  /** 處理後的檔案 */
  file: File;
  /** 原始檔案大小 (bytes) */
  originalSize: number;
  /** 處理後檔案大小 (bytes) */
  processedSize: number;
  /** 原始尺寸 */
  originalDimensions: { width: number; height: number };
  /** 處理後尺寸 */
  processedDimensions: { width: number; height: number };
  /** 使用的處理方法 */
  method: 'pica' | 'browser-compression' | 'heic-conversion' | 'canvas-fallback';
  /** 是否有格式轉換 */
  formatChanged: boolean;
}

export interface ImageCapability {
  /** 是否支援該功能 */
  supported: boolean;
  /** 功能名稱 */
  name: string;
  /** 錯誤訊息 (如果不支援) */
  error?: string;
}

export interface BrowserCapabilities {
  /** Canvas 支援 */
  canvas: ImageCapability;
  /** WebWorker 支援 */
  webWorker: ImageCapability;
  /** HEIC 解碼支援 */
  heicDecode: ImageCapability;
  /** WebP 支援 */
  webpSupport: ImageCapability;
  /** OffscreenCanvas 支援 */
  offscreenCanvas: ImageCapability;
}

export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 錯誤訊息 */
  error?: string;
  /** 錯誤類型 */
  errorType?: 'UNSUPPORTED_FORMAT' | 'FILE_TOO_LARGE' | 'INVALID_FILE' | 'DIMENSIONS_TOO_LARGE';
} 