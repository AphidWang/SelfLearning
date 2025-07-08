/**
 * TemplateDetailsPanel 組件 - 模板詳情面板核心組件
 * 
 * 參考 DetailsPanel.tsx 的架構，但專門用於模板編輯，移除協作相關功能
 * 
 * 🏗️ 架構設計原則：
 * 
 * 1. **分層管理原則**：
 *    - Template 層級：模板資訊管理、目標列表
 *    - Goal 層級：目標編輯/刪除、任務列表
 *    - Task 層級：任務編輯/刪除
 * 
 * 2. **狀態同步機制**：
 *    - 所有 CRUD 操作後調用 onUpdateNotify 確保數據同步
 *    - 統一錯誤處理和用戶反饋
 * 
 * 3. **功能模組化**：
 *    - 模板概覽管理
 *    - 目標狀態管理
 *    - 任務管理
 * 
 * 4. **用戶體驗設計**：
 *    - 響應式佈局
 *    - 動畫過渡
 *    - 載入狀態和錯誤處理
 */

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit, Save, X, Plus, Trash2, Target, CheckCircle2, 
  BookOpen, Settings, AlertTriangle, HelpCircle, Flag
} from 'lucide-react';
import type { TopicTemplate, TemplateGoal, TemplateTask } from '../../../types/goal';
import { SUBJECTS } from '../../../constants/subjects';
import { ReferenceInfoPanel } from '../../topic-review/components/ReferenceInfoPanel';
import toast from 'react-hot-toast';

interface TemplateDetailsPanelProps {
  template: TopicTemplate;
  selectedGoalId: string | null;
  selectedTaskId: string | null;
  subjectStyle: any;
  onUpdateNotify: () => Promise<void>; // 統一的更新通知機制
  onTaskSelect?: (taskId: string, goalId: string) => void;
  onUpdateTemplate: (updates: Partial<TopicTemplate>) => Promise<void>;
  onDeleteTemplate: () => Promise<void>;
  onAddGoal: (goalData: Omit<TemplateGoal, 'id'>) => Promise<void>;
  onUpdateGoal: (goalId: string, updates: Partial<TemplateGoal>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onAddTask: (goalId: string, taskData: Omit<TemplateTask, 'id'>) => Promise<void>;
  onUpdateTask: (goalId: string, taskId: string, updates: Partial<TemplateTask>) => Promise<void>;
  onDeleteTask: (goalId: string, taskId: string) => Promise<void>;
  isUpdating: boolean;
  // 參考資訊管理方法
  onUpdateTemplateReferenceInfo?: (info: any) => Promise<void>;
  onAddTemplateAttachment?: (attachment: any) => Promise<void>;
  onRemoveTemplateAttachment?: (attachmentId: string) => Promise<void>;
  onAddTemplateLink?: (link: any) => Promise<void>;
  onRemoveTemplateLink?: (linkId: string) => Promise<void>;
  onUpdateGoalReferenceInfo?: (goalId: string, info: any) => Promise<void>;
  onAddGoalAttachment?: (goalId: string, attachment: any) => Promise<void>;
  onRemoveGoalAttachment?: (goalId: string, attachmentId: string) => Promise<void>;
  onAddGoalLink?: (goalId: string, link: any) => Promise<void>;
  onRemoveGoalLink?: (goalId: string, linkId: string) => Promise<void>;
  onUpdateTaskReferenceInfo?: (goalId: string, taskId: string, info: any) => Promise<void>;
  onAddTaskAttachment?: (goalId: string, taskId: string, attachment: any) => Promise<void>;
  onRemoveTaskAttachment?: (goalId: string, taskId: string, attachmentId: string) => Promise<void>;
  onAddTaskLink?: (goalId: string, taskId: string, link: any) => Promise<void>;
  onRemoveTaskLink?: (goalId: string, taskId: string, linkId: string) => Promise<void>;
}

export const TemplateDetailsPanel: React.FC<TemplateDetailsPanelProps> = ({
  template,
  selectedGoalId,
  selectedTaskId,
  subjectStyle,
  onUpdateNotify,
  onTaskSelect,
  onUpdateTemplate,
  onDeleteTemplate,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  isUpdating,
  // 參考資訊管理方法
  onUpdateTemplateReferenceInfo,
  onAddTemplateAttachment,
  onRemoveTemplateAttachment,
  onAddTemplateLink,
  onRemoveTemplateLink,
  onUpdateGoalReferenceInfo,
  onAddGoalAttachment,
  onRemoveGoalAttachment,
  onAddGoalLink,
  onRemoveGoalLink,
  onUpdateTaskReferenceInfo,
  onAddTaskAttachment,
  onRemoveTaskAttachment,
  onAddTaskLink,
  onRemoveTaskLink
}) => {
  // 編輯狀態
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [showAddGoal, setShowAddGoal] = useState(false);

  // 計算當前選中的目標和任務
  const { selectedGoal, selectedTask } = useMemo(() => {
    if (!template || !selectedGoalId) return { selectedGoal: null, selectedTask: null };
    
    const goal = template.goals?.find(g => g.id === selectedGoalId);
    const task = selectedTaskId && goal && goal.tasks ? goal.tasks.find(t => t.id === selectedTaskId) : null;
    
    return { selectedGoal: goal || null, selectedTask: task };
  }, [template, selectedGoalId, selectedTaskId]);

  // 通用更新處理函數
  const handleUpdate = useCallback(async (updateFn: () => Promise<any>) => {
    try {
      await updateFn();
      await onUpdateNotify();
    } catch (error) {
      console.error('更新失敗:', error);
      toast.error('操作失敗，請稍後再試');
    }
  }, [onUpdateNotify]);

  // 編輯保存處理
  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim()) return;
    
