import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { Goal, Step, Task } from '../../types/goal';

interface GoalDetailsProps {
  goal: Goal;
  onClose: () => void;
  onTaskClick: (taskId: string) => void;
}

export const GoalDetails: React.FC<GoalDetailsProps> = ({ goal, onClose, onTaskClick }) => {
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const getCompletionRate = (step: Step) => {
    const totalTasks = step.tasks.length;
    const completedTasks = step.tasks.filter(task => task.status === 'done').length;
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  return (
    <div className="h-full bg-white rounded-lg shadow flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">{goal.title}</h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label="關閉側邊欄"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">目標描述</h3>
          <p className="text-gray-700">{goal.description}</p>
        </div>

        <div className="space-y-4">
          {goal.steps.map(step => (
            <div key={step.id} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full p-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  {expandedSteps.includes(step.id) ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="ml-2 font-medium">{step.title}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    {getCompletionRate(step)}%
                  </span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${getCompletionRate(step)}%` }}
                    />
                  </div>
                </div>
              </button>

              {expandedSteps.includes(step.id) && (
                <div className="p-3 space-y-2">
                  {step.tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task.id)}
                      className="w-full flex items-center p-2 rounded hover:bg-gray-100 transition-colors"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      <span className={task.status === 'done' ? 'text-gray-500 line-through' : ''}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 