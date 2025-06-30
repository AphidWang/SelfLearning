/**
 * GoalCard - 目標卡片組件
 * 
 * 🎯 功能說明：
 * - 顯示需要建立任務的目標
 * - 虛線邊框，半透明背景設計
 * - 中央大大的「+」圖標和提示文字
 * - 點擊後可快速新增任務
 * 
 * 🏗️ 架構設計：
 * - 與 TaskCard 保持一致的尺寸和風格
 * - 支援翻轉動畫，背面提供任務輸入介面
 * - 透明度設計突出其為「待填充」狀態
 * 
 * 🎨 視覺設計：
 * - 半透明背景：突出其為待建立狀態
 * - 虛線邊框：視覺提示可互動區域
 * - 大型加號圖標：清晰的行動指引
 * - 柔和色調：與已有任務卡片形成對比
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, BookOpen, ArrowLeft } from 'lucide-react';
import type { Goal } from '../../../types/goal';

/**
 * 擴展的目標介面，包含主題資訊
 */
interface GoalWithContext extends Goal {
  topicId: string;
  topicTitle: string;
  topicSubject: string;
  subjectStyle: any;
}

interface GoalCardProps {
  goal: GoalWithContext;
  onAddTask: (taskTitle: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onAddTask }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 處理新增任務
   */
  const handleAddTask = async () => {
    if (!taskTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTask(taskTitle.trim());
      setTaskTitle('');
      setIsFlipped(false);
    } catch (error) {
      console.error('新增任務失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
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
        onClick={() => !isFlipped && setIsFlipped(true)}
        animate={isFlipped ? "back" : "front"}
        variants={cardVariants}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* 正面 */}
        <motion.div
          className="absolute inset-0 w-full h-full rounded-2xl shadow-lg"
          style={{
            backgroundColor: '#FFFEF7',
            backgroundImage: `
              linear-gradient(135deg, ${goal.subjectStyle.accent}05 0%, ${goal.subjectStyle.accent}10 100%),
              url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f5f0e8' fill-opacity='0.2'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3C/g%3E%3C/svg%3E")
            `,
            border: `2px dashed ${goal.subjectStyle.accent}60`,
            opacity: 0.85,
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.08),
              0 2px 8px ${goal.subjectStyle.accent}15,
              inset 0 1px 0 rgba(255,255,255,0.8)
            `,
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="p-4 h-full flex flex-col">
            {/* 頂部：學科標籤 */}
            <div className="flex items-center justify-center mb-3">
              <div 
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: goal.subjectStyle.accent + '20',
                  color: goal.subjectStyle.accent
                }}
              >
                <BookOpen className="w-3 h-3" />
                {goal.topicSubject}
              </div>
            </div>

            {/* 中間：大加號和提示 */}
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* 大加號圖標 */}
              <motion.div
                className="w-16 h-16 rounded-full mb-3 flex items-center justify-center"
                style={{ 
                  backgroundColor: goal.subjectStyle.accent + '15',
                  border: `2px dashed ${goal.subjectStyle.accent}40`
                }}
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: goal.subjectStyle.accent + '25'
                }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
              >
                <Plus 
                  className="w-8 h-8" 
                  style={{ color: goal.subjectStyle.accent }}
                />
              </motion.div>

              {/* 提示文字 */}
              <p 
                className="text-sm font-medium text-center mb-1"
                style={{ color: goal.subjectStyle.accent }}
              >
                點我建立任務
              </p>
              <p className="text-xs text-gray-500 text-center">
                為這個目標新增具體任務
              </p>
            </div>

            {/* 底部：目標名稱 */}
            <div className="mt-auto pt-2 border-t border-gray-200/30">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Target className="w-3 h-3" />
                <span className="truncate font-medium">{goal.title}</span>
              </div>
            </div>
          </div>

          {/* 裝飾性元素：模擬便條紙的打孔 */}
          <div 
            className="absolute top-2 right-2 w-2 h-2 rounded-full shadow-inner"
            style={{ backgroundColor: goal.subjectStyle.accent + '30' }}
          ></div>
        </motion.div>

        {/* 背面：新增任務表單 */}
        <motion.div
          className="absolute inset-0 w-full h-full rounded-2xl shadow-lg"
          style={{
            backgroundColor: '#FFF9F0',
            backgroundImage: `linear-gradient(135deg, ${goal.subjectStyle.accent}12 0%, ${goal.subjectStyle.accent}25 100%)`,
            border: `2px solid ${goal.subjectStyle.accent}40`,
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.1),
              0 2px 8px ${goal.subjectStyle.accent}20,
              inset 0 1px 0 rgba(255,255,255,0.8)
            `,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="p-4 h-full flex flex-col">
            {/* 標題和返回按鈕 */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-800">
                新增任務
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  setTaskTitle('');
                }}
                className="p-1 rounded-full hover:bg-gray-200/50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* 目標資訊 */}
            <div className="mb-3 p-2 rounded-lg bg-white/60">
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                <Target className="w-3 h-3" />
                <span>目標</span>
              </div>
              <p className="text-sm font-medium text-gray-800 truncate">
                {goal.title}
              </p>
            </div>

            {/* 任務輸入 */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                任務標題
              </label>
              <textarea
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="例如：完成第一章節練習題..."
                className="w-full p-3 text-sm bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
                style={{ 
                  minHeight: '80px',
                  '--tw-ring-color': goal.subjectStyle.accent + '50'
                } as React.CSSProperties}
                maxLength={100}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  按 Enter 快速新增
                </span>
                <span className="text-xs text-gray-500">
                  {taskTitle.length}/100
                </span>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="space-y-2 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddTask();
                }}
                disabled={!taskTitle.trim() || isSubmitting}
                className="w-full py-2 px-3 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: goal.subjectStyle.accent
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    新增中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    新增任務
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}; 