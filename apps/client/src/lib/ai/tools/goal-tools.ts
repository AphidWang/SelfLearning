import { useTopicStore } from '../../../store/topicStore';
import type { Tool } from './types';
import type { Topic, Goal, Task } from '../../../types/goal';

// 建立主題
export const createTopicTool: Tool<{ topic: string }, Topic> = {
  name: 'create_topic',
  description: '建立新的學習主題',
  handler: async (params) => {
    const topicStore = useTopicStore.getState();
    const newTopic: Topic = {
      id: Date.now().toString(),
      title: params.topic,
      description: '',
      status: 'active',
      goals: [],
      owner_id: '',  // 這會由 store 處理
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    topicStore.addTopic(newTopic);
    return newTopic;
  }
};

// 建立目標
export const createGoalTool: Tool<{ goal_name: string }, Goal> = {
  name: 'create_goal',
  description: '建立新的學習目標',
  handler: async (params) => {
    const topicStore = useTopicStore.getState();
    const selectedTopicId = topicStore.selectedTopicId;
    if (!selectedTopicId) throw new Error('No topic selected');

    const newGoal: Goal = {
      id: `${selectedTopicId}-${Date.now()}`,
      title: params.goal_name,
      tasks: []
    };
    topicStore.addGoal(selectedTopicId, newGoal);
    return newGoal;
  }
};

// 建立任務
export const createTaskTool: Tool<{ task_name: string; goal_id: string }, Task> = {
  name: 'create_task',
  description: '建立新的學習任務',
  handler: async (params) => {
    const topicStore = useTopicStore.getState();
    const selectedTopicId = topicStore.selectedTopicId;
    if (!selectedTopicId) throw new Error('No topic selected');

    const newTask: Task = {
      id: `${params.goal_id}-${Date.now()}`,
      title: params.task_name,
      status: 'todo'
    };
    topicStore.addTask(selectedTopicId, params.goal_id, newTask);
    return newTask;
  }
};

// 使用模板目標
export const useTemplateGoalsTool: Tool<void, string[]> = {
  name: 'use_template_goals',
  description: '建立觀察/行動/紀錄/分享',
  handler: async () => {
    const topicStore = useTopicStore.getState();
    const selectedTopicId = topicStore.selectedTopicId;
    if (!selectedTopicId) throw new Error('No topic selected');

    const templateGoals = ['觀察', '行動', '紀錄', '分享'];
    const goals = templateGoals.map(goalName => {
      const goal: Goal = {
        id: `${selectedTopicId}-${Date.now()}-${goalName}`,
        title: goalName,
        tasks: []
      };
      topicStore.addGoal(selectedTopicId, goal);
      return goal;
    });

    return goals.map(goal => goal.title);
  }
};

// 完成主題
export const completeTopicTool: Tool<void, boolean> = {
  name: 'complete_topic',
  description: '結束主題',
  handler: async () => {
    const topicStore = useTopicStore.getState();
    const selectedTopicId = topicStore.selectedTopicId;
    if (!selectedTopicId) return false;

    const topic = topicStore.topics.find(t => t.id === selectedTopicId);
    if (!topic) return false;

    topicStore.updateTopic(selectedTopicId, {
      ...topic,
      status: 'completed'
    });
    return true;
  }
};

// 收藏主題
export const markAsBookmarkTool: Tool<void, boolean> = {
  name: 'mark_as_bookmark',
  description: '收藏主題',
  handler: async () => {
    const topicStore = useTopicStore.getState();
    const selectedTopicId = topicStore.selectedTopicId;
    if (!selectedTopicId) return false;

    const topic = topicStore.topics.find(t => t.id === selectedTopicId);
    if (!topic) return false;

    topicStore.updateTopic(selectedTopicId, {
      ...topic,
      status: 'archived'
    });
    return true;
  }
}; 