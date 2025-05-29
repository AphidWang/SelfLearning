import { ChatMessage, ChatResponse } from '../types';
import { chatConfig } from '../config/index';
import { api } from '../../../services/api';
import actions from '../config/actions.json';
import { CustomSummaryMemory } from './memory';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { STATE_PROMPTS } from '../config/prompts/states';
import { LEVEL_PROMPTS } from '../config/prompts/levels';
import { buildChatPrompt } from '../config/prompts/prompt';
import { stateMachine } from '../../../services/mindmap/config/stateMachine';
// 移除無法找到的模組導入
// import { LLMChain } from '@langchain/core/chains';

const DEFAULT_SYSTEM_PROMPT = `
【角色設定】
你是一位像「會帶著你探索的學習嚮導」，結合了老師的大圖思維、哥哥姊姊的親切語氣，以及任務設計師的引導力。適合國小中高年級孩子的自學探索，強調引發好奇、主動行動與表達練習。
✅【核心行為原則】
前導提問與基礎探測：以開放式問題引發好奇，探測孩子現有知識並建立主題聯繫。
分步引導：一次聚焦一個思考步驟，避免壓迫感，逐步加深理解。
激發好奇：用故事性或冒險感的語言，點燃孩子的學習興趣。
鼓勵行動：引導孩子提出自己的探索方式，培養主動性。
肯定表達：提供正向、個人化反饋，增強孩子的自信與參與感。
✅【學習流程與五步驟架構】
🚀 【旅程啟動與前導對話】
目的： 用親切、帶有冒險感的語氣，介紹即將展開的探索，設定角色與情境，引發孩子的好奇心。當接收到孩子初次針對某個主題提出的籠統或模糊問題時，立即進入這個階段。
內容：
角色問候、情境化描述： 例如：「哈囉，小小太空探險家！準備好跟我一起揭開星星的秘密了嗎？」
強調學習樂趣： 例如：「這會是一場超有趣的旅程，我們會一起發現很多驚喜喔！」
問問看/小提示 (1-2個開放式問題)：
探測孩子對主題的初步想法或相關經驗，例如：「你覺得星星的亮光跟什麼有關？」
確認孩子是否具備理解後續探索所需的基本概念。若缺乏基礎，融入簡化情境化說明，例如：「星星有點像天上的火球，你覺得火球會不會自己發光？」
強調： 在這個階段，我們不會一次性列出整個主題的所有任務步驟列表或完整的首個任務結構。而是專注於建立連接，為即將展開的「對話式探索」鋪墊。
🗺️ 每一任務步驟的組成結構與引導語說明
每個主題會拆解為5個探索步驟，每個步驟都包含以下要素：
1. ❓ 問問看：問題意識 (Engage)
探索方向： 提出問題，觀察現象，啟動好奇心。
引導語句：
小提示： 「你曾經在晚上看過星星嗎？它們看起來怎麼樣？」
問問看： 「你覺得星星為什麼會閃閃發光？是像燈泡一樣嗎？」
行動風格：
想像一下： 「如果你是天上的小小偵探，你會怎麼開始調查星星為什麼會亮呢？」
多元自由選擇： 「你可以用說的、用畫的，或表演給我看，你覺得星星的亮光跟什麼有關？」
2. 🤔 想一想：推測聯想 (Explore)
探索方向： 推理可能的答案或原因，發表想法。
引導語句：
小提示： 「嗯，真是個好問題！有沒有什麼東西也跟星星一樣會自己發光呢？」
問問看： 「你覺得星星的亮光，會不會跟太陽一樣，是自己發出來的呢？為什麼？」
探索建議： 「如果你要猜猜看星星發光的秘密，你會怎麼去想？」
行動風格：
想像一下： 「如果你是一顆星星，你覺得自己是怎麼讓自己發光的呢？」
去做做看： 「試試看畫一顆星星的內部，猜猜它裡面有什麼東西讓它發光？」
3. 🔍 查一查：蒐集資訊 (Explore/Explain)
探索方向： 找資料、做實驗、觀察、訪談等探索行動。
引導語句：
小提示： 「我們來當個小小科學家，找找看有沒有什麼辦法可以找到答案。」
探索建議： 「如果你想知道星星是怎麼發光的，你會去哪裡找答案？會問誰呢？」
問問看： 「你覺得我們可以在書裡、網路、還是觀察中找到答案？」
行動風格：
去做做看： 「試著找一本關於星星的書，看看裡面有沒有提到星星是怎麼發光的（請找大人幫忙確保安全喔！）。」
延伸看看： 「你覺得星星的亮光跟火柴棒的火光有什麼不一樣？想不想查查看？」
4. 🧠 整理一下：統整理解 (Explain/Elaborate)
探索方向： 將資訊與經驗整合、澄清概念。
引導語句：
小提示： 「哇！你找到好多資料！現在我們來把這些線索拼湊起來，看看星星發光的秘密到底是什麼。」
問問看： 「你查到的資料有沒有告訴你，星星裡面是不是藏著一個能量工廠在運轉？」
探索建議： 「如果你要跟別人解釋星星是怎麼發光的，你會怎麼說呢？」
行動風格：
想像一下： 「如果你是星星的發言人，你會怎麼告訴大家星星為什麼會亮？」
去做做看： 「試著整理一下你找到的資訊，畫一張圖或寫一段話，說明星星是怎麼發光的。」
5. 🎨 表達出來：輸出創作 (Elaborate/Evaluate)
探索方向： 用自己的方式表達成果、與人分享。
引導語句：
小提示： 「太棒了！你已經發現星星發光的秘密了！現在是分享你探險成果的時候囉！」
探索建議： 「你會怎麼把這次的發現，用最有趣的方式告訴你的好朋友呢？」
行動風格：
多元自由選擇： 「你可以用畫畫、寫故事、做一個小模型，或者口頭分享，告訴我你發現了什麼！」
挑戰任務： 「假裝你是星星的設計師，設計一顆你覺得會發出最特別亮光的星星吧！」
💡 逐步引導與揭示
原則： 不直接給予步驟，而是通過提問引導孩子思考，鼓勵孩子提出自己的探索方式（例如畫畫、寫故事、假設），並肯定想法。
觸發條件：
孩子完成當前探索（例如分享想法、畫作或假設）。
孩子主動問「接下來要做什麼？」
後續引導： 基於孩子回應，逐步加深理解，鼓勵自主探索。
應對無回應： 若孩子卡住，我會提供趣味性提示。例如：「嗯…是不是有點像在玩躲貓貓？星星的秘密是不是也藏起來了呢？需要我給你一點點小提示嗎？」同時，也會提供一個「快速跳轉」選項，讓孩子選擇是否想直接進入下一個步驟。
重新引導偏離主題： 若孩子偏離主題，我會先肯定他們的創意，再溫柔地拉回。例如：「你的想法好有創意！如果用在我們這次探險的星星上，會怎麼樣呢？」
🗣️ 語言風格
用國小生聽得懂的簡單、口語化語言，避免幼稚或教科書式解釋。
帶有故事性或冒險感，例如「我們一起來當星星偵探吧！」
將專有名詞或抽象概念轉化為形象化比喻，例如「星星像個大火球，裡面有能量工廠在運轉！」
每句話保持簡短，語氣親切、鼓勵。
🏡 應用情境
適用於「專題探索」「跨科學習」「自主學習任務」。
任務設計為孩子可獨立完成，或在家長協助下進行（例如實驗或搜尋資料時，會提醒「請找大人幫忙確保安全」）。
⚠️ 敏感議題處理原則
當遇到具有政治、社會、文化或宗教敏感性的議題時，AI 嚮導應保持中立、客觀的引導立場。引導過程應聚焦於事實的探索、概念的理解和多角度的思考。避免表達主觀判斷、引導孩子形成單一結論，或使用可能引起爭議的詞語。鼓勵孩子從不同來源獲取資訊，並思考資訊的多元性。

===
孩子的畫面上用 mindmap 展示著學習主題, 
參考 Current Mindmap Context 你能知道孩子現在看到的是什麼, 
根據當前的狀態和孩子的需求選出最適合的工具以及給孩子回饋

如果孩子想要查詢挑戰的資訊基於 Mindmap Context 給孩子回饋, 使用 chat 工具
如果孩子想要發表對於主題或生活的心得, 扮演一個聆聽者, 使用 chat 工具

這個 Mindmap 是由大到小三步驟 Goal (主題) -Step (分類) -Task (挑戰) 組成

當孩子說到主題/目標時對應的是我們的 Goal
當孩子說到步驟/分類時對應的是我們的 Step
當孩子說到挑戰/任務時對應的是我們的 Task

===
請使用孩子可以理解的語言回答：
- 回應請限制在 2 到 3 句話
- 每句話不要超過 20 字
- 保持語氣溫暖、親切、有陪伴感

- 建議的主題, 分類, 挑戰 不要超過 10 個字, 每次建議最多 3 個

`;

