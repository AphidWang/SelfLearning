import { useMemo } from 'react';
import { useTopicRadialMapStats } from '../TopicRadialMap';
import { useTopicStore } from '../../../store/topicStore';
import type { Topic } from '../../../types/goal';

export const useTopicStats = (topicId: string, topic: Topic | null) => {
  const { getActiveGoals } = useTopicStore();
  const weeklyStats = useTopicRadialMapStats(topicId);

  // 計算需要幫助的項目數量
  const needHelpCount = useMemo(() => {
    if (!topic) return 0;
    let count = 0;
    
    topic.goals?.forEach(goal => {
      goal.tasks?.forEach(task => {
        if (task.need_help) {
          count++;
        }
      });
    });
    
    return count;
  }, [topic]);

  // 記憶化 goals 以避免不必要的重新渲染
  const memoizedGoals = useMemo(() => {
    if (!topic?.goals) return [];
    return topic.goals;
  }, [topic?.goals]);

  const totalGoals = topic?.goals?.length || 0;
  const completedGoals = useMemo(() => {
    if (!topic?.goals) return 0;
    return topic.goals.filter(goal => {
      const totalTasks = goal.tasks?.length || 0;
      const completedTasks = goal.tasks?.filter(task => task.status === 'done').length || 0;
      return totalTasks > 0 && completedTasks === totalTasks;
    }).length;
  }, [topic?.goals]);

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