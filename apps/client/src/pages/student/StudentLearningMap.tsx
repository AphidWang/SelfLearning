import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { TopicDashboard } from '../../components/learning-map/TopicDashboard';
import { InteractiveMap } from '../../components/learning-map/InteractiveMap';
import { TaskDetailDialog } from '../../components/learning-map/TaskDetailDialog';
import { TopicDetails } from '../../components/learning-map/TopicDetails';
import { TopicTemplateBrowser } from '../../components/template/TopicTemplateBrowser';
import { useTopicStore } from '../../store/topicStore';
import PageLayout from '../../components/layout/PageLayout';
import { Topic, Task, TopicStatus, TopicType } from '../../types/goal';
import { SUBJECTS } from '../../constants/subjects';
import { DailyReviewCarousel } from '../../components/learning-map/DailyReviewCarousel';
import { TopicDashboardCard } from '../../components/learning-map/TopicDashboardCard';
import { TopicDashboardDialog } from '../../components/learning-map/TopicDashboardDialog';
import { TopicDetailsDialog } from '../../components/learning-map/TopicDetailsDialog';
import { DraggableDialog } from '../../components/learning-map/DraggableDialog';
import { TopicProgressDialog } from '../../components/learning-map/TopicProgressDialog';
import { TopicReviewPage } from '../../components/topic-review';
import { AnimatePresence } from 'framer-motion';

