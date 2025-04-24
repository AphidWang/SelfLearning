import React, { useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import LearningMap from '../../components/curriculum/LearningMap';
import WeeklyTaskColumns from '../../components/tasks/WeeklyTaskColumns';
import { usePlanner } from '../../context/PlannerContext';
import { useCurriculum } from '../../context/CurriculumContext';
import { PlannerProvider } from '../../context/PlannerContext';
import { CurriculumProvider } from '../../context/CurriculumContext';

const TaskPlannerContent: React.FC = () => {
  const { weeks, setWeeks, assignments } = usePlanner();
  const { nodes, setNodes, updateNodeStatus } = useCurriculum();

  // 當 assignments 改變時，更新節點狀態
  useEffect(() => {
    assignments.forEach(assignment => {
      const status = assignment.status === 'completed' ? 'completed' : 'unlocked';
      updateNodeStatus(assignment.nodeId, status);
    });
  }, [assignments, updateNodeStatus]);

  // 初始化週數
  React.useEffect(() => {
    if (weeks.length === 0) {
      const initialWeeks = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        nodeIds: []
      }));
      setWeeks(initialWeeks);
    }
  }, [weeks.length, setWeeks]);

  return (
    <PageLayout title="任務規劃">
      <div className="flex flex-col h-[calc(100vh-64px-60px)] overflow-hidden">
        {/* Weekly Task Columns Section */}
        <div className="flex-1 min-h-[300px] p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              週任務規劃
            </h2>
            <WeeklyTaskColumns />
          </div>
        </div>

        {/* Learning Map Section */}
        <div className="h-1/2 min-h-[300px] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              學習地圖
            </h2>
            <LearningMap 
              nodes={nodes}
              onNodesChange={setNodes}
              isEditable={true}
              allowDragOut={true}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

const TaskPlanner: React.FC = () => {
  return (
    <PlannerProvider>
      <CurriculumProvider>
        <TaskPlannerContent />
      </CurriculumProvider>
    </PlannerProvider>
  );
};

export default TaskPlanner; 