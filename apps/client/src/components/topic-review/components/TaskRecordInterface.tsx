import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, PenTool, Mic, ChevronLeft, Sparkles } from 'lucide-react';
import type { Task, TaskStatus } from '../../../types/goal';

interface TaskRecordInterfaceProps {
  task: Task;
  onStatusUpdate: (status: TaskStatus) => Promise<void>;
  onBack: () => void;
  isUpdating?: boolean;
}

export const TaskRecordInterface: React.FC<TaskRecordInterfaceProps> = ({
  task,
  onStatusUpdate,
  onBack,
  isUpdating = false
}) => {
  const [challenge, setChallenge] = useState<1 | 2 | 3 | 4 | 5 | undefined>(
    task.challenge as 1 | 2 | 3 | 4 | 5 | undefined
  );
  const [comment, setComment] = useState('');

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
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* 挑戰程度 */}
        <div className="p-3 bg-gradient-to-br from-orange-50/90 to-red-50/90 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl border border-orange-200/50 dark:border-orange-700/50 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="text-orange-600 dark:text-orange-400" />
            <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300">挑戰程度</h4>
          </div>
          <div className="flex justify-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <button
                key={i}
                onClick={() => setChallenge((i + 1) as 1 | 2 | 3 | 4 | 5)}
                className="p-1 rounded-lg transition-all hover:scale-110 hover:bg-white/40 dark:hover:bg-gray-800/40"
              >
                <Star 
                  size={16} 
                  className={challenge && i < challenge ? 'text-orange-500' : 'text-gray-300'} 
                  fill={challenge && i < challenge ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>
          {challenge && (
            <p className="text-center text-xs text-orange-700 dark:text-orange-300 mt-1 font-medium">
              {challenge === 1 && "很簡單"}
              {challenge === 2 && "有點簡單"}
              {challenge === 3 && "剛剛好"}
              {challenge === 4 && "有點困難"}
              {challenge === 5 && "很有挑戰"}
            </p>
          )}
        </div>

        {/* 心得輸入 */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 px-1">
            <PenTool size={14} className="text-purple-600 dark:text-purple-400" />
            <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300">學習心得</h4>
          </div>
          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="今天學到了什麼？有什麼想法想記錄下來嗎？✨"
              className="w-full h-24 p-3 text-xs border-2 border-purple-200/60 dark:border-purple-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm resize-none transition-all hover:border-purple-300 dark:hover:border-purple-600"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(168, 85, 247, 0.02) 0%, rgba(236, 72, 153, 0.02) 100%)'
              }}
            />
            <button 
              className="absolute bottom-2 right-2 p-1.5 rounded-lg hover:bg-purple-100/80 dark:hover:bg-purple-800/40 transition-colors"
              title="語音輸入 (即將推出)"
            >
              <Mic size={16} className="text-purple-500/70 hover:text-purple-600 dark:hover:text-purple-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 固定底部按鈕 */}
      <div className="flex-shrink-0 p-4 pt-2">
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 px-3 py-2 text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all shadow-md text-sm"
          >
            返回
          </button>
          <button
            onClick={() => onStatusUpdate('in_progress')}
            disabled={isUpdating}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 text-white rounded-lg hover:from-blue-500 hover:via-indigo-600 hover:to-purple-600 transition-all shadow-md text-sm disabled:opacity-50"
          >
            {isUpdating ? '更新中...' : '進行中'}
          </button>
          <button
            onClick={() => onStatusUpdate('done')}
            disabled={isUpdating}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white rounded-lg hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-600 transition-all shadow-md text-sm disabled:opacity-50"
          >
            {isUpdating ? '更新中...' : '完成'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}; 