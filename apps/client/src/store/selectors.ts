/**
 * Zustand Selectors - 響應式資料選擇器
 * 
 * 提供高效的響應式查詢，自動監測相關數據變化
 * 用於取代原本的 topic.goals 和 goal.tasks 訪問方式
 */

import { useTopicStore } from './topicStore';
import { useGoalStore } from './goalStore';
import { useTaskStore } from './taskStore';
import type { Topic, Goal, Task } from '../types/goal';

import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';

/**
 * 選擇器工廠函數，創建高效的資料選擇器
 */

/**
 * 獲取 Topic 的 Goals（響應式）
 */
export const useGoalsForTopic = (topicId: string) => {
  return useGoalStore(state => 
    Object.values(state.goals).filter(goal => goal.topic_id === topicId)
  );
};

/**
 * 獲取 Topic 的活躍 Goals（響應式）
 */
export const useActiveGoalsForTopic = (topicId: string) => {
  return useGoalStore(state => 
    Object.values(state.goals)
      .filter(goal => goal.topic_id === topicId && goal.status !== 'archived')
  );
};

/**
 * 獲取 Topic 的焦點 Goals（響應式）
 */
export const useFocusedGoalsForTopic = (topicId: string) => {
  return useGoalStore(state => 
    Object.values(state.goals)
      .filter(goal => goal.topic_id === topicId && goal.status === 'focus')
  );
};

/**
 * 獲取 Goal 的 Tasks（響應式）
 */
export const useTasksForGoal = (goalId: string) => {
  return useTaskStore(state => 
    Object.values(state.tasks).filter(task => task.goal_id === goalId)
  );
};

/**
 * 獲取 Goal 的活躍 Tasks（響應式）
 */
export const useActiveTasksForGoal = (goalId: string) => {
  return useTaskStore(state => 
    Object.values(state.tasks)
      .filter(task => task.goal_id === goalId && task.status !== 'archived')
  );
};

/**
 * 獲取 Topic 的所有 Tasks（響應式，跨 Goals）
 */
export const useAllTasksForTopic = (topicId: string) => {
  const goals = useGoalsForTopic(topicId);
  return useTaskStore(state => {
    const goalIds = goals.map(g => g.id);
    return Object.values(state.tasks)
      .filter(task => goalIds.includes(task.goal_id));
  });
};

/**
 * 獲取 Topic 的活躍 Tasks（響應式）
 */
export const useActiveTasksForTopic = (topicId: string) => {
  const goals = useActiveGoalsForTopic(topicId);
  return useTaskStore(state => {
    const goalIds = goals.map(g => g.id);
    return Object.values(state.tasks)
      .filter(task => goalIds.includes(task.goal_id) && task.status !== 'archived');
  });
};

/**
 * 獲取單個 Goal（響應式）
 */
export const useGoalById = (goalId: string) => {
  return useGoalStore(state => state.goals[goalId]);
};

/**
 * 獲取單個 Task（響應式）
 */
export const useTaskById = (taskId: string) => {
  return useTaskStore(state => state.tasks[taskId]);
};

/**
 * 監控特定的 Task IDs 列表（響應式）
 * 當任何一個 task 更新時，會自動重新計算
 */
export const useTasksByIds = (taskIds: string[]) => {
  const allTasks = useTaskStore(state => state.tasks);
  return useMemo(() => 
    taskIds.map(id => allTasks[id]).filter(Boolean),
    [allTasks, taskIds]
  );
};
/**
 * 獲取 Topic 統計資料（響應式）
 */
