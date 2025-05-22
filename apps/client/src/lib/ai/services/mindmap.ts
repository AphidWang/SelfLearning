import { ChatService } from './chat';
import { useGoalStore } from '../../../store/goalStore';
import { ActionValidator } from '../utils/actionValidator';
import type { 
  LLMResponse, 
  ActionForm,
  ActionFormConfig,
  ParamType,
  ActionDefinition,
  ActionParamDefinition,
  ActionsConfig 
} from '../types/llm';
import { tools } from '../tools';
import type { Tool } from '../tools/types';
import forms from '../config/forms.json';
import actions from '../config/actions.json';

export interface MindMapAction {
  type: string;
  payload: any;
}

export class MindMapService {
  private chatService: ChatService;
  private goalStore = useGoalStore.getState();
  private validator = new ActionValidator();
  private maxRetries = 3;
  private formConfigs: Record<string, ActionFormConfig>;
  private currentGoalId: string | null;
  private contextCache: string | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(goalId: string | null = null) {
    this.chatService = new ChatService();
    this.formConfigs = forms;
    this.currentGoalId = goalId;
    this.setupContextSubscription();
  }

  setCurrentGoal(goalId: string | null) {
    if (this.currentGoalId !== goalId) {
      this.currentGoalId = goalId;
      this.contextCache = null;
      this.setupContextSubscription();
    }
  }

  private setupContextSubscription() {
    // 清除舊的訂閱
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    if (!this.currentGoalId) {
      this.contextCache = 'No active goal';
      return;
    }

    // 使用 selector 只訂閱需要的部分
    const selector = (state: ReturnType<typeof useGoalStore.getState>) => {
      const goal = state.goals.find(g => g.id === this.currentGoalId);
      if (!goal) return null;

      return {
        goal: {
          id: goal.id,
          title: goal.title,
          description: goal.description
        },
        topics: goal.steps.map(step => ({
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
        this.contextCache = 'Goal not found';
      }
    });

    // 初始化 context
    const initialContext = selector(this.goalStore);
    this.contextCache = initialContext 
      ? JSON.stringify(initialContext, null, 2)
      : 'Goal not found';
  }

  private async getMindmapContext(): Promise<string> {
    return this.contextCache || 'No active goal';
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

    while (retries < this.maxRetries) {
      try {
        // 更新 mindmap 上下文
        const currentContext = await this.getMindmapContext();
        this.chatService.updateMindmapContext(currentContext);

        const response = await this.chatService.sendMessage(input);
         
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
        
        if (retries < this.maxRetries) {
          console.log(`Retrying... (${retries}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw new Error(`Failed after ${this.maxRetries} retries: ${lastError?.message}`);
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
} 