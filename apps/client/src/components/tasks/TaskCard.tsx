import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types/goal';
import { useTopicStore } from '../../store/topicStore';
import { 
  Calendar, AlertTriangle, GripVertical, Edit2, 
  Check, Plus, Target, Zap, Clock, TrendingUp,
  CheckCircle, RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTaskStore } from '../../store/taskStore';

interface TaskCardProps {
  task: Task;
  weekId?: number;
  onEdit?: (task: Task) => void;
  onRemove?: (taskId: string) => void;
  showDragHandle?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  weekId, 
  onEdit, 
  onRemove, 
  showDragHandle = true 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { performTaskAction, checkInTask, addTaskCount, addTaskAmount, resetTaskProgress } = useTaskStore();

  const handleDragStart = (e: React.DragEvent) => {
    if (weekId) {
      e.dataTransfer.setData('taskId', task.id);
      e.dataTransfer.setData('sourceWeekId', weekId.toString());
    }
  };

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'idea':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return '已完成';
      case 'in_progress':
        return '進行中';
      case 'idea':
        return '構想中';
      case 'archived':
        return '已封存';
      default:
        return '未開始';
    }
  };

  const getTaskTypeIcon = () => {
    switch (task.task_type) {
      case 'count':
        return <Target className="w-4 h-4" />;
      case 'streak':
        return <Zap className="w-4 h-4" />;
      case 'accumulative':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getTaskTypeColor = () => {
    switch (task.task_type) {
      case 'count':
        return 'text-blue-600 dark:text-blue-400';
      case 'streak':
        return 'text-orange-600 dark:text-orange-400';
      case 'accumulative':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleTaskAction = async (actionType: string, params?: any) => {
    setIsLoading(true);
    try {
      let result;
      
      switch (actionType) {
        case 'check_in':
          result = await checkInTask(task.id);
          break;
        case 'add_count':
          result = await addTaskCount(task.id, params?.count || 1);
          break;
        case 'add_amount':
          result = await addTaskAmount(task.id, params?.amount || 0, params?.unit);
          break;
        case 'reset':
          result = await resetTaskProgress(task.id);
          break;
        default:
          result = await performTaskAction(task.id, actionType as any, params);
      }

      if (result.success) {
        toast.success(getSuccessMessage(actionType));
      } else {
        toast.error(result.message || '操作失敗');
      }
    } catch (error) {
      console.error('任務操作失敗:', error);
      toast.error('操作失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const getSuccessMessage = (actionType: string) => {
    switch (actionType) {
      case 'check_in':
        return '打卡成功！';
      case 'add_count':
        return '計數已增加！';
      case 'add_amount':
        return '累計已更新！';
      case 'reset':
        return '進度已重置！';
      default:
        return '操作成功！';
    }
  };

  const renderProgressInfo = () => {
    const config = task.task_config || {};
    const progressData = task.progress_data || {};

    switch (task.task_type) {
      case 'count':
        const currentCount = (progressData as any).current_count || 0;
        const targetCount = (config as any).target_count || 0;
        const countProgress = targetCount > 0 ? (currentCount / targetCount) * 100 : 0;
        
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">計數進度</span>
              <span className="font-medium">{currentCount}/{targetCount}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(countProgress, 100)}%` }}
              />
            </div>
          </div>
        );

      case 'streak':
        const currentStreak = (progressData as any).current_streak || 0;
        const maxStreak = (progressData as any).max_streak || 0;
        const targetDays = (config as any).target_days || 0;
        const streakProgress = targetDays > 0 ? (currentStreak / targetDays) * 100 : 0;
        
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">連續天數</span>
              <span className="font-medium">{currentStreak}/{targetDays}天</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(streakProgress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              最高紀錄: {maxStreak}天
            </div>
          </div>
        );

      case 'accumulative':
        const currentAmount = (progressData as any).current_amount || 0;
        const targetAmount = (config as any).target_amount || 0;
        const unit = (config as any).unit || '次';
        const accumProgress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
        
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">累計進度</span>
              <span className="font-medium">{currentAmount}/{targetAmount} {unit}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(accumProgress, 100)}%` }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    if (task.task_type === 'single') {
      return (
        <button
          onClick={() => handleTaskAction('complete')}
          disabled={isLoading || task.status === 'done'}
          className={`
            px-3 py-1 rounded-md text-sm font-medium transition-colors
            ${task.status === 'done' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50'
            }
          `}
        >
          {task.status === 'done' ? '已完成' : '完成'}
        </button>
      );
    }

    return (
      <div className="flex gap-2">
        {task.task_type === 'streak' && (
          <button
            onClick={() => handleTaskAction('check_in')}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded-md text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-800/50 transition-colors"
          >
            <Check className="w-3 h-3" />
            打卡
          </button>
        )}
        
        {task.task_type === 'count' && (
          <button
            onClick={() => handleTaskAction('add_count', { count: 1 })}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-md text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
          >
            <Plus className="w-3 h-3" />
            +1
          </button>
        )}
        
        {task.task_type === 'accumulative' && (
          <button
            onClick={() => handleTaskAction('add_amount', { amount: 1 })}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-md text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
          >
            <Plus className="w-3 h-3" />
            記錄
          </button>
        )}
        
        <button
          onClick={() => handleTaskAction('reset')}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const isValid = true; // 簡化驗證邏輯

  return (
    <div
      draggable={showDragHandle}
      onDragStart={handleDragStart}
      className={`
        group relative bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border 
        ${isValid 
          ? 'border-gray-200 dark:border-gray-700' 
          : 'border-amber-200 dark:border-amber-700'
        }
        hover:shadow-md transition-all duration-200
        min-h-[140px] max-h-[140px] flex flex-col
      `}
    >
      {/* 拖曳把手 */}
      {showDragHandle && (
        <div className="absolute left-2 top-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      )}

      <div className={showDragHandle ? "pl-6 flex-1 flex flex-col" : "flex-1 flex flex-col"}>
        {/* 標題和狀態 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`p-1 rounded ${getTaskTypeColor()}`}>
              {getTaskTypeIcon()}
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {task.title}
            </h4>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(task.status)}`}>
              {getStatusText(task.status)}
            </span>
            {!isValid && (
              <div className="text-amber-600 dark:text-amber-500">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* 描述 */}
        {task.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* 進度信息 */}
        <div className="mb-3 flex-1">
          {renderProgressInfo()}
        </div>

        {/* 操作按鈕和其他信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {renderActionButtons()}
          </div>
          
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            {task.cycle_config?.cycle_type !== 'none' && (
              <div className="flex items-center mr-2">
                <Clock className="w-3 h-3 mr-1" />
                <span>
                  {task.cycle_config.cycle_type === 'weekly' ? '週循環' : '月循環'}
                </span>
              </div>
            )}
            {(task.cycle_config as any)?.deadline && (
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{new Date((task.cycle_config as any).deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* 錯誤提示 */}
        {!isValid && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-500">
            前置任務尚未完成
          </div>
        )}

        {/* 懸浮操作按鈕 */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="p-1 text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(task.id)}
              className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 加載狀態覆蓋層 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default TaskCard; 