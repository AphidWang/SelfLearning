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

### Gradient Colors (專案特色)
- Orange to Pink: `from-orange-400 to-pink-400` - 主要按鈕、強調元素
- Blue to Purple: `from-blue-400 to-purple-400` - 次要按鈕
- Red to Pink: `from-red-400 to-pink-400` - 危險操作
- Orange to Pink (背景): `from-orange-100 to-pink-100` - 區域背景
- Blue to Purple (背景): `from-blue-50 to-purple-50` - 側邊欄背景

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
- **Primary**: 漸層背景 `bg-gradient-to-r from-orange-400 to-pink-400`，白色文字
- **Secondary**: 漸層背景 `bg-gradient-to-r from-blue-400 to-purple-400`，白色文字
- **Danger**: 漸層背景 `bg-gradient-to-r from-red-400 to-pink-400`，白色文字
- **Ghost**: 透明背景，有色文字，hover 時有背景
- **動畫效果**: 
  - `transition-all duration-200 transform hover:scale-105`
  - `hover:shadow-lg`
  - `rounded-lg`

### Cards
- 白色背景 `bg-white dark:bg-gray-800`
- 柔和陰影 `shadow-lg`
- 圓角 `rounded-lg` 或 `rounded-xl`
- 可選邊框
- **特殊卡片**:
  - AI Assistant Card (漸層背景)
  - Progress Card (圓角、陰影)
  - Task Card (左側邊框標示)
- **動畫**: `hover:shadow-md` 或 `hover:shadow-xl`

### Dialogs & Modals
- **背景遮罩**: `bg-black/50` 或 `bg-black bg-opacity-50`
- **容器**: 
  - 標準: `bg-white dark:bg-gray-800`
  - 高級: `bg-white/95 dark:bg-gray-800/95 backdrop-blur-md` (毛玻璃效果)
- **圓角**: `rounded-xl` 或 `rounded-2xl`
- **陰影**: `shadow-xl` 或 `shadow-2xl`
- **邊框**: 可選用彩色邊框 `border-2 border-orange-200 dark:border-purple-500`
- **動畫**: 
  - Framer Motion with scale + opacity transitions
  - `initial={{ scale: 0.9, opacity: 0 }}`
  - `animate={{ scale: 1, opacity: 1 }}`
  - `transition={{ duration: 0.3, ease: "easeOut" }}`
- **最大寬度**: 根據內容調整 (`max-w-md`, `max-w-2xl`, `max-w-7xl`)
- **響應式**: 在手機上添加 `p-4` padding
- **Header 結構**:
  - 圖示 + 標題組合
  - 圖示使用彩色背景圓角容器 (`p-2 bg-blue-100 dark:bg-blue-900 rounded-lg`)
  - 關閉按鈕位於右上角
  - 底部邊框分隔 (`border-b border-gray-200 dark:border-gray-700`)
  - 可選用漸層背景 (`bg-gradient-to-r from-orange-100 to-pink-100`)
- **Footer**: 按鈕組合，主要動作在右側，使用漸層按鈕
- **z-index**: 使用 `z-50` 或更高值確保在最上層

### Forms
- 清晰的標籤
- 明顯的焦點狀態
- 錯誤提示
- 適時的輔助文字
- **輸入框**: `p-3 border border-gray-300 dark:border-gray-600 rounded-lg`
- **焦點狀態**: `focus:ring-2 focus:ring-blue-500 focus:border-transparent`
- **標籤**: `text-sm font-medium text-gray-700 dark:text-gray-300`
- **選擇框**: 可使用漸層背景 `bg-gradient-to-r from-white/90 to-blue-50/90`

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
- 適當的縮放效果 `hover:scale-105`
- 陰影增強 `hover:shadow-lg`

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
- 時間曲線: ease-in-out 或 ease-out
- 應用於:
  - 顏色變化
  - 透明度
  - 變形效果 `transform`
- **標準動畫類**: `transition-all duration-200 transform hover:scale-105`

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