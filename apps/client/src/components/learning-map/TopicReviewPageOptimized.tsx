import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTopicStore } from '../../store/topicStore';
import { subjects } from '../../styles/tokens';
import { TopicRadialMap, useTopicRadialMapStats } from '../topic-review/TopicRadialMap';
import { HelpMessageDisplay } from './HelpMessageDisplay';
import { UserAvatar, UserAvatarGroup } from './UserAvatar';
import { CollaborationManager } from './CollaborationManager';
import { useTopicReviewOptimized } from '../topic-review/hooks/useTopicReviewOptimized';
import type { Goal, Task, User, Topic, TaskStatus } from '../../types/goal';
import { 
  Brain, TrendingUp, Calendar, Trophy, Star, Clock, 
  CheckCircle2, Target, BookOpen, Zap, Award, 
  BarChart3, PieChart, TrendingDown, ArrowUp,
  Flame, Eye, X, AlertCircle, PlayCircle, MessageSquare,
  ChevronLeft, Pencil, Sparkles, Check, HelpCircle,
  Save, AlertTriangle, Plus, Trash2, PenTool, Mic,
  Edit, UserPlus, Users
} from 'lucide-react';

interface TopicReviewPageOptimizedProps {
  topicId: string;
  onTaskClick?: (taskId: string, goalId: string) => void;
  onGoalClick?: (goalId: string) => void;
  onClose: () => void;
}

