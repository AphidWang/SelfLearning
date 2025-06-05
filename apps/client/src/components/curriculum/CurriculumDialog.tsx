import React from 'react';
import { useGoalStore } from '../../store/goalStore';
import type { Task } from '../../types/goal';

interface CurriculumDialogProps {
  goalId: string;
  onClose: () => void;
}

const CurriculumDialog: React.FC<CurriculumDialogProps> = ({ goalId, onClose }) => {
  const { goals, updateTask } = useGoalStore();
  const goal = goals.find(g => g.id === goalId);

  if (!goal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
          <p className="mb-4 text-gray-700 dark:text-gray-200">找不到對應的課綱</p>
          <button
            onClick={onClose}
            className="mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md"
          >
            關閉
          </button>
        </div>
      </div>
    );
  }

  const toggleTaskStatus = (stepId: string, task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask(goal.id, stepId, { ...task, status: newStatus });
  };

  const editTaskTitle = (stepId: string, task: Task) => {
    const title = window.prompt('修改任務名稱', task.title);
    if (title !== null && title !== task.title) {
      updateTask(goal.id, stepId, { ...task, title });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 max-h-[80vh] overflow-y-auto w-full max-w-2xl p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{goal.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        {goal.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-6">{goal.description}</p>
        )}
        <div className="space-y-6">
          {goal.steps.map(step => (
            <div key={step.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">{step.title}</h3>
              <ul className="space-y-2">
                {step.tasks.map(task => (
                  <li key={task.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={task.status === 'done'}
                        onChange={() => toggleTaskStatus(step.id, task)}
                      />
                      <span className={`text-sm ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>{task.title}</span>
                    </div>
                    <button
                      onClick={() => editTaskTitle(step.id, task)}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      編輯
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurriculumDialog;
