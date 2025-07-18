import { useTopicStore } from '../../../store/topicStore';
import { useGoalStore } from '../../../store/goalStore';
import { useTaskStore } from '../../../store/taskStore';
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
      creator_id: '',  // 這會由 store 處理
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_collaborative: false,
      show_avatars: false,
      version: 1
    };
    topicStore.createTopic(newTopic);
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

    const goalStore = useGoalStore.getState();
    const taskStore = useTaskStore.getState();
    const newGoal: Goal = {
      id: `${selectedTopicId}-${Date.now()}`,
      title: params.goal_name,
      topic_id: selectedTopicId,
      status: 'todo',
      priority: 'medium',
      order_index: 0,
      version: 1,
      tasks: [],
      creator_id: ''
    };
    await goalStore.addGoal(selectedTopicId, newGoal);
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

    const taskStore = useTaskStore.getState();
    const newTask: Task = {
      id: `${params.goal_id}-${Date.now()}`,
      title: params.task_name,
      status: 'todo',
      goal_id: params.goal_id,
      priority: 'medium',
      order_index: 0,
      task_type: 'single',
      task_config: { type: 'single' },
      cycle_config: { cycle_type: 'none', auto_reset: false },
      need_help: false,
      version: 1,
      creator_id: ''
    };
    await taskStore.addTask(params.goal_id, newTask);
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

    const goalStore = useGoalStore.getState();
    const templateGoals = ['觀察', '行動', '紀錄', '分享'];
    const goals = templateGoals.map(goalName => {
      const goal: Goal = {
        id: `${selectedTopicId}-${Date.now()}-${goalName}`,
        title: goalName,
        topic_id: selectedTopicId,
        status: 'todo',
        priority: 'medium',
        order_index: 0,
        version: 1,
        tasks: [],
        creator_id: ''
      };
      goalStore.addGoal(selectedTopicId, goal);
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

    await topicStore.updateTopic(selectedTopicId, topic.version, { status: 'completed' });
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

    await topicStore.updateTopic(selectedTopicId, topic.version, { status: 'archived' });
    return true;
  }
}; 