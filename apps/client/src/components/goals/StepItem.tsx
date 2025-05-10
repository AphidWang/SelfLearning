import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { Step, Task } from '../../types/goal';
import { TaskItem } from './TaskItem';

interface StepItemProps {
  step: Step;
  isExpanded: boolean;
  onToggle: () => void;
  onTaskStatusChange: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
  onAddTask: () => void;
}

export const StepItem: React.FC<StepItemProps> = ({
  step,
  isExpanded,
  onToggle,
  onTaskStatusChange,
  onTaskEdit,
  onAddTask
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <button
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        onClick={onToggle}
      >
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400 mr-2" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />
          )}
          <span className="font-medium text-gray-900">{step.title}</span>
        </div>
        <span className="text-sm text-gray-500">
          {step.tasks.filter((t) => t.status === 'done').length} /{' '}
          {step.tasks.length} 個任務
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
              {step.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onStatusChange={() => onTaskStatusChange(task)}
                  onEdit={() => onTaskEdit(task)}
                />
              ))}
              <button
                onClick={onAddTask}
                className="w-full mt-2 py-2 flex items-center justify-center text-sm text-gray-500 hover:text-gray-700"
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