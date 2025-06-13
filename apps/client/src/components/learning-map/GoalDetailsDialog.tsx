import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Goal } from '../../types/goal';
import { GoalDetails } from './GoalDetails';
import { Pencil, Check } from 'lucide-react';
import { subjects } from '../../styles/tokens';

interface GoalDetailsDialogProps {
  goal: Goal;
  onClose: () => void;
  onBack: () => void;
  onTaskClick: (taskId: string) => void;
  isCreating?: boolean;
}

export const GoalDetailsDialog: React.FC<GoalDetailsDialogProps> = ({
  goal,
  onClose,
  onBack,
  onTaskClick,
  isCreating = false
}) => {
  const [isEditing, setIsEditing] = useState(isCreating);
  const subjectStyle = subjects.getSubjectStyle(goal.subject || '');

  return (
    <motion.div 
      className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 p-6 w-[380px] max-w-[90vw] flex flex-col h-[520px] relative overflow-hidden"
      style={{ 
        borderColor: subjectStyle.accent,
        boxShadow: `0 20px 40px ${subjectStyle.accent}25, 0 0 0 1px ${subjectStyle.accent}20`
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* 背景裝飾 */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${subjectStyle.accent}40 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${subjectStyle.accent}30 0%, transparent 50%)`
        }}
      />

      <div className="flex justify-between items-center mb-4 select-none relative z-10" data-draggable-header>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 line-clamp-2 pr-6">
          {goal.title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
              isEditing ? 'text-green-500 hover:bg-green-50' : ''
            }`}
            onClick={() => setIsEditing(!isEditing)}
            aria-label={isEditing ? '完成編輯' : '編輯'}
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
          <button
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onClose}
            aria-label="關閉"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto relative z-10">
        <GoalDetails
          goal={goal}
          onBack={onBack}
          onTaskClick={onTaskClick}
          isCreating={false}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
        />
      </div>
    </motion.div>
  );
}; 