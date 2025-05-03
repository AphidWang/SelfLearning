import React from 'react';
import { CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import type { ActionItem as ActionItemType } from '../../types/goal';

interface ActionItemProps {
  item: ActionItemType;
  onAddToSchedule: () => void;
}

export const ActionItem: React.FC<ActionItemProps> = ({ item, onAddToSchedule }) => {
  return (
    <div className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
      <div className="flex-shrink-0 mr-3">
        {item.status === 'done' ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : item.status === 'in-progress' ? (
          <AlertCircle className="h-5 w-5 text-orange-500" />
        ) : (
          <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${
          item.status === 'done'
            ? 'text-gray-500 dark:text-gray-400 line-through'
            : 'text-gray-900 dark:text-white'
        }`}>
          {item.description}
        </p>
        <div className="mt-1 flex items-center space-x-3 text-sm">
          {item.estimatedTime && (
            <span className="text-gray-500 dark:text-gray-400">
              預計 {item.estimatedTime}
            </span>
          )}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            item.priority === 'high'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              : item.priority === 'medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
          }`}>
            {item.priority === 'high' ? '優先' : item.priority === 'medium' ? '一般' : '次要'}
          </span>
        </div>
      </div>
      {!item.addedToSchedule && (
        <button
          onClick={onAddToSchedule}
          className="ml-4 inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
        >
          <Calendar className="h-3 w-3 mr-1" />
          加入課表
        </button>
      )}
    </div>
  );
}; 