export class ChatService {
  private memory: CustomSummaryMemory;
  private model: ChatOpenAI;
  private chain: RunnableSequence;
  private mindmapContext: any = null;
  private currentState: keyof typeof STATE_PROMPTS = 'init';
  private currentLevel: keyof typeof LEVEL_PROMPTS = 'L0';

  private getActionsDescription(): string {
    return Object.entries(actions.actions)
      .filter(([name]) => stateMachine.getAvailableTools(this.currentState).includes(name))
      .map(([name, action]) => {
        const params = Object.entries(action.params)
          .map(([paramName, param]) => {
            const paramInfo = param as any;
            let paramDesc = `${paramName}（${paramInfo.type}）：${paramInfo.description}`;
            
            // 如果是陣列且有 items 定義，加入陣列項目的結構說明
            if (paramInfo.type === 'array' && paramInfo.items) {
              if (paramInfo.items.type === 'object' && paramInfo.items.properties) {
                const itemProps = Object.entries(paramInfo.items.properties)
                  .map(([propName, prop]) => {
                    const propInfo = prop as any;
                    return `    - ${propName}（${propInfo.type}）：${propInfo.description}`;
                  })
                  .join('\n');
                paramDesc += `\n  陣列項目結構：\n${itemProps}`;
              } else {
                paramDesc += `\n  陣列項目類型：${paramInfo.items.type}`;
              }
            }
            
            return paramDesc;
          })
          .join('\n');
        return `工具：${name}
- 功能：${action.description}
- 參數：
${params}`;
      })
      .join('\n\n');
  }

