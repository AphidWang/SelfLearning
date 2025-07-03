/**
 * TaskRecordForm - 通用任務記錄表單組件
 * 
 * 🎯 功能說明：
 * - 通用的學習記錄表單，可在多個地方復用
 * - 支援挑戰程度選擇、學習心得輸入、檔案上傳
 * - 顯示歷史記錄，並自動載入上次的難度設定
 * - 直接集成 taskRecordStore 進行資料存儲
 * 
 * 🎨 設計特色：
 * - 單欄垂直佈局，歷史記錄可展開收起
 * - 響應式佈局
 * - 統一的視覺風格
 * 
 * 📍 使用場景：
 * - TaskRecordInterface（DetailsPanel 中）
 * - TaskDetailsDialog 背面
 * - TaskWall 的記錄功能
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Paperclip, PenTool, Star, Zap, X
} from 'lucide-react';
import { taskRecordStore, CreateTaskRecordData } from '../../store/taskRecordStore';
import { RecordHistory } from './RecordHistory';

// 挑戰程度類型，使用 1-5 數字等級
type ChallengeLevel = 1 | 2 | 3 | 4 | 5;

// 任務記錄接口
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

interface TaskRecordFormProps {
  // 任務資訊
  taskTitle: string;
  taskId?: string;
  topicId?: string;
  goalId?: string;
  
  // 歷史記錄
  previousRecords?: TaskRecord[];
  
  // 回調函數
  onSuccess?: () => void;
  onCancel?: () => void;
  
  // 可選的初始值
  initialChallenge?: ChallengeLevel;
  initialMessage?: string;
  
  // 樣式和行為
  className?: string;
  showCancelButton?: boolean;
  buttonText?: string;
  showHistoryButton?: boolean; // 是否顯示歷史記錄按鈕
  
  // 狀態處理按鈕
  showStatusButtons?: boolean;
  onStatusUpdate?: (status: 'in_progress' | 'done') => void;
  isUpdating?: boolean;
}

export const TaskRecordForm: React.FC<TaskRecordFormProps> = ({
  taskTitle,
  taskId,
  topicId,
  goalId,
  previousRecords = [],
  onSuccess,
  onCancel,
  initialChallenge,
  initialMessage = '',
  className = '',
  showCancelButton = false,
  buttonText = '保存學習記錄',
  showHistoryButton = true,
  showStatusButtons = false,
  onStatusUpdate,
  isUpdating = false
}) => {
  // 自動設定上次的難度
  const lastDifficulty = previousRecords.length > 0 
    ? (previousRecords[0].difficulty as ChallengeLevel) 
    : initialChallenge;

  const [challenge, setChallenge] = useState<ChallengeLevel | undefined>(lastDifficulty);
  const [comment, setComment] = useState(initialMessage);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(async () => {
    if (!comment.trim()) {
      alert('請寫下一些學習心得再送出喔！ 😊');
      return;
    }

    if (!challenge) {
      alert('請選擇挑戰程度再送出喔！ 😊');
      return;
    }

    setIsSaving(true);
    try {
      const recordData: CreateTaskRecordData = {
        title: taskTitle,
        difficulty: challenge,
        message: comment.trim(),
        files: attachments.length > 0 ? attachments : undefined,
        topic_id: topicId,
        task_id: taskId,
        task_type: 'task',
        completion_time: Math.floor(Date.now() / 1000),
        tags: [
          `難度${challenge}星`,
          ...(attachments.length > 0 ? ['有附件'] : []),
          comment.length > 500 ? '詳細記錄' : '簡短記錄'
        ]
      };

      await taskRecordStore.createTaskRecord(recordData);
      
      // 重置表單，但保留難度設定
      setComment('');
      setAttachments([]);
      
      // 成功回調
      onSuccess?.();
      
      // 顯示成功訊息
      alert('學習記錄保存成功！ 🎉');
    } catch (error) {
      console.error('保存記錄失敗:', error);
      alert('保存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  }, [challenge, comment, attachments, taskTitle, topicId, taskId, onSuccess]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={`space-y-4 p-4 pb-6 ${className}`}>
      {/* 挑戰程度 */}
      <div className="p-3 bg-gradient-to-br from-orange-50/90 to-red-50/90 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-orange-600 dark:text-orange-400" />
          <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300">挑戰程度</h4>
          {lastDifficulty && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
              上次：{lastDifficulty}星
            </span>
          )}
        </div>
        <div className="flex justify-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i}
              onClick={() => setChallenge((i + 1) as ChallengeLevel)}
              className="p-1.5 rounded-lg transition-all hover:scale-110 hover:bg-white/40 dark:hover:bg-gray-800/40"
            >
              <Star 
                size={20} 
                className={challenge && i < challenge ? 'text-orange-500' : 'text-gray-300'} 
                fill={challenge && i < challenge ? 'currentColor' : 'none'}
              />
            </button>
          ))}
        </div>
        {challenge && (
          <p className="text-center text-xs text-orange-700 dark:text-orange-300 mt-1 font-medium">
            {challenge === 1 && "很簡單 😊"}
            {challenge === 2 && "有點簡單 🙂"}
            {challenge === 3 && "剛剛好 😐"}
            {challenge === 4 && "有點困難 😅"}
            {challenge === 5 && "很有挑戰 😤"}
          </p>
        )}
      </div>

      {/* 學習心得 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <PenTool size={14} className="text-purple-600 dark:text-purple-400" />
          <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300">學習心得</h4>
        </div>
        <div className="relative">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="今天學到了什麼？有什麼想法想記錄下來嗎？✨"
            className="w-full min-h-[100px] p-3 text-sm border-2 border-purple-200/60 dark:border-purple-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm resize-none transition-all hover:border-purple-300 dark:hover:border-purple-600"
          />
        </div>
      </div>

      {/* 附件區域 */}
      <div className="p-2 bg-gray-50/80 dark:bg-gray-900/40 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">附件</h4>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            <Paperclip size={16} />
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />

        {attachments.length > 0 ? (
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded text-sm">
                <span className="truncate flex-1">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
            點擊附件圖標來上傳檔案
          </div>
        )}
      </div>

      {/* 歷史記錄區域 */}
      {showHistoryButton && previousRecords.length > 0 && (
        <div className="border-t pt-3">
          {!showHistory ? (
            <div className="text-center">
              <button
                onClick={() => setShowHistory(true)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors px-4 py-1.5 rounded-lg hover:bg-blue-50"
              >
                看看之前的記錄 ({previousRecords.length} 則)
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <RecordHistory
                records={previousRecords}
                initiallyExpanded={true}
                maxInitialItems={10}
              />
              <div className="text-center mt-3">
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  收起歷史記錄
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* 按鈕組 */}
      <div className="flex gap-3 pt-4 mt-2 border-t">
        {(showCancelButton || showStatusButtons) && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all shadow-md"
          >
            返回
          </button>
        )}

        {showStatusButtons ? (
          <>
            <button
              onClick={() => onStatusUpdate?.('in_progress')}
              disabled={isUpdating}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 text-white rounded-xl hover:from-blue-500 hover:via-indigo-600 hover:to-purple-600 transition-all shadow-md disabled:opacity-50"
            >
              {isUpdating ? '更新中...' : '進行中'}
            </button>
            <button
              onClick={() => onStatusUpdate?.('done')}
              disabled={isUpdating}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white rounded-xl hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-600 transition-all shadow-md disabled:opacity-50"
            >
              {isUpdating ? '更新中...' : '完成'}
            </button>
          </>
        ) : (
          <button
            onClick={handleSave}
            disabled={isSaving || !comment.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white rounded-xl hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />
                保存中...
              </>
            ) : (
              buttonText
            )}
          </button>
        )}
      </div>
    </div>
  );
}; 