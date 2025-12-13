/**
 * 本地 TTS 服務
 * 
 * 使用本地 Python 服務器來運行 MMS-TTS-NAN 模型
 * 
 * 環境變數設定：
 * - PYTHON_PATH: Python 可執行文件路徑（可選，預設 'python3'）
 */

import { spawn } from 'child_process';
import { join } from 'path';

class LocalTTSService {
  private pythonPath: string;
  private scriptPath: string;
  private initialized: boolean = false;

  constructor() {
    // 優先使用虛擬環境中的 Python
    const venvPython = join(__dirname, '../../venv/bin/python');
    const fs = require('fs');
    const venvExists = fs.existsSync(venvPython);
    
    this.pythonPath = process.env.PYTHON_PATH || (venvExists ? venvPython : 'python3');
    this.scriptPath = join(__dirname, 'tts_server.py');
    this.initialize();
  }

  private initialize() {
    console.log('🔵 [LocalTTS] 初始化');
    console.log('  - pythonPath:', this.pythonPath);
    console.log('  - scriptPath:', this.scriptPath);
    
    // 檢查 Python 是否可用
    this.checkPython().then(available => {
      if (available) {
        this.initialized = true;
        console.log('✅ Local TTS 初始化成功');
      } else {
        console.warn('⚠️ Python 不可用，Local TTS 功能將無法使用');
      }
    }).catch(error => {
      console.error('❌ Local TTS 初始化失敗:', error);
    });
  }

  private async checkPython(): Promise<boolean> {
    return new Promise((resolve) => {
      const python = spawn(this.pythonPath, ['--version']);
      python.on('close', (code) => {
        resolve(code === 0);
      });
      python.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * 合成語音
   * @param text 要合成的文本（台語）
   * @returns 音頻 buffer (WAV 格式)
   */
  async synthesize(text: string): Promise<Buffer | null> {
    if (!this.initialized) {
      console.warn('⚠️ Local TTS 未初始化');
      return null;
    }

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | null = null;
      const TIMEOUT_MS = 120000; // 120 秒超時（首次運行可能需要下載模型）

      try {
        const python = spawn(this.pythonPath, [this.scriptPath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        // 設置超時
        timeoutId = setTimeout(() => {
          console.error('❌ Python TTS 服務超時（超過 120 秒）');
          python.kill('SIGTERM');
          resolve(null);
        }, TIMEOUT_MS);

        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
          const message = data.toString();
          stderr += message;
          // 輸出進度信息（例如模型下載進度）
          if (message.includes('Downloading') || message.includes('Loading')) {
            console.log('📥 [TTS]', message.trim());
          }
        });

        python.on('close', (code) => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          if (code !== 0) {
            console.error('❌ Python TTS 服務錯誤:', stderr);
            resolve(null);
            return;
          }

          try {
            const result = JSON.parse(stdout);
            
            if (result.error) {
              console.error('❌ TTS 合成錯誤:', result.error);
              resolve(null);
              return;
            }

            if (result.success && result.audio_base64) {
              const audioBuffer = Buffer.from(result.audio_base64, 'base64');
              console.log(`✅ TTS 合成成功，音頻大小: ${audioBuffer.length} bytes`);
              resolve(audioBuffer);
            } else {
              console.error('❌ TTS 返回無效結果');
              resolve(null);
            }
          } catch (parseError) {
            console.error('❌ 解析 TTS 結果失敗:', parseError);
            console.error('原始輸出:', stdout);
            resolve(null);
          }
        });

        python.on('error', (error) => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          console.error('❌ 啟動 Python TTS 服務失敗:', error);
          resolve(null);
        });

        // 發送輸入
        const input = JSON.stringify({ text });
        python.stdin.write(input);
        python.stdin.end();

      } catch (error: any) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        console.error('❌ Local TTS 合成失敗:', error);
        resolve(null);
      }
    });
  }

  /**
   * 檢查服務是否可用
   */
  isAvailable(): boolean {
    return this.initialized;
  }
}

// 導出單例
export const localTTS = new LocalTTSService();
