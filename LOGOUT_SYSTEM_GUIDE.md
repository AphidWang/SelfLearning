# 登出系統使用指南

## 概述

當用戶無法正常使用系統（每一頁都卡住）時，我們提供了多層級的登出解決方案來幫助用戶重置狀態並重新開始。

## 可用的登出方式

### 1. 標準登出路由 `/logout`

**用途**: 完整且用戶友好的登出流程
**URL**: `https://yourdomain.com/logout`

**功能**:
- 執行 Supabase 登出
- 清除所有 localStorage 項目
- 清除 sessionStorage 
- 清除相關 cookies
- 顯示進度和完成狀態
- 自動重定向到登入頁面

**適用場景**: 一般登出需求，想要看到登出進度

### 2. 緊急登出路由 `/emergency-logout`

**用途**: 快速強制清除所有狀態
**URL**: `https://yourdomain.com/emergency-logout`

**功能**:
- 立即清除所有 localStorage
- 立即清除所有 sessionStorage
- 清除所有 cookies
- 直接重定向到登入頁面（無等待）

**適用場景**: 
- 系統嚴重卡住
- 需要快速重置
- 標準登出無法正常工作

### 3. 服務端登出 API

**URL**: `POST /api/auth/logout`
**Headers**: `Authorization: Bearer <token>`

**功能**:
- 在服務端執行 Supabase 登出
- 可以通過其他系統調用

## 清除的數據項目

### localStorage 項目
- `token` - 認證令牌
- `user` - 用戶資料
- `accessToken` - 存取令牌
- `refreshToken` - 刷新令牌
- `supabase.auth.token` - Supabase 認證令牌
- `sb-127-auth-token` - Supabase 本地認證
- `sb-auth-token` - Supabase 認證
- `currentUser` - 當前用戶
- `authUser` - 認證用戶
- `userSession` - 用戶會話
- `authSession` - 認證會話

### Zustand Store 項目
- `topic-store` - 主題商店狀態
- `user-store` - 用戶商店狀態
- `task-store` - 任務商店狀態
- `goal-store` - 目標商店狀態
- `retro-store` - 回顧商店狀態

### 應用快取項目
- `taskRecords` - 任務記錄
- `userPreferences` - 用戶偏好
- `appSettings` - 應用設定

### 其他存儲
- 所有 sessionStorage
- 認證相關的 cookies

## 使用方法

### 對於用戶
1. **正常情況**: 使用應用內的登出按鈕
2. **輕微問題**: 直接訪問 `/logout`
3. **嚴重問題**: 直接訪問 `/emergency-logout`

### 對於開發者
```typescript
// 在代碼中調用
import { authService } from '../services/auth';

// 標準登出
await authService.logout();

// 服務端登出（含本地清除）
await authService.serverLogout();
```

### 對於管理員
可以提供給用戶的救援鏈接：
- 標準登出: `https://yourdomain.com/logout`
- 緊急登出: `https://yourdomain.com/emergency-logout`

## 故障排除

### 如果登出後仍然有問題
1. 確認瀏覽器已完全重新載入頁面
2. 檢查是否有其他標籤頁仍保持登入狀態
3. 清除瀏覽器快取和 cookies
4. 重新啟動瀏覽器

### 如果緊急登出也無法解決
1. 手動清除瀏覽器資料：
   - 開發者工具 → Application → Storage → Clear storage
2. 使用無痕模式測試
3. 聯繫技術支援

## 技術細節

### 清除順序
1. 標記登出狀態（防止事件循環）
2. 執行 Supabase 登出
3. 清除 localStorage
4. 清除 sessionStorage  
5. 清除 cookies
6. 重定向到登入頁面

### 錯誤處理
- 即使某個步驟失敗，也會繼續執行後續步驟
- 提供錯誤訊息但不阻止登出流程
- 確保用戶最終能到達登入頁面

### 安全考量
- 不在 URL 中暴露敏感資訊
- 清除所有可能包含用戶資料的存儲
- 服務端驗證 token 有效性

## 測試建議

1. **模擬卡住狀態**:
   ```javascript
   // 在控制台執行，模擬損壞的狀態
   localStorage.setItem('token', 'invalid-token');
   localStorage.setItem('user', 'invalid-json');
   ```

2. **測試登出功能**:
   - 訪問 `/logout` 確認流程正常
   - 訪問 `/emergency-logout` 確認快速清除
   - 檢查所有存儲是否被清除

3. **驗證重定向**:
   - 確認登出後跳轉到 `/login`
   - 確認無法再訪問受保護的頁面 