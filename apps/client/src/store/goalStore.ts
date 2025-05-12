import { create } from 'zustand';
import type { Goal, Step, Task } from '../types/goal';
import { GOAL_STATUSES } from '../constants/goals';
import { SUBJECTS } from '../constants/subjects';

const initialGoals: Goal[] = [
  {
    id: '1',
    title: '科學探究：水的三態變化實驗',
    description: '透過系統性的實驗和觀察，深入理解水的三態變化原理，並培養科學探究能力',
    category: 'learning',
    templateType: '學習目標',
    status: GOAL_STATUSES.ACTIVE,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    progress: 35,
    subject: SUBJECTS.SCIENCE,
    steps: [
      {
        id: 's1',
        title: '準備階段',
        tasks: [
          {
            id: 't1',
            title: '閱讀相關教材，了解水的三態變化原理',
            status: 'done',
            priority: 'high',
            role: 'explore',
            estimatedTime: '1小時'
          },
          {
            id: 't2',
            title: '準備實驗器材：燒杯、溫度計、冰塊、熱水等',
            status: 'done',
            priority: 'high',
            role: 'work',
            estimatedTime: '30分鐘'
          },
          {
            id: 't3',
            title: '設計實驗記錄表格',
            status: 'done',
            priority: 'medium',
            role: 'work',
            estimatedTime: '20分鐘'
          }
        ]
      },
      {
        id: 's2',
        title: '實驗階段',
        tasks: [
          {
            id: 't4',
            title: '進行固態到液態的變化實驗',
            status: 'in_progress',
            priority: 'high',
            role: 'work',
            estimatedTime: '1小時'
          },
          {
            id: 't5',
            title: '進行液態到氣態的變化實驗',
            status: 'todo',
            priority: 'high',
            role: 'work',
            estimatedTime: '1小時'
          },
          {
            id: 't6',
            title: '記錄實驗數據和觀察結果',
            status: 'todo',
            priority: 'medium',
            role: 'work',
            estimatedTime: '30分鐘'
          }
        ]
      },
      {
        id: 's3',
        title: '分析與總結',
        tasks: [
          {
            id: 't7',
            title: '整理實驗數據，製作圖表',
            status: 'todo',
            priority: 'high',
            role: 'work',
            estimatedTime: '1小時'
          },
          {
            id: 't8',
            title: '撰寫實驗報告，總結發現',
            status: 'todo',
            priority: 'high',
            role: 'present',
            estimatedTime: '2小時'
          },
          {
            id: 't9',
            title: '準備實驗成果展示',
            status: 'todo',
            priority: 'medium',
            role: 'present',
            estimatedTime: '1小時'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    title: '文學創作：我的成長故事',
    description: '透過撰寫個人成長故事，培養文學創作能力，並反思自己的成長歷程',
    category: 'learning',
    templateType: '學習目標',
    status: 'active',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString(),
    progress: 20,
    subject: SUBJECTS.CHINESE,
    steps: [
      {
        id: 's1',
        title: '構思與規劃',
        tasks: [
          {
            id: 't1',
            title: '閱讀優秀的成長故事範例',
            status: 'done',
            priority: 'high',
            role: 'explore',
            estimatedTime: '2小時'
          },
          {
            id: 't2',
            title: '列出個人成長的重要時刻',
            status: 'done',
            priority: 'high',
            role: 'work',
            estimatedTime: '1小時'
          },
          {
            id: 't3',
            title: '確定故事主題和結構',
            status: 'in_progress',
            priority: 'high',
            role: 'work',
            estimatedTime: '1小時'
          }
        ]
      },
      {
        id: 's2',
        title: '寫作階段',
        tasks: [
          {
            id: 't4',
            title: '撰寫故事大綱',
            status: 'todo',
            priority: 'high',
            role: 'work',
            estimatedTime: '2小時'
          },
          {
            id: 't5',
            title: '完成初稿',
            status: 'todo',
            priority: 'high',
            role: 'work',
            estimatedTime: '4小時'
          },
          {
            id: 't6',
            title: '加入細節描寫和情感表達',
            status: 'todo',
            priority: 'medium',
            role: 'work',
            estimatedTime: '3小時'
          }
        ]
      }
    ]
  }
];

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
  goals: initialGoals,
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