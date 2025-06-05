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
  const [view, setView] = useState<'dashboard' | 'goal' | 'task'>('dashboard');
  const { goals } = useGoalStore();

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const selectedTask = selectedGoal?.steps.flatMap(step => step.tasks).find(t => t.id === selectedTaskId);

  const handleGoalClick = (goalId: string) => {
    setSelectedGoalId(goalId);
    setView('goal');
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setView('task');
  };

  const handleBackToGoals = () => {
    setSelectedGoalId(null);
    setView('dashboard');
  };

  const handleBackToGoal = () => {
    setSelectedTaskId(null);
    setView('goal');
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
      <div className="h-full grid lg:grid-cols-2 gap-6 p-6">
        {/* 左側：地圖或目標列表 */}
        <div className="h-full">
          {view === 'dashboard' ? (
            <GoalDashboard
              goals={goals}
              onGoalClick={handleGoalClick}
            />
          ) : (
            <InteractiveMap
              goals={goals}
              onTaskClick={handleTaskClick}
            />
          )}
        </div>

        {/* 右側：目標詳情或任務詳情 */}
        <div className="h-full">
          {view === 'task' && selectedTask ? (
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
    </PageLayout>
  );
};
