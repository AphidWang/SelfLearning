import React, { useState } from 'react';
import { InteractiveMap } from '../../components/learning-map/InteractiveMap';
import { GoalDetails } from '../../components/learning-map/GoalDetails';
import { useGoalStore } from '../../store/goalStore';
import PageLayout from '../../components/layout/PageLayout';

export const StudentLearningMap: React.FC = () => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { goals } = useGoalStore();

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  // 過濾出有任務的目標，並轉換為地圖點
  const tasks = goals
    .filter(goal => goal.steps.some(step => step.tasks.length > 0))
    .map((goal, index, filteredGoals) => {
      // 計算位置：將目標均勻分布在地圖上
      const totalGoals = filteredGoals.length;
      const x = (index / totalGoals) * 80 + 10; // 10-90% 的範圍
      const y = 50; // 固定在中間高度
      
      return {
        id: goal.id,
        label: goal.title,
        subject: goal.subject || '未分類',
        completed: goal.steps.every(step => 
          step.tasks.every(task => task.status === 'done')
        ),
        position: { x, y },
        goalId: goal.id
      };
    });

  const selectedTask = tasks.find(task => task.id === selectedTaskId);
  const selectedGoal = selectedTask ? goals.find(goal => goal.id === selectedTask.goalId) : null;

  return (
    <PageLayout title="學習地圖">
      <div className="w-full h-[calc(100vh-4rem)] relative overflow-hidden bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* 地圖區域 */}
          <div className="lg:col-span-2 h-full">
            <InteractiveMap 
              tasks={tasks}
              onTaskClick={handleTaskClick}
            />
          </div>

          {/* 目標詳情區域 */}
          <div className="lg:col-span-1 h-full">
            {selectedGoal ? (
              <GoalDetails
                goal={selectedGoal}
                onClose={() => setSelectedTaskId(null)}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-6 h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500">點擊地圖上的景點查看學習目標</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
