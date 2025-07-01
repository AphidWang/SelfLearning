/**
 * TaskWallGrid - 任務牆網格佈局組件
 * 
 * 🎯 功能說明：
 * - 響應式網格佈局：手機2欄，平板3欄，桌面可調整
 * - 支援動畫進場和退場效果
 * - 統一管理 TaskCard 和 GoalCard 的排列
 * - 網格間隔和卡片大小適配不同螢幕
 * 
 * 🏗️ 架構設計：
 * - 使用 CSS Grid 和 Framer Motion 實現動畫
 * - 卡片之間保留適當空隙，營造手作感
 * - 支援 masonry 佈局風格（未來可擴展）
 * 
 * 🎨 視覺設計：
 * - 卡片交錯排列，避免過於工整的感覺
 * - 輕微的隨機旋轉角度，增加手作感
 * - 進場動畫：從透明度0到100，輕微彈跳效果
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCard } from './TaskCard';
import { GoalCard } from './GoalCard';
import type { TaskStatus, Task, Goal } from '../../../types/goal';

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

/**
 * 擴展的目標介面，包含主題資訊
 */
interface GoalWithContext extends Goal {
  topicId: string;
  topicTitle: string;
  topicSubject: string;
  subjectStyle: any;
}

/**
 * 任務牆配置介面
 */
interface TaskWallConfig {
  maxVisibleCards: number; // 主畫面最大卡片數
  gridColumns: 'auto' | 2 | 3; // 網格欄數
  showCompletedStack: boolean; // 是否顯示完成堆疊
  priorityFilter: 'all' | 'high' | 'medium' | 'low'; // 優先權過濾
}

interface TaskWallGridProps {
  cards: Array<
    | { type: 'task'; data: TaskWithContext }
    | { type: 'goal'; data: GoalWithContext }
  >;
  config: TaskWallConfig;
  onTaskStatusUpdate: (
    taskId: string,
    goalId: string,
    topicId: string,
    newStatus: TaskStatus
  ) => void;
  onAddTaskToGoal: (
    goalId: string,
    topicId: string,
    taskTitle: string
  ) => void;
  onOpenRecord?: (task: TaskWithContext) => void;
  currentUserId?: string;
}

export const TaskWallGrid: React.FC<TaskWallGridProps> = ({
  cards,
  config,
  onTaskStatusUpdate,
  onAddTaskToGoal,
  onOpenRecord,
  currentUserId
}) => {
  /**
   * 計算網格欄數
   * 根據配置和螢幕尺寸動態調整
   */
  const getGridColumns = () => {
    if (config.gridColumns === 'auto') {
      // 自動模式：根據螢幕尺寸決定
      return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    } else {
      // 固定模式
      return `grid-cols-${config.gridColumns}`;
    }
  };

  /**
   * 卡片進場動畫變體
   * 輕微的彈跳效果，模擬手貼便條紙的感覺
   */
  const cardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      rotate: 0
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotate: 0
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    }
  };

  /**
   * 容器動畫變體
   */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      className={`grid gap-4 md:gap-6 ${getGridColumns()}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        perspective: '1000px' // 為 3D 效果做準備
      }}
    >
      <AnimatePresence mode="popLayout">
        {cards.map((card, index) => (
          <motion.div
            key={`${card.type}-${card.data.id}`}
            className="flex justify-center"
            variants={cardVariants}
            custom={index}
            layout
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover={{
              scale: 1.02,
              rotate: 0, // 懸停時回正
              transition: {
                type: "spring",
                damping: 25,
                stiffness: 400
              }
            }}
          >
            {card.type === 'task' ? (
              <TaskCard
                task={card.data}
                onStatusUpdate={(newStatus) =>
                  onTaskStatusUpdate(
                    card.data.id,
                    card.data.goalId,
                    card.data.topicId,
                    newStatus
                  )
                }
                onOpenRecord={onOpenRecord}
                currentUserId={currentUserId}
              />
            ) : (
              <GoalCard
                goal={card.data}
                onAddTask={(taskTitle) =>
                  onAddTaskToGoal(
                    card.data.id,
                    card.data.topicId,
                    taskTitle
                  )
                }
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 載入更多卡片的佔位符（未來功能） */}
      {cards.length === config.maxVisibleCards && (
        <motion.div
          className="col-span-full flex justify-center py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: cards.length * 0.05 + 0.3 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-amber-700 text-sm font-medium">
              還有更多任務等著你
            </p>
            <p className="text-amber-600 text-xs mt-1">
              調整設定可以顯示更多卡片
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}; 