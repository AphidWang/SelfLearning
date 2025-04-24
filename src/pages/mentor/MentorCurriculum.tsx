import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import LearningMap from '../../components/curriculum/LearningMap';
import CurriculumPlanner from '../../components/curriculum/CurriculumPlanner';
import RewardSystem from '../../components/curriculum/RewardSystem';
import Calendar from '../../components/calendar/Calendar';
import { LearningNode } from '../../components/curriculum/LearningMap';

const initialNodes = [
  {
    id: '1',
    title: '基礎概念介紹',
    description: '了解科學實驗的基本原理和安全須知',
    status: 'completed' as const,
    requirements: [],
    position: { x: 100, y: 100 },
    connections: ['2'],
    level: 1,
    rewards: [
      { type: 'points' as const, value: 100, icon: 'star' },
      { type: 'experience' as const, value: 50, icon: 'trophy' }
    ]
  },
  {
    id: '2',
    title: '水的三態變化',
    description: '探索水在不同溫度下的狀態變化',
    status: 'unlocked' as const,
    requirements: ['完成基礎概念介紹'],
    position: { x: 400, y: 100 },
    connections: ['3'],
    level: 2,
    rewards: [
      { type: 'badge' as const, value: 150, icon: 'star' },
      { type: 'points' as const, value: 75, icon: 'trophy' }
    ]
  },
  {
    id: '3',
    title: '實驗報告撰寫',
    description: '學習如何記錄和分析實驗數據',
    status: 'locked' as const,
    requirements: ['完成水的三態變化實驗'],
    position: { x: 700, y: 100 },
    connections: [],
    level: 3,
    rewards: [
      { type: 'points' as const, value: 200, icon: 'star' },
      { type: 'badge' as const, value: 1, icon: 'trophy' }
    ]
  }
];

const MentorCurriculum: React.FC = () => {
  const [nodes, setNodes] = useState<LearningNode[]>(initialNodes);

  const handleNodesChange = (newNodes: LearningNode[]) => {
    setNodes(newNodes);
  };

  return (
    <PageLayout title="教學規劃與任務管理">
      <div className="space-y-6">
        <CurriculumPlanner />
        <LearningMap 
          nodes={nodes} 
          onNodesChange={handleNodesChange}
        />
        <RewardSystem />
        <Calendar events={[]} onSelectDate={() => {}} onSelectEvent={() => {}} />
      </div>
    </PageLayout>
  );
};

export default MentorCurriculum;