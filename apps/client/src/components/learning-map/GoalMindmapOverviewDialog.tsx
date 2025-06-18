import React from 'react';
import { motion } from 'framer-motion';
import { useGoalStore } from '../../store/goalStore';
import { subjectColors } from '../../styles/tokens';
import { GoalRadialMap, useGoalRadialMapStats } from './GoalRadialMap';
import { 
  X, Brain, TrendingUp, Calendar, CheckCircle2, ArrowRight
} from 'lucide-react';

interface GoalMindmapOverviewDialogProps {
  goalId: string;
  onClose: () => void;
  onGoalClick?: (goalId: string) => void;
}

export const GoalMindmapOverviewDialog: React.FC<GoalMindmapOverviewDialogProps> = ({
  goalId,
  onClose,
  onGoalClick
}) => {
  const { getGoal, getCompletionRate } = useGoalStore();
  const goal = getGoal(goalId);
  const weeklyStats = useGoalRadialMapStats(goalId);
  
  if (!goal) {
    return null;
  }

  const subjectColor = subjectColors[goal.subject || '未分類'];
  const progress = getCompletionRate(goal.id);

  const handleTaskClick = (taskId: string, stepId: string) => {
    console.log('Task clicked:', taskId, 'in step:', stepId);
    // 可以在這裡添加任務詳情邏輯
  };

  const handleStepClick = (stepId: string) => {
    console.log('Step clicked:', stepId);
    // 可以在這裡添加步驟詳情邏輯
  };

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
        {/* 頂部狀態列 */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Brain className="w-6 h-6" style={{ color: subjectColor }} />
                目標心智圖
              </h2>
              
              {/* 週進度統計 */}
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
            
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 心智圖主體 */}
        <div className="flex-1 overflow-auto">
          <GoalRadialMap
            goalId={goalId}
            width={1000}
            height={700}
            showAnimations={true}
            onTaskClick={handleTaskClick}
            onStepClick={handleStepClick}
            className="w-full h-full min-h-[600px]"
          />
        </div>

        {/* 底部操作區 */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>總共 {weeklyStats.totalTasks} 個任務</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>已完成 {weeklyStats.completedTasks} 個</span>
              </div>
            </div>

            {onGoalClick && (
              <button
                onClick={() => onGoalClick(goalId)}
                className="px-6 py-2 bg-gradient-to-r text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                style={{ 
                  background: `linear-gradient(135deg, ${subjectColor} 0%, ${subjectColor}dd 100%)`
                }}
              >
                <span>進入目標詳情</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 導出類型以供其他組件使用
export type { GoalMindmapOverviewDialogProps }; 