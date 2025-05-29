import { DEFAULT_SYSTEM_PROMPT } from './system';
import { STATE_PROMPTS } from './states';
import { LEVEL_PROMPTS } from './levels';
import samples from './samples.json';

export const buildChatPrompt = ({
  state,
  level,
  tools
}: {
  state: keyof typeof STATE_PROMPTS;
  level: keyof typeof LEVEL_PROMPTS;
  tools: any;
}) => {
  // 1. 基礎系統提示
  const basePrompt = DEFAULT_SYSTEM_PROMPT;

  // 2. 範例對話
  const stateSamples = samples.samples.filter(s => s.state === state && s.level === level);
  const samplePrompts = stateSamples.map(s => s.prompt).join('\n');

  // 組合完整提示
  return `【角色設定】
${basePrompt}

【範例對話參考】
根據當前階段和角色設定以下是範例對話，請參考範例語氣來回答使用者。
${samplePrompts}
`.trim().replace(/{/g, '{{').replace(/}/g, '}}');
}; 
