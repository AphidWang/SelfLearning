import { MemoryItem, ConversationSummary } from '../types';
import { chatConfig } from '../config/index';

export class ConversationMemory {
  private memory: MemoryItem[] = [];
  private summary: ConversationSummary | null = null;

  constructor() {
    this.memory = [];
    this.summary = null;
  }

  // 添加新的對話項目
  public addMessage(role: 'user' | 'assistant', content: string): void {
    this.memory.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // 如果記憶項目超過閾值，生成摘要
    if (this.memory.length >= chatConfig.memorySummaryThreshold) {
      this.generateSummary();
    }

    // 限制記憶項目數量
    if (this.memory.length > chatConfig.maxMemoryItems) {
      this.memory = this.memory.slice(-chatConfig.maxMemoryItems);
    }
  }

  // 生成對話摘要
  private generateSummary(): void {
    if (this.memory.length === 0) return;

    // 這裡可以加入更複雜的摘要生成邏輯
    const recentMessages = this.memory.slice(-3);
    const summaryText = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    this.summary = {
      summary: summaryText,
      lastUpdated: Date.now(),
    };
  }

  // 獲取最近的對話歷史
  public getRecentHistory(): MemoryItem[] {
    return this.memory.slice(-chatConfig.memorySummaryThreshold);
  }

  // 獲取對話摘要
  public getSummary(): string | null {
    return this.summary?.summary || null;
  }

  // 清除記憶
  public clear(): void {
    this.memory = [];
    this.summary = null;
  }
} 