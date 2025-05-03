import React, { useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import LearningMap from '../../components/curriculum/LearningMap';
import WeeklyTaskColumns from '../../components/tasks/WeeklyTaskColumns';
import { usePlanner } from '../../context/PlannerContext';
import { useCurriculum } from '../../context/CurriculumContext';
import { PlannerProvider } from '../../context/PlannerContext';
import { CurriculumProvider } from '../../context/CurriculumContext';
import { WeekPlan } from '../../types/planner';

const TaskPlannerContent: React.FC = () => {
  const { weeks, assignments } = usePlanner();
  const { nodes, setNodes, updateNodeStatus } = useCurriculum();

  // 當 assignments 改變時，更新節點狀態
  useEffect(() => {
    assignments.forEach(assignment => {
      if (assignment.status === 'accepted') {
        // 找到對應的任務和節點
        const week = weeks.find(w => w.id === assignment.weekId);
        const task = week?.tasks.find(t => t.id === assignment.taskId);
        if (task?.courseId) {
          updateNodeStatus(task.courseId, 'completed');
        }
      }
    });
  }, [assignments, weeks, updateNodeStatus]);

  return (
    <PageLayout title="任務規劃">
      <div className="flex flex-col h-[calc(100vh-64px-60px)] overflow-hidden">
        {/* Weekly Task Columns Section */}
        <div className="flex-1 min-h-[300px] p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              週任務規劃
            </h2>
            <WeeklyTaskColumns 
              weeks={weeks}
              onAssignTask={(taskId, weekId) => {
                // 由 PlannerContext 處理
              }}
              onRemoveTask={(taskId, weekId) => {
                // 由 PlannerContext 處理
              }}
            />
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

const MentorTaskPlanner: React.FC = () => {
  return (
    <PlannerProvider>
      <CurriculumProvider>
        <TaskPlannerContent />
      </CurriculumProvider>
    </PlannerProvider>
  );
};

export default MentorTaskPlanner; 