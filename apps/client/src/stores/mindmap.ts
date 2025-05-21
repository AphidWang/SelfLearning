import { useGoalStore } from './goalStore';
import type { Goal, Step, Task } from '../types/goal';

export class MindMapStore {
  private goalStore = useGoalStore.getState();

  createTopic(topic: string) {
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: topic,
      description: '',
      status: 'active',
      steps: []
    };
    this.goalStore.addGoal(newGoal);
    return newGoal;
  }

  createStep(stepName: string) {
    const selectedGoalId = this.goalStore.selectedGoalId;
    if (!selectedGoalId) return null;

    const newStep: Step = {
      id: `${selectedGoalId}-${Date.now()}`,
      title: stepName,
      tasks: []
    };
    this.goalStore.addStep(selectedGoalId, newStep);
    return newStep;
  }

  createTask(taskName: string, stepTag: string) {
    const selectedGoalId = this.goalStore.selectedGoalId;
    if (!selectedGoalId) return null;

    const newTask: Task = {
      id: `${stepTag}-${Date.now()}`,
      title: taskName,
      status: 'todo'
    };
    this.goalStore.addTask(selectedGoalId, stepTag, newTask);
    return newTask;
  }

  suggestTopics(suggestions: string[]) {
    return suggestions;
  }

  suggestSteps(suggestions: string[]) {
    return suggestions;
  }

  suggestTasks(suggestions: { task_name: string; step_tag: string }[]) {
    return suggestions;
  }

  useTemplateSteps() {
    const selectedGoalId = this.goalStore.selectedGoalId;
    if (!selectedGoalId) return null;

    const templateSteps = ['觀察', '行動', '紀錄', '分享'];
    templateSteps.forEach(stepName => {
      const step: Step = {
        id: `${selectedGoalId}-${Date.now()}-${stepName}`,
        title: stepName,
        tasks: []
      };
      this.goalStore.addStep(selectedGoalId, step);
    });
    return templateSteps;
  }

  summarizeProgress() {
    const selectedGoalId = this.goalStore.selectedGoalId;
    if (!selectedGoalId) return { progress: 0, summary: '' };

    const goal = this.goalStore.goals.find(g => g.id === selectedGoalId);
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

  markAsBookmark() {
    const selectedGoalId = this.goalStore.selectedGoalId;
    if (!selectedGoalId) return false;

    const goal = this.goalStore.goals.find(g => g.id === selectedGoalId);
    if (!goal) return false;

    this.goalStore.updateGoal({
      ...goal,
      status: 'bookmarked'
    });
    return true;
  }

  completeTopic() {
    const selectedGoalId = this.goalStore.selectedGoalId;
    if (!selectedGoalId) return false;

    const goal = this.goalStore.goals.find(g => g.id === selectedGoalId);
    if (!goal) return false;

    this.goalStore.updateGoal({
      ...goal,
      status: 'completed'
    });
    return true;
  }

  exploreMore(context: any) {
    // TODO: 根據 context 生成更多任務建議
    return [];
  }

  askForInput() {
    return { prompt: '請告訴我你的想法...' };
  }
}