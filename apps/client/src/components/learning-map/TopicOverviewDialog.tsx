import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTopicStore } from '../../store/topicStore';
import { subjects } from '../../styles/tokens';
import { Topic } from '../../types/goal';
import { CircularProgress } from './CircularProgress';
import { 
  X, Target, Calendar, CheckCircle2, Clock, 
  Play, Flag, TrendingUp, BookOpen, ArrowRight
} from 'lucide-react';
import { refreshTopicData } from '../../store/dataManager';

interface TopicOverviewDialogProps {
  topicId: string;
  onClose: () => void;
  onTopicClick?: (topicId: string) => void;
}

// 檢查日期是否在本週
const isThisWeek = (date: string | undefined): boolean => {
  if (!date) return false;
  
  const completedDate = new Date(date);
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return completedDate >= oneWeekAgo && completedDate <= now;
};

// 獲取任務狀態樣式
const getTaskStatusStyle = (status: string, isNewlyCompleted: boolean) => {
  if (isNewlyCompleted) {
    return {
      bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
      border: 'border-green-400',
      text: 'text-green-800',
      icon: 'text-green-600',
      glow: 'shadow-green-200'
    };
  }
  
  switch (status) {
    case 'done':
      return {
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-700',
        icon: 'text-gray-500',
        glow: ''
      };
    case 'in_progress':
      return {
        bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
        border: 'border-blue-300',
        text: 'text-blue-800',
        icon: 'text-blue-600',
        glow: 'shadow-blue-200'
      };
    case 'todo':
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-600',
        icon: 'text-gray-400',
        glow: ''
      };
    default:
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-600',
        glow: ''
      };
  }
};

