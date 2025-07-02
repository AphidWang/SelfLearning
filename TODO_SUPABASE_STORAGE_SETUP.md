# Supabase Storage 頭像設置狀態

## ✅ 已完成的功能

### 📦 後端設置
- **Storage Bucket**：使用現有的 `uploads` bucket (公開、無限制)
- **RLS Policies**：已驗證現有策略完全支持頭像上傳需求
  - ✅ 用戶可以上傳文件到自己的文件夾
  - ✅ 用戶可以刪除自己的文件  
  - ✅ 公開讀取權限 (適合頭像訪問)
  - ✅ 用戶隔離保護 (通過 `auth.uid()` 匹配文件夾)

### 🎨 前端實現
- **`avatarService`**：完整的頭像管理服務
  - ✅ 文件驗證 (類型: JPEG/PNG/WebP/GIF/SVG, 大小: ≤2MB, 尺寸: ≤2048px)
  - ✅ 安全上傳 (用戶隔離路徑: `{userId}/avatar_{timestamp}.{ext}`)
  - ✅ URL 管理和圖片轉換功能
  
- **`AvatarUpload` 組件**：現代化上傳界面
  - ✅ 拖拽上傳支持
  - ✅ 實時預覽和進度條
  - ✅ 友善的錯誤處理和成功反饋
  - ✅ 響應式設計和動畫效果

- **`UserProfileDialog` 集成**：
  - ✅ 頭像模式切換 (預設頭像 vs 自定義上傳)
  - ✅ 無縫整合現有預設頭像功能
  - ✅ 統一的用戶體驗

### 🔒 安全措施
- ✅ **前端驗證**：文件類型、大小、尺寸檢查
- ✅ **用戶隔離**：每個用戶只能訪問自己的文件夾
- ✅ **RLS 保護**：資料庫級別的權限控制
- ✅ **安全路徑**：使用 UUID 和時間戳避免衝突和猜測
- ✅ **錯誤處理**：完整的錯誤捕獲和用戶提示

### 📝 TypeScript 支持
- ✅ 完整的類型定義
- ✅ 編譯時檢查通過
- ✅ IntelliSense 支持

## 🚀 使用方式

### 在 UserProfileDialog 中使用
```tsx
// 用戶現在可以在個人資料對話框中：
// 1. 點擊頭像模式切換按鈕選擇 "上傳照片"
// 2. 拖拽圖片文件到上傳區域，或點擊選擇文件
// 3. 系統會自動驗證文件並顯示預覽
// 4. 上傳成功後自動更新用戶頭像
```

### 單獨使用 AvatarUpload 組件
```tsx
import { AvatarUpload } from './components/user-manager/AvatarUpload';

<AvatarUpload
  currentAvatar={user?.avatar}
  onUploadSuccess={(url) => {
    // 處理上傳成功
    console.log('新頭像URL:', url);
  }}
  onUploadError={(error) => {
    // 處理上傳錯誤
    console.error('上傳失敗:', error);
  }}
  userId={user.id}
  disabled={loading}
/>
```

### 存儲路徑範例
```
uploads/
├── 550e8400-e29b-41d4-a716-446655440000/
│   ├── avatar_1672531200000.jpg
│   └── avatar_1672531400000.png
└── 6ba7b810-9dad-11d1-80b4-00c04fd430c8/
    └── avatar_1672531600000.webp
```

## 🔄 未來優化步驟 (可選)

### 1. 創建專用的 avatars bucket (推薦用於生產環境)

```sql
-- 創建公開的 avatars bucket
-- 可以通過 Dashboard 或使用以下 SQL (需要適當權限)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,  -- 設為公開以便直接訪問
  true,  -- 開啟 AVIF 自動檢測
  2097152,  -- 2MB 文件大小限制
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
);
```

### 2. 設置 RLS Policies

```sql
-- 用戶可以上傳自己的頭像
CREATE POLICY "Users can upload own avatars" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 用戶可以更新自己的頭像
CREATE POLICY "Users can update own avatars"
ON storage.objects 
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 用戶可以刪除自己的頭像
CREATE POLICY "Users can delete own avatars"
ON storage.objects 
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 公開讀取權限 (所有人都可以查看頭像)
CREATE POLICY "Public read access for avatars"
ON storage.objects 
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### 3. 優化設置 (可選)

```sql
-- 為 storage.objects 表創建索引以提升查詢性能
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id_user_folder 
ON storage.objects (bucket_id, (storage.foldername(name))[1]) 
WHERE bucket_id = 'avatars';
```

## 安全考量

### ✅ 已實現的安全措施：
- **文件類型限制**：只允許圖片格式 (JPEG, PNG, WebP, GIF, SVG)
- **文件大小限制**：最大 2MB
- **圖片尺寸限制**：最大 2048x2048 像素
- **用戶隔離**：每個用戶只能上傳到自己的文件夾 `{user_id}/`
- **路徑安全**：使用時間戳避免文件名衝突
- **RLS 保護**：通過 RLS policies 控制訪問權限

### 🔄 未來可考慮的加強措施：
- **CDN 緩存**：Supabase 已內建 CDN，設置適當的 cache-control
- **圖片轉換**：利用 Supabase Image Transformation 自動優化
- **病毒掃描**：如需要可考慮第三方服務
- **內容檢測**：如需要可考慮 AI 內容檢測服務

## 使用方式

### 前端實現：
- ✅ `AvatarUpload` 組件：完整的拖拽上傳界面
- ✅ `avatarService`：處理驗證、上傳、刪除等功能
- ✅ 文件驗證：類型、大小、尺寸檢查
- ✅ 進度顯示：實時上傳進度
- ✅ 錯誤處理：友善的錯誤提示

### 存儲路徑結構：
```
avatars/
├── {user_id_1}/
│   ├── avatar_1672531200000.jpg
│   └── avatar_1672531400000.png
├── {user_id_2}/
│   └── avatar_1672531600000.webp
└── ...
```

## 執行順序

1. **先設置 bucket** (通過 Dashboard 或 MCP)
2. **設置 RLS policies** (通過 SQL 或 MCP)
3. **測試上傳功能**
4. **驗證安全設置**

## 注意事項

- 公開 bucket 意味著任何知道 URL 的人都可以訪問圖片
- 但上傳/修改/刪除仍受 RLS 保護
- 如需要更高安全性，可改用私有 bucket + signed URLs
- 目前選擇公開 bucket 是為了簡化實現和提升性能 