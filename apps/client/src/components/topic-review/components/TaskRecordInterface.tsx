import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Sparkles } from 'lucide-react';
import type { Task, TaskStatus } from '../../../types/goal';
import { TaskRecordForm } from '../../shared/TaskRecordForm';

interface TaskRecordInterfaceProps {
  task: Task;
  onStatusUpdate: (status: TaskStatus) => Promise<void>;
  onBack: () => void;
  isUpdating?: boolean;
  topicId?: string;
  goalId?: string;
}

export const TaskRecordInterface: React.FC<TaskRecordInterfaceProps> = ({
  task,
  onStatusUpdate,
  onBack,
  isUpdating = false,
  topicId,
  goalId
}) => {
  const [showStatusButtons, setShowStatusButtons] = useState(false);

  // 記錄成功後的回調
  const handleRecordSuccess = () => {
    setShowStatusButtons(true);
  };

  return (
    <motion.div 
      className="flex flex-col h-full relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 固定標題區 */}
      <div className="flex-shrink-0 p-4 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <button
            className="p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
            onClick={onBack}
            aria-label="返回任務詳情"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Sparkles className="w-4 h-4 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">學習記錄</h3>
        </div>
      </div>

      {/* 可滾動內容區 */}
      <div className="flex-1 overflow-y-auto p-4">
        <TaskRecordForm
          taskTitle={task.title}
          taskId={task.id}
          topicId={topicId}
          goalId={goalId}
          onSuccess={handleRecordSuccess}
          showStatusButtons={showStatusButtons}
          onStatusUpdate={onStatusUpdate}
          isUpdating={isUpdating}
          showCancelButton={true}
          onCancel={onBack}
          buttonText="保存學習記錄"
        />
      </div>
    </motion.div>
  );
}; 