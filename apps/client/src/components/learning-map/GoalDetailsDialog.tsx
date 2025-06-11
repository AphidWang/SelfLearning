import React, { useState } from 'react';
import { Goal } from '../../types/goal';
import { GoalDetails } from './GoalDetails';
import { Pencil, Check, ChevronLeft } from 'lucide-react';

interface GoalDetailsDialogProps {
  goal: Goal;
  mapRect: { left: number; top: number; width: number; height: number };
  onClose: () => void;
  onBack: () => void;
  onTaskClick: (taskId: string) => void;
  isCreating?: boolean;
}

export const GoalDetailsDialog: React.FC<GoalDetailsDialogProps> = ({
  goal,
  mapRect,
  onClose,
  onBack,
  onTaskClick,
  isCreating = false
}) => {
  const [isEditing, setIsEditing] = useState(isCreating);

  return (
    <div
      className="fixed z-50"
      style={{
        left: mapRect.left + mapRect.width - 420,
        top: mapRect.top + 20,
        height: mapRect.height - 40,
      }}
    >
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-[400px] max-w-[90vw] flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <button
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={onBack}
              aria-label="返回"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300">學習目標詳情</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
                isEditing ? 'text-green-500 hover:bg-green-50' : ''
              }`}
              onClick={() => setIsEditing(!isEditing)}
              aria-label={isEditing ? '完成編輯' : '編輯'}
            >
              {isEditing ? <Check className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
            </button>
            <button
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={onClose}
              aria-label="關閉"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <GoalDetails
            goal={goal}
            onBack={onBack}
            onTaskClick={onTaskClick}
            isCreating={false}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
          />
        </div>
      </div>
    </div>
  );
}; 