/**
 * CountTaskCard - 計數型任務卡片
 * 
 * 🎯 功能說明：
 * - 繼承 BaseTaskCard 的基礎功能
 * - 專門處理計數型任務（task_type: 'count'）
 * - 支援打卡操作和進度顯示
 * - 支援特化模式：當 highlight=true 時啟用週挑戰風格
 * 
 * 🎨 視覺設計：
 * - 進度環顯示當前計數/目標計數
 * - 特化模式：漸層背景、特殊動畫
 * - 打卡按鈕和狀態指示
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Trophy, Calendar, Play, CheckCircle2, 
  Clock, RotateCcw, TrendingUp 
} from 'lucide-react';
import { BaseTaskCard, BaseTaskCardProps, useBaseTaskCard } from './BaseTaskCard';
import { CountTaskConfig } from '../../../../types/goal';

interface CountTaskCardProps extends BaseTaskCardProps {
  highlight?: boolean; // 是否啟用特化模式（週挑戰風格）
  onTaskAction?: (taskId: string, action: 'check_in' | 'reset') => Promise<void>;
  onMigrate?: () => void; // 遷移到新任務系統（特化模式用）
}

export const CountTaskCard: React.FC<CountTaskCardProps> = (props) => {
  const { task, currentUserId, highlight = false, onTaskAction, onMigrate } = props;
  const { renderTopicTag, renderOwnerTag, renderBottomInfo } = useBaseTaskCard(task);

  // 解析任務配置
  const taskConfig = task.task_config as CountTaskConfig;
  const currentCount = task.progress_data?.current_count || taskConfig?.current_count || 0;
  const targetCount = task.progress_data?.target_count || taskConfig?.target_count || 7;
  const checkInDates = (task.progress_data as any)?.check_in_dates || [];
  
  // 計算進度
  const progress = targetCount > 0 ? (currentCount / targetCount) * 100 : 0;
  const isCompleted = currentCount >= targetCount;
  
  // 檢查今天是否已經打卡
  const isCheckedInToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return checkInDates.includes(today);
  }, [checkInDates]);

  // 生成週日期（針對週循環任務）
  const weekDates = useMemo(() => {
    if (task.cycle_config?.cycle_type !== 'weekly') return [];
    
    const cycleStart = task.cycle_config?.cycle_start_date;
    if (!cycleStart) return [];
    
    const dates: string[] = [];
    const startDate = new Date(cycleStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }, [task.cycle_config]);

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
   * 處理重置操作
   */
  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onTaskAction) return;
    
    try {
      await onTaskAction(task.id, 'reset');
    } catch (error) {
      console.error('重置失敗:', error);
    }
  };

  /**
   * 渲染進度環
   */
  const renderProgressRing = () => {
    const radius = highlight ? 30 : 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

    return (
      <div className="relative flex items-center justify-center">
        <svg 
          className={`transform -rotate-90 ${highlight ? 'w-20 h-20' : 'w-16 h-16'}`} 
          viewBox="0 0 80 80"
        >
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={task.subjectStyle.accent + '20'}
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={task.subjectStyle.accent}
            strokeWidth="6"
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
            <div className={`${highlight ? 'text-lg' : 'text-base'} font-bold text-gray-800`}>
              {currentCount}
            </div>
            <div className={`${highlight ? 'text-xs' : 'text-xs'} text-gray-600`}>
              /{targetCount}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染週日期點（週循環專用）
   */
  const renderWeekDots = () => {
    if (!highlight || weekDates.length === 0) return null;

    const today = new Date().toISOString().split('T')[0];

    return (
      <div className="flex gap-1 justify-center">
        {weekDates.map((date, i) => {
          const isChecked = checkInDates.includes(date);
          const isToday = date === today;
          
          return (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                isChecked 
                  ? 'bg-yellow-400 shadow-sm' 
                  : isToday 
                    ? 'bg-white/80 ring-1 ring-white/60' 
                    : 'bg-white/50'
              }`}
            />
          );
        })}
      </div>
    );
  };

  /**
   * 渲染正面內容
   */
  const renderFrontContent = () => {
    if (highlight) {
      // 特化模式：週挑戰風格
      return (
        <div className="p-4 h-full flex flex-col text-white">
          {/* 頂部：標籤 */}
          <div className="mb-3">
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
              <Trophy className="w-3 h-3" />
              週挑戰
            </div>
          </div>

          {/* 中間：任務標題和進度 */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                {task.title}
              </h3>
            </div>
            
            {/* 進度環 */}
            <div className="flex justify-center mb-3">
              {renderProgressRing()}
            </div>

            {/* 週日期點 */}
            {renderWeekDots()}
          </div>

          {/* 底部：打卡按鈕 */}
          <div className="space-y-2">
            {isCheckedInToday ? (
              <div className="w-full py-2 rounded-xl font-bold text-sm bg-white/20 text-white/80 text-center border border-white/30">
                今天已完成 ✅
              </div>
            ) : (
              <motion.button
                onClick={handleCheckIn}
                className="w-full py-2 rounded-xl font-bold text-sm transition-all shadow-lg bg-white/90 text-indigo-600 hover:bg-white hover:scale-105 active:scale-95"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                今天完成了 ✨
              </motion.button>
            )}
          </div>
        </div>
      );
    } else {
      // 普通模式
      return (
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
            
            {/* 進度環 */}
            <div className="flex justify-center mb-2">
              {renderProgressRing()}
            </div>

            {/* 計數資訊 */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">
                {task.cycle_config?.cycle_type === 'weekly' && (
                  <span className="text-yellow-600">🎯 週挑戰 • </span>
                )}
                已完成 {currentCount}/{targetCount} 次
              </div>
              
              {isCompleted && (
                <div className="text-xs text-green-600 font-medium">
                  🎉 目標達成！
                </div>
              )}
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
    }
  };

  /**
   * 渲染背面內容
   */
  const renderBackContent = () => {
    if (highlight) {
      // 特化模式：顯示詳細記錄和重置按鈕
      return (
        <div className="p-4 h-full flex flex-col items-center justify-center gap-4 text-white" style={{ transform: 'scaleX(-1)' }}>
          <div className="text-center">
            <h4 className="text-sm font-bold text-white mb-2">
              {task.title}
            </h4>
            <div className="text-xs text-white/80">
              已完成 {currentCount}/{targetCount} 次
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="space-y-2 w-full">
            {onMigrate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMigrate();
                }}
                className="w-full py-2 px-3 bg-yellow-400/80 text-indigo-600 rounded-xl font-bold hover:bg-yellow-400 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                升級系統
              </button>
            )}
            
            <button
              onClick={handleReset}
              className="w-full py-2 px-3 bg-white/20 rounded-xl font-bold hover:bg-white/30 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              重新設定
            </button>
          </div>
        </div>
      );
    } else {
      // 普通模式：使用默認背面
      return null;
    }
  };

  /**
   * 渲染狀態指示器
   */
  const renderStatusIndicator = () => {
    if (highlight) {
      return (
        <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
          🎯
        </div>
      );
    } else if (task.status === 'in_progress') {
      return (
        <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
          📊
        </div>
      );
    }
    return null;
  };

  return (
    <BaseTaskCard
      {...props}
      highlight={highlight}
      cardClassName={highlight ? 'text-white' : ''}
      frontClassName={highlight ? '' : ''}
      backClassName={highlight ? '' : ''}
      style={highlight ? {
        background: 'linear-gradient(135deg, rgb(99 102 241), rgb(147 51 234), rgb(236 72 153))'
      } : {}}
      renderContent={() => ({
        frontContent: renderFrontContent(),
        backContent: renderBackContent(),
        statusIndicator: renderStatusIndicator(),
        actionButtons: highlight ? null : undefined // 特化模式不顯示基礎按鈕
      })}
    />
  );
}; 