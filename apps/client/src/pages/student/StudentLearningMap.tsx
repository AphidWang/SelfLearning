/**
 * 🗺️ 學習地圖架構
 * 
 * 核心組件層次：
 * StudentLearningMap (主頁面)
 * ├── PageLayout
 * │   └── InteractiveMap (背景地圖)
 * │       ├── 🔥 營火 → DailyReviewCarousel
 * │       ├── 📮 信箱 → TopicDashboardDialog  
 * │       ├── 🏠 房子 → TopicProgressDialog
 * │       └── 📌 主題點 → TopicDetailsDialog
 * │
 * ├── TopicTemplateBrowser (模板選擇器)
 * └── 多個浮動 Dialog (使用 DraggableDialog 包裝)
 * 
 * 主要狀態：
 * - showDailyReview: 每日回顧輪播
 * - showTopicCards: 主題卡片面板
 * - showProgress: 進度總覽面板
 * - showTemplateBrowser: 模板選擇器
 * - showTopicReviewId: 主題詳細檢視
 * - selectedTopicId: 當前選中的主題
 * - selectedTaskId: 當前選中的任務
 * - openedFromDashboard: 是否從儀表板開啟
 * - mapRect: 地圖容器位置尺寸
 * - dialogPosition: 可拖拽 Dialog 位置
 */

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { InteractiveMap } from '../../components/learning-map/InteractiveMap';
import { TaskDetailDialog } from '../../components/learning-map/TaskDetailDialog';
import { TopicTemplateBrowser } from '../../components/template/TopicTemplateBrowser';
import { useTopicStore } from '../../store/topicStore';
import { useGoalStore } from '../../store/goalStore';
import { useTaskStore } from '../../store/taskStore';
import { getGoalById, getTopicById, getGoalsForTopic, getTasksForGoal } from '../../store/helpers';
import PageLayout from '../../components/layout/PageLayout';
import { TopicStatus, TopicType } from '../../types/goal';
import { SUBJECTS } from '../../constants/subjects';
import { DailyReviewCarousel } from '../../components/learning-map/DailyReviewCarousel';
import { TopicDashboardDialog } from '../../components/learning-map/TopicDashboardDialog';
import { TopicDetailsDialog } from '../../components/learning-map/TopicDetailsDialog';
import { DraggableDialog } from '../../components/learning-map/DraggableDialog';
import { TopicProgressDialog } from '../../components/learning-map/TopicProgressDialog';
import { TopicReviewPage } from '../../components/topic-review/TopicReviewPage';
import {fetchTopicsWithActions} from '../../store/dataManager';

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

  const { topics, createTopic } = useTopicStore();
  const { getTaskById } = useTaskStore();
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
    fetchTopicsWithActions();
  }, []);

  const selectedTopic = topics.find(t => t.id === selectedTopicId);
  // 當有 selectedTaskId 時，使用重構後的 store 架構查找任務
  const taskInfo = selectedTaskId ? (() => {
    // 1. 從 taskStore 直接獲取任務
    const task = getTaskById(selectedTaskId);
    if (!task) return null;
    
    // 2. 從 goalStore 獲取目標
    const goal = getGoalById(task.goal_id);
    if (!goal) return null;
    
    // 3. 從 topicStore 獲取主題
    const topic = getTopicById(goal.topic_id);
    if (!topic) return null;
    
    return { task, goal, topic };
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
    await fetchTopicsWithActions();
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
    const addedTopic = await createTopic(newTopic);
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

  // 過濾出有任務的目標，並轉換為地圖點
  const tasks = topics
    .filter(topic => {
      // 使用重構後的架構：檢查主題是否有活躍目標
      const topicGoals = getGoalsForTopic(topic.id);
      return topicGoals.some(goal => {
        const goalTasks = getTasksForGoal(goal.id);
        return goalTasks.length > 0;
      });
    })
    .map((topic, index, filteredTopics) => {
      const totalTopics = filteredTopics.length;
      const x = (index / totalTopics) * 80 + 10;
      const y = 50;
      
      // 使用重構後的架構計算完成狀態
      const topicGoals = getGoalsForTopic(topic.id);
      const completed = topicGoals.every(goal => {
        const goalTasks = getTasksForGoal(goal.id);
        return goalTasks.length > 0 && goalTasks.every(task => task.status === 'done');
      });
      
      return {
        id: topic.id,
        label: topic.title,
        subject: topic.subject || '未分類',
        completed,
        position: { x, y },
        topicId: topic.id
      };
    });
    
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
