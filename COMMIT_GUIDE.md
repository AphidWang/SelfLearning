# 提交指南

## ✅ 應該提交的檔案

### 1. 新平台相關（必須提交）
```
.cursor/rules/code-review.mdc
.cursor/rules/kid-platform.mdc
apps/kid-platform/
README.md
.gitignore
package.json
yarn.lock
```

### 2. 設定檔和文件（應該提交）
```
apps/server/requirements.txt
apps/server/setup-tts.sh
apps/server/TTS_SETUP.md
COURSE_SCHEDULER_SETUP.md
course_scheduler_schema.sql
course_scheduler_schema_v2.sql
```

### 3. 新功能（需要確認）
這些是新的功能檔案，如果已經完成且需要，應該提交：
```
apps/server/src/routes/courseScheduler.ts
apps/server/src/routes/taiwanese.ts
apps/server/src/services/googleCalendar.ts
apps/server/src/services/googleTTS.ts
apps/server/src/services/huggingFaceTTS.ts
apps/server/src/services/itaigi.ts
apps/server/src/services/localTTS.ts
apps/server/src/services/tts_server.py
apps/client/src/pages/mentor/CourseScheduler.tsx
apps/client/src/pages/mentor/components/
apps/client/src/pages/student/LearnTaiwanese.tsx
apps/client/src/services/courseSchedulerApi.ts
```

### 4. Legacy Client 變更（需要確認）
這些是 legacy client 的變更，如果只是小調整可以提交，但如果是大改動可能需要考慮：
```
apps/client/index.html
apps/client/src/App.tsx
apps/client/src/components/layout/Sidebar.tsx
apps/client/src/services/api.ts
apps/server/src/index.ts
apps/server/src/routes/index.ts
apps/server/package.json
```

---

## ❌ 不應該提交的檔案

### 1. 編譯產物（會被 .gitignore 忽略）
```
apps/server/dist/
apps/*/dist/
apps/*/build/
```

### 2. 環境和認證檔案（會被 .gitignore 忽略）
```
apps/client/.env.bak
aphid-*.json
*.credentials.json
```

### 3. Python 虛擬環境（會被 .gitignore 忽略）
```
apps/server/venv/
__pycache__/
*.pyc
```

### 4. 其他（會被 .gitignore 忽略）
```
package-lock.json  # 如果使用 yarn，不需要這個
```

---

## 📋 建議的提交策略

### 方案 A：分階段提交（推薦）

**Commit 1: 新平台基礎架構**
```bash
git add .cursor/rules/
git add apps/kid-platform/
git add README.md
git add .gitignore
git add package.json yarn.lock
git commit -m "feat: 建立新平台基礎架構和開發規範"
```

**Commit 2: 新功能檔案**
```bash
git add apps/server/src/routes/courseScheduler.ts
git add apps/server/src/routes/taiwanese.ts
git add apps/server/src/services/
git add apps/server/requirements.txt
git add apps/server/setup-tts.sh
git add apps/server/TTS_SETUP.md
git add course_scheduler_schema*.sql
git commit -m "feat: 新增課程排程和台語學習功能"
```

**Commit 3: Legacy Client 變更（如果需要）**
```bash
git add apps/client/src/pages/mentor/CourseScheduler.tsx
git add apps/client/src/pages/mentor/components/
git add apps/client/src/pages/student/LearnTaiwanese.tsx
git add apps/client/src/services/courseSchedulerApi.ts
git commit -m "feat(legacy): 新增課程排程和台語學習頁面"
```

### 方案 B: 一次提交所有（簡單但較不清晰）

```bash
# 先確認 .gitignore 已更新
git add .gitignore

# 加入所有應該提交的檔案（排除不應該提交的）
git add .cursor/rules/
git add apps/kid-platform/
git add README.md
git add package.json yarn.lock
git add apps/server/src/
git add apps/server/requirements.txt
git add apps/server/setup-tts.sh
git add apps/server/TTS_SETUP.md
git add course_scheduler_schema*.sql
git add apps/client/src/pages/mentor/CourseScheduler.tsx
git add apps/client/src/pages/mentor/components/
git add apps/client/src/pages/student/LearnTaiwanese.tsx
git add apps/client/src/services/courseSchedulerApi.ts
git add apps/client/index.html
git add apps/client/src/App.tsx
git add apps/client/src/components/layout/Sidebar.tsx
git add apps/client/src/services/api.ts

git commit -m "feat: 建立新平台並新增課程排程和台語學習功能"
```

---

## ⚠️ 注意事項

1. **確認 .gitignore 已更新**：確保不應該提交的檔案已被忽略
2. **檢查敏感資訊**：確認沒有提交認證檔案或 API keys
3. **Legacy 變更**：如果 legacy client 的變更很大，考慮是否需要提交
4. **編譯產物**：`apps/server/dist/` 不應該提交（應該被 .gitignore 忽略）

---

## 🔍 檢查指令

```bash
# 檢查哪些檔案會被提交
git status

# 檢查 .gitignore 是否正確忽略不該提交的檔案
git status --ignored

# 檢查是否有敏感資訊
grep -r "API_KEY\|SECRET\|PASSWORD" --include="*.ts" --include="*.tsx" --include="*.js" apps/

# 檢查檔案大小（避免提交大檔案）
find apps/ -type f -size +1M
```
