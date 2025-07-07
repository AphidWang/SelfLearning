import { useMemo } from 'react';
import type { TopicTemplate } from '../../../types/goal';

export const useTemplateStats = (templateId: string, template: TopicTemplate | null) => {
  // 模板不需要求助功能
  const needHelpCount = 0;

  // 記憶化 goals 以避免不必要的重新渲染
  const memoizedGoals = useMemo(() => {
    if (!template?.goals) return [];
    return template.goals;
  }, [template?.goals]);

  const totalGoals = template?.goals?.length || 0;
  const totalTasks = useMemo(() => {
    if (!template?.goals) return 0;
    return template.goals.reduce((sum, goal) => sum + (goal.tasks?.length || 0), 0);
  }, [template?.goals]);

  // 模板統計資訊
  const templateStats = useMemo(() => {
    return {
      totalGoals,
      totalTasks,
      needHelpCount,
      averageTasksPerGoal: totalGoals > 0 ? Math.round(totalTasks / totalGoals) : 0,
      subjectCount: template?.subject ? 1 : 0,
      categoryCount: template?.category ? 1 : 0,
      bubblesCount: template?.bubbles?.length || 0,
      usageCount: template?.usage_count || 0,
      copyCount: template?.copy_count || 0,
    };
  }, [totalGoals, totalTasks, needHelpCount, template]);

  return {
    needHelpCount,
    memoizedGoals,
    totalGoals,
    totalTasks,
    templateStats,
    progress: {
      goals: totalGoals,
      tasks: totalTasks,
      completion: 0 // 模板沒有完成度概念
    }
  };
}; 