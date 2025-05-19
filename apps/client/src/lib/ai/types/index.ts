export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  error?: string;
  role?: 'user' | 'assistant';
}

export interface ChatConfig {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  maxMemoryItems: number;
  memorySummaryThreshold: number;
}

export interface MemoryItem {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ConversationSummary {
  summary: string;
  lastUpdated: number;
} 