export const TopicReviewPageOptimized: React.FC<TopicReviewPageOptimizedProps> = ({
  topicId,
  onTaskClick,
  onGoalClick,
  onClose
}) => {
  const { 
    updateTopicCompat: updateTopic,
    deleteTopic
  } = useTopicStore();
  
  // 使用優化的 hook 獲取所有數據
  const { state, computed, actions } = useTopicReviewOptimized(topicId);

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

  // 載入中狀態
  if (state.isLoading || !state.topic) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 錯誤狀態
  if (state.error) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4">
        <div className="text-red-500">{state.error}</div>
        <button 
          onClick={actions.refreshTopic}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          重試
        </button>
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

  // 處理右側面板中任務項目的點擊（用於選擇）
  const handleInfoPanelTaskSelect = (taskId: string, goalId: string) => {
    actions.setSelectedTask(taskId, goalId);
  };

  // 處理從任務詳情返回到目標
  const handleBackToGoal = () => {
    actions.setSelectedTask(null);
  };

  // 處理目標刪除後的狀態清理
  const handleGoalDeleted = () => {
    actions.setSelectedGoal(null);
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
        <TopicHeaderOptimized 
          topic={state.topic}
          editedTopic={state.editedTopic}
          isEditingTitle={state.isEditingTitle}
          showSubjectDropdown={state.showSubjectDropdown}
          subjectStyle={subjectStyle}
          onEditingTitleChange={actions.setIsEditingTitle}
          onEditedTopicChange={actions.setEditedTopic}
          onShowSubjectDropdownChange={actions.setShowSubjectDropdown}
          onShowDeleteConfirm={actions.setShowDeleteConfirm}
          onUpdateTopic={updateTopic}
          onClose={onClose}
        />

        {/* 刪除確認對話框 */}
        {state.showDeleteConfirm && (
          <DeleteConfirmDialog
            topic={state.topic}
            onConfirm={handleDeleteTopic}
            onCancel={() => actions.setShowDeleteConfirm(false)}
          />
        )}

        {/* 主要內容區 */}
        <div className="flex-1 p-3 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 h-full">
            {/* 左側統計面板 */}
            <div className="col-span-3 flex flex-col gap-2 overflow-y-auto">
              <StatsPanel 
                progress={computed.progress}
                weeklyStats={computed.weeklyStats}
                needHelpCount={computed.needHelpCount}
                subjectStyle={subjectStyle}
              />
            </div>

            {/* 中央心智圖 */}
            <div className="col-span-6 h-full">
              <motion.div
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                {state.isUpdating && (
                  <div className="absolute inset-0 bg-white/30 dark:bg-gray-800/30 flex items-center justify-center z-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                )}
                <TopicRadialMap
                  key={`radial-${state.topic.id}`}
                  topicId={topicId}
                  goals={computed.memoizedGoals}
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

            {/* 右側資訊面板 */}
            <div className="col-span-3 h-full min-h-0">
              <GoalTaskInfoPanelOptimized
                topic={state.topic}
                selectedGoalId={state.selectedGoalId}
                selectedTaskId={state.selectedTaskId}
                subjectColor={subjectStyle.accent}
                onTaskSelect={handleInfoPanelTaskSelect}
                onGoalClick={onGoalClick}
                onBackToGoal={handleBackToGoal}
                onGoalDeleted={handleGoalDeleted}
                onCollaborationUpdate={actions.handleCollaborationUpdate}
                users={computed.availableUsers}
                owner={computed.owner}
                collaborators={computed.collaborators}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 優化的標題組件
interface TopicHeaderOptimizedProps {
  topic: Topic;
  editedTopic: Topic | null;
  isEditingTitle: boolean;
  showSubjectDropdown: boolean;
  subjectStyle: any;
  onEditingTitleChange: (editing: boolean) => void;
  onEditedTopicChange: (topic: Topic | null) => void;
  onShowSubjectDropdownChange: (show: boolean) => void;
  onShowDeleteConfirm: (show: boolean) => void;
  onUpdateTopic: (topicId: string, updates: Partial<Topic>) => Promise<Topic | null>;
  onClose: () => void;
}

const TopicHeaderOptimized: React.FC<TopicHeaderOptimizedProps> = ({
  topic,
  editedTopic,
  isEditingTitle,
  showSubjectDropdown,
  subjectStyle,
  onEditingTitleChange,
  onEditedTopicChange,
  onShowSubjectDropdownChange,
  onShowDeleteConfirm,
  onUpdateTopic,
  onClose
}) => {
  return (
    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-3">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center mt-1 flex-shrink-0"
            style={{ backgroundColor: `${subjectStyle.accent}20` }}
          >
            <Brain className="w-5 h-5" style={{ color: subjectStyle.accent }} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <div className="flex items-center gap-3 mb-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editedTopic?.title || ''}
                      onChange={(e) => onEditedTopicChange(editedTopic ? {...editedTopic, title: e.target.value} : editedTopic)}
                      className="text-xl font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:border-transparent flex-1"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && editedTopic) {
                          onUpdateTopic(topic.id, editedTopic);
                          onEditingTitleChange(false);
                        }
                      }}
                    />
                    {/* 主題選擇下拉選單省略... */}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-1">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
                      {topic.title}
                    </h1>
                    <span 
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${subjectStyle.bg} ${subjectStyle.text} flex-shrink-0`}
                    >
                      {topic.subject || '未分類'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {isEditingTitle ? (
              <textarea
                value={editedTopic?.description || ''}
                onChange={(e) => onEditedTopicChange(editedTopic ? {...editedTopic, description: e.target.value} : editedTopic)}
                className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                rows={2}
                placeholder="輸入主題描述..."
              />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{topic.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 編輯按鈕 */}
          {isEditingTitle ? (
            <>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (editedTopic) {
                    const updates = {
                      title: editedTopic.title,
                      description: editedTopic.description,
                      subject: editedTopic.subject
                    };
                    
                    try {
                      await onUpdateTopic(topic.id, updates);
                      onEditingTitleChange(false);
                      onShowSubjectDropdownChange(false);
                    } catch (error) {
                      console.error('更新主題失敗:', error);
                      alert('更新失敗，請稍後再試');
                    }
                  }
                }}
                className="w-9 h-9 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                aria-label="完成編輯"
              >
                <Check className="w-5 h-5 text-green-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditedTopicChange(topic);
                  onEditingTitleChange(false);
                  onShowSubjectDropdownChange(false);
                }}
                className="w-9 h-9 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                aria-label="取消編輯"
              >
                <X className="w-5 h-5 text-red-600" />
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditedTopicChange(topic);
                onEditingTitleChange(true);
              }}
              className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="編輯標題"
            >
              <Pencil className="w-5 h-5 text-gray-500" />
            </button>
          )}

          {/* 刪除按鈕 */}
          <button
            onClick={() => onShowDeleteConfirm(true)}
            className="w-9 h-9 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
            title="刪除主題"
          >
            <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
          </button>

          {/* 關閉按鈕 */}
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="關閉"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 優化的統計面板組件
interface StatsPanelProps {
  progress: number;
  weeklyStats: any;
  needHelpCount: number;
  subjectStyle: any;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  progress,
  weeklyStats,
  needHelpCount,
  subjectStyle
}) => {
  return (
    <>
      {/* 總體進度 */}
      <motion.div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4" style={{ color: subjectStyle.accent }} />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">總體進度</h3>
          <div className="ml-auto text-2xl font-bold" style={{ color: subjectStyle.accent }}>
            {Math.round(progress)}%
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <motion.div
            className="h-2 rounded-full"
            style={{ backgroundColor: subjectStyle.accent }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.5, duration: 1 }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>已完成: {weeklyStats.completedTasks}</span>
          <span>總任務: {weeklyStats.totalTasks}</span>
        </div>
      </motion.div>

      {/* 本週亮點 */}
      <motion.div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">本週亮點</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-lg font-bold text-green-600">{weeklyStats.newlyCompleted}</div>
            <div className="text-xs text-green-700 dark:text-green-300">新完成</div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-lg font-bold text-blue-600">{weeklyStats.inProgressTasks}</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">進行中</div>
          </div>
          <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-lg font-bold text-orange-600">{needHelpCount}</div>
            <div className="text-xs text-orange-700 dark:text-orange-300">需要幫忙</div>
          </div>
        </div>
      </motion.div>

      {/* 心情小屋和老師評語等其他組件... */}
    </>
  );
};

// 優化的資訊面板組件 - 不再獨立調用 API
interface GoalTaskInfoPanelOptimizedProps {
  topic: Topic;
  selectedGoalId: string | null;
  selectedTaskId: string | null;
  subjectColor: string;
  onTaskSelect?: (taskId: string, goalId: string) => void;
  onGoalClick?: (goalId: string) => void;
  onBackToGoal?: () => void;
  onGoalDeleted?: () => void;
  onCollaborationUpdate: () => Promise<void>;
  users: User[];
  owner?: User;
  collaborators?: any[];
}

const GoalTaskInfoPanelOptimized: React.FC<GoalTaskInfoPanelOptimizedProps> = ({
  topic,
  selectedGoalId,
  selectedTaskId,
  subjectColor,
  onTaskSelect,
  onGoalClick,
  onBackToGoal,
  onGoalDeleted,
  onCollaborationUpdate,
  users,
  owner,
  collaborators
}) => {
  // 直接從傳入的 topic 中找到相關數據，不再調用 API
  const selectedGoal = selectedGoalId && selectedGoalId !== 'TOPIC' ? 
    topic?.goals?.find(goal => goal.id === selectedGoalId) : null;
  const selectedTask = selectedTaskId && selectedGoal ? 
    selectedGoal?.tasks?.find(task => task.id === selectedTaskId) : null;

  // 根據選擇顯示不同內容
  if (selectedTask && selectedGoal) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">任務詳情</h3>
          <p className="text-sm text-gray-600">{selectedTask.title}</p>
          {onBackToGoal && (
            <button 
              onClick={onBackToGoal}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              ← 返回目標
            </button>
          )}
        </div>
      </div>
    );
  }

  if (selectedGoal) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">目標詳情</h3>
          <p className="text-sm text-gray-600">{selectedGoal.title}</p>
          <div className="mt-4">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">任務列表</h4>
            <div className="space-y-2">
              {(selectedGoal.tasks || []).map((task) => (
                <div
                  key={task.id}
                  className="p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-all bg-gray-50 border-gray-200"
                  onClick={() => onTaskSelect?.(task.id, selectedGoal.id)}
                >
                  <span className="text-xs text-gray-700">{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedGoalId === 'TOPIC') {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">主題總覽</h3>
          <p className="text-sm text-gray-600">{topic.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col items-center justify-center p-6">
      <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">探索學習路徑</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        點擊中央主題查看整體規劃
        <br />
        點擊目標或任務查看詳細資訊
      </p>
    </div>
  );
};

// 刪除確認對話框
interface DeleteConfirmDialogProps {
  topic: Topic;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  topic,
  onConfirm,
  onCancel
}) => {
  return (
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
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white">確認刪除主題</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">此操作無法復原</p>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          您確定要刪除主題 <strong>{topic.title}</strong> 嗎？所有相關的目標和任務都會被永久刪除。
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            確認刪除
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TopicReviewPageOptimized; 