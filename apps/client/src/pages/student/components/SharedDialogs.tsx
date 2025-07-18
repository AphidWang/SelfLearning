/**
 * SharedDialogs - 共用對話框組件集合
 * 
 * 包含：
 * - StarCounter: 星星計數器組件
 * - CompletedTasksDialog: 完成任務對話框
 * - CutePromptDialog: 可愛提示對話框
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, RotateCcw } from 'lucide-react';
import type { TaskWithContext } from '../../../types/goal';

/**
 * 星星計數器組件 - 彩色星星設計
 */
interface StarCounterProps {
  count: number;
  isAnimating?: boolean;
  onClick?: () => void;
}

export const StarCounter: React.FC<StarCounterProps> = ({ count, isAnimating = false, onClick }) => {
  // 十種彩色星星顏色
  const starColors = [
    '#FF6B6B', // 紅
    '#4ECDC4', // 青
    '#45B7D1', // 藍
    '#96CEB4', // 綠
    '#FECA57', // 黃
    '#FF9FF3', // 粉
    '#A8E6CF', // 淺綠
    '#FFB74D', // 橙
    '#CE93D8', // 紫
    '#81C784'  // 深綠
  ];

  // 計算彩虹星星數量 (每10個一顆)
  const rainbowStars = Math.floor(count / 10);
  // 計算剩餘彩色星星數量
  const coloredStars = count % 10;

  const renderStars = () => {
    const stars: JSX.Element[] = [];
    
    // 彩虹/金色星星 (大)
    for (let i = 0; i < rainbowStars; i++) {
      stars.push(
        <motion.div
          key={`rainbow-${i}`}
          animate={isAnimating ? { 
            rotate: [0, 360],
            scale: [1, 1.5, 1]
          } : {}}
          transition={{ duration: 0.8, ease: "easeInOut", delay: i * 0.1 }}
        >
          <Star 
            className="w-7 h-7 fill-yellow-400 text-yellow-400 drop-shadow-lg" 
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))'
            }}
          />
        </motion.div>
      );
    }
    
    // 彩色星星 (小) - 上五下四排列，顯示在大星星右邊
    const topRowCount = Math.min(5, coloredStars);
    const bottomRowCount = coloredStars - topRowCount;
    
    return (
      <div className="flex items-center gap-2">
        {/* 彩虹星星區域 */}
        {rainbowStars > 0 && (
          <div className="flex gap-1">
            {stars}
          </div>
        )}
        
        {/* 彩色星星區域 - 右邊 */}
        {coloredStars > 0 && (
          <div className="flex flex-col gap-1">
            {/* 上排彩色星星 */}
            {topRowCount > 0 && (
              <div className="flex gap-1 justify-center">
                {Array.from({ length: topRowCount }).map((_, i) => (
                  <motion.div
                    key={`colored-top-${i}`}
                    animate={isAnimating ? { 
                      rotate: [0, 360],
                      scale: [1, 1.3, 1]
                    } : {}}
                    transition={{ duration: 0.6, ease: "easeInOut", delay: (rainbowStars * 0.1) + (i * 0.1) }}
                  >
                    <Star 
                      className="w-5 h-5 drop-shadow-sm" 
                      style={{
                        color: starColors[i],
                        fill: starColors[i],
                        filter: `drop-shadow(0 0 4px ${starColors[i]}80)`
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* 下排彩色星星 */}
            {bottomRowCount > 0 && (
              <div className="flex gap-1 justify-center">
                {Array.from({ length: bottomRowCount }).map((_, i) => (
                  <motion.div
                    key={`colored-bottom-${i}`}
                    animate={isAnimating ? { 
                      rotate: [0, 360],
                      scale: [1, 1.3, 1]
                    } : {}}
                    transition={{ duration: 0.6, ease: "easeInOut", delay: (rainbowStars * 0.1) + ((i + topRowCount) * 0.1) }}
                  >
                    <Star 
                      className="w-5 h-5 drop-shadow-sm" 
                      style={{
                        color: starColors[i + topRowCount],
                        fill: starColors[i + topRowCount],
                        filter: `drop-shadow(0 0 4px ${starColors[i + topRowCount]}80)`
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.button 
      className="flex items-center gap-2 p-3 rounded-xl hover:bg-amber-50 transition-all duration-300 cursor-pointer group"
      animate={isAnimating ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={onClick}
      title="點擊查看完成收藏"
    >
      <div className="flex items-center">
        {renderStars()}
      </div>
      <motion.span 
        className="text-xl font-bold text-amber-700 ml-2"
        key={count} // 重新渲染動畫
        initial={isAnimating ? { scale: 2, color: "#F59E0B" } : false}
        animate={{ scale: 1, color: "#B45309" }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
      >
        {count}
      </motion.span>
      <motion.div
        className="text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"
        animate={isAnimating ? { rotate: [0, 10, -10, 0] } : {}}
      >
        ✨
      </motion.div>
    </motion.button>
  );
};

/**
 * 完成任務 Dialog 組件
 */
interface CompletedTasksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  completedTasks: TaskWithContext[];
  onRestoreTask: (taskId: string, goalId: string, topicId: string, taskVersion: number) => Promise<void>;
  onClearStack: () => void;
}

export const CompletedTasksDialog: React.FC<CompletedTasksDialogProps> = ({
  isOpen,
  onClose,
  completedTasks,
  onRestoreTask,
  onClearStack
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl border border-amber-200 p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 標題區域 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">🎉 完成收藏</h3>
                <p className="text-sm text-gray-600">
                  恭喜你完成了 {completedTasks.length} 個任務！
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 任務列表 */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {completedTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">🌟</div>
                <p className="text-gray-500">還沒有完成的任務</p>
                <p className="text-sm text-gray-400">完成任務後會出現在這裡</p>
              </div>
            ) : (
              completedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 hover:shadow-md transition-all"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: task.subjectStyle.accent + '20',
                            color: task.subjectStyle.accent
                          }}
                        >
                          {task.topicTitle}
                        </div>
                        <Star className="w-4 h-4 text-amber-500" />
                      </div>
                      
                      <h4 className="text-lg font-bold text-gray-800 mb-1">
                        {task.title}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        目標：{task.goalTitle}
                      </p>
                      
                      {task.completed_at && (
                        <p className="text-xs text-gray-500">
                          完成於 {new Date(task.completed_at).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => onRestoreTask(task.id, task.goalId, task.topicId, task.version ?? 0)}
                      className="ml-4 p-3 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors flex-shrink-0 group"
                      title="恢復到進行中"
                    >
                      <RotateCcw className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * 溫馨提示 Dialog 組件
 */
interface CutePromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const CutePromptDialog: React.FC<CutePromptDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl border-2 border-amber-200 p-8 w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          {/* 可愛表情 */}
          <motion.div
            className="text-6xl mb-4"
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 0.8, repeat: Infinity, repeatDelay: 2 },
              scale: { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
            }}
          >
            🤗
          </motion.div>

          {/* 標題 */}
          <h3 className="text-2xl font-bold text-amber-800 mb-3">
            {title}
          </h3>

          {/* 訊息 */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message}
          </p>

          {/* 按鈕區域 */}
          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              等等再說
            </motion.button>
            <motion.button
              onClick={onConfirm}
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl font-medium hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              好的！記錄一下 ✨
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 