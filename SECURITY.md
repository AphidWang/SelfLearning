# 安全性指南

## 🔒 環境變數安全性

### 重要原則

**後端環境變數（`process.env`）不會暴露給前端**

- 後端的 `process.env` 變數只在 **Node.js 運行時** 存在
- 前端是**靜態檔案**（HTML/CSS/JS），無法讀取伺服器的 `process.env`
- 前端只能讀取 **build 時內嵌的環境變數**（`VITE_*`）

---

## ✅ 安全的環境變數使用

### 後端環境變數（安全，不會暴露）

這些變數只在伺服器端使用，**絕對不會**被前端訪問：

```typescript
// apps/server/src/services/supabase.ts
const supabaseUrl = process.env.SUPABASE_URL;  // ✅ 安全
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;  // ✅ 安全

// apps/server/src/routes/taiwanese.ts
const openaiApiKey = process.env.OPENAI_API_KEY;  // ✅ 安全

// apps/server/src/services/googleTTS.ts
const privateKey = process.env.GOOGLE_PRIVATE_KEY;  // ✅ 安全
```

**為什麼安全？**
- 這些變數只在 Node.js 運行時存在
- 前端無法執行 Node.js 程式碼
- 前端無法讀取伺服器的環境變數

---

### 前端環境變數（會公開，需要小心）

這些變數會在 **build 時**被內嵌到 JavaScript bundle 中，**任何人都可以看到**：

```typescript
// apps/kid-platform/src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL;  // ⚠️ 會公開，但可以

// apps/client/src/services/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;  // ⚠️ 會公開，但可以
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;  // ⚠️ 會公開，但可以
```

**為什麼可以公開？**
- `VITE_API_URL`：只是配置，公開沒問題
- `VITE_SUPABASE_ANON_KEY`：Supabase 的 Anon Key **設計上就是可以公開的**
  - 它受到 Row Level Security (RLS) 保護
  - 只能執行 RLS 允許的操作

---

## ❌ 危險的做法

### 1. 不要把後端敏感變數傳給前端

```typescript
// ❌ 危險：把 Service Role Key 傳給前端
app.get('/api/config', (req, res) => {
  res.json({
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY  // 危險！
  });
});

// ✅ 正確：只傳公開的配置
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,  // 可以
    anonKey: process.env.SUPABASE_ANON_KEY  // 可以（如果設計上可以公開）
  });
});
```

### 2. 不要在前端使用 `VITE_` 前綴的敏感變數

```typescript
// ❌ 危險：Service Role Key 不應該用 VITE_ 前綴
VITE_SUPABASE_SERVICE_ROLE_KEY=xxx  // 危險！會被內嵌到 bundle

// ✅ 正確：Service Role Key 只在後端使用
SUPABASE_SERVICE_ROLE_KEY=xxx  // 安全（只在 server 端）
```

### 3. 不要在程式碼中硬編碼敏感資訊

```typescript
// ❌ 危險：硬編碼 API Key
const apiKey = 'sk-1234567890abcdef';

// ✅ 正確：使用環境變數
const apiKey = process.env.OPENAI_API_KEY;
```

---

## 🛡️ 安全性檢查清單

### 後端檢查

- [ ] 確認所有敏感變數（Service Role Key, API Keys）都使用 `process.env`，不用 `VITE_` 前綴
- [ ] 確認沒有 API endpoint 會回傳敏感資訊給前端
- [ ] 確認 CORS 設定正確，只允許信任的來源
- [ ] 確認所有 API 都有適當的認證和授權檢查

### 前端檢查

- [ ] 確認只使用 `VITE_*` 環境變數（這些會公開）
- [ ] 確認沒有硬編碼敏感資訊（API Keys, Secrets）
- [ ] 確認 Supabase Anon Key 的使用符合 RLS 規範
- [ ] 確認 API URL 使用相對路徑或環境變數（不要硬編碼）

---

## 📋 環境變數分類

### 🔴 絕對不能公開（只在後端使用）

```env
# 後端專用（不要用 VITE_ 前綴）
SUPABASE_SERVICE_ROLE_KEY=xxx        # 危險！有完整資料庫權限
OPENAI_API_KEY=xxx                   # 危險！會產生費用
GOOGLE_PRIVATE_KEY=xxx               # 危險！Google 服務權限
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx     # 危險！
HUGGING_FACE_API_KEY=xxx             # 危險！會產生費用
SUPABASE_PASSWORD=xxx                # 危險！資料庫密碼
```

