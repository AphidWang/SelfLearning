/**
 * AccumulativeTaskCard - 累積型任務卡片
 * 
 * 🎯 功能說明：
 * - 繼承 BaseTaskCard 的基礎功能
 * - 專門處理累積型任務（task_type: 'accumulative'）
 * - 支援累積量添加和進度顯示
 * - 顯示累積進度條和單位
 * 
 * 🎨 視覺設計：
 * - 累積進度條顯示
 * - 當前累積量/目標累積量
 * - 單位顯示（分鐘、次數、頁數等）
 * - 累積記錄按鈕
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Target, Plus, BarChart3, 
  Clock, BookOpen, Award, Calendar
} from 'lucide-react';
import { BaseTaskCard, BaseTaskCardProps, useBaseTaskCard } from './BaseTaskCard';
import { AccumulativeTaskConfig } from '../../../../types/goal';
import { getDailyAmountRecords } from '../../../../utils/taskHelpers';

interface AccumulativeTaskCardProps extends BaseTaskCardProps {
  onTaskAction?: (taskId: string, action: 'add_amount' | 'reset', params?: any) => Promise<void>;
}

export const AccumulativeTaskCard: React.FC<AccumulativeTaskCardProps> = (props) => {
  const { task, currentUserId, onTaskAction } = props;
  const { renderTopicTag, renderOwnerTag, renderBottomInfo } = useBaseTaskCard(task);

  // 解析任務配置
  const taskConfig = task.task_config as AccumulativeTaskConfig;
  const taskActions = task.task_actions || [];
  const dailyRecords = getDailyAmountRecords(taskActions);
  const currentAmount = dailyRecords.reduce((sum, r) => sum + r.amount, 0);
  const targetAmount = taskConfig?.target_amount || 100;
  const unit = taskConfig?.unit || '次';
  
  // 計算進度
  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const isCompleted = currentAmount >= targetAmount;
  
  // 計算今日累積量
  const todayAmount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = dailyRecords.find((record: any) => record.date === today);
    return todayRecord?.amount || 0;
  }, [dailyRecords]);

  // 計算最近7天的累積情況
  const recentWeekData = useMemo(() => {
    const days: Array<{
      date: string;
      amount: number;
      isToday: boolean;
    }> = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const record = dailyRecords.find((r: any) => r.date === dateStr);
      const amount = record?.amount || 0;
      
      days.push({
        date: dateStr,
        amount,
        isToday: i === 0
      });
    }
    
    return days;
  }, [dailyRecords]);

  /**
   * 處理累積操作
   */
  const handleAddAmount = async (amount: number) => {
    if (!onTaskAction) return;
    
    try {
      await onTaskAction(task.id, 'add_amount', { amount, unit });
    } catch (error) {
      console.error('添加累積量失敗:', error);
    }
  };

  /**
   * 渲染累積進度環
   */
  const renderProgressRing = () => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;
    const displayProgress = Math.min(progress, 100);

    return (
      <div className="relative flex items-center justify-center">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={task.subjectStyle.accent + '20'}
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={isCompleted ? '#10B981' : task.subjectStyle.accent}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            style={{
              transition: 'stroke-dasharray 0.5s ease-in-out, stroke 0.3s ease-in-out'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">
              {currentAmount}
            </div>
            <div className="text-xs text-gray-600">
              /{targetAmount}
            </div>
            <div className="text-xs text-gray-500">
              {unit}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染最近7天的累積記錄
   */
  const renderRecentWeekChart = () => {
    const maxAmount = Math.max(...recentWeekData.map(d => d.amount), 1);
    
    return (
      <div className="space-y-2">
        <div className="text-xs text-gray-600 text-center">最近7天累積</div>
        <div className="flex items-end justify-between gap-1 h-8">
          {recentWeekData.map((day, index) => {
            const height = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
            return (
              <div
                key={index}
                className={`flex-1 rounded-sm transition-all ${
                  day.isToday 
                    ? 'bg-gradient-to-t from-purple-500 to-purple-400' 
                    : day.amount > 0 
                      ? 'bg-gradient-to-t from-purple-300 to-purple-200' 
                      : 'bg-gray-100'
                }`}
                style={{ height: `${Math.max(height, 10)}%` }}
                title={`${day.date}: ${day.amount} ${unit}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>7天前</span>
          <span>今天</span>
        </div>
      </div>
    );
  };

  /**
   * 渲染正面內容
   */
  const renderFrontContent = () => (
    <div className="p-4 h-full flex flex-col">
      {/* 頂部：主題標籤 */}
      {renderTopicTag()}

      {/* 中間：任務標題和進度 */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-2">
          <h3 
            className="text-lg font-bold text-gray-800 leading-tight line-clamp-2 flex-1"
            style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
          >
            {task.title}
          </h3>
        </div>
        
        {/* 累積進度環 */}
        <div className="flex justify-center mb-3">
          {renderProgressRing()}
        </div>

        {/* 進度資訊 */}
        <div className="text-center mb-3">
          <div className="text-sm text-gray-600 mb-1">
            {isCompleted ? (
              <span className="text-green-600">🎉 目標達成！</span>
            ) : (
              <span className="text-purple-600">📈 累積進行中</span>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            進度：{Math.min(progress, 100).toFixed(1)}%
          </div>
          
          {todayAmount > 0 && (
            <div className="text-xs text-purple-600 font-medium">
              今天已累積 {todayAmount} {unit}
            </div>
          )}
        </div>

        {/* 最近7天圖表 */}
        <div className="mb-2">
          {renderRecentWeekChart()}
        </div>

        {/* Owner 標籤 */}
        <div style={{ marginTop: 'auto' }}>
          {renderOwnerTag(currentUserId)}
        </div>
      </div>

      {/* 底部：目標資訊 */}
      {renderBottomInfo()}
    </div>
  );

  /**
   * 渲染背面內容（自定義操作按鈕）
   */
  const renderBackContent = () => (
    <div className="p-4 h-full flex flex-col items-center justify-center gap-4">
      {/* 背面標題 */}
      <div className="text-center">
        <h4 className="text-sm font-bold text-gray-800 mb-1">
          {task.title}
        </h4>
        <div className="text-xs text-gray-600">
          累積進度：{currentAmount}/{targetAmount} {unit}
        </div>
      </div>

      {/* 快速添加按鈕 */}
      <div className="w-full space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleAddAmount(1);
            }}
            className="py-2 px-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            +1
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleAddAmount(5);
            }}
            className="py-2 px-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            +5
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleAddAmount(10);
            }}
            className="py-2 px-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            +10
          </motion.button>
        </div>
        
        {/* 自定義添加按鈕 */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            const amount = prompt(`請輸入要添加的${unit}數量:`);
            if (amount && !isNaN(Number(amount))) {
              handleAddAmount(Number(amount));
            }
          }}
          className="w-full py-2 px-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          自定義添加
        </motion.button>
        
        {/* 學習記錄按鈕 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            props.onOpenRecord?.(task);
          }}
          className="w-full py-2 px-3 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
        >
          📝 記錄進度
        </button>
      </div>
    </div>
  );

  /**
   * 渲染狀態指示器
   */
  const renderStatusIndicator = () => {
    if (isCompleted) {
      return (
        <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
          🏆
        </div>
      );
    } else if (todayAmount > 0) {
      return (
        <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
          📈
        </div>
      );
    } else if (task.status === 'in_progress') {
      return (
        <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
          🎯
        </div>
      );
    }
    return null;
  };

  return (
    <BaseTaskCard
      {...props}
      renderContent={() => ({
        frontContent: renderFrontContent(),
        backContent: renderBackContent(),
        statusIndicator: renderStatusIndicator(),
        actionButtons: null // 使用自定義操作按鈕
      })}
    />
  );
}; 