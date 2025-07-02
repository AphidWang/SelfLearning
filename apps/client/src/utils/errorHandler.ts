import { useError } from '../context/ErrorContext';

// 錯誤處理裝飾器類型
export interface AsyncOperationOptions {
  context?: string;
  showSuccess?: boolean;
  successMessage?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  retryCount?: number;
  retryDelay?: number;
}

// Hook 來創建錯誤處理的 async wrapper
export const useAsyncOperation = () => {
  const { handleApiError, showSuccess, showInfo } = useError();

  /**
   * 包裝 async 操作，自動處理錯誤
   */
  const wrapAsync = <T>(
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ) => {
    const {
      context = '執行操作',
      showSuccess: shouldShowSuccess = false,
      successMessage = '操作成功完成',
      onSuccess,
      onError,
      retryCount = 0,
      retryDelay = 1000
    } = options;

    return async (): Promise<T | null> => {
      let attempts = 0;
      const maxAttempts = retryCount + 1;

      while (attempts < maxAttempts) {
        try {
          console.log(`🔄 [AsyncOperation] 開始${context} (嘗試 ${attempts + 1}/${maxAttempts})`);
          
          const result = await operation();
          
          console.log(`✅ [AsyncOperation] ${context}成功`);
          
          // 顯示成功消息
          if (shouldShowSuccess) {
            showSuccess({ message: successMessage });
          }
          
          // 執行成功回調
          if (onSuccess) {
            onSuccess();
          }
          
          return result;
        } catch (error) {
          attempts++;
          console.error(`❌ [AsyncOperation] ${context}失敗 (嘗試 ${attempts}/${maxAttempts}):`, error);
          
          // 如果還有重試機會且不是認證錯誤
          if (attempts < maxAttempts && !isAuthError(error)) {
            console.log(`⏰ [AsyncOperation] ${retryDelay}ms 後重試...`);
            await delay(retryDelay);
            continue;
          }
          
          // 處理錯誤
          handleApiError(error, context);
          
          // 執行錯誤回調
          if (onError) {
            onError(error);
          }
          
          return null;
        }
      }
      
      return null;
    };
  };

  /**
   * 包裝多個 async 操作，批量處理
   */
  const wrapAsyncBatch = <T>(
    operations: Array<{
      operation: () => Promise<T>;
      name: string;
    }>,
    options: Omit<AsyncOperationOptions, 'context'> & {
      context?: string;
      continueOnError?: boolean;
    } = {}
  ) => {
    const {
      context = '批量操作',
      continueOnError = false,
      showSuccess: shouldShowSuccess = false,
      successMessage = '所有操作成功完成',
      onSuccess,
      onError
    } = options;

    return async (): Promise<(T | null)[]> => {
      console.log(`🔄 [AsyncBatch] 開始${context}，共 ${operations.length} 個操作`);
      
      const results: (T | null)[] = [];
      const errors: Array<{ name: string; error: any }> = [];

      for (let i = 0; i < operations.length; i++) {
        const { operation, name } = operations[i];
        
        try {
          console.log(`🔄 [AsyncBatch] 執行 ${name} (${i + 1}/${operations.length})`);
          const result = await operation();
          results.push(result);
          console.log(`✅ [AsyncBatch] ${name} 成功`);
        } catch (error) {
          console.error(`❌ [AsyncBatch] ${name} 失敗:`, error);
          errors.push({ name, error });
          results.push(null);
          
          if (!continueOnError) {
            // 處理第一個錯誤並停止
            handleApiError(error, `${context} - ${name}`);
            if (onError) {
              onError(error);
            }
            return results;
          }
        }
      }

      // 批量操作完成後的處理
      if (errors.length > 0) {
        // 有錯誤發生
        const errorMessage = `${context}完成，但有 ${errors.length} 個操作失敗：${errors.map(e => e.name).join(', ')}`;
        handleApiError(new Error(errorMessage), context);
        
        if (onError) {
          onError(errors);
        }
      } else {
        // 全部成功
        console.log(`✅ [AsyncBatch] ${context}全部成功`);
        
        if (shouldShowSuccess) {
          showSuccess({ message: successMessage });
        }
        
        if (onSuccess) {
          onSuccess();
        }
      }

      return results;
    };
  };

  /**
   * 包裝需要用戶確認的操作
   */
  const wrapConfirmOperation = <T>(
    operation: () => Promise<T>,
    confirmOptions: {
      title: string;
      message: string;
      confirmLabel?: string;
      cancelLabel?: string;
    },
    asyncOptions: AsyncOperationOptions = {}
  ) => {
    return async (): Promise<T | null> => {
      const {
        title,
        message,
        confirmLabel = '確認',
        cancelLabel = '取消'
      } = confirmOptions;

      // 顯示確認對話框
      const confirmed = await new Promise<boolean>((resolve) => {
        showInfo({
          title,
          message,
          action: {
            label: confirmLabel,
            onClick: () => resolve(true)
          },
          canClose: true
        });
        
        // 添加取消按鈕的邏輯（這裡簡化處理）
        // 實際實現可能需要修改 ErrorContext 來支持多個按鈕
      });

      if (!confirmed) {
        console.log('🚫 [ConfirmOperation] 用戶取消操作');
        return null;
      }

      // 執行包裝的操作
      const wrappedOperation = wrapAsync(operation, asyncOptions);
      return await wrappedOperation();
    };
  };

  return {
    wrapAsync,
    wrapAsyncBatch,
    wrapConfirmOperation
  };
};

// 工具函數
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const isAuthError = (error: any): boolean => {
  return error?.status === 401 || error?.status === 403;
};

// 常用的錯誤處理模式
export const ErrorPatterns = {
  // 網路操作
  NETWORK_OPERATION: {
    context: '網路請求',
    retryCount: 2,
    retryDelay: 1000
  },
  
  // 資料載入
  DATA_LOADING: {
    context: '載入資料',
    retryCount: 1,
    retryDelay: 500
  },
  
  // 資料保存
  DATA_SAVING: {
    context: '保存資料',
    showSuccess: true,
    successMessage: '資料保存成功'
  },
  
  // 資料刪除
  DATA_DELETION: {
    context: '刪除資料',
    showSuccess: true,
    successMessage: '刪除成功'
  },
  
  // 用戶操作
  USER_ACTION: {
    context: '執行操作',
    showSuccess: true,
    successMessage: '操作完成'
  }
} as const; 