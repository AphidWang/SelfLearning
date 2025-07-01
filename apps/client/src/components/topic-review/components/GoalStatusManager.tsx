import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Play, Pause, CheckCircle2, Clock, ChevronDown, AlertTriangle } from 'lucide-react';
import type { GoalStatus } from '../../../types/goal';

interface GoalStatusManagerProps {
  currentStatus: GoalStatus | undefined;
  onStatusChange: (status: GoalStatus) => Promise<void>;
  isUpdating?: boolean;
  className?: string;
  totalTasks?: number;
  completedTasks?: number;
}

export const GoalStatusManager: React.FC<GoalStatusManagerProps> = ({
  currentStatus = 'todo',
  onStatusChange,
  isUpdating = false,
  className = '',
  totalTasks = 0,
  completedTasks = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions: { 
    value: GoalStatus; 
    label: string; 
    color: string; 
    bgColor: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }[] = [
    { 
      value: 'todo', 
      label: '待開始', 
      color: 'text-gray-800', 
      bgColor: 'bg-gray-100',
      icon: Clock,
      description: '尚未開始的目標'
    },
    { 
      value: 'focus', 
      label: '專注中', 
      color: 'text-blue-800', 
      bgColor: 'bg-blue-100',
      icon: Target,
      description: '正在專注進行的主要目標'
    },
    { 
      value: 'pause', 
      label: '暫停中', 
      color: 'text-yellow-800', 
      bgColor: 'bg-yellow-100',
      icon: Pause,
      description: '暫時停止但未完成的目標'
    },
    { 
      value: 'complete', 
      label: '已完成', 
      color: 'text-green-800', 
      bgColor: 'bg-green-100',
      icon: CheckCircle2,
      description: '已經完全達成的目標'
    }
  ];

  const currentOption = statusOptions.find(option => option.value === currentStatus) || statusOptions[0];
  const CurrentIcon = currentOption.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStatusSelect = async (status: GoalStatus) => {
    if (status === 'complete' && totalTasks > 0 && completedTasks < totalTasks) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
    
    setIsOpen(false);
    await onStatusChange(status);
  };

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">目標狀態</h4>
      
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
          >
            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">提醒</span>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
              還有 {totalTasks - completedTasks} 個任務未完成，確定要標記為完成嗎？
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isUpdating}
          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
            currentOption.bgColor
          } ${currentOption.color} border-gray-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-white/20">
              <CurrentIcon className="w-4 h-4 text-current" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-current">
                {currentOption.label}
              </div>
              <div className="text-xs mt-0.5 text-current opacity-80">
                {currentOption.description}
              </div>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-current" />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden"
            >
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = currentStatus === option.value;
                
                if (isSelected) return null;
                
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => handleStatusSelect(option.value)}
                    disabled={isUpdating}
                    className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                        <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-700 dark:text-gray-300">
                          {option.label}
                        </div>
                        <div className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
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