export const initialNodes = [
  {
    id: "phase-1",
    type: "phase",
    position: { x: 0, y: 0 },
    data: { 
      label: "階段一：方法體驗期",
      description: "探索不同的學習方法，找到最適合自己的方式"
    }
  },
  {
    id: "goal-1",
    type: "goal",
    position: { x: 200, y: 0 },
    data: { 
      label: "能寫出一份學習計畫",
      description: "根據個人特點制定有效的學習計畫"
    }
  },
  {
    id: "syllabus-1",
    type: "syllabus",
    position: { x: 400, y: -100 },
    data: { 
      label: "訪談別人探索學習方法",
      description: "與同學交流，了解不同的學習策略"
    }
  },
  {
    id: "syllabus-2",
    type: "syllabus",
    position: { x: 400, y: 100 },
    data: { 
      label: "觀察自己學習的模式",
      description: "記錄並分析自己的學習習慣"
    }
  },
  {
    id: "task-1",
    type: "task",
    position: { x: 600, y: -100 },
    data: { 
      label: "設計 5 題訪談提問",
      description: "準備訪談問題，深入了解他人的學習方法"
    }
  },
  {
    id: "task-2",
    type: "task",
    position: { x: 600, y: 100 },
    data: { 
      label: "用日記記錄一週學習活動",
      description: "詳細記錄每天的學習過程和感受"
    }
  }
];

export const initialEdges = [
  { 
    id: "e1-2", 
    source: "phase-1", 
    target: "goal-1",
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 }
  },
  { 
    id: "e2-3", 
    source: "goal-1", 
    target: "syllabus-1",
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 }
  },
  { 
    id: "e2-4", 
    source: "goal-1", 
    target: "syllabus-2",
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 }
  },
  { 
    id: "e3-5", 
    source: "syllabus-1", 
    target: "task-1",
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 }
  },
  { 
    id: "e4-6", 
    source: "syllabus-2", 
    target: "task-2",
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 }
  }
]; 