import React, { useState, useRef, useLayoutEffect } from 'react';
import { GoalDashboard } from '../../components/learning-map/GoalDashboard';
import { InteractiveMap } from '../../components/learning-map/InteractiveMap';
import { TaskDetail } from '../../components/learning-map/TaskDetail';
import { GoalDetails } from '../../components/learning-map/GoalDetails';
import { useGoalStore } from '../../store/goalStore';
import PageLayout from '../../components/layout/PageLayout';
import { Goal, Task, GoalStatus } from '../../types/goal';
import { SUBJECTS } from '../../constants/subjects';
import { DailyReviewCarousel } from '../../components/learning-map/DailyReviewCarousel';
import { GoalDashboardCard } from '../../components/learning-map/GoalDashboardCard';

export const StudentLearningMap: React.FC = () => {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreatingNewGoal, setIsCreatingNewGoal] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showGoalCards, setShowGoalCards] = useState(false);
  const { goals, addGoal, getCompletionRate } = useGoalStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapRect, setMapRect] = useState<{left: number, top: number, width: number, height: number} | null>(null);

  useLayoutEffect(() => {
    if ((showReview || showGoalCards) && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setMapRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    }
  }, [showReview, showGoalCards]);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const selectedTask = selectedGoal?.steps.flatMap(step => step.tasks).find(t => t.id === selectedTaskId);
  const selectedStep = selectedGoal?.steps.find(step => step.tasks.some(t => t.id === selectedTaskId));

  const handleGoalClick = (goalId: string) => {
    setSelectedGoalId(goalId);
    setSelectedTaskId(null);
    setIsCreatingNewGoal(false);
  };

  const handleAddGoal = () => {
    const newGoal = {
      id: '',
      title: '新目標',
      description: '',
      steps: [],
      subject: SUBJECTS.CUSTOM,
      templateType: '學習目標',
      status: 'in_progress' as GoalStatus
    };
    addGoal(newGoal);
    setSelectedGoalId(newGoal.id);
    setIsCreatingNewGoal(true);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleBackToGoals = () => {
    setSelectedGoalId(null);
    setSelectedTaskId(null);
    setIsCreatingNewGoal(false);
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
      {showReview && mapRect && (
        <>
          {/* 遮罩只覆蓋地圖區域 */}
          <div
            className="fixed z-40 bg-black/10 cursor-pointer"
            style={{ left: mapRect.left, top: mapRect.top, width: mapRect.width, height: mapRect.height }}
            onClick={() => setShowReview(false)}
          />
          {/* popup 對齊地圖正中央 */}
          <div
            className="fixed z-50 pointer-events-auto"
            style={{
              left: mapRect.left,
              top: mapRect.top,
              width: mapRect.width,
              height: mapRect.height,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <DailyReviewCarousel className="max-h-[80vh] overflow-y-auto w-full max-w-[440px]" onClose={() => setShowReview(false)} />
            </div>
          </div>
          <button
            className="fixed top-8 right-8 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur px-3 py-1 rounded-full shadow border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            onClick={() => setShowReview(false)}
          >
            關閉
          </button>
        </>
      )}

      {showGoalCards && mapRect && (
        <>
          {/* 遮罩只覆蓋地圖區域 */}
          <div
            className="fixed z-40 bg-black/10 cursor-pointer"
            style={{ left: mapRect.left, top: mapRect.top, width: mapRect.width, height: mapRect.height }}
            onClick={() => setShowGoalCards(false)}
          />
          {/* popup 對齊地圖右側 */}
          <div
            className="fixed z-50 pointer-events-auto"
            style={{
              left: mapRect.left,
              top: mapRect.top,
              width: mapRect.width,
              height: mapRect.height,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-[400px] max-w-[90vw] flex flex-col" style={{ height: '80%' }}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300">學習目標概覽</h2>
                  <button
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setShowGoalCards(false)}
                    aria-label="關閉"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {goals.map(goal => (
                      <GoalDashboardCard
                        key={goal.id}
                        title={goal.title}
                        subject={goal.subject || '未分類'}
                        progress={getCompletionRate(goal.id)}
                        onClick={() => {
                          setShowGoalCards(false);
                          handleGoalClick(goal.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="h-full grid lg:grid-cols-6 gap-6 p-6">
        {/* 左側：互動式地圖 */}
        <div className="lg:col-span-4 sticky top-0 self-start" ref={mapRef}>
          <div className="h-[calc(100vh-8rem)] p-4">
            <InteractiveMap
              goals={goals}
              onGoalClick={handleGoalClick}
              onCampfireClick={() => setShowReview(true)}
              onMailboxClick={() => setShowGoalCards(true)}
            />
          </div>
        </div>

        {/* 右側：目標列表、目標詳情或任務詳情 */}
        <div className="h-full lg:col-span-2 overflow-y-auto max-h-[calc(100vh-64px)] mt-8 bg-gray-50 dark:bg-gray-900/40 rounded-2xl shadow-sm p-4">
          {selectedTaskId && selectedTask && selectedStep ? (
            <TaskDetail
              task={selectedTask}
              stepId={selectedStep.id}
              goalId={selectedGoalId!}
              onBack={handleBackToGoal}
              onHelpRequest={handleHelpRequest}
            />
          ) : selectedGoalId ? (
            <GoalDetails
              goal={selectedGoal!}
              onBack={handleBackToGoals}
              onTaskClick={handleTaskClick}
              isCreating={isCreatingNewGoal}
            />
          ) : (
            <GoalDashboard
              goals={goals}
              onGoalClick={handleGoalClick}
              onAddGoal={handleAddGoal}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};
