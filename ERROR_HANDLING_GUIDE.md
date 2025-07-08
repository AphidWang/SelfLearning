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

## 🚀 新功能：增強的 React 錯誤追蹤

### 📋 功能特色

1. **React Component Stack Trace 追蹤**
   - 自動捕捉 React 組件錯誤的組件堆疊
   - 增強 DOM 錯誤（如 insertBefore）的上下文資訊
   - 更詳細的錯誤報告

2. **雙層錯誤邊界設計**
   - `EnhancedErrorBoundary`：捕捉並報告 React 組件錯誤
   - `Sentry.ErrorBoundary`：作為備份錯誤邊界

3. **智能錯誤分類**
   - 自動識別 DOM 操作錯誤
   - 區分 React 渲染錯誤和一般錯誤
   - 提供上下文相關的錯誤資訊

### 🔧 技術實現

#### 1. Sentry 配置改進

```typescript
// apps/client/src/config/sentry.ts

Sentry.init({
  // 啟用 React 組件錯誤追蹤
  integrations: [
    Sentry.browserTracingIntegration({
      enableLongTask: false,
      enableInp: false
    }),
    Sentry.captureConsoleIntegration({
      levels: ['error']
    }),
    // 錯誤重播（僅在錯誤時記錄）
    Sentry.replayIntegration({
      sessionSampleRate: 0,
      errorSampleRate: 0.1
    })
  ],
  
  // 增強錯誤上下文
  beforeSend: (event, hint) => {
    // 自動添加 componentStack
    // 識別 DOM 錯誤類型
    // 增加額外上下文資訊
  }
});
```

#### 2. 新的錯誤報告函數

```typescript
// 專門用於 React 組件錯誤
export const reportReactError = (
  error: Error, 
  errorInfo: React.ErrorInfo, 
  additionalContext?: Record<string, any>
) => {
  Sentry.withScope((scope) => {
    scope.setContext('react', {
      componentStack: errorInfo.componentStack
    });
    scope.setTag('error_boundary', 'react');
    Sentry.captureException(error);
  });
};
```

#### 3. 增強的錯誤邊界

```typescript
class EnhancedErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 🎯 自動報告包含 componentStack 的錯誤
    reportReactError(error, errorInfo, {
      error_boundary: 'EnhancedErrorBoundary',
      user_agent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 📊 錯誤分類與上下文

#### DOM 錯誤自動識別

系統會自動識別以下 DOM 錯誤類型：
- `insertBefore` 錯誤
- Node 操作錯誤
- 其他 DOM 相關錯誤

錯誤報告會包含：
```json
{
  "contexts": {
    "dom_error": {
      "error_type": "DOM Manipulation Error",
      "error_method": "insertBefore",
      "likely_cause": "React component rendering issue"
    },
    "react": {
      "componentStack": "..."
    }
  }
}
```

### 🧪 測試功能

開發環境中提供增強的測試面板（右下角的 🐛 圖標）：

#### 基本錯誤測試
- 同步錯誤
- 異步錯誤
- Promise rejection
- 手動報告

#### React 組件錯誤測試
- **觸發 React 組件錯誤**：實際觸發 React Error Boundary
- **模擬 componentStack**：手動測試 componentStack 追蹤

#### DOM 錯誤測試
- **觸發 insertBefore 錯誤**：模擬真實的 DOM 操作錯誤
- **模擬 DOM 錯誤**：手動測試 DOM 錯誤上下文

### 📝 使用方式

#### 1. 自動錯誤捕捉
所有 React 組件錯誤會自動被捕捉並報告，包含完整的 componentStack 資訊。

#### 2. 手動錯誤報告
```typescript
import { reportError, reportReactError } from '../../config/sentry';

// 一般錯誤
reportError(error, { context: 'user_action', details: 'some info' });

// React 組件錯誤（在 Error Boundary 中使用）
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  reportReactError(error, errorInfo, { 
    additional_context: 'value' 
  });
}
```

#### 3. 檢視錯誤報告
在 Sentry 中，你現在可以看到：
- **Component Stack**：React 組件錯誤的完整組件堆疊
- **Error Context**：DOM 錯誤的分類和上下文
- **Enhanced Details**：用戶代理、URL、時間戳等額外資訊

### 🎯 預期效果

使用這些改進後，你應該能夠：

1. **快速定位 React 組件錯誤**
   - 看到完整的組件調用堆疊
   - 了解錯誤發生在哪個具體組件

2. **更好地理解 DOM 錯誤**
   - 自動分類 insertBefore 等 DOM 錯誤
   - 獲得可能原因的提示

3. **改進調試體驗**
   - 更詳細的錯誤上下文
   - 更好的錯誤分類和標記

### 🔄 測試建議

1. 在開發環境中使用測試面板驗證各種錯誤類型
2. 檢查 Sentry 中的錯誤報告是否包含 componentStack
3. 確認 DOM 錯誤的自動分類是否正常工作

---

## 原有功能（保持不變）

### 核心概念

我們的錯誤處理系統基於以下原則：
- **用戶友好**：向用戶顯示清晰、有幫助的錯誤消息
- **開發者友好**：提供詳細的調試信息
- **自動化**：盡可能自動處理和報告錯誤
- **可恢復**：提供重試和恢復機制

### ErrorContext 系統

我們提供了一個統一的 `ErrorContext`，用於整個應用程式的錯誤處理：

```typescript
import { useError } from '../context/ErrorContext';

