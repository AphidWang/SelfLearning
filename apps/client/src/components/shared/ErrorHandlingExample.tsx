import React from 'react';
import { useAsyncOperation, ErrorPatterns } from '../../utils/errorHandler';
import { useError } from '../../context/ErrorContext';

// 使用新錯誤處理系統的示例組件
const ErrorHandlingExample: React.FC = () => {
  const { wrapAsync, wrapAsyncBatch } = useAsyncOperation();
  const { showError, showSuccess, handleApiError } = useError();

  // 示例：載入資料
  const loadData = wrapAsync(
    async () => {
      // 模擬 API 調用
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('載入失敗');
      }
      return response.json();
    },
    ErrorPatterns.DATA_LOADING
  );

  // 示例：保存資料
  const saveData = wrapAsync(
    async () => {
      // 模擬保存操作
      const response = await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify({ data: 'example' })
      });
      if (!response.ok) {
        throw new Error('保存失敗');
      }
      return response.json();
    },
    ErrorPatterns.DATA_SAVING
  );

  // 示例：批量操作
  const batchOperations = wrapAsyncBatch(
    [
      {
        name: '載入用戶列表',
        operation: async () => {
          const response = await fetch('/api/users');
          return response.json();
        }
      },
      {
        name: '載入主題列表',
        operation: async () => {
          const response = await fetch('/api/topics');
          return response.json();
        }
      }
    ],
    {
      context: '初始化頁面資料',
      continueOnError: true,
      showSuccess: true,
      successMessage: '頁面初始化完成'
    }
  );

  // 示例：手動錯誤處理
  const manualErrorHandling = async () => {
    try {
      // 一些可能失敗的操作
      throw new Error('這是一個測試錯誤');
    } catch (error) {
      // 使用統一的錯誤處理
      handleApiError(error, '手動錯誤測試');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">錯誤處理系統示例</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          載入資料 (自動重試)
        </button>
        
        <button
          onClick={saveData}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          保存資料 (顯示成功)
        </button>
        
        <button
          onClick={batchOperations}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          批量操作
        </button>
        
        <button
          onClick={manualErrorHandling}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          測試錯誤處理
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">使用方式：</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>自動重試</strong>：網路錯誤時自動重試</li>
          <li>• <strong>統一錯誤對話框</strong>：顯示詳細錯誤信息</li>
          <li>• <strong>成功提示</strong>：操作成功時的友好提示</li>
          <li>• <strong>錯誤代碼</strong>：方便調試和支援</li>
          <li>• <strong>複製功能</strong>：一鍵複製錯誤信息給管理員</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorHandlingExample; 