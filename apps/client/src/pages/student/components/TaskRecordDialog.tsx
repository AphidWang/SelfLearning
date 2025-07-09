/**
 * TaskRecordDialog - 任務記錄對話框
 * 
 * 🎯 功能說明：
 * - 讓學生記錄學習心得和挑戰程度
 * - 支援留言、檔案上傳、難度選擇
 * - 顯示歷史記錄，自動載入上次難度
 * - 溫馨友善的介面設計
 * 
 * 🎨 視覺設計：
 * - 溫暖色調背景
 * - 卡通風格的難度選擇
 * - 友善的提示文字
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { TaskRecordForm } from '../../../components/shared/TaskRecordForm';
import { taskRecordStore } from '../../../store/taskRecordStore';

interface TaskRecord {
  id: string;
  created_at: string;
  title: string;
  message: string;
  difficulty: number;
  completion_time?: number;
  files?: any[];
  tags?: string[];
}

interface TaskRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description?: string;
    records?: any[];
  };
  onRecordSuccess?: () => void;
}

export const TaskRecordDialog: React.FC<TaskRecordDialogProps> = ({
  isOpen,
  onClose,
  task,
  onRecordSuccess
}) => {
  const [records, setRecords] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 載入該任務的歷史記錄
  useEffect(() => {
    if (!isOpen || !task.id) return;
    
    const loadRecords = async () => {
      setIsLoading(true);
      try {
        const taskRecords = await taskRecordStore.getUserTaskRecords({ task_id: task.id });
        setRecords(taskRecords || []);
      } catch (error) {
        console.error('載入記錄失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecords();
  }, [isOpen, task.id]);

  const handleSuccess = () => {
    onRecordSuccess?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 對話框內容 */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-xl max-h-[90vh] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-orange-200 dark:border-purple-500 flex flex-col"
      >
        {/* 標題欄 */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              ✨ 學習記錄
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {task.title}
              {records.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xs rounded-full">
                  已有 {records.length} 則記錄
                </span>
              )}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <X size={20} />
          </button>
        </div>

        {/* 表單內容 */}
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)] rounded-b-2xl">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              <span className="ml-3 text-gray-600 dark:text-gray-300">載入記錄中...</span>
            </div>
          ) : (
            <TaskRecordForm
              taskTitle={task.title}
              taskId={task.id}
              previousRecords={records}
              onSuccess={handleSuccess}
              onCancel={onClose}
              showCancelButton={true}
              showHistoryButton={true}
              buttonText="保存學習記錄"
            />
          )}
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}; 