const { 
  showError, 
  showWarning, 
  showInfo, 
  showSuccess,
  handleNetworkError,
  handleAuthError,
  handleApiError,
  clearError,
  clearAllErrors 
} = useError();
```

### useAsyncOperation Hook

這個 Hook 提供了一個簡單的方式來包裝異步操作並自動處理錯誤：

```typescript
import { useAsyncOperation } from '../utils/errorHandler';

const { wrapAsync } = useAsyncOperation();

const loadData = wrapAsync(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    context: '載入資料',
    showSuccess: true,
    successMessage: '資料載入成功',
    retryCount: 2
  }
);

// 使用
const handleClick = async () => {
  const result = await loadData();
  if (result) {
    // 處理成功結果
  }
};
```

### 錯誤類型與處理

#### 1. 網路錯誤 (Network Errors)
- 自動檢測網路連線問題
- 提供重試機制
- 顯示用戶友好的網路錯誤消息

#### 2. 認證錯誤 (Authentication Errors)
- 處理 401/403 錯誤
- 自動引導用戶重新登入
- 清除過期的認證資料

#### 3. API 錯誤 (API Errors)
- 解析伺服器錯誤消息
- 顯示具體的錯誤原因
- 提供錯誤代碼和技術詳情

#### 4. 表單驗證錯誤 (Validation Errors)
- 顯示欄位級別的錯誤消息
- 高亮有問題的輸入欄位
- 提供修正建議

### 錯誤對話框

我們的錯誤對話框系統具有以下特點：
- **類型化圖示**：根據錯誤類型顯示不同圖示
- **詳細資訊**：可展開查看技術詳情
- **動作按鈕**：提供相關的修復動作
- **自動消失**：成功消息會自動消失

### Sentry 整合

應用程式與 Sentry 錯誤監控平台整合：

```typescript
import { reportError, setUser, clearUser } from '../config/sentry';

// 手動報告錯誤
reportError(error, { 
  context: 'user_action',
  additional_info: 'some details'
});

// 設置用戶資訊
setUser({ 
  id: 'user123', 
  email: 'user@example.com' 
});
```

### 錯誤邊界 (Error Boundaries)

我們在應用程式的關鍵層級設置了錯誤邊界：
- **應用程式級別**：捕捉整個應用程式的未處理錯誤
- **頁面級別**：防止單個頁面的錯誤影響整個應用程式
- **組件級別**：針對關鍵組件的特定錯誤處理

### 最佳實踐

#### 1. 異步操作
總是使用 `useAsyncOperation` 來包裝異步調用：

```typescript
const saveData = wrapAsync(
  async () => {
    // 你的異步操作
  },
  {
    context: '保存資料',
    showSuccess: true,
    retryCount: 1
  }
);
```

#### 2. 手動錯誤處理
對於需要特殊處理的錯誤，使用 ErrorContext：

```typescript
try {
  // 可能失敗的操作
} catch (error) {
  handleApiError(error, '執行特殊操作');
}
```

#### 3. 用戶體驗
- 總是提供清晰的錯誤消息
- 避免技術術語
- 提供解決方案或下一步建議
- 確保用戶不會卡在錯誤狀態

### 開發和調試

#### 測試錯誤處理
在開發環境中，我們提供了錯誤測試工具（右下角的 🐛 按鈕）來測試各種錯誤場景。

#### 錯誤日誌
所有錯誤都會被記錄到控制台和 Sentry，包含：
- 錯誤堆疊追蹤
- 用戶上下文
- 應用程式狀態
- 重現步驟

### 效能考量

我們的錯誤處理系統設計為：
- **輕量級**：最小化對正常操作的影響
- **異步**：錯誤報告不會阻塞 UI
- **節流**：防止錯誤風暴
- **可配置**：可以根據環境調整詳細程度

### 監控和分析

透過 Sentry 儀表板，我們可以：
- 追蹤錯誤趨勢
- 識別最常見的問題
- 監控錯誤解決進度
- 分析用戶影響

這個系統確保我們能夠提供穩定、可靠的用戶體驗，同時快速識別和解決問題。 