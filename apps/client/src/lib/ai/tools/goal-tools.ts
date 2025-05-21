import { useGoalStore } from '../../../store/goalStore';
import type { Tool } from './types';
import type { Goal, Step, Task, GoalStatus } from '../../../types/goal';

// 建立主題
export const createTopicTool: Tool<{ topic: string }, Goal> = {
  name: 'create_topic',
  description: '建立新的學習主題',
  handler: async (params) => {
    const goalStore = useGoalStore.getState();
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: params.topic,
      description: '',
      status: 'active',
      steps: []
    };
    goalStore.addGoal(newGoal);
    return newGoal;
  }
};

// 建立步驟
export const createStepTool: Tool<{ step_name: string }, Step> = {
  name: 'create_step',
  description: '建立新的學習步驟',
  handler: async (params) => {
    const goalStore = useGoalStore.getState();
    const selectedGoalId = goalStore.selectedGoalId;
    if (!selectedGoalId) throw new Error('No goal selected');

    const newStep: Step = {
      id: `${selectedGoalId}-${Date.now()}`,
      title: params.step_name,
      tasks: []
    };
    goalStore.addStep(selectedGoalId, newStep);
    return newStep;
  }
};

// 建立任務
export const createTaskTool: Tool<{ task_name: string; step_tag: string }, Task> = {
  name: 'create_task',
  description: '建立新的學習任務',
  handler: async (params) => {
    const goalStore = useGoalStore.getState();
    const selectedGoalId = goalStore.selectedGoalId;
    if (!selectedGoalId) throw new Error('No goal selected');

    const newTask: Task = {
      id: `${params.step_tag}-${Date.now()}`,
      title: params.task_name,
      status: 'todo'
    };
    goalStore.addTask(selectedGoalId, params.step_tag, newTask);
    return newTask;
  }
};

// 使用模板步驟
export const useTemplateStepsTool: Tool<void, string[]> = {
  name: 'use_template_steps',
  description: '建立觀察/行動/紀錄/分享',
  handler: async () => {
    const goalStore = useGoalStore.getState();
    const selectedGoalId = goalStore.selectedGoalId;
    if (!selectedGoalId) throw new Error('No goal selected');

    const templateSteps = ['觀察', '行動', '紀錄', '分享'];
    const steps = templateSteps.map(stepName => {
      const step: Step = {
        id: `${selectedGoalId}-${Date.now()}-${stepName}`,
        title: stepName,
        tasks: []
      };
      goalStore.addStep(selectedGoalId, step);
      return step;
    });

    return steps.map(step => step.title);
  }
};

// 完成主題
export const completeTopicTool: Tool<void, boolean> = {
  name: 'complete_topic',
  description: '結束主題',
  handler: async () => {
    const goalStore = useGoalStore.getState();
    const selectedGoalId = goalStore.selectedGoalId;
    if (!selectedGoalId) return false;

    const goal = goalStore.goals.find(g => g.id === selectedGoalId);
    if (!goal) return false;

    goalStore.updateGoal({
      ...goal,
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
    const goalStore = useGoalStore.getState();
    const selectedGoalId = goalStore.selectedGoalId;
    if (!selectedGoalId) return false;

    const goal = goalStore.goals.find(g => g.id === selectedGoalId);
    if (!goal) return false;

    goalStore.updateGoal({
      ...goal,
      status: 'archived'
    });
    return true;
  }
}; 