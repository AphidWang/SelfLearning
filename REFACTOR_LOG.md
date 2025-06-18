# 架構重構紀錄：Goal → Topic

## 概述
**日期：** 2024年（當前時間）  
**Commit：** 6eddcf0  
**重構類型：** 架構層級調整

## 重構目標
將原本以 Goal 為頂層概念的架構，重構為以 Topic 為頂層概念的學習管理系統。

## 架構變更

### 前：Goal-based 架構
```
Goal
├── Steps
    └── Tasks
```

### 後：Topic-based 架構  
```
Topic
├── Goals
    └── Tasks
```

## 檔案重命名對照表

| 原檔案名 | 新檔案名 | 說明 |
|---------|---------|------|
| `GoalDashboard.tsx` | `TopicDashboard.tsx` | 主題儀表板 |
| `GoalDashboardCard.tsx` | `TopicDashboardCard.tsx` | 主題卡片組件 |
| `GoalDashboardDialog.tsx` | `TopicDashboardDialog.tsx` | 主題儀表板對話框 |
| `GoalDetails.tsx` | `TopicDetails.tsx` | 主題詳情組件 |
| `GoalDetailsDialog.tsx` | `TopicDetailsDialog.tsx` | 主題詳情對話框 |
| `GoalOverviewDialog.tsx` | `TopicOverviewDialog.tsx` | 主題總覽對話框 |
| `GoalOverviewExample.tsx` | `TopicOverviewExample.tsx` | 主題總覽範例 |
| `GoalProgressDialog.tsx` | `TopicProgressDialog.tsx` | 主題進度對話框 |
| `GoalRadialMap.tsx` | `TopicRadialMap.tsx` | 主題放射狀地圖 |
| `GoalReviewPage.tsx` | `TopicReviewPage.tsx` | 主題回顧頁面 |
| `GoalMindmapOverviewDialog.tsx` | `TopicMindmapOverviewDialog.tsx` | 主題心智圖總覽 |

## 新增檔案

- `topicStore.ts` - Topic 狀態管理
- `topics.ts` - Topic 常數定義
- `TopicDetails.tsx` - 新的主題詳情組件
- `TopicDetailsDialog.tsx` - 新的主題詳情對話框

## 主要程式碼變更

### 1. TopicDetailsDialog 行為統一
- 修復關閉問題：增加遮罩點擊關閉功能
- 統一任務點擊行為：使用 TaskDetailDialog
- 保持與原 GoalDetailsDialog 相同的 UX

### 2. TopicDetails 佈局調整
- 移除複雜的任務列表切換邏輯
- 簡化為單一目標網格視圖（類似原 GoalDetails 的步驟網格）
- 點擊目標直接觸發 TaskDetailDialog

### 3. TopicReviewPage 修復
- 修復變數命名：`selectedStep` → `selectedGoal`
- 保持功能完整性

### 4. Store 層級調整
```typescript
// 新增 topicStore.ts
export const useTopicStore = create<TopicStore>((set, get) => ({
  topics: [],
  getActiveGoals: (topicId: string) => { /* 實作 */ },
  addGoal: (topicId: string, goal: Goal) => { /* 實作 */ },
  // ... 其他方法
}));
```

### 5. 類型定義更新
```typescript
// types/goal.ts 更新
export interface Topic {
  id: string;
  title: string;
  description: string;
  goals: Goal[];
  // ... 其他屬性
}
```

## 相容性處理

為確保平滑過渡，保留了相容性導出：

```typescript
// TopicDetails.tsx
export const GoalDetails = TopicDetails;
export type { TopicDetailsProps as GoalDetailsProps };

// TopicDetailsDialog.tsx  
export const GoalDetailsDialog = TopicDetailsDialog;
export type { TopicDetailsDialogProps as GoalDetailsDialogProps };
```

## 測試重點

1. **功能完整性**
   - [ ] 主題儀表板正常顯示
   - [ ] 主題詳情對話框可正常開關
   - [ ] 任務點擊觸發 TaskDetailDialog
   - [ ] 主題回顧頁面功能正常

2. **UX 一致性**
   - [ ] 與原 Goal 系統相同的操作體驗
   - [ ] 視覺樣式保持一致
   - [ ] 動畫和交互效果正常

3. **資料流**
   - [ ] topicStore 狀態管理正常
   - [ ] Topic → Goals → Tasks 資料結構正確
   - [ ] CRUD 操作功能完整

## 後續工作

1. 清理舊的 Goal 相關程式碼（如果確認不再需要）
2. 更新相關文檔和註解
3. 考慮是否需要資料庫 migration（如果有後端）
4. 更新測試案例以反映新架構

## 風險評估

- **低風險：** 保留了相容性導出，原有引用仍可正常工作
- **中風險：** 新的 Store 結構可能需要額外測試
- **注意事項：** 確保所有 Topic 相關的 CRUD 操作都正確實作

## 參考資料

- Commit: 6eddcf0
- 相關 Issue/PR: （如果有的話）
- 設計文檔: （如果有的話） 