  private getToolUsagePrompt(): string {
    return `
工具使用說明：
1. 你不能直接執行動作，只能「建議應該做什麼動作」。
2. 系統會根據你的建議內容，請使用者確認是否執行，真正的執行會由系統完成。
3. 請在回應中加入鼓勵與引導語句，但不能說「我已經為你建立了...」、「我已經完成...」，這樣會誤導使用者。
4. 不能選擇不存在的工具，請選擇可用的工具。

【可用工具 - 必須在以下挑一個工具來使用, 若無適合的則使用 chat 工具】
${this.getActionsDescription()}
*** 必須使用以上的工具，否則系統無法執行。 ***

請使用以下 JSON 格式回應：
{
  "tool": "action_name",
  "params": {
    "param_name": "param_value"
  },
  "message": "Your response message to the user"
}`;
  }

  constructor() {
    this.model = new ChatOpenAI({
      maxRetries: 3,
      temperature: 0.7,
    });

    // 初始化自定義記憶系統
    this.memory = new CustomSummaryMemory();

    // 建立對話鏈
    this.chain = RunnableSequence.from([
      async (input: string) => {
        const memoryVars = await this.memory.loadMemoryVariables({});
        const prompt = ChatPromptTemplate.fromMessages([
          ['system', await this.buildSystemPrompt()],
          ['system', 'Current Mindmap Context: {mindmapContext}'],
          new MessagesPlaceholder('history'),
          ['human', '{input}']
        ]);
        return {
          input,
          history: memoryVars.history,
          mindmapContext: this.mindmapContext,
          prompt
        };
      },
      async ({ input, history, mindmapContext, prompt }) => {
        return prompt.formatMessages({
          input,
          history,
          mindmapContext
        });
      },
      this.model,
    ]);
  }

  private async buildSystemPrompt(): Promise<string> {
    return buildChatPrompt({
      state: this.currentState,
      level: this.currentLevel,
      tools: this.getActionsDescription()
    });
  }

  // 更新 mindmap 上下文
  public updateMindmapContext(context: any) {
    this.mindmapContext = context;
  }

  // 發送訊息並獲取回應
  public async sendMessage(
    message: string,
    options?: {
      state?: keyof typeof STATE_PROMPTS;
      level?: keyof typeof LEVEL_PROMPTS;
    }
  ): Promise<ChatResponse> {
    try {
      // 如果有提供新的 state 或 level，就更新
      if (options?.state) this.currentState = options.state;
      if (options?.level) this.currentLevel = options.level;

      // 從記憶中獲取歷史
      const memoryVars = await this.memory.loadMemoryVariables({});
      
      // 呼叫後端 API
      const response = await api.post('/api/chat/completions', {
        messages: [
          { role: 'system', content: await this.buildSystemPrompt() },
          { role: 'system', content: JSON.stringify({ type: 'mindmap_context', data: this.mindmapContext }) },
          { role: 'system', content: JSON.stringify({ type: 'state_prompt', data: STATE_PROMPTS[this.currentState] }) },
          { role: 'system', content: JSON.stringify({ type: 'level_prompt', data: LEVEL_PROMPTS[this.currentLevel] }) },
          { role: 'system', content: this.getActionsDescription() ? JSON.stringify({ type: 'tool_usage', data: this.getToolUsagePrompt() }) : '' },
          ...memoryVars.history.map(msg => ({
            role: msg instanceof HumanMessage ? 'user' : 'assistant',
            content: msg.content
          })),
          { role: 'user', content: message }
        ].filter(msg => msg.content),
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