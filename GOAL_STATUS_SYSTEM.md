# 目標狀態系統

## 概述
已將原有的 `focusedGoalIds` 系統改為基於狀態的目標管理系統。

## 目標狀態類型

### 狀態定義
- **`todo`** - 未開始：目標尚未開始，用灰色旗子圖標
- **`pause`** - 暫停：目標暫時擱置，用暫停圖標，琥珀色
- **`focus`** - 當前目標：正在專注進行的目標，用靶心圖標，藍色帶脈動效果
- **`finish`** - 完成：目標已完成，用獎章圖標，綠色
- **`complete`** - 導師標記完成：經導師確認完成，用獎杯圖標，紫色
- **`archived`** - 已歸檔：不再顯示的目標

## 視覺表現

### 圖標和顏色
- `todo`: 灰色 `FlagOff` 圖標
- `pause`: 琥珀色 `Pause` 圖標，淡黃背景
- `focus`: 藍色 `Target` 圖標，淡藍背景，脈動動畫
- `finish`: 綠色 `Award` 圖標，淡綠背景
- `complete`: 紫色 `Trophy` 圖標，淡紫背景

### 動畫效果
- `focus` 狀態有特殊的脈動動畫效果
- 需要幫助的目標仍保留橙色提醒圖標

## API 變更

### 新增方法
- `setGoalStatus(topicId, goalId, status)` - 設置目標狀態
- `getGoalsByStatus(topicId, status)` - 獲取特定狀態的目標
- `getFocusedGoals(topicId)` - 獲取專注狀態的目標（快捷方法）

### 移除方法
- `setFocusedGoals()` - 已移除
- `toggleGoalFocus()` - 已移除

## 數據結構變更

### Topic 接口
- 移除：`focusedGoalIds?: string[]`
- Goal 的 `status` 字段現在使用 `GoalStatus` 類型

### 默認行為
- 沒有設置狀態的目標默認為 `todo`
- `getActiveGoals()` 會自動設置默認狀態

## 使用範例

```typescript
// 設置目標為專注狀態
store.setGoalStatus('topic-1', 'goal-1', 'focus');

// 獲取所有專注中的目標
const focusedGoals = store.getFocusedGoals('topic-1');

// 獲取特定狀態的目標
const pausedGoals = store.getGoalsByStatus('topic-1', 'pause');
```

## 向後兼容性
- 現有的主題數據已自動遷移
- 原有的功能（如 needHelp 標記）保持不變
- RadialMap 組件已更新以支持新的狀態系統 