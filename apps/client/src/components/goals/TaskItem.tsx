import React from 'react';
import { CheckCircle2, Circle, Clock, Flag, User, Edit2 } from 'lucide-react';
import type { Task } from '../../types/goal';
import { format } from 'date-fns';

interface TaskItemProps {
  task: Task;
  onStatusChange: () => void;
  onEdit: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onStatusChange, onEdit }) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-error-500';
      case 'medium':
        return 'text-warning-500';
      case 'low':
        return 'text-success-500';
      default:
        return 'text-gray-500';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'explore':
        return 'bg-primary-100 text-primary-700';
      case 'work':
        return 'bg-secondary-100 text-secondary-700';
      case 'present':
        return 'bg-accent-100 text-accent-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex items-center p-2 hover:bg-gray-50 rounded-md">
      <div 
        onClick={onStatusChange} 
        className="mr-3 flex-shrink-0 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onStatusChange();
          }
        }}
      >
        {task.status === 'done' ? (
          <CheckCircle2 className="h-5 w-5 text-success-500" />
        ) : (
          <Circle className="h-5 w-5 text-gray-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
          {task.title}
        </p>
        <div className="flex items-center space-x-4 mt-1">
          {task.dueDate && (
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(task.dueDate), 'MM/dd')}
            </div>
          )}
          {task.priority && (
            <div className={`flex items-center text-xs ${getPriorityColor(task.priority)}`}>
              <Flag className="h-3 w-3 mr-1" />
              {task.priority}
            </div>
          )}
          {task.role && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(task.role)}`}>
              <User className="h-3 w-3 mr-1" />
              {task.role}
            </span>
          )}
        </div>
      </div>

      <div 
        onClick={onEdit} 
        className="ml-2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onEdit();
          }
        }}
      >
        <Edit2 className="h-4 w-4" />
      </div>
    </div>
  );
}; 