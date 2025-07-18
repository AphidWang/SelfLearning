/**
 * TaskWallGrid - 任務牆網格佈局組件
 * 
 * 🎯 功能說明：
 * - 響應式網格佈局：手機2欄，平板3欄，桌面可調整
 * - 支援動畫進場和退場效果
 * - 統一管理 TaskCard 和 GoalCard 的排列
 * - 網格間隔和卡片大小適配不同螢幕
 * - 支援 highlight 卡片（如週挑戰）的特殊處理
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCardFactory } from './cards';
import { GoalCard } from './GoalCard';
import { LoadingDots } from '../../../components/shared/LoadingDots';
import type { TaskStatus, Task, Goal, TaskWithContext } from '../../../types/goal';

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
 * 卡片數據介面，支援 highlight 屬性
 */
interface CardData {
  type: 'task' | 'goal';
  data: TaskWithContext | GoalWithContext;
  highlight?: boolean; // 是否為特殊卡片（如週挑戰）
}

interface TaskWallGridProps {
  cards: CardData[];
  config: {
    gridColumns: 'auto' | 2 | 3;
    showCompletedStack: boolean;
    viewMode: 'tasks' | 'topics';
    sortMode: 'task_type' | 'topic';
  };
  onTaskStatusUpdate: (
    taskId: string,
    goalId: string,
    topicId: string,
    newStatus: TaskStatus,
    taskVersion: number
  ) => void;
  onAddTaskToGoal: (
    goalId: string,
    topicId: string,
    taskTitle: string
  ) => void;
  onOpenRecord?: (task: TaskWithContext) => void;
  onOpenHistory?: (task: TaskWithContext) => void;
  onRecordSuccess?: () => void;
  currentUserId?: string;
  isLoading?: boolean;
}

