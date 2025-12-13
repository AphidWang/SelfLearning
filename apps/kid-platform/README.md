# Kid Platform

給老師/教練/小朋友使用的課程紀錄與溝通平台

## 開發

```bash
# 安裝依賴（從根目錄）
yarn install

# 啟動開發伺服器
cd apps/kid-platform
yarn dev
```

## 架構

詳見 `.cursor/rules/kid-platform.mdc`

## 字串管理

所有字串定義在 `src/lib/i18n/strings/` 目錄下：
- `common.ts` - 通用字串
- `student.ts` - 小朋友相關字串
- `teacher.ts` - 老師相關字串
- `coach.ts` - 教練相關字串

使用方式：
```tsx
import { useI18n } from '@/lib/i18n';

const { t } = useI18n();
<Typography>{t('student.welcome.title')}</Typography>
```

## 元件

- `components/ui/` - shadcn/ui 基礎元件
- `components/kid-friendly/` - 針對小朋友優化的元件變體
- `components/shared/` - 跨功能共用元件

