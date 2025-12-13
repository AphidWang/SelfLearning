#!/bin/bash
# TTS 服務設置腳本

set -e

echo "🔵 開始設置本地 TTS 服務..."

# 檢查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 python3，請先安裝 Python 3.8+"
    exit 1
fi

echo "✅ Python 版本: $(python3 --version)"

# 創建虛擬環境（如果不存在）
if [ ! -d "venv" ]; then
    echo "📦 創建 Python 虛擬環境..."
    python3 -m venv venv
fi

# 激活虛擬環境並安裝依賴
echo "📦 安裝 Python 依賴..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ TTS 服務設置完成！"
echo ""
echo "💡 提示："
echo "   - 首次運行會自動下載模型（約 36MB）"
echo "   - 模型會緩存在 ~/.cache/huggingface/"
echo "   - 啟動服務器後即可使用 TTS 功能"
