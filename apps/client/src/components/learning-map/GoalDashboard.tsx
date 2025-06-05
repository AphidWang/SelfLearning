import React from 'react';
import { Goal } from '../../types/goal';
import { subjects } from '../../styles/tokens';

interface GoalDashboardProps {
  goals: Goal[];
  onGoalClick: (goalId: string) => void;
}

export const GoalDashboard: React.FC<GoalDashboardProps> = ({ goals, onGoalClick }) => {
  const getCompletionRate = (goal: Goal) => {
    const totalTasks = goal.steps.reduce((sum, step) => sum + step.tasks.length, 0);
    const completedTasks = goal.steps.reduce(
      (sum, step) => sum + step.tasks.filter(task => task.status === 'done').length,
      0
    );
    return totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
  };

  const getSubjectGradient = (subject: string, progress: number) => {
    const style = subjects.getSubjectStyle(subject);
    const gradientPosition = 100 - (progress * 0.8);
    return `${style.gradient} bg-[length:200%_100%] bg-[position:${gradientPosition}%_50%]`;
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <div className="h-full bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {goals.map(goal => {
          const completionRate = getCompletionRate(goal);
          const gradient = getSubjectGradient(goal.subject || '未分類', completionRate);
          return (
            <button
              key={goal.id}
              onClick={() => onGoalClick(goal.id)}
              className={`relative p-4 rounded-lg bg-gradient-to-r ${gradient} hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 max-w-[200px] h-[80px]`}
            >
              <div className="flex items-start justify-between gap-2 h-full">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white line-clamp-2">
                    {goal.title}
                  </h3>
                </div>
                <div className="relative w-8 h-8 flex-shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeDasharray={`${completionRate}, 100`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {Math.round(completionRate)}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}; 