/**
 * Google Cloud Text-to-Speech Service
 * 
 * 使用 Google Service Account 來進行語音合成
 * 注意：Text-to-Speech API 不支援 API Key，必須使用 Service Account
 * 
 * 環境變數設定：
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: Service Account 的 email
 * - GOOGLE_PRIVATE_KEY: Service Account 的 private key
 * - GOOGLE_APPLICATION_CREDENTIALS: Service Account JSON 文件路徑
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

class GoogleTTSService {
  private auth: JWT | null = null;
  private tts: any = null;
  private initialized: boolean = false;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      console.log('🔵 [GoogleTTS] 初始化 Auth');
      console.log('  - serviceAccountEmail:', serviceAccountEmail ? '已設定' : '未設定');
      console.log('  - privateKey:', privateKey ? '已設定' : '未設定');
      console.log('  - credentialsPath:', credentialsPath || '未設定');

      // 優先使用環境變數中的 Service Account
      if (serviceAccountEmail && privateKey) {
        this.auth = new JWT({
          email: serviceAccountEmail,
          key: privateKey,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        this.tts = google.texttospeech({ version: 'v1', auth: this.auth });
        this.initialized = true;
        console.log('✅ Google TTS Service Account 初始化成功（使用環境變數）');
        return;
      }

      // 如果沒有環境變數，嘗試使用 JSON 文件
      if (credentialsPath) {
        try {
          const credentials = require(credentialsPath);
          this.auth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
          });
          this.tts = google.texttospeech({ version: 'v1', auth: this.auth });
          this.initialized = true;
          console.log('✅ Google TTS Service Account 初始化成功（使用 JSON 文件）');
          return;
        } catch (error) {
          console.error('❌ 無法載入 Service Account JSON 文件:', error);
        }
      }

      console.warn('⚠️ Google TTS Service Account 未設定，TTS 功能將無法使用');
      console.warn('   注意：Text-to-Speech API 不支援 API Key，必須使用 Service Account');
    } catch (error) {
      console.error('❌ Google TTS 初始化失敗:', error);
    }
  }

  /**
   * 合成語音
   * @param text 要合成的文本
   * @param options 選項
   * @returns 音頻 buffer
   */
  async synthesize(text: string, options?: {
    languageCode?: string;
    voiceName?: string;
    speakingRate?: number;
    pitch?: number;
  }): Promise<Buffer | null> {
    if (!this.initialized || !this.tts) {
      console.warn('⚠️ Google TTS 未初始化');
      return null;
    }

    try {
      const request = {
        input: { text },
        voice: {
          languageCode: options?.languageCode || 'cmn-TW',
          name: options?.voiceName || 'cmn-TW-Wavenet-C',
          ssmlGender: 'NEUTRAL' as const,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: options?.speakingRate || 0.9,
          pitch: options?.pitch || 0,
        },
      };

      // 使用 Service Account 認證
      const response = await this.tts.text.synthesize({ 
        requestBody: request,
        auth: this.auth 
      });
      const audioContent = response.data.audioContent;

      if (!audioContent) {
        console.error('❌ Google TTS 返回空音頻');
        return null;
      }

      // 將 base64 音頻轉換為 buffer
      return Buffer.from(audioContent, 'base64');
    } catch (error: any) {
      console.error('❌ Google TTS 合成失敗:', error);
      return null;
    }
  }

  /**
   * 檢查服務是否可用
   */
  isAvailable(): boolean {
    return this.initialized && this.tts !== null;
  }
}

// 導出單例
export const googleTTS = new GoogleTTSService();
