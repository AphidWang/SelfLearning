import React from 'react';
import { Trash2 } from 'lucide-react';
import { Task } from '../../../../../packages/types/src/task';
import { WeekPlan } from '../../../../../packages/types/src/planner';
import { usePlanner } from '../../context/PlannerContext';
import { useCurriculum } from '../../context/CurriculumContext';

interface WeeklyTaskColumnsProps {
  weeks: WeekPlan[];
  onAssignTask: (taskId: string, weekId: number) => void;
  onRemoveTask: (taskId: string, weekId: number) => void;
}

const WeeklyTaskColumns: React.FC<WeeklyTaskColumnsProps> = ({
  weeks,
  onAssignTask,
  onRemoveTask,
}) => {
  const { nodes } = useCurriculum();

  // 檢查任務是否已經在任何週中
  const isTaskAssigned = (taskId: string) => {
    return weeks.some(week => week.tasks.some(task => task.id === taskId));
  };

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {weeks.map((week) => (
        <div
          key={week.id}
          className="week-task-column bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex flex-col"
          onDragOver={(e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            if (!isTaskAssigned(taskId)) {
              e.currentTarget.classList.add('bg-gray-100', 'dark:bg-gray-700');
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              e.currentTarget.classList.remove('bg-gray-100', 'dark:bg-gray-700');
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-gray-100', 'dark:bg-gray-700');
            const taskId = e.dataTransfer.getData('text/plain');
            if (!isTaskAssigned(taskId)) {
              onAssignTask(taskId, week.id);
            }
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
              第 {week.id} 週
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {week.tasks.length} 個任務
            </span>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto">
            {week.tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded">
                        {task.subject}
                      </span>
                      {task.progress > 0 && (
                        <span className="text-xs text-gray-500">
                          {task.progress}%
                        </span>
                      )}
                      {task.endDate && (
                        <span className="text-xs text-gray-500">
                          截止: {new Date(task.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveTask(task.id, week.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeeklyTaskColumns; 