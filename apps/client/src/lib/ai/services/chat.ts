import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { BaseLLM } from '@langchain/core/language_models/llms';
import { ChatMessage, ChatResponse } from '../types';
import { chatConfig, DEFAULT_SYSTEM_PROMPT } from '../config/index';
import { ConversationMemory } from './memory';
import { LLMResult } from '@langchain/core/outputs';
import { BaseLLMCallOptions } from '@langchain/core/language_models/llms';
import { api } from '../../../services/api';

class CustomLLM extends BaseLLM {
  constructor() {
    super({
      concurrency: 1,
      maxConcurrency: 1,
      maxRetries: 3,
    });
  }

  async _generate(
    prompts: string[],
    options: BaseLLMCallOptions,
    runManager?: any
  ): Promise<LLMResult> {
    const generations = await Promise.all(
      prompts.map(async (prompt) => {
        const response = await api.post('/api/chat/completions', {
          messages: [
            { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          model: chatConfig.modelName,
          temperature: 0.7,
        });

        const data = response.data;
        return {
          text: data.choices[0].message.content,
          generationInfo: {
            finishReason: data.choices[0].finish_reason,
          },
        };
      })
    );

    return {
      generations: [generations],
    };
  }

  _llmType(): string {
    return 'custom';
  }
}

export class ChatService {
  private memory: ConversationMemory;
  private chain: LLMChain;

  constructor() {
    // 初始化記憶
    this.memory = new ConversationMemory();

    // 建立提示模板
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', DEFAULT_SYSTEM_PROMPT],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);

    // 建立對話鏈
    this.chain = new LLMChain({
      llm: new CustomLLM(),
      prompt,
    });
  }

  // 發送訊息並獲取回應
  public async sendMessage(message: string): Promise<ChatResponse> {
    try {
      // 添加用戶訊息到記憶
      this.memory.addMessage('user', message);

      // 準備對話歷史
      const history = this.memory.getRecentHistory().map(msg => ({
        type: msg.role,
        content: msg.content,
      }));

      // 獲取摘要
      const summary = this.memory.getSummary();

      // 執行對話鏈
      const response = await this.chain.call({
        input: message,
        history,
        summary: summary || '',
      });

      // 添加助手回應到記憶
      this.memory.addMessage('assistant', response.text);

      return {
        message: response.text,
      };
    } catch (error) {
      console.error('Chat error:', error);
      return {
        message: '',
        error: error instanceof Error ? error.message : '未知錯誤',
      };
    }
  }

  // 清除對話歷史
  public clearHistory(): void {
    this.memory.clear();
  }
} 