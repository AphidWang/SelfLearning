import React from 'react';
import { motion } from 'framer-motion';
import { Target, Play, Pause, CheckCircle2, Clock } from 'lucide-react';
import type { GoalStatus } from '../../../types/goal';

interface GoalStatusManagerProps {
  currentStatus: GoalStatus | undefined;
  onStatusChange: (status: GoalStatus) => Promise<void>;
  isUpdating?: boolean;
  className?: string;
}

export const GoalStatusManager: React.FC<GoalStatusManagerProps> = ({
  currentStatus = 'todo',
  onStatusChange,
  isUpdating = false,
  className = ''
}) => {
  const statusOptions: { 
    value: GoalStatus; 
    label: string; 
    color: string; 
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }[] = [
    { 
      value: 'todo', 
      label: '待開始', 
      color: 'bg-gray-100 text-gray-800 border-gray-300', 
      icon: Clock,
      description: '尚未開始的目標'
    },
    { 
      value: 'focus', 
      label: '專注中', 
      color: 'bg-blue-100 text-blue-800 border-blue-300', 
      icon: Target,
      description: '正在專注進行的主要目標'
    },
    { 
      value: 'pause', 
      label: '暫停中', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
      icon: Pause,
      description: '暫時停止但未完成的目標'
    },
    { 
      value: 'complete', 
      label: '已完成', 
      color: 'bg-green-100 text-green-800 border-green-300', 
      icon: CheckCircle2,
      description: '已經完全達成的目標'
    }
  ];

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">目標狀態</h4>
      <div className="space-y-2">
        {statusOptions.map(option => {
          const Icon = option.icon;
          const isSelected = currentStatus === option.value;
          
          return (
            <motion.button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              disabled={isUpdating}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                isSelected 
                  ? option.color + ' shadow-md'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={!isUpdating ? { scale: 1.02 } : {}}
              whileTap={!isUpdating ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  <Icon 
                    className={`w-4 h-4 ${
                      isSelected 
                        ? 'text-current' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${isSelected ? 'text-current' : 'text-gray-700 dark:text-gray-300'}`}>
                    {option.label}
                  </div>
                  <div className={`text-xs mt-0.5 ${isSelected ? 'text-current opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-current rounded-full"
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {isUpdating && (
        <div className="flex items-center justify-center mt-3 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
          更新中...
        </div>
      )}
    </div>
  );
}; 