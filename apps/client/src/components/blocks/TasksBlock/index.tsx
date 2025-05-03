import React from 'react';
import { TasksBlockProps } from './types';
import { card, text, taskStyles } from '../../../styles/tokens';
import { getDueDateStyle } from '../../../utils/dateUtils';
import { formatDate } from '../../../utils/dateUtils';

export const TasksBlock: React.FC<TasksBlockProps> = ({ tasks }) => {
  return (
    <div className={`${card.base} p-4`}>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {task.title}
              </h3>
              <span className={getDueDateStyle(task.endDate, task.status)}>
                {formatDate(task.endDate)}
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