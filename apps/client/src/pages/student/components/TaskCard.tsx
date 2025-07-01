/**
 * TaskCard - 任務卡片組件
 * 
 * 🎯 功能說明：
 * - 便條紙風格的任務卡片設計
 * - 支援卡片翻轉動畫，背面顯示操作按鈕
 * - 顯示任務資訊：標題、學科、目標、狀態
 * - 溫暖色調和手作感設計
 * 
 * 🏗️ 架構設計：
 * - 正面：任務基本資訊展示
 * - 背面：操作按鈕（記錄、完成等）
 * - 使用 Framer Motion 實現流暢翻轉動畫
 * - 響應式設計，適配不同螢幕
 * 
 * 🎨 視覺設計：
 * - 便條紙造型：圓角、無粗邊框、輕微陰影
 * - 學科色彩：頂部小標籤顯示學科和顏色
 * - 狀態圖示：右上角顯示任務狀態
 * - 手寫風字體：親切溫馨的視覺效果
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Target, CheckCircle2, Play, Edit, BookOpen, Star, Pause, User as UserIcon } from 'lucide-react';
import type { Task, TaskStatus } from '../../../types/goal';

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

interface TaskCardProps {
  task: TaskWithContext;
  onStatusUpdate: (newStatus: TaskStatus) => void;
  onOpenRecord?: (task: TaskWithContext) => void;
  currentUserId?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusUpdate, onOpenRecord, currentUserId }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasRecord, setHasRecord] = useState(false); // 追蹤是否已有記錄

  // 初始化時檢查是否已有記錄
  useEffect(() => {
    const existingRecords = JSON.parse(localStorage.getItem('taskRecords') || '{}');
    setHasRecord(!!existingRecords[task.id]);
  }, [task.id]);

  /**
   * 獲取優先權顏色和圖示
   */
  const getPriorityDisplay = (priority: string = 'medium') => {
    switch (priority) {
      case 'high':
        return { color: '#EF4444', icon: '🔥', text: '重要' };
      case 'medium':
        return { color: '#F59E0B', icon: '⭐', text: '一般' };
      case 'low':
        return { color: '#10B981', icon: '🌱', text: '次要' };
      default:
        return { color: '#6B7280', icon: '📝', text: '一般' };
    }
  };

  /**
   * 獲取狀態顯示
   */
  const getStatusDisplay = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return { icon: Clock, color: '#6B7280', text: '待開始' };
      case 'in_progress':
        return { icon: Play, color: '#8B5CF6', text: '進行中' };
      case 'done':
        return { icon: CheckCircle2, color: '#10B981', text: '已完成' };
      default:
        return { icon: Clock, color: '#6B7280', text: '待開始' };
    }
  };

  const priorityDisplay = getPriorityDisplay(task.priority);
  const statusDisplay = getStatusDisplay(task.status);
  const StatusIcon = statusDisplay.icon;
  
  // 檢查是否需要顯示 owner tag
  const shouldShowOwnerTag = task.owner && currentUserId && task.owner.id !== currentUserId;

  /**
   * 處理完成任務，檢查是否需要記錄
   */
  const handleCompleteTask = () => {
    if (!hasRecord) {
      // 檢查 localStorage 是否有記錄
      const existingRecords = JSON.parse(localStorage.getItem('taskRecords') || '{}');
      if (!existingRecords[task.id]) {
        alert('請先記錄一下學習心得再完成任務喔！ 😊');
        onOpenRecord?.(task);
        return;
      }
    }
    onStatusUpdate('done');
  };

  /**
   * 卡片翻轉動畫變體
   */
  const cardVariants = {
    front: {
      rotateY: 0
    },
    back: {
      rotateY: 180
    }
  };

  return (
    <div className="relative w-full max-w-xs mx-auto h-48" style={{ perspective: '1000px' }}>
      {/* 卡片容器 */}
      <motion.div
        className="relative w-full h-full cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        animate={isFlipped ? "back" : "front"}
        variants={cardVariants}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* 正面 */}
        <motion.div
          className="absolute inset-0 w-full h-full rounded-2xl shadow-lg border-0"
          style={{
            backgroundColor: '#FFFEF7',
            backgroundImage: `
              linear-gradient(135deg, ${task.subjectStyle.accent}08 0%, ${task.subjectStyle.accent}15 100%),
              url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f5f0e8' fill-opacity='0.3'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3C/g%3E%3C/svg%3E")
            `,
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.1),
              0 2px 8px ${task.subjectStyle.accent}20,
              inset 0 1px 0 rgba(255,255,255,0.8)
            `,
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="p-4 h-full flex flex-col">
            {/* 頂部：主題標籤 */}
            <div className="mb-3">
              <div 
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: task.subjectStyle.accent + '25',
                  color: task.subjectStyle.accent
                }}
              >
                <BookOpen className="w-3 h-3" />
                {task.topicTitle}
              </div>
            </div>

            {/* 中間：任務標題 */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-start gap-2 mb-2">
                <h3 
                  className="text-lg font-bold text-gray-800 leading-tight line-clamp-2 flex-1"
                  style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
                >
                  {task.title}
                </h3>
                {shouldShowOwnerTag && (
                  <div 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0"
                    style={{ 
                      backgroundColor: task.owner!.color + '20',
                      color: task.owner!.color,
                      border: `1px solid ${task.owner!.color}40`
                    }}
                  >
                    <UserIcon className="w-3 h-3" />
                    {task.owner!.name}
                  </div>
                )}
              </div>
              
              {/* 任務描述（如果有） */}
              {task.description && (
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>

            {/* 底部：目標資訊 */}
            <div className="mt-auto pt-2 border-t border-gray-200/50">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Target className="w-3 h-3" />
                <span className="truncate">{task.goalTitle}</span>
              </div>
            </div>
          </div>

          {/* 裝飾性元素和狀態指示器 */}
          {task.status === 'in_progress' ? (
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-purple-500 shadow-md"></div>
          ) : (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/60 shadow-inner"></div>
          )}
        </motion.div>

        {/* 背面 */}
        <motion.div
          className="absolute inset-0 w-full h-full rounded-2xl shadow-lg border-0"
          style={{
            backgroundColor: '#FFF9F0',
            backgroundImage: `linear-gradient(135deg, ${task.subjectStyle.accent}12 0%, ${task.subjectStyle.accent}25 100%)`,
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.1),
              0 2px 8px ${task.subjectStyle.accent}20,
              inset 0 1px 0 rgba(255,255,255,0.8)
            `,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="p-4 h-full flex flex-col items-center justify-center gap-4">
            {/* 背面標題 */}
            <div className="text-center">
              <h4 className="text-sm font-bold text-gray-800 mb-1">
                {task.title}
              </h4>
            </div>

            {/* 狀態操作按鈕 */}
            {task.status !== 'done' && (
              <div className="flex gap-2 w-full">
                {task.status === 'todo' ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusUpdate('in_progress');
                      }}
                      className="flex-1 py-2 px-3 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      開始
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteTask();
                      }}
                      className="flex-1 py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      完成
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusUpdate('todo');
                      }}
                      className="flex-1 py-2 px-3 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <Pause className="w-3 h-3" />
                      暫停
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteTask();
                      }}
                      className="flex-1 py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      完成
                    </button>
                  </>
                )}
              </div>
            )}

            {/* 學習記錄按鈕 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenRecord?.(task);
              }}
              className="w-full py-2 px-3 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              📝 留下記錄
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}; 