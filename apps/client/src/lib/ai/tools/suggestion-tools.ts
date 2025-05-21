import type { Tool } from './types';

// 建議主題
export const suggestTopicsTool: Tool<{ suggestions: string[] }, string[]> = {
  name: 'suggest_topics',
  description: '顯示主題建議',
  handler: async (params) => {
    return params.suggestions;
  }
};

// 建議步驟
export const suggestStepsTool: Tool<{ suggestions: string[] }, string[]> = {
  name: 'suggest_steps',
  description: '顯示步驟建議',
  handler: async (params) => {
    return params.suggestions;
  }
};

// 建議任務
export const suggestTasksTool: Tool<{ suggestions: { task_name: string; step_tag: string }[] }, { task_name: string; step_tag: string }[]> = {
  name: 'suggest_tasks',
  description: '顯示任務建議（含分類）',
  handler: async (params) => {
    return params.suggestions;
  }
};

// 延伸探索
export const exploreMoreTool: Tool<{ context: any }, any[]> = {
  name: 'explore_more',
  description: '依現有任務狀況延伸探索',
  handler: async (params) => {
    // TODO: 根據 context 生成更多任務建議
    return [];
  }
}; 