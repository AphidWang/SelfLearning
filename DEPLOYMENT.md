# 部署指南

## 🚨 Monorepo 部署注意事項

### 潛在問題

1. **根目錄的 `yarn build` 會 build 所有 workspace**
   - 包括 `apps/client`（Legacy）
   - 包括 `apps/kid-platform`（新平台）
   - 包括 `apps/server`（後端）
   - **問題**：如果只需要部署其中一個，會浪費時間和資源

2. **前端和後端需要分開部署**
   - 前端（client 或 kid-platform）需要靜態檔案託管
   - 後端（server）需要 Node.js 運行環境
   - **問題**：不能在同一個服務中同時部署

3. **新平台和 Legacy Client 可能需要不同的部署策略**
   - Legacy Client：可能已經有現有部署
   - 新平台：需要新的部署配置
   - **問題**：需要明確區分部署目標

4. **前端如何連接到後端？**
   - 前端是靜態檔案（HTML/CSS/JS），部署在 CDN
   - 後端是 API 服務，部署在 Server
   - **解決方案**：前端透過環境變數設定 API URL，連接到後端的公開 URL

---

## 📋 部署策略

### 架構說明

**重要**：前端和後端是分開部署的，透過 HTTP API 連接：

```
┌─────────────────┐
│  前端 (CDN)      │  https://your-frontend.com
│  - Legacy       │  (Port 5173 → 靜態檔案)
│  - 新平台        │  (Port 5174 → 靜態檔案)
└────────┬────────┘
         │ HTTP API 請求
         │ (透過環境變數 VITE_API_URL)
         ▼
┌─────────────────┐
│  後端 (Server)   │  https://your-api.com
│  - API Server    │  (Port 5200 → Node.js)
└─────────────────┘
```

**前端如何連接到後端？**

1. 前端建置時，透過環境變數設定 API URL：
   ```env
   VITE_API_URL=https://your-api.com
   ```

2. 前端程式碼使用這個 URL 發送 API 請求：
   ```typescript
   const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5200'
   });
   ```

3. 後端提供公開的 API endpoint（例如：`https://api.yourdomain.com`）

4. 前端部署到 CDN（Vercel/Netlify），後端部署到 Server（Zeabur/Heroku）

---

### 方案 A：分開部署（推薦）

#### 1. 後端 Server 部署

**Zeabur / Heroku / Railway 等 PaaS**

```yaml
# zeabur.yaml (後端)
app:
  name: selflearning-server
  build:
    command: cd apps/server && yarn install && yarn build
  start:
    command: cd apps/server && yarn start
  env:
    - PORT=5200
    - NODE_ENV=production
```

**後端會獲得一個公開 URL**，例如：
- `https://selflearning-server.zeabur.app`
- `https://api.yourdomain.com`

#### 2. 前端部署（Legacy Client）

**Vercel / Netlify / Cloudflare Pages**

```json
// vercel.json
{
  "buildCommand": "cd apps/client && yarn install && yarn build",
  "outputDirectory": "apps/client/dist",
  "installCommand": "yarn install",
  "env": {
    "VITE_API_URL": "https://your-api-server.com"
  }
}
```

**前端會獲得一個公開 URL**，例如：
- `https://legacy-client.vercel.app`
- `https://legacy.yourdomain.com`

#### 3. 前端部署（新平台）

**Vercel / Netlify / Cloudflare Pages**

```json
// vercel.json (新平台)
{
  "buildCommand": "cd apps/kid-platform && yarn install && yarn build",
  "outputDirectory": "apps/kid-platform/dist",
  "installCommand": "yarn install",
  "env": {
    "VITE_API_URL": "https://your-api-server.com"
  }
}
```

**前端會獲得一個公開 URL**，例如：
- `https://kid-platform.vercel.app`
- `https://app.yourdomain.com`

---

### 方案 B：使用 GitHub Actions 自動部署

#### 後端部署 Workflow

```yaml
# .github/workflows/deploy-server.yml
name: Deploy Server

on:
  push:
    branches: [ main ]
    paths:
      - 'apps/server/**'
      - 'package.json'
      - 'yarn.lock'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Enable Corepack
        run: corepack enable
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Build server
        working-directory: apps/server
        run: yarn build
      - name: Deploy to server
        # 你的部署步驟
```

#### 前端部署 Workflow（新平台）

```yaml
# .github/workflows/deploy-kid-platform.yml
name: Deploy Kid Platform

on:
  push:
    branches: [ main ]
    paths:
      - 'apps/kid-platform/**'
      - 'package.json'
      - 'yarn.lock'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Enable Corepack
        run: corepack enable
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Build kid-platform
        working-directory: apps/kid-platform
        run: yarn build
      - name: Deploy to Vercel/Netlify
        # 你的部署步驟
```

---

## 🔧 修正現有部署配置

### 1. 更新 zeabur.yaml（後端專用）

```yaml
# zeabur.yaml
app:
  name: selflearning-server
  build:
    command: cd apps/server && yarn install && yarn build
  start:
    command: cd apps/server && yarn start
  env:
    - PORT=5200
    - NODE_ENV=production
```