### 🟡 可以公開（但需要 RLS 保護）

```env
# 前端可以使用（VITE_ 前綴）
VITE_SUPABASE_URL=xxx               # 可以公開
VITE_SUPABASE_ANON_KEY=xxx           # 可以公開（有 RLS 保護）
VITE_API_URL=xxx                     # 可以公開（只是配置）
```

---

## 🔍 如何檢查是否有洩漏？

### 1. 檢查建置後的 bundle

```bash
# 建置前端
cd apps/kid-platform && yarn build

# 搜尋敏感關鍵字
grep -r "service.*role\|SERVICE.*ROLE" apps/kid-platform/dist/
grep -r "sk-" apps/kid-platform/dist/  # OpenAI API Key 格式
```

### 2. 檢查前端程式碼

```bash
# 搜尋是否有使用後端環境變數
grep -r "process\.env" apps/kid-platform/src/
grep -r "process\.env" apps/client/src/
```

### 3. 檢查 API 回應

```bash
# 檢查 API 是否回傳敏感資訊
curl https://selflearning.zeabur.app/api/config
```

---

## 🎯 最佳實踐

### 1. 使用相對路徑（最安全）

如果前端和後端在同一個 domain，使用相對路徑：

```typescript
// ✅ 最佳：使用相對路徑
const api = axios.create({
  baseURL: '/api'  // 不需要知道完整 URL
});
```

這樣：
- 不需要設定 `VITE_API_URL`
- 自動使用當前 domain
- 更安全，不會有跨域問題

### 2. 環境變數命名規範

```env
# 後端專用（不用 VITE_ 前綴）
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=xxx

# 前端可用（用 VITE_ 前綴）
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_URL=xxx  # 或使用相對路徑 '/api'
```

### 3. 使用 Supabase RLS

- **Anon Key**：可以公開，但所有操作都受 RLS 保護
- **Service Role Key**：絕對不能公開，只在後端使用

---

## ⚠️ 當前部署架構的安全性

### 你的設定：前端和後端在同一個 domain

```
https://selflearning.zeabur.app/
├── /api/*          → 後端處理（process.env 安全）
└── /*              → 前端靜態檔案（VITE_* 會公開）
```

**安全性評估**：

✅ **安全的部分**：
- **後端的 `process.env` 變數不會暴露給前端**
  - 這些變數只在 Node.js 運行時存在
  - 前端是靜態檔案，無法讀取伺服器的環境變數
  - 檢查結果：沒有 API endpoint 會回傳敏感環境變數
- 前端只能看到 build 時內嵌的 `VITE_*` 變數
- 如果使用相對路徑 `/api`，不需要設定 `VITE_API_URL`（更安全）

⚠️ **需要注意的部分**：
- 確認 Supabase RLS 設定正確（保護 Anon Key 的使用）
- 確認 CORS 設定正確（只允許信任的來源）
- 確認所有 API 都有適當的認證檢查

### 檢查結果

✅ **已檢查**：沒有發現 API endpoint 會回傳敏感環境變數給前端
- `SUPABASE_SERVICE_ROLE_KEY`：只在後端使用 ✅
- `OPENAI_API_KEY`：只在後端使用 ✅
- `GOOGLE_PRIVATE_KEY`：只在後端使用 ✅
- 所有敏感變數都使用 `process.env`，不用 `VITE_` 前綴 ✅

---

## 🔒 建議的改進

### 1. 使用相對路徑（推薦，已實作）

```typescript
// apps/kid-platform/src/services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',  // 相對路徑優先
  // 如果同 domain，不需要設定 VITE_API_URL
});
```

**優點**：
- 不需要知道後端的完整 URL
- 自動使用當前 domain
- 更安全，不會有跨域問題
- 不需要設定環境變數

### 2. 檢查 API 回應

確認沒有 API 會回傳敏感資訊：

```typescript
// ❌ 危險
app.get('/api/config', (req, res) => {
  res.json({
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });
});
```

### 3. 使用環境變數驗證

在 server 啟動時檢查必要的環境變數：

```typescript
// apps/server/src/index.ts
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ 缺少必要的環境變數: ${varName}`);
    process.exit(1);
  }
});
```

---

## 📚 參考資源

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
