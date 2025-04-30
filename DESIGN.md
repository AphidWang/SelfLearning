# Design Guidelines

## Design Philosophy
學習進度追蹤工具強調：
- 學生自主學習體驗
- 清晰的視覺層級
- 直覺的導航系統
- 即時的操作反饋
- 無障礙的介面設計

## Color Palette

### Primary Colors
- Indigo (`#4F46E5`) - 主要操作、強調
- Purple (`#7C3AED`) - 次要強調
- Green (`#10B981`) - 成功狀態
- Red (`#EF4444`) - 錯誤狀態
- Orange (`#F97316`) - 警告狀態

### Neutral Colors
- White (`#FFFFFF`) - 背景
- Gray-50 (`#F9FAFB`) - 次要背景
- Gray-200 (`#E5E7EB`) - 邊框
- Gray-700 (`#374151`) - 文字
- Gray-900 (`#111827`) - 標題

## Typography

### Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

### Text Sizes
- 標題: 
  - H1: 2rem (32px)
  - H2: 1.5rem (24px)
  - H3: 1.25rem (20px)
  - H4: 1.125rem (18px)
- 內文: 1rem (16px)
- 小字: 0.875rem (14px)
- 極小: 0.75rem (12px)

## Components

### Buttons
- Primary: Indigo 背景、白色文字
- Secondary: 白色背景、灰色邊框
- Danger: 紅色背景、白色文字
- Ghost: 透明背景、有色文字

### Cards
- 白色背景
- 柔和陰影
- 圓角 (0.5rem)
- 可選邊框
- AI Assistant Card (漸層背景)
- Progress Card (圓角、陰影)
- Task Card (左側邊框標示)

### Forms
- 清晰的標籤
- 明顯的焦點狀態
- 錯誤提示
- 適時的輔助文字

### Icons
- Lucide React icons
- 統一尺寸
- 語意化顏色
- 明確用途
- 固定使用 size={20} 於 Sidebar
- 固定使用 className="h-4 w-4" 或 "h-5 w-5" 於內容區

## Layout

### Spacing
- 基本單位: 0.25rem (4px)
- 常用間距:
  - 0.5rem (8px)
  - 1rem (16px)
  - 1.5rem (24px)
  - 2rem (32px)

### Breakpoints
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

### Grid System
- 12 欄網格
- 響應式布局
- 一致的間距

## Interaction States

### Hover
- 輕微背景變化
- 顏色強度增加
- 適當的縮放效果

### Focus
- 可見的外框
- 高對比度
- 鍵盤可訪問

### Active
- 顏色加深
- 縮小效果
- 即時反饋

## Animation

### Transitions
- 持續時間: 150ms-300ms
- 時間曲線: ease-in-out
- 應用於:
  - 顏色變化
  - 透明度
  - 變形效果

### Loading States
- 骨架屏
- 載入指示器
- 進度提示

## Accessibility

### Color Contrast
- 符合 WCAG 2.1 AA 標準
- 文字最小對比度 4.5:1
- 大型文字最小對比度 3:1

### Interactive Elements
- 清晰的焦點提示
- 足夠的觸控區域
- 有意義的標籤

### Dark Mode
- 保持對比度
- 降低眼睛疲勞
- 一致的層級關係