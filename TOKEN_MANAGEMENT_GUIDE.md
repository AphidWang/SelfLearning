# Token 管理系統使用指南

## 概述

這個系統提供了完整的 token 生命週期管理，包括：
- 自動 token 刷新
- 過期檢測和處理
- 無感知重試機制
- 用戶友好的錯誤處理

## 架構組件

### 1. TokenManager (`tokenManager.ts`)
- 核心 token 管理邏輯
- 自動刷新機制
- 事件通知系統

### 2. HttpInterceptor (`httpInterceptor.ts`)
- 包裝 Supabase 查詢
- 自動重試失敗的請求
- Storage 操作處理

### 3. AuthContext (`AuthContext.tsx`)
- 全域認證狀態管理
- React 上下文整合
- 路由保護

### 4. Server Middleware (增強的 `auth.ts`)
- 更好的錯誤響應
- Token 健康檢查
- 過期警告

## 使用方法

### 1. 更新現有 Store

將現有的 Supabase 查詢包裝在 `httpInterceptor` 中：

```typescript
// 原本的查詢
const { data, error } = await supabase
  .from('table')
  .select('*');

// 更新後的查詢
const { data, error } = await httpInterceptor.wrapSupabaseQuery(
  () => supabase
    .from('table')
    .select('*')
);
```

對於 Storage 操作：

```typescript
// 原本的上傳
const { data, error } = await supabase.storage
  .from('bucket')
  .upload(path, file);

// 更新後的上傳
const { data, error } = await httpInterceptor.wrapStorageOperation(
  () => supabase.storage
    .from('bucket')
    .upload(path, file)
);
```

### 2. 應用層級整合

在 `App.tsx` 或根組件中使用 `AuthProvider`：

```tsx
import { AuthProvider, ProtectedRoute } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

### 3. 組件中使用

在組件中獲取認證狀態：

```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, tokenStatus, refreshUser, logout } = useAuth();
  
  // 顯示 token 狀態
  if (tokenStatus === 'refreshing') {
    return <div>正在刷新認證...</div>;
  }
  
  if (tokenStatus === 'error') {
    return <div>認證錯誤，請重新登入</div>;
  }
  
  return (
    <div>
      <p>歡迎, {user?.name}!</p>
      <button onClick={logout}>登出</button>
    </div>
  );
}
```

## 更新其他 Store

需要更新的 Store 文件：
- `userStore.ts`
- `topicStore.ts`
- `topicTemplateStore.ts`
- `journalStore.ts`

每個 Store 都需要：
1. 導入 `httpInterceptor`
2. 包裝所有 Supabase 查詢
3. 包裝 Storage 操作

## 錯誤處理

系統會自動處理：
- Token 過期 → 自動刷新
- 刷新失敗 → 顯示通知並跳轉登入
- 網路錯誤 → 自動重試
- 認證錯誤 → 清除狀態並跳轉

## 配置選項

### 重試配置

```typescript
// 自定義重試次數和延遲
const { data, error } = await httpInterceptor.wrapSupabaseQuery(
  () => query,
  { maxRetries: 2, retryDelay: 2000 }
);
```

### Token 刷新時機

Token 會在以下情況自動刷新：
- 距離過期時間少於 5 分鐘
- 收到 401 錯誤
- 主動呼叫 `tokenManager.refreshToken()`

## 監控和除錯

### 控制台日誌

系統會記錄：
- Token 刷新事件
- 認證錯誤
- 重試嘗試

### Token 狀態檢查

```typescript
// 檢查當前 token 狀態
const token = await tokenManager.getValidToken();
console.log('Token 狀態:', token ? '有效' : '無效');
```

### 服務端健康檢查

```bash
# 檢查 token 狀態
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/auth/token-status
```

## 測試場景

1. **Token 過期測試**：
   - 手動修改 localStorage 中的過期 token
   - 觀察自動刷新行為

2. **網路中斷測試**：
   - 模擬網路中斷
   - 觀察重試機制

3. **認證錯誤測試**：
   - 使用無效 token
   - 觀察錯誤處理

## 注意事項

1. **向後兼容**：現有代碼在更新前仍可正常運作
2. **性能影響**：每個請求會有輕微的額外檢查開銷
3. **存儲使用**：Token 存儲在 localStorage 中
4. **並發處理**：多個同時的 token 刷新請求會被合併

## 下一步

建議按以下順序更新：
1. 更新 `userStore.ts`
2. 更新 `topicStore.ts`
3. 更新其他 Store
4. 在主要組件中整合 `AuthProvider`
5. 測試各種錯誤場景 