import React, { useState, useRef, useLayoutEffect } from 'react';
import { GoalDashboard } from '../../components/learning-map/GoalDashboard';
import { InteractiveMap } from '../../components/learning-map/InteractiveMap';
import { TaskDetailDialog } from '../../components/learning-map/TaskDetailDialog';
import { GoalDetails } from '../../components/learning-map/GoalDetails';
import { useGoalStore } from '../../store/goalStore';
import PageLayout from '../../components/layout/PageLayout';
import { Goal, Task, GoalStatus } from '../../types/goal';
import { SUBJECTS } from '../../constants/subjects';
import { DailyReviewCarousel } from '../../components/learning-map/DailyReviewCarousel';
import { GoalDashboardCard } from '../../components/learning-map/GoalDashboardCard';
import { GoalDashboardDialog } from '../../components/learning-map/GoalDashboardDialog';
import { GoalDetailsDialog } from '../../components/learning-map/GoalDetailsDialog';
import { DraggableDialog } from '../../components/learning-map/DraggableDialog';

export const StudentLearningMap: React.FC = () => {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreatingNewGoal, setIsCreatingNewGoal] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showGoalCards, setShowGoalCards] = useState(false);
  const [openedFromDashboard, setOpenedFromDashboard] = useState(false);
  const { goals, addGoal, getCompletionRate } = useGoalStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapRect, setMapRect] = useState<{left: number, top: number, width: number, height: number} | null>(null);
  
  // 共享的 dialog 位置狀態
  const [dialogPosition, setDialogPosition] = useState<{x: number, y: number}>({ x: -420, y: 20 });

  useLayoutEffect(() => {
    if ((showReview || showGoalCards || selectedGoalId) && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setMapRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    }
  }, [showReview, showGoalCards, selectedGoalId]);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  // 當有 selectedTaskId 時，從所有目標中尋找該任務
  const taskInfo = selectedTaskId ? (() => {
    for (const goal of goals) {
      for (const step of goal.steps) {
        const task = step.tasks.find(t => t.id === selectedTaskId);
        if (task) {
          return { task, step, goal };
        }
      }
    }
    return null;
  })() : null;
  
  const selectedTask = taskInfo?.task;
  const selectedStep = taskInfo?.step;
  const taskGoal = taskInfo?.goal;

  const handleGoalClick = (goalId: string, fromDashboard = false) => {
    setSelectedGoalId(goalId);
    setSelectedTaskId(null);
    setIsCreatingNewGoal(false);
    setOpenedFromDashboard(fromDashboard);
    if (!fromDashboard) {
      setShowGoalCards(false);
    }
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
    // 保留 selectedGoalId，這樣在關閉任務詳情時可以回到目標詳情
  };

  const handleCloseAll = () => {
    setSelectedGoalId(null);
    setSelectedTaskId(null);
    setIsCreatingNewGoal(false);
  };

  const handleBackToGoals = () => {
    if (openedFromDashboard) {
      // 如果是從 dashboard 打開的，回到 dashboard
      setSelectedGoalId(null);
      setSelectedTaskId(null);
      setIsCreatingNewGoal(false);
      setOpenedFromDashboard(false);
      setShowGoalCards(true);
    } else {
      // 如果是從地圖直接打開的，直接關掉
      setSelectedGoalId(null);
      setSelectedTaskId(null);
      setIsCreatingNewGoal(false);
      setOpenedFromDashboard(false);
    }
  };

  const handleBackToGoal = () => {
    setSelectedTaskId(null);
    // selectedGoalId 保持不變，這樣會顯示 GoalDetailsDialog
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
        <DraggableDialog
          mapRect={mapRect}
          position={dialogPosition}
          onPositionChange={setDialogPosition}
          headerSelector="[data-draggable-header]"
        >
          <GoalDashboardDialog
            goals={goals}
            onClose={() => setShowGoalCards(false)}
            onGoalClick={(goalId) => handleGoalClick(goalId, true)}
            onAddGoal={handleAddGoal}
            getCompletionRate={getCompletionRate}
          />
        </DraggableDialog>
      )}

      {selectedGoalId && selectedGoal && mapRect && !selectedTaskId && (
        <DraggableDialog
          mapRect={mapRect}
          position={dialogPosition}
          onPositionChange={setDialogPosition}
          headerSelector="[data-draggable-header]"
        >
          <GoalDetailsDialog
            goal={selectedGoal}
            onClose={handleCloseAll}
            onBack={handleBackToGoals}
            onTaskClick={handleTaskClick}
            isCreating={isCreatingNewGoal}
          />
        </DraggableDialog>
      )}

      {selectedTaskId && selectedTask && selectedStep && taskGoal && mapRect && (
        <DraggableDialog
          mapRect={mapRect}
          position={dialogPosition}
          onPositionChange={setDialogPosition}
          headerSelector="[data-draggable-header]"
        >
          <TaskDetailDialog
            task={selectedTask}
            stepId={selectedStep.id}
            goalId={taskGoal.id}
            onClose={handleCloseAll}
            onBack={handleBackToGoal}
            onHelpRequest={handleHelpRequest}
          />
        </DraggableDialog>
      )}

      <div className="h-full p-6">
        {/* 全寬：互動式地圖 */}
        <div className="h-[calc(100vh-8rem)]" ref={mapRef}>
          <InteractiveMap
            goals={goals}
            onGoalClick={handleGoalClick}
            onCampfireClick={() => setShowReview(true)}
            onMailboxClick={() => setShowGoalCards(true)}
          />
        </div>
      </div>
    </PageLayout>
  );
};
