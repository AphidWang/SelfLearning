/**
 * CreateWeeklyTaskCard - 週挑戰創建卡片
 * 
 * 🎯 功能說明：
 * - 當沒有現有週挑戰時顯示此卡片
 * - 引導用戶創建新的週挑戰
 * - 提供輸入界面和創建按鈕
 * 
 * 🎨 視覺設計：
 * - 與週挑戰相同的漸層背景
 * - 動畫效果引導用戶操作
 * - 創建輸入界面
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Plus } from 'lucide-react';

export interface CreateWeeklyTaskCardProps {
  onCreateWeeklyTask?: (title: string) => Promise<void>;
  isCreatingTask?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const CreateWeeklyTaskCard: React.FC<CreateWeeklyTaskCardProps> = ({
  onCreateWeeklyTask,
  isCreatingTask = false,
  className = '',
  style = {}
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');

  /**
   * 處理創建新任務
   */
  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !onCreateWeeklyTask) return;
    
    try {
      await onCreateWeeklyTask(taskTitle.trim());
      setTaskTitle('');
      setIsEditing(false);
    } catch (error) {
      console.error('創建週挑戰失敗:', error);
    }
  };

  /**
   * 處理鍵盤事件
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTask();
    } else if (e.key === 'Escape') {
      setTaskTitle('');
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      className={`bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl p-4 text-white relative overflow-hidden w-full h-[420px] flex flex-col ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        type: "spring", 
        stiffness: 300, 
        damping: 25 
      }}
      whileHover={{ y: -2 }}
      style={style}
      onClick={() => {
        if (!isEditing && !isCreatingTask) {
          setIsEditing(true);
        }
      }}
    >
      {/* 背景裝飾 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* 標題區域 */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Trophy className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">本週挑戰</h3>
            </div>
          </div>
        </div>

        {/* 主要內容區域 - 固定高度容器 */}
        <div className="flex-1 flex flex-col justify-center min-h-[320px]">
          {isEditing ? (
            // 創建新挑戰輸入界面
            <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-white mb-2">
                  設定你的週挑戰
                </h4>
                <p className="text-sm text-white/80">
                  建立一個7天的打卡挑戰目標
                </p>
              </div>
              
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="例如：每天閱讀30分鐘"
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm"
                autoFocus
                disabled={isCreatingTask}
              />
              
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTask}
                  disabled={!taskTitle.trim() || isCreatingTask}
                  className="flex-1 py-3 bg-white/90 text-indigo-600 rounded-xl font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  {isCreatingTask ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      創建中...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      創建挑戰
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setTaskTitle('');
                    setIsEditing(false);
                  }}
                  disabled={isCreatingTask}
                  className="px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl font-bold hover:bg-white/30 transition-colors text-sm disabled:opacity-50"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            // 創建新挑戰引導界面
            <div className="text-center space-y-4">
              <motion.div
                className="text-6xl mb-4"
                animate={{ 
                  rotate: [0, -5, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, repeatDelay: 3 },
                  scale: { duration: 1, repeat: Infinity, repeatDelay: 4 }
                }}
              >
                🎯
              </motion.div>
              
              <div>
                <h4 className="text-xl font-bold text-white mb-2">
                  創建週挑戰
                </h4>
                <p className="text-white/80 text-sm leading-relaxed px-4">
                  設定一個專屬於你的7天打卡挑戰<br/>
                  培養良好習慣，堅持就是勝利！
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-white/60 text-sm">
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>7天目標</span>
                </div>
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span>每日打卡</span>
                </div>
              </div>
              
              <motion.div
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl text-white font-medium hover:bg-white/30 transition-all cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Plus className="w-5 h-5" />
                點擊開始設定
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}; 