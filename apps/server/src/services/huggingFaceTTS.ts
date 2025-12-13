/**
 * Hugging Face TTS Service (MMS-TTS-NAN)
 * 
 * 使用 Hugging Face Inference API 來進行台語語音合成
 * 模型：facebook/mms-tts-nan
 * 
 * 環境變數設定：
 * - HUGGING_FACE_API_KEY: Hugging Face API token
 */

class HuggingFaceTTSService {
  private apiKey: string | null = null;
  private initialized: boolean = false;
  private readonly modelName = 'facebook/mms-tts-nan';
  // 嘗試多個可能的端點
  private readonly apiUrls = [
    'https://router.huggingface.co/hf-inference/models',
    'https://api-inference.huggingface.co/models', // 備選（雖然說不支援，但可能某些模型還能用）
  ];

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      this.apiKey = process.env.HUGGING_FACE_API_KEY || null;

      console.log('🔵 [HuggingFaceTTS] 初始化');
      console.log('  - apiKey:', this.apiKey ? '已設定' : '未設定');
      console.log('  - model:', this.modelName);

      if (this.apiKey) {
        this.initialized = true;
        console.log('✅ Hugging Face TTS 初始化成功');
      } else {
        console.warn('⚠️ Hugging Face API Key 未設定，TTS 功能將無法使用');
      }
    } catch (error) {
      console.error('❌ Hugging Face TTS 初始化失敗:', error);
    }
  }

  /**
   * 合成語音
   * @param text 要合成的文本（台語）
   * @returns 音頻 buffer (WAV 格式)
   */
  async synthesize(text: string): Promise<Buffer | null> {
    if (!this.initialized || !this.apiKey) {
      console.warn('⚠️ Hugging Face TTS 未初始化');
      return null;
    }

    // 嘗試多個可能的端點
    for (const apiUrl of this.apiUrls) {
      try {
        const response = await fetch(
          `${apiUrl}/${this.modelName}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: text,
            }),
          }
        );

        // 如果是 404，嘗試下一個端點
        if (response.status === 404) {
          console.warn(`⚠️ 端點 ${apiUrl} 返回 404，嘗試下一個...`);
          continue;
        }
        
        // 處理響應（包括成功和錯誤）
        const result = await this.handleResponse(response);
        if (result !== null || response.status !== 503) {
          // 如果成功或非 503 錯誤，返回結果
          return result;
        }
        // 如果是 503（模型加載中），也繼續嘗試下一個端點
        console.warn(`⚠️ 端點 ${apiUrl} 模型正在加載，嘗試下一個...`);
        continue;
      } catch (error: any) {
        console.warn(`⚠️ 端點 ${apiUrl} 請求失敗:`, error.message);
        // 繼續嘗試下一個端點
        continue;
      }
    }
    
    // 所有端點都失敗
    console.error('❌ 所有 Hugging Face API 端點都失敗');
    return null;
  }

  private async handleResponse(response: Response): Promise<Buffer | null> {
    try {

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = { error: text || `HTTP ${response.status}` };
          }
        } catch (parseError) {
          errorData = { 
            error: `HTTP ${response.status}: ${response.statusText}`,
            raw: await response.text().catch(() => '無法讀取錯誤訊息')
          };
        }
        
        console.error('❌ Hugging Face TTS API 錯誤:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // 如果是模型正在加載，返回 null 讓調用者知道需要重試
        if (response.status === 503) {
          console.warn('⚠️ 模型正在加載中，請稍後重試');
        }
        
        return null;
      }

      // Hugging Face TTS API 返回音頻數據
      const audioBuffer = await response.arrayBuffer();
      
      if (!audioBuffer || audioBuffer.byteLength === 0) {
        console.error('❌ Hugging Face TTS 返回空音頻');
        return null;
      }

      return Buffer.from(audioBuffer);
    } catch (error: any) {
      console.error('❌ Hugging Face TTS 響應處理失敗:', error);
      return null;
    }
  }

  /**
   * 檢查服務是否可用
   */
  isAvailable(): boolean {
    return this.initialized && this.apiKey !== null;
  }
}

// 導出單例
export const huggingFaceTTS = new HuggingFaceTTSService();