    if (selectedTask && selectedGoal) {
      const taskInfo: Partial<TemplateTask> = {
        title: editTitle,
        description: editDescription
      };
      
      await handleUpdate(async () => {
        await onUpdateTask(selectedGoal.id, selectedTask.id, taskInfo);
      });
    } else if (selectedGoal) {
      const goalInfo: Partial<TemplateGoal> = {
        title: editTitle,
        description: editDescription
      };
      
      await handleUpdate(async () => {
        await onUpdateGoal(selectedGoal.id, goalInfo);
      });
    }
    
    setIsEditing(false);
  }, [editTitle, editDescription, selectedTask, selectedGoal, onUpdateTask, onUpdateGoal, handleUpdate]);

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
      await onAddTask(selectedGoal.id, {
        title: newTaskTitle,
        status: 'todo',
        description: '',
        priority: 'medium'
      });
    });
    setNewTaskTitle('');
    setShowAddTask(false);
  }, [newTaskTitle, selectedGoal, onAddTask, handleUpdate]);

  // 新增目標
  const handleAddGoal = useCallback(async () => {
    if (!newGoalTitle.trim()) return;
    
    await handleUpdate(async () => {
      await onAddGoal({
        title: newGoalTitle,
        status: 'todo',
        description: '',
        priority: 'medium',
        tasks: []
      });
    });
    setNewGoalTitle('');
    setShowAddGoal(false);
  }, [newGoalTitle, onAddGoal, handleUpdate]);

  // 如果選中任務，顯示任務詳情
  if (selectedTask && selectedGoal) {
    return <TemplateTaskDetailPanel 
      key={`task-${selectedTask.id}`}
      task={selectedTask}
      goal={selectedGoal}
      template={template}
      subjectStyle={subjectStyle}
      onUpdateNotify={onUpdateNotify}
      onUpdateTask={onUpdateTask}
      onDeleteTask={onDeleteTask}
      onTaskSelect={onTaskSelect}
      isUpdating={isUpdating}
      onUpdateTaskReferenceInfo={onUpdateTaskReferenceInfo}
      onAddTaskAttachment={onAddTaskAttachment}
      onRemoveTaskAttachment={onRemoveTaskAttachment}
      onAddTaskLink={onAddTaskLink}
      onRemoveTaskLink={onRemoveTaskLink}
    />;
  }

  // 如果選中目標，顯示目標詳情
  if (selectedGoal) {
    const totalTasks = selectedGoal.tasks?.length || 0;

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

          {/* 目標統計 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">任務統計</h4>
              <span className="text-sm font-medium" style={{ color: subjectStyle.accent }}>
                {totalTasks} 個任務
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold" style={{ color: subjectStyle.accent }}>
                {totalTasks}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">預計任務數</div>
            </div>
          </div>

          {/* 目標參考資訊 */}
          {onUpdateGoalReferenceInfo && (
            <ReferenceInfoPanel
              title="目標參考資訊"
              referenceInfo={selectedGoal.reference_info}
              onUpdateReferenceInfo={async (info) => {
                await handleUpdate(async () => {
                  await onUpdateGoalReferenceInfo(selectedGoal.id, info);
                });
              }}
              onAddAttachment={async (attachment) => {
                await handleUpdate(async () => {
                  await onAddGoalAttachment?.(selectedGoal.id, attachment);
                });
              }}
              onRemoveAttachment={async (attachmentId) => {
                await handleUpdate(async () => {
                  await onRemoveGoalAttachment?.(selectedGoal.id, attachmentId);
                });
              }}
              onAddLink={async (link) => {
                await handleUpdate(async () => {
                  await onAddGoalLink?.(selectedGoal.id, link);
                });
              }}
              onRemoveLink={async (linkId) => {
                await handleUpdate(async () => {
                  await onRemoveGoalLink?.(selectedGoal.id, linkId);
                });
              }}
              isUpdating={isUpdating}
            />
          )}

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
                </div>
              ))}
            </div>
          </div>


        </div>
      </motion.div>
    );
  }

  // 如果選中模板中心，顯示模板概覽
  if (selectedGoalId === 'TEMPLATE') {
    const totalGoals = template.goals?.length || 0;
    const totalTasks = template.goals?.reduce((sum, g) => sum + (g.tasks?.length || 0), 0) || 0;

    return (
      <motion.div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full p-4 overflow-y-auto"
        style={{ borderColor: `${subjectStyle.accent}50` }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="space-y-4">
          {/* 模板標題 Header */}
          <div className="border-b border-gray-200 dark:border-gray-600 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: subjectStyle.accent }} />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">模板概覽</span>
            </div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">
              {template.title}
            </h3>
            {template.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {template.description}
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

          {/* 使用統計 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">使用統計</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">被使用次數</span>
                <span className="text-sm font-medium" style={{ color: subjectStyle.accent }}>
                  {template.usage_count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">被複製次數</span>
                <span className="text-sm font-medium" style={{ color: subjectStyle.accent }}>
                  {template.copy_count || 0}
                </span>
              </div>
            </div>
          </div>

          {/* 目標網格視圖 */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">目標列表</h4>
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
              {template.goals && template.goals.length > 0 ? template.goals.map((goal, index) => {
                const totalTasks = goal.tasks?.length || 0;
                
                return (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => onTaskSelect?.((goal.tasks && goal.tasks.length > 0) ? goal.tasks[0].id : '', goal.id)}
                  >
                    {/* 編號和標題 */}
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className="w-5 h-5 flex items-center justify-center rounded-full text-xs text-white flex-shrink-0"
                        style={{ backgroundColor: subjectStyle.accent }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                        {goal.title}
                      </span>
                    </div>

                    {/* 任務數量 */}
                    <div className="flex items-center gap-2 min-w-[60px]">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {totalTasks} 任務
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

          {/* 模板參考資訊 */}
          {onUpdateTemplateReferenceInfo && (
            <ReferenceInfoPanel
              title="模板參考資訊"
              referenceInfo={template.reference_info}
              onUpdateReferenceInfo={async (info) => {
                await handleUpdate(async () => {
                  await onUpdateTemplateReferenceInfo(info);
                });
              }}
              onAddAttachment={async (attachment) => {
                await handleUpdate(async () => {
                  await onAddTemplateAttachment?.(attachment);
                });
              }}
              onRemoveAttachment={async (attachmentId) => {
                await handleUpdate(async () => {
                  await onRemoveTemplateAttachment?.(attachmentId);
                });
              }}
              onAddLink={async (link) => {
                await handleUpdate(async () => {
                  await onAddTemplateLink?.(link);
                });
              }}
              onRemoveLink={async (linkId) => {
                await handleUpdate(async () => {
                  await onRemoveTemplateLink?.(linkId);
                });
              }}
              isUpdating={isUpdating}
            />
          )}

          {/* 學科資訊 */}
          {template.subject && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">學科</h4>
              <div className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                   style={{ 
                     backgroundColor: `${subjectStyle.accent}20`,
                     color: subjectStyle.accent 
                   }}>
                {template.subject}
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
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">探索模板結構</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          點擊中央模板查看整體規劃
          <br />
          點擊目標或任務查看詳細資訊
        </p>
      </div>
    </motion.div>
  );
};

// TemplateTaskDetailPanel 組件 - 任務詳情面板
interface TemplateTaskDetailPanelProps {
  task: TemplateTask;
  goal: TemplateGoal;
  template: TopicTemplate;
  subjectStyle: any;
  onUpdateNotify: () => Promise<void>;
  onUpdateTask: (goalId: string, taskId: string, updates: Partial<TemplateTask>) => Promise<void>;
  onDeleteTask: (goalId: string, taskId: string) => Promise<void>;
  onTaskSelect?: (taskId: string, goalId: string) => void;
  isUpdating: boolean;
  // 任務參考資訊管理方法
  onUpdateTaskReferenceInfo?: (goalId: string, taskId: string, info: any) => Promise<void>;
  onAddTaskAttachment?: (goalId: string, taskId: string, attachment: any) => Promise<void>;
  onRemoveTaskAttachment?: (goalId: string, taskId: string, attachmentId: string) => Promise<void>;
  onAddTaskLink?: (goalId: string, taskId: string, link: any) => Promise<void>;
  onRemoveTaskLink?: (goalId: string, taskId: string, linkId: string) => Promise<void>;
}

const TemplateTaskDetailPanel: React.FC<TemplateTaskDetailPanelProps> = ({
  task,
  goal,
  template,
  subjectStyle,
  onUpdateNotify,
  onUpdateTask,
  onDeleteTask,
  onTaskSelect,
  isUpdating,
  // 任務參考資訊管理方法
  onUpdateTaskReferenceInfo,
  onAddTaskAttachment,
  onRemoveTaskAttachment,
  onAddTaskLink,
  onRemoveTaskLink
}) => {
  // 編輯狀態
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 通用更新處理函數
  const handleUpdate = useCallback(async (updateFn: () => Promise<any>) => {
    try {
      await updateFn();
      await onUpdateNotify();
    } catch (error) {
      console.error('更新失敗:', error);
      toast.error('操作失敗，請稍後再試');
    }
  }, [onUpdateNotify]);

  // 編輯保存處理
  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim()) return;
    
    const taskInfo: Partial<TemplateTask> = {
      title: editTitle,
      description: editDescription
    };
    
    await handleUpdate(async () => {
      await onUpdateTask(goal.id, task.id, taskInfo);
    });
    setIsEditing(false);
  }, [editTitle, editDescription, task, goal, onUpdateTask, handleUpdate]);

  // 開始編輯
  const handleStartEdit = useCallback(() => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(true);
  }, [task]);

  // 刪除任務
  const handleDeleteTask = useCallback(async () => {
    await handleUpdate(async () => {
      await onDeleteTask(goal.id, task.id);
    });
    setShowDeleteConfirm(false);
  }, [task, goal, onDeleteTask, handleUpdate]);

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
        </div>
      </div>

      {/* 可滾動內容區 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 relative z-10">
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

        {/* 任務狀態顯示 */}
        <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">任務狀態</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              task.status === 'done' ? 'bg-green-500' :
              task.status === 'in_progress' ? 'bg-blue-500' :
              'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {task.status === 'done' ? '已完成' :
               task.status === 'in_progress' ? '進行中' :
               '待開始'}
            </span>
          </div>
        </div>

        {/* 任務參考資訊 */}
        {onUpdateTaskReferenceInfo && (
          <ReferenceInfoPanel
            title="任務參考資訊"
            referenceInfo={task.reference_info}
            onUpdateReferenceInfo={async (info) => {
              await handleUpdate(async () => {
                await onUpdateTaskReferenceInfo(goal.id, task.id, info);
              });
            }}
            onAddAttachment={async (attachment) => {
              await handleUpdate(async () => {
                await onAddTaskAttachment?.(goal.id, task.id, attachment);
              });
            }}
            onRemoveAttachment={async (attachmentId) => {
              await handleUpdate(async () => {
                await onRemoveTaskAttachment?.(goal.id, task.id, attachmentId);
              });
            }}
            onAddLink={async (link) => {
              await handleUpdate(async () => {
                await onAddTaskLink?.(goal.id, task.id, link);
              });
            }}
            onRemoveLink={async (linkId) => {
              await handleUpdate(async () => {
                await onRemoveTaskLink?.(goal.id, task.id, linkId);
              });
            }}
            isUpdating={isUpdating}
          />
        )}
      </div>

      {/* 固定底部按鈕 */}
      <div className="flex-shrink-0 p-4 pt-2 space-y-2 relative z-10">
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