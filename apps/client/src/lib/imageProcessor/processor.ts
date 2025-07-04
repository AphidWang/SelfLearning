/**
 * 主要圖片處理器
 * 整合所有圖片處理功能，提供統一的處理介面
 */

import type { ProcessorOptions, ProcessorResult } from './types';
import { ImageCapabilities } from './capabilities';
import { 
  validateImageFile, 
  getImageDimensions, 
  calculateScaledDimensions, 
  createFriendlyError,
  isHeicFormat,
  needsResizing,
  needsCompression,
  createProgressTracker
} from './utils';

export class ImageProcessor {
  /**
   * 處理圖片檔案
   * 
   * 處理流程：
   * 1. 驗證檔案
   * 2. 檢測瀏覽器能力
   * 3. HEIC 轉換 (如需要)
   * 4. 尺寸縮放 (如需要)
   * 5. 品質壓縮 (如需要)
   */
  static async processImage(file: File, options: ProcessorOptions = {}): Promise<ProcessorResult> {
    const {
      maxSize = 4096,
      fallbackMaxSize = 2500,
      quality = 0.8,
      targetFormat,
      maintainAspectRatio = true,
      onProgress
    } = options;

    const progressTracker = createProgressTracker(onProgress);
    
    try {
      // 1. 驗證檔案
      progressTracker.setProgress(5);
      const validation = await validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // 2. 檢測瀏覽器能力
      progressTracker.setProgress(10);
      const strategy = await ImageCapabilities.getRecommendedStrategy();
      
      let processedFile = file;
      let method: ProcessorResult['method'] = 'canvas-fallback';
      let formatChanged = false;
      let originalDimensions: { width: number; height: number };
      
      // 3. HEIC 轉換
      progressTracker.setProgress(20);
      if (isHeicFormat(file)) {
        if (!strategy.heicSupported) {
          throw new Error('您的瀏覽器不支援 HEIC 格式處理，請手動轉換為 JPEG 格式');
        }
        
        processedFile = await this.convertHeicToJpeg(file, (progress) => {
          progressTracker.setProgress(20 + progress * 0.3); // 20-50%
        });
        method = 'heic-conversion';
        formatChanged = true;
        
        // 重新獲取尺寸
        originalDimensions = await getImageDimensions(processedFile);
      } else {
        originalDimensions = await getImageDimensions(file);
      }

      progressTracker.setProgress(50);

      // 4. 檢查是否需要進一步處理
      const needsResize = needsResizing(originalDimensions.width, originalDimensions.height, maxSize);
      const needsCompress = needsCompression(processedFile.size);
      
      if (!needsResize && !needsCompress && !targetFormat) {
        // 不需要進一步處理
        progressTracker.finish();
        return {
          file: processedFile,
          originalSize: file.size,
          processedSize: processedFile.size,
          originalDimensions,
          processedDimensions: originalDimensions,
          method,
          formatChanged
        };
      }

      // 5. 選擇最佳處理方法和對應的最大尺寸
      let finalFile: File;
      let processedDimensions: { width: number; height: number };
      let actualMaxSize: number;

      if (strategy.preferPica && (needsResize || targetFormat)) {
        // 使用 pica 進行高品質縮放 - 支援較大尺寸
        progressTracker.setProgress(60);
        actualMaxSize = maxSize;
        const result = await this.processWithPica(processedFile, {
          maxSize: actualMaxSize,
          quality,
          targetFormat,
          maintainAspectRatio,
          onProgress: (progress) => progressTracker.setProgress(60 + progress * 0.3)
        });
        finalFile = result.file;
        processedDimensions = result.dimensions;
        method = 'pica';
        if (result.formatChanged) formatChanged = true;
        
      } else if (needsCompress) {
        // 使用 browser-image-compression 進行壓縮 - 支援較大尺寸
        progressTracker.setProgress(60);
        actualMaxSize = maxSize;
        const result = await this.processWithBrowserCompression(processedFile, {
          maxSize: actualMaxSize,
          quality,
          targetFormat,
          onProgress: (progress) => progressTracker.setProgress(60 + progress * 0.3)
        });
        finalFile = result.file;
        processedDimensions = result.dimensions;
        method = 'browser-compression';
        if (result.formatChanged) formatChanged = true;
        
      } else {
        // 使用 Canvas 作為回退方案 - 使用較小的最大尺寸以確保穩定性
        progressTracker.setProgress(60);
        actualMaxSize = fallbackMaxSize;
        const result = await this.processWithCanvas(processedFile, {
          maxSize: actualMaxSize,
          quality,
          targetFormat,
          maintainAspectRatio,
          onProgress: (progress) => progressTracker.setProgress(60 + progress * 0.3)
        });
        finalFile = result.file;
        processedDimensions = result.dimensions;
        method = 'canvas-fallback';
        if (result.formatChanged) formatChanged = true;
      }

      progressTracker.finish();

      return {
        file: finalFile,
        originalSize: file.size,
        processedSize: finalFile.size,
        originalDimensions,
        processedDimensions,
        method,
        formatChanged
      };

    } catch (error) {
      throw createFriendlyError(error, '圖片處理');
    }
  }

  /**
   * 使用 heic2any 轉換 HEIC 格式
   */
  private static async convertHeicToJpeg(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<File> {
    try {
      onProgress?.(0);
      
      // 動態載入 heic2any
      if (typeof window !== 'undefined' && !(window as any).heic2any) {
        throw new Error('HEIC 轉換庫未載入');
      }

      onProgress?.(25);
      
      const convertedBlob = await (window as any).heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      });

      onProgress?.(75);

      // 轉換為 File 對象
      const fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      const convertedFile = new File([convertedBlob], fileName, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      onProgress?.(100);
      return convertedFile;

    } catch (error) {
      throw createFriendlyError(error, 'HEIC 轉換');
    }
  }

