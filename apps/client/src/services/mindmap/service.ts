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
import { Goal, Step, Task, Bubble } from '../../types/goal';
import { stateMachine } from './config/stateMachine';
import { EventType } from './config/events';
import { MindmapStateController } from './controller/MindmapStateController';
import { STATE_PROMPTS } from '../../lib/ai/config/prompts/states';

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
  private stateController: MindmapStateController;
  private chatService: ChatService;
  private validator = new ActionValidator();
  private maxRetries = 3;  // 一般錯誤的重試次數
  private formConfigs: Record<string, ActionFormConfig>;
  private currentTopicId: string | null;
  private contextCache: any = null;
  private unsubscribe: (() => void) | null = null;
  private errorContext: string | null = null;  // 新增錯誤 context
  private currentMode: string | null = null;  // 新增 mode 屬性

  constructor(topicId: string | null = null) {
    this.stateController = new MindmapStateController();
    this.chatService = new ChatService();
    this.formConfigs = forms;
    this.currentTopicId = topicId
    this.setupContextSubscription();
    // 設定初始狀態為 exploration
    this.stateController.transition('exploration');
    // 清空 chatService 的歷史記錄
    this.chatService.clearHistory();
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
      this.contextCache = null;
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
          description: topic.description,
          bubbles: topic.bubbles?.map(bubble => ({
            id: bubble.id,
            title: bubble.title,
            content: bubble.content,
            bubbleType: bubble.bubbleType
          }))
        },
        steps: topic.steps.filter(step => step.status !== 'archived').map(step => ({
          id: step.id,
          title: step.title,
          tasks: step.tasks?.filter(task => task.status !== 'archived').map(task => ({
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
      this.contextCache = context || null;
    });

    // 初始化 context
    const initialContext = selector(useGoalStore.getState());
    this.contextCache = initialContext || null;
  }

  private async getMindmapContext(): Promise<any> {
    return this.contextCache || null;
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
      console.log('🔍 Raw LLM Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response length:', response.length);
      
      // 清理 JSON 字串
      response = response.trim();
      
      // 確保是有效的 JSON 字串
      if (!response.startsWith('{') || !response.endsWith('}')) {
        console.error('❌ Invalid JSON format:', response);
        throw new Error('Invalid JSON format');
      }
      
      // 只處理 message 欄位中的換行符號
      const messageMatch = response.match(/"message":\s*"([^"]*)"/);
      if (messageMatch) {
        const originalMessage = messageMatch[1];
        const escapedMessage = originalMessage.replace(/\n/g, '\\n');
        response = response.replace(originalMessage, escapedMessage);
      }
      
      console.log('🔍 Cleaned Response:', response);
      
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
        // 處理使用者輸入，不觸發狀態轉換
        const userEventResult = this.stateController.handleUserEvent('input_received', input);
        if (!userEventResult.allowed) {
          throw new Error(`Invalid user event: ${userEventResult.reason}`);
        }

        // 如果有錯誤 context，加到輸入中
        const actualInput = this.errorContext 
          ? `${this.errorContext}`
          : input;
        this.errorContext = null;
        
        // 更新 mindmap 上下文
        const currentContext = await this.getMindmapContext();
        this.chatService.updateMindmapContext(currentContext);

        // 根據當前模式添加提示
        let modePrompt = '';
        const currentState = this.stateController.getCurrentState();
        
        if (currentState === 'analysis') {
          modePrompt = '請以分析師的角度，深入分析以下內容：';
        }

        const response = await this.chatService.sendMessage(
          modePrompt ? `${modePrompt}\n${actualInput}` : actualInput, 
          {
            level: 'L3',
            state: currentState as keyof typeof STATE_PROMPTS
          }
        );
        
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

        // 檢查 LLM 回應的 action 是否合法
        if (!this.stateController.isToolAllowed(parsedResponse.tool)) {
          throw new Error(`當前狀態不允許使用工具: ${parsedResponse.tool}`);
        }

        // 如果動作合法但沒有對應的 form，當作聊天處理
        if (!formConfig) {
          console.log('⚠️ 動作合法但沒有對應的 form，轉為聊天處理', { 
            tool: parsedResponse.tool,
            params: parsedResponse.params 
          });
          return {
            tool: 'chat',
            params: {},
            message: response.message,
            form: {
              type: 'chat',
              title: '聊天',
              description: '與 AI 對話',
              options: []
            }
          };
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
              const mappedOptions = paramValue
                .slice(0, 4) // 限制最多四個選項
                .map(value => ({
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
    return useGoalStore.getState().goals.find(g => g.id === this.currentTopicId);
  }

  clearFocusElement() {
    const topic = this.getTopic();
    if (!topic) return;
    
    useGoalStore.getState().setFocusElement(topic.id, undefined);
  }

  addStep(step: Step) {
    console.log('🎯 MindMapService.addStep 開始', { step });
    if (!this.currentTopicId) {
      console.log('❌ 新增失敗：沒有當前主題');
      return null;
    }

    // 直接使用 goalStore 返回的步驟
    const newStep = useGoalStore.getState().addStep(this.currentTopicId, step);
    console.log('✅ 步驟已新增到 store', { newStep });
    return newStep;
  }

  updateGoal(goal: Goal) {
    console.log('🎯 MindMapService.updateGoal 開始', { goal });
    if (!this.currentTopicId) {
      console.log('❌ 更新失敗：沒有當前主題');
      return null;
    }

    const result = useGoalStore.getState().updateGoal(goal);
    console.log('✅ 目標更新結果', { result });
    return result;
  }

  updateStep(stepId: string, updates: Step) {
    if (!this.currentTopicId) return null;

    return useGoalStore.getState().updateStep(this.currentTopicId, updates);
  }

  addTask(stepId: string, task: Task) {
    if (!this.currentTopicId) return null;
    return useGoalStore.getState().addTask(this.currentTopicId, stepId, task);
  }

  addGoal(goal: Goal): Goal {
    console.log('🎯 MindMapService.addGoal 開始', { goal });
    const addedGoal = useGoalStore.getState().addGoal(goal);
    console.log('✅ 目標已新增', { addedGoal });
    return addedGoal;
  }

  updateTask(stepId: string, taskId: string, updates: Task) {
    console.log('🔍 MindMapService.updateTask 開始', { stepId, taskId, updates });
    
    if (!this.currentTopicId) {
      console.log('❌ 更新失敗：沒有當前主題');
      return null;
    }

    const result = useGoalStore.getState().updateTask(this.currentTopicId, stepId, updates);
    console.log('🔄 更新結果', { result });
    return result;
  }

  deleteStep(stepId: string) {
    if (!this.currentTopicId) return null;
    return useGoalStore.getState().deleteStep(this.currentTopicId, stepId);
  }

  deleteTask(stepId: string, taskId: string) {
    if (!this.currentTopicId) return null;
    return useGoalStore.getState().deleteTask(this.currentTopicId, stepId, taskId);
  }

  // Bubble 相關方法
  addBubble(bubble: Bubble) {
    if (!this.currentTopicId) return null;
    return useGoalStore.getState().addBubble(this.currentTopicId, bubble);
  }

  updateBubble(bubbleId: string, updates: Partial<Bubble>) {
    if (!this.currentTopicId) return null;
    return useGoalStore.getState().updateBubble(this.currentTopicId, bubbleId, updates);
  }

  deleteBubble(bubbleId: string) {
    if (!this.currentTopicId) return null;
    return useGoalStore.getState().deleteBubble(this.currentTopicId, bubbleId);
  }

  async handleAction(actionType: EventType, params: any): Promise<void> {
    // 檢查 AI 動作是否允許
    const actionResult = this.stateController.handleAIAction(actionType, params);
    if (!actionResult.allowed) {
      throw new Error(`Invalid action: ${actionResult.reason}`);
    }

    // 如果允許，執行狀態轉換
    if (actionResult.nextState) {
      this.stateController.transition(actionType);
    }

    console.log('👆 使用者觸發行為', { 
      actionType, 
      params,
      currentTopicId: this.currentTopicId,
      currentState: this.stateController.getCurrentState()
    });

    const topic = this.getTopic();
    if (!topic) {
      console.log('❌ 處理失敗：找不到當前主題');
      return;
    }

    try {
      switch (actionType) {
        case 'createTopic':
          console.log('📝 準備新增主題', { title: params });
          const newStep: Partial<Step> = {
            title: params,
            tasks: []
          };
          const createdStep = this.addStep(newStep as Step);
          console.log('✅ 主題新增結果', { createdStep });
          if (createdStep) {
            console.log('🎯 設定焦點到新主題', { 
              type: 'step',
              id: createdStep.id 
            });
            useGoalStore.getState().setFocusElement(topic.id, {
              type: 'step',
              id: createdStep.id
            });
          }
          break;

        case 'createStep':
          console.log('📝 準備新增步驟', { title: params });
          const step: Partial<Step> = {
            title: params,
            tasks: []
          };
          const addedStep = this.addStep(step as Step);
          console.log('✅ 步驟新增結果', { addedStep });
          if (addedStep) {
            console.log('🎯 設定焦點到新步驟', {
              type: 'step',
              id: addedStep.id
            });
            useGoalStore.getState().setFocusElement(topic.id, {
              type: 'step',
              id: addedStep.id
            });
          }
          break;

        case 'createTask':
          this.stateController.transition('task_started');
          try {
            console.log('📝 準備新增任務', { params });
            if (!params.step_id) {
              console.log('❌ 新增失敗：缺少步驟 ID');
              throw new LLMRetryError('哎呀！我需要知道要把任務加到哪個步驟。讓我想想看...');
            }
            
            const task: Partial<Task> = {
              title: params.task_name,
              status: 'todo'
            };

            // 確認步驟存在
            const currentTopic = this.getTopic();
            if (!currentTopic) {
              console.log('❌ 新增失敗：找不到當前主題');
              throw new LLMRetryError('找不到目前的主題，讓我檢查一下...');
            }

            if (currentTopic.steps.length === 0) {
              console.log('❌ 新增失敗：沒有任何步驟');
              throw new LLMRetryError('需要先建立步驟。建議使用 use_template_steps 建立預設步驟結構。');
            }

            const targetStep = currentTopic.steps.find(s => s.id === params.step_id);
            if (!targetStep) {
              console.log('❌ 新增失敗：找不到目標步驟', { stepId: params.step_id });
              throw new LLMRetryError('咦？這個步驟好像不見了。讓我檢查一下...');
            }

            const addedTask = this.addTask(params.step_id, task as Task);
            console.log('✅ 任務新增結果', { addedTask });
            if (addedTask) {
              console.log('🎯 設定焦點到新任務', {
                type: 'task',
                id: addedTask.id
              });
              useGoalStore.getState().setFocusElement(topic.id, {
                type: 'task',
                id: addedTask.id
              });
            }
          } catch (error) {
            console.error('❌ 建立任務時發生錯誤:', error);
            throw error;
          }
          break;

        case 'createTopics':
          console.log('📝 準備批量新增主題', { topics: params });
          let lastCreatedStepId: string | null = null;
          params.forEach((title: string) => {
            const step: Partial<Step> = {
              title,
              tasks: []
            };
            const createdStep = this.addStep(step as Step);
            console.log('✅ 主題新增結果', { title, createdStep });
            if (createdStep) {
              lastCreatedStepId = createdStep.id;
            }
          });
          if (lastCreatedStepId) {
            console.log('🎯 設定焦點到最後新增的主題', {
              type: 'step',
              id: lastCreatedStepId
            });
            useGoalStore.getState().setFocusElement(topic.id, {
              type: 'step',
              id: lastCreatedStepId
            });
          }
          break;

        case 'createSteps':
          console.log('📝 準備批量新增步驟', { steps: params });
          let lastAddedStepId: string | null = null;
          params.forEach((title: string) => {
            const step: Partial<Step> = {
              title,
              tasks: []
            };
            const addedStep = this.addStep(step as Step);
            console.log('✅ 步驟新增結果', { title, addedStep });
            if (addedStep) {
              lastAddedStepId = addedStep.id;
            }
          });
          if (lastAddedStepId) {
            console.log('🎯 設定焦點到最後新增的步驟', {
              type: 'step',
              id: lastAddedStepId
            });
            useGoalStore.getState().setFocusElement(topic.id, {
              type: 'step',
              id: lastAddedStepId
            });
          }
          break;

        case 'createTasks':
          console.log('📝 準備批量新增任務', { tasks: params });
          let lastAddedTaskId: string | null = null;
          params.forEach((taskParam: { task_name: string, step_tag: string }) => {
            const newTask: Partial<Task> = {
              title: taskParam.task_name,
              status: 'todo'
            };
            const addedTask = this.addTask(taskParam.step_tag, newTask as Task);
            console.log('✅ 任務新增結果', { 
              title: taskParam.task_name, 
              stepId: taskParam.step_tag,
              addedTask 
            });
            if (addedTask) {
              lastAddedTaskId = addedTask.id;
            }
          });
          if (lastAddedTaskId) {
            console.log('🎯 設定焦點到最後新增的任務', {
              type: 'task',
              id: lastAddedTaskId
            });
            useGoalStore.getState().setFocusElement(topic.id, {
              type: 'task',
              id: lastAddedTaskId
            });
          }
          break;

        case 'use_template_steps':
          console.log('📝 準備使用模板步驟');
          let lastTemplateStepId: string | null = null;
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
          templateSteps.forEach(step => {
            const addedStep = this.addStep(step as Step);
            console.log('✅ 模板步驟新增結果', { 
              title: step.title,
              order: step.order,
              addedStep 
            });
            if (addedStep) {
              lastTemplateStepId = addedStep.id;
            }
          });
          if (lastTemplateStepId) {
            console.log('🎯 設定焦點到最後新增的模板步驟', {
              type: 'step',
              id: lastTemplateStepId
            });
            useGoalStore.getState().setFocusElement(topic.id, {
              type: 'step',
              id: lastTemplateStepId
            });
          }
          break;
      }
    } catch (error) {
      console.error('❌ 處理使用者行為時發生錯誤:', error);
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

  // 新增狀態相關方法
  getCurrentState(): string {
    return this.stateController.getCurrentState();
  }

  getStateInfo() {
    return this.stateController.getCurrentStateInfo();
  }

  getAvailableTools(): string[] {
    return this.stateController.getAvailableTools();
  }

  getAvailableEvents(): EventType[] {
    return this.stateController.getAvailableEvents();
  }

  canTrigger(event: EventType): boolean {
    return this.stateController.canTrigger(event);
  }

  // 新增 setMode 方法
  setMode(mode: string | null) {
    console.log('🎯 設置模式:', mode);

    // 根據 mode 設定對應的 state
    switch (mode) {
      case 'summarize':
        this.stateController.setState('summarize');
        break;
      case 'exploration':
        this.stateController.setState('exploration');
        break;
      case 'mission_search':
        this.stateController.setState('mission_search');
        break;
      case 'bubble_idea_search':
        this.stateController.setState('bubble_idea_search');
        break;
      case 'step_search':
        this.stateController.setState('step_search');
        break;
      default:
        this.stateController.setState('exploration');
    }

    this.currentMode = mode;
    // 清空歷史記錄，避免上下文混淆
    this.chatService.clearHistory();
  }

  // 新增 getMode 方法
  getMode(): string | null {
    return this.currentMode;
  }
} 