#!/usr/bin/env python3
"""
本地 TTS 服務器
使用 facebook/mms-tts-nan 模型進行台語語音合成
"""

import sys
import json
import os
from pathlib import Path

# 添加當前目錄到 Python 路徑
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

try:
    from transformers import VitsModel, AutoTokenizer
    import torch
    import scipy.io.wavfile
    import io
    import base64
except ImportError as e:
    print(json.dumps({"error": f"缺少必要的 Python 套件: {e}"}), file=sys.stderr)
    sys.exit(1)

# 全局變數存儲模型
model = None
tokenizer = None
device = "cuda" if torch.cuda.is_available() else "cpu"

def load_model():
    """載入 TTS 模型"""
    global model, tokenizer
    
    if model is not None:
        return True
    
    try:
        print("正在載入 MMS-TTS-NAN 模型...", file=sys.stderr)
        model = VitsModel.from_pretrained("facebook/mms-tts-nan")
        tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-nan")
        model.to(device)
        model.eval()
        print("模型載入成功", file=sys.stderr)
        return True
    except Exception as e:
        print(json.dumps({"error": f"載入模型失敗: {str(e)}"}), file=sys.stderr)
        return False

def synthesize(text: str) -> dict:
    """合成語音"""
    if not load_model():
        return {"error": "模型載入失敗"}
    
    try:
        # Tokenize 輸入文本
        inputs = tokenizer(text, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # 生成語音
        with torch.no_grad():
            output = model(**inputs).waveform
        
        # 轉換為 numpy array
        audio_data = output.squeeze().cpu().numpy()
        sampling_rate = model.config.sampling_rate
        
        # 將音頻轉換為 base64
        buffer = io.BytesIO()
        scipy.io.wavfile.write(buffer, sampling_rate, audio_data)
        audio_bytes = buffer.getvalue()
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        return {
            "success": True,
            "audio_base64": audio_base64,
            "sampling_rate": int(sampling_rate),
            "format": "wav"
        }
    except Exception as e:
        return {"error": f"語音合成失敗: {str(e)}"}

def main():
    """主函數：從 stdin 讀取 JSON，輸出結果到 stdout"""
    try:
        # 從 stdin 讀取 JSON
        input_data = json.load(sys.stdin)
        text = input_data.get("text", "")
        
        if not text:
            print(json.dumps({"error": "請提供文本"}))
            sys.exit(1)
        
        # 合成語音
        result = synthesize(text)
        
        # 輸出結果
        print(json.dumps(result))
        
    except json.JSONDecodeError:
        print(json.dumps({"error": "無效的 JSON 輸入"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"處理失敗: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
