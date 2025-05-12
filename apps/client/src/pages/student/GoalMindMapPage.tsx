import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoalMindMap } from '../../components/goals/GoalMindMap';

const GoalMindMapPage: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();

  if (!goalId) {
    return <div>找不到目標 ID</div>;
  }

  return (
    <div className="w-full h-[calc(100vh-4rem)]">
      <GoalMindMap 
        goalId={goalId} 
        onBack={() => navigate('/student/planning')} 
      />
    </div>
  );
};

export default GoalMindMapPage; 