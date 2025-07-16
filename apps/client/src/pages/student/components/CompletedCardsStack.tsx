/**
 * CompletedCardsStack - 完成任務堆疊組件
 * 
 * 🎯 功能說明：
 * - 固定在螢幕右下角的已完成任務堆疊
 * - 模擬實體卡片疊放的視覺效果
 * - 支援展開查看和清空功能
 * - 完成任務時會有飛入動畫效果
 * 
 * 🏗️ 架構設計：
 * - 使用 fixed 定位固定在右下角
 * - 卡片重疊排列，最新的在最上方
 * - 支援展開/收起切換查看模式
 * - 響應式設計，手機版調整位置和大小
 * 
 * 🎨 視覺設計：
 * - 卡片微微偏移，營造疊放真實感
 * - 成就感色彩：金黃色邊框和背景
 * - 輕微陰影增加立體感
 * - 數量徽章顯示完成數量
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Star, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import type { Task } from '../../../types/goal';

/**
 * 擴展的任務介面，包含主題和目標資訊
 */
interface TaskWithContext extends Task {
  topicId: string;
  topicTitle: string;
  topicSubject: string;
  goalId: string;
  goalTitle: string;
  subjectStyle: any;
}

interface CompletedCardsStackProps {
  completedTasks: TaskWithContext[];
  onClearStack: () => void;
  onRestoreTask: (taskId: string, goalId: string, topicId: string) => Promise<void>;
}

export const CompletedCardsStack: React.FC<CompletedCardsStackProps> = ({
  completedTasks,
  onClearStack,
  onRestoreTask
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (completedTasks.length === 0) return null;

  /**
   * 堆疊動畫變體
   */
  const stackVariants = {
    collapsed: {
      scale: 1,
      transition: { duration: 0.3 }
    },
    expanded: {
      scale: 1.1,
      transition: { duration: 0.3 }
    }
  };

  /**
   * 卡片飛入動畫變體
   */
  const cardFlyInVariants = {
    hidden: {
      x: -200,
      y: -100,
      scale: 0.8,
      opacity: 0,
      rotate: -20
    },
    visible: {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      rotate: 0
    }
  };

  /**
   * 渲染堆疊中的卡片
   */
  const renderStackedCard = (task: TaskWithContext, index: number) => {
    const isTop = index === 0;
    const offset = index * 2; // 每張卡片偏移2px
    const rotation = (index % 3 - 1) * 1; // 輕微隨機旋轉

    return (
      <motion.div
        key={task.id}
        className="absolute inset-0 rounded-xl shadow-lg border-2 border-amber-300"
        style={{
          backgroundColor: '#FEF3C7',
          backgroundImage: `linear-gradient(135deg, ${task.subjectStyle.accent}10 0%, #FEF3C7 100%)`,
          transform: `translate(${offset}px, ${offset}px) rotate(${rotation}deg)`,
          zIndex: completedTasks.length - index,
          boxShadow: `
            0 ${4 + offset}px ${12 + offset}px rgba(0,0,0,0.1),
            0 2px 8px rgba(245, 158, 11, 0.2)
          `
        }}
        initial="hidden"
        animate="visible"
        variants={index === 0 ? cardFlyInVariants : {}}
        transition={index === 0 ? {
          type: "spring",
          damping: 20,
          stiffness: 300,
          duration: 0.8
        } : undefined}
      >
        {isTop && (
          <div className="p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div 
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: task.subjectStyle.accent + '30',
                  color: task.subjectStyle.accent
                }}
              >
                {task.topicTitle}
              </div>
              <Star className="w-4 h-4 text-amber-600" />
            </div>
            
            <h4 className="text-sm font-bold text-gray-800 mb-1 line-clamp-2">
              {task.title}
            </h4>
            
            <div className="mt-auto pt-2 border-t border-amber-300/50">
              <p className="text-xs text-gray-600 truncate">
                {task.goalTitle}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  /**
   * 渲染展開的卡片列表
   */
  const renderExpandedList = () => (
    <motion.div
      className="space-y-2 max-h-80 overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {completedTasks.map((task, index) => (
        <motion.div
          key={task.id}
          className="bg-amber-50 border border-amber-200 rounded-lg p-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="flex items-center justify-between mb-1">
            <div 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: task.subjectStyle.accent + '20',
                color: task.subjectStyle.accent
              }}
            >
              {task.topicTitle}
            </div>
            <Star className="w-3 h-3 text-amber-500" />
          </div>
          
          <h4 className="text-sm font-bold text-gray-800 mb-1">
            {task.title}
          </h4>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">
                {task.goalTitle}
              </p>
              
              {task.completed_at && (
                <p className="text-xs text-gray-500 mt-1">
                  完成於 {new Date(task.completed_at).toLocaleDateString()}
                </p>
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestoreTask(task.id, task.goalId, task.topicId);
              }}
              className="ml-2 p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
              title="恢復到進行中"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-30"
      variants={stackVariants}
      animate={isExpanded ? "expanded" : "collapsed"}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          /* 展開模式 */
          <motion.div
            key="expanded"
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-200 p-4 w-72"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {/* 展開標題 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">完成收藏</h3>
                  <p className="text-xs text-gray-600">
                    {completedTasks.length} 個已完成任務
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="收起"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* 已完成任務列表 */}
            {renderExpandedList()}
          </motion.div>
        ) : (
          /* 堆疊模式 */
          <motion.div
            key="stacked"
            className="relative w-20 h-24 cursor-pointer"
            onClick={() => setIsExpanded(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* 渲染堆疊的卡片 */}
            {completedTasks.slice(0, 5).map((task, index) => 
              renderStackedCard(task, index)
            )}

            {/* 數量徽章 */}
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-50"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              {completedTasks.length}
            </motion.div>

            {/* 展開提示 */}
            <motion.div
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none"
              whileHover={{ opacity: 1 }}
            >
              點擊查看
              <ChevronUp className="w-3 h-3 inline ml-1" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 慶祝效果（當有新任務完成時） */}
      <AnimatePresence>
        {completedTasks.length > 0 && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 彩紙效果可以在這裡添加 */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}; 