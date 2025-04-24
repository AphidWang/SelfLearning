import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import CurriculumPlanner from '../../components/curriculum/CurriculumPlanner';
import LearningMap from '../../components/curriculum/LearningMap';
import { useCurriculum } from '../../context/CurriculumContext';

const MentorCurriculum: React.FC = () => {
  const { nodes, setNodes } = useCurriculum();

  return (
    <PageLayout title="教學規劃與任務管理">
      <div className="space-y-6">
        <CurriculumPlanner />
        <LearningMap 
          nodes={nodes} 
          onNodesChange={setNodes}
          isEditable={true}
          allowDragOut={false}
        />
      </div>
    </PageLayout>
  );
};

export default MentorCurriculum;