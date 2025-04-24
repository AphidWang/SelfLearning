import React from 'react';
import { Task, TaskStatus } from '../../types/task';
import { usePlanner } from '../../context/PlannerContext';
import { Calendar, AlertTriangle, GripVertical, Edit2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  weekId: number;
  onEdit?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, weekId, onEdit }) => {
  const { removeTaskFromWeek, isTaskAssignable } = usePlanner();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('sourceWeekId', weekId.toString());
  };

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'waiting_feedback':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '進行中';
      case 'waiting_feedback':
        return '待回饋';
      default:
        return '未開始';
    }
  };

  const isValid = isTaskAssignable(task.id, weekId);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`
        group relative bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border 
        ${isValid 
          ? 'border-gray-200 dark:border-gray-700' 
          : 'border-amber-200 dark:border-amber-700'
        }
        hover:shadow-md transition-shadow duration-200
      `}
    >
      {/* 拖曳把手 */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <div className="pl-6">
        {/* 標題和狀態 */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {task.title}
          </h4>
          <div className="flex items-center space-x-2">
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
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
          {task.description}
        </p>

        {/* 進度條 */}
        {task.progress > 0 && (
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
            <div 
              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        )}

        {/* 獎勵和截止日期 */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {task.rewards?.map((reward, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300"
              >
                {reward.value} {reward.type}
              </span>
            ))}
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{new Date(task.endDate).toLocaleDateString()}</span>
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
          <button
            onClick={() => removeTaskFromWeek(task.id, weekId)}
            className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard; 