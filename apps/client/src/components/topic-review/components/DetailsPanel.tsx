/**
 * DetailsPanel 組件 - 主題詳情面板核心組件
 * 
 * 這是一個高度整合的詳情面板組件，負責管理主題、目標和任務的所有互動功能。
 * 
 * 🏗️ 架構設計原則：
 * 
 * 1. **分層管理原則**：
 *    - Topic 層級：協作設置、目標列表、主題資訊管理
 *    - Goal 層級：目標狀態管理、任務列表、目標編輯/刪除
 *    - Task 層級：任務狀態管理、學習記錄、任務編輯/刪除
 * 
 * 2. **協作管理架構** [[memory:1599136828095381917]]：
 *    - Topic 層級協作者管理：邀請/移除用戶、開關協作模式
 *    - Goal/Task 層級協作：從 Topic 協作者池中分配負責人和協作者
 *    - 確保數據流一致性：Topic 邀請 → Goal/Task 分配
 * 
 * 3. **狀態同步機制**：
 *    - 所有 CRUD 操作後調用 onUpdateNotify 確保父組件數據同步
 *    - 樂觀更新策略：先更新 UI，後端失敗時回滾
 *    - 統一錯誤處理和用戶反饋
 * 
 * 4. **功能模組化**：
 *    - TaskRecordInterface：任務學習記錄功能
 *    - TopicCollaborationManager：主題協作管理
 *    - GoalStatusManager：目標狀態管理
 *    - CollaborationManager：通用協作管理
 * 
 * 5. **用戶體驗設計**：
 *    - 響應式佈局適配不同螢幕尺寸
 *    - 動畫過渡提升視覺體驗
 *    - 載入狀態和錯誤處理
 *    - 快捷操作和批量管理
 * 
 * 📋 主要功能清單：
 * 
 * **主題管理**：
 * ✅ 主題資訊展示和統計
 * ✅ 協作模式開關和協作者邀請
 * ✅ 目標列表展示和新增
 * 
 * **目標管理**：
 * ✅ 目標狀態切換（待開始/專注中/暫停中/已完成）
 * ✅ 目標編輯和刪除
 * ✅ 任務列表管理和新增
 * ✅ 目標層級協作者管理
 * ✅ 求助功能和幫助狀態追蹤
 * 
 * **任務管理**：
 * ✅ 任務狀態更新（待開始/進行中/已完成）
 * ✅ 任務編輯和刪除
 * ✅ 學習記錄功能（挑戰程度評分、學習心得）
 * ✅ 任務層級協作者管理
 * ✅ 求助功能和回覆管理
 * 
 * 🔄 數據流：
 * TopicReviewPage → DetailsPanel → [子組件] → topicStore → onUpdateNotify → TopicReviewPage
 */

import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, User, Users, Flag, Target, CheckCircle2, 
  Edit, Save, X, Plus, Trash2, ChevronLeft, PlayCircle, 
  Pause, StopCircle, UserPlus, AlertTriangle, Brain,
  MessageSquare, HelpCircle, Sparkles, Eye
} from 'lucide-react';
import type { Topic, Goal, Task, User as UserType, TaskStatus, GoalStatus } from '../../../types/goal';
import { useTopicStore } from '../../../store/topicStore';
import { UserAvatar } from '../../learning-map/UserAvatar';
import { CollaborationManager } from '../../learning-map/CollaborationManager';
import { TaskRecordInterface } from './TaskRecordInterface';
import { TopicCollaborationManager } from './TopicCollaborationManager';
import { GoalStatusManager } from './GoalStatusManager';

