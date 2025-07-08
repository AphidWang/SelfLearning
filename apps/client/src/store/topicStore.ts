/**
 * Topic Store - 正規化表格結構 + 版本控制版本
 * 
 * 🏗️ 架構改動：
 * - 從 JSONB 結構改為正規化三層表格：topics -> goals -> tasks
 * - 每一層都有獨立的版本控制，使用樂觀鎖定避免並發衝突
 * - 保留現有 API 接口，確保 UI 組件不需要大幅修改
 * 
 * 🔄 版本控制策略：
 * - 更新時檢查版本號，版本不匹配就返回錯誤
 * - 使用 safe_update_* 函數進行樂觀鎖定
 * - 錯誤時提示用戶重新載入數據
 * 
 * 📊 性能優化：
 * - TaskWall 使用 get_active_tasks_for_user() 函數快速查詢
 * - 避免在前端進行大量 JSON 遍歷
 * - 支援精確的 JOIN 查詢
 */

import { create } from 'zustand';
import { 
  Topic, Goal, Task, Bubble, GoalStatus, TaskStatus, TaskPriority,
  CreateTopicFromTemplateParams, SafeUpdateResult, TopicWithStructure, ActiveTaskResult,
  ReferenceInfo, ReferenceAttachment, ReferenceLink, TaskType, TaskConfig, CycleConfig, 
  TaskProgressData, createDefaultTaskConfig, createDefaultCycleConfig, createDefaultProgressData
} from '../types/goal';
import type { TopicCollaborator, User } from '@self-learning/types';
import { supabase, authService } from '../services/supabase';
import { taskRecordStore } from './taskRecordStore';
import { getTodayInTimezone, getYesterdayInTimezone, getDaysDifferenceInTimezone } from '../config/timezone';

// 新增類型定義 - 使用統一的 MarkTaskResult
export type TaskActionResult = MarkTaskResult;

// 輔助函數：獲取用戶真實資料
const getUsersData = async (userIds: string[]): Promise<{[key: string]: User}> => {
  if (userIds.length === 0) return {};
  
  try {
    // 獲取 userStore 實例並載入用戶資料
    const { useUserStore } = await import('./userStore');
    const userStore = useUserStore.getState();
    
    // 確保用戶資料已載入
    if (userStore.users.length === 0) {
      await userStore.getCollaboratorCandidates();
    }
    
    // 從用戶列表中查找對應的用戶
    const userMap: {[key: string]: User} = {};
    userStore.users.forEach(user => {
      if (userIds.includes(user.id)) {
        userMap[user.id] = user;
      }
    });
    
    // 對於找不到的用戶，創建簡化版本
    userIds.forEach(id => {
      if (!userMap[id]) {
        userMap[id] = {
          id,
          name: `User-${id.slice(0, 8)}`,
          email: '',
          avatar: undefined,
          role: 'student',
          roles: ['student']
        };
      }
    });
    
    return userMap;
  } catch (error) {
    console.warn('獲取用戶資料失敗，使用簡化資訊:', error);
    
    // 如果出錯，返回簡化的用戶資料
    const fallbackUsers: {[key: string]: User} = {};
    userIds.forEach(id => {
      fallbackUsers[id] = {
        id,
        name: `User-${id.slice(0, 8)}`,
        email: '',
        avatar: undefined,
        role: 'student',
        roles: ['student']
      };
    });
    
    return fallbackUsers;
  }
};

// Result 型別定義
export type MarkTaskResult = 
  | { success: true; task: Task }
  | { success: false; message: string; requiresRecord?: boolean };

// 版本衝突錯誤類型
export class VersionConflictError extends Error {
  constructor(
    message: string,
    public currentVersion: number,
    public expectedVersion: number
  ) {
    super(message);
    this.name = 'VersionConflictError';
  }
}

interface TopicStore {
  // 狀態
  topics: Topic[];
  selectedTopicId: string | null;
  loading: boolean;
  error: string | null;
  syncing: boolean;

  // === 核心 CRUD 操作（使用新表格結構） ===
  
