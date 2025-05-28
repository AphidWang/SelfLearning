import { DEFAULT_SYSTEM_PROMPT } from './system';
import { STATE_PROMPTS } from './states';
import { LEVEL_PROMPTS } from './levels';
import samples from './samples.json';

export const buildChatPrompt = ({
  state,
  level,
  mindmapContext,
  history,
  tools
}: {
  state: keyof typeof STATE_PROMPTS;
  level: keyof typeof LEVEL_PROMPTS;
  mindmapContext: string;
  history: Array<{ role: string; content: string }>;
  tools: any;
}) => {
  // 1. 基礎系統提示
  const basePrompt = DEFAULT_SYSTEM_PROMPT;

  // 2. 當前狀態提示
  const statePrompt = STATE_PROMPTS[state];

  // 3. 使用者等級提示
  const levelPrompt = LEVEL_PROMPTS[level];

  // 4. 範例對話
  const stateSamples = samples.samples.filter(s => s.state === state && s.level === level);
  const samplePrompts = stateSamples.map(s => s.prompt).join('\n');

  // 5. 工具說明
  const toolsPrompt = tools ? `
${JSON.stringify(tools, null, 2)}

工具使用說明：
1. 你不能直接執行動作，只能「建議應該做什麼動作」。
2. 系統會根據你的建議內容，請使用者確認是否執行，真正的執行會由系統完成。
3. 請在回應中加入鼓勵與引導語句，但不能說「我已經為你建立了...」、「我已經完成...」，這樣會誤導使用者。

請使用以下 JSON 格式回應：
{
  "tool": "action_name",
  "params": {
    "param_name": "param_value"
  },
  "message": "Your response message to the user"
}` : '';

  // 6. Mindmap 上下文
  const mindmapPrompt = mindmapContext ? `
當前 Mindmap 狀態：
${mindmapContext}
` : '';

  // 7. 對話歷史
  const historyPrompt = history.length > 0 ? `
對話歷史：
${history.map(h => `${h.role}: ${h.content}`).join('\n')}
` : '';

  // 組合完整提示
  return `
【角色設定】
${basePrompt}

【當前任務階段】
${statePrompt}

【使用者學習狀態】
${levelPrompt}

【範例對話參考】
${samplePrompts}

【可用工具與使用說明】
${toolsPrompt}

【當前 Mindmap 狀態】
${mindmapPrompt}

【對話歷史記錄】
${historyPrompt}
`.trim().replace(/{/g, '{{').replace(/}/g, '}}');
}; 