  /**
   * 使用 pica 進行高品質處理
   */
  private static async processWithPica(
    file: File,
    options: {
      maxSize: number;
      quality: number;
      targetFormat?: string;
      maintainAspectRatio: boolean;
      onProgress?: (progress: number) => void;
    }
  ): Promise<{ file: File; dimensions: { width: number; height: number }; formatChanged: boolean }> {
    try {
      options.onProgress?.(0);

      // 動態載入 pica
      const Pica = (await import('pica')).default;
      const pica = new Pica();

      options.onProgress?.(10);

      // 獲取原始圖片
      const img = await this.loadImage(file);
      const originalDimensions = { width: img.width, height: img.height };
      
      options.onProgress?.(25);

      // 計算目標尺寸
      const targetDimensions = calculateScaledDimensions(
        originalDimensions.width,
        originalDimensions.height,
        options.maxSize
      );

      // 建立 canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetDimensions.width;
      canvas.height = targetDimensions.height;

      options.onProgress?.(40);

      // 使用 pica 縮放
      await pica.resize(img, canvas, {
        quality: 3, // 最高品質
        alpha: true
      });

      options.onProgress?.(70);

      // 轉換為 blob
      const targetMimeType = options.targetFormat || file.type;
      const blob = await pica.toBlob(canvas, targetMimeType, options.quality);

      options.onProgress?.(90);

      // 建立檔案
      const fileName = this.updateFileName(file.name, targetMimeType);
      const processedFile = new File([blob], fileName, {
        type: targetMimeType,
        lastModified: Date.now()
      });

      options.onProgress?.(100);

      return {
        file: processedFile,
        dimensions: targetDimensions,
        formatChanged: targetMimeType !== file.type
      };

    } catch (error) {
      throw createFriendlyError(error, 'Pica 處理');
    }
  }

  /**
   * 使用 browser-image-compression 處理
   */
  private static async processWithBrowserCompression(
    file: File,
    options: {
      maxSize: number;
      quality: number;
      targetFormat?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<{ file: File; dimensions: { width: number; height: number }; formatChanged: boolean }> {
    try {
      options.onProgress?.(0);

      // 動態載入 browser-image-compression
      const imageCompression = (await import('browser-image-compression')).default;

      options.onProgress?.(10);

      const compressionOptions = {
        maxSizeMB: 5, // 最大 5MB
        maxWidthOrHeight: options.maxSize,
        useWebWorker: true,
        initialQuality: options.quality,
        fileType: options.targetFormat,
        onProgress: (progress: number) => {
          options.onProgress?.(10 + progress * 0.8); // 10-90%
        }
      };

      const compressedFile = await imageCompression(file, compressionOptions);
      
      options.onProgress?.(95);

      // 獲取處理後的尺寸
      const dimensions = await getImageDimensions(compressedFile);

      options.onProgress?.(100);

      return {
        file: compressedFile,
        dimensions,
        formatChanged: options.targetFormat ? compressedFile.type !== file.type : false
      };

    } catch (error) {
      throw createFriendlyError(error, 'Browser Compression 處理');
    }
  }

  /**
   * 使用 Canvas 作為回退方案
   */
  private static async processWithCanvas(
    file: File,
    options: {
      maxSize: number;
      quality: number;
      targetFormat?: string;
      maintainAspectRatio: boolean;
      onProgress?: (progress: number) => void;
    }
  ): Promise<{ file: File; dimensions: { width: number; height: number }; formatChanged: boolean }> {
    try {
      options.onProgress?.(0);

      const img = await this.loadImage(file);
      const originalDimensions = { width: img.width, height: img.height };
      
      options.onProgress?.(20);

      // 計算目標尺寸
      const targetDimensions = calculateScaledDimensions(
        originalDimensions.width,
        originalDimensions.height,
        options.maxSize
      );

      // 建立 canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('無法建立 Canvas 2D 內容');
      }

      canvas.width = targetDimensions.width;
      canvas.height = targetDimensions.height;

      options.onProgress?.(40);

      // 繪製圖片
      ctx.drawImage(img, 0, 0, targetDimensions.width, targetDimensions.height);

      options.onProgress?.(70);

      // 轉換為 blob
      const targetMimeType = options.targetFormat || file.type || 'image/jpeg';
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas 轉換失敗'));
          }
        }, targetMimeType, options.quality);
      });

      options.onProgress?.(90);

      // 建立檔案
      const fileName = this.updateFileName(file.name, targetMimeType);
      const processedFile = new File([blob], fileName, {
        type: targetMimeType,
        lastModified: Date.now()
      });

      options.onProgress?.(100);

      return {
        file: processedFile,
        dimensions: targetDimensions,
        formatChanged: targetMimeType !== file.type
      };

    } catch (error) {
      throw createFriendlyError(error, 'Canvas 處理');
    }
  }

  /**
   * 載入圖片
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('圖片載入失敗'));
      };
      
      img.src = url;
    });
  }

  /**
   * 更新檔案名稱擴展名
   */
  private static updateFileName(originalName: string, mimeType: string): string {
    const extensionMap: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif'
    };

    const newExtension = extensionMap[mimeType] || '.jpg';
    const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
    
    return nameWithoutExtension + newExtension;
  }
} 