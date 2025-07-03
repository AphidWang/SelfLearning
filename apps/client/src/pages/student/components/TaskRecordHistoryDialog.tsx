/**
 * TaskRecordHistoryDialog - 任務記錄歷史對話框
 * 
 * 🎯 功能說明：
 * - 顯示任務的所有學習記錄歷史
 * - 支援記錄的展開/收起
 * - 顯示每條記錄的詳細資訊
 * 
 * 🎨 視覺設計：
 * - 簡潔的時間軸設計
 * - 溫暖的配色方案
 * - 友善的動畫效果
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Star, Clock, FileText } from 'lucide-react';
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

interface TaskRecordHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    records?: TaskRecord[];
    topicTitle?: string;
    subjectStyle?: any;
  };
}

export const TaskRecordHistoryDialog: React.FC<TaskRecordHistoryDialogProps> = ({
  isOpen,
  onClose,
  task
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 對話框內容 */}
      <div className="relative w-full max-w-xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col">
        {/* 標題欄 */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <div 
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: task.subjectStyle?.accent + '20' || '#6366f120',
                  color: task.subjectStyle?.accent || '#6366f1'
                }}
              >
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {task.topicTitle || '未分類'}
                </div>
              </div>
              <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                {records.length} 則記錄
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-1">
              {task.title}
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 記錄內容區域 */}
        <div className="overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span className="ml-3 text-gray-600">載入記錄中...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record, index) => (
                <div 
                  key={record.id}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-3 shadow-sm"
                >
                  {/* 時間和難度 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <time className="text-xs">
                        {new Date(record.created_at).toLocaleDateString('zh-TW', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: record.difficulty }).map((_, i) => (
                        <Star 
                          key={i}
                          className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                        />
                      ))}
                    </div>
                  </div>

                  {/* 記錄內容 */}
                  <div className="bg-white dark:bg-gray-800 rounded-md p-2.5 mb-2">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
                      {record.message}
                    </p>
                  </div>

                  {/* 標籤和附件 */}
                  {((record.tags && record.tags.length > 0) || (record.files && record.files.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5">
                      {record.tags?.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {record.files && record.files.length > 0 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs">
                          <FileText className="w-3 h-3" />
                          {record.files.length} 個附件
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 