# 測試檔案

這個資料夾包含所有的測試檔案，用於測試 SelfLearningPlatform 的各個功能模組。

## 運行測試

### 運行所有測試
```bash
yarn test
```

### 運行特定測試檔案
```bash
yarn test tests/test-topic-store.test.ts
yarn test tests/test-topic-template-store.test.ts
```

### 監視模式運行測試
```bash
yarn test --watch
```

## 測試檔案說明

### `test-topic-store.test.ts`
測試 Topic Store 的功能，包括：
- 基本 CRUD 操作（創建、讀取、更新、刪除主題）
- 目標管理（新增、更新、刪除目標）
- 任務管理（新增、更新、刪除任務）
- 協作功能（切換協作狀態）

### `test-topic-template-store.test.ts`
測試 Topic Template Store 的功能，包括：
- 基本 CRUD 操作（創建、讀取、更新、刪除模板）
- 目標管理（新增、更新、刪除目標）
- 公開設定（切換公開狀態）

## 類型修復說明

測試中使用的類型已經修復，確保與實際的類型定義一致：

- **TopicType**: 使用 `'學習目標'` 而不是 `'personal'`
- **GoalStatus**: 使用 `'todo'` 而不是 `'pending'`
- **TaskStatus**: 使用 `'todo'` 而不是 `'pending'`
- **Task 屬性**: 使用 `dueDate` 而不是 `due_date`

## 測試環境

- 使用 Vitest 作為測試框架
- 使用 jsdom 環境模擬瀏覽器環境
- 自動清理測試資料，確保測試之間不會相互影響

## 新增測試

要新增新的測試檔案，請：

1. 在 `tests/` 資料夾中創建新的 `.test.ts` 檔案
2. 遵循現有的測試結構和命名規範
3. 確保在測試後清理測試資料
4. 使用正確的類型定義 