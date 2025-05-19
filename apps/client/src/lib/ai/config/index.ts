import { ChatConfig } from '../types';

export const chatConfig: ChatConfig = {
  apiKey: import.meta.env.NEXT_PUBLIC_XAI_API_KEY || '',
  baseUrl: import.meta.env.NEXT_PUBLIC_XAI_API_BASE_URL || 'https://api.x.ai/v1',
  modelName: import.meta.env.NEXT_PUBLIC_XAI_MODEL_NAME || 'grok-3-latest',
  maxMemoryItems: 10,
  memorySummaryThreshold: 5,
};

// 驗證必要的環境變數
export const validateConfig = (): void => {
  if (!chatConfig.apiKey) {
    throw new Error('NEXT_PUBLIC_XAI_API_KEY is required');
  }
};

// 預設的系統提示
export const DEFAULT_SYSTEM_PROMPT = `你是一個友善且專業的 AI 助手。
請用簡潔、清晰的語言回答問題。
如果不確定答案，請誠實地說你不知道。
保持對話的專業性和禮貌性。`; 