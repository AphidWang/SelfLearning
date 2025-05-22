import { ChatService } from '../../lib/ai/services/chat';
import { useGoalStore } from '../../store/goalStore';
import { ActionValidator } from '../../lib/ai/utils/actionValidator';
import type { 
  LLMResponse, 
  ActionForm,
  ActionFormConfig,
  ParamType,
  ActionDefinition,
  ActionParamDefinition,
  ActionsConfig 
} from '../../lib/ai/types/llm';
import { tools } from '../../lib/ai/tools';
import type { Tool } from '../../lib/ai/tools/types';
import forms from './config/forms.json';
import actions from '../../lib/ai/config/actions.json';
import { Goal, Step, Task } from '../../types/goal';

// 系統錯誤
class SystemError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'SystemError';
    this.code = code;
  }
}

// LLM 相關錯誤
class LLMRetryError extends Error {
  static maxRetries = 5;
  constructor(message: string) {
    super(message);
    this.name = 'LLMRetryError';
  }
}

// 錯誤代碼定義
const ErrorCodes = {
  STEP_ID_REQUIRED: 'STEP_ID_REQUIRED',
  TOPIC_NOT_FOUND: 'TOPIC_NOT_FOUND',
  STEP_NOT_FOUND: 'STEP_NOT_FOUND',
  NO_STEPS: 'NO_STEPS'
} as const;

export interface MindMapAction {
  type: string;
  payload: any;
}

export class MindMapService {
  private chatService: ChatService;
  private goalStore = useGoalStore.getState();
  private validator = new ActionValidator();
  private maxRetries = 3;  // 一般錯誤的重試次數
  private formConfigs: Record<string, ActionFormConfig>;
  private currentTopicId: string | null;
  private contextCache: string | null = null;
  private unsubscribe: (() => void) | null = null;
  private errorContext: string | null = null;  // 新增錯誤 context

  constructor(topicId: string | null = null) {
    this.chatService = new ChatService();
    this.formConfigs = forms;
    this.currentTopicId = topicId;
    this.setupContextSubscription();
  }

  setCurrentTopic(topicId: string | null) {
    if (this.currentTopicId !== topicId) {
      this.currentTopicId = topicId;
      this.contextCache = null;
      this.setupContextSubscription();
    }
  }

