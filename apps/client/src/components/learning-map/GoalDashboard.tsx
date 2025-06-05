import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target } from 'lucide-react';
import { Goal, Task } from '../../types/goal';

interface GoalDashboardProps {
  goals: Goal[];
  onGoalClick: (goalId: string) => void;
}

export const GoalDashboard: React.FC<GoalDashboardProps> = ({ goals, onGoalClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {goals.map((goal) => (
        <motion.div
          key={goal.id}
          className="bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.02 }}
          onClick={() => onGoalClick(goal.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
              <div className="flex items-center mt-2">
                <BookOpen size={16} className="text-indigo-500 mr-1" />
                <span className="text-sm text-gray-600">{goal.subject}</span>
              </div>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="3"
                  strokeDasharray={`${goal.steps.every(step => step.tasks.every(task => task.status === 'done')) ? 100 : 0}, 100`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                {Math.round(goal.steps.every(step => step.tasks.every(task => task.status === 'done')) ? 100 : 0)}%
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Target size={16} className="text-indigo-500 mr-1" />
            <span className="text-sm text-gray-600">
              {goal.steps.flatMap(step => step.tasks).filter(t => t.status === 'done').length} / {goal.steps.flatMap(step => step.tasks).length} 任務完成
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}; 