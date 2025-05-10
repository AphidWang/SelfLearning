import { create } from 'zustand';
import type { Goal, Step, Task } from '../types/goal';

interface GoalStore {
  goals: Goal[];
  selectedGoalId: string | null;
  setSelectedGoalId: (id: string | null) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  addStep: (goalId: string, step: Step) => void;
  updateStep: (goalId: string, step: Step) => void;
  addTask: (goalId: string, stepId: string, task: Task) => void;
  updateTask: (goalId: string, stepId: string, task: Task) => void;
}

export const useGoalStore = create<GoalStore>((set) => ({
  goals: [
    {
      id: '1',
      title: '火車環島探索',
      description: '規劃一趟環台鐵路旅行，探索台灣的自然景觀和文化歷史。',
      status: 'active',
      dueDate: '2025-05-20',
      steps: [
        {
          id: 's1',
          title: '行程規劃',
          tasks: [
            {
              id: 't1',
              title: '研究火車路線與時刻表',
              status: 'done',
              priority: 'high',
              role: 'explore'
            },
            {
              id: 't2',
              title: '規劃停留站點和時間',
              status: 'in_progress',
              priority: 'medium',
              role: 'work'
            }
          ]
        },
        {
          id: 's2',
          title: '準備工作',
          tasks: [
            {
              id: 't3',
              title: '預訂車票和住宿',
              status: 'todo',
              priority: 'high',
              role: 'work'
            }
          ]
        }
      ]
    }
  ],
  selectedGoalId: null,
  
  setSelectedGoalId: (id) => set({ selectedGoalId: id }),
  
  addGoal: (goal) => set((state) => ({ 
    goals: [...state.goals, goal] 
  })),
  
  updateGoal: (goal) => set((state) => ({
    goals: state.goals.map((g) => g.id === goal.id ? goal : g)
  })),
  
  addStep: (goalId, step) => set((state) => ({
    goals: state.goals.map((goal) =>
      goal.id === goalId
        ? { ...goal, steps: [...goal.steps, step] }
        : goal
    )
  })),
  
  updateStep: (goalId, step) => set((state) => ({
    goals: state.goals.map((goal) =>
      goal.id === goalId
        ? {
            ...goal,
            steps: goal.steps.map((s) => s.id === step.id ? step : s)
          }
        : goal
    )
  })),
  
  addTask: (goalId, stepId, task) => set((state) => ({
    goals: state.goals.map((goal) =>
      goal.id === goalId
        ? {
            ...goal,
            steps: goal.steps.map((step) =>
              step.id === stepId
                ? { ...step, tasks: [...step.tasks, task] }
                : step
            )
          }
        : goal
    )
  })),
  
  updateTask: (goalId, stepId, task) => set((state) => ({
    goals: state.goals.map((goal) =>
      goal.id === goalId
        ? {
            ...goal,
            steps: goal.steps.map((step) =>
              step.id === stepId
                ? {
                    ...step,
                    tasks: step.tasks.map((t) =>
                      t.id === task.id ? task : t
                    )
                  }
                : step
            )
          }
        : goal
    )
  }))
})); 