  // Topics 操作
  fetchTopics: () => Promise<void>;
  getTopic: (id: string) => Promise<Topic | null>;
  createTopic: (topic: Omit<Topic, 'id' | 'owner_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Topic | null>;
  updateTopic: (id: string, expectedVersion: number, updates: Partial<Topic>) => Promise<Topic | null>;
  deleteTopic: (id: string) => Promise<boolean>;
  
  // Goals 操作
  addGoal: (topicId: string, goal: Omit<Goal, 'id' | 'topic_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Goal | null>;
  updateGoal: (goalId: string, expectedVersion: number, updates: Partial<Goal>) => Promise<Goal | null>;
  deleteGoal: (goalId: string) => Promise<boolean>;
  
  // Tasks 操作
  addTask: (goalId: string, task: Omit<Task, 'id' | 'goal_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  updateTask: (taskId: string, expectedVersion: number, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;

  // === 還原功能 ===
  restoreTopic: (id: string) => Promise<boolean>;
  restoreGoal: (goalId: string) => Promise<boolean>;
  restoreTask: (taskId: string) => Promise<boolean>;

  // === 參考資訊操作 ===
  
  // Topic 參考資訊
  updateTopicReferenceInfo: (topicId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addTopicAttachment: (topicId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeTopicAttachment: (topicId: string, attachmentId: string) => Promise<boolean>;
  addTopicLink: (topicId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeTopicLink: (topicId: string, linkId: string) => Promise<boolean>;
  
  // Goal 參考資訊
  updateGoalReferenceInfo: (goalId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addGoalAttachment: (goalId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeGoalAttachment: (goalId: string, attachmentId: string) => Promise<boolean>;
  addGoalLink: (goalId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeGoalLink: (goalId: string, linkId: string) => Promise<boolean>;
  
  // Task 參考資訊
  updateTaskReferenceInfo: (taskId: string, referenceInfo: ReferenceInfo) => Promise<boolean>;
  addTaskAttachment: (taskId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => Promise<boolean>;
  removeTaskAttachment: (taskId: string, attachmentId: string) => Promise<boolean>;
  addTaskLink: (taskId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => Promise<boolean>;
  removeTaskLink: (taskId: string, linkId: string) => Promise<boolean>;

  // === 專門的狀態切換函數（推薦使用） ===
  markTaskCompleted: (taskId: string, expectedVersion: number, requireRecord?: boolean) => Promise<MarkTaskResult>;
  markTaskInProgress: (taskId: string, expectedVersion: number) => Promise<MarkTaskResult>;
  markTaskTodo: (taskId: string, expectedVersion: number) => Promise<MarkTaskResult>;

  // === 新的任務動作處理方法 ===
  performTaskAction: (taskId: string, actionType: 'check_in' | 'add_count' | 'add_amount' | 'reset', params?: any) => Promise<MarkTaskResult>;
  checkInTask: (taskId: string) => Promise<MarkTaskResult>;
  addTaskCount: (taskId: string, count: number) => Promise<MarkTaskResult>;
  addTaskAmount: (taskId: string, amount: number, unit?: string) => Promise<MarkTaskResult>;
  resetTaskProgress: (taskId: string) => Promise<MarkTaskResult>;
  cancelTodayCheckIn: (taskId: string) => Promise<MarkTaskResult>;

  // === 快速查詢函數（性能優化） ===
  getActiveTasksForUser: () => Promise<ActiveTaskResult[]>;
  getTopicWithStructure: (topicId: string) => Promise<TopicWithStructure | null>;

  // === 兼容性 API（保持舊接口） ===
  addTopic: (topic: Omit<Topic, 'id' | 'owner_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<Topic | null>;
  fetchMyTopics: () => Promise<void>;
  fetchCollaborativeTopics: () => Promise<void>;
  createTopicFromTemplate: (params: CreateTopicFromTemplateParams) => Promise<Topic | null>;
  
  // === 向後兼容的方法（自動處理版本控制） ===
  updateTopicCompat: (topicId: string, updates: Partial<Topic>) => Promise<Topic | null>;
  updateGoalCompat: (topicId: string, goalId: string, updates: Partial<Goal>) => Promise<Goal | null>;
  updateTaskCompat: (topicId: string, goalId: string, taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  markTaskCompletedCompat: (topicId: string, goalId: string, taskId: string, requireRecord?: boolean) => Promise<MarkTaskResult>;
  markTaskInProgressCompat: (topicId: string, goalId: string, taskId: string) => Promise<MarkTaskResult>;
  markTaskTodoCompat: (topicId: string, goalId: string, taskId: string) => Promise<MarkTaskResult>;
  
  // === 舊 API 兼容方法（重要的功能方法） ===
  updateTaskInfo: (topicId: string, goalId: string, taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  updateTaskHelp: (topicId: string, goalId: string, taskId: string, needHelp: boolean, helpMessage?: string) => Promise<boolean>;
  updateGoalHelp: (topicId: string, goalId: string, needHelp: boolean, helpMessage?: string) => Promise<boolean>;
  setTaskOwner: (topicId: string, goalId: string, taskId: string, userId: string) => Promise<Task | null>;
  addTaskCollaborator: (topicId: string, goalId: string, taskId: string, userId: string) => Promise<boolean>;
  removeTaskCollaborator: (topicId: string, goalId: string, taskId: string, userId: string) => Promise<boolean>;
  getActiveGoals: (topicId: string) => Goal[];
  getFocusedGoals: (topicId: string) => Goal[];
  getActiveTopics: () => Topic[];
  reorderTasks: (topicId: string, goalId: string, taskIds: string[]) => Promise<boolean>;
  
  // 協作功能（兼容舊 API）
  addCollaborator: (topicId: string, userId: string, permission: 'view' | 'edit') => Promise<boolean>;
  removeCollaborator: (topicId: string, userId: string) => Promise<boolean>;
  getCollaborators: (topicId: string) => Promise<User[]>;
  
  // 計算和工具方法
  getCompletionRate: (topicId: string) => number;
  calculateProgress: (topic: Topic) => number;
  hasTaskRecord: (taskId: string) => Promise<boolean>;
  
  // 狀態管理
  setSelectedTopicId: (id: string | null) => void;
  clearError: () => void;
  setSyncing: (syncing: boolean) => void;
  reset: () => void;
  refreshTopic: (id: string) => Promise<void>;

  // === 協作方法（DetailsPanel 依賴） ===

  /**
   * 設定目標負責人
   */
  setGoalOwner: (topicId: string, goalId: string, userId: string) => Promise<Goal | null>;

  /**
   * 添加目標協作者
   */
  addGoalCollaborator: (topicId: string, goalId: string, userId: string) => Promise<boolean>;

  /**
   * 移除目標協作者
   */
  removeGoalCollaborator: (topicId: string, goalId: string, userId: string) => Promise<boolean>;

  /**
   * 啟用主題協作模式
   */
  enableTopicCollaboration: (topicId: string) => Promise<Topic | null>;

  /**
   * 停用主題協作模式
   */
  disableTopicCollaboration: (topicId: string) => Promise<Topic | null>;

  /**
   * 邀請主題協作者
   */
  inviteTopicCollaborator: (topicId: string, userId: string, permission?: 'view' | 'edit') => Promise<boolean>;

  /**
   * 移除主題協作者
   */
  removeTopicCollaborator: (topicId: string, userId: string) => Promise<boolean>;
}

export const useTopicStore = create<TopicStore>((set, get) => ({
  // 初始狀態
  topics: [],
  selectedTopicId: null,
  loading: false,
  error: null,
  syncing: false,

  // === 核心 CRUD 操作 ===

  /**
   * 獲取所有主題（含協作主題）- 優化版本
   */
  fetchTopics: async () => {
    set({ loading: true, error: null });
    const perfStart = performance.now();
    console.log('⚡ fetchTopics 開始執行...');
    try {
      // 檢查用戶認證狀態
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.warn('認證檢查失敗:', authError);
        throw new Error('用戶認證失敗，請重新登錄');
      }
      
      if (!user) {
        console.warn('用戶未登錄，無法獲取主題');
        set({ loading: false, topics: [], error: null }); // 清除錯誤，允許重試
        return;
      }

      console.log('📍 fetchTopics - 用戶已認證:', user.id);

      // ===== 優化查詢 1: 並行獲取自有主題和協作主題 =====
      const topicsStart = performance.now();
      const [ownTopicsQuery, collabTopicsQuery] = await Promise.all([
        // 查詢用戶擁有的主題
        supabase
          .from('topics')
          .select('*')
          .eq('owner_id', user.id)
          .neq('status', 'archived')
          .order('updated_at', { ascending: false }),
        
        // 查詢協作主題 - 使用 JOIN 一次查詢完成
        supabase
          .from('topic_collaborators')
          .select(`
            topic_id,
            topics!inner(*)
          `)
          .eq('user_id', user.id)
          .neq('topics.status', 'archived')
      ]);

      if (ownTopicsQuery.error) {
        console.error('獲取自有主題失敗:', ownTopicsQuery.error);
        throw new Error(`獲取主題失敗: ${ownTopicsQuery.error.message}`);
      }

      const ownTopics = ownTopicsQuery.data || [];
      console.log('📍 fetchTopics - 獲取自有主題成功:', ownTopics.length);

      // 處理協作主題查詢結果
      let collabTopics: any[] = [];
      if (collabTopicsQuery.error) {
        console.warn('獲取協作主題失敗:', collabTopicsQuery.error);
      } else {
        collabTopics = (collabTopicsQuery.data || []).map(item => item.topics);
        console.log('📍 fetchTopics - 獲取協作主題成功:', collabTopics.length);
      }

      // 合併並去重主題
      const allTopics = [...ownTopics, ...collabTopics];
      const uniqueTopics = allTopics.filter((topic, index, self) =>
        index === self.findIndex((t) => t.id === topic.id)
      );

      console.log('📍 fetchTopics - 合併後總主題數:', uniqueTopics.length);
      console.log(`⚡ 主題查詢耗時: ${Math.round(performance.now() - topicsStart)}ms`);

      if (uniqueTopics.length === 0) {
        set({ topics: [], loading: false });
        return;
      }

      const topicIds = uniqueTopics.map(t => t.id);

      // ===== 優化查詢 2: 批量獲取所有目標和任務 =====
      const goalsStart = performance.now();
      const [goalsQuery, collaboratorsQuery] = await Promise.all([
        // 一次性獲取所有目標
        supabase
          .from('goals')
          .select('*')
          .in('topic_id', topicIds)
          .neq('status', 'archived')
          .order('topic_id')
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true }),
        
        // 一次性獲取所有主題協作者
        supabase
          .from('topic_collaborators')
          .select('topic_id, user_id, permission, invited_at')
          .in('topic_id', topicIds)
      ]);

      if (goalsQuery.error) {
        console.error('批量獲取目標失敗:', goalsQuery.error);
        throw new Error(`獲取目標失敗: ${goalsQuery.error.message}`);
      }

      const allGoals = goalsQuery.data || [];
      console.log('📍 fetchTopics - 批量獲取目標成功:', allGoals.length);
      console.log(`⚡ 目標和協作者查詢耗時: ${Math.round(performance.now() - goalsStart)}ms`);

      // ===== 優化查詢 3: 批量獲取所有任務 =====
      const tasksStart = performance.now();
      let allTasks: any[] = [];
      if (allGoals.length > 0) {
        const goalIds = allGoals.map(g => g.id);
        const tasksQuery = await supabase
          .from('tasks')
          .select('*')
          .in('goal_id', goalIds)
          .neq('status', 'archived')
          .order('goal_id')
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true });

        if (tasksQuery.error) {
          console.warn('批量獲取任務失敗:', tasksQuery.error);
                } else {
          allTasks = tasksQuery.data || [];
          console.log('📍 fetchTopics - 批量獲取任務成功:', allTasks.length);
        }
      }
      console.log(`⚡ 任務查詢耗時: ${Math.round(performance.now() - tasksStart)}ms`);

      // ===== 優化查詢 4: 批量獲取任務記錄 =====
      const recordsStart = performance.now();
      let allTaskRecords: any[] = [];
      if (allTasks.length > 0) {
        const taskIds = allTasks.map(t => t.id);
        try {
          // 批量獲取任務記錄 - 使用新的批量查詢功能
          allTaskRecords = await taskRecordStore.getUserTaskRecords({ task_ids: taskIds });
          console.log('📍 fetchTopics - 批量獲取任務記錄成功:', allTaskRecords.length);
        } catch (error) {
          console.warn('批量獲取任務記錄失敗:', error);
        }
      }
      console.log(`⚡ 任務記錄查詢耗時: ${Math.round(performance.now() - recordsStart)}ms`);

      // ===== 優化查詢 5: 批量獲取用戶資料 =====
      const usersStart = performance.now();
      const allUserIds = new Set<string>();
      
      // 收集所有需要的用戶 ID
      uniqueTopics.forEach(topic => {
        if (topic.owner_id) allUserIds.add(topic.owner_id);
      });
      
      (collaboratorsQuery.data || []).forEach(collab => {
        allUserIds.add(collab.user_id);
      });
      
      allGoals.forEach(goal => {
        if (goal.owner_id) allUserIds.add(goal.owner_id);
        if (goal.collaborator_ids && Array.isArray(goal.collaborator_ids)) {
          goal.collaborator_ids.forEach(id => allUserIds.add(id));
        }
      });
      
      allTasks.forEach(task => {
        if (task.owner_id) allUserIds.add(task.owner_id);
        if (task.collaborator_ids && Array.isArray(task.collaborator_ids)) {
          task.collaborator_ids.forEach(id => allUserIds.add(id));
        }
      });

      // 一次性獲取所有用戶資料
      const usersMap = await getUsersData([...allUserIds]);
      console.log('📍 fetchTopics - 批量獲取用戶資料成功:', Object.keys(usersMap).length);
      console.log(`⚡ 用戶資料查詢耗時: ${Math.round(performance.now() - usersStart)}ms`);

      // ===== 資料組裝階段 =====
      const assemblyStart = performance.now();
      
      // 建立索引 Map 以提高查詢效率
      const goalsMap = new Map<string, any[]>();
      allGoals.forEach(goal => {
        if (!goalsMap.has(goal.topic_id)) {
          goalsMap.set(goal.topic_id, []);
        }
        goalsMap.get(goal.topic_id)!.push(goal);
      });

      const tasksMap = new Map<string, any[]>();
      allTasks.forEach(task => {
        if (!tasksMap.has(task.goal_id)) {
          tasksMap.set(task.goal_id, []);
        }
        tasksMap.get(task.goal_id)!.push(task);
      });

      const recordsMap = new Map<string, any[]>();
      allTaskRecords.forEach(record => {
        if (record.task_id) {
          if (!recordsMap.has(record.task_id)) {
            recordsMap.set(record.task_id, []);
          }
          recordsMap.get(record.task_id)!.push(record);
        }
      });

      const collaboratorsMap = new Map<string, any[]>();
      (collaboratorsQuery.data || []).forEach(collab => {
        if (!collaboratorsMap.has(collab.topic_id)) {
          collaboratorsMap.set(collab.topic_id, []);
        }
        collaboratorsMap.get(collab.topic_id)!.push(collab);
      });

      // 組裝完整的主題結構
      const topicsWithStructure = uniqueTopics.map(topic => {
        try {
          // 設置主題擁有者和協作者
          const owner = topic.owner_id && usersMap[topic.owner_id] ? usersMap[topic.owner_id] : null;
          const topicCollaborators = (collaboratorsMap.get(topic.id) || []).map(collab => ({
            ...(usersMap[collab.user_id] || {
              id: collab.user_id,
              name: `User-${collab.user_id.slice(0, 8)}`,
              email: '',
              avatar: undefined,
              role: 'student',
              roles: ['student']
            }),
            permission: collab.permission,
            invited_at: collab.invited_at
          }));

          // 組裝目標和任務
          const topicGoals = (goalsMap.get(topic.id) || []).map(goal => {
            const goalOwner = goal.owner_id && usersMap[goal.owner_id] ? usersMap[goal.owner_id] : null;
            const goalCollaborators = (goal.collaborator_ids || [])
              .map(id => usersMap[id])
              .filter(Boolean);

            const goalTasks = (tasksMap.get(goal.id) || []).map(task => {
              const taskOwner = task.owner_id && usersMap[task.owner_id] ? usersMap[task.owner_id] : null;
              const taskCollaborators = (task.collaborator_ids || [])
                .map(id => usersMap[id])
                .filter(Boolean);
              
              const taskRecords = (recordsMap.get(task.id) || []).map(record => ({
                id: record.id,
                created_at: record.created_at,
                title: task.title,
                message: record.message || '',
                difficulty: record.difficulty || 3,
                completion_time: record.completion_time,
                files: record.files || [],
                tags: record.tags || []
              }));

              return {
                ...task,
                owner: taskOwner,
                collaborators: taskCollaborators,
                records: taskRecords
              };
            });

            return {
              ...goal,
              tasks: goalTasks,
              owner: goalOwner,
              collaborators: goalCollaborators
            };
          });

          // 計算進度
          const allTopicTasks = topicGoals.flatMap(g => g.tasks || []);
          const completedTasks = allTopicTasks.filter(t => t.status === 'done');
          const progress = allTopicTasks.length > 0 ? Math.round((completedTasks.length / allTopicTasks.length) * 100) : 0;

          return {
            ...topic,
            goals: topicGoals,
            progress,
            owner,
            collaborators: topicCollaborators
          };
        } catch (topicError) {
          console.warn(`處理主題 ${topic.id} 時發生異常:`, topicError);
          return { ...topic, goals: [], progress: 0, owner: null, collaborators: [] };
        }
      });

      console.log(`⚡ 資料組裝耗時: ${Math.round(performance.now() - assemblyStart)}ms`);
      console.log('📍 fetchTopics - 完整結構獲取完成');
      
      const totalTime = performance.now() - perfStart;
      console.log(`⚡ fetchTopics 總耗時: ${Math.round(totalTime)}ms`);
      console.log(`⚡ 查詢統計: 主題(2) + 目標/協作者(2) + 任務(1) + 記錄(1) + 用戶(1) = 7次查詢`);
      
      set({ topics: topicsWithStructure, loading: false });
    } catch (error: any) {
      console.error('獲取主題失敗:', error);
      const errorMessage = error.message || '獲取主題失敗';
      set({ loading: false, error: errorMessage });
      
      // 如果是認證相關錯誤，可能需要重新導向到登錄頁
      if (errorMessage.includes('認證') || errorMessage.includes('登錄')) {
        // 這裡可以觸發登錄重導向
        console.warn('認證失敗，建議重新登錄');
      }
    }
  },

  /**
   * 獲取單一主題的完整結構
   */
  getTopic: async (id: string) => {
    try {
      // 獲取主題基本信息（過濾掉歸檔的主題）
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select('*')
        .eq('id', id)
        .neq('status', 'archived')
        .single();

      if (topicError) throw topicError;
      if (!topic) return null;

      // 獲取協作者資訊
      let collaborators: (User & { permission: string; invited_at: string })[] = [];
      let owner: User | null = null;
      try {
        // 獲取協作者列表
        const { data: collaboratorData, error: collabError } = await supabase
          .from('topic_collaborators')
          .select(`
            user_id,
            permission,
            invited_at
          `)
          .eq('topic_id', id);

        // 收集所有需要查詢的用戶ID
        const userIds: string[] = [];
        if (topic.owner_id) {
          userIds.push(topic.owner_id);
        }
        if (!collabError && collaboratorData) {
          userIds.push(...collaboratorData.map(c => c.user_id));
        }

        // 一次性獲取所有用戶資料
        const usersMap = await getUsersData(userIds);

        // 設置擁有者資訊
        if (topic.owner_id && usersMap[topic.owner_id]) {
          owner = usersMap[topic.owner_id];
        }

        // 設置協作者資訊
        if (!collabError && collaboratorData) {
          collaborators = collaboratorData.map(collab => ({
            ...(usersMap[collab.user_id] || {
              id: collab.user_id,
              name: `User-${collab.user_id.slice(0, 8)}`,
              email: '',
              avatar: undefined,
              role: 'student',
              roles: ['student']
            }),
            permission: collab.permission,
            invited_at: collab.invited_at
          }));
          console.log(`📍 getTopic - 主題 ${id} 協作者:`, collaborators.length);
        }
      } catch (collabError) {
        console.warn(`獲取主題 ${id} 協作者失敗:`, collabError);
      }

      // 獲取目標
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('topic_id', id)
        .neq('status', 'archived')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true })
        .order('title', { ascending: true })
        .order('id', { ascending: true });  // id 作為最後保證，確保完全唯一的排序

      if (goalsError) {
        console.warn(`獲取主題 ${id} 的目標失敗:`, goalsError);
        return { ...topic, goals: [], progress: 0, owner, collaborators };
      }

      // 為每個 goal 獲取 tasks
      const goalsWithTasks = await Promise.all(
        (goals || []).map(async (goal) => {
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('goal_id', goal.id)
            .neq('status', 'archived')
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: true })
            .order('title', { ascending: true })
            .order('id', { ascending: true });  // id 作為最後保證，確保完全唯一的排序

          if (tasksError) {
            console.warn(`獲取目標 ${goal.id} 的任務失敗:`, tasksError);
            return { ...goal, tasks: [], owner: null, collaborators: [] };
          }

          // 收集所有需要查詢的用戶ID（goal 和 tasks）
          const goalAndTaskUserIds: string[] = [];
          
          // Goal owner
          if (goal.owner_id) {
            goalAndTaskUserIds.push(goal.owner_id);
          }
          
          // Goal collaborators
          if (goal.collaborator_ids && Array.isArray(goal.collaborator_ids)) {
            goalAndTaskUserIds.push(...goal.collaborator_ids);
          }
          
          // Task owners and collaborators
          (tasks || []).forEach(task => {
            if (task.owner_id) {
              goalAndTaskUserIds.push(task.owner_id);
            }
            if (task.collaborator_ids && Array.isArray(task.collaborator_ids)) {
              goalAndTaskUserIds.push(...task.collaborator_ids);
            }
          });

          // 獲取用戶資料
          const goalTaskUsersMap = await getUsersData([...new Set(goalAndTaskUserIds)]);

          // 為 goal 設置 owner 和 collaborators
          const goalOwner = goal.owner_id && goalTaskUsersMap[goal.owner_id] ? goalTaskUsersMap[goal.owner_id] : null;
          const goalCollaborators = (goal.collaborator_ids || [])
            .map(id => goalTaskUsersMap[id])
            .filter(Boolean);

          // 為每個 task 設置 owner 和 collaborators
          const tasksWithUsers = await Promise.all((tasks || []).map(async task => {
            // 獲取任務記錄
            const records = await taskRecordStore.getUserTaskRecords({
              task_id: task.id
            });

            return {
              ...task,
              owner: task.owner_id && goalTaskUsersMap[task.owner_id] ? goalTaskUsersMap[task.owner_id] : null,
              collaborators: (task.collaborator_ids || [])
                .map(id => goalTaskUsersMap[id])
                .filter(Boolean),
              records: records || []
            };
          }));

          return { 
            ...goal, 
            tasks: tasksWithUsers,
            owner: goalOwner,
            collaborators: goalCollaborators
          };
        })
      );

      // 計算進度
      const allTasks = goalsWithTasks.flatMap(g => g.tasks || []);
      const completedTasks = allTasks.filter(t => t.status === 'done');
      const progress = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

      return {
        ...topic,
        goals: goalsWithTasks,
        progress,
        owner,
        collaborators
      };
    } catch (error: any) {
      console.error('獲取主題失敗:', error);
      set({ error: error.message || '獲取主題失敗' });
      return null;
    }
  },

  /**
   * 創建新主題
   */
  createTopic: async (topicData) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      // 過濾掉不屬於 topics 表的欄位
      const { goals, bubbles, progress, owner_id, version, created_at, updated_at, ...dbTopicData } = topicData as any;

      const { data, error } = await supabase
        .from('topics')
        .insert([{
          ...dbTopicData,
          owner_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const newTopic = { ...data, goals: [], progress: 0 };
      
      // 更新本地狀態
      set(state => ({
        topics: [newTopic, ...state.topics],
        loading: false
      }));

      return newTopic;
    } catch (error: any) {
      console.error('創建主題失敗:', error);
      set({ loading: false, error: error.message || '創建主題失敗' });
      return null;
    }
  },

  /**
   * 更新主題（帶版本控制）
   */
  updateTopic: async (id: string, expectedVersion: number, updates: Partial<Topic>) => {
    try {
      const { data, error } = await supabase.rpc('safe_update_topic', {
        p_id: id,
        p_expected_version: expectedVersion,
        p_title: updates.title,
        p_description: updates.description,
        p_status: updates.status,
        p_subject: updates.subject,
        p_category: updates.category,
        p_topic_type: updates.topic_type,
        p_is_collaborative: updates.is_collaborative,
        p_show_avatars: updates.show_avatars,
        p_due_date: updates.due_date,
        p_focus_element: updates.focus_element,
        p_bubbles: updates.bubbles
      });

      if (error) throw error;
      
      const result = data[0] as SafeUpdateResult;
      
      if (!result.success) {
        if (result.message === 'Version conflict detected') {
          throw new VersionConflictError(
            '主題已被其他用戶修改，請重新載入',
            result.current_version,
            expectedVersion
          );
        }
        throw new Error(result.message);
      }

      // 重新獲取完整的主題數據
      const updatedTopic = await get().getTopic(id);
      if (updatedTopic) {
        set(state => ({
          topics: state.topics.map(t => t.id === id ? updatedTopic : t)
        }));
        return updatedTopic;
      }

      return null;
    } catch (error: any) {
      console.error('更新主題失敗:', error);
      set({ error: error.message || '更新主題失敗' });
      throw error;
    }
  },

  /**
   * 刪除主題（歸檔）
   */
  deleteTopic: async (id: string) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;

      // 更新本地狀態 - 從列表中移除歸檔的主題
      set(state => ({
        topics: state.topics.filter(t => t.id !== id)
      }));

      console.log(`📍 deleteTopic - 成功歸檔主題 ${id}`);
      return true;
    } catch (error: any) {
      console.error('歸檔主題失敗:', error);
      set({ error: error.message || '歸檔主題失敗' });
      return false;
    }
  },

  /**
   * 添加目標
   */
  addGoal: async (topicId: string, goalData) => {
    try {
      // 確保所有必需字段都有默認值
      const goalDataWithDefaults = {
        title: goalData.title,
        description: goalData.description || '',
        status: goalData.status || 'todo',
        priority: goalData.priority || 'medium',
        order_index: goalData.order_index || 0,
        need_help: goalData.need_help || false,
        topic_id: topicId
      };

      const { data, error } = await supabase
        .from('goals')
        .insert([goalDataWithDefaults])
        .select()
        .single();

      if (error) throw error;

      const newGoal = { ...data, tasks: [] };

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(topic => 
          topic.id === topicId 
            ? { ...topic, goals: [...(topic.goals || []), newGoal] }
            : topic
        )
      }));

      return newGoal;
    } catch (error: any) {
      console.error('添加目標失敗:', error);
      set({ error: error.message || '添加目標失敗' });
      return null;
    }
  },

  /**
   * 更新目標（帶版本控制）
   */
  updateGoal: async (goalId: string, expectedVersion: number, updates: Partial<Goal>) => {
    try {
      const { data, error } = await supabase.rpc('safe_update_goal', {
        p_id: goalId,
        p_expected_version: expectedVersion,
        p_title: updates.title,
        p_description: updates.description,
        p_status: updates.status,
        p_priority: updates.priority,
        p_order_index: updates.order_index
      });

      if (error) throw error;
      
      const result = data as SafeUpdateResult;
      
      if (!result.success) {
        if (result.message === 'Version conflict detected') {
          throw new VersionConflictError(
            '目標已被其他用戶修改，請重新載入',
            result.current_version,
            expectedVersion
          );
        }
        throw new Error(result.message);
      }

      // 重新獲取目標數據
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError) throw goalError;

      // 為返回的目標添加 tasks 字段（確保向後兼容）
      const goalWithTasks = { ...goalData, tasks: [] };

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(topic => ({
          ...topic,
          goals: (topic.goals || []).map(goal => 
            goal.id === goalId ? { ...goal, ...goalWithTasks } : goal
          )
        }))
      }));

      return goalWithTasks;
    } catch (error: any) {
      console.error('更新目標失敗:', error);
      set({ error: error.message || '更新目標失敗' });
      throw error;
    }
  },

  /**
   * 刪除目標（歸檔）
   */
  deleteGoal: async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ status: 'archived' })
        .eq('id', goalId);

      if (error) throw error;

      // 更新本地狀態 - 從列表中移除歸檔的目標
      set(state => ({
        topics: state.topics.map(topic => ({
          ...topic,
          goals: (topic.goals || []).filter(goal => goal.id !== goalId)
        }))
      }));

      console.log(`📍 deleteGoal - 成功歸檔目標 ${goalId}`);
      return true;
    } catch (error: any) {
      console.error('歸檔目標失敗:', error);
      set({ error: error.message || '歸檔目標失敗' });
      return false;
    }
  },

  /**
   * 添加任務
   */
  addTask: async (goalId: string, taskData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      // 確保所有必需字段都有默認值
      const taskType = taskData.task_type || 'single';
      const taskConfig = taskData.task_config || createDefaultTaskConfig(taskType);
      const cycleConfig = taskData.cycle_config || createDefaultCycleConfig();
      const progressData = taskData.progress_data || createDefaultProgressData();

      const taskDataWithDefaults = {
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        order_index: taskData.order_index || 0,
        need_help: taskData.need_help || false,
        goal_id: goalId,
        task_type: taskType,
        task_config: taskConfig,
        cycle_config: cycleConfig,
        progress_data: progressData,
        special_flags: taskData.special_flags || [],
        owner_id: user.id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskDataWithDefaults])
        .select()
        .single();

      if (error) throw error;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(topic => ({
          ...topic,
          goals: (topic.goals || []).map(goal => 
            goal.id === goalId 
              ? { ...goal, tasks: [...(goal.tasks || []), data] }
              : goal
          )
        }))
      }));

      return data;
    } catch (error: any) {
      console.error('添加任務失敗:', error);
      set({ error: error.message || '添加任務失敗' });
      return null;
    }
  },

  /**
   * 更新任務（帶版本控制）
   */
  updateTask: async (taskId: string, expectedVersion: number, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase.rpc('safe_update_task', {
        p_id: taskId,
        p_expected_version: expectedVersion,
        p_title: updates.title,
        p_description: updates.description,
        p_status: updates.status,
        p_priority: updates.priority,
        p_order_index: updates.order_index,
        p_need_help: updates.need_help,
        p_help_message: updates.help_message,
        p_reply_message: updates.reply_message,
        p_replied_by: updates.replied_by,
        p_completed_by: updates.completed_by,
        p_estimated_minutes: updates.estimated_minutes,
        p_actual_minutes: updates.actual_minutes
      });

      if (error) throw error;
      
      const result = data as SafeUpdateResult;
      
      if (!result.success) {
        if (result.message === 'Version conflict detected') {
          throw new VersionConflictError(
            '任務已被其他用戶修改，請重新載入',
            result.current_version,
            expectedVersion
          );
        }
        throw new Error(result.message);
      }

      // 重新獲取任務數據
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      // 更新本地狀態
      set(state => ({
        topics: state.topics.map(topic => ({
          ...topic,
          goals: (topic.goals || []).map(goal => ({
            ...goal,
            tasks: (goal.tasks || []).map(task => 
              task.id === taskId ? { ...task, ...taskData } : task
            )
          }))
        }))
      }));

      return taskData;
    } catch (error: any) {
      console.error('更新任務失敗:', error);
      set({ error: error.message || '更新任務失敗' });
      throw error;
    }
  },

  /**
   * 刪除任務（歸檔）
   */
  deleteTask: async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'archived' })
        .eq('id', taskId);

      if (error) throw error;

      // 更新本地狀態 - 從列表中移除歸檔的任務
      set(state => ({
        topics: state.topics.map(topic => ({
          ...topic,
          goals: (topic.goals || []).map(goal => ({
            ...goal,
            tasks: (goal.tasks || []).filter(task => task.id !== taskId)
          }))
        }))
      }));

      console.log(`📍 deleteTask - 成功歸檔任務 ${taskId}`);
      return true;
    } catch (error: any) {
      console.error('歸檔任務失敗:', error);
      set({ error: error.message || '歸檔任務失敗' });
      return false;
    }
  },

  // === 專門的狀態切換函數 ===

  /**
   * 標記任務為完成
   */
  markTaskCompleted: async (taskId: string, expectedVersion: number, requireRecord = true) => {
    try {
      console.log('🎯 開始標記任務完成:', { taskId, expectedVersion, requireRecord });
      
      // 檢查是否需要學習記錄
      if (requireRecord) {
        console.log('📝 檢查是否有學習記錄');
        const hasRecord = await get().hasTaskRecord(taskId);
        console.log('📊 學習記錄檢查結果:', { hasRecord });
        
        if (!hasRecord) {
          console.log('⚠️ 缺少學習記錄，需要先記錄');
          return {
            success: false,
            message: '請先記錄學習心得',
            requiresRecord: true
          };
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ 用戶未認證');
        throw new Error('用戶未認證');
      }
      console.log('👤 已取得用戶資訊:', { userId: user.id });

      console.log('📤 準備更新任務狀態');
      const updatedTask = await get().updateTask(taskId, expectedVersion, {
        status: 'done',
        completed_by: user.id,
        completed_at: new Date().toISOString()
      });

      if (updatedTask) {
        console.log('✅ 任務更新成功:', { taskId: updatedTask.id, status: updatedTask.status });
        return { success: true, task: updatedTask };
      }

      console.error('❌ 更新任務失敗: 無法更新任務狀態');
      return { success: false, message: '更新任務失敗' };
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        console.error('❌ 版本衝突:', error.message);
        return { success: false, message: error.message };
      }
      console.error('❌ 標記任務完成失敗:', error);
      return { success: false, message: error.message || '標記任務完成失敗' };
    }
  },

  /**
   * 標記任務為進行中
   */
  markTaskInProgress: async (taskId: string, expectedVersion: number) => {
    try {
      const updatedTask = await get().updateTask(taskId, expectedVersion, {
        status: 'in_progress'
      });

      if (updatedTask) {
        return { success: true, task: updatedTask };
      }

      return { success: false, message: '更新任務失敗' };
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        return { success: false, message: error.message };
      }
      return { success: false, message: error.message || '標記任務進行中失敗' };
    }
  },

  /**
   * 標記任務為待辦
   */
  markTaskTodo: async (taskId: string, expectedVersion: number) => {
    try {
      const updatedTask = await get().updateTask(taskId, expectedVersion, {
        status: 'todo',
        completed_at: undefined,
        completed_by: undefined
      });

      if (updatedTask) {
        return { success: true, task: updatedTask };
      }

      return { success: false, message: '更新任務失敗' };
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        return { success: false, message: error.message };
      }
      return { success: false, message: error.message || '標記任務待辦失敗' };
    }
  },

  // === 新的任務動作處理方法 ===
  performTaskAction: async (taskId: string, actionType: 'check_in' | 'add_count' | 'add_amount' | 'reset', params?: any): Promise<TaskActionResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const today = getTodayInTimezone(); // 使用 UTC+8 時區
      const now = new Date(); // 當前時間戳

      // 使用 transaction 確保數據一致性
      const { data, error } = await supabase.rpc('perform_task_action_transaction', {
        p_task_id: taskId,
        p_action_type: actionType,
        p_action_date: today,
        p_action_timestamp: now.toISOString(),
        p_user_id: user.id,
        p_action_data: params || {}
      });

      if (error) {
        if (error.code === '23505' || error.message?.includes('already performed')) {
          return { success: false, message: '今天已經執行過這個動作了' };
        }
        throw error;
      }

      const result = data;
      if (!result.success) {
        return { success: false, message: result.message };
      }

      // 更新本地狀態
      if (result.task) {
        set(state => ({
          topics: state.topics.map(topic => ({
            ...topic,
            goals: (topic.goals || []).map(goal => ({
              ...goal,
              tasks: (goal.tasks || []).map(task => 
                task.id === taskId ? result.task : task
              )
            }))
          }))
        }));
      }

      return { success: true, task: result.task };
    } catch (error: any) {
      console.error('執行任務動作失敗:', error);
      return { success: false, message: error.message || '執行任務動作失敗' };
    }
  },

  checkInTask: async (taskId: string): Promise<TaskActionResult> => {
    // 直接調用 performTaskAction 來確保使用同一個 transaction
    return await get().performTaskAction(taskId, 'check_in');
  },

  addTaskCount: async (taskId: string, count: number): Promise<TaskActionResult> => {
    // 直接調用 performTaskAction 來確保使用同一個 transaction
    return await get().performTaskAction(taskId, 'add_count', { count });
  },

  addTaskAmount: async (taskId: string, amount: number, unit?: string): Promise<TaskActionResult> => {
    // 直接調用 performTaskAction 來確保使用同一個 transaction
    return await get().performTaskAction(taskId, 'add_amount', { amount, unit });
  },

  resetTaskProgress: async (taskId: string): Promise<TaskActionResult> => {
    // 直接調用 performTaskAction 來確保使用同一個 transaction
    return await get().performTaskAction(taskId, 'reset');
  },

  cancelTodayCheckIn: async (taskId: string): Promise<TaskActionResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const today = getTodayInTimezone(); // 使用 UTC+8 時區

      // 使用 transaction 確保數據一致性
      const { data, error } = await supabase.rpc('cancel_today_check_in_transaction', {
        p_task_id: taskId,
        p_user_id: user.id,
        p_today: today
      });

      if (error) throw error;

      const result = data;
      if (!result.success) {
        return { success: false, message: result.message };
      }

      // 更新本地狀態
      if (result.task) {
        set(state => ({
          topics: state.topics.map(topic => ({
            ...topic,
            goals: (topic.goals || []).map(goal => ({
              ...goal,
              tasks: (goal.tasks || []).map(task => 
                task.id === taskId ? result.task : task
              )
            }))
          }))
        }));
      }

      console.log('✅ 成功取消今日打卡:', { taskId, today });
      return { success: true, task: result.task };
    } catch (error: any) {
      console.error('取消今日打卡失敗:', error);
      return { success: false, message: error.message || '取消今日打卡失敗' };
    }
  },

  // === 快速查詢函數 ===

  /**
   * 獲取用戶的所有活躍任務（用於 TaskWall）
   */
  getActiveTasksForUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未認證');

      const { data, error } = await supabase.rpc('get_active_tasks_for_user', {
        p_user_id: user.id
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('獲取活躍任務失敗:', error);
      set({ error: error.message || '獲取活躍任務失敗' });
      return [];
    }
  },

  /**
   * 獲取主題的完整結構
   */
  getTopicWithStructure: async (topicId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_topic_with_structure', {
        p_topic_id: topicId
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data[0];
    } catch (error: any) {
      console.error('獲取主題結構失敗:', error);
      set({ error: error.message || '獲取主題結構失敗' });
      return null;
    }
  },

  // === 兼容性 API ===

  addTopic: async (topicData) => {
    return get().createTopic(topicData);
  },

  fetchMyTopics: async () => {
    return get().fetchTopics();
  },

  fetchCollaborativeTopics: async () => {
    return get().fetchTopics();
  },

  createTopicFromTemplate: async (params) => {
    try {
      const { template_id, title, description, is_collaborative } = params;
      
      // 1. 獲取模板資料
      const { data: template, error: templateError } = await supabase
        .from('topic_templates')
        .select('*')
        .eq('id', template_id)
        .single();

      if (templateError) throw templateError;
      if (!template) throw new Error('Template not found');

      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // 2. 創建新主題
      const topicData = {
        title: title || template.title,
        description: description || template.description,
        reference_info: template.reference_info, // 轉移模板的參考資訊
        subject: template.subject,
        category: template.category,
        type: template.template_type || 'learning',
        topic_type: template.template_type || 'learning',
        template_id: template.id,
        template_version: 1,
        is_collaborative: is_collaborative || false,
        show_avatars: true,
        bubbles: template.bubbles || [],
        owner_id: user.id,
        status: 'active'
      };

      const { data: newTopic, error: topicError } = await supabase
        .from('topics')
        .insert(topicData)
        .select('*')
        .single();

      if (topicError) throw topicError;
      if (!newTopic) throw new Error('Failed to create topic');

      // 3. 從模板的 JSONB goals 創建正規化的 goals 和 tasks
      if (template.goals && Array.isArray(template.goals)) {
        for (const [goalIndex, templateGoal] of template.goals.entries()) {
          // 創建 Goal
          const goalData = {
            topic_id: newTopic.id,
            title: templateGoal.title || `Goal ${goalIndex + 1}`,
            description: templateGoal.description || '',
            reference_info: templateGoal.reference_info, // 轉移 Goal 的參考資訊
            status: templateGoal.status || 'todo',
            priority: templateGoal.priority || 'medium',
            order_index: goalIndex,
            owner_id: user.id,
            need_help: false
          };

          const { data: newGoal, error: goalError } = await supabase
            .from('goals')
            .insert(goalData)
            .select('*')
            .single();

          if (goalError) {
            console.error('Failed to create goal:', goalError);
            continue;
          }

          // 創建 Tasks
          if (templateGoal.tasks && Array.isArray(templateGoal.tasks)) {
            for (const [taskIndex, templateTask] of templateGoal.tasks.entries()) {
              const taskData = {
                goal_id: newGoal.id,
                title: templateTask.title || `Task ${taskIndex + 1}`,
                description: templateTask.description || '',
                reference_info: templateTask.reference_info, // 轉移 Task 的參考資訊
                status: templateTask.status === 'idea' ? 'todo' : (templateTask.status || 'todo'),
                priority: templateTask.priority || 'medium',
                order_index: taskIndex,
                owner_id: user.id,
                need_help: false
              };

              const { error: taskError } = await supabase
                .from('tasks')
                .insert(taskData);

              if (taskError) {
                console.error('Failed to create task:', taskError);
              }
            }
          }
        }
      }

      // 4. 更新模板使用次數
      await supabase
        .from('topic_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', template_id);

      // 5. 重新獲取完整的主題資料（包含 goals 和 tasks）
      const fullTopic = await get().getTopic(newTopic.id);
      
      if (fullTopic) {
        // 更新本地 store
        set(state => ({
          topics: [fullTopic, ...state.topics]
        }));
        
        console.log(`✅ 成功從模板創建主題: ${fullTopic.title}`);
        return fullTopic;
      }

      return newTopic as Topic;
    } catch (error: any) {
      console.error('從模板創建主題失敗:', error);
      set({ error: error.message || '從模板創建主題失敗' });
      return null;
    }
  },

  // === 向後兼容的方法（自動處理版本控制） ===

  /**
   * 更新主題（舊 API，自動獲取版本號）
   * @deprecated 建議使用 updateTopic(id, expectedVersion, updates) 獲得更好的並發控制
   */
  updateTopicCompat: async (topicId: string, updates: Partial<Topic>) => {
    try {
      // 先獲取當前主題來得到版本號
      const currentTopic = await get().getTopic(topicId);
      if (!currentTopic) {
        console.error('找不到主題:', topicId);
        return null;
      }

      return await get().updateTopic(topicId, currentTopic.version, updates);
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        console.warn('版本衝突，重試中...', error);
        // 重試一次
        try {
          const refreshedTopic = await get().getTopic(topicId);
          if (refreshedTopic) {
            return await get().updateTopic(topicId, refreshedTopic.version, updates);
          }
        } catch (retryError) {
          console.error('重試失敗:', retryError);
        }
      }
      throw error;
    }
  },

  /**
   * 更新目標（舊 API，自動獲取版本號）
   * @deprecated 建議使用 updateGoal(goalId, expectedVersion, updates) 獲得更好的並發控制
   */
  updateGoalCompat: async (topicId: string, goalId: string, updates: Partial<Goal>) => {
    try {
      // 先獲取當前目標來得到版本號
      const topic = await get().getTopic(topicId);
      if (!topic) {
        console.error('找不到主題:', topicId);
        return null;
      }

      const goal = topic.goals?.find(g => g.id === goalId);
      if (!goal) {
        console.error('找不到目標:', goalId);
        return null;
      }

      return await get().updateGoal(goalId, goal.version, updates);
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        console.warn('版本衝突，重試中...', error);
        // 重試一次
        try {
          const refreshedTopic = await get().getTopic(topicId);
          if (refreshedTopic) {
            const refreshedGoal = refreshedTopic.goals?.find(g => g.id === goalId);
            if (refreshedGoal) {
              return await get().updateGoal(goalId, refreshedGoal.version, updates);
            }
          }
        } catch (retryError) {
          console.error('重試失敗:', retryError);
        }
      }
      throw error;
    }
  },

  /**
   * 更新任務（舊 API，自動獲取版本號）
   * @deprecated 建議使用 updateTask(taskId, expectedVersion, updates) 獲得更好的並發控制
   */
  updateTaskCompat: async (topicId: string, goalId: string, taskId: string, updates: Partial<Task>) => {
    try {
      // 先獲取當前任務來得到版本號
      const topic = await get().getTopic(topicId);
      if (!topic) {
        console.error('找不到主題:', topicId);
        return null;
      }

      const goal = topic.goals?.find(g => g.id === goalId);
      if (!goal) {
        console.error('找不到目標:', goalId);
        return null;
      }

      const task = goal.tasks?.find(t => t.id === taskId);
      if (!task) {
        console.error('找不到任務:', taskId);
        return null;
      }

      return await get().updateTask(taskId, task.version, updates);
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        console.warn('版本衝突，重試中...', error);
        // 重試一次
        try {
          const refreshedTopic = await get().getTopic(topicId);
          if (refreshedTopic) {
            const refreshedGoal = refreshedTopic.goals?.find(g => g.id === goalId);
            if (refreshedGoal) {
              const refreshedTask = refreshedGoal.tasks?.find(t => t.id === taskId);
              if (refreshedTask) {
                return await get().updateTask(taskId, refreshedTask.version, updates);
              }
            }
          }
        } catch (retryError) {
          console.error('重試失敗:', retryError);
        }
      }
      throw error;
         }
   },

  /**
   * 標記任務完成（舊 API，自動獲取版本號）
   * @deprecated 建議使用 markTaskCompleted(taskId, expectedVersion, requireRecord) 獲得更好的並發控制
   */
  markTaskCompletedCompat: async (topicId: string, goalId: string, taskId: string, requireRecord = true) => {
    try {
      // 先獲取當前任務來得到版本號
      const topic = await get().getTopic(topicId);
      if (!topic) {
        return { success: false, message: '找不到主題' };
      }

      const goal = topic.goals?.find(g => g.id === goalId);
      if (!goal) {
        return { success: false, message: '找不到目標' };
      }

      const task = goal.tasks?.find(t => t.id === taskId);
      if (!task) {
        return { success: false, message: '找不到任務' };
      }

      return await get().markTaskCompleted(taskId, task.version, requireRecord);
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        console.warn('版本衝突，重試中...', error);
        // 重試一次
        try {
          const refreshedTopic = await get().getTopic(topicId);
          if (refreshedTopic) {
            const refreshedGoal = refreshedTopic.goals?.find(g => g.id === goalId);
            if (refreshedGoal) {
              const refreshedTask = refreshedGoal.tasks?.find(t => t.id === taskId);
              if (refreshedTask) {
                return await get().markTaskCompleted(taskId, refreshedTask.version, requireRecord);
              }
            }
          }
        } catch (retryError) {
          console.error('重試失敗:', retryError);
        }
      }
      return { success: false, message: error.message || '標記任務完成失敗' };
    }
  },

  /**
   * 標記任務進行中（舊 API，自動獲取版本號）
   * @deprecated 建議使用 markTaskInProgress(taskId, expectedVersion) 獲得更好的並發控制
   */
  markTaskInProgressCompat: async (topicId: string, goalId: string, taskId: string) => {
    try {
      // 先獲取當前任務來得到版本號
      const topic = await get().getTopic(topicId);
      if (!topic) {
        return { success: false, message: '找不到主題' };
      }

      const goal = topic.goals?.find(g => g.id === goalId);
      if (!goal) {
        return { success: false, message: '找不到目標' };
      }

      const task = goal.tasks?.find(t => t.id === taskId);
      if (!task) {
        return { success: false, message: '找不到任務' };
      }

      return await get().markTaskInProgress(taskId, task.version);
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        console.warn('版本衝突，重試中...', error);
        // 重試一次
        try {
          const refreshedTopic = await get().getTopic(topicId);
          if (refreshedTopic) {
            const refreshedGoal = refreshedTopic.goals?.find(g => g.id === goalId);
            if (refreshedGoal) {
              const refreshedTask = refreshedGoal.tasks?.find(t => t.id === taskId);
              if (refreshedTask) {
                return await get().markTaskInProgress(taskId, refreshedTask.version);
              }
            }
          }
        } catch (retryError) {
          console.error('重試失敗:', retryError);
        }
      }
      return { success: false, message: error.message || '標記任務進行中失敗' };
    }
  },

  /**
   * 標記任務待辦（舊 API，自動獲取版本號）
   * @deprecated 建議使用 markTaskTodo(taskId, expectedVersion) 獲得更好的並發控制
   */
  markTaskTodoCompat: async (topicId: string, goalId: string, taskId: string) => {
    try {
      // 先獲取當前任務來得到版本號
      const topic = await get().getTopic(topicId);
      if (!topic) {
        return { success: false, message: '找不到主題' };
      }

      const goal = topic.goals?.find(g => g.id === goalId);
      if (!goal) {
        return { success: false, message: '找不到目標' };
      }

      const task = goal.tasks?.find(t => t.id === taskId);
      if (!task) {
        return { success: false, message: '找不到任務' };
      }

      return await get().markTaskTodo(taskId, task.version);
    } catch (error: any) {
      if (error instanceof VersionConflictError) {
        console.warn('版本衝突，重試中...', error);
        // 重試一次
        try {
          const refreshedTopic = await get().getTopic(topicId);
          if (refreshedTopic) {
            const refreshedGoal = refreshedTopic.goals?.find(g => g.id === goalId);
            if (refreshedGoal) {
              const refreshedTask = refreshedGoal.tasks?.find(t => t.id === taskId);
              if (refreshedTask) {
                return await get().markTaskTodo(taskId, refreshedTask.version);
              }
            }
          }
        } catch (retryError) {
          console.error('重試失敗:', retryError);
        }
      }
      return { success: false, message: error.message || '標記任務待辦失敗' };
    }
  },

  // === 舊 API 兼容方法的實現 ===

  /**
   * 更新任務資訊（舊 API）
   * @deprecated 使用 updateTaskCompat 代替
   */
  updateTaskInfo: async (topicId: string, goalId: string, taskId: string, updates: Partial<Task>) => {
    return get().updateTaskCompat(topicId, goalId, taskId, updates);
  },

  /**
   * 更新任務求助訊息
   */
  updateTaskHelp: async (topicId: string, goalId: string, taskId: string, needHelp: boolean, helpMessage?: string) => {
    try {
      const updateData: Partial<Task> = {
        need_help: needHelp
      };
      
      if (needHelp && helpMessage) {
        updateData.help_message = helpMessage;
      } else if (!needHelp) {
        updateData.help_message = undefined;
      }
      
      const result = await get().updateTaskCompat(topicId, goalId, taskId, updateData);
      return !!result;
    } catch (error: any) {
      console.error('更新任務求助訊息失敗:', error);
      return false;
    }
  },

  /**
   * 更新目標求助訊息
   */
  updateGoalHelp: async (topicId: string, goalId: string, needHelp: boolean, helpMessage?: string) => {
    try {
      const updateData: Partial<Goal> = {
        need_help: needHelp
      };
      
      if (needHelp && helpMessage) {
        updateData.help_message = helpMessage;
      } else if (!needHelp) {
        updateData.help_message = undefined;
      }
      
      const result = await get().updateGoalCompat(topicId, goalId, updateData);
      return !!result;
    } catch (error: any) {
      console.error('更新目標求助訊息失敗:', error);
      return false;
    }
  },

  /**
   * 設定任務負責人
   */
  setTaskOwner: async (topicId: string, goalId: string, taskId: string, userId: string) => {
    try {
      // 更新數據庫中的 task owner
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update({ owner: userId })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('設置任務負責人失敗:', error);
        return null;
      }

      // 更新本地 store
      const topics = get().topics;
      const topicIndex = topics.findIndex(t => t.id === topicId);
      if (topicIndex >= 0 && topics[topicIndex].goals) {
        const goalIndex = topics[topicIndex].goals!.findIndex(g => g.id === goalId);
        if (goalIndex >= 0) {
          // 獲取用戶信息並設置 owner
          const usersMap = await getUsersData([userId]);
          const updatedGoals = [...topics[topicIndex].goals!];
          const updatedTasks = [...(updatedGoals[goalIndex].tasks || [])];
          const taskIndex = updatedTasks.findIndex(t => t.id === taskId);
          if (taskIndex >= 0) {
            updatedTasks[taskIndex] = {
              ...updatedTasks[taskIndex],
              owner: usersMap[userId] || null
            };
            updatedGoals[goalIndex] = {
              ...updatedGoals[goalIndex],
              tasks: updatedTasks
            };
            
            const updatedTopics = [...topics];
            updatedTopics[topicIndex] = {
              ...updatedTopics[topicIndex],
              goals: updatedGoals
            };
            
            set({ topics: updatedTopics });
          }
        }
      }

      console.log(`📍 setTaskOwner - 成功設置任務 ${taskId} 負責人為 ${userId}`);
      return updatedTask as Task;
    } catch (error: any) {
      console.error('設定任務負責人失敗:', error);
      return null;
    }
  },

  /**
   * 添加任務協作者
   */
  addTaskCollaborator: async (topicId: string, goalId: string, taskId: string, userId: string) => {
    try {
      // 獲取當前 task 的協作者列表
      const { data: currentTask, error: getError } = await supabase
        .from('tasks')
        .select('collaborator_ids')
        .eq('id', taskId)
        .single();

      if (getError) {
        console.error('獲取任務協作者失敗:', getError);
        return false;
      }

      const currentCollaborators = currentTask.collaborator_ids || [];
      
      // 檢查是否已經是協作者
      if (currentCollaborators.includes(userId)) {
        console.log(`用戶 ${userId} 已是任務 ${taskId} 的協作者`);
        return true;
      }

      // 添加新的協作者
      const updatedCollaborators = [...currentCollaborators, userId];
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ collaborator_ids: updatedCollaborators })
        .eq('id', taskId);

      if (updateError) {
        console.error('更新任務協作者失敗:', updateError);
        return false;
      }

      // 更新本地 store
      await get().refreshTopic(topicId);
      
      console.log(`📍 addTaskCollaborator - 成功添加協作者 ${userId} 到任務 ${taskId}`);
      return true;
    } catch (error: any) {
      console.error('添加任務協作者失敗:', error);
      return false;
    }
  },

  /**
   * 移除任務協作者
   */
  removeTaskCollaborator: async (topicId: string, goalId: string, taskId: string, userId: string) => {
    try {
      // TODO: 實作任務協作者功能
      console.warn('removeTaskCollaborator 功能尚未實作');
      return true;
    } catch (error: any) {
      console.error('移除任務協作者失敗:', error);
      return false;
    }
  },

  /**
   * 獲取活躍的目標
   */
  getActiveGoals: (topicId: string) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic || !topic.goals) return [];
    return topic.goals
      .filter(goal => goal.status !== 'archived')
      .map(goal => ({ ...goal, tasks: goal.tasks || [] })); // 確保 tasks 永遠不為 undefined
  },

  /**
   * 獲取專注的目標
   */
  getFocusedGoals: (topicId: string) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic || !topic.goals) return [];
    return topic.goals
      .filter(goal => goal.status === 'focus')
      .map(goal => ({ ...goal, tasks: goal.tasks || [] })); // 確保 tasks 永遠不為 undefined
  },

  /**
   * 獲取活躍的主題
   */
  getActiveTopics: () => {
    return get().topics.filter(topic => {
      // 主題狀態為 active 或 in-progress
      if (topic.status === 'active' || topic.status === 'in-progress') {
        return true;
      }
      
      // 或者有未完成的任務
      if (topic.goals && topic.goals.length > 0) {
        const hasActiveTasks = topic.goals.some(goal => 
          goal.tasks && goal.tasks.some(task => 
            task.status === 'todo' || task.status === 'in_progress'
          )
        );
        return hasActiveTasks;
      }
      
      return false;
    });
  },

  /**
   * 重新排序任務
   */
  reorderTasks: async (topicId: string, goalId: string, taskIds: string[]) => {
    try {
      // 批量更新任務的 order_index
      for (let i = 0; i < taskIds.length; i++) {
        const taskId = taskIds[i];
        // 獲取當前任務
        const topic = await get().getTopic(topicId);
        if (!topic) continue;
        
        const goal = topic.goals?.find(g => g.id === goalId);
        if (!goal) continue;
        
        const task = goal.tasks?.find(t => t.id === taskId);
        if (!task) continue;
        
        // 更新順序
        await get().updateTask(taskId, task.version, {
          order_index: i
        });
      }
      
      // 重新載入主題以更新本地狀態
      await get().refreshTopic(topicId);
      return true;
    } catch (error: any) {
      console.error('重新排序任務失敗:', error);
      return false;
    }
  },

  addCollaborator: async (topicId: string, userId: string, permission: 'view' | 'edit') => {
    try {
      // 先檢查是否已經是協作者
      const { data: existingCollaborator, error: checkError } = await supabase
        .from('topic_collaborators')
        .select('id, permission')
        .eq('topic_id', topicId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 是 "not found" 錯誤，這是正常的（表示用戶不是協作者）
        console.error('檢查協作者狀態失敗:', checkError);
        return false;
      }

      if (existingCollaborator) {
        // 如果已經存在，更新權限
        console.log(`📍 addCollaborator - 用戶 ${userId} 已是協作者，更新權限為 ${permission}`);
        const { error: updateError } = await supabase
          .from('topic_collaborators')
          .update({ permission })
          .eq('topic_id', topicId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('更新協作者權限失敗:', updateError);
          return false;
        }
        return true;
      }

      // 如果不存在，新增協作者
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('topic_collaborators')
        .insert([{
          topic_id: topicId,
          user_id: userId,
          permission,
          invited_by: user?.id
        }]);

      if (error) {
        // 處理可能的 409 衝突錯誤
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
          console.warn(`📍 addCollaborator - 檢測到重複插入，嘗試更新權限`);
          // 如果是重複鍵錯誤，嘗試更新權限
          const { error: updateError } = await supabase
            .from('topic_collaborators')
            .update({ permission })
            .eq('topic_id', topicId)
            .eq('user_id', userId);

          if (updateError) {
            console.error('處理重複協作者時更新權限失敗:', updateError);
            return false;
          }
          return true;
        }
        
        console.error('添加協作者失敗:', error);
        return false;
      }

      console.log(`📍 addCollaborator - 成功添加協作者 ${userId} 到主題 ${topicId}`);
      return true;
    } catch (error) {
      console.error('添加協作者異常:', error);
      return false;
    }
  },

  removeCollaborator: async (topicId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('topic_collaborators')
        .delete()
        .eq('topic_id', topicId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('移除協作者失敗:', error);
      return false;
    }
  },

  getCollaborators: async (topicId: string) => {
    try {
      // TODO: 實作獲取協作者列表
      return [];
    } catch (error) {
      console.error('獲取協作者失敗:', error);
      return [];
    }
  },

  // === 計算和工具方法 ===

  getCompletionRate: (topicId: string) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic || !topic.goals) return 0;

    const allTasks = topic.goals.flatMap(g => g.tasks || []);
    if (allTasks.length === 0) return 0;

    const completedTasks = allTasks.filter(t => t.status === 'done');
    return Math.round((completedTasks.length / allTasks.length) * 100);
  },

  calculateProgress: (topic: Topic) => {
    if (!topic.goals) return 0;

    const allTasks = topic.goals.flatMap(g => g.tasks || []);
    if (allTasks.length === 0) return 0;

    const completedTasks = allTasks.filter(t => t.status === 'done');
    return Math.round((completedTasks.length / allTasks.length) * 100);
  },

  hasTaskRecord: async (taskId: string) => {
    try {
      return await taskRecordStore.hasRecord(taskId);
    } catch (error) {
      console.error('檢查任務記錄失敗:', error);
      return false;
    }
  },

  // === 狀態管理 ===

  setSelectedTopicId: (id: string | null) => {
    set({ selectedTopicId: id });
  },

  clearError: () => {
    set({ error: null });
  },

  setSyncing: (syncing: boolean) => {
    set({ syncing });
  },

  reset: () => {
    set({
      topics: [],
      selectedTopicId: null,
      loading: false,
      error: null,
      syncing: false
    });
  },

  refreshTopic: async (id: string) => {
    const topic = await get().getTopic(id);
    if (topic) {
      set(state => ({
        topics: state.topics.map(t => t.id === id ? topic : t)
      }));
    }
  },

  // === 協作方法（DetailsPanel 依賴） ===

  /**
   * 設定目標負責人
   */
  setGoalOwner: async (topicId: string, goalId: string, userId: string) => {
    try {
      // 更新數據庫中的 goal owner_id
      const { data: updatedGoal, error } = await supabase
        .from('goals')
        .update({ owner_id: userId })
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        console.error('設置目標負責人失敗:', error);
        return null;
      }

      // 更新本地 store
      const topics = get().topics;
      const topicIndex = topics.findIndex(t => t.id === topicId);
      if (topicIndex >= 0 && topics[topicIndex].goals) {
        const goalIndex = topics[topicIndex].goals!.findIndex(g => g.id === goalId);
        if (goalIndex >= 0) {
          // 獲取用戶信息並設置 owner
          const usersMap = await getUsersData([userId]);
          const updatedGoals = [...topics[topicIndex].goals!];
          updatedGoals[goalIndex] = {
            ...updatedGoals[goalIndex],
            owner: usersMap[userId] || null
          };
          
          const updatedTopics = [...topics];
          updatedTopics[topicIndex] = {
            ...updatedTopics[topicIndex],
            goals: updatedGoals
          };
          
          set({ topics: updatedTopics });
        }
      }

      console.log(`📍 setGoalOwner - 成功設置目標 ${goalId} 負責人為 ${userId}`);
      return updatedGoal as Goal;
    } catch (error: any) {
      console.error('設定目標負責人失敗:', error);
      return null;
    }
  },

  /**
   * 添加目標協作者
   */
  addGoalCollaborator: async (topicId: string, goalId: string, userId: string) => {
    try {
      // 獲取當前 goal 的協作者列表
      const { data: currentGoal, error: getError } = await supabase
        .from('goals')
        .select('collaborator_ids')
        .eq('id', goalId)
        .single();

      if (getError) {
        console.error('獲取目標協作者失敗:', getError);
        return false;
      }

      const currentCollaborators = currentGoal.collaborator_ids || [];
      
      // 檢查是否已經是協作者
      if (currentCollaborators.includes(userId)) {
        console.log(`用戶 ${userId} 已是目標 ${goalId} 的協作者`);
        return true;
      }

      // 添加新的協作者
      const updatedCollaborators = [...currentCollaborators, userId];
      
      const { error: updateError } = await supabase
        .from('goals')
        .update({ collaborator_ids: updatedCollaborators })
        .eq('id', goalId);

      if (updateError) {
        console.error('更新目標協作者失敗:', updateError);
        return false;
      }

      // 更新本地 store
      await get().refreshTopic(topicId);
      
      console.log(`📍 addGoalCollaborator - 成功添加協作者 ${userId} 到目標 ${goalId}`);
      return true;
    } catch (error: any) {
      console.error('添加目標協作者失敗:', error);
      return false;
    }
  },

  /**
   * 移除目標協作者
   */
  removeGoalCollaborator: async (topicId: string, goalId: string, userId: string) => {
    try {
      // TODO: 實作目標協作者功能
      console.warn('removeGoalCollaborator 功能尚未實作');
      return true;
    } catch (error: any) {
      console.error('移除目標協作者失敗:', error);
      return false;
    }
  },

  /**
   * 啟用主題協作模式
   */
  enableTopicCollaboration: async (topicId: string) => {
    try {
      return await get().updateTopicCompat(topicId, {
        is_collaborative: true
      });
    } catch (error: any) {
      console.error('啟用協作模式失敗:', error);
      return null;
    }
  },

  /**
   * 停用主題協作模式
   */
  disableTopicCollaboration: async (topicId: string) => {
    try {
      return await get().updateTopicCompat(topicId, {
        is_collaborative: false
      });
    } catch (error: any) {
      console.error('停用協作模式失敗:', error);
      return null;
    }
  },

  /**
   * 邀請主題協作者
   */
  inviteTopicCollaborator: async (topicId: string, userId: string, permission: 'view' | 'edit' = 'edit') => {
    try {
      return await get().addCollaborator(topicId, userId, permission);
    } catch (error: any) {
      console.error('邀請協作者失敗:', error);
      return false;
    }
  },

  /**
   * 移除主題協作者
   */
  removeTopicCollaborator: async (topicId: string, userId: string) => {
    try {
      return await get().removeCollaborator(topicId, userId);
    } catch (error: any) {
      console.error('移除協作者失敗:', error);
      return false;
    }
  },

  // === 參考資訊操作實現 ===
  
  // Topic 參考資訊
  updateTopicReferenceInfo: async (topicId: string, referenceInfo: ReferenceInfo) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('topics')
        .update({ reference_info: referenceInfo })
        .eq('id', topicId);

      if (error) throw error;

      // 更新本地狀態
      set((state) => ({
        topics: state.topics.map((topic) =>
          topic.id === topicId
            ? { ...topic, reference_info: referenceInfo }
            : topic
        ),
        loading: false
      }));

      return true;
    } catch (error: any) {
      console.error('更新 Topic 參考資訊失敗:', error);
      set({ loading: false, error: error.message });
      return false;
    }
  },

  addTopicAttachment: async (topicId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic) return false;

    const newAttachment: ReferenceAttachment = {
      ...attachment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = topic.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      attachments: [...currentReferenceInfo.attachments, newAttachment]
    };

    return await get().updateTopicReferenceInfo(topicId, updatedReferenceInfo);
  },

  removeTopicAttachment: async (topicId: string, attachmentId: string) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic || !topic.reference_info) return false;

    const updatedReferenceInfo = {
      ...topic.reference_info,
      attachments: topic.reference_info.attachments.filter(a => a.id !== attachmentId)
    };

    return await get().updateTopicReferenceInfo(topicId, updatedReferenceInfo);
  },

  addTopicLink: async (topicId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic) return false;

    const newLink: ReferenceLink = {
      ...link,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = topic.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      links: [...currentReferenceInfo.links, newLink]
    };

    return await get().updateTopicReferenceInfo(topicId, updatedReferenceInfo);
  },

  removeTopicLink: async (topicId: string, linkId: string) => {
    const topic = get().topics.find(t => t.id === topicId);
    if (!topic || !topic.reference_info) return false;

    const updatedReferenceInfo = {
      ...topic.reference_info,
      links: topic.reference_info.links.filter(l => l.id !== linkId)
    };

    return await get().updateTopicReferenceInfo(topicId, updatedReferenceInfo);
  },

  // Goal 參考資訊
  updateGoalReferenceInfo: async (goalId: string, referenceInfo: ReferenceInfo) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('goals')
        .update({ reference_info: referenceInfo })
        .eq('id', goalId);

      if (error) throw error;

      // 更新本地狀態
      set((state) => ({
        topics: state.topics.map((topic) => ({
          ...topic,
          goals: topic.goals?.map((goal) =>
            goal.id === goalId
              ? { ...goal, reference_info: referenceInfo }
              : goal
          )
        })),
        loading: false
      }));

      return true;
    } catch (error: any) {
      console.error('更新 Goal 參考資訊失敗:', error);
      set({ loading: false, error: error.message });
      return false;
    }
  },

  addGoalAttachment: async (goalId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => {
    let targetGoal: Goal | null = null;
    
    // 找到目標 Goal
    for (const topic of get().topics) {
      const goal = topic.goals?.find(g => g.id === goalId);
      if (goal) {
        targetGoal = goal;
        break;
      }
    }
    
    if (!targetGoal) return false;

    const newAttachment: ReferenceAttachment = {
      ...attachment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = targetGoal.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      attachments: [...currentReferenceInfo.attachments, newAttachment]
    };

    return await get().updateGoalReferenceInfo(goalId, updatedReferenceInfo);
  },

  removeGoalAttachment: async (goalId: string, attachmentId: string) => {
    let targetGoal: Goal | null = null;
    
    // 找到目標 Goal
    for (const topic of get().topics) {
      const goal = topic.goals?.find(g => g.id === goalId);
      if (goal) {
        targetGoal = goal;
        break;
      }
    }
    
    if (!targetGoal || !targetGoal.reference_info) return false;

    const updatedReferenceInfo = {
      ...targetGoal.reference_info,
      attachments: targetGoal.reference_info.attachments.filter(a => a.id !== attachmentId)
    };

    return await get().updateGoalReferenceInfo(goalId, updatedReferenceInfo);
  },

  addGoalLink: async (goalId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => {
    let targetGoal: Goal | null = null;
    
    // 找到目標 Goal
    for (const topic of get().topics) {
      const goal = topic.goals?.find(g => g.id === goalId);
      if (goal) {
        targetGoal = goal;
        break;
      }
    }
    
    if (!targetGoal) return false;

    const newLink: ReferenceLink = {
      ...link,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = targetGoal.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      links: [...currentReferenceInfo.links, newLink]
    };

    return await get().updateGoalReferenceInfo(goalId, updatedReferenceInfo);
  },

  removeGoalLink: async (goalId: string, linkId: string) => {
    let targetGoal: Goal | null = null;
    
    // 找到目標 Goal
    for (const topic of get().topics) {
      const goal = topic.goals?.find(g => g.id === goalId);
      if (goal) {
        targetGoal = goal;
        break;
      }
    }
    
    if (!targetGoal || !targetGoal.reference_info) return false;

    const updatedReferenceInfo = {
      ...targetGoal.reference_info,
      links: targetGoal.reference_info.links.filter(l => l.id !== linkId)
    };

    return await get().updateGoalReferenceInfo(goalId, updatedReferenceInfo);
  },

  // Task 參考資訊
  updateTaskReferenceInfo: async (taskId: string, referenceInfo: ReferenceInfo) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ reference_info: referenceInfo })
        .eq('id', taskId);

      if (error) throw error;

      // 更新本地狀態
      set((state) => ({
        topics: state.topics.map((topic) => ({
          ...topic,
          goals: topic.goals?.map((goal) => ({
            ...goal,
            tasks: goal.tasks?.map((task) =>
              task.id === taskId
                ? { ...task, reference_info: referenceInfo }
                : task
            )
          }))
        })),
        loading: false
      }));

      return true;
    } catch (error: any) {
      console.error('更新 Task 參考資訊失敗:', error);
      set({ loading: false, error: error.message });
      return false;
    }
  },

  addTaskAttachment: async (taskId: string, attachment: Omit<ReferenceAttachment, 'id' | 'created_at'>) => {
    let targetTask: Task | null = null;
    
    // 找到目標 Task
    for (const topic of get().topics) {
      for (const goal of topic.goals || []) {
        const task = goal.tasks?.find(t => t.id === taskId);
        if (task) {
          targetTask = task;
          break;
        }
      }
      if (targetTask) break;
    }
    
    if (!targetTask) return false;

    const newAttachment: ReferenceAttachment = {
      ...attachment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = targetTask.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      attachments: [...currentReferenceInfo.attachments, newAttachment]
    };

    return await get().updateTaskReferenceInfo(taskId, updatedReferenceInfo);
  },

  removeTaskAttachment: async (taskId: string, attachmentId: string) => {
    let targetTask: Task | null = null;
    
    // 找到目標 Task
    for (const topic of get().topics) {
      for (const goal of topic.goals || []) {
        const task = goal.tasks?.find(t => t.id === taskId);
        if (task) {
          targetTask = task;
          break;
        }
      }
      if (targetTask) break;
    }
    
    if (!targetTask || !targetTask.reference_info) return false;

    const updatedReferenceInfo = {
      ...targetTask.reference_info,
      attachments: targetTask.reference_info.attachments.filter(a => a.id !== attachmentId)
    };

    return await get().updateTaskReferenceInfo(taskId, updatedReferenceInfo);
  },

  addTaskLink: async (taskId: string, link: Omit<ReferenceLink, 'id' | 'created_at'>) => {
    let targetTask: Task | null = null;
    
    // 找到目標 Task
    for (const topic of get().topics) {
      for (const goal of topic.goals || []) {
        const task = goal.tasks?.find(t => t.id === taskId);
        if (task) {
          targetTask = task;
          break;
        }
      }
      if (targetTask) break;
    }
    
    if (!targetTask) return false;

    const newLink: ReferenceLink = {
      ...link,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    const currentReferenceInfo = targetTask.reference_info || { attachments: [], links: [] };
    const updatedReferenceInfo = {
      ...currentReferenceInfo,
      links: [...currentReferenceInfo.links, newLink]
    };

    return await get().updateTaskReferenceInfo(taskId, updatedReferenceInfo);
  },

  removeTaskLink: async (taskId: string, linkId: string) => {
    let targetTask: Task | null = null;
    
    // 找到目標 Task
    for (const topic of get().topics) {
      for (const goal of topic.goals || []) {
        const task = goal.tasks?.find(t => t.id === taskId);
        if (task) {
          targetTask = task;
          break;
        }
      }
      if (targetTask) break;
    }
    
    if (!targetTask || !targetTask.reference_info) return false;

    const updatedReferenceInfo = {
      ...targetTask.reference_info,
      links: targetTask.reference_info.links.filter(l => l.id !== linkId)
    };

    return await get().updateTaskReferenceInfo(taskId, updatedReferenceInfo);
  },

  // === 還原功能 ===

  /**
   * 還原歸檔的主題
   */
  restoreTopic: async (id: string) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ status: 'active' })
        .eq('id', id);

      if (error) throw error;

      // 重新載入主題列表以顯示還原的主題
      await get().fetchTopics();
      
      console.log(`📍 restoreTopic - 成功還原主題 ${id}`);
      return true;
    } catch (error: any) {
      console.error('還原主題失敗:', error);
      set({ error: error.message || '還原主題失敗' });
      return false;
    }
  },

  /**
   * 還原歸檔的目標
   */
  restoreGoal: async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ status: 'todo' })
        .eq('id', goalId);

      if (error) throw error;

      // 獲取目標所屬的主題並重新載入
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('topic_id')
        .eq('id', goalId)
        .single();

      if (!goalError && goal) {
        await get().refreshTopic(goal.topic_id);
      }
      
      console.log(`📍 restoreGoal - 成功還原目標 ${goalId}`);
      return true;
    } catch (error: any) {
      console.error('還原目標失敗:', error);
      set({ error: error.message || '還原目標失敗' });
      return false;
    }
  },

  /**
   * 還原歸檔的任務
   */
  restoreTask: async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'todo' })
        .eq('id', taskId);

      if (error) throw error;

      // 獲取任務所屬的主題並重新載入
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('goal_id')
        .eq('id', taskId)
        .single();

      if (!taskError && task && task.goal_id) {
        // 再查詢 goal 獲取 topic_id
        const { data: goal, error: goalError } = await supabase
          .from('goals')
          .select('topic_id')
          .eq('id', task.goal_id)
          .single();

        if (!goalError && goal && goal.topic_id) {
          await get().refreshTopic(goal.topic_id);
        }
      }
      
      console.log(`📍 restoreTask - 成功還原任務 ${taskId}`);
      return true;
    } catch (error: any) {
      console.error('還原任務失敗:', error);
      set({ error: error.message || '還原任務失敗' });
      return false;
    }
  }
})); 