export const TopicOverviewDialog: React.FC<TopicOverviewDialogProps> = ({
  topicId,
  onClose,
  onTopicClick
}) => {
  const { getActiveGoals } = useTopicStore();
  const [topic, setTopic] = useState<Topic | null>(null);

  useEffect(() => {
    const fetchTopic = async () => {
      const fetchedTopic = await refreshTopicData(topicId);
      setTopic(fetchedTopic);
    };
    fetchTopic();
  }, [topicId]);

  if (!topic) {
    return null;
  }

  const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
  const progress = topic.completionRate;
  const goals = getActiveGoals(topic.id);
  
  // 計算週進度統計
  const weeklyStats = useMemo(() => {
    let newlyCompleted = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    
    goals.forEach(goal => {
      (goal.tasks ?? []).forEach(task => {
        totalTasks++;
        if (task.status === 'done') {
          completedTasks++;
          if (isThisWeek(task.completed_at)) {
            newlyCompleted++;
          }
        } else if (task.status === 'in_progress') {
          inProgressTasks++;
        }
      });
    });
    
    return { newlyCompleted, totalTasks, completedTasks, inProgressTasks };
  }, [goals]);

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 w-full max-w-7xl h-[90vh] flex overflow-hidden"
        style={{ 
          borderColor: subjectStyle.accent,
          boxShadow: `0 20px 40px ${subjectStyle.accent}25`
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* 左側 - 主題資訊 */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col">
          {/* 標題列 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">主題概覽</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 主題基本信息 */}
          <div 
            className="rounded-xl p-4 mb-6 border-2"
            style={{ 
              borderColor: subjectStyle.accent,
              background: `linear-gradient(135deg, ${subjectStyle.accent}08 0%, ${subjectStyle.accent}15 100%)`
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5" style={{ color: subjectStyle.accent }} />
              <span 
                className="text-xs px-2 py-1 rounded-md font-medium"
                style={{ backgroundColor: subjectStyle.accent + '20', color: subjectStyle.accent }}
              >
                {topic.subject || '未分類'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              {topic.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {topic.description}
            </p>
          </div>

          {/* 週進度統計 */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">本週進度</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{weeklyStats.newlyCompleted}</div>
                <div className="text-xs text-gray-500">新完成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{weeklyStats.inProgressTasks}</div>
                <div className="text-xs text-gray-500">進行中</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">總進度</span>
                <span className="font-semibold">{weeklyStats.completedTasks}/{weeklyStats.totalTasks}</span>
              </div>
            </div>
          </div>

          {/* 進度圓圈 */}
          <div className="text-center mt-6">
            <CircularProgress 
              value={progress ?? 0} 
              size={80} 
              strokeWidth={6}
              color={subjectStyle.accent}
            />
            <div className="text-xs text-gray-500 mt-2">總完成度</div>
          </div>
        </div>

        {/* 右側 - 目標和任務視覺化 */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">學習路徑</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"></div>
                <span className="text-gray-600">本週新完成</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                <span className="text-gray-600">進行中</span>
              </div>
            </div>
          </div>

          {/* 目標時間軸 */}
          <div className="space-y-8">
            {goals.map((goal, goalIndex) => {
              const goalCompletedTasks = (goal.tasks ?? []).filter(t => t.status === 'done').length;
              const goalProgress = (goal.tasks ?? []).length > 0 ? (goalCompletedTasks / (goal.tasks ?? []).length) * 100 : 0;
              
              return (
                <div key={goal.id} className="relative">
                  {/* 目標連接線 */}
                  {goalIndex < goals.length - 1 && (
                    <div 
                      className="absolute left-6 top-16 w-0.5 h-8 bg-gradient-to-b from-gray-300 to-transparent"
                    />
                  )}

                  <div className="flex gap-4">
                    {/* 目標指示器 */}
                    <div className="relative flex-shrink-0">
                      <div 
                        className="w-12 h-12 rounded-full border-4 flex items-center justify-center"
                        style={{ 
                          borderColor: goalProgress === 100 ? subjectStyle.accent : `${subjectStyle.accent}40`,
                          backgroundColor: goalProgress === 100 ? `${subjectStyle.accent}20` : 'white'
                        }}
                      >
                        {goalProgress === 100 ? (
                          <CheckCircle2 className="w-6 h-6" style={{ color: subjectStyle.accent }} />
                        ) : (
                          <Flag className="w-5 h-5" style={{ color: subjectStyle.accent }} />
                        )}
                      </div>
                      <div className="absolute -bottom-2 -left-2 -right-2 text-center">
                        <div className="text-xs font-medium text-gray-600">
                          {Math.round(goalProgress)}%
                        </div>
                      </div>
                    </div>

                    {/* 目標內容 */}
                    <div className="flex-1">
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                            {goal.title}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {goalCompletedTasks}/{(goal.tasks ?? []).length} 完成
                          </span>
                        </div>

                        {/* 任務列表 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(goal.tasks ?? []).map(task => {
                            const isNewlyCompleted = task.status === 'done' && isThisWeek(task.completed_at);
                            const statusStyle = getTaskStatusStyle(task.status, isNewlyCompleted);
                            
                            return (
                              <motion.div
                                key={task.id}
                                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${statusStyle.bg} ${statusStyle.border} ${statusStyle.glow}`}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {task.status === 'done' ? (
                                      <CheckCircle2 className={`w-4 h-4 ${statusStyle.icon}`} />
                                    ) : task.status === 'in_progress' ? (
                                      <Play className={`w-4 h-4 ${statusStyle.icon}`} />
                                    ) : (
                                      <Clock className={`w-4 h-4 ${statusStyle.icon}`} />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium ${statusStyle.text} line-clamp-2`}>
                                      {task.title}
                                    </div>
                                    {isNewlyCompleted && (
                                      <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        本週完成
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部操作區 */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-center">
              {onTopicClick && (
                <button
                  onClick={() => onTopicClick(topicId)}
                  className="px-6 py-3 bg-gradient-to-r text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                  style={{ 
                    background: `linear-gradient(135deg, ${subjectStyle.accent} 0%, ${subjectStyle.accent}dd 100%)`
                  }}
                >
                  <span>進入主題詳情</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 兼容性導出
export const GoalOverviewDialog = TopicOverviewDialog;
export type { TopicOverviewDialogProps, TopicOverviewDialogProps as GoalOverviewDialogProps }; 