# 時區配置改動總結

## 問題背景
用戶反映打卡功能出現誤判，顯示「今天已經打卡了」但實際上沒有打卡過。經調查發現是時區問題：
- 用戶在 UTC+8 時區
- 原本的代碼使用 `new Date().toISOString().split('T')[0]` 獲取日期，這會使用 UTC 時間
- 導致日期判斷不準確

## 解決方案

### 1. 新增時區配置文件
**文件位置**: `apps/client/src/config/timezone.ts`

**主要功能**:
- 統一的時區處理工具
- 預設使用 UTC+8 時區
- 提供多種日期操作函數

**核心函數**:
```typescript
// 獲取當前時區的今天日期
getTodayInTimezone(timezoneOffset = 8): string

// 獲取指定日期在時區中的日期字符串
getDateInTimezone(date: Date, timezoneOffset = 8): string

// 檢查兩個日期是否是同一天
isSameDayInTimezone(date1, date2, timezoneOffset = 8): boolean

// 獲取昨天的日期
getYesterdayInTimezone(timezoneOffset = 8): string

// 計算兩個日期之間的天數差
getDaysDifferenceInTimezone(date1, date2, timezoneOffset = 8): number
```

### 2. 修改受影響的文件

#### 2.1 topicStore.ts
- 打卡檢查邏輯
- 連續打卡計算
- 任務動作記錄
- 累計型任務的日期處理

**修改位置**:
```typescript
// 原本
const today = new Date().toISOString().split('T')[0];

// 修改後
const today = getTodayInTimezone(); // 使用 UTC+8 時區
```

#### 2.2 journalStore.ts
- 日記日期處理
- 今日日記查詢
- 心情統計日期範圍
- 動力趨勢日期範圍

**修改位置**:
```typescript
// 日記日期
const journalDate = entry.date || getTodayInTimezone();

// 今日日記查詢
const today = getTodayInTimezone();

// 統計日期範圍計算
const startDateStr = getTodayInTimezone();
const actualStartDate = new Date(startDateStr);
actualStartDate.setDate(actualStartDate.getDate() - days);
```

#### 2.3 goal.ts
- 任務動作檢查函數中的日期處理

**修改位置**:
```typescript
// 避免循環依賴，直接計算 UTC+8 時間
const now = new Date();
const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
const localTime = new Date(utc + (8 * 3600000)); // UTC+8
const today = localTime.toISOString().split('T')[0];
```

### 3. 調試改進
在打卡檢查邏輯中加入詳細的 console.log，方便調試：

```typescript
console.log('🔍 打卡檢查 (UTC+8):', {
  taskId,
  today,
  checkInDates,
  progressData,
  includes: checkInDates.includes(today)
});
```

## 配置說明

### 時區偏移量
- 目前寫死為 UTC+8 (`APP_TIMEZONE_OFFSET = 8`)
- 未來可以考慮從用戶設定或環境變數讀取

### 向後兼容
- 保留所有現有 API 接口
- 只修改內部的日期計算邏輯
- 不影響現有的數據結構

## 測試建議

1. **打卡功能測試**:
   - 確認在 UTC+8 時區下打卡正常
   - 確認連續打卡計算正確
   - 確認跨日期邊界的情況

2. **日記功能測試**:
   - 確認今日日記查詢正確
   - 確認統計功能的日期範圍正確

3. **跨時區測試**:
   - 在不同時區環境下測試
   - 確認日期計算的一致性

## 未來改進

1. **用戶自定義時區**:
   - 允許用戶設定個人時區
   - 從用戶設定讀取時區偏移量

2. **環境變數配置**:
   - 支援從環境變數讀取預設時區
   - 支援不同部署環境的時區配置

3. **國際化支援**:
   - 支援多語言的日期格式
   - 支援不同地區的日期慣例 