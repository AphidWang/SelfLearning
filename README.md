# Learning Progress Tracking Tool

一個以學生為中心的學習進度追蹤平台，強調自主學習、目標設定與個人化學習路徑。

## 核心理念

- 學習從自己開始
- 學生自主性優先
- 生活即學習
- 彈性學習路徑
- 導師引導支持

## 主要功能

### 學生
- AI 輔助學習規劃
- 目標追蹤與分解
- 學習進度分析
- 學習規劃與目標設定
- 課表管理
- 任務追蹤
- 學習日誌
- 進度回顧

### 導師
- 學習地圖設計
- 週期任務規劃
- 學生進度監控
- 課程規劃工具
- 任務管理
- 週期規劃

## 快速開始

### 環境需求
- Node.js 18+
- npm 或 yarn

### 安裝步驟
```bash
# 安裝依賴
npm install

# 開發環境
npm run dev
```

### 環境設定
```env
VITE_APP_TITLE=Learning Progress Tracker
VITE_API_URL=http://localhost:3000
VITE_GA_ID=<your-ga-id>
```

`VITE_API_URL` 用於設定前端存取後端 API 的端點。

## 技術架構
- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

## 專案文件
- `ARCHITECTURE.md`: 詳細的技術架構說明
- `DESIGN.md`: 設計系統規範

## 專案規則

- 所有 Supabase RPC function 新增、修改、棄用，必須同步更新 SUPABASE_RPC_FUNCTIONS.md，確保文件與資料庫一致。

## 授權
MIT License
