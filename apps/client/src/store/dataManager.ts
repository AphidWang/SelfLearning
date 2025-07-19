/**
 * Data Manager
 * 
 * 統一管理跨 store 的數據操作
 * 將原本在單一 store 中操作多個 store 的邏輯移到這裡
 */

import { supabase } from '../services/supabase';
import { useTopicStore } from './topicStore';
import { useGoalStore } from './goalStore';
import { useTaskStore } from './taskStore';
import * as storeUtils from './storeUtils';

/**
 * 獲取用戶的所有主題及其結構數據
 * 解構巢狀結構，分別存入各個 store
 */
export async function fetchTopicsWithActions(): Promise<any[]> {
  // 設置 loading 狀態
  useTopicStore.getState().loading = true;
  useTopicStore.getState().error = null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      useTopicStore.setState({ loading: false, topics: [], error: null });
      return [];
    }

    const { data, error } = await supabase.rpc('get_user_topics_with_structure', {
      p_user_id: user.id
    });
    
    if (error) {
      useTopicStore.setState({ loading: false, error: error.message });
      return [];
    }

    // 解構巢狀結構，分別存入各個 store
    const allTopics: any[] = [];
    const allGoals: any[] = [];
    const allTasks: any[] = [];

    (data || []).forEach((topicData: any) => {
      // 提取 Topic 數據
      const { goals, ...topicOnly } = topicData;
      const goalIds: string[] = [];

      // 提取 Goals 和 Tasks 數據
      if (Array.isArray(goals)) {
        goals.forEach((goalData: any) => {
          const { tasks, ...goalOnly } = goalData;
          goalIds.push(goalOnly.id);
          
          const taskIds: string[] = [];
          
          // 提取 Tasks 數據
          if (Array.isArray(tasks)) {
            tasks.forEach((taskData: any) => {
              taskIds.push(taskData.id);
              allTasks.push(taskData);
            });
          }
          
          // Goal 只存 taskIds，不存完整 tasks
          allGoals.push({ ...goalOnly, taskIds });
        });
      }

      // Topic 只存 goalIds，不存完整 goals
      allTopics.push({ 
        ...topicOnly, 
        goalIds
      });
    });


    // 處理用戶資料
    const userStore = await import('./userStore');
    const allUsers = userStore.useUserStore.getState().users || [];
    const { getCompletionRate } = await import('./progressQueries');
    
    // 分別更新各個 store
    useGoalStore.getState().setGoals(storeUtils.attachUserProfilesToGoals(allUsers, allGoals));
    useTaskStore.getState().setTasks(storeUtils.attachUserProfilesToTasks(allUsers, allTasks));

    const topicsWithRate = allTopics.map((topic: any) => {
      const patched = storeUtils.attachUserProfilesToTopic(allUsers, topic);
      return { ...patched, completionRate: getCompletionRate(patched) };
    });

    // 更新 topicStore
    useTopicStore.setState({ topics: topicsWithRate, loading: false });
    return topicsWithRate;
    
  } catch (error: any) {
    useTopicStore.setState({ loading: false, error: error.message || '獲取主題失敗' });
    return [];
  }
}

/**
 * 重新載入特定 Topic 的完整數據
 */
export async function refreshTopicData(topicId: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('get_topics_full_structure', {
      topic_ids: [topicId]
    });
    
    if (error) throw error;
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    const topicData = data[0];
    
    // 解構並更新各個 store
    const { goals, ...topicOnly } = topicData;
    const goalIds: string[] = [];
    const goalsToUpdate: any[] = [];
    const tasksToUpdate: any[] = [];

    if (Array.isArray(goals)) {
      goals.forEach((goalData: any) => {
        const { tasks, ...goalOnly } = goalData;
        goalIds.push(goalOnly.id);
        
        const taskIds: string[] = [];
        
        if (Array.isArray(tasks)) {
          tasks.forEach((taskData: any) => {
            taskIds.push(taskData.id);
            tasksToUpdate.push(taskData);
          });
        }
        
        goalsToUpdate.push({ ...goalOnly, taskIds });
      });
    }

    // 更新各個 store
    useGoalStore.getState().setGoals(goalsToUpdate);
    useTaskStore.getState().setTasks(tasksToUpdate);
    
    // 更新 topic（處理用戶資料）
    const userStore = await import('./userStore');
    const allUsers = userStore.useUserStore.getState().users || [];
    const { getCompletionRate } = await import('./progressQueries');
    
    const updatedTopic = { ...topicOnly, goalIds };
    const patched = storeUtils.attachUserProfilesToTopic(allUsers, updatedTopic);  
    const topicWithRate = { ...patched, completionRate: getCompletionRate(patched) };
    
    // 更新 topicStore 中的特定 topic
    useTopicStore.setState(state => ({
      topics: state.topics.map(t => t.id === topicId ? topicWithRate : t)
    }));

    return topicWithRate;
    
  } catch (error: any) {
    console.error('重新載入主題數據失敗:', error);
    useTopicStore.setState({ error: error.message || '重新載入主題失敗' });
  }
}

/**
 * 清空所有 store 的數據
 */
export function clearAllStoreData(): void {
  useGoalStore.getState().clearGoals();
  useTaskStore.getState().clearTasks();
} 