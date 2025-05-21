import type { ActionForm } from '../types/llm';

export interface ActionDefinition {
  type: string;
  description: string;
  params: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    description: string;
  }[];
  returnType: 'boolean' | 'object' | 'array' | 'string';
  form: ActionForm;
}

export const ACTIONS: Record<string, ActionDefinition> = {
  create_topic: {
    type: 'create_topic',
    description: '建立新的學習主題',
    params: [
      {
        name: 'topic',
        type: 'string',
        required: true,
        description: '主題名稱'
      }
    ],
    returnType: 'object',
    form: {
      type: 'create_topic',
      title: '建立新主題',
      description: '請輸入主題名稱',
      fields: [
        {
          name: 'topic',
          label: '主題名稱',
          type: 'text',
          required: true
        }
      ],
      submitLabel: '建立',
      cancelLabel: '取消'
    }
  },
  create_step: {
    type: 'create_step',
    description: '在當前主題下建立新的學習步驟',
    params: [
      {
        name: 'step_name',
        type: 'string',
        required: true,
        description: '步驟名稱'
      }
    ],
    returnType: 'object',
    form: {
      type: 'create_step',
      title: '建立新步驟',
      description: '請輸入步驟名稱',
      fields: [
        {
          name: 'step_name',
          label: '步驟名稱',
          type: 'text',
          required: true
        }
      ],
      submitLabel: '建立',
      cancelLabel: '取消'
    }
  },
  create_task: {
    type: 'create_task',
    description: '在指定步驟下建立新的任務',
    params: [
      {
        name: 'task_name',
        type: 'string',
        required: true,
        description: '任務名稱'
      },
      {
        name: 'step_tag',
        type: 'string',
        required: true,
        description: '所屬步驟 ID'
      }
    ],
    returnType: 'object',
    form: {
      type: 'create_task',
      title: '建立新任務',
      description: '請輸入任務資訊',
      fields: [
        {
          name: 'task_name',
          label: '任務名稱',
          type: 'text',
          required: true
        },
        {
          name: 'step_tag',
          label: '所屬步驟',
          type: 'select',
          required: true
        }
      ],
      submitLabel: '建立',
      cancelLabel: '取消'
    }
  }
}; 