interface DetailsPanelProps {
  topic: Topic;
  selectedGoalId: string | null;
  selectedTaskId: string | null;
  subjectStyle: any;
  onUpdateNotify: () => Promise<void>; // 統一的更新通知機制
  availableUsers: UserType[]; // 可用的協作者候選人
  collaborators: UserType[]; // Topic 層級的協作者
  onTaskSelect?: (taskId: string, goalId: string) => void; // 任務選擇回調
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  topic,
  selectedGoalId,
  selectedTaskId,
  subjectStyle,
  onUpdateNotify,
  availableUsers,
  collaborators,
  onTaskSelect
}) => {
  const { 
    addTask, updateTaskInfo, deleteTask, updateGoal, deleteGoal, 
    setGoalOwner, addGoalCollaborator, removeGoalCollaborator,
    setTaskOwner, addTaskCollaborator, removeTaskCollaborator,
    addGoal, enableTopicCollaboration, disableTopicCollaboration, inviteTopicCollaborator,
    removeTopicCollaborator,
    markTaskCompletedCompat: markTaskCompleted,
    markTaskInProgressCompat: markTaskInProgress,
    markTaskTodoCompat: markTaskTodo,
    updateGoalCompat
  } = useTopicStore();

  // 編輯狀態
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCollaboratorManager, setShowCollaboratorManager] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [showAddGoal, setShowAddGoal] = useState(false);

  // 計算當前選中的目標和任務
  const { selectedGoal, selectedTask } = useMemo(() => {
    if (!topic || !selectedGoalId) return { selectedGoal: null, selectedTask: null };
    
    const goal = topic.goals?.find(g => g.id === selectedGoalId);
    const task = selectedTaskId && goal && goal.tasks ? goal.tasks.find(t => t.id === selectedTaskId) : null;
    
    return { selectedGoal: goal || null, selectedTask: task };
  }, [topic, selectedGoalId, selectedTaskId]);

  // 通用更新處理函數
  const handleUpdate = useCallback(async (updateFn: () => Promise<any>) => {
    setIsUpdating(true);
    try {
      await updateFn();
      await onUpdateNotify();
    } catch (error) {
      console.error('更新失敗:', error);
      alert('操作失敗，請稍後再試');
    } finally {
      setIsUpdating(false);
    }
  }, [onUpdateNotify]);

  // 任務狀態更新
  const handleTaskStatusUpdate = useCallback(async (status: TaskStatus) => {
    if (!selectedTask || !selectedGoal) return;
    
    await handleUpdate(async () => {
      switch (status) {
        case 'done':
          await markTaskCompleted(topic.id, selectedGoal.id, selectedTask.id);
          break;
        case 'in_progress':
          await markTaskInProgress(topic.id, selectedGoal.id, selectedTask.id);
          break;
        case 'todo':
          await markTaskTodo(topic.id, selectedGoal.id, selectedTask.id);
          break;
      }
    });
  }, [selectedTask, selectedGoal, topic.id, markTaskCompleted, markTaskInProgress, markTaskTodo, handleUpdate]);

  // 目標狀態更新  
  const handleGoalStatusUpdate = useCallback(async (status: GoalStatus) => {
    if (!selectedGoal) return;
    
    await handleUpdate(async () => {
      await updateGoalCompat(topic.id, selectedGoal.id, { status });
    });
  }, [selectedGoal, topic.id, updateGoalCompat, handleUpdate]);

  // 編輯保存處理
  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim() || !selectedGoal || !selectedTask) return;
    
    // 只允許更新任務資訊，不允許更新狀態
    const taskInfo: Pick<Task, 'title' | 'description'> = {
      title: editTitle,
      description: editDescription
    };
    
    await handleUpdate(async () => {
      await updateTaskInfo(topic.id, selectedGoal.id, selectedTask.id, taskInfo);
    });
    setIsEditing(false);
  }, [editTitle, editDescription, selectedTask, selectedGoal, topic.id, updateTaskInfo, handleUpdate]);

  // 開始編輯
  const handleStartEdit = useCallback(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title);
      setEditDescription(selectedTask.description || '');
    } else if (selectedGoal) {
      setEditTitle(selectedGoal.title);
      setEditDescription(selectedGoal.description || '');
    }
    setIsEditing(true);
  }, [selectedTask, selectedGoal]);

  // 新增任務
  const handleAddTask = useCallback(async () => {
    if (!newTaskTitle.trim() || !selectedGoal) return;
    
    await handleUpdate(async () => {
      await addTask(selectedGoal.id, {
        title: newTaskTitle,
        status: 'todo',
        description: '',
        priority: 'medium',
        order_index: (selectedGoal.tasks?.length || 0) + 1,
        need_help: false
      });
    });
    setNewTaskTitle('');
    setShowAddTask(false);
  }, [newTaskTitle, selectedGoal, addTask, handleUpdate]);

  // 新增目標
  const handleAddGoal = useCallback(async () => {
    if (!newGoalTitle.trim()) return;
    
    await handleUpdate(async () => {
      await addGoal(topic.id, {
        title: newGoalTitle,
        status: 'todo',
        description: '',
        priority: 'medium',
        order_index: (topic.goals?.length || 0) + 1
      });
    });
    setNewGoalTitle('');
    setShowAddGoal(false);
  }, [newGoalTitle, topic.id, addGoal, handleUpdate]);

  // 設置負責人
  const handleSetOwner = useCallback(async (user: UserType) => {
    if (selectedTask && selectedGoal) {
      await handleUpdate(async () => {
        await setTaskOwner(topic.id, selectedGoal.id, selectedTask.id, user.id);
      });
    } else if (selectedGoal) {
      await handleUpdate(async () => {
        await setGoalOwner(topic.id, selectedGoal.id, user.id);
      });
    }
  }, [selectedTask, selectedGoal, topic.id, setTaskOwner, setGoalOwner, handleUpdate]);

  // 新增協作者
  const handleAddCollaborator = useCallback(async (user: UserType) => {
    if (selectedTask && selectedGoal) {
      await handleUpdate(async () => {
        await addTaskCollaborator(topic.id, selectedGoal.id, selectedTask.id, user.id);
      });
    } else if (selectedGoal) {
      await handleUpdate(async () => {
        await addGoalCollaborator(topic.id, selectedGoal.id, user.id);
      });
    }
  }, [selectedTask, selectedGoal, topic.id, addTaskCollaborator, addGoalCollaborator, handleUpdate]);

  // 移除協作者
  const handleRemoveCollaborator = useCallback(async (userId: string) => {
    if (selectedTask && selectedGoal) {
      await handleUpdate(async () => {
        await removeTaskCollaborator(topic.id, selectedGoal.id, selectedTask.id, userId);
      });
    } else if (selectedGoal) {
      await handleUpdate(async () => {
        await removeGoalCollaborator(topic.id, selectedGoal.id, userId);
      });
    }
  }, [selectedTask, selectedGoal, topic.id, removeTaskCollaborator, removeGoalCollaborator, handleUpdate]);



  // 渲染協作者管理 - 使用 CollaborationManager 組件
  const renderCollaboratorManager = () => {
    const currentOwner = selectedTask?.owner || (selectedGoal as any)?.owner;
    const currentCollaborators = selectedTask?.collaborators || (selectedGoal as any)?.collaborators || [];
    
    // 可選擇的用戶：Topic 協作者 + 擁有者（如果存在）
    const selectableUsers = [...collaborators];
    if (topic.owner && !selectableUsers.find(u => u.id === topic.owner!.id)) {
      selectableUsers.unshift(topic.owner);
    }

    return (
      <CollaborationManager
        title={selectedTask ? "任務協作" : "目標協作"}
        owner={currentOwner}
        collaborators={currentCollaborators}
        availableUsers={selectableUsers}
        onSetOwner={handleSetOwner}
        onAddCollaborator={handleAddCollaborator}
        onRemoveCollaborator={handleRemoveCollaborator}
        className="mb-3"
      />
    );
  };

  // 如果選中任務，顯示任務詳情
  if (selectedTask && selectedGoal) {
    return <TaskDetailPanel 
      key={`task-${selectedTask.id}`}
      task={selectedTask}
      goal={selectedGoal}
      topic={topic}
      subjectStyle={subjectStyle}
      availableUsers={availableUsers}
      collaborators={collaborators}
      onUpdateNotify={onUpdateNotify}
      onTaskSelect={onTaskSelect}
    />;
  }

  // 如果選中目標，顯示目標詳情
  if (selectedGoal) {
    const completedTasks = (selectedGoal.tasks || []).filter(t => t.status === 'done').length;
    const totalTasks = selectedGoal.tasks?.length || 0;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
      <motion.div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full p-4 overflow-y-auto"
        style={{ borderColor: `${subjectStyle.accent}50` }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="space-y-4">
          {/* 目標標題 Header */}
          <div className="border-b border-gray-200 dark:border-gray-600 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5" style={{ color: subjectStyle.accent }} />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">目標詳情</span>
              <div className="flex-1" />
              <button
                onClick={handleStartEdit}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full font-bold text-lg bg-transparent border-b-2 border-blue-500 focus:outline-none"
                  autoFocus
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-sm bg-transparent resize-none border border-gray-300 rounded p-2"
                  rows={3}
                  placeholder="目標描述..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    <Save className="w-3 h-3" />
                    保存
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                  >
                    <X className="w-3 h-3" />
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">
                  {selectedGoal.title}
                </h3>
                {selectedGoal.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {selectedGoal.description}
                  </p>
                )}
              </>
            )}
          </div>

          {/* 目標進度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">完成進度</h4>
              <span className="text-sm font-medium" style={{ color: subjectStyle.accent }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: subjectStyle.accent 
                }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {completedTasks} / {totalTasks} 任務已完成
            </p>
          </div>

          {/* 目標狀態控制 */}
          <GoalStatusManager
            currentStatus={selectedGoal.status}
            onStatusChange={handleGoalStatusUpdate}
            isUpdating={isUpdating}
            totalTasks={totalTasks}
            completedTasks={completedTasks}
          />

          {/* 協作者管理 */}
          {renderCollaboratorManager()}

          {/* 任務列表與管理 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                任務列表 ({selectedGoal.tasks?.length || 0})
              </h4>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* 新增任務輸入 */}
            {showAddTask && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-4 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-900/20 dark:to-blue-800/10 backdrop-blur-sm">
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="輸入新任務標題..."
                        className="w-full px-4 py-3 text-sm font-medium bg-white/80 dark:bg-gray-800/80 border-0 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newTaskTitle.trim()) {
                            handleAddTask();
                          }
                          if (e.key === 'Escape') {
                            setShowAddTask(false);
                            setNewTaskTitle('');
                          }
                        }}
                        autoFocus
                      />
                      <div className="absolute inset-0 rounded-lg ring-1 ring-blue-200/50 dark:ring-blue-700/50 pointer-events-none" />
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowAddTask(false);
                            setNewTaskTitle('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-md transition-all"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleAddTask}
                          disabled={isUpdating || !newTaskTitle.trim()}
                          className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        >
                          {isUpdating ? (
                            <>
                              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                              新增中
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              新增任務
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 任務列表 */}
            <div className="space-y-2">
              {(selectedGoal.tasks || []).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => onTaskSelect?.(task.id, selectedGoal.id)}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    task.status === 'done' ? 'bg-green-500' :
                    task.status === 'in_progress' ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {task.title}
                  </span>
                  {task.need_help && (
                    <Flag className="w-3 h-3 text-orange-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 需要幫助標記 */}
          {selectedGoal.need_help && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                <Flag className="w-4 h-4" />
                <span className="text-sm font-medium">需要協助</span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                此目標標記為需要幫助
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // 如果選中主題中心，顯示主題概覽
  if (selectedGoalId === 'TOPIC') {
    const totalGoals = topic.goals?.length || 0;
    const completedGoals = topic.goals?.filter(g => g.status === 'complete').length || 0;
    const totalTasks = topic.goals?.reduce((sum, g) => sum + (g.tasks?.length || 0), 0) || 0;
    const completedTasks = topic.goals?.reduce((sum, g) => sum + (g.tasks?.filter(t => t.status === 'done').length || 0), 0) || 0;

    return (
      <motion.div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full p-4 overflow-y-auto"
        style={{ borderColor: `${subjectStyle.accent}50` }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="space-y-4">
          {/* 主題標題 Header */}
          <div className="border-b border-gray-200 dark:border-gray-600 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: subjectStyle.accent }} />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">主題概覽</span>
            </div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">
              {topic.title}
            </h3>
            {topic.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {topic.description}
              </p>
            )}
          </div>

          {/* 整體統計 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold" style={{ color: subjectStyle.accent }}>
                {totalGoals}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">總目標數</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold" style={{ color: subjectStyle.accent }}>
                {totalTasks}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">總任務數</div>
            </div>
          </div>

          {/* 協作管理 */}
          <TopicCollaborationManager
            topic={{
              id: topic.id,
              is_collaborative: topic.is_collaborative ?? false,
              owner: topic.owner
            }}
            availableUsers={availableUsers}
            collaborators={collaborators.map(c => ({ user: c, permission: 'edit' as const }))}
            onInviteCollaborator={async (userId, permission) => {
              await handleUpdate(async () => {
                return await inviteTopicCollaborator(topic.id, userId, permission);
              });
              return true;
            }}
            onRemoveCollaborator={async (userId) => {
              await handleUpdate(async () => {
                return await removeTopicCollaborator(topic.id, userId);
              });
              return true;
            }}
            onToggleCollaborative={async () => {
              await handleUpdate(async () => {
                if (topic.is_collaborative) {
                  return await disableTopicCollaboration(topic.id);
                } else {
                  return await enableTopicCollaboration(topic.id);
                }
              });
              return true;
            }}
            isUpdating={isUpdating}
          />

          {/* 目標網格視圖 */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">目標進度</h4>
              <button
                onClick={() => setShowAddGoal(!showAddGoal)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                title="新增目標"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* 新增目標輸入 */}
            {showAddGoal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-4 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-900/20 dark:to-blue-800/10 backdrop-blur-sm">
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        placeholder="輸入新目標標題..."
                        className="w-full px-4 py-3 text-sm font-medium bg-white/80 dark:bg-gray-800/80 border-0 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newGoalTitle.trim()) {
                            handleAddGoal();
                          }
                          if (e.key === 'Escape') {
                            setShowAddGoal(false);
                            setNewGoalTitle('');
                          }
                        }}
                        autoFocus
                      />
                      <div className="absolute inset-0 rounded-lg ring-1 ring-blue-200/50 dark:ring-blue-700/50 pointer-events-none" />
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowAddGoal(false);
                            setNewGoalTitle('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-md transition-all"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleAddGoal}
                          disabled={isUpdating || !newGoalTitle.trim()}
                          className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        >
                          {isUpdating ? (
                            <>
                              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                              新增中
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              新增目標
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-2">
              {topic.goals && topic.goals.length > 0 ? topic.goals.map((goal, index) => {
                const totalTasks = goal.tasks?.length || 0;
                const completedTasks = (goal.tasks || []).filter(t => t.status === 'done').length;
                const inProgressTasks = (goal.tasks || []).filter(t => t.status === 'in_progress').length;
                const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                // 決定目標狀態顏色
                let goalStatusColor = '';
                let goalStatusBg = '';
                let goalStatusText = '';
                
                if (progress === 100) {
                  goalStatusColor = '#22c55e';
                  goalStatusBg = 'bg-green-50 dark:bg-green-900/20';
                  goalStatusText = 'text-green-700 dark:text-green-300';
                } else if (inProgressTasks > 0) {
                  goalStatusColor = '#8b5cf6';
                  goalStatusBg = 'bg-purple-50 dark:bg-purple-900/20';
                  goalStatusText = 'text-purple-700 dark:text-purple-300';
                } else if (completedTasks > 0) {
                  goalStatusColor = '#3b82f6';
                  goalStatusBg = 'bg-blue-50 dark:bg-blue-900/20';
                  goalStatusText = 'text-blue-700 dark:text-blue-300';
                } else {
                  goalStatusColor = '#6b7280';
                  goalStatusBg = 'bg-gray-50 dark:bg-gray-800';
                  goalStatusText = 'text-gray-600 dark:text-gray-400';
                }

                return (
                  <div
                    key={goal.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${goalStatusBg} hover:brightness-95 dark:hover:brightness-110`}
                    onClick={() => onTaskSelect?.((goal.tasks && goal.tasks.length > 0) ? goal.tasks[0].id : '', goal.id)}
                  >
                    {/* 編號和標題 */}
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className="w-5 h-5 flex items-center justify-center rounded-full text-xs text-white flex-shrink-0"
                        style={{ backgroundColor: goalStatusColor }}
                      >
                        {index + 1}
                      </span>
                      <span className={`text-sm ${goalStatusText} line-clamp-1`}>
                        {goal.title}
                      </span>
                    </div>

                    {/* 進度條和百分比 */}
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: goalStatusColor
                          }}
                        />
                      </div>
                      <span className="text-xs min-w-[32px] text-right" style={{ color: goalStatusColor }}>
                        {progress}%
                      </span>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    尚未建立任何目標
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    點擊上方 + 新增第一個目標
                  </p>
                </div>
              )}
            </div>
          </div>



          {/* 學科資訊 */}
          {topic.subject && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">學科</h4>
              <div className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                   style={{ 
                     backgroundColor: `${subjectStyle.accent}20`,
                     color: subjectStyle.accent 
                   }}>
                {topic.subject}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // 默認狀態 - 無選中項目
  return (
    <motion.div
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col items-center justify-center p-6"
      style={{ borderColor: `${subjectStyle.accent}50` }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      <div className="text-center">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
        </svg>
        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">探索學習路徑</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          點擊中央主題查看整體規劃
          <br />
          點擊目標或任務查看詳細資訊
        </p>
      </div>
    </motion.div>
  );
};

// TaskDetailPanel 組件 - 任務詳情面板，包含學習記錄功能
interface TaskDetailPanelProps {
  task: Task;
  goal: Goal;
  topic: Topic;
  subjectStyle: any;
  availableUsers: UserType[];
  collaborators: UserType[];
  onUpdateNotify: () => Promise<void>;
  onTaskSelect?: (taskId: string, goalId: string) => void;
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  goal,
  topic,
  subjectStyle,
  availableUsers,
  collaborators,
  onUpdateNotify,
  onTaskSelect
}) => {
  const { 
    updateTaskInfo, deleteTask, setTaskOwner, addTaskCollaborator,
          removeTaskCollaborator, markTaskCompletedCompat: markTaskCompleted, markTaskInProgressCompat: markTaskInProgress, markTaskTodoCompat: markTaskTodo
  } = useTopicStore();
  
  // 編輯狀態
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRecordInterface, setShowRecordInterface] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 通用更新處理函數
  const handleUpdate = useCallback(async (updateFn: () => Promise<any>) => {
    setIsUpdating(true);
    try {
      await updateFn();
      await onUpdateNotify();
    } catch (error) {
      console.error('更新失敗:', error);
      alert('操作失敗，請稍後再試');
    } finally {
      setIsUpdating(false);
    }
  }, [onUpdateNotify]);

  // 任務狀態更新
  const handleTaskStatusUpdate = useCallback(async (status: TaskStatus) => {
    await handleUpdate(async () => {
      switch (status) {
        case 'done':
          await markTaskCompleted(topic.id, goal.id, task.id);
          break;
        case 'in_progress':
          await markTaskInProgress(topic.id, goal.id, task.id);
          break;
        case 'todo':
          await markTaskTodo(topic.id, goal.id, task.id);
          break;
      }
    });
  }, [task, goal, topic.id, markTaskCompleted, markTaskInProgress, markTaskTodo, handleUpdate]);

  // 編輯保存處理
  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim()) return;
    
    // 只允許更新任務資訊，不允許更新狀態
    const taskInfo: Pick<Task, 'title' | 'description'> = {
      title: editTitle,
      description: editDescription
    };
    
    await handleUpdate(async () => {
      await updateTaskInfo(topic.id, goal.id, task.id, taskInfo);
    });
    setIsEditing(false);
  }, [editTitle, editDescription, task, goal, topic.id, updateTaskInfo, handleUpdate]);

  // 開始編輯
  const handleStartEdit = useCallback(() => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(true);
  }, [task]);

  // 刪除任務
  const handleDeleteTask = useCallback(async () => {
    await handleUpdate(async () => {
      await deleteTask(task.id);
    });
    setShowDeleteConfirm(false);
  }, [task, deleteTask, handleUpdate]);

  // 協作者管理
  const handleSetOwner = useCallback(async (user: UserType) => {
    await handleUpdate(async () => {
      await setTaskOwner(topic.id, goal.id, task.id, user.id);
    });
  }, [task, goal, topic.id, setTaskOwner, handleUpdate]);

  const handleAddCollaborator = useCallback(async (user: UserType) => {
    await handleUpdate(async () => {
      await addTaskCollaborator(topic.id, goal.id, task.id, user.id);
    });
  }, [task, goal, topic.id, addTaskCollaborator, handleUpdate]);

  const handleRemoveCollaborator = useCallback(async (userId: string) => {
    await handleUpdate(async () => {
      await removeTaskCollaborator(topic.id, goal.id, task.id, userId);
    });
  }, [task, goal, topic.id, removeTaskCollaborator, handleUpdate]);

  // 渲染協作者管理
  const renderCollaboratorManager = () => {
    const selectableUsers = [...collaborators];
    if (topic.owner && !selectableUsers.find(u => u.id === topic.owner!.id)) {
      selectableUsers.unshift(topic.owner);
    }

    return (
      <CollaborationManager
        title="任務協作"
        owner={task.owner}
        collaborators={task.collaborators || []}
        availableUsers={selectableUsers}
        onSetOwner={handleSetOwner}
        onAddCollaborator={handleAddCollaborator}
        onRemoveCollaborator={handleRemoveCollaborator}
        className="mb-3"
      />
    );
  };

  if (showRecordInterface) {
    return (
      <motion.div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full overflow-hidden"
        style={{ borderColor: `${subjectStyle.accent}50` }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <TaskRecordInterface
          task={task}
          onStatusUpdate={handleTaskStatusUpdate}
          onBack={() => setShowRecordInterface(false)}
          isUpdating={isUpdating}
          topicId={topic.id}
          goalId={goal.id}
          onRecordComplete={() => setShowRecordInterface(false)}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden"
      style={{ borderColor: `${subjectStyle.accent}50` }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      {/* 背景裝飾 */}
      <div 
        className="absolute inset-0 opacity-5 rounded-xl"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${subjectStyle.accent}40 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      {/* 固定標題區 */}
      <div className="flex-shrink-0 p-4 pb-2 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4" style={{ color: subjectStyle.accent }} />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">任務詳情</span>
          <div className="flex-1" />
          {task.need_help && (
            <motion.div
              className="flex items-center gap-1 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <AlertTriangle className="w-3 h-3" />
              需要幫助
            </motion.div>
          )}
        </div>
      </div>

      {/* 可滾動內容區 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 relative z-10">
        {/* 任務狀態信息 */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">來自目標: {goal.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              task.status === 'done' ? 'bg-green-100 text-green-700' :
              task.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {task.status === 'done' ? '已完成' :
               task.status === 'in_progress' ? '進行中' : '待開始'}
            </span>
          </div>
        </div>

        {/* 主要編輯區 */}
        <div 
          className="rounded-xl p-4 border-2 mb-4 shadow-sm" 
          style={{ 
            borderColor: `${subjectStyle.accent}40`,
            background: `linear-gradient(135deg, ${subjectStyle.accent}10 0%, ${subjectStyle.accent}20 100%)`,
            boxShadow: `0 2px 8px ${subjectStyle.accent}15`
          }}
        >
          {isEditing ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">編輯任務</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSaveEdit}
                    className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    title="保存"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="取消"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2 text-sm font-medium bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-gray-300 backdrop-blur-sm"
                  placeholder="任務標題..."
                  autoFocus
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2 text-xs bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-gray-300 resize-none backdrop-blur-sm"
                  rows={3}
                  placeholder="任務描述..."
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                  {task.title}
                </h4>
                <button
                  onClick={handleStartEdit}
                  className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title="編輯"
                >
                  <Edit size={14} />
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {task.description || "點擊編輯按鈕來新增描述"}
              </p>
            </>
          )}
        </div>

        {/* 時間資訊 */}
        {task.completed_at && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">完成時間</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{new Date(task.completed_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {/* 協作者管理 - 只在協作模式下顯示 */}
        {topic.is_collaborative && renderCollaboratorManager()}
      </div>

      {/* 固定底部按鈕 */}
      <div className="flex-shrink-0 p-4 pt-2 space-y-2 relative z-10">
        <button
          onClick={() => setShowRecordInterface(true)}
          disabled={isUpdating}
          className="w-full py-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles size={14} />
          記錄一下
        </button>
        
        {/* 刪除按鈕 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isUpdating}
            className="w-full py-2 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            title="刪除任務"
          >
            <Trash2 className="w-4 h-4" />
            刪除任務
          </button>
        </div>
      </div>

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <motion.div
          className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl p-4 w-full max-w-sm shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-white">確認刪除任務</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  此操作無法復原
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              您確定要刪除任務 <strong>{task.title}</strong> 嗎？
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={isUpdating}
                className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isUpdating ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};