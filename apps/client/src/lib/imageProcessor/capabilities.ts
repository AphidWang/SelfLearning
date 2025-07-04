/**
 * 瀏覽器能力檢測模組
 * 檢測當前瀏覽器支援哪些圖片處理功能
 */

import type { BrowserCapabilities, ImageCapability } from './types';

export class ImageCapabilities {
  private static _capabilities: BrowserCapabilities | null = null;

  /**
   * 獲取瀏覽器圖片處理能力
   */
  static async getCapabilities(): Promise<BrowserCapabilities> {
    if (this._capabilities) {
      return this._capabilities;
    }

    this._capabilities = {
      canvas: this.checkCanvasSupport(),
      webWorker: this.checkWebWorkerSupport(),
      heicDecode: await this.checkHeicSupport(),
      webpSupport: await this.checkWebPSupport(),
      offscreenCanvas: this.checkOffscreenCanvasSupport()
    };

    return this._capabilities;
  }

  /**
   * 檢查 Canvas 支援
   */
  private static checkCanvasSupport(): ImageCapability {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      return {
        supported: !!ctx,
        name: 'Canvas 2D Context'
      };
    } catch (error) {
      return {
        supported: false,
        name: 'Canvas 2D Context',
        error: 'Canvas 不受支援，無法進行圖片處理'
      };
    }
  }

  /**
   * 檢查 WebWorker 支援
   */
  private static checkWebWorkerSupport(): ImageCapability {
    try {
      return {
        supported: typeof Worker !== 'undefined',
        name: 'Web Worker',
        error: typeof Worker === 'undefined' ? '不支援 Web Worker，圖片處理會在主執行緒進行' : undefined
      };
    } catch (error) {
      return {
        supported: false,
        name: 'Web Worker',
        error: 'Web Worker 不受支援，圖片處理會在主執行緒進行'
      };
    }
  }

  /**
   * 檢查 HEIC 解碼支援 (通過 WebAssembly)
   */
  private static async checkHeicSupport(): Promise<ImageCapability> {
    try {
      // 檢查 WebAssembly 支援
      if (typeof WebAssembly === 'undefined') {
        return {
          supported: false,
          name: 'HEIC 解碼',
          error: '不支援 WebAssembly，無法處理 HEIC 格式'
        };
      }

      // 檢查是否能載入 heic2any
      if (typeof window !== 'undefined' && 'heic2any' in window) {
        return {
          supported: true,
          name: 'HEIC 解碼'
        };
      }

      return {
        supported: false,
        name: 'HEIC 解碼',
        error: 'HEIC 解碼庫未載入，請確認網路連線'
      };
    } catch (error) {
      return {
        supported: false,
        name: 'HEIC 解碼',
        error: 'HEIC 解碼初始化失敗'
      };
    }
  }

  /**
   * 檢查 WebP 支援
   */
  private static async checkWebPSupport(): Promise<ImageCapability> {
    try {
      return new Promise<ImageCapability>((resolve) => {
        const webp = new Image();
        webp.onload = webp.onerror = () => {
          resolve({
            supported: webp.height === 2,
            name: 'WebP 格式',
            error: webp.height !== 2 ? '不支援 WebP 格式' : undefined
          });
        };
        webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      });
    } catch (error) {
      return {
        supported: false,
        name: 'WebP 格式',
        error: 'WebP 支援檢測失敗'
      };
    }
  }

  /**
   * 檢查 OffscreenCanvas 支援
   */
  private static checkOffscreenCanvasSupport(): ImageCapability {
    try {
      return {
        supported: typeof OffscreenCanvas !== 'undefined',
        name: 'OffscreenCanvas',
        error: typeof OffscreenCanvas === 'undefined' ? '不支援 OffscreenCanvas，效能可能較差' : undefined
      };
    } catch (error) {
      return {
        supported: false,
        name: 'OffscreenCanvas',
        error: 'OffscreenCanvas 檢測失敗'
      };
    }
  }

  /**
   * 檢查檔案格式是否支援
   */
  static async isFormatSupported(mimeType: string): Promise<boolean> {
    const capabilities = await this.getCapabilities();
    
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        return capabilities.canvas.supported;
      
      case 'image/webp':
        return capabilities.webpSupport.supported && capabilities.canvas.supported;
      
      case 'image/heic':
      case 'image/heif':
        return capabilities.heicDecode.supported;
      
      default:
        return false;
    }
  }

  /**
   * 獲取推薦的處理策略
   */
  static async getRecommendedStrategy(): Promise<{
    preferWebWorker: boolean;
    preferPica: boolean;
    heicSupported: boolean;
    webpSupported: boolean;
  }> {
    const capabilities = await this.getCapabilities();
    
    return {
      preferWebWorker: capabilities.webWorker.supported && capabilities.offscreenCanvas.supported,
      preferPica: capabilities.canvas.supported && capabilities.webWorker.supported,
      heicSupported: capabilities.heicDecode.supported,
      webpSupported: capabilities.webpSupport.supported
    };
  }
} 