import type { ActionForm } from '../types/llm';

export interface Tool<TParams = any, TResult = any> {
  name: string;
  description: string;
  handler: (params: TParams) => Promise<TResult>;
} 