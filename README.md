# 🎓 Self Learning Platform

一個以學生為中心的學習進度追蹤與課程紀錄平台，強調自主學習、目標設定與個人化學習路徑。

## 核心理念

- 學習從自己開始
- 學生自主性優先
- 生活即學習
- 彈性學習路徑
- 導師引導支持

## 📋 專案概述

本專案是一個 **monorepo** 架構，包含多個應用程式：

- **`apps/kid-platform`** (新) - 給老師/教練/小朋友使用的課程紀錄與溝通平台
- **`apps/client`** (Legacy) - 原有的學習進度追蹤系統（參考用）
- **`apps/server`** - 共用的後端 API 服務

---

## 🏗️ Monorepo 架構

```
SelfLearningPlatform/
├── apps/
│   ├── kid-platform/      # 🆕 新平台（主要開發）
│   │   ├── src/
│   │   │   ├── app/              # 路由頁面
│   │   │   │   ├── (teacher)/    # 老師功能
│   │   │   │   ├── (coach)/      # 教練功能
│   │   │   │   └── (student)/    # 小朋友功能
│   │   │   ├── components/
│   │   │   │   ├── ui/           # shadcn/ui 基礎元件
│   │   │   │   ├── kid-friendly/ # 小朋友優化元件
│   │   │   │   └── shared/       # 跨功能共用元件
│   │   │   ├── lib/
│   │   │   │   ├── i18n/         # 國際化系統
│   │   │   │   ├── utils/        # 工具函數
│   │   │   │   └── validations/  # yup 驗證 schemas
│   │   │   ├── hooks/            # 自訂 hooks
│   │   │   ├── store/            # Zustand stores
│   │   │   └── services/         # API 服務
│   │   └── package.json
│   │
│   ├── client/            # ⚠️ Legacy（參考用）
│   │   └── ...            # 原有系統，不再主動開發
│   │
│   └── server/            # 🔧 共用後端 API
│       ├── src/
│       │   ├── routes/    # API 路由
│       │   └── services/  # 業務邏輯
│       └── package.json
│
├── packages/              # 共用套件（未來擴充）
├── .cursor/
│   └── rules/             # Cursor AI 開發規範
│       ├── tools.mdc
│       └── kid-platform.mdc
└── package.json           # 根目錄配置
```

### 新舊 App 關係

- **`apps/kid-platform`** (新)
  - ✅ **主要開發目標**
  - 使用現代化的技術棧和設計系統
  - 統一的元件庫（shadcn/ui）
  - 完整的 i18n 字串管理系統
  - 針對小朋友優化的 UI/UX

- **`apps/client`** (Legacy)
  - ⚠️ **標記為 Legacy，僅供參考**
  - 保留原有功能作為參考
  - 不再進行新功能開發
  - 可參考其業務邏輯和資料結構
  - 未來可能逐步遷移到新平台

- **`apps/server`** (共用)
  - 🔧 **共用後端服務**
  - 提供 API 給所有前端應用
  - 包含認證、資料庫操作、業務邏輯等

---

## 🚀 快速開始

### 環境需求

- **Node.js** 18+
- **Yarn** 4.9.2+ (使用 yarn，不是 pnpm)
- **Supabase** 帳號（資料庫和認證）

### 安裝步驟

```bash
# 1. Clone 專案
git clone <repo-url>
cd SelfLearningPlatform

# 2. 安裝所有依賴（monorepo）
yarn install

# 3. 設定環境變數
# 複製 .env.example 並填入你的 Supabase 設定
cp .env.example .env
```

### 開發指令

