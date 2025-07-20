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
import { Topic } from '../types/goal';

/**
 * 處理主題數據的通用函數
 * 解構巢狀結構並更新各個 store
 */
async function processTopicData(topicDataArray: any[], updateMode: 'full' | 'partial' = 'full') {
  const allTopics: any[] = [];
  const allGoals: any[] = [];
  const allTasks: any[] = [];

  topicDataArray.forEach((topicData: any) => {
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

  // 確保用戶資料已載入
  const userStore = await import('./userStore');
  const userStoreInstance = userStore.useUserStore.getState();
  
  // 如果用戶列表為空，嘗試載入協作者候選人
  let allUsers = userStoreInstance.users || [];
  if (allUsers.length === 0) {
    try {
      await userStoreInstance.getCollaboratorCandidates();
      allUsers = userStore.useUserStore.getState().users || [];
    } catch (error) {
      console.warn('無法載入用戶資料，將使用空列表:', error);
    }
  }
  
  const { getCompletionRate } = await import('./progressQueries');
  
  // 分別更新各個 store
  useGoalStore.getState().setGoals(storeUtils.attachUserProfilesToGoals(allUsers, allGoals));
  useTaskStore.getState().setTasks(storeUtils.attachUserProfilesToTasks(allUsers, allTasks));

  const topicsWithRate = allTopics.map((topic: any) => {
    console.log('🔍 dataManager - before attachUserProfilesToTopic:', {
      topicId: topic.id,
      topicTitle: topic.title,
      topic_collaborators: topic.topic_collaborators,
      topic_collaboratorsLength: topic.topic_collaborators?.length,
      allUsersLength: allUsers.length
    });
    
    const patched = storeUtils.attachUserProfilesToTopic(allUsers, topic);
    
    console.log('🔍 dataManager - after attachUserProfilesToTopic:', {
      topicId: topic.id,
      collaborators: patched.collaborators,
      collaboratorsLength: patched.collaborators?.length,
      firstCollaborator: patched.collaborators?.[0]
    });
    
    return { ...patched, completionRate: getCompletionRate(patched) };
  });

  return { topicsWithRate, allGoals, allTasks };
}

/**
 * 獲取用戶的所有主題及其結構數據
 * 解構巢狀結構，分別存入各個 store
 */
export async function fetchTopicsWithActions(): Promise<Topic[]> {
  // 設置 loading 狀態
  useTopicStore.getState().loading = true;
  useTopicStore.getState().error = null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      useTopicStore.setState({ loading: false, topics: [], error: null });
      return [];
    }

    // 確保用戶資料已載入
    const userStore = await import('./userStore');
    const userStoreInstance = userStore.useUserStore.getState();
    if (userStoreInstance.users.length === 0) {
      await userStoreInstance.getCollaboratorCandidates();
    }

    const { data, error } = await supabase.rpc('get_user_topics_with_structure', {
      p_user_id: user.id
    });
    
    if (error) {
      useTopicStore.setState({ loading: false, error: error.message });
      return [];
    }

    // 使用通用處理函數
    const { topicsWithRate } = await processTopicData(data || []);

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
export async function refreshTopicData(topicId: string): Promise<Topic | null> {
  try {
    // 確保用戶資料已載入
    const userStore = await import('./userStore');
    const userStoreInstance = userStore.useUserStore.getState();
    if (userStoreInstance.users.length === 0) {
      await userStoreInstance.getCollaboratorCandidates();
    }

    const { data, error } = await supabase.rpc('get_topics_full_structure', {
      topic_ids: [topicId]
    });
    
    if (error) throw error;
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    
    // 使用通用處理函數
    const { topicsWithRate } = await processTopicData(data);
    const updatedTopic = topicsWithRate[0];
    
    // 更新 topicStore 中的特定 topic
    useTopicStore.setState(state => ({
      topics: state.topics.map(t => t.id === topicId ? updatedTopic : t)
    }));

    return updatedTopic;
    
  } catch (error: any) {
    console.error('重新載入主題數據失敗:', error);
    useTopicStore.setState({ error: error.message || '重新載入主題失敗' });
    return null;
  }
}

/**
 * 清空所有 store 的數據
 */
export function clearAllStoreData(): void {
  useGoalStore.getState().clearGoals();
  useTaskStore.getState().clearTasks();
} 