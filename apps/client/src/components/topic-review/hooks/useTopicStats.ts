import { useMemo } from 'react';
import { useTopicRadialMapStats } from '../TopicRadialMap';
import { useTopicStore } from '../../../store/topicStore';
import { getGoalsForTopic, getTasksForGoal } from '../../../store/helpers';
import type { Topic } from '../../../types/goal';

export const useTopicStats = (topicId: string, topic: Topic | null) => {
  const { getActiveGoals } = useTopicStore();
  const weeklyStats = useTopicRadialMapStats(topicId);

  // 計算需要幫助的項目數量
  const needHelpCount = useMemo(() => {
    if (!topic) return 0;
    let count = 0;
    
    // 使用重構後的架構：從 goalStore 和 taskStore 獲取數據
    const goals = getGoalsForTopic(topic.id);
    goals.forEach(goal => {
      const tasks = getTasksForGoal(goal.id);
      tasks.forEach(task => {
        if (task.need_help) {
          count++;
        }
      });
    });
    
    return count;
  }, [topic]);

  // 記憶化 goals 以避免不必要的重新渲染
  const memoizedGoals = useMemo(() => {
    if (!topic) return [];
    return getGoalsForTopic(topic.id);
  }, [topic]);

  const totalGoals = memoizedGoals.length;
  const completedGoals = useMemo(() => {
    if (!topic) return 0;
    const goals = getGoalsForTopic(topic.id);
    return goals.filter(goal => {
      const tasks = getTasksForGoal(goal.id);
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'done').length;
      return totalTasks > 0 && completedTasks === totalTasks;
    }).length;
  }, [topic]);

  return {
    weeklyStats,
    needHelpCount,
    memoizedGoals,
    totalGoals,
    completedGoals,
    progress: {
      completed: completedGoals,
      total: totalGoals,
      percentage: totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100)
    }
  };
}; 