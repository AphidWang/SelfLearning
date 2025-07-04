import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Archive } from 'lucide-react';
import { useTopicStore } from '../../store/topicStore';
import { useTopicTemplateStore } from '../../store/topicTemplateStore';
import { useAuth } from '../../context/AuthContext';
import { subjects } from '../../styles/tokens';
import { SUBJECTS } from '../../constants/subjects';
import { TopicRadialMap } from './TopicRadialMap';
import { TopicHeader } from './components/TopicHeader';
import { StatsPanel } from './components/StatsPanel';
import { DetailsPanel } from './components/DetailsPanel';
import { useTopicReview } from './hooks/useTopicReview';
import { useTopicStats } from './hooks/useTopicStats';
import { LoadingDots } from '../shared/LoadingDots';
import type { Topic } from '../../types/goal';

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
  const { createTemplate } = useTopicTemplateStore();
  const { user } = useAuth();
  
  const { state, actions, computed } = useTopicReview(topicId);
  const stats = useTopicStats(topicId, state.topic);

  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);

  // 記憶化主題樣式
  const subjectStyle = useMemo(() => {
    if (!state.topic) return subjects.getSubjectStyle('');
    return subjects.getSubjectStyle(state.topic.subject || '');
  }, [state.topic?.subject]);

  // 檢查是否為 mentor - 每次 topicId 變化時都會重新檢查
  const isMentor = useMemo(() => {
    console.log('🔍 檢查 Mentor 權限 - topicId:', topicId, 'user:', user);
    if (!user) {
      console.log('❌ 未登入用戶');
      return false;
    }
    const userRoles = user.roles || (user.role ? [user.role] : []);
    console.log('👤 用戶詳細資訊:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roles: user.roles,
      計算出的roles: userRoles,
      是否為mentor: userRoles.includes('mentor')
    });
    const result = userRoles.includes('mentor');
    console.log(result ? '✅ 是 Mentor' : '❌ 不是 Mentor');
    return result;
  }, [user?.roles, user?.role, topicId]); // 加入 topicId 作為依賴

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

  // 處理存為模板
  const handleSaveAsTemplate = () => {
    setShowSaveAsTemplateModal(true);
  };

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
          isMentor={isMentor}
          onSaveAsTemplate={handleSaveAsTemplate}
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

        {/* 存為模板 Modal */}
        {showSaveAsTemplateModal && (
          <SaveAsTemplateModal
            isOpen={showSaveAsTemplateModal}
            onClose={() => setShowSaveAsTemplateModal(false)}
            topic={state.topic}
            onSubmit={async (templateData) => {
              try {
                const newTemplate = await createTemplate(templateData);
                if (newTemplate) {
                  setShowSaveAsTemplateModal(false);
                  alert('模板創建成功！');
                } else {
                  alert('模板創建失敗，請稍後再試');
                }
              } catch (error) {
                console.error('創建模板失敗:', error);
                alert('模板創建失敗，請稍後再試');
              }
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

// 存為模板 Modal 組件
interface SaveAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic | null;
  onSubmit: (data: any) => void;
}

const SaveAsTemplateModal: React.FC<SaveAsTemplateModalProps> = ({
  isOpen,
  onClose,
  topic,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    category: '',
    includeType: 'goals_only' as 'goals_only' | 'goals_and_tasks'
  });

  useEffect(() => {
    if (topic) {
      setFormData({
        title: topic.title,
        description: topic.description || '',
        subject: topic.subject || '',
        category: topic.category || 'learning',
        includeType: 'goals_only'
      });
    }
  }, [topic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    
    onSubmit({
      ...formData,
      source_topic_id: topic.id
    });
    
    setFormData({
      title: '',
      description: '',
      subject: '',
      category: '',
      includeType: 'goals_only'
    });
  };

  if (!isOpen || !topic) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-amber-200 dark:border-gray-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Archive className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">
            存為主題模板
          </h2>
          <p className="text-amber-700 dark:text-amber-300 text-sm">
            將此主題保存為模板，供日後重複使用
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                模板名稱
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-amber-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                placeholder="輸入模板名稱"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                模板描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-amber-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 h-24 resize-none"
                placeholder="描述此模板的用途和特色"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                學科
              </label>
              <div className="relative">
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-gradient-to-r from-white/90 to-blue-50/90 dark:from-gray-700/90 dark:to-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer hover:shadow-md"
                  required
                >
                  <option value="">選擇學科</option>
                  {Object.entries(SUBJECTS).map(([key, subject]) => (
                    <option key={key} value={subject}>
                      {key === 'CHINESE' && '📖'} 
                      {key === 'ENGLISH' && '🔤'} 
                      {key === 'MATH' && '🔢'} 
                      {key === 'SCIENCE' && '🔬'} 
                      {key === 'SOCIAL' && '🌍'} 
                      {key === 'ARTS' && '🎨'} 
                      {key === 'PE' && '⚽'} 
                      {key === 'CUSTOM' && '✨'} 
                      {' '}{subject}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                分類
              </label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gradient-to-r from-white/90 to-purple-50/90 dark:from-gray-700/90 dark:to-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer hover:shadow-md"
                  required
                >
                  <option value="">選擇分類</option>
                  {[
                    { value: 'learning', label: '學習成長', emoji: '📚' },
                    { value: 'personal', label: '個人發展', emoji: '🌟' },
                    { value: 'project', label: '專案計畫', emoji: '🚀' }
                  ].map(category => (
                    <option key={category.value} value={category.value}>
                      {category.emoji} {category.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-3">
                包含內容
              </label>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="goals_only"
                    checked={formData.includeType === 'goals_only'}
                    onChange={(e) => setFormData({ ...formData, includeType: e.target.value as 'goals_only' | 'goals_and_tasks' })}
                    className="w-4 h-4 text-amber-600 border-amber-300 focus:ring-amber-500 focus:ring-2"
                  />
                  <span className="ml-3 text-sm text-amber-800 dark:text-amber-200">
                    🎯 僅包含目標
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="goals_and_tasks"
                    checked={formData.includeType === 'goals_and_tasks'}
                    onChange={(e) => setFormData({ ...formData, includeType: e.target.value as 'goals_only' | 'goals_and_tasks' })}
                    className="w-4 h-4 text-amber-600 border-amber-300 focus:ring-amber-500 focus:ring-2"
                  />
                  <span className="ml-3 text-sm text-amber-800 dark:text-amber-200">
                    📋 包含目標和任務
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || !formData.subject || !formData.category}
              className="px-6 py-3 text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              創建模板
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 兼容性導出
export const GoalReviewPage = TopicReviewPage;
export type { TopicReviewPageProps, TopicReviewPageProps as GoalReviewPageProps }; 