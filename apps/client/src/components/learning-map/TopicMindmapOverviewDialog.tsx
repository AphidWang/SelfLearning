import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTopicStore } from '../../store/topicStore';
import { Topic } from '../../types/goal';
import { subjectColors } from '../../styles/tokens';
import { TopicRadialMap, useTopicRadialMapStats } from '../topic-review/TopicRadialMap';
import { 
  X, Brain, TrendingUp, Calendar, CheckCircle2
} from 'lucide-react';

interface TopicMindmapOverviewDialogProps {
  open: boolean;
  onClose: () => void;
  topicId: string;
}

export const TopicMindmapOverviewDialog: React.FC<TopicMindmapOverviewDialogProps> = ({
  open,
  onClose,
  topicId
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const { getTopic } = useTopicStore();
  const [topic, setTopic] = useState<Topic | null>(null);
  
  useEffect(() => {
    const fetchTopic = async () => {
      const fetchedTopic = await getTopic(topicId);
      setTopic(fetchedTopic);
    };
    fetchTopic();
  }, [topicId, getTopic]);
  
  const weeklyStats = useTopicRadialMapStats(topicId);
  
  if (!topic || !open) {
    return null;
  }

  const subjectColor = subjectColors[topic.subject || '未分類'];
  const progress = topic.completionRate ?? 0;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
        style={{ 
          borderColor: subjectColor,
          boxShadow: `0 20px 40px ${subjectColor}25`
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* 標題列 */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Brain className="w-6 h-6" style={{ color: subjectColor }} />
              {topic.title} - 學習地圖
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          {/* 頂部狀態列 */}
          <div className="flex-shrink-0 border-b border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"></div>
                  <span className="text-gray-600">本週新完成: {weeklyStats.newlyCompleted}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                  <span className="text-gray-600">進行中: {weeklyStats.inProgressTasks}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">總進度: {Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 心智圖主體 */}
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 min-h-0">
            <TopicRadialMap
              topicId={topicId}
              selectedGoalId={selectedGoalId}
              selectedTaskId={selectedTaskId}
              onGoalClick={setSelectedGoalId}
              onTaskClick={(taskId, goalId) => {
                setSelectedTaskId(taskId);
                setSelectedGoalId(goalId);
              }}
              className="w-full h-full"
              width={1000}
              height={600}
            />
          </div>

          {/* 底部操作區 */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex justify-center items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>總共 {weeklyStats.totalTasks} 個任務</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>已完成 {weeklyStats.completedTasks} 個</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 兼容性導出
export const GoalMindmapOverviewDialog = TopicMindmapOverviewDialog;
export type { TopicMindmapOverviewDialogProps, TopicMindmapOverviewDialogProps as GoalMindmapOverviewDialogProps }; 