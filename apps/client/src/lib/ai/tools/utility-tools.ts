import { useTopicStore } from '../../../store/topicStore';
import type { Tool } from './types';
import { ActionValidator } from '../utils/actionValidator';

const actionValidator = new ActionValidator();

// 進度摘要
export const summarizeProgressTool: Tool<void, { progress: number; summary: string }> = {
  name: 'summarize_progress',
  description: '顯示目前進度',
  handler: async () => {
    const topicStore = useTopicStore.getState();
    const selectedTopicId = topicStore.selectedTopicId;
    if (!selectedTopicId) return { progress: 0, summary: '' };

    const topic = topicStore.topics.find(t => t.id === selectedTopicId);
    if (!topic) return { progress: 0, summary: '' };

    const totalTasks = topic.goals.reduce((sum, goal) => sum + goal.tasks.length, 0);
    const completedTasks = topic.goals.reduce((sum, goal) => 
      sum + goal.tasks.filter(task => task.status === 'done').length, 0
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
  handler: async () => {
    return { prompt: '請告訴我你的想法...' };
  }
}; 