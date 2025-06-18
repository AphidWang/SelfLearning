import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopicMindMap } from '../../components/goals/GoalMindMap';

const TopicMindMapPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  if (!topicId) {
    return <div>找不到主題 ID</div>;
  }

  return (
    <div className="w-full h-[calc(100vh-4rem)]">
      <TopicMindMap 
        topicId={topicId} 
        onBack={() => navigate('/student/planning')} 
      />
    </div>
  );
};

export default TopicMindMapPage; 