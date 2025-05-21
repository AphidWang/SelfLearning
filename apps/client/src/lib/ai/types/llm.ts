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
  fields: {
    name: string;
    label: string;
    type: 'text' | 'select' | 'multiselect';
    options?: { label: string; value: string }[];
    required: boolean;
  }[];
  submitLabel: string;
  cancelLabel: string;
} 