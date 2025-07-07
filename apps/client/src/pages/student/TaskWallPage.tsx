/**
 * TaskWallPage - 學生任務牆頁面
 * 
 * 🎯 功能說明：
 * - 呈現溫暖色調的任務卡牆，類似手作筆記本風格
 * - 顯示待完成任務和進行中任務，以及需要建立任務的目標
 * - 支援卡片翻轉互動和完成動畫
 * - 已完成的任務以星星計數器顯示，帶有動畫效果
 * 
 * 🏗️ 架構設計：
 * - 使用 topicStore 獲取最新的主題/目標/任務資料 [[memory:1599136828095381917]]
 * - 分層組件設計：TaskWallPage -> TaskWallGrid -> TaskCard/GoalCard
 * - 響應式佈局：手機2欄，平板3欄，桌面可調整
 * - 優先權排序：進行中任務優先，高優先權任務優先顯示
 * - 顯示所有符合條件的卡片（無數量限制）
 * 
 * 🎨 視覺設計：
 * - 溫暖色調：米色、奶油色、淡橙色背景
 * - 手作感：輕微紙質紋理、柔軟陰影
 * - 親切字體：手寫風格設計
 * - 卡片造型：便條紙風格，圓角無粗邊框
 * - 星星計數器：完成任務時的動畫反饋
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useTopicStore } from '../../store/topicStore';
import { useUserStore } from '../../store/userStore';
import { useUser } from '../../context/UserContext';
import { subjects } from '../../styles/tokens';
import { ArrowLeft, Settings, Filter, Star, BookMarked, X, RotateCcw, Grid3x3, List, Users, Flag, Target, CheckCircle2, Clock, Play, Plus, Edit3, Trophy, Calendar, TrendingUp } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { TaskWallGrid } from './components/TaskWallGrid';
import { DailyJournalDialog } from './components/DailyJournalDialog';
import { TaskRecordDialog } from './components/TaskRecordDialog';
import { TopicReviewPage } from '../../components/topic-review/TopicReviewPage';
import { TopicTemplateBrowser } from '../../components/template/TopicTemplateBrowser';
import type { Topic, Goal, Task, TaskStatus } from '../../types/goal';
import { LoadingDots } from '../../components/shared/LoadingDots';
import { TaskRecordHistoryDialog } from './components/TaskRecordHistoryDialog';

/**
 * 任務牆配置介面
 */
interface TaskWallConfig {
  maxVisibleCards: number; // 已停用 - 現在顯示所有卡片
  gridColumns: 'auto' | 2 | 3; // 網格欄數
  priorityFilter: 'all' | 'high' | 'medium' | 'low'; // 優先權過濾
  showCompletedStack: boolean;
  viewMode: 'tasks' | 'topics'; // 新增：視圖模式切換
  sortMode: 'task_type' | 'topic'; // 新增：排序模式
}

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
  records: {
    id: string;
    created_at: string;
    title: string;
    message: string;
    difficulty: number;
    completion_time?: number;
    files?: any[];
    tags?: string[];
  }[];
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
 * 主題卡片數據介面
 */
interface TopicCardData {
  topic: Topic;
  subjectStyle: any;
  totalGoals: number;
  completedGoals: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  needHelpCount: number;
  collaborators: any[];
  overallProgress: number;
}

/**
 * 星星計數器組件 - 彩色星星設計
 */
interface StarCounterProps {
  count: number;
  isAnimating?: boolean;
  onClick?: () => void;
}

const StarCounter: React.FC<StarCounterProps> = ({ count, isAnimating = false, onClick }) => {
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
  onRestoreTask: (taskId: string, goalId: string, topicId: string) => Promise<void>;
  onClearStack: () => void;
}

