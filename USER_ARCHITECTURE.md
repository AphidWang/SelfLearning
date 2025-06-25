# 用戶管理架構設計

## 🏗️ 架構原則

我們的用戶管理系統遵循以下設計原則：

1. **普通用戶操作**：直接使用 Supabase client
2. **管理其他用戶**：通過 server API 進行特殊權限檢查

## 📁 檔案結構與職責

### 前端 (Client)

#### `apps/client/src/services/supabase.ts`
- **用途**：普通用戶操作
- **功能**：
  - 獲取當前用戶資料
  - 更新自己的個人資料
  - 認證相關操作 (登入、登出、註冊)
- **特點**：直接與 Supabase 通信，不經過 server 層

#### `apps/client/src/store/userStore.ts` 
- **用途**：混合模式 Store
- **功能分類**：
  - **普通操作**：`getCurrentUser()`, `updateCurrentUser()` - 使用 Supabase
  - **管理員操作**：`getUsers()`, `createAuthUser()`, `updateUser()`, `deleteUser()` - 使用 server API
- **設計理由**：
  - 普通操作更高效，直接通信
  - 管理操作需要權限檢查，通過 server 確保安全

### 後端 (Server)

#### `apps/server/src/routes/users.ts`
- **用途**：僅用於管理員功能
- **功能**：
  - 獲取所有用戶列表
  - 創建新用戶（包含認證）
  - 更新其他用戶資料
  - 刪除用戶
  - 搜尋和篩選用戶
- **安全機制**：
  - 使用 `authenticateSupabaseToken` 中間件
  - 權限檢查確保只有授權用戶可以執行管理操作

#### `apps/server/src/services/supabase.ts`
- **用途**：server 端 Supabase 操作
- **功能**：使用 service role key 進行高權限操作
- **權限**：可以管理 auth.users 和執行管理員級別的資料庫操作

## 🔀 資料流程

### 普通用戶操作流程
```
用戶 → userStore.getCurrentUser() → services/supabase.ts → Supabase
用戶 → userStore.updateCurrentUser() → services/supabase.ts → Supabase
```

### 管理員操作流程
```
管理員 → userStore.getUsers() → /api/users → authenticateSupabaseToken → server/services/supabase.ts → Supabase
```

## 🛡️ 安全考量

### 前端權限
- 普通用戶只能操作自己的資料
- Supabase RLS (Row Level Security) 政策確保資料安全
- 只暴露必要的 Supabase 權限

### 後端權限  
- 使用 service role key，擁有完整的 Supabase 權限
- 所有管理員 API 都需要 token 驗證
- 可以實施更細緻的權限控制

## 🚀 優勢

1. **效能優化**：普通操作直接通信，減少網路延遲
2. **安全性**：管理操作通過 server 進行權限檢查
3. **可擴展性**：容易添加新的管理功能和權限控制
4. **清晰分離**：職責明確，易於維護和理解

## 📝 使用範例

### 普通用戶操作
```typescript
// 獲取當前用戶
const user = await useUserStore.getState().getCurrentUser();

// 更新個人資料
await useUserStore.getState().updateCurrentUser({
  name: '新名字',
  avatar: 'new-avatar-url'
});
```

### 管理員操作
```typescript
// 獲取所有用戶 (需要管理員權限)
await useUserStore.getState().getUsers();

// 創建新用戶 (需要管理員權限)
await useUserStore.getState().createAuthUser({
  email: 'new@example.com',
  password: 'password',
  name: '新用戶',
  role: 'student'
});
```

## ⚠️ 注意事項

1. **避免混用**：不要在普通操作中使用 server API
2. **權限檢查**：管理員功能必須確保用戶有適當權限
3. **錯誤處理**：兩種模式的錯誤處理機制不同，需要適當處理
4. **一致性**：確保前端直接操作和後端 API 的資料格式一致

---

最後更新：$(date)
維護者：開發團隊 