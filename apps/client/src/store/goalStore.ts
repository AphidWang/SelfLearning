import { create } from 'zustand';
import type { Goal, Step, Task } from '../types/goal';
import { GOAL_STATUSES } from '../constants/goals';
import { SUBJECTS } from '../constants/subjects';

const initialGoals: Goal[] = [
  {
    id: '1',
    title: '提升國語閱讀能力',
    description: '培養閱讀興趣，提升理解能力',
    status: 'in-progress',
    steps: [
      {
        id: '1-1',
        title: '基礎閱讀',
        tasks: [
          {
            id: '1-1-1',
            title: '每天閱讀 15 分鐘課外讀物',
            status: 'done',
            completedAt: new Date('2024-03-15').toISOString(),
          },
          {
            id: '1-1-2',
            title: '完成 5 本繪本閱讀',
            status: 'done',
            completedAt: new Date('2024-03-20').toISOString(),
          },
          {
            id: '1-1-3',
            title: '練習朗讀課文',
            status: 'in_progress',
          },
        ],
      },
      {
        id: '1-2',
        title: '理解能力',
        tasks: [
          {
            id: '1-2-1',
            title: '完成閱讀理解練習',
            status: 'in_progress',
          },
          {
            id: '1-2-2',
            title: '寫讀書心得',
            status: 'todo',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    title: '數學基礎運算',
    description: '熟練加減乘除運算',
    status: 'active',
    steps: [
      {
        id: '2-1',
        title: '加法練習',
        tasks: [
          {
            id: '2-1-1',
            title: '完成 20 題加法練習',
            status: 'done',
            completedAt: new Date('2024-03-10').toISOString(),
          },
          {
            id: '2-1-2',
            title: '練習心算加法',
            status: 'done',
            completedAt: new Date('2024-03-12').toISOString(),
          },
        ],
      },
      {
        id: '2-2',
        title: '減法練習',
        tasks: [
          {
            id: '2-2-1',
            title: '完成 20 題減法練習',
            status: 'in_progress',
          },
          {
            id: '2-2-2',
            title: '練習心算減法',
            status: 'todo',
          },
        ],
      },
    ],
  },
  {
    id: '3',
    title: '英語單字學習',
    description: '認識基礎英語單字',
    status: 'active',
    steps: [
      {
        id: '3-1',
        title: '動物單字',
        tasks: [
          {
            id: '3-1-1',
            title: '學習 10 個動物單字',
            status: 'done',
            completedAt: new Date('2024-03-18').toISOString(),
          },
          {
            id: '3-1-2',
            title: '練習動物單字發音',
            status: 'in_progress',
          },
        ],
      },
      {
        id: '3-2',
        title: '顏色單字',
        tasks: [
          {
            id: '3-2-1',
            title: '學習 8 個顏色單字',
            status: 'in_progress',
          },
          {
            id: '3-2-2',
            title: '練習顏色單字發音',
            status: 'todo',
          },
        ],
      },
    ],
  },
  {
    id: '4',
    title: '自然科學探索',
    description: '認識生活中的科學現象',
    status: 'active',
    steps: [
      {
        id: '4-1',
        title: '植物觀察',
        tasks: [
          {
            id: '4-1-1',
            title: '種植綠豆並觀察生長',
            status: 'done',
            completedAt: new Date('2024-03-05').toISOString(),
          },
          {
            id: '4-1-2',
            title: '記錄植物生長日記',
            status: 'in_progress',
          },
        ],
      },
      {
        id: '4-2',
        title: '天氣觀察',
        tasks: [
          {
            id: '4-2-1',
            title: '記錄一週天氣變化',
            status: 'in_progress',
          },
          {
            id: '4-2-2',
            title: '認識不同天氣現象',
            status: 'todo',
          },
        ],
      },
    ],
  },
  {
    id: '5',
    title: '藝術創作',
    description: '培養藝術興趣與創造力',
    status: 'active',
    steps: [
      {
        id: '5-1',
        title: '繪畫基礎',
        tasks: [
          {
            id: '5-1-1',
            title: '練習基本線條',
            status: 'done',
            completedAt: new Date('2024-03-15').toISOString(),
          },
          {
            id: '5-1-2',
            title: '完成一幅風景畫',
            status: 'in_progress',
          },
        ],
      },
      {
        id: '5-2',
        title: '手工創作',
        tasks: [
          {
            id: '5-2-1',
            title: '製作紙藝作品',
            status: 'in_progress',
          },
          {
            id: '5-2-2',
            title: '完成黏土創作',
            status: 'todo',
          },
        ],
      },
    ],
  },
  {
    id: '6',
    title: '體育活動',
    description: '培養運動習慣',
    status: 'active',
    steps: [
      {
        id: '6-1',
        title: '基礎體能',
        tasks: [
          {
            id: '6-1-1',
            title: '每天跳繩 100 下',
            status: 'done',
            completedAt: new Date('2024-03-20').toISOString(),
          },
          {
            id: '6-1-2',
            title: '練習跑步 10 分鐘',
            status: 'in_progress',
          },
        ],
      },
      {
        id: '6-2',
        title: '球類運動',
        tasks: [
          {
            id: '6-2-1',
            title: '練習投籃',
            status: 'in_progress',
          },
          {
            id: '6-2-2',
            title: '學習傳球技巧',
            status: 'todo',
          },
        ],
      },
    ],
  },
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