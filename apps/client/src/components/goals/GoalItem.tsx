import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { Goal, Task } from '../../types/goal';
import { TaskItem } from './TaskItem';

interface GoalItemProps {
  goal: Goal;
  isExpanded: boolean;
  onToggle: () => void;
  onTaskStatusChange: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
  onAddTask: () => void;
}

export const GoalItem: React.FC<GoalItemProps> = ({
  goal,
  isExpanded,
  onToggle,
  onTaskStatusChange,
  onTaskEdit,
  onAddTask
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <button
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
        onClick={onToggle}
      >
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
          )}
          <span className="font-medium text-gray-900 dark:text-white">{goal.title}</span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {goal.tasks.filter((t) => t.status === 'done').length} /{' '}
          {goal.tasks.length} 個任務
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {goal.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onStatusChange={() => onTaskStatusChange(task)}
                  onEdit={() => onTaskEdit(task)}
                />
              ))}
              <button
                onClick={onAddTask}
                className="w-full mt-2 py-2 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                新增任務
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 