### 2. 更新 Procfile（後端專用）

```
web: cd apps/server && yarn install && yarn build && yarn start
```

### 3. 建立前端部署配置

**Vercel 配置** (`vercel.json`)
```json
{
  "buildCommand": "cd apps/kid-platform && yarn install && yarn build",
  "outputDirectory": "apps/kid-platform/dist",
  "installCommand": "yarn install",
  "framework": "vite"
}
```

**Netlify 配置** (`netlify.toml`)
```toml
[build]
  command = "cd apps/kid-platform && yarn install && yarn build"
  publish = "apps/kid-platform/dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 📝 部署檢查清單

### 後端部署

- [ ] 確認 `apps/server` 有正確的 `build` 和 `start` script
- [ ] 確認環境變數已設定（Supabase, API keys 等）
- [ ] 確認 `dist/` 目錄在 .gitignore 中（不提交編譯產物）
- [ ] 確認部署平台支援 Node.js 18+
- [ ] 確認部署平台支援 Yarn 4.9.2

### 前端部署（新平台）

- [ ] 確認 `apps/kid-platform` 有正確的 `build` script
- [ ] 確認 `dist/` 目錄在 .gitignore 中
- [ ] 確認環境變數已設定（API URL, Supabase keys 等）
- [ ] 確認部署平台支援 Vite 建置
- [ ] 確認路由設定正確（SPA 需要 fallback 到 index.html）

### 前端部署（Legacy Client）

- [ ] 確認 `apps/client` 有正確的 `build` script
- [ ] 確認 Sentry sourcemap 上傳設定正確
- [ ] 確認環境變數已設定

---

## 🚀 快速部署指令

### 本地測試建置

```bash
# 測試後端建置
cd apps/server && yarn build

# 測試新平台建置
cd apps/kid-platform && yarn build

# 測試 Legacy Client 建置
cd apps/client && yarn build
```

### 部署到不同平台

```bash
# Zeabur（後端）
# 使用更新後的 zeabur.yaml

# Vercel（前端）
vercel --prod

# Netlify（前端）
netlify deploy --prod
```

---

## ⚠️ 常見問題

### Q: 為什麼 `yarn build` 會 build 所有 app？

A: 因為根目錄的 `package.json` 有 `"build": "yarn workspaces foreach --all run build"`，這會執行所有 workspace 的 build。

**解決方案**：在部署時明確指定要 build 的 app：
```bash
cd apps/server && yarn build  # 只 build server
cd apps/kid-platform && yarn build  # 只 build 新平台
```

### Q: 前端和後端可以部署在同一個服務嗎？

A: 通常不建議，因為：
- 前端是靜態檔案，需要 CDN 託管
- 後端是 Node.js 應用，需要運行環境
- 分開部署可以獨立擴展和更新

**解決方案**：使用不同的部署平台或服務。

### Q: 如何避免部署不需要的 app？

A: 使用 `paths` 過濾器在 GitHub Actions 中，或明確指定 build 目錄。

### Q: 遠端只有一個 port (8080)，前端如何連接到後端？

A: **前端和後端是分開部署的，不是在同一個服務中**：

1. **後端部署**（例如 Zeabur）：
   - 獲得一個公開 URL：`https://api.yourdomain.com` 或 `https://selflearning-server.zeabur.app`
   - 這個 URL 對應後端的 port（內部可能是 5200，但對外是 80/443）

2. **前端部署**（例如 Vercel）：
   - 獲得一個公開 URL：`https://app.yourdomain.com` 或 `https://kid-platform.vercel.app`
   - 前端是靜態檔案，透過 CDN 提供

3. **前端連接後端**：
   - 前端建置時設定環境變數：`VITE_API_URL=https://api.yourdomain.com`
   - 前端程式碼使用這個 URL 發送 API 請求
   - **不需要知道後端的內部 port**，只需要知道公開的 URL

**範例**：
```typescript
// apps/kid-platform/src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200';

const api = axios.create({
  baseURL: API_URL
});

// 前端會發送請求到：https://api.yourdomain.com/api/xxx
```

### Q: 如果我想在同一個服務中部署前端和後端怎麼辦？

A: 可以使用 **Reverse Proxy**（例如 Nginx）：

```nginx
# Nginx 配置
server {
    listen 80;
    server_name yourdomain.com;

    # 前端靜態檔案
    location / {
        root /path/to/kid-platform/dist;
        try_files $uri $uri/ /index.html;
    }

    # 後端 API
    location /api {
        proxy_pass http://localhost:5200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

但通常建議分開部署，因為：
- 前端可以享受 CDN 的優勢（全球加速）
- 後端可以獨立擴展
- 更容易維護和更新

---

## 📚 參考資源

- [Zeabur Monorepo 部署](https://zeabur.com/docs)
- [Vercel Monorepo 部署](https://vercel.com/docs/monorepos)
- [Netlify Monorepo 部署](https://docs.netlify.com/configure-builds/monorepo/)