```bash
# 開發新平台（kid-platform）- Port 5174
yarn dev:kid-platform
# 或
cd apps/kid-platform && yarn dev
# 開啟 http://localhost:5174

# 開發 Legacy Client - Port 5173
yarn dev:client
# 或
cd apps/client && yarn dev
# 開啟 http://localhost:5173

# 開發後端（server）- Port 5200
yarn dev:server
# 或
cd apps/server && yarn dev
# API 在 http://localhost:5200

# 同時啟動新平台和後端（預設）
yarn dev
# 新平台: http://localhost:5174
# Server: http://localhost:5200

# 同時啟動 Legacy Client 和後端
yarn dev:legacy
# Legacy Client: http://localhost:5173
# Server: http://localhost:5200

# 建置所有專案
yarn build
```

**Port 分配**：
- **5173** - Legacy Client (`apps/client`)
- **5174** - 新平台 (`apps/kid-platform`)
- **5200** - 後端 Server (`apps/server`)

---

## 🧩 Tech Stack

> ⚠️ **Tech Stack 正在討論中，以下為初步規劃**

### 新平台 (kid-platform)

#### 核心框架
- **[React 18](https://react.dev/)** – UI 框架
- **[TypeScript](https://www.typescriptlang.org/)** – 類型安全
- **[Vite](https://vitejs.dev/)** – 建置工具
- **[React Router](https://reactrouter.com/)** – 路由管理

#### UI 與樣式
- **[Shadcn/UI](https://ui.shadcn.com/)** – 可重用、無障礙的元件庫（基於 Radix UI）
- **[Tailwind CSS](https://tailwindcss.com/)** – 工具優先的 CSS 框架
- **[Lucide React](https://lucide.dev/)** – 圖示庫

#### 表單與驗證
- **[React Hook Form](https://react-hook-form.com/)** – 高效能表單管理
- **[Yup](https://github.com/jquense/yup)** – Schema 驗證

#### 狀態管理
- **[Zustand](https://zustand-demo.pmnd.rs/)** – 輕量級狀態管理

#### 國際化
- **自訂 i18n 系統** – 字串管理與多語言支援

#### 後端整合
- **[Supabase](https://supabase.com/)** – 資料庫與認證
- **[Axios](https://axios-http.com/)** – HTTP 客戶端

### 後端 (server)

- **Node.js** + **Express**
- **TypeScript**
- **Supabase** (資料庫與認證)

### Legacy (client)

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- 其他舊有技術棧

---

## 📁 專案結構詳解

### 新平台 (kid-platform)

```
apps/kid-platform/src/
├── app/                    # 路由頁面
│   ├── (teacher)/         # 老師功能
│   │   ├── _components/    # 僅此功能使用的元件
│   │   ├── _widgets/      # 僅此功能使用的 widgets
│   │   └── _store/        # 僅此功能使用的 store
│   ├── (coach)/           # 教練功能
│   └── (student)/         # 小朋友功能
│
├── components/
│   ├── ui/                # shadcn/ui 基礎元件
│   ├── kid-friendly/      # 針對小朋友優化的元件變體
│   └── shared/            # 跨功能共用元件
│
├── lib/
│   ├── i18n/              # 國際化系統
│   │   ├── strings/       # 字串定義（方便專家修改）
│   │   │   ├── common.ts
│   │   │   ├── student.ts
│   │   │   ├── teacher.ts
│   │   │   └── coach.ts
│   │   └── locales/       # 語言包
│   ├── utils/             # 工具函數
│   └── validations/        # yup schemas
│
├── hooks/                  # 自訂 React hooks
├── store/                  # Zustand stores（跨功能共用）
├── services/               # API 服務
└── types/                  # TypeScript 類型定義
```

---

## 🎨 設計系統

### 元件規範

- **優先使用 Shadcn UI** – 所有基礎元件都從 shadcn/ui 取得
- **Typography 元件** – 統一管理所有文字樣式
- **Kid-Friendly 變體** – 針對小朋友的大按鈕、鮮豔顏色、簡單操作

### 字串管理

所有字串都定義在 `lib/i18n/strings/` 目錄下，方便專家直接修改，無需改程式碼。

```tsx
// 使用方式
import { useI18n } from '@/lib/i18n';

const { t } = useI18n();
<Typography>{t('student.welcome.title')}</Typography>
```

### 表單驗證

使用 React Hook Form + Yup：

```tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { studentProfileSchema } from '@/lib/validations/forms';
```

---

## 📚 開發規範

### Cursor Rules

專案使用 Cursor AI 進行開發，規範文件位於：

- `.cursor/rules/tools.mdc` – 通用工具規範
- `.cursor/rules/kid-platform.mdc` – 新平台開發規範
- `.cursor/rules/code-review.mdc` – Code Review 檢查指南

### Code Review

所有 PR 和 commit 都需要通過 Code Review 檢查。詳見：

- **[.cursor/rules/code-review.mdc](.cursor/rules/code-review.mdc)** – 完整的檢查清單和指令

**快速檢查**：
1. 使用 Shadcn UI 組件（不是自定義）
2. 使用 Typography 組件（不是原生 HTML 標籤）
3. 使用 i18n 字串（不是硬編碼）
4. 不使用 inline styles（除非動態值）
5. 使用標準 Tailwind classes
6. 使用品牌色彩
7. 組件放在正確位置（feature-specific vs shared）
8. Store 使用正確（feature-specific vs shared）
9. 表單使用 React Hook Form + yup
10. 元件大小符合規範（< 200 行，< 5 useState，< 3 useEffect）
11. 不使用 `any` 類型
12. 移除 console.log

### 程式碼品質

- **元件大小**：單一元件 < 200 行
- **狀態管理**：最多 5 個 useState per component
- **Hooks**：最多 3 個 useEffect per component
- **邏輯分離**：複雜邏輯提取到 hooks/utils

詳見 `.cursor/rules/kid-platform.mdc`

---

## 🔐 環境變數

### 新平台 (kid-platform)

```env
VITE_API_URL=http://localhost:5200
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 後端 (server)

```env
PORT=5200
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🧪 測試

```bash
# 執行所有測試
yarn test

# 執行特定專案的測試
cd apps/kid-platform && yarn test
```

---

## 📖 文件

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** – 技術架構說明
- **[DESIGN.md](./DESIGN.md)** – 設計系統規範（Legacy）
- **[apps/kid-platform/README.md](./apps/kid-platform/README.md)** – 新平台詳細說明
- **[apps/kid-platform/EXAMPLES.md](./apps/kid-platform/EXAMPLES.md)** – 使用範例

---

## 🚧 開發狀態

### ✅ 已完成

- [x] Monorepo 架構設定
- [x] 新平台基礎結構
- [x] i18n 字串管理系統
- [x] Typography 元件
- [x] Kid-Friendly 元件變體
- [x] Yup 驗證系統
- [x] Cursor Rules 規範

### 🚧 進行中

- [ ] Shadcn UI 元件安裝與設定
- [ ] 認證系統整合
- [ ] 路由設定
- [ ] 第一個功能頁面

### 📋 待規劃

- [ ] Tech Stack 最終確認
- [ ] 資料庫 Schema 設計
- [ ] API 端點規劃
- [ ] 部署流程

---

## 🤝 貢獻指南

1. 新功能開發請在 `apps/kid-platform` 進行
2. 遵循 `.cursor/rules/kid-platform.mdc` 規範
3. 所有字串修改請在 `lib/i18n/strings/` 進行
4. 元件優先使用 shadcn/ui
5. **提交 PR 前，請執行 Code Review 檢查**（見 `.cursor/rules/code-review.mdc`）

---

## 📝 授權

MIT License

---

## 🔗 相關連結

- [Supabase 文件](https://supabase.com/docs)
- [Shadcn UI 文件](https://ui.shadcn.com/)
- [React Hook Form 文件](https://react-hook-form.com/)
- [Tailwind CSS 文件](https://tailwindcss.com/docs)
