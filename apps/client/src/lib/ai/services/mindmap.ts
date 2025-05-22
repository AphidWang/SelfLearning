import { ChatService } from './chat';
import { useGoalStore } from '../../../store/goalStore';
import { ActionValidator } from '../utils/actionValidator';
import type { LLMResponse, ActionForm, ParamType } from '../types/llm';
import { tools } from '../tools';
import type { Tool } from '../tools/types';
import forms from '../config/forms.json';
import actions from '../config/actions.json';

export interface MindMapAction {
  type: string;
  payload: any;
}

interface FormConfig {
  type: string;
  title: string;
  description: string;
  additionalOptions?: Array<{
    text: string;
    action: {
      type: string;
      params: Record<string, any>;
    };
  }>;
  options?: Array<{
    paramSource: string;
    paramAction: string;
    action?: {
      type: string;
      params: Record<string, any>;
    };
    isSuggestions?: boolean;
  }>;
}

interface FormsConfig {
  [key: string]: FormConfig;
}

export class MindMapService {
  private chatService: ChatService;
  private goalStore = useGoalStore.getState();
  private validator = new ActionValidator();
  private maxRetries = 3;
  private formConfigs: FormsConfig;

  constructor() {
    this.chatService = new ChatService();
    this.formConfigs = forms;
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
      console.log('📝 LLM Response:', response);
      const parsedResponse = JSON.parse(response) as LLMResponse;
      console.log('🔍 Parsed Response:', parsedResponse);
      
      if (!this.validator.validateAction(parsedResponse.tool, parsedResponse.params)) {
        throw new Error('Invalid action parameters');
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
        const response = await this.chatService.sendMessage(input);
        const parsedResponse = await this.processLLMResponse(response.message);
        
        // 從 forms.json 獲取表單定義
        const formConfig = this.formConfigs[parsedResponse.tool];
        if (!formConfig) {
          throw new Error(`Unknown form type: ${parsedResponse.tool}`);
        }

        // 從 actions.json 獲取參數定義
        const actionConfig = actions[parsedResponse.tool];
        if (!actionConfig) {
          throw new Error(`Unknown action type: ${parsedResponse.tool}`);
        }

        // 處理每個選項的參數轉換
        const updatedOptions = formConfig.options?.map(option => {
          if (option.paramSource) {
            const paramValue = parsedResponse.params[option.paramSource];
            const paramConfig = actionConfig.params.find(p => p.name === option.paramSource);
            if (!paramConfig) {
              throw new Error(`Unknown parameter: ${option.paramSource}`);
            }
            const { type } = this.convertJsonSchemaToParamType(paramConfig);
            
            // 如果參數值是陣列，每個元素都要有自己的 action
            if (Array.isArray(paramValue)) {
              return {
                paramSource: option.paramSource,
                param: paramValue.map(value => ({
                  label: typeof value === 'string' ? value : value.task_name,
                  action: {
                    type: option.paramAction || formConfig.type,
                    params: value
                  }
                })),
                paramType: type
              };
            }
            
            return {
              paramSource: option.paramSource,
              param: {
                label: typeof paramValue === 'string' ? paramValue : paramValue.task_name,
                action: {
                  type: option.paramAction || formConfig.type,
                  params: {
                    ...parsedResponse.params,
                    [option.paramSource]: paramValue
                  }
                }
              },
              paramType: type
            };
          }
          return option;
        }) || [];

        // 處理額外選項
        const additionalOptions = formConfig.additionalOptions?.map(option => {
          // 替換參數中的變數
          const params = Object.entries(option.action.params).reduce((acc, [key, value]) => {
            if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
              const paramName = value.slice(2, -1);
              acc[key] = parsedResponse.params[paramName];
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as Record<string, any>);

          return {
            paramSource: option.text,
            param: option.text,
            paramType: 'string',
            action: {
              type: option.action.type,
              params
            }
          };
        }) || [];

        return {
          ...parsedResponse,
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