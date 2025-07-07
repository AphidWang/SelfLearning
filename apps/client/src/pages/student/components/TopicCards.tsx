/**
 * TopicCards - 主題卡片組件集合
 * 
 * 包含：
 * - TopicCard: 主題卡片組件
 * - TopicGrid: 主題網格組件
 * - CreateTopicCard: 建立新主題卡片組件
 * - TopicCardData: 主題卡片數據接口
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  Play, 
  Target, 
  Flag, 
  Users,
  Plus
} from 'lucide-react';
import { LoadingDots } from '../../../components/shared/LoadingDots';
import type { Topic } from '../../../types/goal';

/**
 * 主題卡片數據介面
 */
export interface TopicCardData {
  topic: Topic;
  subjectStyle: any;
  totalGoals: number;
  completedGoals: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  needHelpCount: number;
  collaborators: any[];
  overallProgress: number;
}

/**
 * 主題卡片組件
 */
interface TopicCardProps {
  data: TopicCardData;
  onClick: (topicId: string) => void;
  isLoading?: boolean;
}

export const TopicCard: React.FC<TopicCardProps> = ({ data, onClick, isLoading }) => {
  const { topic, subjectStyle, totalGoals, completedGoals, totalTasks, completedTasks, inProgressTasks, needHelpCount, collaborators, overallProgress } = data;

  // 根據目標狀態決定圖標
  const getStatusIcon = () => {
    if (overallProgress === 100) return CheckCircle2;
    if (inProgressTasks > 0) return Play;
    if (totalTasks === 0) return Target;
    return Clock;
  };

  const StatusIcon = getStatusIcon();

  return (
    <motion.div
      className="group cursor-pointer relative"
      onClick={() => onClick(topic.id)}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 1
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <LoadingDots />
        </div>
      )}
      <div 
        className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border-2 p-6 h-[320px] flex flex-col transition-all duration-300 hover:shadow-2xl ${
          isLoading ? 'opacity-90' : ''
        }`}
        style={{ 
          borderColor: subjectStyle.accent + '40',
          boxShadow: `0 10px 30px ${subjectStyle.accent}15, 0 0 0 1px ${subjectStyle.accent}20`
        }}
      >
        {/* 頂部標題區 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div 
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: subjectStyle.accent + '20',
                    color: subjectStyle.accent
                  }}
                >
                  {topic.subject || '未分類'}
                </div>
                {topic.is_collaborative && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                    <Users className="w-3 h-3" />
                    協作
                  </div>
                )}
                {/* 協作者頭像移到這裡 */}
                {topic.is_collaborative && collaborators.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2">
                      {collaborators.slice(0, 3).map((collaborator, index) => (
                        <div
                          key={collaborator.id}
                          className="w-5 h-5 rounded-full border-2 border-white bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ zIndex: 10 - index }}
                        >
                          {collaborator.name?.charAt(0) || '?'}
                        </div>
                      ))}
                      {collaborators.length > 3 && (
                        <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold">
                          +{collaborators.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 line-clamp-2 leading-tight">
              {topic.title}
            </h3>
          </div>
          <div className="flex-shrink-0 ml-3">
            <StatusIcon 
              className="w-6 h-6" 
              style={{ color: subjectStyle.accent }}
            />
          </div>
        </div>

        {/* 中央進度環 */}
        <div className="flex-1 flex items-center justify-center my-3">
          <div className="relative">
            {/* 外圈 */}
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={subjectStyle.accent + '20'}
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={subjectStyle.accent}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${overallProgress * 2.51} 251.2`}
                style={{
                  transition: 'stroke-dasharray 0.5s ease-in-out'
                }}
              />
            </svg>
            {/* 中央百分比 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-800">
                {Math.round(overallProgress)}%
              </span>
            </div>
          </div>
        </div>

        {/* 底部統計資訊 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Flag className="w-4 h-4" />
              <span>{completedGoals}/{totalGoals} 目標</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Target className="w-4 h-4" />
              <span>{completedTasks}/{totalTasks} 任務</span>
            </div>
          </div>

          {/* 進行中任務和需要幫助 */}
          <div className="flex items-center justify-between">
            {inProgressTasks > 0 && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: subjectStyle.accent + '20',
                  color: subjectStyle.accent
                }}
              >
                <Play className="w-3 h-3" />
                {inProgressTasks} 進行中
              </div>
            )}
            
            {needHelpCount > 0 && (
              <motion.div 
                className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚠️ {needHelpCount} 需要幫助
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 建立新主題卡片組件
 */
interface CreateTopicCardProps {
  onClick: () => void;
  isLoading?: boolean;
}

export const CreateTopicCard: React.FC<CreateTopicCardProps> = ({ onClick, isLoading }) => {
  return (
    <motion.div
      className="group cursor-pointer relative"
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 1
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <LoadingDots />
        </div>
      )}
      <div 
        className={`bg-gradient-to-br from-emerald-50 to-teal-50 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-dashed border-emerald-300 p-6 h-[320px] flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:border-emerald-400 ${
          isLoading ? 'opacity-90' : ''
        }`}
        style={{ 
          boxShadow: `0 10px 30px rgba(16, 185, 129, 0.1), 0 0 0 1px rgba(16, 185, 129, 0.1)`
        }}
      >
        {/* 圖標 */}
        <motion.div
          className="w-24 h-24 mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Plus className="w-12 h-12 text-emerald-600" />
        </motion.div>

        {/* 標題 */}
        <h3 className="text-2xl font-bold text-emerald-800 mb-2 text-center">
          建立新主題
        </h3>

        {/* 描述 */}
        <p className="text-emerald-600 text-center mb-4 leading-relaxed">
          從模板或空白主題開始<br />
          你的新學習之旅
        </p>

        {/* 裝飾性圖標 */}
        <div className="flex items-center gap-3 text-emerald-400">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ✨
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            🚀
          </motion.div>
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            💡
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 主題網格組件
 */
interface TopicGridProps {
  topics: TopicCardData[];
  onTopicClick: (topicId: string) => void;
  onCreateTopicClick: () => void;
  isLoading?: boolean;
  isViewModeChanging?: boolean;
  loadingTopicId: string | null;
}

export const TopicGrid: React.FC<TopicGridProps> = ({ 
  topics, 
  onTopicClick, 
  onCreateTopicClick, 
  isLoading, 
  isViewModeChanging, 
  loadingTopicId 
}) => {
  if (isLoading || isViewModeChanging) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingDots 
          colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57']}
          size={8}
          minLoadingTime={500}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {topics.map((topicData, index) => (
        <motion.div
          key={topicData.topic.id}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.2, 
            delay: index * 0.05,
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
        >
          <TopicCard 
            data={topicData} 
            onClick={onTopicClick}
            isLoading={topicData.topic.id === loadingTopicId}
          />
        </motion.div>
      ))}
      
      {/* 建立新主題卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.2, 
          delay: topics.length * 0.05,
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
      >
        <CreateTopicCard 
          onClick={onCreateTopicClick}
          isLoading={false}
        />
      </motion.div>
    </div>
  );
}; 