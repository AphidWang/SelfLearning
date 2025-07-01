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

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, Heart, Smile, Frown, MessageCircle, 
  Camera, FileText, Star, Sparkles
} from 'lucide-react';
import { taskRecordStore, CreateTaskRecordData } from '../../../store/taskRecordStore';

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
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!message.trim()) {
      alert('請寫下一些學習心得再送出喔！ 😊');
      return;
    }

    setIsSaving(true);
    try {
      const recordData: CreateTaskRecordData = {
        title: taskTitle,
        difficulty,
        message: message.trim(),
        files: files.length > 0 ? files : undefined,
        topic_id,
        task_id,
        task_type,
        completion_time,
        tags
      };

      await taskRecordStore.createTaskRecord(recordData);
      
      // 重置表單
      setDifficulty('medium');
      setMessage('');
      setFiles([]);
      
      // 成功回調
      onSuccess?.();
      onClose();
      
      // 顯示成功訊息
      alert('學習記錄保存成功！ 🎉');
    } catch (error) {
      console.error('保存記錄失敗:', error);
      alert('保存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  }, [difficulty, message, files, taskTitle, topic_id, task_id, task_type, completion_time, tags, onSuccess, onClose]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles].slice(0, 3)); // 最多3個檔案
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const difficultyOptions = [
    {
      value: 'easy' as const,
      label: '很簡單',
      emoji: '😄',
      color: 'bg-green-100 text-green-700 border-green-300',
      activeColor: 'bg-green-200 border-green-400'
    },
    {
      value: 'medium' as const,
      label: '剛剛好',
      emoji: '😊',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      activeColor: 'bg-yellow-200 border-yellow-400'
    },
    {
      value: 'hard' as const,
      label: '有挑戰',
      emoji: '🤔',
      color: 'bg-red-100 text-red-700 border-red-300',
      activeColor: 'bg-red-200 border-red-400'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden w-full sm:w-[95vw] lg:w-[60vw] flex flex-col"
            style={{
              maxWidth: '1200px',
              minWidth: '320px',
              background: 'linear-gradient(135deg, #fefdf8 0%, #faf7f0 50%, #f7f3e9 100%)'
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* 標題區 */}
            <div className="flex-shrink-0 relative p-4 sm:p-6 lg:p-8 pb-4 border-b border-amber-200/50">
              <div className="absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-8">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="pr-12 sm:pr-16 lg:pr-20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg lg:text-xl font-bold text-amber-900">
                    學習記錄
                  </h3>
                </div>
                <p className="text-sm lg:text-base text-amber-700">
                  {taskTitle}
                </p>
              </div>
            </div>

            {/* 內容區 */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                {/* 左欄：難度選擇 */}
                <div className="lg:col-span-1">
                  <div className="space-y-6">
                    {/* 難度選擇 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        這個任務對你來說：
                      </h4>
                      <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
                        {difficultyOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setDifficulty(option.value)}
                            className={`p-3 lg:p-4 rounded-xl border-2 transition-all text-center ${
                              difficulty === option.value 
                                ? option.activeColor 
                                : option.color
                            }`}
                          >
                            <div className="text-2xl lg:text-3xl mb-1 lg:mb-2">{option.emoji}</div>
                            <div className="text-xs lg:text-sm font-medium">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 檔案上傳 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-green-500" />
                        上傳照片或檔案：
                        <span className="text-xs text-gray-500">(選填，最多3個)</span>
                      </h4>
                      
                      {/* 上傳按鈕 */}
                      <label className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            點擊上傳檔案
                          </p>
                          <p className="text-xs text-gray-500">
                            支援圖片、文件等
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>

                      {/* 已選檔案列表 */}
                      {files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {files.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700 flex-1 truncate">
                                {file.name}
                              </span>
                              <button
                                onClick={() => removeFile(index)}
                                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                              >
                                <X className="w-3 h-3 text-gray-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右欄：學習心得 */}
                <div className="lg:col-span-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      分享你的學習心得：
                    </h4>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="寫下你的想法、學到了什麼、遇到什麼困難... 😊

這裡可以寫很多內容：
• 今天學到了什麼新東西？
• 有什麼地方覺得困難嗎？
• 你是怎麼解決問題的？
• 有什麼心得想要分享？"
                      className="w-full h-40 lg:h-64 p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm leading-relaxed"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-right">
                      {message.length}/500 字
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按鈕 */}
            <div className="flex-shrink-0 p-4 sm:p-6 lg:p-8 pt-4 border-t border-amber-200/50 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex justify-end gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !message.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      保存記錄
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 