import { useGoalStore } from '../../../store/goalStore';
import type { Tool } from './types';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { ActionValidator } from '../utils/actionValidator';

const forms = yaml.load(fs.readFileSync(path.join(process.cwd(), 'src/lib/ai/config/forms.yaml'), 'utf8')) as Record<string, any>;

const actionValidator = new ActionValidator();

// 進度摘要
export const summarizeProgressTool: Tool<void, { progress: number; summary: string }> = {
  name: 'summarize_progress',
  description: '顯示目前進度',
  form: forms.summarize_progress,
  handler: async () => {
    const goalStore = useGoalStore.getState();
    const selectedGoalId = goalStore.selectedGoalId;
    if (!selectedGoalId) return { progress: 0, summary: '' };

    const goal = goalStore.goals.find(g => g.id === selectedGoalId);
    if (!goal) return { progress: 0, summary: '' };

    const totalTasks = goal.steps.reduce((sum, step) => sum + step.tasks.length, 0);
    const completedTasks = goal.steps.reduce((sum, step) => 
      sum + step.tasks.filter(task => task.status === 'done').length, 0
    );
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      progress,
      summary: `已完成 ${completedTasks}/${totalTasks} 個任務`
    };
  }
};

// 請求輸入
export const askForInputTool: Tool<void, { prompt: string }> = {
  name: 'ask_for_input',
  description: '引導孩子說出任務想法',
  form: forms.ask_for_input,
  handler: async () => {
    return { prompt: '請告訴我你的想法...' };
  }
}; 