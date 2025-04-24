import React, { createContext, useContext, useState } from 'react';
import type { LearningNode } from '../components/curriculum/LearningMap';

// 初始數據
export const initialNodes: LearningNode[] = [
  {
    id: 'science-basics',
    title: '基本科學概念',
    description: '理解基本科學概念和原理',
    status: 'unlocked' as const,
    requirements: [],
    position: { x: 100, y: 100 },
    connections: ['observation-skills'],
    level: 1,
    rewards: [
      { type: 'points' as const, value: 100, icon: 'star' }
    ]
  },
  {
    id: 'observation-skills',
    title: '觀察能力培養',
    description: '培養科學觀察能力和方法',
    status: 'locked' as const,
    requirements: ['science-basics'],
    position: { x: 400, y: 100 },
    connections: ['experiment-methods'],
    level: 2,
    rewards: [
      { type: 'points' as const, value: 150, icon: 'star' }
    ]
  },
  {
    id: 'experiment-methods',
    title: '實驗方法學習',
    description: '學習基礎實驗方法和步驟',
    status: 'locked' as const,
    requirements: ['observation-skills'],
    position: { x: 700, y: 100 },
    connections: [],
    level: 3,
    rewards: [
      { type: 'points' as const, value: 200, icon: 'star' }
    ]
  }
];

interface CurriculumContextType {
  nodes: LearningNode[];
  setNodes: (nodes: LearningNode[]) => void;
  updateNodeStatus: (nodeId: string, status: LearningNode['status']) => void;
}

const CurriculumContext = createContext<CurriculumContextType | null>(null);

export const CurriculumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes] = useState<LearningNode[]>(initialNodes);

  const updateNodeStatus = (nodeId: string, status: LearningNode['status']) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, status } 
          : node
      )
    );
  };

  return (
    <CurriculumContext.Provider value={{ nodes, setNodes, updateNodeStatus }}>
      {children}
    </CurriculumContext.Provider>
  );
};

export const useCurriculum = () => {
  const context = useContext(CurriculumContext);
  if (!context) {
    throw new Error('useCurriculum must be used within a CurriculumProvider');
  }
  return context;
}; 