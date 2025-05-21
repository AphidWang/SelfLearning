import { ChatService } from './chat';
import { useGoalStore } from '../../../store/goalStore';
import type { Goal, Step, Task } from '../../../types/goal';
import { ActionValidator } from '../utils/actionValidator';
import type { LLMResponse, ActionForm } from '../types/llm';
import { tools } from '../tools';
import type { Tool } from '../tools/types';
import forms from '../config/forms.json';

export interface MindMapAction {
  type: string;
  payload: any;
}

interface FormConfig {
  type: string;
  title: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: Array<{ label: string; value: string }>;
  }>;
  submitLabel: string;
  cancelLabel: string;
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

        // 如果是 create_task，需要動態添加選項
        if (parsedResponse.tool === 'create_task') {
          const stepField = formConfig.fields.find(f => f.name === 'step_tag');
          if (stepField) {
            stepField.options = this.goalStore.goals
              .find(g => g.id === this.goalStore.selectedGoalId)
              ?.steps.map(step => ({
                label: step.title,
                value: step.id
              })) || [];
          }
        }
        
        return {
          ...parsedResponse,
          form: formConfig as ActionForm
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