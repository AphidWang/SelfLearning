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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 對話框內容 */}
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col">
        {/* 標題欄 */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              ✨ 學習記錄
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {task.title}
              {records.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  已有 {records.length} 則記錄
                </span>
              )}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 表單內容 */}
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)] rounded-b-2xl">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span className="ml-3 text-gray-600">載入記錄中...</span>
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
      </div>
    </div>
  );
}; 