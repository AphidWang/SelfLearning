import React from 'react';
import { Topic } from '../../types/goal';
import { subjects } from '../../styles/tokens';
import { useTopicStore } from '../../store/topicStore';
import { X } from 'lucide-react';

interface TopicDashboardProps {
  topics: Topic[];
  onTopicClick: (topicId: string) => void;
  onAddTopic: () => void;
}

export const TopicDashboard: React.FC<TopicDashboardProps> = ({ topics, onTopicClick, onAddTopic }) => {
  const { getCompletionRate } = useTopicStore();

  const getSubjectGradient = (subject: string, progress: number) => {
    const style = subjects.getSubjectStyle(subject);
    const gradientPosition = 100 - (progress * 0.8);
    return `${style.gradient} bg-[length:200%_100%] bg-[position:${gradientPosition}%_50%]`;
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <div className="h-full bg-white rounded-lg shadow flex flex-col">
      {/* 頂部導航欄 */}
      <div className="flex justify-center items-center p-4 border-b">
        <h2 className="text-xl font-bold">學習主題</h2>
      </div>

      {/* 內容區域 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topics.map(topic => {
            const completionRate = getCompletionRate(topic.id);
            return (
              <button
                key={topic.id}
                onClick={() => onTopicClick(topic.id)}
                className="relative p-4 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 max-w-[200px] h-[80px] border-l-4"
                style={{ 
                  borderLeftColor: subjects.getSubjectStyle(topic.subject || '').accent,
                  background: `linear-gradient(to right, ${subjects.getSubjectStyle(topic.subject || '').accent}10, ${subjects.getSubjectStyle(topic.subject || '').accent}10)`
                }}
              >
                <div className="flex items-start justify-between gap-2 h-full">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {topic.title}
                    </h3>
                  </div>
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={subjects.getSubjectStyle(topic.subject || '').accent}
                        strokeWidth="3"
                        strokeDasharray={`${completionRate}, 100`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900">
                      {completionRate}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          {/* 新增主題卡片 */}
          <button
            onClick={onAddTopic}
            className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 max-w-[200px] h-[80px]"
          >
            <span className="text-3xl text-blue-400">+</span>
            <span className="text-xs text-gray-500 mt-1">新增主題</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 兼容性導出
export const GoalDashboard = TopicDashboard;
export type { TopicDashboardProps, TopicDashboardProps as GoalDashboardProps }; 