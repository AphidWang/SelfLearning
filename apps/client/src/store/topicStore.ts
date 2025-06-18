import { create } from 'zustand';
import type { Topic, Goal, Task, Bubble } from '../types/goal';
import { TOPIC_STATUSES } from '../constants/topics';
import { SUBJECTS } from '../constants/subjects';

const STORAGE_KEY = 'self_learning_topics';

// 檢查是否為預設主題
export const isDefaultTopic = (topicId: string): boolean => {
  return initialTopics.some(t => t.id === topicId);
};

const initialTopics: Topic[] = [
  {
    id: '1',
    title: '探索唐詩之美',
    description: '透過詩歌感受唐代文人的情感與智慧',
    status: 'in-progress',
    subject: SUBJECTS.CHINESE,
    bubbles: [
      {
        id: 'bubble-1-1',
        title: '詩歌欣賞',
        parentId: '1',
        bubbleType: 'background',
        content: '在課堂上讀到李白的詩，被他的豪邁氣概所吸引'
      },
      {
        id: 'bubble-1-2',
        title: '詩詞創作',
        parentId: '1',
        bubbleType: 'background',
        content: '詩歌、韻律、意境、典故、創作'
      }
    ],
    goals: [
      {
        id: '1-1',
        title: '認識詩的韻律',
        tasks: [
          {
            id: '1-1-1',
            title: '詩韻優美',
            status: 'idea',
          },
          {
            id: '1-1-2',
            title: '押韻好記',
            status: 'idea',
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
    subject: SUBJECTS.MATH,
    bubbles: [
      {
        id: 'bubble-2-1',
        title: '生活應用',
        parentId: '2',
        bubbleType: 'background',
        content: '在切蛋糕時發現需要平均分配，這讓我對分數產生興趣'
      },
      {
        id: 'bubble-2-2',
        title: '分數概念',
        parentId: '2',
        bubbleType: 'background',
        content: '分數、比例、除法、比較'
      }
    ],
    goals: [
      {
        id: '2-1',
        title: '生活中的分數',
        tasks: [
          {
            id: '2-1-1',
            title: '平均分配',
            status: 'idea',
          },
          {
            id: '2-1-2',
            title: '公平分享',
            status: 'idea',
          },
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
    subject: SUBJECTS.ENGLISH,
    bubbles: [
      {
        id: 'bubble-3-1',
        title: '故事閱讀',
        parentId: '3',
        bubbleType: 'background',
        content: '讀到有趣的英文故事，想要自己也能寫出這樣的故事'
      },
      {
        id: 'bubble-3-2',
        title: '寫作技巧',
        parentId: '3',
        bubbleType: 'background',
        content: '角色、場景、情節、對話'
      }
    ],
    goals: [
      {
        id: '3-1',
        title: '故事元素探索',
        tasks: [
          {
            id: '3-1-1',
            title: '角色塑造',
            status: 'idea',
          },
          {
            id: '3-1-2',
            title: '場景描寫',
            status: 'idea',
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
    subject: SUBJECTS.SCIENCE,
    bubbles: [
      {
        id: 'bubble-4-1',
        title: '種子發芽',
        parentId: '4',
        bubbleType: 'background',
        content: '看到種子發芽的過程，對植物的生長感到好奇'
      },
      {
        id: 'bubble-4-2',
        title: '植物生長',
        parentId: '4',
        bubbleType: 'background',
        content: '發芽、生長、開花、結果'
      }
    ],
    goals: [
      {
        id: '4-1',
        title: '種子探索',
        tasks: [
          {
            id: '4-1-1',
            title: '種子變化',
            status: 'idea',
          },
          {
            id: '4-1-2',
            title: '發芽過程',
            status: 'idea',
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
    subject: SUBJECTS.ARTS,
    bubbles: [
      {
        id: 'bubble-5-1',
        title: '美術課',
        parentId: '5',
        bubbleType: 'background',
        content: '在美術課上看到同學用不同顏色畫出漂亮的畫，讓我很好奇顏色是怎麼搭配的'
      },
      {
        id: 'bubble-5-2',
        title: '色彩學',
        parentId: '5',
        bubbleType: 'background',
        content: '色彩學、色輪、色彩心理學、繪畫技巧'
      }
    ],
    goals: [
      {
        id: '5-1',
        title: '色彩探索',
        tasks: [
          {
            id: '5-1-1',
            title: '不同的心情',
            status: 'idea',
          },
          {
            id: '5-1-2',
            title: '顏色混合',
            status: 'idea',
          },
        ],
      },
      {
        id: '5-2',
        title: '色彩情感',
        tasks: [
          {
            id: '5-2-1',
            title: '試著用溫暖的顏色畫出快樂的場景',
            status: 'in_progress',
          },
          {
            id: '5-2-2',
            title: '用冷色調表現下雨天的感覺',
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
            title: '學習如何讓顏色和諧地搭配在一起',
            status: 'todo',
          },
          {
            id: '5-3-2',
            title: '練習用不同深淺的顏色創造層次感',
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
            title: '用顏色來表達一個故事的情緒變化',
            status: 'todo',
          },
          {
            id: '5-4-2',
            title: '創作一幅用顏色說故事的畫',
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
    subject: SUBJECTS.PE,
    bubbles: [
      {
        id: 'bubble-6-1',
        title: '體育課',
        parentId: '6',
        bubbleType: 'background',
        content: '看到同學在體育課上玩得很開心，我也想學會這些運動'
      },
      {
        id: 'bubble-6-2',
        title: '體能訓練',
        parentId: '6',
        bubbleType: 'background',
        content: '體能訓練、運動技巧、健康生活、團隊合作'
      }
    ],
    goals: [
      {
        id: '6-1',
        title: '身體探索',
        tasks: [
          {
            id: '6-1-1',
            title: '心跳變化',
            status: 'idea',
          },
          {
            id: '6-1-2',
            title: '肌肉伸展',
            status: 'idea',
          },
        ],
      },
      {
        id: '6-2',
        title: '基礎運動',
        tasks: [
          {
            id: '6-2-1',
            title: '學習正確的跑步姿勢，避免受傷',
            status: 'in_progress',
          },
          {
            id: '6-2-2',
            title: '練習基本的跳躍和平衡動作',
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
            title: '學習投球和接球的技巧',
            status: 'todo',
          },
          {
            id: '6-3-2',
            title: '練習團隊運動中的傳球和配合',
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
            title: '設計一個有趣的運動遊戲，讓大家都能參與',
            status: 'todo',
          },
          {
            id: '6-4-2',
            title: '參加班際運動比賽，體驗團隊合作',
            status: 'todo',
          },
        ],
      },
    ],
  },
  {
    id: '7',
    title: '為什麼要讀書',
    description: '探索讀書的意義與價值',
    status: 'active',
    subject: SUBJECTS.SOCIAL,
    bubbles: [
      {
        id: 'bubble-7-1',
        title: '爸媽建議',
        parentId: '7',
        bubbleType: 'background',
        content: '爸媽常說讀書很重要，但我想知道為什麼'
      },
      {
        id: 'bubble-7-2',
        title: '學習方法',
        parentId: '7',
        bubbleType: 'background',
        content: '學習方法、知識獲取、思考能力、自我成長'
      }
    ],
    goals: [
      {
        id: '7-1',
        title: '讀書的現況',
        tasks: [
          {
            id: '7-1-1',
            title: '想像場景',
            status: 'idea',
          },
          {
            id: '7-1-2',
            title: '時間飛逝',
            status: 'idea',
          },
          {
            id: '7-1-3',
            title: '訪問同學',
            status: 'todo',
          }
        ],
      },
      {
        id: '7-2',
        title: '體驗讀書',
        tasks: [
          {
            id: '7-2-1',
            title: '試著讀一本故事書，記錄下自己的感受和想法',
            status: 'todo',
          },
          {
            id: '7-2-2',
            title: '讀一本科普書，看看能學到什麼新知識',
            status: 'todo',
          }
        ],
      },
      {
        id: '7-3',
        title: '讀書的收穫',
        tasks: [
          {
            id: '7-3-1',
            title: '整理讀書時學到的新詞彙和概念',
            status: 'todo',
          },
          {
            id: '7-3-2',
            title: '思考讀書如何幫助我解決生活中的問題',
            status: 'todo',
          },
          {
            id: '7-3-3',
            title: '記錄讀書後的想法和啟發',
            status: 'todo',
          }
        ],
      },
      {
        id: '7-4',
        title: '讀書的價值',
        tasks: [
          {
            id: '7-4-1',
            title: '製作一個讀書心得分享，說明讀書帶來的改變',
            status: 'todo',
          },
          {
            id: '7-4-2',
            title: '和同學討論讀書的樂趣和收穫',
            status: 'todo',
          }
        ],
      },
    ],
  },
  {
    id: '8',
    title: '火箭能飛多高',
    description: '透過觀察、行動、學習和分享，探索火箭飛行的原理',
    status: 'active',
    subject: SUBJECTS.SCIENCE,
    bubbles: [
      {
        id: 'bubble-8-1',
        title: '可以去月球嗎',
        parentId: '8',
        bubbleType: 'background',
        content: '看到火箭發射的影片，想知道為什麼火箭能飛得這麼高'
      },
      {
        id: 'bubble-8-2',
        title: '想知道飛行原理',
        parentId: '8',
        bubbleType: 'background',
        content: '火箭、推力、重力、空氣阻力、牛頓運動定律'
      }
    ],
    goals: [
      {
        id: '8-1',
        title: '觀察火箭',
        tasks: [
          {
            id: '8-1-1',
            title: '收集火箭發射的影片和圖片',
            status: 'idea',
          },
          {
            id: '8-1-2',
            title: '觀察火箭發射時的變化',
            status: 'idea',
          },
        ],
      },
      {
        id: '8-2',
        title: '動手實驗',
        tasks: [
          {
            id: '8-2-1',
            title: '製作簡單的水火箭',
            status: 'todo',
          },
          {
            id: '8-2-2',
            title: '測試不同水量對飛行高度的影響',
            status: 'todo',
          },
        ],
      },
      {
        id: '8-3',
        title: '學習原理',
        tasks: [
          {
            id: '8-3-1',
            title: '了解牛頓第三運動定律',
            status: 'todo',
          },
          {
            id: '8-3-2',
            title: '探索空氣阻力和重力的影響',
            status: 'todo',
          },
        ],
      },
      {
        id: '8-4',
        title: '分享發現',
        tasks: [
          {
            id: '8-4-1',
            title: '製作實驗報告，記錄觀察結果',
            status: 'todo',
          },
          {
            id: '8-4-2',
            title: '向同學展示水火箭實驗',
            status: 'todo',
          },
        ],
      },
    ],
  },
  {
    id: "9",
    title: "火箭可以飛多高？",
    description: "探索火箭能飛多高與太空邊界",
    status: "active",
    subject: SUBJECTS.SCIENCE,
    bubbles: [
      {
        id: "bubble-9-1",
        title: "會離開地球嗎？",
        parentId: "9",
        bubbleType: "background",
        content: "我們知道火箭會飛上天，但它可以飛多高？會超過雲、飛機、太空站，還是可以飛到月球？"
      },
      {
        id: "bubble-9-2",
        title: "能飛到太陽嗎？",
        parentId: "9",
        bubbleType: "background",
        content: "地球外的大氣層有很多層，太空的起點是「卡門線」，大約在地面上方 100 公里。"
      }
    ],
    goals: [
      {
        id: "9-1",
        title: "火箭飛到哪裡去？",
        tasks: [
          {
            id: "9-1-1",
            title: "火箭怎麼起飛",
            status: "done"
          },
          {
            id: "9-1-2",
            title: "查查太空從哪裡開始（卡門線）",
            status: "done"
          },
          {
            id: "9-1-3",
            title: "找出真實火箭可飛多高",
            status: "done"
          }
        ]
      },
      {
        id: "9-2",
        title: "和其他飛行器比較",
        tasks: [
          {
            id: "9-2-1",
            title: "查飛機、太空站的高度並畫圖比較",
            status: "in_progress"
          },
          {
            id: "9-2-2",
            title: "整理你找到的高度資料做成表格",
            status: "todo"
          }
        ]
      },
      {
        id: "9-3",
        title: "創作與分享你的發現",
        tasks: [
          {
            id: "9-3-1",
            title: "製作小報或簡報介紹火箭飛多高",
            status: "todo"
          },
          {
            id: "9-3-2",
            title: "錄一段影片：我是火箭小主播",
            status: "todo"
          }
        ]
      }
    ]
  }
];

const getInitialTopics = (): Topic[] => {
  if (typeof window === 'undefined') return initialTopics;
  
  try {
    const storedTopics = localStorage.getItem(STORAGE_KEY);
    if (!storedTopics) return initialTopics;
    
    const parsedTopics = JSON.parse(storedTopics);
    return parsedTopics.map((topic: Topic) => ({
      ...topic,
      goals: topic.goals.map(goal => ({
        ...goal,
        tasks: goal.tasks.map(task => ({
          ...task,
          completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : undefined
        }))
      }))
    }));
  } catch (error) {
    console.error('Failed to load topics from localStorage:', error);
    return initialTopics;
  }
};

const saveTopics = (topics: Topic[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
  } catch (error) {
    console.error('Failed to save topics to localStorage:', error);
  }
};

interface TopicStore {
  topics: Topic[];
  selectedTopicId: string | null;
  setSelectedTopicId: (id: string | null) => void;
  addTopic: (topic: Topic) => Topic;
  updateTopic: (topic: Topic) => void;
  deleteTopic: (topicId: string) => void;
  addGoal: (topicId: string, goal: Goal) => Goal | null;
  updateGoal: (topicId: string, goal: Goal) => Goal | null;
  addTask: (topicId: string, goalId: string, task: Task) => Task | null;
  updateTask: (topicId: string, goalId: string, task: Task) => Task | null;
  deleteGoal: (topicId: string, goalId: string) => void;
  deleteTask: (topicId: string, goalId: string, taskId: string) => void;
  setFocusElement: (topicId: string, focusElement: { type: 'goal' | 'task', id: string } | undefined) => void;
  dump: (topicId?: string) => void;
  getActiveGoals: (topicId: string) => Goal[];
  getActiveTasks: (topicId: string, goalId: string) => Task[];
  getCompletionRate: (topicId: string) => number;
  addBubble: (topicId: string, bubble: Bubble) => void;
  updateBubble: (topicId: string, bubbleId: string, bubble: Partial<Bubble>) => void;
  deleteBubble: (topicId: string, bubbleId: string) => void;
  reorderTasks: (topicId: string, goalId: string, sourceIndex: number, destinationIndex: number) => void;
  getActiveTopics: () => Topic[];
  getTopic: (topicId: string) => Topic | undefined;
}

export const useTopicStore = create<TopicStore>((set, get) => ({
  topics: getInitialTopics(),
  selectedTopicId: null,
  
  setSelectedTopicId: (id) => set({ selectedTopicId: id }),
  
  addTopic: (topic: Topic) => {
    const newTopic = {
      ...topic,
      id: topic.id || crypto.randomUUID()
    };
    set(state => ({
      ...state,
      topics: [...state.topics, newTopic]
    }));
    saveTopics(get().topics);
    return newTopic;
  },
  
  updateTopic: (topic) => set((state) => {
    const newState = { topics: state.topics.map((t) => t.id === topic.id ? topic : t) };
    saveTopics(newState.topics);
    return newState;
  }),

  deleteTopic: (topicId) => set((state) => {
    const newState = {
      topics: state.topics.map((t) =>
        t.id === topicId
          ? { ...t, status: 'archived' as const }
          : t
      )
    };
    saveTopics(newState.topics);
    return newState;
  }),
  
  addGoal: (topicId, goal) => {
    let newGoal: Goal | null = null;

    set((state) => {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) return state;

      newGoal = {
        ...goal,
        id: crypto.randomUUID(),
        tasks: goal.tasks || []
      };

      const newState = {
        topics: state.topics.map((t) =>
          t.id === topicId
            ? { ...t, goals: [...t.goals, newGoal!] }
            : t
        )
      };
      saveTopics(newState.topics);
      return newState;
    });

    return newGoal;
  },
  
  updateGoal: (topicId: string, goal: Goal) => {
    let updatedGoal: Goal | null = null;
    
    set((state) => {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) return state;

      const existingGoal = topic.goals.find(g => g.id === goal.id);
      if (!existingGoal) return state;

      updatedGoal = goal;
      const newState = {
        topics: state.topics.map((t) =>
          t.id === topicId
            ? {
                ...t,
                goals: t.goals.map((g) => 
                  g.id === goal.id 
                    ? updatedGoal!
                    : g
                )
              }
            : t
        )
      };
      saveTopics(newState.topics);
      return newState;
    });

    return updatedGoal;
  },
  
  addTask: (topicId, goalId, task) => {
    let newTask: Task | null = null;

    set((state) => {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) {
        throw new Error(`Topic ${topicId} not found`);
      }
      
      const goal = topic.goals.find(g => g.id === goalId);
      if (!goal) {
        throw new Error(`Goal ${goalId} not found in topic ${topicId}`);
      }

      const maxOrder = goal.tasks.length > 0 
        ? Math.max(...goal.tasks.map(t => t.order || 0))
        : -1;

      newTask = {
        ...task,
        id: crypto.randomUUID(),
        order: maxOrder + 1
      };

      const newState = {
        topics: state.topics.map((t) =>
          t.id === topicId
            ? {
                ...t,
                goals: t.goals.map((g) =>
                  g.id === goalId
                    ? { ...g, tasks: [...g.tasks, newTask!] }
                    : g
                )
              }
            : t
        )
      };
      saveTopics(newState.topics);
      return newState;
    });

    return newTask;
  },
  
  updateTask: (topicId: string, goalId: string, task: Task) => {
    let updatedTask: Task | null = null;
    
    set((state) => {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) return state;

      const goal = topic.goals.find(g => g.id === goalId);
      if (!goal) return state;

      const existingTask = goal.tasks.find(t => t.id === task.id);
      if (!existingTask) return state;

      updatedTask = task;
      
      const newState = {
        topics: state.topics.map((t) =>
          t.id === topicId
            ? {
                ...t,
                goals: t.goals.map((g) =>
                  g.id === goalId
                    ? {
                        ...g,
                        tasks: g.tasks.map((tk) =>
                          tk.id === task.id ? updatedTask! : tk
                        )
                      }
                    : g
                )
              }
            : t
        )
      };
      saveTopics(newState.topics);
      return newState;
    });

    return updatedTask;
  },

  deleteGoal: (topicId: string, goalId: string) => {
    set((state) => {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) return state;

      const newState = {
        topics: state.topics.map((t) =>
          t.id === topicId
            ? {
                ...t,
                goals: t.goals.map(g => 
                  g.id === goalId 
                    ? { ...g, status: 'archived' as const }
                    : g
                )
              }
            : t
        )
      };
      saveTopics(newState.topics);
      return newState;
    });
  },

  deleteTask: (topicId: string, goalId: string, taskId: string) => {
    set((state) => {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) return state;

      const goal = topic.goals.find(g => g.id === goalId);
      if (!goal) return state;

      const task = goal.tasks.find(t => t.id === taskId);
      if (!task) return state;

      const newState = {
        topics: state.topics.map((t) =>
          t.id === topicId
            ? {
                ...t,
                goals: t.goals.map((g) =>
                  g.id === goalId
                    ? {
                        ...g,
                        tasks: g.tasks.map(tk =>
                          tk.id === taskId
                            ? { ...tk, status: 'archived' as const }
                            : tk
                        )
                      }
                    : g
                )
              }
            : t
        )
      };
      saveTopics(newState.topics);
      return newState;
    });
  },

  setFocusElement: (topicId, focusElement) => set((state) => {
    const newState = {
      topics: state.topics.map((t) =>
        t.id === topicId
          ? { ...t, focusElement }
          : t
      )
    };
    saveTopics(newState.topics);
    return newState;
  }),

  dump: (topicId?: string) => {
    const state = get();
    if (topicId) {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) return;
    }
  },

  getActiveGoals: (topicId: string) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic) return [];
    
    return topic.goals
      .filter(goal => !goal.status || goal.status !== 'archived')
      .map(goal => ({
        ...goal,
        tasks: goal.tasks.filter(task => !task.status || task.status !== 'archived')
      }));
  },

  getActiveTasks: (topicId: string, goalId: string) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic) return [];
    
    const goal = topic.goals.find(g => g.id === goalId);
    if (!goal || goal.status === 'archived') return [];
    
    return goal.tasks.filter(task => task.status !== 'archived');
  },

  getCompletionRate: (topicId: string) => {
    const activeGoals = get().getActiveGoals(topicId);
    const totalTasks = activeGoals.reduce((sum, goal) => sum + goal.tasks.length, 0);
    const completedTasks = activeGoals.reduce(
      (sum, goal) => sum + goal.tasks.filter(task => task.status === 'done').length,
      0
    );
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  },

  addBubble: (topicId, bubble) => {
    set((state) => {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) return state;

      const newState = {
        topics: state.topics.map((t) =>
          t.id === topicId
            ? {
                ...t,
                bubbles: [...(t.bubbles || []), bubble],
              }
            : t
        )
      };
      saveTopics(newState.topics);
      return newState;
    });
  },

  updateBubble: (topicId, bubbleId, bubble) => {
    set((state) => {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) return state;

      const newState = {
        topics: state.topics.map((t) =>
          t.id === topicId
            ? {
                ...t,
                bubbles: (t.bubbles || []).map((b) =>
                  b.id === bubbleId ? { ...b, ...bubble } : b
                ),
              }
            : t
        )
      };
      saveTopics(newState.topics);
      return newState;
    });
  },

  deleteBubble: (topicId, bubbleId) => {
    set((state) => {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) return state;

      const newState = {
        topics: state.topics.map((t) =>
          t.id === topicId
            ? {
                ...t,
                bubbles: (t.bubbles || []).filter((b) => b.id !== bubbleId),
              }
            : t
        )
      };
      saveTopics(newState.topics);
      return newState;
    });
  },

  reorderTasks: (topicId: string, goalId: string, sourceIndex: number, destinationIndex: number) => {
    set((state) => {
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) return state;

      const goal = topic.goals.find(g => g.id === goalId);
      if (!goal) return state;

      const newTasks = Array.from(goal.tasks);
      const [removed] = newTasks.splice(sourceIndex, 1);
      newTasks.splice(destinationIndex, 0, removed);

      const updatedTasks = newTasks.map((task, index) => ({
        ...task,
        order: index
      }));

      const updatedGoal = { ...goal, tasks: updatedTasks };
      const newState = {
        topics: state.topics.map((t) =>
          t.id === topicId
            ? {
                ...t,
                goals: t.goals.map((g) =>
                  g.id === goalId ? updatedGoal : g
                )
              }
            : t
        )
      };
      saveTopics(newState.topics);
      return newState;
    });
  },

  getActiveTopics: () => {
    return get().topics.filter(topic => topic.status !== 'archived');
  },

  getTopic: (topicId: string) => get().topics.find(t => t.id === topicId),
})); 