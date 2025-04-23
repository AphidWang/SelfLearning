import React from 'react';
import { TasksBlockProps } from './types';
import { card, text } from '../../../styles/tokens';

export const TasksBlock: React.FC<TasksBlockProps> = ({ tasks }) => {
  const getDueDateStyle = (dueDate: string) => {
    switch (dueDate) {
      case '今天':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case '明天':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  return (
    <div className={`${card.base} p-4`}>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {task.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getDueDateStyle(task.dueDate)}`}>
                {task.dueDate}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {task.students.map((student, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                >
                  {student}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 