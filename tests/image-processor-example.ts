/**
 * 圖片處理模組使用示例
 * 
 * 這個檔案展示如何在實際應用中使用圖片處理模組
 * 包含各種使用場景和最佳實踐
 */

import { ImageProcessor, ImageCapabilities } from '@/lib/imageProcessor';
import type { ProcessorOptions, ProcessorResult } from '@/lib/imageProcessor';
import { useState, useCallback } from 'react';

// === 基本使用示例 ===

/**
 * 示例 1: 處理用戶上傳的頭像
 */
export async function processUserAvatar(file: File): Promise<ProcessorResult> {
  try {
    console.log('開始處理用戶頭像...');
    
    const options: ProcessorOptions = {
      maxSize: 400,           // 頭像不需要太大
      quality: 0.8,           // 較高品質
      targetFormat: 'image/jpeg', // 統一格式
      onProgress: (progress) => {
        console.log(`處理進度: ${progress}%`);
      }
    };

    const result = await ImageProcessor.processImage(file, options);
    
    console.log('頭像處理完成:', {
      原始大小: `${(result.originalSize / 1024).toFixed(1)} KB`,
      處理後大小: `${(result.processedSize / 1024).toFixed(1)} KB`,
      壓縮比: `${((1 - result.processedSize / result.originalSize) * 100).toFixed(1)}%`,
      處理方法: result.method
    });

    return result;
  } catch (error) {
    console.error('頭像處理失敗:', error);
    throw error;
  }
}

/**
 * 示例 2: 處理課程封面圖片
 */
export async function processCourseCover(file: File): Promise<ProcessorResult> {
  try {
    console.log('開始處理課程封面圖片...');
    
    const options: ProcessorOptions = {
      maxSize: 1200,          // 封面需要較大尺寸
      quality: 0.85,          // 高品質
      maintainAspectRatio: true,
      onProgress: (progress) => {
        // 可以在這裡更新 UI 進度條
        console.log(`封面處理進度: ${progress}%`);
      }
    };

    const result = await ImageProcessor.processImage(file, options);
    
    console.log('封面處理完成:', {
      原始尺寸: `${result.originalDimensions.width}x${result.originalDimensions.height}`,
      處理後尺寸: `${result.processedDimensions.width}x${result.processedDimensions.height}`,
      格式變更: result.formatChanged ? '是' : '否'
    });

    return result;
  } catch (error) {
    console.error('封面處理失敗:', error);
    throw error;
  }
}

/**
 * 示例 3: 批量處理多個圖片
 */
export async function processBatchImages(
  files: File[], 
  onProgress?: (current: number, total: number) => void
): Promise<ProcessorResult[]> {
  const results: ProcessorResult[] = [];
  
  console.log(`開始批量處理 ${files.length} 個圖片...`);
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      onProgress?.(i + 1, files.length);
      
      const options: ProcessorOptions = {
        maxSize: 2500,
        quality: 0.8,
        onProgress: (progress) => {
          console.log(`檔案 ${i + 1}/${files.length} 處理進度: ${progress}%`);
        }
      };

      const result = await ImageProcessor.processImage(file, options);
      results.push(result);
      
      console.log(`檔案 ${file.name} 處理完成`);
      
    } catch (error) {
      console.error(`檔案 ${file.name} 處理失敗:`, error);
      // 可以選擇跳過失敗的檔案或者停止整個批次
      throw error;
    }
  }
  
  console.log('批量處理完成');
  return results;
}

/**
 * 示例 4: 處理 HEIC 格式照片
 */
export async function processHeicPhoto(file: File): Promise<ProcessorResult> {
  try {
    console.log('開始處理 HEIC 照片...');
    
    // 先檢查瀏覽器是否支援 HEIC
    const capabilities = await ImageCapabilities.detectCapabilities();
    if (!capabilities.heicDecode.supported) {
      throw new Error('您的瀏覽器不支援 HEIC 格式，請使用較新的瀏覽器或手動轉換為 JPEG 格式');
    }

    const options: ProcessorOptions = {
      maxSize: 2500,
      quality: 0.9,           // HEIC 通常品質較好，可以保持高品質
      targetFormat: 'image/jpeg', // 轉換為 JPEG
      onProgress: (progress) => {
        console.log(`HEIC 處理進度: ${progress}%`);
      }
    };

    const result = await ImageProcessor.processImage(file, options);
    
    console.log('HEIC 處理完成，已轉換為 JPEG 格式');
    return result;
    
  } catch (error) {
    console.error('HEIC 處理失敗:', error);
    throw error;
  }
}

// === 進階使用示例 ===

/**
 * 示例 5: 根據檔案大小自動調整品質
 */
