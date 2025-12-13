/**
 * 台語學習 API 路由
 * 
 * 功能：
 * - 中文到台語翻譯（結構化輸出：國字 + 臺羅拼音）
 * - TTS 語音合成（台語）
 * - iTaigi 辭典查詢
 */

import express, { Request, Response } from 'express';
import { authenticateSupabaseToken } from './auth';
import { localTTS } from '../services/localTTS';
import { itaigiService } from '../services/itaigi';

const router = express.Router();

// 翻譯接口：中文 -> 台語（結構化輸出）
router.post('/translate', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: '請提供有效的文本' 
      });
    }

    // 使用 OpenAI API 進行翻譯
    // 要求 ChatGPT 返回結構化的 JSON，包含每個詞的國字和臺羅拼音
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'OpenAI API key 未配置' 
      });
    }

    const prompt = `請將以下中文句子翻譯成地道的台語，並以結構化的 JSON 格式返回。

重要要求：
1. **在地用語轉換**：必須使用台語的地道用語，不要直譯中文。例如：
   - 「吃晚餐」應該翻譯為「食暗頓」（chia̍h-àm-tǹg），而不是「吃晚餐」（chia̍h-bán-chhan）
   - 「吃飯」應該翻譯為「食飯」（chia̍h-pn̄g），而不是「吃飯」（chia̍h-pn̄g）
   - 「早上」應該翻譯為「早起」（chá-khí），而不是「早上」（chá-siōng）
2. **詞彙分割**：將句子切分成完整的詞彙（不是單字），每個詞彙是一個語意單位。例如：
   - 「暗頓」（àm-tǹg）是一個完整的詞彙，不要拆成「暗」和「頓」
   - 「早起」（chá-khí）是一個完整的詞彙，不要拆成「早」和「起」
3. **每個詞彙需要提供**：
   - 國字（台語的漢字寫法，使用地道用語）
   - 臺羅拼音（Taiwanese Romanization System，完整詞彙的拼音，用空格分隔音節）
4. 同時提供整句的台語國字和整句的臺羅拼音（詞彙之間用空格分隔）

範例格式：
{
  "words": [
    { "hanzi": "我", "tai_lo": "guá" },
    { "hanzi": "愛", "tai_lo": "ài" },
    { "hanzi": "你", "tai_lo": "lí" }
  ],
  "fullSentence": {
    "hanzi": "我愛你",
    "tai_lo": "guá ài lí"
  }
}

另一個範例（展示詞彙和在地用語）：
輸入：「你吃晚餐了嗎？」
輸出：
{
  "words": [
    { "hanzi": "你", "tai_lo": "lí" },
    { "hanzi": "食", "tai_lo": "chia̍h" },
    { "hanzi": "暗頓", "tai_lo": "àm-tǹg" },
    { "hanzi": "矣", "tai_lo": "ah" },
    { "hanzi": "無", "tai_lo": "bô" }
  ],
  "fullSentence": {
    "hanzi": "你食暗頓矣無？",
    "tai_lo": "lí chia̍h àm-tǹg ah bô?"
  }
}

請翻譯以下句子：
${text}

請只返回 JSON，不要包含其他文字說明。`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // 使用較便宜的模型
        messages: [
          {
            role: 'system',
            content: '你是一個專業的台語翻譯助手，專門將中文翻譯成地道的台語。你熟悉台語的在地用語和詞彙，能夠正確地將中文轉換為台語的表達方式，而不是直譯。你了解台語的詞彙結構，能夠正確地進行詞彙分割。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // 降低溫度以獲得更一致的結果
        response_format: { type: 'json_object' } // 強制 JSON 輸出
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return res.status(response.status).json({
        success: false,
        message: error.error?.message || '翻譯失敗'
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return res.status(500).json({
        success: false,
        message: '無法獲取翻譯結果'
      });
    }

    // 解析 JSON 回應
    let translationResult;
    try {
      translationResult = JSON.parse(content);
    } catch (parseError) {
      // 如果解析失敗，嘗試提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        translationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('無法解析翻譯結果');
      }
    }

    res.json({
      success: true,
      data: translationResult
    });

  } catch (error: any) {
    console.error('翻譯錯誤:', error);
    res.status(500).json({
      success: false,
      message: error.message || '翻譯過程中發生錯誤'
    });
  }
});

// TTS 接口：台語文本 -> 語音
router.post('/tts', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const { text, type } = req.body; // type: 'word' | 'sentence'
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: '請提供有效的文本' 
      });
    }

    // 使用本地 TTS（真正的台語模型）
    if (!localTTS.isAvailable()) {
      return res.status(500).json({
        success: false,
        message: '本地 TTS 服務未配置，請確保已安裝 Python 和相關依賴'
      });
    }

    try {
      const audioBuffer = await localTTS.synthesize(text);

      if (!audioBuffer) {
        return res.status(500).json({
          success: false,
          message: 'TTS 合成失敗，請稍後再試'
        });
      }

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Disposition', `inline; filename="tts-${Date.now()}.wav"`);
      return res.send(audioBuffer);
    } catch (error: any) {
      console.error('本地 TTS 錯誤:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'TTS 合成過程中發生錯誤'
      });
    }

  } catch (error: any) {
    console.error('TTS 錯誤:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'TTS 過程中發生錯誤'
    });
  }
});

// iTaigi 辭典查詢接口
router.get('/itaigi/search', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: '請提供查詢關鍵字（q 參數）' 
      });
    }

    const result = await itaigiService.search(q);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('iTaigi 查詢錯誤:', error);
    res.status(500).json({
      success: false,
      message: error.message || '查詢過程中發生錯誤'
    });
  }
});

// iTaigi 詞彙查詢接口（直接查詢詞彙頁面）
router.get('/itaigi/word', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: '請提供查詢關鍵字（q 參數）' 
      });
    }

    const result = await itaigiService.getWord(q);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('iTaigi 詞彙查詢錯誤:', error);
    res.status(500).json({
      success: false,
      message: error.message || '查詢過程中發生錯誤'
    });
  }
});

export default router;
