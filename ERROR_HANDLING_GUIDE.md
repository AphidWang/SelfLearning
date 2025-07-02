# 錯誤處理指南 (Error Handling Guide)

## 概述

本專案使用統一的錯誤處理系統來確保用戶不會卡在錯誤狀態，提供一致且友善的錯誤體驗。

## 核心組件

### 1. ErrorContext (`src/context/ErrorContext.tsx`)

統一的錯誤管理 Context，提供：
- 錯誤狀態管理
- 美觀的錯誤對話框
- 多種錯誤類型支援（error/warning/info/success）
- 詳細錯誤信息和一鍵複製功能

### 2. useAsyncOperation Hook (`src/utils/errorHandler.ts`)

專門處理非同步操作的 Hook，提供：
- 自動錯誤捕獲和顯示
- 載入狀態管理
- 自動重試機制
- 批量操作支援

## 使用方式

### 基本用法

```typescript
import { useAsyncOperation } from '../utils/errorHandler';

const MyComponent = () => {
  const { executeWithLoading, executeWithErrorHandling } = useAsyncOperation();
  
  // 方式 1: 帶載入狀態的操作
  const [isLoading, handleSubmit] = executeWithLoading(
    async (data: FormData) => {
      await api.submitForm(data);
    },
    {
      successMessage: "表單提交成功！",
      errorTitle: "提交失敗"
    }
  );

  // 方式 2: 簡單錯誤處理
  const handleDelete = executeWithErrorHandling(
    async (id: string) => {
      await api.deleteItem(id);
    },
    {
      successMessage: "刪除成功",
      retryable: true
    }
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* 表單內容 */}
      <button disabled={isLoading}>
        {isLoading ? '提交中...' : '提交'}
      </button>
    </form>
  );
};
```

### 應用程式整合

在 `App.tsx` 的最外層包裹 `ErrorProvider`：

```typescript
import { ErrorProvider } from './context/ErrorContext';

function App() {
  return (
    <ErrorProvider>
      {/* 其他 providers */}
      <Router>
        {/* 應用內容 */}
      </Router>
    </ErrorProvider>
  );
}
```

### Store 中的錯誤處理

在 store 方法中使用統一錯誤處理：

```typescript
// 舊的方式 (避免)
const fetchData = async () => {
  try {
    setLoading(true);
    const data = await api.getData();
    setData(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

// 新的方式 (推薦)
const fetchData = useAsyncOperation().executeWithLoading(
  async () => {
    const data = await api.getData();
    setData(data);
    return data;
  },
  {
    errorTitle: "載入資料失敗",
    retryable: true
  }
);
```

## 重要規則

### 1. 避免用戶卡住
- **永遠不要**讓用戶停留在無限載入狀態
- **永遠不要**讓錯誤狀態沒有出路
- **一定要**提供重試或回到安全狀態的方式

### 2. 一致的錯誤體驗
- 所有 API 調用都使用統一錯誤處理
- 錯誤訊息要對用戶友善
- 技術細節要可供開發者調試

### 3. 自動重試策略
- 網路錯誤自動重試
- 認證錯誤自動導向登入
- 權限錯誤提供明確指引

## 錯誤類型處理

### 認證錯誤 (401)
```typescript
if (error.status === 401) {
  // 自動導向登入頁面
  showError({
    type: 'error',
    title: '登入已過期',
    message: '請重新登入以繼續使用',
    action: {
      label: '前往登入',
      handler: () => navigate('/login')
    }
  });
}
```

### 權限錯誤 (403)
```typescript
if (error.status === 403) {
  showError({
    type: 'warning',
    title: '權限不足',
    message: '您沒有執行此操作的權限，請聯絡管理員',
    action: {
      label: '聯絡管理員',
      handler: () => openContactDialog()
    }
  });
}
```

### 網路錯誤
```typescript
if (error.name === 'NetworkError') {
  showError({
    type: 'error',
    title: '網路連線問題',
    message: '請檢查網路連線後重試',
    retryable: true
  });
}
```

## 最佳實踐

### 1. 預設行為
- 所有非同步操作都要有錯誤處理
- 載入狀態要有明確的視覺反饋
- 錯誤要提供用戶可理解的訊息

### 2. 用戶體驗
- 錯誤對話框要美觀且不突兀
- 提供明確的下一步動作
- 重要操作要有確認機制

### 3. 開發體驗
- 錯誤詳情要包含完整的技術資訊
- 一鍵複製錯誤資訊方便回報
- Console log 要有清楚的 emoji 標記

## 遷移現有代碼

### 檢查項目
1. 所有 `try-catch` 區塊
2. 直接使用 `fetch` 或 API 調用的地方  
3. 載入狀態手動管理的組件
4. 錯誤狀態處理不完整的地方

### 遷移步驟
1. 引入 `useAsyncOperation`
2. 替換手動錯誤處理邏輯
3. 移除重複的載入狀態管理
4. 測試錯誤場景

## 測試錯誤處理

### 常見測試場景
- 網路斷線時的行為
- API 回傳錯誤時的處理
- 權限不足時的用戶引導
- 重試機制的正確運作

### 調試工具
- 使用瀏覽器開發者工具模擬網路問題
- 檢查 Console 中的錯誤 log
- 驗證錯誤對話框的內容和行為

---

## 範例實作

參考 `src/components/shared/ErrorHandlingExample.tsx` 查看完整的使用範例。 