  private setupContextSubscription() {
    // 清除舊的訂閱
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    if (!this.currentTopicId) {
      this.contextCache = 'No active topic';
      return;
    }

    // 使用 selector 只訂閱需要的部分
    const selector = (state: ReturnType<typeof useGoalStore.getState>) => {
      const topic = state.goals.find(g => g.id === this.currentTopicId);
      if (!topic) return null;

      return {
        topic: {
          id: topic.id,
          title: topic.title,
          description: topic.description
        },
        steps: topic.steps.map(step => ({
          id: step.id,
          title: step.title,
          tasks: step.tasks?.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status
          }))
        }))
      };
    };

    // 訂閱變化
    this.unsubscribe = useGoalStore.subscribe((state) => {
      const context = selector(state);
      if (context) {
        this.contextCache = JSON.stringify(context, null, 2);
      } else {
        this.contextCache = 'Topic not found';
      }
    });

    // 初始化 context
    const initialContext = selector(this.goalStore);
    this.contextCache = initialContext 
      ? JSON.stringify(initialContext, null, 2)
      : 'Topic not found';
  }

  private async getMindmapContext(): Promise<string> {
    return this.contextCache || 'No active topic';
  }

  private convertJsonSchemaToParamType(schema: any): { type: ParamType } {
    if (schema.type === 'array') {
      if (schema.items.type === 'object') {
        // 只檢查是否為 task 型別
        if (schema.items.properties?.task_name && schema.items.properties?.step_tag) {
          return { type: 'task[]' };
        }
      }
      return { type: 'string[]' };
    }
    return { type: 'string' };
  }

  async processLLMResponse(response: string): Promise<LLMResponse> {
    try {
      const parsedResponse = JSON.parse(response) as LLMResponse;
      console.log('🔍 Parsed Response:', parsedResponse);
      
      // 檢查 action 定義
      const actionConfig = (actions as ActionsConfig).actions[parsedResponse.tool];
      if (!actionConfig) {
        throw new Error(`Unknown action type: ${parsedResponse.tool}`);
      }

      // 檢查參數格式
      for (const [paramName, paramConfig] of Object.entries(actionConfig.params)) {
        const paramValue = parsedResponse.params[paramName];
        const typedParamConfig = paramConfig as ActionParamDefinition;
        
        if (typedParamConfig.required && !paramValue) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }

        if (paramValue) {
          if (typedParamConfig.type === 'array') {
            if (!Array.isArray(paramValue)) {
              throw new Error(`Parameter ${paramName} should be an array`);
            }

            if (typedParamConfig.items?.type === 'object') {
              for (const item of paramValue) {
                if (typeof item !== 'object') {
                  throw new Error(`Array items in ${paramName} should be objects`);
                }
                // 檢查必要屬性
                for (const [propName, propConfig] of Object.entries(typedParamConfig.items.properties || {})) {
                  if (!(propName in item)) {
                    throw new Error(`Missing required property ${propName} in array item of ${paramName}`);
                  }
                }
              }
            } else if (typedParamConfig.items?.type === 'string') {
              for (const item of paramValue) {
                if (typeof item !== 'string') {
                  throw new Error(`Array items in ${paramName} should be strings`);
                }
              }
            }
          }
        }
      }

      return parsedResponse;
    } catch (error) {
      console.error('❌ Failed to process LLM response:', error);
      throw error;
    }
  }

  async handleUserInput(input: string): Promise<LLMResponse> {
    let retries = 0;
    let lastError: Error | null = null;
    let maxAttempts = this.maxRetries;

    while (retries < maxAttempts) {
      try {
        // 如果有錯誤 context，加到輸入中
        const actualInput = this.errorContext 
          ? `${this.errorContext}`
          : input;
        this.errorContext = null;  // 清空錯誤 context
        
        // 更新 mindmap 上下文
        const currentContext = await this.getMindmapContext();
        this.chatService.updateMindmapContext(currentContext);

        const response = await this.chatService.sendMessage(actualInput);
        
        // 先檢查 API 狀態
        if ('status' in response) {
          const status = (response as { status: number }).status;
          if (status >= 500) {
            throw new Error('哎呀！伺服器好像累了，讓我休息一下... 🦥');
          } else if (status >= 400) {
            throw new Error('請求似乎有點問題，讓我檢查一下... 🤔');
          }
        }

        if (!response?.message) {
          throw new Error('無效的回應格式');
        }
         
        const parsedResponse = await this.processLLMResponse(response.message);
        console.log('🔍 Parsed LLM Response:', parsedResponse);
        
        // 從 forms.json 獲取表單定義
        const formConfig = this.formConfigs[parsedResponse.tool];
        console.log('📋 Form Config:', formConfig);
        
        // 從 actions.json 獲取參數定義
        const actionConfig = actions.actions[parsedResponse.tool];
        console.log('⚡ Action Config:', actionConfig);

        if (!formConfig) {
          throw new Error(`Unknown form type: ${parsedResponse.tool}`);
        }

        if (!actionConfig) {
          throw new Error(`Unknown action type: ${parsedResponse.tool}`);
        }

        // 處理每個選項的參數轉換
        const updatedOptions = formConfig.options?.map(option => {
          if (option.paramSource) {
            const paramValue = parsedResponse.params[option.paramSource];
            console.log('🔍 Param Value:', paramValue);
            
            // 如果參數值是陣列，每個元素都要有自己的 action
            if (Array.isArray(paramValue)) {
              const mappedOptions = paramValue.map(value => ({
                label: typeof value === 'string' ? value : value.task_name,
                action: {
                  type: option.paramAction,
                  params: value
                }
              }));
              return mappedOptions;
            }
            
            const singleOption = {
              label: typeof paramValue === 'string' ? paramValue : paramValue.task_name,
              action: {
                type: option.paramAction,
                params: paramValue
              }
            };
            return singleOption;
          }
          return option;
        }).flat() || [];

        console.log('📋 Final Updated Options:', updatedOptions);

        // 處理額外選項
        const additionalOptions = formConfig.additionalOptions?.map(option => ({
          label: option.text,
          action: {
            type: option.action,
            params: option.text
          }
        })) || [];

        return {
          tool: parsedResponse.tool,
          params: parsedResponse.params,
          message: parsedResponse.message || '',
          form: {
            ...formConfig,
            options: [...updatedOptions, ...additionalOptions]
          } as ActionForm
        };
      } catch (error) {
        const err = error as Error & { response?: { data?: any; status?: number } };
        lastError = err;
        console.error('❌ Error details:', {
          message: err.message,
          stack: err.stack,
          response: err.response?.data,
          status: err.response?.status
        });
        retries++;

        if (err instanceof LLMRetryError) {
          maxAttempts = LLMRetryError.maxRetries;
          this.errorContext = `[系統錯誤] ${err.message}`;
        }
        
        if (retries < maxAttempts) {
          console.log(`Retrying... (${retries}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw new Error(`重試 ${maxAttempts} 次後仍然失敗：${lastError?.message}`);
  }

  async executeAction(toolName: string, params: any): Promise<any> {
    const tool = tools.find((t: Tool) => t.name === toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    console.log('⚡ Executing action:', toolName, 'with payload:', params);
    
    if (!this.validator.validateAction(toolName, params)) {
      console.error('❌ Invalid action parameters');
      throw new Error('Invalid action parameters');
    }

    const result = await tool.handler(params);
    console.log('✅ Action result:', result);
    
    return result;
  }

  // 主題相關的 API
  private getTopic(): Goal | undefined {
    return this.goalStore.goals.find(g => g.id === this.currentTopicId);
  }

  private updateTopic(topic: Goal) {
    this.goalStore.updateGoal(topic);
  }

  clearFocusElement() {
    const topic = this.getTopic();
    if (!topic) return;
    
    this.updateTopic({
      ...topic,
      focusElement: undefined
    });
  }

  addStep(step: Step) {
    console.log('🎯 MindMapService.addStep 開始', { step });
    if (!this.currentTopicId) {
      console.log('❌ 新增失敗：沒有當前主題');
      return null;
    }

    // 直接使用 goalStore 返回的步驟
    const newStep = this.goalStore.addStep(this.currentTopicId, step);
    console.log('✅ 步驟已新增到 store', { newStep });
    return newStep;
  }

  updateStep(stepId: string, updates: Step) {
    if (!this.currentTopicId) return null;

    return this.goalStore.updateStep(this.currentTopicId, updates);
  }

  addTask(stepId: string, task: Task) {
    if (!this.currentTopicId) return null;

    return this.goalStore.addTask(this.currentTopicId, stepId, task);
  }

  updateTask(stepId: string, taskId: string, updates: Task) {
    console.log('🔍 MindMapService.updateTask 開始', { stepId, taskId, updates });
    
    if (!this.currentTopicId) {
      console.log('❌ 更新失敗：沒有當前主題');
      return null;
    }

    const result = this.goalStore.updateTask(this.currentTopicId, stepId, updates);
    console.log('🔄 更新結果', { result });
    return result;
  }

  async handleAction(actionType: string, params: any): Promise<void> {
    const topic = this.getTopic();
    if (!topic) return;

    try {
      switch (actionType) {
        case 'createTopic':
          // 新增主題，params 是 string
          const newStep: Partial<Step> = {
            title: params,
            tasks: []
          };
          this.addStep(newStep as Step);
          break;

        case 'createStep':
          // 新增步驟，params 是 string
          const step: Partial<Step> = {
            title: params,
            tasks: []
          };
          this.addStep(step as Step);
          break;

        case 'createTask':
          try {
            if (!params.step_id) {
              throw new LLMRetryError('哎呀！我需要知道要把任務加到哪個步驟。讓我想想看...');
            }
            
            const task: Partial<Task> = {
              title: params.task_name,
              status: 'todo'
            };

            // 確認步驟存在
            const topic = this.getTopic();
            if (!topic) {
              throw new LLMRetryError('找不到目前的主題，讓我檢查一下...');
            }

            if (topic.steps.length === 0) {
              throw new LLMRetryError('需要先建立步驟。建議使用 use_template_steps 建立預設步驟結構。');
            }

            const step = topic.steps.find(s => s.id === params.step_id);
            if (!step) {
              throw new LLMRetryError('咦？這個步驟好像不見了。讓我檢查一下...');
            }

            this.addTask(params.step_id, task as Task);
          } catch (error) {
            console.error('建立任務失敗:', error);
            throw error;
          }
          break;

        case 'createTopics':
          // 批量新增主題，params 是 string[]
          params.forEach((title: string) => {
            const step: Partial<Step> = {
              title,
              tasks: []
            };
            this.addStep(step as Step);
          });
          break;

        case 'createSteps':
          // 批量新增步驟，params 是 string[]
          params.forEach((title: string) => {
            const step: Partial<Step> = {
              title,
              tasks: []
            };
            this.addStep(step as Step);
          });
          break;

        case 'createTasks':
          // 批量新增任務，params 是 { task_name: string, step_tag: string }[]
          params.forEach((task: { task_name: string, step_tag: string }) => {
            const newTask: Partial<Task> = {
              title: task.task_name,
              status: 'todo'
            };
            this.addTask(task.step_tag, newTask as Task);
          });
          break;

        case 'use_template_steps':
          // 使用模板步驟
          const templateSteps: Partial<Step>[] = [
            {
              title: '觀察',
              tasks: [],
              order: 1
            },
            {
              title: '行動',
              tasks: [],
              order: 2
            },
            {
              title: '紀錄',
              tasks: [],
              order: 3
            },
            {
              title: '分享',
              tasks: [],
              order: 4
            }
          ];
          templateSteps.forEach(step => this.addStep(step as Step));
          break;
      }
    } catch (error) {
      console.error('處理動作時發生錯誤:', error);
      throw error;
    }
  }

  private calculateProgress(goal: Goal): number {
    const totalTasks = goal.steps.reduce((sum, step) => sum + step.tasks.length, 0);
    if (totalTasks === 0) return 0;

    const completedTasks = goal.steps.reduce((sum, step) => 
      sum + step.tasks.filter(task => task.status === 'done').length, 0
    );

    return Math.round((completedTasks / totalTasks) * 100);
  }
} 