export const useTopicStats = (topicId: string) => {
  const goals = useGoalsForTopic(topicId);
  const tasks = useAllTasksForTopic(topicId);
  
  return {
    totalGoals: goals.length,
    activeGoals: goals.filter(g => g.status !== 'archived').length,
    focusGoals: goals.filter(g => g.status === 'focus').length,
    totalTasks: tasks.length,
    activeTasks: tasks.filter(t => t.status !== 'archived').length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    todoTasks: tasks.filter(t => t.status === 'todo').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    completionRate: tasks.length > 0 ? 
      (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0
  };
};

/**
 * 獲取 Goal 統計資料（響應式）
 */
export const useGoalStats = (goalId: string) => {
  const tasks = useTasksForGoal(goalId);
  
  return {
    totalTasks: tasks.length,
    activeTasks: tasks.filter(t => t.status !== 'archived').length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    todoTasks: tasks.filter(t => t.status === 'todo').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    completionRate: tasks.length > 0 ? 
      (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0
  };
};

/**
 * 創建 Goals 到 Tasks 的映射表（響應式）
 */
export const useGoalTasksMap = (topicId: string) => {
  const goals = useActiveGoalsForTopic(topicId);
  const allTasks = useTaskStore(state => state.tasks);
  
  const tasksMap = new Map<string, Task[]>();
  
  goals.forEach(goal => {
    const goalTasks = Object.values(allTasks)
      .filter(task => task.goal_id === goal.id && task.status !== 'archived');
    tasksMap.set(goal.id, goalTasks);
  });
  
  return tasksMap;
};

/**
 * 搜尋功能（響應式）
 */
export const useSearchTasks = (query: string) => {
  return useTaskStore(state => {
    if (!query.trim()) return [];
    
    const lowercaseQuery = query.toLowerCase();
    return Object.values(state.tasks).filter(task =>
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description?.toLowerCase().includes(lowercaseQuery)
    );
  });
};

/**
 * TaskWallPage 專用的任務關注列表（響應式）
 * 包含所有活躍任務和已完成任務的 ID 列表
 */
export const useTaskWallTaskIds = () => {
  const topics = useTopicStore(state => state.topics);
  const goals = useGoalStore(state => state.goals);
  const tasks = useTaskStore(state => state.tasks);
  
  return useMemo(() => {
    const activeTaskIds: string[] = [];
    const completedTaskIds: string[] = [];
    
    if (topics && goals && tasks) {
      // 遍歷所有活躍主題
      topics.forEach(topic => {
        if (topic.status === 'archived') return;
        
        // 獲取主題的目標
        const topicGoals = Object.values(goals).filter(goal => 
          goal.topic_id === topic.id && goal.status !== 'archived'
        );
        
        // 獲取目標的任務
        topicGoals.forEach(goal => {
          const goalTasks = Object.values(tasks).filter(task => 
            task.goal_id === goal.id
          );
          
          goalTasks.forEach(task => {
            // 排除週挑戰任務（避免與 WeeklyQuickCard 重複）
            const isWeeklyChallenge = task.special_flags?.includes('WEEKLY_QUICK_CHALLENGE');
            if (isWeeklyChallenge) return;
            
            // 排除隱藏主題中的任務（如個人習慣主題）
            if (topic.status === 'hidden') return;
            
            if (task.status === 'done') {
              completedTaskIds.push(task.id);
            } else if (task.status === 'todo' || task.status === 'in_progress') {
              activeTaskIds.push(task.id);
            }
          });
        });
      });
    }
    
    return {
      activeTaskIds,
      completedTaskIds,
      allTaskIds: [...activeTaskIds, ...completedTaskIds]
    };
  }, [topics, goals, tasks]);
};

/**
 * 獲取需要幫助的項目（響應式）
 */
export const useItemsNeedingHelp = () => {
  const goals = useGoalStore(state => 
    Object.values(state.goals).filter(g => g.need_help)
  );
  
  const tasks = useTaskStore(state => 
    Object.values(state.tasks).filter(t => t.need_help)
  );
  
  return { goals, tasks };
};

/**
 * 用戶活躍概覽（響應式）
 */
export const useUserOverview = () => {
  const topics = useTopicStore(state => 
    state.topics.filter(t => t.status !== 'archived')
  );
  
  const goals = useGoalStore(state => 
    Object.values(state.goals).filter(g => g.status !== 'archived')
  );
  
  const tasks = useTaskStore(state => 
    Object.values(state.tasks).filter(t => t.status !== 'archived')
  );
  
  return {
    topics: topics.length,
    goals: goals.length,
    tasks: tasks.length,
    todoTasks: tasks.filter(t => t.status === 'todo').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    completedTasks: tasks.filter(t => t.status === 'done').length
  };
}; 