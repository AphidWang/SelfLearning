import React, { useState } from 'react';
import { GoalDashboard } from '../../components/learning-map/GoalDashboard';
import { InteractiveMap } from '../../components/learning-map/InteractiveMap';
import { TaskDetail } from '../../components/learning-map/TaskDetail';
import { GoalDetails } from '../../components/learning-map/GoalDetails';
import { useGoalStore } from '../../store/goalStore';
import PageLayout from '../../components/layout/PageLayout';
import { Goal, Task } from '../../types/goal';

export const StudentLearningMap: React.FC = () => {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { goals } = useGoalStore();

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const selectedTask = selectedGoal?.steps.flatMap(step => step.tasks).find(t => t.id === selectedTaskId);

  const handleGoalClick = (goalId: string) => {
    setSelectedGoalId(goalId);
    setSelectedTaskId(null);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleBackToGoals = () => {
    setSelectedGoalId(null);
    setSelectedTaskId(null);
  };

  const handleBackToGoal = () => {
    setSelectedTaskId(null);
  };

  const handleTaskStatusChange = (taskId: string, status: 'in_progress' | 'completed') => {
    // 更新任務狀態
    console.log('Task status changed:', taskId, status);
  };

  const handleHelpRequest = (taskId: string) => {
    // 處理協助請求
    console.log('Help requested for task:', taskId);
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

  return (
    <PageLayout title="學習地圖">
      <div className="h-full grid lg:grid-cols-6 gap-6 p-6">
        {/* 左側：互動式地圖 */}
        <div className="h-full lg:col-span-4">
          <InteractiveMap
            goals={goals}
            onTaskClick={handleTaskClick}
          />
        </div>

        {/* 右側：目標列表、目標詳情或任務詳情 */}
        <div className="h-full lg:col-span-2">
          {selectedTask ? (
            <TaskDetail
              task={selectedTask}
              onBack={handleBackToGoal}
              onStatusChange={handleTaskStatusChange}
              onHelpRequest={handleHelpRequest}
            />
          ) : selectedGoal ? (
            <GoalDetails
              goal={selectedGoal}
              onClose={handleBackToGoals}
              onTaskClick={handleTaskClick}
            />
          ) : (
            <GoalDashboard
              goals={goals}
              onGoalClick={handleGoalClick}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};
