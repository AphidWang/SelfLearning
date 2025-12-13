# 本地 TTS 服務設置指南

## 前置需求

1. **Python 3.8+**
   ```bash
   python3 --version
   ```

2. **pip**
   ```bash
   pip3 --version
   ```

## 安裝步驟

### 1. 創建 Python 虛擬環境（推薦）

```bash
cd apps/server
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 或
# venv\Scripts\activate  # Windows
```

### 2. 安裝 Python 依賴

```bash
pip install -r requirements.txt
```

或者使用 yarn（會自動使用虛擬環境）：
```bash
yarn install-tts-deps
```

**注意：** 如果系統 Python 有保護機制（如 macOS），必須使用虛擬環境。

### 2. 驗證安裝

測試 Python 服務是否正常工作：

```bash
cd apps/server/src/services
echo '{"text": "測試"}' | python3 tts_server.py
```

如果成功，應該會輸出包含 `audio_base64` 的 JSON。

### 3. 啟動服務器

正常啟動 Node.js 服務器即可：

```bash
yarn dev
```

## 環境變數（可選）

如果需要指定 Python 路徑，可以在 `.env` 中設定：

```env
PYTHON_PATH=python3
# 或
PYTHON_PATH=/usr/local/bin/python3
```

## 故障排除

### 問題：找不到 Python

**解決方法：**
- 確保系統已安裝 Python 3.8+
- 在 `.env` 中設定正確的 `PYTHON_PATH`

### 問題：缺少 Python 套件

**解決方法：**
```bash
pip3 install --upgrade torch transformers accelerate scipy numpy
```

### 問題：模型下載失敗

**解決方法：**
- 確保網路連線正常
- 模型會自動從 Hugging Face 下載（約 36MB）
- 首次運行會需要一些時間下載模型

### 問題：記憶體不足

**解決方法：**
- 模型需要約 200-500MB 記憶體
- 如果有 GPU，會自動使用 GPU 加速
- 如果記憶體不足，考慮使用較小的批次大小

## 性能說明

- **首次運行**：需要下載模型（約 36MB），可能需要 1-2 分鐘
- **後續運行**：模型會緩存在本地，啟動更快
- **推理速度**：CPU 約 1-2 秒/句，GPU 約 0.1-0.5 秒/句
