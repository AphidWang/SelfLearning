import { ChatMessage, ChatResponse } from '../types';
import { chatConfig } from '../config/index';
import { api } from '../../../services/api';
import actions from '../config/actions.json';
import { CustomSummaryMemory } from './memory';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { BaseMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
// 移除無法找到的模組導入
// import { LLMChain } from '@langchain/core/chains';

const DEFAULT_SYSTEM_PROMPT = `你是一位智慧助理`;

// 將 actions 轉換為易讀的格式
//console.log('🔍 Actions:', actions);
const actionsDescription = Object.entries(actions.actions)
  .map(([name, action]) => {
    const params = Object.entries(action.params)
      .map(([paramName, param]) => `${paramName}${(param as any).required ? ' (required)' : ''}: ${param.description} (${param.type})`)
      .join('\n    ');
    const returns = `${action.returns.type}${(action.returns as any).properties ? ` with properties: ${JSON.stringify((action.returns as any).properties)}` : ''}`;
    return `${name}:
  Description: ${action.description}
  Parameters:
    ${params}
  Returns: ${returns}`;
  })
  .join('\n\n');

const SYSTEM_PROMPT_WITH_ACTIONS = `${DEFAULT_SYSTEM_PROMPT}
===
你可以根據使用者輸入「建議一個最適合的動作」，並提供建議的參數。

請注意：
1. 你不能直接執行動作，只能「建議應該做什麼動作」。
2. 系統會根據你的建議內容，請使用者確認是否執行，真正的執行會由系統完成。
3. 請在回應中加入鼓勵與引導語句，但不能說「我已經為你建立了...」、「我已經完成...」，這樣會誤導使用者。

可用的動作列表：

Available actions:
${actionsDescription}

Please respond with a JSON object in the following format:
{
  "tool": "action_name",
  "params": {
    "param_name": "param_value"
  },
  "message": "Your response message to the user"
}`.replace(/{/g, '{{').replace(/}/g, '}}');

//console.log('📝 SYSTEM_PROMPT_WITH_ACTIONS: ', SYSTEM_PROMPT_WITH_ACTIONS);

export class ChatService {
  private memory: CustomSummaryMemory;
  private model: ChatOpenAI;
  private chain: RunnableSequence;

  constructor() {
    this.model = new ChatOpenAI({
      maxRetries: 3,
      temperature: 0.7,
    });

    // 初始化自定義記憶系統
    this.memory = new CustomSummaryMemory();

    // 建立提示模板
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT_WITH_ACTIONS],
      new MessagesPlaceholder('history'),
      ['human', '{input}']
    ]);

    // 建立對話鏈
    this.chain = RunnableSequence.from([
      async (input: string) => {
        const memoryVars = await this.memory.loadMemoryVariables({});
        return {
          input,
          history: memoryVars.history
        };
      },
      prompt,
      this.model,
    ]);
  }

  // 發送訊息並獲取回應
  public async sendMessage(message: string): Promise<ChatResponse> {
    try {
      // 從記憶中獲取歷史
      const memoryVars = await this.memory.loadMemoryVariables({});
      
      // 呼叫後端 API
      const response = await api.post('/api/chat/completions', {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_WITH_ACTIONS },
          ...memoryVars.history.map(msg => ({
            role: msg.type === 'human' ? 'user' : 'assistant',
            content: msg.content
          })),
          { role: 'user', content: message }
        ].filter(msg => msg.content), // 過濾掉沒有內容的訊息
        temperature: 0.7
      });

      // 保存上下文
      await this.memory.saveContext(
        { input: message },
        { output: response.data.choices[0].message.content }
      );

      return {
        message: response.data.choices[0].message.content,
        role: 'assistant'
      };
    } catch (error) {
      console.error('❌ Chat error:', error);
      return {
        message: '',
        role: 'assistant',
        error: error instanceof Error ? error.message : '未知錯誤',
      };
    }
  }

  // 清除對話歷史
  public clearHistory(): void {
    this.memory.clear();
  }
} 