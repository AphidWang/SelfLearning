import React from 'react';
import { subjects } from '../../styles/tokens';

interface GoalDashboardCardProps {
  title: string;
  subject: string;
  progress: number;
  onClick?: () => void;
}

export const GoalDashboardCard: React.FC<GoalDashboardCardProps> = ({ title, subject, progress, onClick }) => {
  const style = subjects.getSubjectStyle(subject);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 border-l-4 p-4 flex items-center gap-3 hover:shadow-lg transition h-[80px]`}
      style={{ 
        borderLeftColor: style.accent,
        background: `linear-gradient(to right, ${style.accent}10, ${style.accent}10)`
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {title}
        </div>
      </div>
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={style.accent}
            strokeWidth="3"
            strokeDasharray={`${progress}, 100`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">
          {progress}%
        </span>
      </div>
    </button>
  );
}; 