export interface LLMResponse {
  tool: string;
  params: Record<string, any>;
  suggestions?: {
    text: string;
    description: string;
    action: string;
    params: Record<string, any>;
  }[];
  error?: string;
  form?: ActionForm;
}

export interface ActionForm {
  type: string;
  title: string;
  description: string;
  options: Array<{
    paramSource: string;
    param?: any;
    paramType?: ParamType;
    action?: {
      type: string;
      params: Record<string, any>;
    };
  }>;
}

export interface Task {
  task_name: string;
  step_tag: string;
}

export interface ActionDefinition {
  type: string;
  description: string;
  params: {
    [key: string]: {
      type: string;
      required: boolean;
      description: string;
      items?: {
        type: string;
        properties?: {
          [key: string]: {
            type: string;
          };
        };
      };
    };
  };
}

export type ParamType = 'string' | 'string[]' | 'task[]' 