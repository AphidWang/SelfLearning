export interface LLMResponse {
  tool: string;
  params: Record<string, any>;
  message: string;
  suggestions?: {
    text: string;
    description: string;
    action: string;
    params: Record<string, any>;
  }[];
  error?: string;
  form?: ActionForm;
}

// 轉譯層：定義如何將 LLM 回應轉換成 UI 選項
export interface ActionFormConfig {
  type: string;
  title: string;
  description: string;
  options?: Array<{
    paramSource: string;  // 指定要從 LLM 回應的哪個參數取值
    paramAction: string;  // 指定要執行的動作類型
  }>;
  additionalOptions?: Array<{
    text: string;
    action: string;
  }>;
}

// 顯示層：定義 UI 實際顯示的選項格式
export interface ActionForm {
  type: string;
  title: string;
  description: string;
  showInput?: boolean;
  options?: Array<{
    label: string;
    action: {
      type: string;
      params: any;
    };
  }>;
  additionalOptions?: Array<{
    text: string;
    action: string;
  }>;
}

export interface Task {
  task_name: string;
  step_tag: string;
}

// 定義每個動作的格式，例如 suggest_tasks, suggest_steps 等
export interface ActionDefinition {
  description: string;  // 動作的說明
  params: {            // 動作需要的參數
    [key: string]: ActionParamDefinition;
  };
}

// 定義每個參數的格式，例如 suggestions 陣列
export interface ActionParamDefinition {
  type: string;        // 參數型別：string, array 等
  required?: boolean;  // 是否必填
  description: string; // 參數說明
  items?: {           // 如果是陣列，定義陣列元素的格式
    type: string;     // 元素型別
    properties?: {    // 如果是物件陣列，定義物件屬性
      [key: string]: {
        type: string;
      };
    };
  };
}

// 定義整個 actions.json 的結構
export interface ActionsConfig {
  actions: {          // 所有可用的動作
    [key: string]: ActionDefinition;  // key 是動作名稱，例如 'suggest_tasks'
  };
}

export type ParamType = 'string' | 'string[]' | 'task[]' 