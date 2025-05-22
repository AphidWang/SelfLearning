import { create } from 'zustand';
import type { Goal, Step, Task } from '../types/goal';
import { GOAL_STATUSES } from '../constants/goals';
import { SUBJECTS } from '../constants/subjects';

const initialGoals: Goal[] = [
  {
    id: '1',
    title: '探索唐詩之美',
    description: '透過詩歌感受唐代文人的情感與智慧',
    status: 'in-progress',
    steps: [
      {
        id: '1-1',
        title: '認識詩的韻律',
        tasks: [
          {
            id: '1-1-1',
            title: '找出詩中的押韻字',
            status: 'done',
            completedAt: new Date('2024-03-15').toISOString(),
          },
          {
            id: '1-1-2',
            title: '用節奏朗讀詩句',
            status: 'in_progress',
          },
        ],
      },
      {
        id: '1-2',
        title: '感受詩的意境',
        tasks: [
          {
            id: '1-2-1',
            title: '畫出詩中的畫面',
            status: 'in_progress',
          },
          {
            id: '1-2-2',
            title: '分享詩中的情感',
            status: 'todo',
          },
        ],
      },
      {
        id: '1-3',
        title: '探索詩的典故',
        tasks: [
          {
            id: '1-3-1',
            title: '找出詩中的歷史故事',
            status: 'todo',
          },
          {
            id: '1-3-2',
            title: '創作自己的典故',
            status: 'todo',
          },
        ],
      },
      {
        id: '1-4',
        title: '創作詩的想像',
        tasks: [
          {
            id: '1-4-1',
            title: '用現代語言改寫古詩',
            status: 'todo',
          },
          {
            id: '1-4-2',
            title: '創作自己的詩句',
            status: 'todo',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    title: '探索分數的奧秘',
    description: '透過生活情境理解分數的概念',
    status: 'active',
    steps: [
      {
        id: '2-1',
        title: '生活中的分數',
        tasks: [
          {
            id: '2-1-1',
            title: '找出生活中的分數例子',
            status: 'done',
            completedAt: new Date('2024-03-10').toISOString(),
          },
          {
            id: '2-1-2',
            title: '用圖片表示分數',
            status: 'in_progress',
          },
          {
            id: '2-1-3',
            title: '分享生活中的分數應用',
            status: 'done',
            completedAt: new Date('2024-03-12').toISOString(),
          }
        ],
      },
      {
        id: '2-2',
        title: '分數的比較',
        tasks: [
          {
            id: '2-2-1',
            title: '比較不同分數的大小',
            status: 'done',
            completedAt: new Date('2024-03-15').toISOString(),
          },
          {
            id: '2-2-2',
            title: '用圖形解釋比較結果',
            status: 'in_progress',
          }
        ],
      },
      {
        id: '2-3',
        title: '分數的運算',
        tasks: [
          {
            id: '2-3-1',
            title: '學習分數加法',
            status: 'in_progress',
          },
          {
            id: '2-3-2',
            title: '學習分數減法',
            status: 'todo',
          },
          {
            id: '2-3-3',
            title: '學習分數乘法',
            status: 'in_progress',
          },
          {
            id: '2-3-4',
            title: '學習分數除法',
            status: 'todo',
          }
        ],
      },
      {
        id: '2-4',
        title: '分數的應用',
        tasks: [
          {
            id: '2-4-1',
            title: '設計分數遊戲',
            status: 'todo',
          },
          {
            id: '2-4-2',
            title: '用分數解決生活問題',
            status: 'todo',
          }
        ],
      },
    ],
  },
  {
    id: '3',
    title: '探索英語故事創作',
    description: '透過故事學習英語表達',
    status: 'active',
    steps: [
      {
        id: '3-1',
        title: '故事元素探索',
        tasks: [
          {
            id: '3-1-1',
            title: '認識故事中的角色',
            status: 'done',
            completedAt: new Date('2024-03-18').toISOString(),
          },
          {
            id: '3-1-2',
            title: '找出故事中的場景',
            status: 'in_progress',
          },
        ],
      },
      {
        id: '3-2',
        title: '故事結構理解',
        tasks: [
          {
            id: '3-2-1',
            title: '分析故事開始、中間、結尾',
            status: 'in_progress',
          },
          {
            id: '3-2-2',
            title: '找出故事中的轉折點',
            status: 'todo',
          },
        ],
      },
      {
        id: '3-3',
        title: '故事詞彙收集',
        tasks: [
          {
            id: '3-3-1',
            title: '收集故事中的動作詞',
            status: 'todo',
          },
          {
            id: '3-3-2',
            title: '學習描述性詞彙',
            status: 'todo',
          },
        ],
      },
      {
        id: '3-4',
        title: '故事創作實踐',
        tasks: [
          {
            id: '3-4-1',
            title: '創作簡單的故事大綱',
            status: 'todo',
          },
          {
            id: '3-4-2',
            title: '用英語寫出故事',
            status: 'todo',
          },
        ],
      },
    ],
  },
  {
    id: '4',
    title: '探索植物生長',
    description: '透過觀察了解植物的生命週期',
    status: 'active',
    steps: [
      {
        id: '4-1',
        title: '種子探索',
        tasks: [
          {
            id: '4-1-1',
            title: '觀察不同種子的形狀',
            status: 'done',
            completedAt: new Date('2024-03-05').toISOString(),
          },
          {
            id: '4-1-2',
            title: '記錄種子的特徵',
            status: 'in_progress',
          },
        ],
      },
      {
        id: '4-2',
        title: '發芽過程',
        tasks: [
          {
            id: '4-2-1',
            title: '觀察種子發芽的變化',
            status: 'in_progress',
          },
          {
            id: '4-2-2',
            title: '測量幼苗的生長',
            status: 'todo',
          },
        ],
      },
      {
        id: '4-3',
        title: '葉子研究',
        tasks: [
          {
            id: '4-3-1',
            title: '觀察葉子的形狀和顏色',
            status: 'todo',
          },
          {
            id: '4-3-2',
            title: '研究葉子的功能',
            status: 'todo',
          },
        ],
      },
      {
        id: '4-4',
        title: '開花結果',
        tasks: [
          {
            id: '4-4-1',
            title: '觀察花朵的結構',
            status: 'todo',
          },
          {
            id: '4-4-2',
            title: '記錄果實的形成',
            status: 'todo',
          },
        ],
      },
    ],
  },
  {
    id: '5',
    title: '探索色彩藝術',
    description: '透過色彩認識藝術表現',
    status: 'active',
    steps: [
      {
        id: '5-1',
        title: '色彩探索',
        tasks: [
          {
            id: '5-1-1',
            title: '認識基本色彩',
            status: 'done',
            completedAt: new Date('2024-03-15').toISOString(),
          },
          {
            id: '5-1-2',
            title: '混合不同顏色',
            status: 'in_progress',
          },
        ],
      },
      {
        id: '5-2',
        title: '色彩情感',
        tasks: [
          {
            id: '5-2-1',
            title: '用顏色表達心情',
            status: 'in_progress',
          },
          {
            id: '5-2-2',
            title: '創作情緒色彩畫',
            status: 'todo',
          },
        ],
      },
      {
        id: '5-3',
        title: '色彩構圖',
        tasks: [
          {
            id: '5-3-1',
            title: '學習色彩搭配',
            status: 'todo',
          },
          {
            id: '5-3-2',
            title: '創作色彩構圖',
            status: 'todo',
          },
        ],
      },
      {
        id: '5-4',
        title: '色彩故事',
        tasks: [
          {
            id: '5-4-1',
            title: '用色彩講述故事',
            status: 'todo',
          },
          {
            id: '5-4-2',
            title: '創作色彩連環畫',
            status: 'todo',
          },
        ],
      },
    ],
  },
  {
    id: '6',
    title: '探索身體運動',
    description: '透過運動了解身體機能',
    status: 'active',
    steps: [
      {
        id: '6-1',
        title: '身體探索',
        tasks: [
          {
            id: '6-1-1',
            title: '認識身體部位',
            status: 'done',
            completedAt: new Date('2024-03-20').toISOString(),
          },
          {
            id: '6-1-2',
            title: '了解身體機能',
            status: 'in_progress',
          },
        ],
      },
      {
        id: '6-2',
        title: '基礎運動',
        tasks: [
          {
            id: '6-2-1',
            title: '學習基本動作',
            status: 'in_progress',
          },
          {
            id: '6-2-2',
            title: '練習協調性',
            status: 'todo',
          },
        ],
      },
      {
        id: '6-3',
        title: '運動技能',
        tasks: [
          {
            id: '6-3-1',
            title: '學習運動技巧',
            status: 'todo',
          },
          {
            id: '6-3-2',
            title: '練習運動組合',
            status: 'todo',
          },
        ],
      },
      {
        id: '6-4',
        title: '運動應用',
        tasks: [
          {
            id: '6-4-1',
            title: '設計運動遊戲',
            status: 'todo',
          },
          {
            id: '6-4-2',
            title: '參與運動競賽',
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
  addStep: (goalId: string, step: Step) => Step | null;
  updateStep: (goalId: string, step: Step) => Step | null;
  addTask: (goalId: string, stepId: string, task: Task) => Task | null;
  updateTask: (goalId: string, stepId: string, task: Task) => Task | null;
  dump: (goalId?: string) => void;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: initialGoals,
  selectedGoalId: null,
  
  setSelectedGoalId: (id) => set({ selectedGoalId: id }),
  
  addGoal: (goal) => set((state) => ({ 
    goals: [...state.goals, goal] 
  })),
  
  updateGoal: (goal) => set((state) => ({
    goals: state.goals.map((g) => g.id === goal.id ? goal : g)
  })),
  
  addStep: (goalId, step) => {
    let newStep: Step | null = null;

    set((state) => {
      const goal = state.goals.find(g => g.id === goalId);
      if (!goal) return state;

      newStep = {
        ...step,
        id: crypto.randomUUID(),
        tasks: step.tasks || []
      };

      return {
        goals: state.goals.map((g) =>
          g.id === goalId
            ? { ...g, steps: [...g.steps, newStep!] }
            : g
        )
      };
    });

    return newStep;
  },
  
  updateStep: (goalId: string, step: Step) => {
    let updatedStep: Step | null = null;
    
    set((state) => {
      const goal = state.goals.find(g => g.id === goalId);
      if (!goal) return state;

      const existingStep = goal.steps.find(s => s.id === step.id);
      if (!existingStep) return state;

      updatedStep = step;
      const updatedGoals = state.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              steps: g.steps.map((s) => 
                s.id === step.id 
                  ? updatedStep!
                  : s
              )
            }
          : g
      );

      return { goals: updatedGoals };
    });

    return updatedStep;
  },
  
  addTask: (goalId, stepId, task) => {
    let newTask: Task | null = null;

    set((state) => {
      const goal = state.goals.find(g => g.id === goalId);
      if (!goal) {
        throw new Error(`Goal ${goalId} not found`);
      }
      
      const step = goal.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error(`Step ${stepId} not found in goal ${goalId}`);
      }

      newTask = {
        ...task,
        id: crypto.randomUUID()
      };

      return {
        goals: state.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                steps: g.steps.map((s) =>
                  s.id === stepId
                    ? { ...s, tasks: [...s.tasks, newTask!] }
                    : s
                )
              }
            : g
        )
      };
    });

    return newTask;
  },
  
  updateTask: (goalId: string, stepId: string, task: Task) => {
    let updatedTask: Task | null = null;
    console.log('🔍 goalStore.updateTask 開始', { goalId, stepId, task });
    
    set((state) => {
      const goal = state.goals.find(g => g.id === goalId);
      if (!goal) {
        console.log('❌ goalStore.updateTask 失敗：找不到目標', { goalId });
        return state;
      }

      const step = goal.steps.find(s => s.id === stepId);
      if (!step) {
        console.log('❌ goalStore.updateTask 失敗：找不到步驟', { stepId });
        return state;
      }

      const existingTask = step.tasks.find(t => t.id === task.id);
      if (!existingTask) {
        console.log('❌ goalStore.updateTask 失敗：找不到任務', { taskId: task.id });
        return state;
      }

      updatedTask = task;
      console.log('✅ goalStore.updateTask 更新任務', { updatedTask });
      
      const updatedGoals = state.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              steps: g.steps.map((s) =>
                s.id === stepId
                  ? {
                      ...s,
                      tasks: s.tasks.map((t) =>
                        t.id === task.id ? updatedTask! : t
                      )
                    }
                  : s
              )
            }
          : g
      );

      return { goals: updatedGoals };
    });

    console.log('🔄 goalStore.updateTask 結果', { updatedTask });
    return updatedTask;
  },

  dump: (goalId?: string) => {
    const state = get();
    if (goalId) {
      const goal = state.goals.find(g => g.id === goalId);
      if (!goal) return;
    }
  }
})); 