export const TaskWallGrid: React.FC<TaskWallGridProps> = ({
  cards,
  config,
  onTaskStatusUpdate,
  onAddTaskToGoal,
  onOpenRecord,
  onOpenHistory,
  onRecordSuccess,
  currentUserId,
  isLoading = false
}) => {
  const [showLoading, setShowLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        setShowLoading(false);
        setIsInitialLoad(false);
      }
    }, isInitialLoad ? 500 : 1500); // 初次載入 0.5 秒，之後操作 1.5 秒
    
    return () => clearTimeout(timer);
  }, [isLoading, isInitialLoad]);

  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingDots 
          isLoading={isLoading} 
          minLoadingTime={500}
          colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57']}
          size={8}
        />
      </div>
    );
  }

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
   * 更快速靈動的效果，模擬手貼便條紙的輕快感覺
   */
  const cardVariants = {
    hidden: (index: number) => ({
      opacity: 0,
      scale: 0.85,
      y: 30 + Math.random() * 10,
      rotate: (Math.random() - 0.5) * 4,
    }),
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      rotate: (Math.random() - 0.5) * 2,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 300,
        mass: 0.8,
        delay: index * 0.02,
      }
    }),
    exit: {
      opacity: 0,
      scale: 0.92,
      y: -10,
      transition: {
        duration: 0.15,
        ease: "easeOut" as const
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
        staggerChildren: 0.02, // 大幅縮短 stagger
        delayChildren: 0.05, // 減少初始延遲
        duration: 0.3
      }
    }
  };

  // 分離特殊卡片和普通卡片
  const highlightCards = cards.filter(card => card.highlight);
  const normalCards = cards.filter(card => !card.highlight);

  // 創建一個用於追蹤唯一 ID 的 Map
  const usedKeys = new Set<string>();

  /**
   * 生成唯一的 key，確保不會有重複或空值
   */
  const generateUniqueKey = (card: CardData, index: number, prefix: string) => {
    let baseId = card.data.id;
    
    // 如果沒有 ID 或 ID 為空字串，生成臨時 ID
    if (!baseId || baseId.trim() === '') {
      baseId = `temp-${card.type}-${index}`;
      console.warn('⚠️ 發現空的卡片 ID，生成臨時 ID:', { 
        originalId: card.data.id, 
        generatedId: baseId,
        cardType: card.type,
        index,
        prefix,
        cardTitle: (card.data as any).title
      });
    }
    
    let key = `${prefix}-${card.type}-${baseId}-${index}`;
    let counter = 0;
    
    // 如果 key 已存在，添加計數器直到找到唯一的 key
    while (usedKeys.has(key)) {
      counter++;
      key = `${prefix}-${card.type}-${baseId}-${index}-${counter}`;
      console.warn('🔄 發現重複 key，添加計數器:', { 
        originalKey: `${prefix}-${card.type}-${baseId}-${index}`,
        newKey: key,
        counter
      });
    }
    
    usedKeys.add(key);
    
    // 額外檢查：確保 key 不是空字串
    if (!key || key.trim() === '') {
      const fallbackKey = `fallback-${Date.now()}-${Math.random()}`;
      console.error('🚨 生成的 key 是空字串，使用後備方案:', { 
        originalKey: key,
        fallbackKey,
        cardData: card.data,
        prefix,
        index
      });
      return fallbackKey;
    }
    
    return key;
  };

  /**
   * 生成唯一的 layoutId，確保動畫正常工作
   */
  const generateLayoutId = (card: CardData, index: number, prefix: string) => {
    let baseId = card.data.id;
    
    // 如果沒有 ID 或 ID 為空字串，生成臨時 ID
    if (!baseId || baseId.trim() === '') {
      baseId = `temp-${card.type}-${index}`;
    }
    
    return `${prefix}-${card.type}-${baseId}`;
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        perspective: '1000px' // 為 3D 效果做準備
      }}
    >
      <AnimatePresence mode="popLayout">
        {/* 第一列：特殊卡片區域 */}
        {highlightCards.length > 0 && (
          <motion.div
            key="highlight-cards-section"
            className="w-full mb-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex flex-wrap gap-4 justify-center w-full">
              {highlightCards.map((card, index) => (
                <motion.div
                  key={generateUniqueKey(card, index, 'highlight')}
                  className="w-full max-w-sm"
                  variants={cardVariants}
                  custom={index}
                  layout
                  layoutId={generateLayoutId(card, index, 'highlight')}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{
                    scale: 1.05,
                    y: -8,
                    rotate: 0, // 懸停時回正
                    transition: {
                      type: "spring",
                      damping: 15,
                      stiffness: 500,
                      duration: 0.2
                    }
                  }}
                  whileTap={{
                    scale: 0.98,
                    transition: {
                      duration: 0.1
                    }
                  }}
                >
                  {card.type === 'task' ? (
                    <TaskCardFactory
                      task={card.data as TaskWithContext}
                      onStatusUpdate={(newStatus) =>
                        onTaskStatusUpdate(
                          card.data.id,
                          (card.data as TaskWithContext).goalId,
                          (card.data as TaskWithContext).topicId,
                          newStatus,
                          (card.data as TaskWithContext).version
                        )
                      }
                      onOpenRecord={onOpenRecord}
                      onOpenHistory={onOpenHistory}
                      onRecordSuccess={onRecordSuccess}
                      currentUserId={currentUserId}
                      highlight={card.highlight} // 傳遞 highlight 屬性
                    />
                  ) : (
                    <GoalCard
                      goal={card.data as GoalWithContext}
                      onAddTask={(taskTitle) =>
                        onAddTaskToGoal(
                          card.data.id,
                          (card.data as GoalWithContext).topicId,
                          taskTitle
                        )
                      }
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 第二列開始：普通卡片網格區域 */}
        {normalCards.length > 0 && (
          <motion.div
            key="normal-cards-section"
            className={`grid gap-4 md:gap-6 ${getGridColumns()}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {normalCards.map((card, index) => (
              <motion.div
                key={generateUniqueKey(card, index, 'normal')}
                className="flex justify-center"
                variants={cardVariants}
                custom={index + highlightCards.length} // 調整動畫延遲
                layout
                layoutId={generateLayoutId(card, index, 'normal')}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{
                  scale: 1.05,
                  y: -8,
                  rotate: 0, // 懸停時回正
                  transition: {
                    type: "spring",
                    damping: 15,
                    stiffness: 500,
                    duration: 0.2
                  }
                }}
                whileTap={{
                  scale: 0.98,
                  transition: {
                    duration: 0.1
                  }
                }}
              >
                {card.type === 'task' ? (
                  <TaskCardFactory
                    task={card.data as TaskWithContext}
                    onStatusUpdate={(newStatus) =>
                      onTaskStatusUpdate(
                        card.data.id,
                        (card.data as TaskWithContext).goalId,
                        (card.data as TaskWithContext).topicId,
                        newStatus,
                        (card.data as TaskWithContext).version
                      )
                    }
                    onOpenRecord={onOpenRecord}
                    onOpenHistory={onOpenHistory}
                    onRecordSuccess={onRecordSuccess}
                    currentUserId={currentUserId}
                    highlight={card.highlight} // 傳遞 highlight 屬性
                  />
                ) : (
                  <GoalCard
                    goal={card.data as GoalWithContext}
                    onAddTask={(taskTitle) =>
                      onAddTaskToGoal(
                        card.data.id,
                        (card.data as GoalWithContext).topicId,
                        taskTitle
                      )
                    }
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}; 