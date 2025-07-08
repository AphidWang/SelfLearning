/**
 * StreakTaskCard - 連續型任務卡片
 * 
 * 🎯 功能說明：
 * - 繼承 BaseTaskCard 的基礎功能
 * - 專門處理連續型任務（task_type: 'streak'）
 * - 顯示連續天數和最高紀錄
 * - 支援打卡操作和連續性檢查
 * 
 * 🎨 視覺設計：
 * - 火焰圖示表示連續性
 * - 當前連續天數和最高紀錄對比
 * - 打卡日曆視覺化
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, Calendar, Star, CheckCircle2, 
  Zap, TrendingUp 
} from 'lucide-react';
import { BaseTaskCard, BaseTaskCardProps, useBaseTaskCard } from './BaseTaskCard';
import { StreakTaskConfig } from '../../../../types/goal';

interface StreakTaskCardProps extends BaseTaskCardProps {
  onTaskAction?: (taskId: string, action: 'check_in' | 'reset') => Promise<void>;
  onTaskUpdate?: () => void; // 任務更新後的回調
}

export const StreakTaskCard: React.FC<StreakTaskCardProps> = (props) => {
  const { task, currentUserId, onTaskAction } = props;
  const { renderTopicTag, renderOwnerTag, renderBottomInfo } = useBaseTaskCard(task);

  // 取消打卡確認狀態
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // 解析任務配置
  const taskConfig = task.task_config as StreakTaskConfig;
  const currentStreak = task.progress_data?.current_streak || taskConfig?.current_streak || 0;
  const maxStreak = task.progress_data?.max_streak || taskConfig?.max_streak || 0;
  const targetDays = taskConfig?.target_days || 7;
  const checkInDates = (task.progress_data as any)?.check_in_dates || taskConfig?.check_in_dates || [];
  
  // 計算進度
  const progress = targetDays > 0 ? (currentStreak / targetDays) * 100 : 0;
  const isCompleted = currentStreak >= targetDays;
  
  // 檢查今天是否已經打卡
  const isCheckedInToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return checkInDates.includes(today);
  }, [checkInDates]);

  // 檢查連續性是否中斷
  const isStreakBroken = useMemo(() => {
    if (checkInDates.length === 0) return false;
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    return !checkInDates.includes(todayStr) && !checkInDates.includes(yesterdayStr);
  }, [checkInDates]);

  /**
   * 處理打卡操作
   */
  const handleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCheckedInToday || !onTaskAction) return;
    
    try {
      await onTaskAction(task.id, 'check_in');
    } catch (error) {
      console.error('打卡失敗:', error);
    }
  };

  /**
   * 處理取消今日打卡
   */
  const handleCancelTodayCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // 這裡使用 topicStore 的 cancelTodayCheckIn 方法
      const { useTopicStore } = await import('../../../../store/topicStore');
      const result = await useTopicStore.getState().cancelTodayCheckIn(task.id);
      
      if (result.success) {
        console.log('✅ 成功取消今日打卡');
        // 觸發父組件重新載入任務資料
        if (props.onTaskUpdate) {
          props.onTaskUpdate();
        }
      } else {
        console.error('❌ 取消打卡失敗:', result.message);
        alert(result.message || '取消打卡失敗');
      }
      
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('取消今日打卡失敗:', error);
      alert('取消打卡失敗');
      setShowCancelConfirm(false);
    }
  };

  /**
   * 渲染連續天數圓環
   */
  const renderStreakRing = () => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

    return (
      <div className="relative flex items-center justify-center">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
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
            stroke={isStreakBroken ? '#EF4444' : task.subjectStyle.accent}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            style={{
              transition: 'stroke-dasharray 0.5s ease-in-out'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-base font-bold text-gray-800 flex items-center gap-1">
              {isStreakBroken ? (
                <span className="text-red-500">💔</span>
              ) : currentStreak > 0 ? (
                <Flame className="w-4 h-4 text-orange-500" />
              ) : (
                <span>⭐</span>
              )}
              {currentStreak}
            </div>
            <div className="text-xs text-gray-600">
              /{targetDays}天
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染最近7天的打卡記錄
   */
  const renderRecentDays = () => {
    const days: React.ReactElement[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const isChecked = checkInDates.includes(dateStr);
      const isToday = i === 0;
      
      days.push(
        <div
          key={i}
          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
            isChecked
              ? 'bg-green-500 text-white shadow-md'
              : isToday
                ? 'bg-blue-100 border-2 border-blue-300 text-blue-600'
                : 'bg-gray-100 text-gray-400'
          }`}
        >
          {isChecked ? '✓' : date.getDate()}
        </div>
      );
    }
    
    return <div className="flex gap-1 justify-center">{days}</div>;
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
        
        {/* 連續天數圓環 */}
        <div className="flex justify-center mb-2">
          {renderStreakRing()}
        </div>

        {/* 連續性資訊 */}
        <div className="text-center mb-2">
          <div className="text-sm text-gray-600 mb-1">
            {isStreakBroken ? (
              <span className="text-red-600">💔 連續中斷</span>
            ) : currentStreak > 0 ? (
              <span className="text-orange-600">🔥 連續 {currentStreak} 天</span>
            ) : (
              <span className="text-gray-600">🌱 開始連續挑戰</span>
            )}
          </div>
          
          {maxStreak > 0 && (
            <div className="text-xs text-gray-500">
              最佳紀錄：{maxStreak} 天 {maxStreak === currentStreak && currentStreak > 0 && '🏆'}
            </div>
          )}
          
          {isCompleted && (
            <div className="text-xs text-green-600 font-medium">
              🎉 目標達成！
            </div>
          )}
        </div>

        {/* 最近7天記錄 */}
        <div className="mb-2">
          {renderRecentDays()}
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
  const renderBackContent = () => {
    // 取消打卡確認對話框
    if (showCancelConfirm) {
      return (
        <div className="p-4 h-full flex flex-col items-center justify-center space-y-4">
          <div className="text-center space-y-2">
            <div className="text-2xl">🤔</div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-800">取消今日打卡</p>
              <p className="text-xs text-gray-600">確定要取消今天的打卡嗎？</p>
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCancelConfirm(false);
              }}
              className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
            >
              保留打卡
            </button>
            <button
              onClick={handleCancelTodayCheckIn}
              className="flex-1 py-2 px-3 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-600 transition-colors"
            >
              確定取消
            </button>
          </div>
        </div>
      );
    }

    // 正常的背面內容
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center gap-4">
        {/* 背面標題 */}
        <div className="text-center">
          <h4 className="text-sm font-bold text-gray-800 mb-1">
            {task.title}
          </h4>
          <div className="text-xs text-gray-600">
            連續挑戰：{currentStreak}/{targetDays} 天
          </div>
        </div>

        {/* 今日打卡按鈕 */}
        <div className="w-full space-y-2">
          {isCheckedInToday ? (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setShowCancelConfirm(true);
              }}
              className="w-full py-2 px-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium text-center border border-green-200 hover:bg-green-200 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="點擊取消今日打卡"
            >
              今天已打卡 ✅
            </motion.button>
          ) : (
            <motion.button
              onClick={handleCheckIn}
              className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-600 transition-all shadow-lg flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Flame className="w-4 h-4" />
              繼續連續！
            </motion.button>
          )}
          
          {/* 學習記錄按鈕 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onOpenRecord?.(task);
            }}
            className="w-full py-2 px-3 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
          >
            📝 記錄心得
          </button>
        </div>
      </div>
    );
  };

  /**
   * 渲染狀態指示器
   */
  const renderStatusIndicator = () => {
    if (isStreakBroken) {
      return (
        <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
          💔
        </div>
      );
    } else if (currentStreak > 0) {
      return (
        <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
          🔥
        </div>
      );
    } else if (task.status === 'in_progress') {
      return (
        <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
          🌱
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