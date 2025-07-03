import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTopicStore } from '../../store/topicStore';
import { subjects } from '../../styles/tokens';
import { TopicRadialMap } from './TopicRadialMap';
import { TopicHeader } from './components/TopicHeader';
import { StatsPanel } from './components/StatsPanel';
import { DetailsPanel } from './components/DetailsPanel';
import { useTopicReview } from './hooks/useTopicReview';
import { useTopicStats } from './hooks/useTopicStats';
import { LoadingDots } from '../shared/LoadingDots';

interface TopicReviewPageProps {
  topicId: string;
  onTaskClick?: (taskId: string, goalId: string) => void;
  onGoalClick?: (goalId: string) => void;
  onClose: () => void;
}

export const TopicReviewPage: React.FC<TopicReviewPageProps> = ({
  topicId,
  onTaskClick,
  onGoalClick,
  onClose
}) => {
  const { updateTopic, deleteTopic } = useTopicStore();
  
  const { state, actions, computed } = useTopicReview(topicId);
  const stats = useTopicStats(topicId, state.topic);

  // 記憶化主題樣式
  const subjectStyle = useMemo(() => {
    if (!state.topic) return subjects.getSubjectStyle('');
    return subjects.getSubjectStyle(state.topic.subject || '');
  }, [state.topic?.subject]);

  // 處理點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (state.showSubjectDropdown && !target.closest('.subject-dropdown')) {
        actions.setShowSubjectDropdown(false);
      }
    };

    if (state.showSubjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.showSubjectDropdown, actions]);

  if (!state.topic) {
    console.log('TopicReviewPage loading state triggered');
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingDots />
      </div>
    );
  }

  // 處理 RadialMap 的點擊事件
  const handleRadialMapGoalClick = (goalId: string) => {
    if (goalId === '') {
      actions.setSelectedGoal(null);
    } else {
      actions.setSelectedGoal(goalId);
    }
  };

  const handleRadialMapTaskClick = (taskId: string, goalId: string) => {
    actions.setSelectedTask(taskId, goalId);
  };

  // 處理從詳情面板選擇任務
  const handleDetailsPanelTaskSelect = (taskId: string, goalId: string) => {
    actions.setSelectedTask(taskId, goalId);
  };

  // 處理狀態更新並通知其他組件
  const handleUpdateWithRefresh = async (updateFn: () => Promise<void>) => {
    return await actions.handleTopicUpdate(updateFn);
  };

  const handleSaveTitle = async () => {
    if (state.editedTopic) {
      const updates = {
        title: state.editedTopic.title,
        description: state.editedTopic.description,
        subject: state.editedTopic.subject
      };

      try {
        await actions.handleTopicUpdate(async () => {
          const updatedTopic = await updateTopic(topicId, state.topic!.version, updates);
          if (!updatedTopic) {
            throw new Error('更新失敗');
          }
        });
      } catch (error) {
        console.error('更新主題失敗:', error);
        alert('更新失敗，請稍後再試');
      } finally {
        actions.setEditingTitle(false);
        actions.setShowSubjectDropdown(false);
      }
    }
  };

  const handleCancelEdit = () => {
    actions.updateEditedTopic(state.topic!);
    actions.setEditingTitle(false);
    actions.setShowSubjectDropdown(false);
  };

  const handleDeleteTopic = async () => {
    if (!state.topic) return;
    
    try {
      const success = await deleteTopic(state.topic.id);
      if (success) {
        onClose();
      } else {
        throw new Error('刪除失敗');
      }
    } catch (error) {
      console.error('刪除主題失敗:', error);
      alert('刪除主題失敗，請稍後再試。');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 w-full max-w-[1280px] h-[85vh] flex flex-col overflow-hidden"
        style={{ 
          borderColor: subjectStyle.accent,
          boxShadow: `0 20px 40px ${subjectStyle.accent}25`
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* 頂部標題區 */}
        <TopicHeader
          topic={state.topic}
          editedTopic={state.editedTopic}
          isEditingTitle={state.isEditingTitle}
          showSubjectDropdown={state.showSubjectDropdown}
          subjectStyle={subjectStyle}
          onEditingToggle={actions.setEditingTitle}
          onShowSubjectDropdown={actions.setShowSubjectDropdown}
          onTopicUpdate={actions.updateEditedTopic}
          onSave={handleSaveTitle}
          onCancel={handleCancelEdit}
          onDelete={() => actions.setShowDeleteConfirm(true)}
          onClose={onClose}
        />

        {/* 刪除確認對話框 */}
        {state.showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">確認刪除主題</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    此操作無法復原
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                您確定要刪除主題 <strong>{state.topic.title}</strong> 嗎？所有相關的目標和任務都會被永久刪除。
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => actions.setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteTopic}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  確認刪除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 主要內容區 */}
        <div className="flex-1 p-3 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 h-full">
            {/* 左側統計面板 */}
            <StatsPanel
              subjectStyle={subjectStyle}
              progress={computed.progress}
              weeklyStats={stats.weeklyStats}
              needHelpCount={stats.needHelpCount}
            />

            {/* 中央心智圖 */}
            <div className="col-span-6 h-full">
              <motion.div
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <TopicRadialMap
                  key={`radial-${state.topic.id}-${state.topic.updated_at || Date.now()}`}
                  topicId={topicId}
                  goals={stats.memoizedGoals}
                  width={760}
                  height={460}
                  showAnimations={true}
                  selectedGoalId={state.selectedGoalId}
                  selectedTaskId={state.selectedTaskId}
                  onTaskClick={handleRadialMapTaskClick}
                  onGoalClick={handleRadialMapGoalClick}
                  className="w-full h-full"
                />
              </motion.div>
            </div>

            {/* 右側詳情面板 */}
            <div className="col-span-3 h-full min-h-0">
                          <DetailsPanel
              topic={state.topic}
              selectedGoalId={state.selectedGoalId}
              selectedTaskId={state.selectedTaskId}
              subjectStyle={subjectStyle}
              onUpdateNotify={async () => {
                const result = await actions.handleCollaborationUpdate();
                if (result === null) {
                  console.warn('Collaboration update returned null');
                }
              }}
              availableUsers={computed.availableUsers}
              collaborators={computed.collaborators}
              onTaskSelect={handleDetailsPanelTaskSelect}
            />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 兼容性導出
export const GoalReviewPage = TopicReviewPage;
export type { TopicReviewPageProps, TopicReviewPageProps as GoalReviewPageProps }; 