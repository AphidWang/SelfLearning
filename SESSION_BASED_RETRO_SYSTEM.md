# Session-Based 個人回顧系統

## 概述

新的個人回顧系統採用 session-based 架構，將整個回顧過程作為一個完整的會話來管理，而不是單獨儲存每個答案。這樣可以更好地追蹤用戶的回顧進度，並提供完整的週回顧快照。

## 架構設計

### 資料庫架構

#### 1. `retro_sessions` 表
```sql
- id: uuid (主鍵)
- user_id: uuid (用戶 ID)
- week_id: text (週標識，格式: YYYY-WW)
- questions_drawn: jsonb (抽取的問題列表)
- answers_completed: integer (完成的答案數量)
- status: text (會話狀態: 'active' | 'completed')
- created_at: timestamptz
- updated_at: timestamptz
```

#### 2. `retro_answers` 表 (更新)
```sql
- id: uuid (主鍵)
- user_id: uuid (用戶 ID)
- session_id: uuid (關聯的 session ID) ← 新增
- date: date (答案日期)
- week_id: text (週標識)
- question: jsonb (問題內容)
- is_custom_question: boolean
- custom_question: text
- answer: text (用戶回答)
- mood: text (心情)
- emoji: text (表情符號)
- created_at: timestamptz
- updated_at: timestamptz
```

### RPC 函數

#### 1. `get_or_create_retro_session(p_user_id, p_week_id)`
- 獲取或創建指定週的回顧 session
- 返回完整的 session 數據，包括週統計和所有答案
- 自動計算週開始和結束日期

#### 2. `save_retro_answer(p_session_id, p_question, p_answer, p_mood, ...)`
- 保存答案到指定的 session
- 自動更新 session 的 `answers_completed` 計數
- 驗證用戶權限

#### 3. `update_session_questions(p_session_id, p_questions)`
- 更新 session 的抽取問題記錄
- 用於追蹤用戶抽取了哪些問題

## 前端架構

### RetroStore 更新

新增的 session-based 方法：

```typescript
// 獲取或創建當前週的 session
getCurrentSession: () => Promise<RetroSession | null>

// 保存答案到 session
saveSessionAnswer: (sessionId: string, data: CreateRetroAnswerData) => Promise<RetroAnswer | null>

// 更新 session 的問題記錄
updateSessionQuestions: (sessionId: string, questions: RetroQuestion[]) => Promise<boolean>

// 完成 session
completeSession: (sessionId: string) => Promise<boolean>
```

### 數據流程

1. **載入階段**：
   - 並行載入週統計 (`getCurrentWeekStats`) 和 session (`getCurrentSession`)
   - 從 session 中提取已完成的回顧記錄

2. **問題抽取階段**：
   - 用戶抽取問題後，更新 session 的 `questions_drawn` 欄位
   - 記錄用戶的選擇歷史

3. **回答階段**：
   - 使用 `saveSessionAnswer` 保存答案
   - 自動關聯到當前 session
   - 更新 session 的完成計數

4. **完成階段**：
   - 當用戶完成足夠的回顧（≥2個）時，可以標記 session 為完成狀態

## 使用 UNIX Timestamp

### 時間戳處理

系統中的時間戳使用以下格式：
- **資料庫**: `timestamptz` (PostgreSQL 原生時間戳)
- **前端**: JavaScript `Date` 對象和 ISO 字串
- **API**: ISO 8601 格式字串

### 時區處理

使用專案統一的時區處理函數：
```typescript
import { getTodayInTimezone } from '../config/timezone';

// 獲取台灣時區的今日日期
const today = getTodayInTimezone();
```

## 優勢

### 1. 完整性
- 每個 session 包含完整的週統計快照
- 追蹤用戶的完整回顧過程
- 保留問題抽取歷史

### 2. 一致性
- 所有回顧數據都關聯到特定的 session
- 避免孤立的答案記錄
- 統一的數據管理

### 3. 性能
- 單次查詢獲取完整 session 數據
- 減少前端的多次 API 調用
- 優化的數據結構

### 4. 可擴展性
- 支援未來的功能擴展（如協作回顧、模板等）
- 靈活的 session 狀態管理
- 支援不同類型的回顧會話

## 遷移策略

### 現有數據
- 現有的 `retro_answers` 記錄保持不變
- 新的答案將自動關聯到 session
- 提供回退機制以確保兼容性

### 漸進式採用
- 前端組件支援兩種模式（session-based 和傳統模式）
- 根據數據可用性自動選擇最佳方式
- 平滑的用戶體驗過渡

## 測試驗證

系統已通過以下測試：
- ✅ Session 創建和獲取
- ✅ 答案保存和關聯
- ✅ 自動計數更新
- ✅ 完整數據流程
- ✅ 錯誤處理和回退

## 未來規劃

### 短期目標
- [ ] 添加 session 完成狀態的 UI 指示
- [ ] 實現 session 歷史查看功能
- [ ] 優化數據載入性能

### 長期目標
- [ ] 支援協作回顧 session
- [ ] 添加回顧模板功能
- [ ] 實現跨週的回顧比較
- [ ] 開發回顧分析和洞察功能 