import React, { useState, useRef, useLayoutEffect } from 'react';
import { TopicDashboard } from '../../components/learning-map/TopicDashboard';
import { InteractiveMap } from '../../components/learning-map/InteractiveMap';
import { TaskDetailDialog } from '../../components/learning-map/TaskDetailDialog';
import { TopicDetails } from '../../components/learning-map/TopicDetails';
import { useTopicStore } from '../../store/topicStore';
import PageLayout from '../../components/layout/PageLayout';
import { Topic, Task, TopicStatus } from '../../types/goal';
import { SUBJECTS } from '../../constants/subjects';
import { DailyReviewCarousel } from '../../components/learning-map/DailyReviewCarousel';
import { TopicDashboardCard } from '../../components/learning-map/TopicDashboardCard';
import { TopicDashboardDialog } from '../../components/learning-map/TopicDashboardDialog';
import { TopicDetailsDialog } from '../../components/learning-map/TopicDetailsDialog';
import { DraggableDialog } from '../../components/learning-map/DraggableDialog';
import { TopicProgressDialog } from '../../components/learning-map/TopicProgressDialog';

export const StudentLearningMap: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreatingNewTopic, setIsCreatingNewTopic] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showTopicCards, setShowTopicCards] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [openedFromDashboard, setOpenedFromDashboard] = useState(false);
  const { topics, addTopic, getCompletionRate } = useTopicStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapRect, setMapRect] = useState<{left: number, top: number, width: number, height: number} | null>(null);
  
  // 共享的 dialog 位置狀態
  const [dialogPosition, setDialogPosition] = useState<{x: number, y: number}>({ x: -420, y: 20 });

  useLayoutEffect(() => {
    if ((showReview || showTopicCards || selectedTopicId || showProgress) && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setMapRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    }
  }, [showReview, showTopicCards, selectedTopicId, showProgress]);

  const selectedTopic = topics.find(t => t.id === selectedTopicId);
  // 當有 selectedTaskId 時，從所有主題中尋找該任務
  const taskInfo = selectedTaskId ? (() => {
    for (const topic of topics) {
      for (const goal of topic.goals) {
        const task = goal.tasks.find(t => t.id === selectedTaskId);
        if (task) {
          return { task, goal, topic };
        }
      }
    }
    return null;
  })() : null;
  
  const selectedTask = taskInfo?.task;
  const selectedGoal = taskInfo?.goal;
  const taskTopic = taskInfo?.topic;

  const handleTopicClick = (topicId: string, fromDashboard = false) => {
    setSelectedTopicId(topicId);
    setSelectedTaskId(null);
    setIsCreatingNewTopic(false);
    setOpenedFromDashboard(fromDashboard);
    if (!fromDashboard) {
      setShowTopicCards(false);
    }
  };

  const handleAddTopic = () => {
    const newTopic = {
      id: '',
      title: '新主題',
      description: '',
      goals: [],
      subject: SUBJECTS.CUSTOM,
      templateType: '學習主題',
      status: 'in-progress' as TopicStatus
    };
    const addedTopic = addTopic(newTopic);
    setSelectedTopicId(addedTopic.id);
    setIsCreatingNewTopic(true);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    // 保留 selectedTopicId，這樣在關閉任務詳情時可以回到主題詳情
  };

  const handleCloseAll = () => {
    setSelectedTopicId(null);
    setSelectedTaskId(null);
    setIsCreatingNewTopic(false);
  };

  const handleBackToTopics = () => {
    if (openedFromDashboard) {
      // 如果是從 dashboard 打開的，回到 dashboard
      setSelectedTopicId(null);
      setSelectedTaskId(null);
      setIsCreatingNewTopic(false);
      setOpenedFromDashboard(false);
      setShowTopicCards(true);
    } else {
      // 如果是從地圖直接打開的，直接關掉
      setSelectedTopicId(null);
      setSelectedTaskId(null);
      setIsCreatingNewTopic(false);
      setOpenedFromDashboard(false);
    }
  };

  const handleBackToTopic = () => {
    setSelectedTaskId(null);
    // selectedTopicId 保持不變，這樣會顯示 TopicDetailsDialog
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
  const tasks = topics
    .filter(topic => topic.goals.some(goal => goal.tasks.length > 0))
    .map((topic, index, filteredTopics) => {
      // 計算位置：將目標均勻分布在地圖上
      const totalTopics = filteredTopics.length;
      const x = (index / totalTopics) * 80 + 10; // 10-90% 的範圍
      const y = 50; // 固定在中間高度
      
      return {
        id: topic.id,
        label: topic.title,
        subject: topic.subject || '未分類',
        completed: topic.goals.every(goal => 
          goal.tasks.every(task => task.status === 'done')
        ),
        position: { x, y },
        topicId: topic.id
      };
    });

  const activeTopic = topics.find(topic => topic.status === 'active');

  return (
    <PageLayout title="學習地圖">
      {showProgress && mapRect && (
        <>
          {/* 遮罩只覆蓋地圖區域 */}
          <div
            className="fixed z-40 bg-black/10 cursor-pointer"
            style={{ left: mapRect.left, top: mapRect.top, width: mapRect.width, height: mapRect.height }}
            onClick={() => setShowProgress(false)}
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
              <TopicProgressDialog
                onClose={() => setShowProgress(false)}
                onTopicClick={(topicId) => {
                  setShowProgress(false);
                  setSelectedTopicId(topicId);
                }}
              />
            </div>
          </div>
        </>
      )}

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

      {showTopicCards && mapRect && (
        <>
          {/* 遮罩只覆蓋地圖區域 */}
          <div
            className="fixed z-40 bg-black/10 cursor-pointer"
            style={{ left: mapRect.left, top: mapRect.top, width: mapRect.width, height: mapRect.height }}
            onClick={() => setShowTopicCards(false)}
          />
          <DraggableDialog
            mapRect={mapRect}
            position={dialogPosition}
            onPositionChange={setDialogPosition}
            headerSelector="[data-draggable-header]"
          >
            <TopicDashboardDialog
              onClose={() => setShowTopicCards(false)}
              onTopicClick={(topicId) => handleTopicClick(topicId, true)}
              onAddTopic={handleAddTopic}
            />
          </DraggableDialog>
        </>
      )}

      {selectedTopicId && selectedTopic && mapRect && !selectedTaskId && (
        <DraggableDialog
          mapRect={mapRect}
          position={dialogPosition}
          onPositionChange={setDialogPosition}
          headerSelector="[data-draggable-header]"
        >
          <TopicDetailsDialog
            topic={selectedTopic}
            onClose={handleCloseAll}
            onBack={handleBackToTopics}
            onTaskClick={handleTaskClick}
            isCreating={isCreatingNewTopic}
          />
        </DraggableDialog>
      )}

      {selectedTaskId && selectedTask && selectedGoal && taskTopic && mapRect && (
        <DraggableDialog
          mapRect={mapRect}
          position={dialogPosition}
          onPositionChange={setDialogPosition}
          headerSelector="[data-draggable-header]"
        >
          <TaskDetailDialog
            task={selectedTask}
            goalId={selectedGoal.id}
            topicId={taskTopic.id}
            onClose={handleCloseAll}
            onBack={handleBackToTopic}
            onHelpRequest={handleHelpRequest}
          />
        </DraggableDialog>
      )}

      <div className="h-full p-6">
        <div className="h-[calc(100vh-8rem)]" ref={mapRef}>
          <div className={`h-full transition-all duration-500 ${
            showReview || showProgress
              ? 'opacity-80 pointer-events-none' 
              : ''
          }`}>
            <InteractiveMap
              topics={topics}
              onTopicClick={handleTopicClick}
              onCampfireClick={() => {
                setShowReview(true);
                setShowTopicCards(false);
                setSelectedTopicId(null);
                setSelectedTaskId(null);
                setIsCreatingNewTopic(false);
              }}
              onMailboxClick={() => {
                setShowTopicCards(true);
                setShowReview(false);
                setSelectedTopicId(null);
                setSelectedTaskId(null);
                setIsCreatingNewTopic(false);
              }}
              onHouseClick={() => {
                setShowProgress(true);
                setShowTopicCards(false);
                setShowReview(false);
                setSelectedTopicId(null);
                setSelectedTaskId(null);
                setIsCreatingNewTopic(false);
                setOpenedFromDashboard(false);
                console.log('onHouseClick');
              }}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
