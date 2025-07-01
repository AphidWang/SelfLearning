/**
 * TaskRecordDialog - 任務記錄對話框
 * 
 * 🎯 功能說明：
 * - 讓學生記錄學習心得和挑戰程度
 * - 支援留言、檔案上傳、難度選擇
 * - 溫馨友善的介面設計
 * 
 * 🎨 視覺設計：
 * - 溫暖色調背景
 * - 卡通風格的難度選擇
 * - 友善的提示文字
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { TaskRecordForm } from '../../../components/shared/TaskRecordForm';

interface TaskRecordDialogProps {
  isOpen: boolean;
  taskTitle: string;
  onClose: () => void;
  onSuccess?: () => void; // 成功後的回調
  // 任務相關資訊
  topic_id?: string;
  task_id?: string;
  task_type?: string;
  completion_time?: number; // 完成時間（分鐘）
  tags?: string[];
}

export const TaskRecordDialog: React.FC<TaskRecordDialogProps> = ({
  isOpen,
  taskTitle,
  onClose,
  onSuccess,
  topic_id,
  task_id,
  task_type,
  completion_time,
  tags
}) => {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden w-full max-w-2xl flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* 標題區 */}
            <div className="flex-shrink-0 relative p-6 border-b border-gray-200">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              
              <div className="pr-16">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  學習記錄
                </h3>
                <p className="text-sm text-gray-600">
                  {taskTitle}
                </p>
              </div>
            </div>

            {/* 內容區 */}
            <div className="flex-1 overflow-y-auto p-6">
              <TaskRecordForm
                taskTitle={taskTitle}
                taskId={task_id}
                topicId={topic_id}
                onSuccess={handleSuccess}
                onCancel={onClose}
                showCancelButton={true}
                buttonText="保存學習記錄"
                className="max-w-none"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 