export async function processWithAdaptiveQuality(file: File): Promise<ProcessorResult> {
  try {
    console.log('開始智慧品質處理...');
    
    // 根據檔案大小決定品質
    const fileSizeMB = file.size / (1024 * 1024);
    let quality: number;
    
    if (fileSizeMB > 10) {
      quality = 0.7;  // 大檔案降低品質
    } else if (fileSizeMB > 5) {
      quality = 0.8;  // 中等檔案中等品質
    } else {
      quality = 0.9;  // 小檔案保持高品質
    }
    
    console.log(`檔案大小: ${fileSizeMB.toFixed(1)}MB，選擇品質: ${quality}`);

    const options: ProcessorOptions = {
      maxSize: 2500,
      quality,
      onProgress: (progress) => {
        console.log(`智慧處理進度: ${progress}%`);
      }
    };

    const result = await ImageProcessor.processImage(file, options);
    
    console.log('智慧品質處理完成');
    return result;
    
  } catch (error) {
    console.error('智慧處理失敗:', error);
    throw error;
  }
}

/**
 * 示例 6: 處理結果驗證
 */
export async function processWithValidation(file: File): Promise<ProcessorResult> {
  try {
    const result = await ImageProcessor.processImage(file, {
      maxSize: 2500,
      quality: 0.8
    });

    // 驗證處理結果
    if (result.processedSize > result.originalSize) {
      console.warn('警告：處理後檔案變大了，可能需要調整參數');
    }

    if (result.processedDimensions.width > 2500 || result.processedDimensions.height > 2500) {
      throw new Error('處理後圖片尺寸仍然超過限制');
    }

    console.log('處理並驗證完成:', {
      壓縮效果: result.processedSize < result.originalSize ? '成功' : '失敗',
      尺寸符合: (result.processedDimensions.width <= 2500 && result.processedDimensions.height <= 2500) ? '符合' : '超限'
    });

    return result;
    
  } catch (error) {
    console.error('處理或驗證失敗:', error);
    throw error;
  }
}

// === React Hook 整合示例 ===

/**
 * 示例 7: React Hook 整合
 */
export function useImageProcessor() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (file: File, options?: ProcessorOptions) => {
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const result = await ImageProcessor.processImage(file, {
        ...options,
        onProgress: (p) => setProgress(p)
      });

      setProcessing(false);
      return result;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '圖片處理失敗');
      setProcessing(false);
      throw err;
    }
  }, []);

  return {
    processImage,
    processing,
    progress,
    error,
    clearError: () => setError(null)
  };
}

// === 錯誤處理示例 ===

/**
 * 示例 8: 完整的錯誤處理
 */
export async function processWithErrorHandling(file: File): Promise<ProcessorResult | null> {
  try {
    // 1. 預檢查
    if (!file) {
      throw new Error('請選擇一個圖片檔案');
    }

    // 2. 檢查瀏覽器能力
    const capabilities = await ImageCapabilities.detectCapabilities();
    console.log('瀏覽器能力:', capabilities);

    // 3. 處理圖片
    const result = await ImageProcessor.processImage(file, {
      maxSize: 2500,
      quality: 0.8,
      onProgress: (progress) => {
        console.log(`處理進度: ${progress}%`);
      }
    });

    return result;

  } catch (error) {
    console.error('圖片處理錯誤:', error);
    
    // 根據錯誤類型提供不同的用戶提示
    if (error instanceof Error) {
      if (error.message.includes('不支援')) {
        alert('您的瀏覽器不支援此圖片格式，請嘗試其他格式或更新瀏覽器');
      } else if (error.message.includes('過大')) {
        alert('圖片檔案過大，請選擇較小的圖片');
      } else if (error.message.includes('網路')) {
        alert('網路連線問題，請檢查網路後重試');
      } else {
        alert(`圖片處理失敗：${error.message}`);
      }
    }

    return null;
  }
}

// === 性能最佳化示例 ===

/**
 * 示例 9: 性能最佳化處理
 */
export async function processWithOptimization(file: File): Promise<ProcessorResult> {
  try {
    console.log('開始最佳化處理...');
    
    // 1. 獲取推薦策略
    const strategy = await ImageCapabilities.getRecommendedStrategy();
    console.log('推薦策略:', strategy);

    // 2. 根據策略調整選項
    const options: ProcessorOptions = {
      maxSize: 2500,
      quality: strategy.webWorkerAvailable ? 0.85 : 0.8, // WebWorker 可用時提高品質
      maintainAspectRatio: true,
      onProgress: (progress) => {
        console.log(`最佳化處理進度: ${progress}%`);
      }
    };

    const startTime = performance.now();
    const result = await ImageProcessor.processImage(file, options);
    const endTime = performance.now();

    console.log('最佳化處理完成:', {
      處理時間: `${(endTime - startTime).toFixed(0)}ms`,
      使用方法: result.method,
      壓縮比: `${((1 - result.processedSize / result.originalSize) * 100).toFixed(1)}%`
    });

    return result;
    
  } catch (error) {
    console.error('最佳化處理失敗:', error);
    throw error;
  }
}

// === 匯出所有示例函數 ===

export {
  processUserAvatar,
  processCourseCover,
  processBatchImages,
  processHeicPhoto,
  processWithAdaptiveQuality,
  processWithValidation,
  processWithErrorHandling,
  processWithOptimization
}; 