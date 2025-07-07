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

import React, { useMemo, useState } from 'react';
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
  const { 
    task, 
    currentUserId, 
    highlight = false, 
    onTaskAction, 
    onMigrate
  } = props;

  // 重置確認狀態
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { renderTopicTag, renderOwnerTag, renderBottomInfo } = useBaseTaskCard(task);

  // 解析任務配置
  const taskConfig = task.task_config as CountTaskConfig;
  const currentCount = task.progress_data?.current_count || taskConfig?.current_count || 0;
  const targetCount = task.progress_data?.target_count || taskConfig?.target_count || 7;
  const checkInDates = (task.progress_data as any)?.check_in_dates || [];
  
  console.log('📊 任務數據:', {
    taskTitle: task.title,
    taskConfig,
    progressData: task.progress_data,
    currentCount,
    targetCount,
    checkInDates
  });
  
  // 計算進度
  const progress = targetCount > 0 ? (currentCount / targetCount) * 100 : 0;
  const isCompleted = currentCount >= targetCount;
  
  // 檢查今天是否已經打卡 (使用 UTC+8)
  const isCheckedInToday = useMemo(() => {
    const now = new Date();
    const utc8Today = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const today = utc8Today.toISOString().split('T')[0];
    const isChecked = checkInDates.includes(today);
    
    console.log('🔍 打卡檢查:', {
      taskTitle: task.title,
      now: now.toISOString(),
      utc8Today: utc8Today.toISOString(),
      today,
      checkInDates,
      isChecked
    });
    
    return isChecked;
  }, [checkInDates, task.title]);

  // 生成週日期（針對週循環任務）
  const weekDates = useMemo(() => {
    if (task.cycle_config?.cycle_type !== 'weekly') {
      // 如果不是週循環，生成當前週的日期 (UTC+8，週一為起始)
      const today = new Date();
      // 轉換為 UTC+8 時區
      const utc8Today = new Date(today.getTime() + (8 * 60 * 60 * 1000));
      const startOfWeek = new Date(utc8Today);
      // 週一為起始 (getDay() 返回 0=週日, 1=週一, ..., 6=週六)
      const dayOfWeek = utc8Today.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 週日時需要回推6天到週一
      startOfWeek.setDate(utc8Today.getDate() - daysFromMonday);
      
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      return dates;
    }
    
    const cycleStart = task.cycle_config?.cycle_start_date;
    if (!cycleStart) {
      // 如果沒有設置開始日期，使用當前週 (UTC+8，週一為起始)
      const today = new Date();
      const utc8Today = new Date(today.getTime() + (8 * 60 * 60 * 1000));
      const startOfWeek = new Date(utc8Today);
      const dayOfWeek = utc8Today.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(utc8Today.getDate() - daysFromMonday);
      
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      return dates;
    }
    
    const dates: string[] = [];
    const startDate = new Date(cycleStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    console.log('週日期:', dates);
    console.log('打卡日期:', checkInDates);
    
    return dates;
  }, [task.cycle_config, checkInDates]);

  // 獲取詳細的打卡時間資料（模擬從 task_actions 表獲取）
  const checkInTimestamps = useMemo(() => {
    return checkInDates.map((date: string, index: number) => {
      // 使用日期字串作為種子，產生穩定的隨機時間
      const dateHash = date.split('-').reduce((acc, val) => acc + parseInt(val), 0);
      const baseHour = 8 + (dateHash + index) % 12; // 8點到19點之間
      const minute = (dateHash * 7 + index * 13) % 60; // 穩定的分鐘數
      
      const dayOfWeek = new Date(date).getDay();
      const dayName = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][dayOfWeek];
      
      return {
        date,
        time: `${baseHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        dayName,
        timestamp: new Date(`${date}T${baseHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`).getTime()
      };
    }).sort((a, b) => a.timestamp - b.timestamp); // 按時間排序
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
   * 處理重置操作
   */
  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onTaskAction) return;
    
    try {
      await onTaskAction(task.id, 'reset');
      setShowResetConfirm(false);
    } catch (error) {
      console.error('重置失敗:', error);
    }
  };

  /**
   * 渲染進度環
   */
  const renderProgressRing = () => {
    const radius = highlight ? 35 : 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

    return (
      <div className="relative flex items-center justify-center">
        <svg 
          className={`transform -rotate-90 ${highlight ? 'w-24 h-24' : 'w-16 h-16'}`} 
          viewBox="0 0 80 80"
        >

        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`${highlight ? 'text-2xl' : 'text-base'} font-bold ${highlight ? 'text-white' : 'text-gray-800'}`}>
              {currentCount}
            </div>
            <div className={`${highlight ? 'text-sm' : 'text-xs'} ${highlight ? 'text-white/80' : 'text-gray-600'}`}>
              /{targetCount}
            </div>
          </div>
        </div>
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
        <div 
          className="absolute inset-0 w-full h-full rounded-2xl shadow-lg border-0 text-white overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgb(99 102 241), rgb(147 51 234), rgb(236 72 153))',
            backfaceVisibility: 'hidden'
          }}
        >
          {/* 背景裝飾 */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
          </div>

          <div className="relative z-10 p-4 h-full flex flex-col">
            {/* 頂部：標籤 */}
            <div className="mb-3">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                <Trophy className="w-3 h-3" />
                週挑戰
              </div>
            </div>

            {/* 中間：任務標題和進度 */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-2">
                <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                  {task.title}
                </h3>
              </div>
              
              {/* 進度文字 */}
              <div className="mb-3">
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <span className="text-yellow-300">🎯</span>
                  <span>{currentCount}/{targetCount} 次</span>
                </div>
              </div>
            </div>

            {/* 底部：打卡按鈕 */}
            <div className="space-y-3">
              {isCheckedInToday ? (
                <div className="w-full py-3 rounded-xl font-bold text-sm bg-white/20 text-white/80 text-center border border-white/30">
                  今天已完成 ✅
                </div>
              ) : (
                <motion.button
                  onClick={handleCheckIn}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg bg-white/90 text-indigo-600 hover:bg-white hover:scale-105 active:scale-95"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  今天完成了 ✨
                </motion.button>
              )}

              {/* 底部目標資訊和每日打卡 indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <Target className="w-3 h-3" />
                  <span className="truncate">每週挑戰目標</span>
                </div>
                {/* 每日打卡 indicator - 7個小圓點 */}
                <div className="flex gap-1">
                  {weekDates.length > 0 ? (
                    weekDates.map((date, i) => {
                      const isChecked = checkInDates.includes(date);
                      const now = new Date();
                      const utc8Today = new Date(now.getTime() + (8 * 60 * 60 * 1000));
                      const today = utc8Today.toISOString().split('T')[0];
                      const isToday = date === today;
                      
                      return (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all ${
                            isChecked 
                              ? 'bg-yellow-300 shadow-sm' 
                              : isToday 
                                ? 'bg-white/80 ring-1 ring-white/60' 
                                : 'bg-white/40'
                          }`}
                        />
                      );
                    })
                  ) : (
                    [...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-white/40"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 狀態指示器 - 右上角 */}
            <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
              🎯
            </div>
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

          {/* 狀態指示器 */}
          {task.status === 'in_progress' && (
            <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
              📊
            </div>
          )}
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
        <div className="w-full h-full flex flex-col text-white relative">
          {/* 背景裝飾 - 覆蓋 BaseTaskCard 的背景 */}
          <div className="absolute -inset-4 -z-10">
            <div className="w-full h-full rounded-2xl" style={{
              background: 'linear-gradient(135deg, rgb(99 102 241), rgb(147 51 234), rgb(236 72 153))'
            }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
            </div>
          </div>

          {/* 內容區域 */}
          <div className="w-full h-full flex flex-col relative z-10">
            {/* 頂部標籤 */}
            {!showResetConfirm && (
              <div className="mb-4">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                  <Calendar className="w-3 h-3" />
                  詳細記錄
                </div>
              </div>
            )}

            {/* 主要內容區域 */}
            <div className="flex-1 overflow-y-auto">
              {showResetConfirm ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="text-center space-y-2">
                    <div className="text-2xl">⚠️</div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">重新設定挑戰</p>
                      <p className="text-xs text-white/80">會清空所有進度</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowResetConfirm(false);
                      }}
                      className="flex-1 py-2 px-3 bg-white/20 rounded-lg text-xs hover:bg-white/30 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2 px-3 bg-red-500/80 rounded-lg text-xs hover:bg-red-500 transition-colors"
                    >
                      確定重設
                    </button>
                  </div>
                </div>
              ) : checkInTimestamps.length > 0 ? (
                <div className="space-y-2">
                  {checkInTimestamps.map((record, index) => (
                    <motion.div
                      key={record.date}
                      className="flex items-center justify-between p-2 bg-white/10 rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs font-medium">{record.dayName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/90">
                          {new Date(record.date).toLocaleDateString('zh-TW', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-xs text-white/70">
                          {record.time}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <p className="text-sm text-white/70">還沒有打卡記錄</p>
                  <p className="text-xs text-white/50">完成任務後會顯示在這裡</p>
                </div>
              )}
            </div>

            {/* 底部 footer */}
            {!showResetConfirm && (
              <div className="mt-3 pt-2 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80">已完成 {checkInTimestamps.length}/7 次</span>
                                  <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('重新設定按鈕被點擊');
                    setShowResetConfirm(true);
                  }}
                  className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  title="重新設定"
                >
                  <RotateCcw className="w-3 h-3 text-white" />
                </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // 普通模式：使用默認背面
      return null;
    }
  };

  return (
    <BaseTaskCard
      {...props}
      highlight={highlight}
      className={highlight ? 'max-w-xs' : ''} // 特化模式使用較小的寬度
      cardClassName={highlight ? '' : ''} // 特化模式由 renderContent 完全控制樣式
      frontClassName={highlight ? '' : ''}
      backClassName={highlight ? '' : ''}
      style={highlight ? {} : {}} // 特化模式不需要額外的 style
                    renderContent={(showReferenceInfo) => ({
        frontContent: renderFrontContent(),
        backContent: renderBackContent(),
        statusIndicator: null, // 已在 frontContent 中處理
        actionButtons: undefined // BaseTaskCard 已經正確處理 pointer-events
      })}
    />
  );
}; 