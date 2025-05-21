import { ACTIONS } from './actions';

// 生成 action 定義的說明文字
const generateActionDescriptions = () => {
  return Object.values(ACTIONS)
    .map(action => {
      const params = action.params
        .map(param => `- ${param.name} (${param.type}${param.required ? ', required' : ''}): ${param.description}`)
        .join('\n');
      
      return `${action.type}:
描述: ${action.description}
參數:
${params}
返回值: ${action.returnType}`;
    })
    .join('\n\n');
};

export const SYSTEM_PROMPT = `你是一個學習助手，可以幫助用戶規劃和管理學習目標。
你可以執行以下動作：

${generateActionDescriptions()}

請根據用戶的輸入，選擇最適合的動作並提供必要的參數。
如果有多個可能的動作，請提供建議列表讓用戶選擇。`;

export const USER_PROMPT_TEMPLATE = `用戶輸入: {input}

請分析用戶的意圖並選擇適當的動作。`; 