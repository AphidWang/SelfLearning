import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, User, Users, Flag, Target, CheckCircle2, 
  Edit, Save, X, Plus, Trash2, ChevronLeft, PlayCircle, 
  Pause, StopCircle, UserPlus, AlertTriangle, Brain,
  MessageSquare, HelpCircle
} from 'lucide-react';
import type { Topic, Goal, Task, User as UserType, TaskStatus, GoalStatus } from '../../../types/goal';
import { useTopicStore } from '../../../store/topicStore';
import { UserAvatar } from '../../learning-map/UserAvatar';

/**
 * ARCHITECTURE NOTE - DetailsPanel 組件設計原則
 * 
 * 1. 單一職責原則：統一管理右側詳情面板的所有狀態和功能
 * 2. 數據流控制：
 *    - 接收來自 TopicReviewPage 的 topic 數據和選中狀態
 *    - 通過 onUpdateNotify 回調通知父組件數據變更
 *    - 使用 topicStore 進行實際的 CRUD 操作
 * 
 * 3. 協作者管理架構：
 *    - Topic 層級的協作者作為可選擇的負責人/協作者來源
 *    - Goal/Task 的 owner/collaborators 從 Topic 協作者中選擇
 *    - 確保數據一致性：Topic 邀請 -> Goal/Task 分配
 * 
 * 4. 狀態同步機制：
 *    - 所有 CRUD 操作後都會調用 onUpdateNotify 通知父組件刷新
 *    - 避免組件間狀態不一致的問題
 * 
 * 5. 視覺設計保持：保留新版的 Header 結構和狀態顯示設計
 */

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
    addTask, updateTask, deleteTask, updateGoal, deleteGoal, 
    setGoalOwner, addGoalCollaborator, removeGoalCollaborator,
    setTaskOwner, addTaskCollaborator, removeTaskCollaborator,
    addGoal, toggleTopicCollaborative, inviteTopicCollaborator,
    removeTopicCollaborator
  } = useTopicStore();

  // 編輯狀態
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCollaboratorManager, setShowCollaboratorManager] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 計算當前選中的目標和任務
  const { selectedGoal, selectedTask } = useMemo(() => {
    if (!topic || !selectedGoalId) return { selectedGoal: null, selectedTask: null };
    
    const goal = topic.goals?.find(g => g.id === selectedGoalId);
    const task = selectedTaskId && goal ? goal.tasks.find(t => t.id === selectedTaskId) : null;
    
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
      const updates: Partial<Task> = { 
        status, 
        completedAt: status === 'done' ? new Date().toISOString() : undefined 
      };
      await updateTask(topic.id, selectedGoal.id, selectedTask.id, updates);
    });
  }, [selectedTask, selectedGoal, topic.id, updateTask, handleUpdate]);

  // 目標狀態更新  
  const handleGoalStatusUpdate = useCallback(async (status: GoalStatus) => {
    if (!selectedGoal) return;
    
    await handleUpdate(async () => {
      await updateGoal(topic.id, selectedGoal.id, { status });
    });
  }, [selectedGoal, topic.id, updateGoal, handleUpdate]);

  // 編輯保存處理
  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim()) return;
    
    if (selectedTask && selectedGoal) {
      await handleUpdate(async () => {
        await updateTask(topic.id, selectedGoal.id, selectedTask.id, {
          title: editTitle,
          description: editDescription
        });
      });
    } else if (selectedGoal) {
      await handleUpdate(async () => {
        await updateGoal(topic.id, selectedGoal.id, {
          title: editTitle,
          description: editDescription
        });
      });
    }
    setIsEditing(false);
  }, [editTitle, editDescription, selectedTask, selectedGoal, topic.id, updateTask, updateGoal, handleUpdate]);

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
      await addTask(topic.id, selectedGoal.id, {
        title: newTaskTitle,
        status: 'todo',
        description: '',
        priority: 'medium'
      });
    });
    setNewTaskTitle('');
    setShowAddTask(false);
  }, [newTaskTitle, selectedGoal, topic.id, addTask, handleUpdate]);

  // 設置負責人
  const handleSetOwner = useCallback(async (user: UserType) => {
    if (selectedTask && selectedGoal) {
      await handleUpdate(async () => {
        await setTaskOwner(topic.id, selectedGoal.id, selectedTask.id, user);
      });
    } else if (selectedGoal) {
      await handleUpdate(async () => {
        await setGoalOwner(topic.id, selectedGoal.id, user);
      });
    }
  }, [selectedTask, selectedGoal, topic.id, setTaskOwner, setGoalOwner, handleUpdate]);

  // 新增協作者
  const handleAddCollaborator = useCallback(async (user: UserType) => {
    if (selectedTask && selectedGoal) {
      await handleUpdate(async () => {
        await addTaskCollaborator(topic.id, selectedGoal.id, selectedTask.id, user);
      });
    } else if (selectedGoal) {
      await handleUpdate(async () => {
        await addGoalCollaborator(topic.id, selectedGoal.id, user);
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

  // 渲染狀態選擇器
  const renderStatusSelector = () => {
    if (selectedTask && selectedGoal) {
      const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
        { value: 'todo', label: '待開始', color: 'bg-gray-100 text-gray-800' },
        { value: 'in_progress', label: '進行中', color: 'bg-blue-100 text-blue-800' },
        { value: 'done', label: '已完成', color: 'bg-green-100 text-green-800' }
      ];

      return (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">狀態</h4>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleTaskStatusUpdate(option.value)}
                disabled={isUpdating}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTask.status === option.value 
                    ? option.color 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      );
    } else if (selectedGoal) {
      const statusOptions: { value: GoalStatus; label: string; color: string }[] = [
        { value: 'todo', label: '待開始', color: 'bg-gray-100 text-gray-800' },
        { value: 'focus', label: '專注中', color: 'bg-blue-100 text-blue-800' },
        { value: 'pause', label: '暫停中', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'complete', label: '已完成', color: 'bg-green-100 text-green-800' }
      ];

      return (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">狀態</h4>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleGoalStatusUpdate(option.value)}
                disabled={isUpdating}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  (selectedGoal.status || 'todo') === option.value 
                    ? option.color 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // 渲染協作者管理
  const renderCollaboratorManager = () => {
    const currentOwner = selectedTask?.owner || selectedGoal?.owner;
    const currentCollaborators = selectedTask?.collaborators || selectedGoal?.collaborators || [];
    
    // 可選擇的用戶：Topic 協作者 + 擁有者（如果存在）
    const selectableUsers = [...collaborators];
    if (topic.owner && !selectableUsers.find(u => u.id === topic.owner!.id)) {
      selectableUsers.unshift(topic.owner);
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">協作管理</h4>
          <button
            onClick={() => setShowCollaboratorManager(!showCollaboratorManager)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showCollaboratorManager ? '收起' : '管理'}
          </button>
        </div>

        {/* 當前負責人 */}
        {currentOwner && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">負責人</div>
            <div className="flex items-center gap-2">
              <UserAvatar user={currentOwner} size="sm" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {currentOwner.name}
              </span>
            </div>
          </div>
        )}

        {/* 協作者列表 */}
        {currentCollaborators.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">協作者</div>
            <div className="space-y-1">
              {currentCollaborators.map(collaborator => (
                <div key={collaborator.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={collaborator} size="xs" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {collaborator.name}
                    </span>
                  </div>
                  {showCollaboratorManager && (
                    <button
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 協作者管理面板 */}
        {showCollaboratorManager && (
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              從 Topic 協作者中選擇
            </div>
            <div className="space-y-1">
              {selectableUsers.map(user => {
                const isOwner = currentOwner?.id === user.id;
                const isCollaborator = currentCollaborators.some(c => c.id === user.id);
                
                return (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={user} size="xs" />
                      <span className="text-sm">{user.name}</span>
                      {isOwner && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          負責人
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!isOwner && (
                        <button
                          onClick={() => handleSetOwner(user)}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          設為負責人
                        </button>
                      )}
                      {!isOwner && !isCollaborator && (
                        <button
                          onClick={() => handleAddCollaborator(user)}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                        >
                          加入協作
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 如果選中任務，顯示任務詳情
  if (selectedTask && selectedGoal) {
    return (
      <motion.div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full p-4 overflow-y-auto"
        style={{ borderColor: `${subjectStyle.accent}50` }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="space-y-4">
          {/* 任務標題 Header */}
          <div className="border-b border-gray-200 dark:border-gray-600 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: subjectStyle.accent }} />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">任務詳情</span>
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
                  placeholder="任務描述..."
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
                  {selectedTask.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  屬於目標：{selectedGoal.title}
                </p>
                {selectedTask.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {selectedTask.description}
                  </p>
                )}
              </>
            )}
          </div>

          {/* 任務狀態控制 */}
          {renderStatusSelector()}

          {/* 時間資訊 */}
          {selectedTask.completedAt && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">時間軸</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>完成：{new Date(selectedTask.completedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* 協作者管理 */}
          {renderCollaboratorManager()}

          {/* 需要幫助標記 */}
          {selectedTask.needHelp && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                <Flag className="w-4 h-4" />
                <span className="text-sm font-medium">需要協助</span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                此任務標記為需要幫助
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // 如果選中目標，顯示目標詳情
  if (selectedGoal) {
    const completedTasks = selectedGoal.tasks.filter(t => t.status === 'done').length;
    const totalTasks = selectedGoal.tasks.length;
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
          {renderStatusSelector()}

          {/* 協作者管理 */}
          {renderCollaboratorManager()}

          {/* 任務列表與管理 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                任務列表 ({selectedGoal.tasks.length})
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
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="任務標題..."
                  className="w-full p-2 border border-gray-300 rounded mb-2"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTask}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    新增
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTask(false);
                      setNewTaskTitle('');
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 任務列表 */}
            <div className="space-y-2">
              {selectedGoal.tasks.map((task) => (
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
                  {task.needHelp && (
                    <Flag className="w-3 h-3 text-orange-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 需要幫助標記 */}
          {selectedGoal.needHelp && (
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
    const totalTasks = topic.goals?.reduce((sum, g) => sum + g.tasks.length, 0) || 0;
    const completedTasks = topic.goals?.reduce((sum, g) => sum + g.tasks.filter(t => t.status === 'done').length, 0) || 0;

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

          {/* 完成率 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">完成進度</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">目標完成率</span>
                  <span style={{ color: subjectStyle.accent }}>
                    {totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0}%`,
                      backgroundColor: subjectStyle.accent 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">任務完成率</span>
                  <span style={{ color: subjectStyle.accent }}>
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                      backgroundColor: subjectStyle.accent 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 協作資訊 */}
          {topic.is_collaborative && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">協作模式</h4>
              <div className="space-y-2">
                {topic.owner && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      擁有者：{topic.owner.name}
                    </span>
                  </div>
                )}
                {topic.collaborators && topic.collaborators.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {topic.collaborators.length} 位協作者
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

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