export const StudentLearningMap: React.FC = () => {
  // Dialog 相關狀態
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showTopicCards, setShowTopicCards] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [openedFromDashboard, setOpenedFromDashboard] = useState(false);
  
  // Template 相關狀態
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  
  // Review 相關狀態
  const [showTopicReviewId, setShowTopicReviewId] = useState<string | null>(null);
  const [showDailyReview, setShowDailyReview] = useState(false);

  const { topics, addTopic, getCompletionRate, fetchTopics } = useTopicStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapRect, setMapRect] = useState<{left: number, top: number, width: number, height: number} | null>(null);
  const [dialogPosition, setDialogPosition] = useState<{x: number, y: number}>({ x: -420, y: 20 });

  useLayoutEffect(() => {
    if ((showDailyReview || showTopicCards || selectedTopicId || showProgress || showTopicReviewId) && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setMapRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    }
  }, [showDailyReview, showTopicCards, selectedTopicId, showProgress, showTopicReviewId]);

  useEffect(() => {
    // 初始化載入主題數據
    const { fetchTopics } = useTopicStore.getState();
    fetchTopics();
  }, []);

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
    setOpenedFromDashboard(fromDashboard);
    if (!fromDashboard) {
      setShowTopicCards(false);
    }
  };

  const handleAddTopic = async () => {
    // 顯示模板選擇器，而不是直接建立空白主題
    setShowTopicCards(false);
    setShowTemplateBrowser(true);
  };

  const handleTemplateSelected = async (templateId: string) => {
    // 模板選擇完成後的回調
    setShowTemplateBrowser(false);
    // 刷新主題列表以獲取新建立的主題
    await fetchTopics();
  };

  const handleCreateBlankTopic = async () => {
    // 建立空白主題的函數
    const newTopic = {
      title: '新主題',
      description: '請輸入主題描述',
      type: '學習目標' as TopicType,
      category: 'learning',
      subject: SUBJECTS.CUSTOM,
      status: 'active' as TopicStatus,
      goals: [],
      bubbles: [],
      progress: 0,
      is_collaborative: false,
      show_avatars: true
    };
    const addedTopic = await addTopic(newTopic);
    if (addedTopic) {
      setShowTemplateBrowser(false);
      setShowTopicReviewId(addedTopic.id);
    }
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    // 保留 selectedTopicId，這樣在關閉任務詳情時可以回到主題詳情
  };

  const handleCloseAll = () => {
    setSelectedTopicId(null);
    setSelectedTaskId(null);
    setOpenedFromDashboard(false);
  };

  const handleBackToTopics = () => {
    if (openedFromDashboard) {
      // 如果是從 dashboard 打開的，回到 dashboard
      setSelectedTopicId(null);
      setSelectedTaskId(null);
      setOpenedFromDashboard(false);
      setShowTopicCards(true);
    } else {
      // 如果是從地圖直接打開的，直接關掉
      setSelectedTopicId(null);
      setSelectedTaskId(null);
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
    // 實現幫助請求邏輯
    console.log('Help requested for task:', taskId);
  };

  // 處理數據更新（刷新地圖）
  const handleUpdate = async () => {
    await fetchTopics();
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
      {/* Progress Dialog */}
      {showProgress && mapRect && (
        <>
          <div
            className="fixed z-40 bg-black/10 cursor-pointer"
            style={{ left: mapRect.left, top: mapRect.top, width: mapRect.width, height: mapRect.height }}
            onClick={() => setShowProgress(false)}
          />
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

      {/* Daily Review Dialog */}
      {showDailyReview && mapRect && (
        <>
          <div
            className="fixed z-40 bg-black/10 cursor-pointer"
            style={{ left: mapRect.left, top: mapRect.top, width: mapRect.width, height: mapRect.height }}
            onClick={() => setShowDailyReview(false)}
          />
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
              <DailyReviewCarousel 
                className="max-h-[80vh] overflow-y-auto" 
                onClose={() => setShowDailyReview(false)} 
              />
            </div>
          </div>
        </>
      )}

      {/* Topic Dashboard Dialog */}
      {showTopicCards && mapRect && (
        <>
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

      {/* Topic Details Dialog */}
      {selectedTopicId && selectedTopic && mapRect && !selectedTaskId && (
        <DraggableDialog
          mapRect={mapRect}
          position={dialogPosition}
          onPositionChange={setDialogPosition}
          headerSelector="[data-draggable-header]"
        >
          <TopicDetailsDialog
            topic={selectedTopic}
            open={!!selectedTopicId}
            onClose={() => {
              setSelectedTopicId(null);
              setOpenedFromDashboard(false);
            }}
            onTaskClick={handleTaskClick}
            onGoalClick={(goalId) => console.log('Goal clicked:', goalId)}
            onShowReview={(topicId) => setShowTopicReviewId(topicId)}
            onUpdate={handleUpdate}
          />
        </DraggableDialog>
      )}

      {/* Task Detail Dialog */}
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

      {/* Topic Review Dialog */}
      {showTopicReviewId && mapRect && (
        <>
          <div
            className="fixed z-40 bg-black/10 cursor-pointer"
            style={{ left: mapRect.left, top: mapRect.top, width: mapRect.width, height: mapRect.height }}
            onClick={() => setShowTopicReviewId(null)}
          />
          <DraggableDialog
            mapRect={mapRect}
            position={dialogPosition}
            onPositionChange={setDialogPosition}
            headerSelector="[data-draggable-header]"
          >
            <TopicReviewPage
              topicId={showTopicReviewId}
              onClose={() => setShowTopicReviewId(null)}
              onTaskClick={handleTaskClick}
              onGoalClick={(goalId) => console.log('Goal clicked:', goalId)}
            />
          </DraggableDialog>
        </>
      )}

             {/* Template Browser */}
       <TopicTemplateBrowser
         isOpen={showTemplateBrowser}
         onClose={() => setShowTemplateBrowser(false)}
         onTemplateSelected={handleTemplateSelected}
         onCreateBlankTopic={handleCreateBlankTopic}
       />

      <div className="h-full p-6">
        <div className="h-[calc(100vh-8rem)]" ref={mapRef}>
          <div className={`h-full transition-all duration-500 ${
            showDailyReview || showProgress
              ? 'opacity-80 pointer-events-none' 
              : ''
          }`}>
            <InteractiveMap
              topics={topics}
              onTopicClick={handleTopicClick}
              onCampfireClick={() => {
                setShowDailyReview(true);
                setShowTopicCards(false);
                setSelectedTopicId(null);
                setSelectedTaskId(null);
                setOpenedFromDashboard(false);
              }}
              onMailboxClick={() => {
                setShowTopicCards(true);
                setShowDailyReview(false);
                setSelectedTopicId(null);
                setSelectedTaskId(null);
                setOpenedFromDashboard(false);
              }}
              onHouseClick={() => {
                setShowProgress(true);
                setShowTopicCards(false);
                setShowDailyReview(false);
                setSelectedTopicId(null);
                setSelectedTaskId(null);
                setOpenedFromDashboard(false);
              }}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
