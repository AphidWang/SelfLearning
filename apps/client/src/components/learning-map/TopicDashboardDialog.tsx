import React, { useEffect, useState } from 'react';
import { Topic } from '../../types/goal';
import { TopicDashboardCard } from './TopicDashboardCard';
import { useTopicStore } from '../../store/topicStore';

interface TopicDashboardDialogProps {
  onClose: () => void;
  onTopicClick: (topicId: string) => void;
  onAddTopic: () => void;
}

export const TopicDashboardDialog: React.FC<TopicDashboardDialogProps> = ({
  onClose,
  onTopicClick,
  onAddTopic,
}) => {
  const { fetchTopicsWithActions } = useTopicStore();
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    fetchTopicsWithActions().then((result) => {
      if (Array.isArray(result)) setTopics(result);
    });
  }, [fetchTopicsWithActions]);
  
  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-[400px] max-w-[90vw] flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 select-none" data-draggable-header>
        <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300">學習主題概覽</h2>
        <button
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={onClose}
          aria-label="關閉"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topics.map(topic => (
            <TopicDashboardCard
              key={topic.id}
              title={topic.title}
              subject={topic.subject || '未分類'}
              progress={topic.completionRate ?? 0 }
              onClick={() => {
                onClose();
                onTopicClick(topic.id);
              }}
            />
          ))}
          {/* 新增主題卡片 */}
          <button
            onClick={() => {
              onClose();
              onAddTopic();
            }}
            className="w-full h-[80px] bg-white/60 dark:bg-gray-800/60 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex flex-col items-center justify-center gap-1"
          >
            <span className="text-2xl text-blue-400 dark:text-blue-500">+</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">新增主題</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 兼容性導出
export const GoalDashboardDialog = TopicDashboardDialog;
export type { TopicDashboardDialogProps, TopicDashboardDialogProps as GoalDashboardDialogProps }; 