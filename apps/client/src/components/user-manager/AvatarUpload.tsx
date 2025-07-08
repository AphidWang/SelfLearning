import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { avatarService } from '../../services/supabase';
import { ImageProcessor, validateImageFile } from '../../lib/imageProcessor';

interface AvatarUploadProps {
  currentAvatar?: string;
  onUploadSuccess: (avatarUrl: string) => void;
  onUploadError: (error: string) => void;
  userId: string;
  disabled?: boolean;
  className?: string;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  preview: string | null;
  error: string | null;
  success: boolean;
  imageLoadError: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onUploadSuccess,
  onUploadError,
  userId,
  disabled = false,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    preview: null,
    error: null,
    success: false,
    imageLoadError: false
  });
  const [fallbackUrl, setFallbackUrl] = useState<string>('');

  // 重置狀態
  const resetState = useCallback(() => {
    setUploadState({
      uploading: false,
      progress: 0,
      preview: null,
      error: null,
      success: false,
      imageLoadError: false
    });
    setFallbackUrl('');
  }, []);

  // 處理圖片載入錯誤
  const handleImageError = useCallback((url: string) => {
    console.error('Image load error for URL:', url);
    
    // 如果是 transform URL 失敗，嘗試使用原始 URL
    if (url.includes('/render/image/') && fallbackUrl) {
      console.log('Trying fallback URL:', fallbackUrl);
      setUploadState(prev => ({ 
        ...prev, 
        preview: fallbackUrl,
        imageLoadError: false 
      }));
    } else {
      setUploadState(prev => ({ ...prev, imageLoadError: true }));
    }
  }, [fallbackUrl]);

  // 處理圖片載入成功
  const handleImageLoad = useCallback((url: string) => {
    console.log('Image loaded successfully:', url);
    setUploadState(prev => ({ ...prev, imageLoadError: false }));
  }, []);

  // 處理文件選擇
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    resetState();

    // 立即顯示預覽
    const previewUrl = URL.createObjectURL(file);
    setUploadState(prev => ({ ...prev, preview: previewUrl }));

    // 開始處理和上傳
    setUploadState(prev => ({ ...prev, uploading: true }));

    try {
      // 步驟 1: 驗證檔案 (0-10%)
      setUploadState(prev => ({ ...prev, progress: 5 }));
      const validation = await validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // 步驟 2: 處理圖片 (10-70%)
      setUploadState(prev => ({ ...prev, progress: 10 }));
      const processedResult = await ImageProcessor.processImage(file, {
        maxSize: 400, // 頭像不需要太大
        quality: 0.8,
        targetFormat: 'image/jpeg', // 統一格式
        onProgress: (progress) => {
          setUploadState(prev => ({ ...prev, progress: 10 + progress * 0.6 })); // 10-70%
        }
      });

      // 步驟 3: 上傳處理後的檔案 (70-100%)
      setUploadState(prev => ({ ...prev, progress: 70 }));
      const result = await avatarService.uploadAvatar(
        processedResult.file, 
        userId,
        (progress) => {
          setUploadState(prev => ({ ...prev, progress: 70 + progress * 0.3 })); // 70-100%
        }
      );
      
      setUploadState(prev => ({ 
        ...prev, 
        uploading: false, 
        progress: 100, 
        success: true 
      }));

      // 清理本地預覽 URL (blob URL)
      URL.revokeObjectURL(previewUrl);

      // 通知父組件上傳成功
      onUploadSuccess(result.url);

      // 更新預覽為服務器 URL
      setUploadState(prev => ({ ...prev, preview: result.url }));

      // 記錄處理資訊
      console.log('頭像處理完成:', {
        originalSize: `${(processedResult.originalSize / 1024).toFixed(1)} KB`,
        processedSize: `${(processedResult.processedSize / 1024).toFixed(1)} KB`,
        compressionRatio: `${((1 - processedResult.processedSize / processedResult.originalSize) * 100).toFixed(1)}%`,
        method: processedResult.method,
        formatChanged: processedResult.formatChanged
      });

      // 2秒後只清除成功狀態，保留預覽
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: false }));
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上傳失敗';
      
      setUploadState(prev => ({ 
        ...prev, 
        uploading: false, 
        progress: 0, 
        error: errorMessage 
      }));

      // 清理預覽 URL
      URL.revokeObjectURL(previewUrl);

      onUploadError(errorMessage);

      // 3秒後清除錯誤狀態
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, error: null, preview: null }));
      }, 3000);
    }
  }, [userId, onUploadSuccess, onUploadError, resetState]);

  // 拖拽處理
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // 點擊上傳
  const handleClick = () => {
    if (disabled || uploadState.uploading) return;
    fileInputRef.current?.click();
  };

  // 清除預覽
  const clearPreview = () => {
    if (uploadState.preview && uploadState.preview.startsWith('blob:')) {
      // 只對 blob URL 進行清理，服務器 URL 不需要
      URL.revokeObjectURL(uploadState.preview);
    }
    resetState();
  };

  return (
    <div className={`relative ${className}`}>
      {/* 隱藏的文件輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* 上傳區域 */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
          ${disabled || uploadState.uploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${uploadState.error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
          ${uploadState.success ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
        `}
        onClick={handleClick}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        whileHover={!disabled && !uploadState.uploading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !uploadState.uploading ? { scale: 0.98 } : {}}
      >
        {/* 當前頭像/預覽 */}
        <AnimatePresence mode="wait">
          {(uploadState.preview || currentAvatar) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mb-4"
            >
              <div className="relative inline-block">
                <img
                  src={uploadState.preview || currentAvatar}
                  alt="頭像預覽"
                  className="w-24 h-24 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
                  onError={(e) => {
                    handleImageError(e.currentTarget.src);
                  }}
                                      onLoad={(e) => {
                     handleImageLoad(e.currentTarget.src);
                    }}
                />
                
                {/* 清除按鈕 */}
                {uploadState.preview && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearPreview();
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* 上傳進度覆蓋層 */}
                {uploadState.uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="text-white text-xs font-medium">
                      {uploadState.progress}%
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 上傳圖標和文字 */}
        <div className="space-y-2">
          {uploadState.uploading ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          ) : uploadState.success ? (
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
          ) : uploadState.error ? (
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          ) : (
            <div className="flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400 mr-2" />
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
          )}

          <div className="text-sm">
            {uploadState.uploading ? (
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                上傳中... {uploadState.progress}%
              </p>
            ) : uploadState.success ? (
              <p className="text-green-600 dark:text-green-400 font-medium">
                上傳成功！
              </p>
            ) : uploadState.error ? (
              <p className="text-red-600 dark:text-red-400 font-medium">
                {uploadState.error}
              </p>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  點擊或拖拽圖片到此處
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  支持 PNG、JPEG、WebP、GIF、HEIC
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  最大 50MB，會自動優化尺寸
                </p>
              </>
            )}
          </div>
        </div>

        {/* 進度條 */}
        {uploadState.uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-xl overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${uploadState.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </motion.div>

      {/* 說明文字 */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        推薦使用正方形圖片以獲得最佳效果
      </div>
    </div>
  );
}; 