const CompletedTasksDialog: React.FC<CompletedTasksDialogProps> = ({
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
                      onClick={() => onRestoreTask(task.id, task.goalId, task.topicId)}
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

const CutePromptDialog: React.FC<CutePromptDialogProps> = ({
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

/**
 * 主題卡片組件
 */
interface TopicCardProps {
  data: TopicCardData;
  onClick: (topicId: string) => void;
  isLoading?: boolean;
}

const TopicCard: React.FC<TopicCardProps> = ({ data, onClick, isLoading }) => {
  const { topic, subjectStyle, totalGoals, completedGoals, totalTasks, completedTasks, inProgressTasks, needHelpCount, collaborators, overallProgress } = data;

  // 根據目標狀態決定圖標
  const getStatusIcon = () => {
    if (overallProgress === 100) return CheckCircle2;
    if (inProgressTasks > 0) return Play;
    if (totalTasks === 0) return Target;
    return Clock;
  };

  const StatusIcon = getStatusIcon();

  return (
    <motion.div
      className="group cursor-pointer relative"
      onClick={() => onClick(topic.id)}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 1
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <LoadingDots />
        </div>
      )}
      <div 
        className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border-2 p-6 h-[320px] flex flex-col transition-all duration-300 hover:shadow-2xl ${
          isLoading ? 'opacity-90' : ''
        }`}
        style={{ 
          borderColor: subjectStyle.accent + '40',
          boxShadow: `0 10px 30px ${subjectStyle.accent}15, 0 0 0 1px ${subjectStyle.accent}20`
        }}
      >
        {/* 頂部標題區 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div 
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: subjectStyle.accent + '20',
                    color: subjectStyle.accent
                  }}
                >
                  {topic.subject || '未分類'}
                </div>
                {topic.is_collaborative && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                    <Users className="w-3 h-3" />
                    協作
                  </div>
                )}
                {/* 協作者頭像移到這裡 */}
                {topic.is_collaborative && collaborators.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2">
                      {collaborators.slice(0, 3).map((collaborator, index) => (
                        <div
                          key={collaborator.id}
                          className="w-5 h-5 rounded-full border-2 border-white bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ zIndex: 10 - index }}
                        >
                          {collaborator.name?.charAt(0) || '?'}
                        </div>
                      ))}
                      {collaborators.length > 3 && (
                        <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold">
                          +{collaborators.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 line-clamp-2 leading-tight">
              {topic.title}
            </h3>
          </div>
          <div className="flex-shrink-0 ml-3">
            <StatusIcon 
              className="w-6 h-6" 
              style={{ color: subjectStyle.accent }}
            />
          </div>
        </div>

        {/* 中央進度環 */}
        <div className="flex-1 flex items-center justify-center my-3">
          <div className="relative">
            {/* 外圈 */}
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={subjectStyle.accent + '20'}
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={subjectStyle.accent}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${overallProgress * 2.51} 251.2`}
                style={{
                  transition: 'stroke-dasharray 0.5s ease-in-out'
                }}
              />
            </svg>
            {/* 中央百分比 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-800">
                {Math.round(overallProgress)}%
              </span>
            </div>
          </div>
        </div>

        {/* 底部統計資訊 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Flag className="w-4 h-4" />
              <span>{completedGoals}/{totalGoals} 目標</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Target className="w-4 h-4" />
              <span>{completedTasks}/{totalTasks} 任務</span>
            </div>
          </div>

          {/* 進行中任務和需要幫助 */}
          <div className="flex items-center justify-between">
            {inProgressTasks > 0 && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: subjectStyle.accent + '20',
                  color: subjectStyle.accent
                }}
              >
                <Play className="w-3 h-3" />
                {inProgressTasks} 進行中
              </div>
            )}
            
            {needHelpCount > 0 && (
              <motion.div 
                className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚠️ {needHelpCount} 需要幫助
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 主題網格組件
 */
interface TopicGridProps {
  topics: TopicCardData[];
  onTopicClick: (topicId: string) => void;
  onCreateTopicClick: () => void;
  isLoading?: boolean;
  isViewModeChanging?: boolean;
  loadingTopicId: string | null;
}

const TopicGrid: React.FC<TopicGridProps> = ({ topics, onTopicClick, onCreateTopicClick, isLoading, isViewModeChanging, loadingTopicId }) => {
  if (isLoading || isViewModeChanging) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingDots 
          colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57']}
          size={8}
          minLoadingTime={500}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {topics.map((topicData, index) => (
        <motion.div
          key={topicData.topic.id}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.2, 
            delay: index * 0.05,
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
        >
          <TopicCard 
            data={topicData} 
            onClick={onTopicClick}
            isLoading={topicData.topic.id === loadingTopicId}
          />
        </motion.div>
      ))}
      
      {/* 建立新主題卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.2, 
          delay: topics.length * 0.05,
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
      >
        <CreateTopicCard 
          onClick={onCreateTopicClick}
          isLoading={false}
        />
      </motion.div>
    </div>
  );
};

/**
 * 本週挑戰卡片組件
 */
interface WeeklyChallengeCardProps {
  challenge: {
    title: string;
    completedDays: string[];
    startDate: string;
  } | null;
  onCheckIn: () => void;
  onCancelCheckIn: () => void;
  onEdit: () => void;
  onSetChallenge: () => void;
  onMigrate: () => void;
  editingChallenge: boolean;
  challengeInput: string;
  setChallengeInput: (value: string) => void;
  setEditingChallenge: (value: boolean) => void;
  getTaiwanDateString: () => string;
}

const WeeklyChallengeCard: React.FC<WeeklyChallengeCardProps> = ({ 
  challenge, 
  onCheckIn, 
  onCancelCheckIn,
  onEdit, 
  onSetChallenge,
  onMigrate,
  editingChallenge,
  challengeInput,
  setChallengeInput,
  setEditingChallenge,
  getTaiwanDateString
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const today = getTaiwanDateString();
  const isCheckedToday = challenge?.completedDays.includes(today) || false;
  const completedDays = challenge?.completedDays.length || 0;
  const progress = (completedDays / 7) * 100;

  // 生成這週的日期
  const getWeekDates = () => {
    if (!challenge) return [];
    const startDate = new Date(challenge.startDate);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  return (
    <motion.div
      className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl p-4 text-white relative overflow-hidden w-full h-[420px] flex flex-col"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        type: "spring", 
        stiffness: 300, 
        damping: 25 
      }}
      whileHover={{ y: -2 }}
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
          
          {challenge && !editingChallenge && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm"
                title="編輯挑戰"
              >
                <Edit3 className="w-4 h-4" />
              </button>
                             {/* 遷移按鈕 */}
               <button
                 onClick={onMigrate}
                 className="p-2 bg-yellow-400/80 text-indigo-600 rounded-xl hover:bg-yellow-400 transition-colors backdrop-blur-sm"
                 title="遷移到新任務系統"
               >
                 <TrendingUp className="w-4 h-4" />
               </button>
            </div>
          )}
        </div>

        {/* 挑戰內容 - 固定高度容器 */}
        <div className="flex-1 flex flex-col justify-center min-h-[320px]">
          {editingChallenge ? (
            <div className="space-y-4">
              <input
                type="text"
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value)}
                placeholder="輸入你的本週挑戰..."
                className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={onSetChallenge}
                  disabled={!challengeInput.trim()}
                  className="flex-1 py-2 bg-white/90 text-indigo-600 rounded-xl font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  確定設定
                </button>
                <button
                  onClick={() => setEditingChallenge(false)}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl font-bold hover:bg-white/30 transition-colors text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          ) : challenge ? (
            <div className="space-y-4">
              {/* 挑戰標題 */}
              <div className="text-center">
                <h4 className="text-lg font-bold mb-2 line-clamp-2">{challenge.title}</h4>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black">{completedDays}</span>
                  <span className="text-white/80">/</span>
                  <span className="text-lg font-bold text-white/80">7</span>
                  <span className="text-sm text-white/80 ml-1">天完成</span>
                </div>
              </div>

              {/* 遷移提示 */}
              {challenge.completedDays.length > 0 && (
                <div className="mb-3 p-2 bg-yellow-400/20 border border-yellow-400/30 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="w-3 h-3 text-yellow-300" />
                    <span className="text-yellow-100">
                      可升級為連續型任務，享受更豐富的追蹤功能！
                    </span>
                  </div>
                </div>
              )}

              {/* 進度條 */}
              <div className="space-y-3">
                <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
                  <motion.div
                    className="h-3 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full shadow-lg"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                
                {/* 週間日期標記 */}
                <div className="flex justify-between">
                  {weekDates.map((date, index) => {
                    const isCompleted = challenge.completedDays.includes(date);
                    const isToday = date === today;
                    const dayName = ['一', '二', '三', '四', '五', '六', '日'][index];
                    
                    return (
                      <div key={date} className="flex flex-col items-center">
                        <div 
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted 
                              ? 'bg-yellow-300 text-indigo-600 shadow-lg' 
                              : isToday 
                                ? 'bg-white/30 border-2 border-white/60 text-white' 
                                : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {isCompleted ? '✓' : dayName}
                        </div>
                        {isToday && (
                          <div className="w-1 h-1 bg-yellow-300 rounded-full mt-1"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 打卡按鈕區域 */}
              {isCheckedToday ? (
                <div className="space-y-2">
                  {/* 已打卡狀態 */}
                  <div className="w-full py-3 rounded-xl font-bold text-sm bg-white/20 text-white/80 text-center border border-white/30">
                    今日已打卡 ✓
                  </div>
                  
                  {/* 取消打卡按鈕 */}
                  {!showCancelConfirm ? (
                    <div className="flex justify-center">
                      <motion.button
                        onClick={() => setShowCancelConfirm(true)}
                        className="px-4 py-1.5 rounded-lg text-xs bg-white/10 text-white/70 hover:bg-white/20 transition-colors border border-white/20"
                        whileTap={{ scale: 0.98 }}
                      >
                        取消今日打卡
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-center text-xs text-white/80 py-1">
                        確定要取消今日打卡嗎？
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => setShowCancelConfirm(false)}
                          className="flex-1 py-2 rounded-lg text-xs bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          不了
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            onCancelCheckIn();
                            setShowCancelConfirm(false);
                          }}
                          className="flex-1 py-2 rounded-lg text-xs bg-red-400/80 text-white hover:bg-red-500/80 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          確定取消
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <motion.button
                  onClick={onCheckIn}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg bg-white/90 text-indigo-600 hover:bg-white hover:scale-105 active:scale-95"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  今日打卡 🎯
                </motion.button>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-4xl mb-2">🎯</div>
              <h4 className="text-lg font-bold">還沒有設定本週挑戰</h4>
              <p className="text-white/80 text-sm mb-4">設定一個專屬於你的本週挑戰吧！</p>
              <button
                onClick={() => setEditingChallenge(true)}
                className="px-6 py-2 bg-white/90 text-indigo-600 rounded-xl font-bold hover:bg-white transition-all shadow-lg hover:scale-105 text-sm"
              >
                立即設定
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 建立新主題卡片組件
 */
interface CreateTopicCardProps {
  onClick: () => void;
  isLoading?: boolean;
}

const CreateTopicCard: React.FC<CreateTopicCardProps> = ({ onClick, isLoading }) => {
  return (
    <motion.div
      className="group cursor-pointer relative"
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 1
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <LoadingDots />
        </div>
      )}
      <div 
        className={`bg-gradient-to-br from-emerald-50 to-teal-50 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-dashed border-emerald-300 p-6 h-[320px] flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:border-emerald-400 ${
          isLoading ? 'opacity-90' : ''
        }`}
        style={{ 
          boxShadow: `0 10px 30px rgba(16, 185, 129, 0.1), 0 0 0 1px rgba(16, 185, 129, 0.1)`
        }}
      >
        {/* 圖標 */}
        <motion.div
          className="w-24 h-24 mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Plus className="w-12 h-12 text-emerald-600" />
        </motion.div>

        {/* 標題 */}
        <h3 className="text-2xl font-bold text-emerald-800 mb-2 text-center">
          建立新主題
        </h3>

        {/* 描述 */}
        <p className="text-emerald-600 text-center mb-4 leading-relaxed">
          從模板或空白主題開始<br />
          你的新學習之旅
        </p>

        {/* 裝飾性圖標 */}
        <div className="flex items-center gap-3 text-emerald-400">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ✨
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            🚀
          </motion.div>
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            💡
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export const TaskWallPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isTopicLoading, setIsTopicLoading] = useState(false);
  const [isViewModeChanging, setIsViewModeChanging] = useState(false);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  
  // Store hooks with error handling
  const { 
    fetchTopics, 
    topics, 
    addTask,
    createTopic,
    addGoal,
    markTaskCompletedCompat: markTaskCompleted,
    markTaskInProgressCompat: markTaskInProgress,
    markTaskTodoCompat: markTaskTodo,
    clearError,
    loading, 
    error
  } = useTopicStore();
  
  const { users, getCollaboratorCandidates } = useUserStore();
  const { currentUser, isLoading: userLoading } = useUser();

  // 組件狀態
  const [config, setConfig] = useState<TaskWallConfig>({
    maxVisibleCards: 12,
    gridColumns: 'auto', // 使用自動響應式網格，全寬度下會有更多欄數
    priorityFilter: 'all',
    showCompletedStack: true,
    viewMode: 'tasks',
    sortMode: 'task_type'
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [selectedTaskForRecord, setSelectedTaskForRecord] = useState<TaskWithContext | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskWithContext[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isStarAnimating, setIsStarAnimating] = useState(false);
  const [showTopicReviewId, setShowTopicReviewId] = useState<string | null>(null);
  const [loadingTopicId, setLoadingTopicId] = useState<string | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState<TaskWithContext | null>(null);
  
  // 本週挑戰相關狀態
  const [weeklyChallenge, setWeeklyChallenge] = useState<{
    title: string;
    completedDays: string[];
    startDate: string;
  } | null>(null);
  const [editingChallenge, setEditingChallenge] = useState(false);
  const [challengeInput, setChallengeInput] = useState('');

  // 獲取台灣時間的日期字串 (UTC+8)
  const getTaiwanDateString = () => {
    const now = new Date();
    const taiwanTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    return taiwanTime.toISOString().split('T')[0];
  };

  // 獲取本週的開始日期 (週一)
  const getWeekStart = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  // 初始化本週挑戰數據
  useEffect(() => {
    const savedChallenge = localStorage.getItem('weeklyChallenge');
    const currentWeekStart = getWeekStart(getTaiwanDateString());
    
    if (savedChallenge) {
      const challenge = JSON.parse(savedChallenge);
      // 檢查是否是本週的挑戰
      if (challenge.startDate === currentWeekStart) {
        setWeeklyChallenge(challenge);
      } else {
        // 新的一週，清除舊挑戰
        localStorage.removeItem('weeklyChallenge');
        setWeeklyChallenge(null);
      }
    }
  }, []);

  // 初始化資料載入
  useEffect(() => {
    const fetchData = async () => {
      // 等待用戶資料載入完成
      if (userLoading) return;
      
      console.log('TaskWallPage fetchData called')
      setIsLoading(true);
      const startTime = performance.now();
      try {
        await Promise.all([
          fetchTopics(),
          getCollaboratorCandidates()
        ]);
        
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        console.log(`⚡ 任務牆載入時間: ${Math.round(loadTime)}ms`);
        
        // 在開發環境下顯示載入時間
        if (import.meta.env.DEV) {
          setTimeout(() => {
            toast.success(`⚡ 載入完成：${Math.round(loadTime)}ms`, {
              duration: 2000,
              style: {
                background: '#10B981',
                color: 'white',
                fontSize: '14px'
              }
            });
          }, 100);
        }
      } catch (error) {
        console.error('Failed to load task wall data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [fetchTopics, getCollaboratorCandidates, userLoading]);

  // 自動清除錯誤消息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // 5秒後自動清除錯誤

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // 從資料庫載入已完成任務到完成收藏
  useEffect(() => {
    if (!topics) return;

    const completedTasksFromDB: TaskWithContext[] = [];
    
    topics.forEach(topic => {
      if (topic.status === 'archived') return;
      
      const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
      
      topic.goals?.forEach(goal => {
        if (goal.status === 'archived') return;
        
        goal.tasks?.forEach(task => {
          // 載入已完成的任務
          if (task.status === 'done') {
            completedTasksFromDB.push({
              ...task,
              topicId: topic.id,
              topicTitle: topic.title,
              topicSubject: topic.subject || '未分類',
              goalId: goal.id,
              goalTitle: goal.title,
              subjectStyle,
              records: (task.records || []).map(record => ({
                id: record.id,
                created_at: record.created_at || new Date().toISOString(),
                title: task.title,
                message: record.message || '',
                difficulty: record.difficulty || 3,
                completion_time: record.completion_time,
                files: record.files || [],
                tags: record.tags || []
              }))
            });
          }
        });
      });
    });

    // 按完成時間排序（最新的在前）
    completedTasksFromDB.sort((a, b) => {
      const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return bTime - aTime;
    });

    // 最多保留最近的 10 個已完成任務
    const recentCompletedTasks = completedTasksFromDB.slice(0, 10);
    setCompletedTasks(recentCompletedTasks);
    setCompletedCount(completedTasksFromDB.length);
  }, [topics]);

  /**
   * 處理任務狀態更新
   * 使用 Result pattern 進行錯誤處理
   */
  const handleTaskStatusUpdate = useCallback(async (
    taskId: string, 
    goalId: string, 
    topicId: string, 
    newStatus: TaskStatus
  ) => {
    try {
      let result;
      
      // 使用專門的狀態切換函數
      switch (newStatus) {
        case 'done':
          result = await markTaskCompleted(topicId, goalId, taskId, true); // 要求學習記錄
          
          if (!result.success) {
            if (result.requiresRecord) {
              // 需要學習記錄，顯示溫馨提示
              const task = topics
                .find(t => t.id === topicId)
                ?.goals?.find(g => g.id === goalId)
                ?.tasks?.find(t => t.id === taskId);
              
              if (task) {
                setSelectedTaskForRecord({
                  ...task,
                  topicId,
                  topicTitle: topics.find(t => t.id === topicId)?.title || '',
                  topicSubject: topics.find(t => t.id === topicId)?.subject || '未分類',
                  goalId,
                  goalTitle: topics.find(t => t.id === topicId)?.goals?.find(g => g.id === goalId)?.title || '',
                  subjectStyle: subjects.getSubjectStyle(topics.find(t => t.id === topicId)?.subject || ''),
                  records: (task.records || []).map(record => ({
                    id: record.id,
                    created_at: record.created_at || new Date().toISOString(),
                    title: task.title,
                    message: record.message || '',
                    difficulty: record.difficulty || 3,
                    completion_time: record.completion_time,
                    files: record.files || [],
                    tags: record.tags || []
                  }))
                });
                setShowPromptDialog(true);
              }
            } else {
              // 其他錯誤，顯示 toast
              toast.error(result.message);
            }
            return;
          }
          
          // 任務成功完成，觸發星星動畫
          setIsStarAnimating(true);
          setTimeout(() => setIsStarAnimating(false), 1000);
          break;
          
        case 'in_progress':
          result = await markTaskInProgress(topicId, goalId, taskId);
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          break;
          
        case 'todo':
          result = await markTaskTodo(topicId, goalId, taskId);
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          break;
          
        default:
          console.warn('未知的任務狀態:', newStatus);
          return;
      }

    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      toast.error('系統錯誤，請稍後再試');
    }
  }, [markTaskCompleted, markTaskInProgress, markTaskTodo, topics]);

  /**
   * 處理新增任務到目標
   */
  const handleAddTaskToGoal = useCallback(async (
    goalId: string, 
    topicId: string, 
    taskTitle: string
  ) => {
    try {
      await addTask(goalId, {
        title: taskTitle,
        status: 'todo',
        description: '',
        priority: 'medium',
        order_index: 0,
        need_help: false,
        task_type: 'single',
        task_config: { type: 'single' },
        cycle_config: { cycle_type: 'none', auto_reset: false },
        progress_data: { last_updated: new Date().toISOString(), completion_percentage: 0 }
      });
    } catch (error) {
      console.error('新增任務失敗:', error);
    }
  }, [addTask]);

  /**
   * 處理任務恢復到進行中
   */
  const handleRestoreTask = useCallback(async (
    taskId: string, 
    goalId: string, 
    topicId: string
  ) => {
    try {
      // 使用專門的狀態切換函數
      await markTaskInProgress(topicId, goalId, taskId);
    } catch (error) {
      console.error('恢復任務失敗:', error);
    }
  }, [markTaskInProgress]);

  /**
   * 處理切換完成堆疊顯示
   */
  const handleToggleCompletedStack = useCallback(() => {
    setShowCompletedDialog(true);
  }, []);

  /**
   * 處理打開記錄對話框
   */
  const handleOpenRecord = useCallback((task: TaskWithContext) => {
    setSelectedTaskForRecord({
      ...task,
      records: task.records // 已經是新格式，不需要再轉換
    });
    setShowRecordDialog(true);
  }, []);

  /**
   * 處理記錄保存
   */
  const handleSaveRecord = useCallback(async (record: any) => {
    if (!selectedTaskForRecord) return;

    try {
      // TODO: 實際保存到後端
      console.log('保存學習記錄:', record);
      
      // 暫時存到 localStorage
      const existingRecords = JSON.parse(localStorage.getItem('taskRecords') || '{}');
      existingRecords[selectedTaskForRecord.id] = {
        ...record,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('taskRecords', JSON.stringify(existingRecords));
    } catch (error) {
      console.error('保存記錄失敗:', error);
      throw error;
    }
  }, [selectedTaskForRecord]);

  /**
   * 從所有主題中提取活躍的任務
   * 過濾條件：未完成、未歸檔的任務
   */
  const activeTasks = useMemo((): TaskWithContext[] => {
    if (!topics) return [];

    const tasks: TaskWithContext[] = [];
    
    topics.forEach(topic => {
      // 只處理活躍的主題
      if (topic.status === 'archived') return;
      
      const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
      
      topic.goals?.forEach(goal => {
        // 只處理活躍的目標
        if (goal.status === 'archived') return;
        
        goal.tasks?.forEach(task => {
          // 只顯示待完成和進行中的任務
          if (task.status === 'todo' || task.status === 'in_progress') {
            tasks.push({
              ...task,
              topicId: topic.id,
              topicTitle: topic.title,
              topicSubject: topic.subject || '未分類',
              goalId: goal.id,
              goalTitle: goal.title,
              subjectStyle,
              records: (task.records || []).map(record => ({
                id: record.id,
                created_at: record.created_at || new Date().toISOString(),
                title: task.title,
                message: record.message || '',
                difficulty: record.difficulty || 3,
                completion_time: record.completion_time,
                files: record.files || [],
                tags: record.tags || []
              }))
            });
          }
        });
      });
    });

    // 根據排序模式進行排序
    return tasks.sort((a, b) => {
      if (config.sortMode === 'task_type') {
        // 任務類型排序：每週 > 其他計次 > 其他連續 > 其他累積 > 單次型任務
        const getTaskTypeOrder = (task: TaskWithContext) => {
          if (task.task_type === 'single') return 5; // 單次任務最後
          
          // 檢查是否是週循環
          const hasWeeklyCycle = (task.cycle_config as any)?.cycle_type === 'weekly';
          
          switch (task.task_type) {
            case 'count':
              return hasWeeklyCycle ? 1 : 2; // 週循環計次 > 其他計次
            case 'streak':
              return hasWeeklyCycle ? 1 : 3; // 週循環連續 > 其他連續
            case 'accumulative':
              return hasWeeklyCycle ? 1 : 4; // 週循環累積 > 其他累積
            default:
              return 5;
          }
        };
        
        const aOrder = getTaskTypeOrder(a);
        const bOrder = getTaskTypeOrder(b);
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // 相同類型則按狀態排序：進行中 > 待開始
        const statusOrder = { in_progress: 2, todo: 1 };
        const aStatus = statusOrder[a.status] || 1;
        const bStatus = statusOrder[b.status] || 1;
        
        if (aStatus !== bStatus) {
          return bStatus - aStatus;
        }
        
        // 相同狀態則按優先權排序
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // 最後按建立時間排序
        return b.id.localeCompare(a.id);
      } else {
        // 主題排序：按主題名稱，然後按狀態和優先權
        const topicCompare = a.topicTitle.localeCompare(b.topicTitle);
        
        if (topicCompare !== 0) {
          return topicCompare;
        }
        
        // 相同主題則按狀態排序
        const statusOrder = { in_progress: 2, todo: 1 };
        const aStatus = statusOrder[a.status] || 1;
        const bStatus = statusOrder[b.status] || 1;
        
        if (aStatus !== bStatus) {
          return bStatus - aStatus;
        }
        
        // 相同狀態則按優先權排序
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // 最後按建立時間排序
        return b.id.localeCompare(a.id);
      }
    });
  }, [topics, config.sortMode]);

  /**
   * 從所有主題中提取需要建立任務的目標
   * 過濾條件：沒有任務或所有任務都已完成的活躍目標
   */
  const goalsNeedingTasks = useMemo((): GoalWithContext[] => {
    if (!topics) return [];

    const goals: GoalWithContext[] = [];
    
    topics.forEach(topic => {
      if (topic.status === 'archived') return;
      
      const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
      
      topic.goals?.forEach(goal => {
        if (goal.status === 'archived') return;
        
        // 檢查目標是否需要更多任務
        const activeTasks = goal.tasks?.filter(t => t.status !== 'archived') || [];
        const incompleteTasks = activeTasks.filter(t => t.status !== 'done');
        
        // 如果沒有未完成的任務，這個目標需要新任務
        if (incompleteTasks.length === 0) {
          goals.push({
            ...goal,
            topicId: topic.id,
            topicTitle: topic.title,
            topicSubject: topic.subject || '未分類',
            subjectStyle
          });
        }
      });
    });

    return goals;
  }, [topics]);

  /**
   * 根據配置過濾任務
   */
  const filteredTasks = useMemo(() => {
    let filtered = activeTasks;
    
    // 優先權過濾
    if (config.priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === config.priorityFilter);
    }
    
    // 顯示所有符合條件的任務（移除數量限制）
    return filtered;
  }, [activeTasks, config]);

  /**
   * 只顯示任務卡片
   */
  const allCards = useMemo(() => {
    return filteredTasks.map(task => ({ type: 'task' as const, data: task }));
  }, [filteredTasks]);

  /**
   * 處理主題數據，計算各種統計資訊
   */
  const topicCards = useMemo((): TopicCardData[] => {
    if (!topics) return [];

    return topics
      .filter(topic => topic.status !== 'archived')
      .map(topic => {
        const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
        
        // 計算目標統計
        const activeGoals = (topic.goals || []).filter(goal => goal.status !== 'archived');
        const totalGoals = activeGoals.length;
        const completedGoals = activeGoals.filter(goal => {
          const goalTasks = (goal.tasks || []).filter(task => task.status !== 'archived');
          return goalTasks.length > 0 && goalTasks.every(task => task.status === 'done');
        }).length;

        // 計算任務統計
        let totalTasks = 0;
        let completedTasks = 0;
        let inProgressTasks = 0;
        let needHelpCount = 0;

        activeGoals.forEach(goal => {
          const goalTasks = (goal.tasks || []).filter(task => task.status !== 'archived');
          totalTasks += goalTasks.length;
          
          goalTasks.forEach(task => {
            if (task.status === 'done') {
              completedTasks++;
            } else if (task.status === 'in_progress') {
              inProgressTasks++;
            }
            
            if (task.need_help) {
              needHelpCount++;
            }
          });
        });

        // 計算整體進度
        const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // 獲取協作者資訊
        const collaborators = topic.is_collaborative ? (topic.collaborators || []) : [];

        return {
          topic,
          subjectStyle,
          totalGoals,
          completedGoals,
          totalTasks,
          completedTasks,
          inProgressTasks,
          needHelpCount,
          collaborators,
          overallProgress
        };
      })
      .sort((a, b) => {
        // 排序邏輯：進行中任務多的在前，然後按進度，最後按更新時間
        if (a.inProgressTasks !== b.inProgressTasks) {
          return b.inProgressTasks - a.inProgressTasks;
        }
        if (a.overallProgress !== b.overallProgress) {
          return a.overallProgress - b.overallProgress; // 進度低的在前（需要更多關注）
        }
        return b.topic.id.localeCompare(a.topic.id); // 新的在前
      });
  }, [topics]);

  /**
   * 處理主題點擊 - 開啟 TopicReviewPage
   */
  const handleTopicClick = useCallback((topicId: string) => {
    if (!topicId) return;
    setLoadingTopicId(topicId);
    setShowTopicReviewId(topicId);
    
    setTimeout(() => {
      setLoadingTopicId(null);
    }, 500);
  }, []);

  // 修改切換視圖模式的處理函數
  const handleViewModeChange = async (mode: 'tasks' | 'topics') => {
    setIsViewModeChanging(true);
    setConfig(prev => ({ ...prev, viewMode: mode }));
    // 模擬載入延遲
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsViewModeChanging(false);
  };

  // 在 TaskWallPage 組件中添加刷新函數
  const handleRecordSuccess = useCallback(async () => {
    setShowRecordDialog(false);
    setSelectedTaskForRecord(null);
    // 重新獲取最新數據
    await fetchTopics();
  }, [fetchTopics]);

  // 處理打開歷史記錄
  const handleOpenHistory = useCallback((task: TaskWithContext) => {
    setSelectedTaskForHistory(task);
    setShowHistoryDialog(true);
  }, []);

  // 處理設定週挑戰
  const handleSetChallenge = useCallback(() => {
    if (!challengeInput.trim()) return;
    
    const currentWeekStart = getWeekStart(getTaiwanDateString());
    const newChallenge = {
      title: challengeInput.trim(),
      completedDays: [],
      startDate: currentWeekStart
    };
    
    setWeeklyChallenge(newChallenge);
    localStorage.setItem('weeklyChallenge', JSON.stringify(newChallenge));
    setChallengeInput('');
    setEditingChallenge(false);
    
    toast.success('本週挑戰設定成功！🎯', {
      duration: 3000,
      style: {
        background: '#10B981',
        color: 'white',
        borderRadius: '12px'
      }
    });
  }, [challengeInput]);

  // 處理挑戰打卡
  const handleChallengeCheckIn = useCallback(() => {
    if (!weeklyChallenge) return;
    
    const today = getTaiwanDateString();
    const isAlreadyChecked = weeklyChallenge.completedDays.includes(today);
    
    if (isAlreadyChecked) {
      toast.error('今天已經打過卡了！明天再來吧 😊');
      return;
    }
    
    const updatedChallenge = {
      ...weeklyChallenge,
      completedDays: [...weeklyChallenge.completedDays, today]
    };
    
    setWeeklyChallenge(updatedChallenge);
    localStorage.setItem('weeklyChallenge', JSON.stringify(updatedChallenge));
    
    // 檢查是否完成本週挑戰
    if (updatedChallenge.completedDays.length === 7) {
      toast.success('🎉 恭喜完成本週挑戰！你太棒了！', {
        duration: 5000,
        style: {
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
          color: 'white',
          borderRadius: '12px',
          fontWeight: '600'
        }
      });
    } else {
      toast.success(`✨ 打卡成功！已完成 ${updatedChallenge.completedDays.length}/7 天`, {
        duration: 3000,
        style: {
          background: '#10B981',
          color: 'white',
          borderRadius: '12px'
        }
      });
    }
  }, [weeklyChallenge]);

  // 處理編輯挑戰
  const handleEditChallenge = useCallback(() => {
    if (weeklyChallenge) {
      setChallengeInput(weeklyChallenge.title);
    }
    setEditingChallenge(true);
  }, [weeklyChallenge]);

  // 處理取消打卡
  const handleCancelCheckIn = useCallback(() => {
    if (!weeklyChallenge) return;
    
    const today = getTaiwanDateString();
    const isAlreadyChecked = weeklyChallenge.completedDays.includes(today);
    
    if (!isAlreadyChecked) {
      toast.error('今天還沒有打卡記錄');
      return;
    }
    
    const updatedChallenge = {
      ...weeklyChallenge,
      completedDays: weeklyChallenge.completedDays.filter(date => date !== today)
    };
    
    setWeeklyChallenge(updatedChallenge);
    localStorage.setItem('weeklyChallenge', JSON.stringify(updatedChallenge));
    
    toast.success('已取消今日打卡', {
      duration: 3000,
      style: {
        background: '#64748B',
        color: 'white',
        borderRadius: '12px'
      }
    });
  }, [weeklyChallenge]);

  /**
   * 遷移週挑戰到新的任務結構
   */
  const migrateWeeklyChallengeToTask = useCallback(async () => {
    if (!weeklyChallenge || !currentUser) return;

    try {
      // 找到或創建"個人習慣"主題
      let habitTopic = topics?.find(topic => topic.title === '個人習慣' && topic.subject === '生活');
      
      if (!habitTopic) {
        // 創建個人習慣主題
        const newTopic = await createTopic({
          title: '個人習慣',
          description: '培養良好的日常習慣',
          subject: '生活',
          status: 'active',
          is_collaborative: false,
          show_avatars: false
        });
        
        if (!newTopic) {
          toast.error('創建習慣主題失敗');
          return;
        }
        habitTopic = newTopic;
      }

      // 找到或創建"每週挑戰"目標
      let challengeGoal = habitTopic.goals?.find(goal => goal.title === '每週挑戰');
      
      if (!challengeGoal) {
        const newGoal = await addGoal(habitTopic.id, {
          title: '每週挑戰',
          description: '堅持完成本週設定的挑戰',
          status: 'todo',
          priority: 'high',
          order_index: 0
        });
        
        if (!newGoal) {
          toast.error('創建挑戰目標失敗');
          return;
        }
        challengeGoal = newGoal;
      }

      // 創建連續型任務
      const weekStart = getWeekStart(getTaiwanDateString());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const taskConfig = {
        type: 'streak' as const,
        target_days: 7,
        current_streak: weeklyChallenge.completedDays.length,
        max_streak: weeklyChallenge.completedDays.length,
        check_in_dates: weeklyChallenge.completedDays
      };

      const cycleConfig = {
        cycle_type: 'weekly' as const,
        start_date: weekStart,
        deadline: weekEnd.toISOString().split('T')[0],
        auto_reset: true
      };

      const progressData = {
        last_updated: new Date().toISOString(),
        completion_percentage: (weeklyChallenge.completedDays.length / 7) * 100,
        check_in_dates: weeklyChallenge.completedDays,
        current_streak: weeklyChallenge.completedDays.length,
        max_streak: weeklyChallenge.completedDays.length
      };

      const newTask = await addTask(challengeGoal.id, {
        title: weeklyChallenge.title,
        description: `本週挑戰：${weeklyChallenge.title}`,
        task_type: 'streak',
        task_config: taskConfig,
        cycle_config: cycleConfig,
        progress_data: progressData,
        status: 'in_progress',
        priority: 'high',
        order_index: 0,
        need_help: false
      });

      if (newTask) {
        // 清除舊的 localStorage 數據
        localStorage.removeItem('weeklyChallenge');
        setWeeklyChallenge(null);
        
        // 刷新頁面數據
        await fetchTopics();
        
        toast.success('週挑戰已成功遷移到任務系統！🎉', {
          duration: 5000,
          style: {
            background: '#10B981',
            color: 'white',
            borderRadius: '12px',
            fontWeight: '600'
          }
        });
      } else {
        toast.error('遷移任務失敗');
      }
    } catch (error) {
      console.error('遷移週挑戰失敗:', error);
      toast.error('遷移失敗，請稍後再試');
    }
  }, [weeklyChallenge, currentUser, topics, createTopic, addGoal, addTask, fetchTopics]);

  /**
   * 檢查是否需要提示用戶遷移週挑戰
   */
  const shouldShowMigrationPrompt = useMemo(() => {
    return weeklyChallenge && weeklyChallenge.completedDays.length > 0;
  }, [weeklyChallenge]);

  // 載入狀態
  if (loading) {
    return (
      <PageLayout title="任務牆">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </PageLayout>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <PageLayout title="任務牆">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">載入失敗：{error}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="任務牆">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B',
            borderRadius: '12px',
            fontWeight: '500'
          }
        }}
      />
      
      {/* 手作筆記本風格背景 */}
      <div 
        className="min-h-screen"
        style={{
          background: 'linear-gradient(135deg, #fefdf8 0%, #faf7f0 50%, #f7f3e9 100%)',
          backgroundImage: `
            radial-gradient(circle at 20px 50px, #00000008 1px, transparent 1px),
            radial-gradient(circle at 80px 20px, #00000008 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}
      >
        {/* 主要內容區域 */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {/* 任務牆標題區域 - 保持整條 */}
          <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-sm border-b border-amber-200/50 mb-4 rounded-2xl">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-amber-900">
                        {config.viewMode === 'tasks' ? '⭐ 任務牆' : '🐦 主題牆'}
                      </h1>
                      <StarCounter 
                        count={completedCount} 
                        isAnimating={isStarAnimating}
                        onClick={handleToggleCompletedStack}
                      />
                      <span className="text-sm text-amber-600">
                        {config.viewMode === 'tasks' ? (
                          `${allCards.length} 張卡片 • ${activeTasks.filter(task => task.status === 'in_progress').length} 個進行中 • ${config.sortMode === 'task_type' ? '類型排序' : '主題排序'}`
                        ) : (
                          `${topicCards.length} 個主題 • ${topicCards.reduce((sum, topic) => sum + topic.inProgressTasks, 0)} 個任務進行中`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* 緊湊模式切換按鈕 */}
                  <button
                    onClick={() => handleViewModeChange(config.viewMode === 'tasks' ? 'topics' : 'tasks')}
                    className="flex items-center bg-white/95 rounded-full shadow-lg border border-indigo-200 overflow-hidden hover:bg-indigo-50/50 transition-colors"
                    title={`切換到${config.viewMode === 'tasks' ? '主題' : '任務'}模式`}
                  >
                    <div className={`px-3 py-2 transition-all duration-300 flex items-center gap-2 ${
                      config.viewMode === 'tasks'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                        : 'text-slate-700'
                    }`}>
                      <span className="text-sm">⭐</span>
                      <span className="text-xs font-bold">任務</span>
                    </div>
                    <div className="w-px h-6 bg-indigo-200"></div>
                    <div className={`px-3 py-2 transition-all duration-300 flex items-center gap-2 ${
                      config.viewMode === 'topics'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
                        : 'text-slate-700'
                    }`}>
                      <span className="text-sm">🐦</span>
                      <span className="text-xs font-bold">主題</span>
                    </div>
                  </button>

                  {config.viewMode === 'tasks' && (
                    <button
                      onClick={() => setConfig(prev => ({ 
                        ...prev, 
                        sortMode: prev.sortMode === 'task_type' ? 'topic' : 'task_type' 
                      }))}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm border border-slate-200"
                      title={`當前排序: ${config.sortMode === 'task_type' ? '任務類型' : '主題分類'}`}
                    >
                      {config.sortMode === 'task_type' ? (
                        <>
                          <Target className="w-4 h-4" />
                          <span className="text-xs font-medium">類型排序</span>
                        </>
                      ) : (
                        <>
                          <BookMarked className="w-4 h-4" />
                          <span className="text-xs font-medium">主題排序</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setShowJournalDialog(true)}
                    className="p-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500 transition-all shadow-md hover:shadow-lg"
                    title="寫今日學習日記"
                  >
                    <BookMarked className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-full bg-white/80 text-amber-700 hover:bg-white transition-colors shadow-sm"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 根據模式決定佈局 */}
          {config.viewMode === 'tasks' ? (
            // 任務模式：全寬度佈局
            <div className="w-full">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-amber-800 mb-2">太棒了！</h3>
                  <p className="text-amber-600">所有任務都完成了，該享受成就感了！</p>
                </div>
              ) : (
                <TaskWallGrid
                  cards={allCards}
                  config={config}
                  onTaskStatusUpdate={handleTaskStatusUpdate}
                  onAddTaskToGoal={handleAddTaskToGoal}
                  onOpenRecord={handleOpenRecord}
                  onOpenHistory={handleOpenHistory}
                  onRecordSuccess={handleRecordSuccess}
                  currentUserId={currentUser?.id}
                  isLoading={isLoading}
                />
              )}
            </div>
          ) : (
            // 主題模式：全寬度佈局
            <div className="w-full">
              {topicCards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-2xl font-bold text-amber-800 mb-2">還沒有主題</h3>
                  <p className="text-amber-600 mb-4">建立你的第一個學習主題吧！</p>
                  <button
                    onClick={() => setShowTemplateBrowser(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-2xl font-medium hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    建立新主題
                  </button>
                </div>
              ) : (
                <TopicGrid
                  topics={topicCards.map(card => ({
                    ...card,
                    isLoading: card.topic.id === loadingTopicId
                  }))}
                  onTopicClick={handleTopicClick}
                  onCreateTopicClick={() => setShowTemplateBrowser(true)}
                  isLoading={isLoading}
                  isViewModeChanging={isViewModeChanging}
                  loadingTopicId={loadingTopicId}
                />
              )}
            </div>
          )}

          {/* 設定面板 */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                className="fixed top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-md shadow-2xl z-[100] p-6"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">任務牆設定</h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* 最大卡片數設定已移除 - 現在顯示所有卡片 */}

                  {/* 優先權過濾 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      優先權過濾
                    </label>
                    <select
                      value={config.priorityFilter}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        priorityFilter: e.target.value as any 
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="all">所有優先權</option>
                      <option value="high">高優先權</option>
                      <option value="medium">中優先權</option>
                      <option value="low">低優先權</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 完成任務 Dialog */}
        <CompletedTasksDialog
          isOpen={showCompletedDialog}
          onClose={() => setShowCompletedDialog(false)}
          completedTasks={completedTasks}
          onRestoreTask={handleRestoreTask}
          onClearStack={() => {
            setCompletedTasks([]);
            setCompletedCount(0);
            setShowCompletedDialog(false);
          }}
        />

        {/* 日誌記錄 Dialog */}
        <DailyJournalDialog
          isOpen={showJournalDialog}
          onClose={() => setShowJournalDialog(false)}
        />

        {/* 任務記錄 Dialog */}
        <TaskRecordDialog
          isOpen={showRecordDialog}
          task={{
            id: selectedTaskForRecord?.id || '',
            title: selectedTaskForRecord?.title || '',
            description: selectedTaskForRecord?.description
          }}
          onClose={() => {
            setShowRecordDialog(false);
            setSelectedTaskForRecord(null);
          }}
          onRecordSuccess={handleRecordSuccess}
        />

        {/* 溫馨提示 Dialog */}
        <CutePromptDialog
          isOpen={showPromptDialog}
          onClose={() => {
            setShowPromptDialog(false);
            setSelectedTaskForRecord(null);
          }}
          onConfirm={() => {
            setShowPromptDialog(false);
            setShowRecordDialog(true);
          }}
          title="需要記錄學習心得 📝"
          message="記錄一下這次的學習過程和收穫，這樣任務就能完成了！分享你的學習感想吧~ 😊"
        />

        {/* 主題詳細檢視 */}
        {showTopicReviewId && (
          <TopicReviewPage
            topicId={showTopicReviewId}
            onClose={() => {
              setShowTopicReviewId(null);
              setLoadingTopicId(null);
            }}
            onTaskClick={(taskId, goalId) => {
              console.log('Task clicked:', taskId, goalId);
            }}
            onGoalClick={(goalId) => {
              console.log('Goal clicked:', goalId);
            }}
          />
        )}

        {/* 歷史記錄對話框 */}
        <TaskRecordHistoryDialog
          isOpen={showHistoryDialog}
          onClose={() => {
            setShowHistoryDialog(false);
            setSelectedTaskForHistory(null);
          }}
          task={{
            id: selectedTaskForHistory?.id || '',
            title: selectedTaskForHistory?.title || '',
            records: selectedTaskForHistory?.records || [],
            topicTitle: selectedTaskForHistory?.topicTitle,
            subjectStyle: selectedTaskForHistory?.subjectStyle
          }}
        />

        {/* 主題模板瀏覽器 */}
        <TopicTemplateBrowser
          isOpen={showTemplateBrowser}
          onClose={() => setShowTemplateBrowser(false)}
          onTemplateSelected={(templateId) => {
            console.log('選擇了模板:', templateId);
            setShowTemplateBrowser(false);
            // 刷新主題列表
            fetchTopics();
          }}
          onCreateBlankTopic={() => {
            console.log('建立空白主題');
            setShowTemplateBrowser(false);
            // 刷新主題列表
            fetchTopics();
          }}
        />

      </div>
    </PageLayout>
  );
};

export default TaskWallPage; 