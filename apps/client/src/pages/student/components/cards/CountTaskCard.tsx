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

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Trophy, Calendar, Play, CheckCircle2, 
  Clock, RotateCcw, TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import { BaseTaskCard, BaseTaskCardProps, useBaseTaskCard } from './BaseTaskCard';
import { CountTaskConfig } from '../../../../types/goal';
import { supabase } from '../../../../services/supabase';
import { useTaskStore } from '../../../../store/taskStore';
import { getCheckInDates } from '../../../../utils/taskHelpers';

interface CountTaskCardProps extends BaseTaskCardProps {
  highlight?: boolean; // 是否啟用特化模式（週挑戰風格）
  onTaskAction?: (taskId: string, action: 'check_in' | 'reset') => Promise<void>;
  onMigrate?: () => void; // 遷移到新任務系統（特化模式用）
  onTaskUpdate?: () => void; // 任務更新後的回調
}

export const CountTaskCard: React.FC<CountTaskCardProps> = (props) => {
  const { 
    task, 
    currentUserId, 
    highlight = false, 
    onTaskAction, 
    onTaskUpdate
  } = props;

  // 重置確認狀態
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // 取消打卡確認狀態
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [realCheckInTimes, setRealCheckInTimes] = useState<{[date: string]: string}>({});
  // 新增：本地任務狀態
  const [localTask, setLocalTask] = useState(task);
  const taskStore = useTaskStore();
  // 新增：打卡操作載入狀態
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  // 新增：當前顯示的記錄索引（背面用）
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);

  const { renderTopicTag, renderOwnerTag, renderBottomInfo } = useBaseTaskCard(localTask);

  // 監聽 task prop 變化，同步到本地狀態
  useEffect(() => {
    console.log('🟢 CountTaskCard 拿到新的 task:', task);
    setLocalTask(task);
  }, [task]);

  // 解析任務配置 - 使用本地狀態
  const taskConfig = localTask.task_config as CountTaskConfig;
  
  // 使用 useMemo 優化 checkInDates 計算，避免無限重新渲染
  const checkInDates = useMemo(() => {
    return getCheckInDates(localTask);
  }, [localTask.actions]);
  
  const currentCount = checkInDates.length;
  const targetCount = taskConfig?.target_count || 7;
  
  console.log('📊 任務數據:', {
    taskTitle: localTask.title,
    taskConfig,
    currentCount,
    targetCount,
    checkInDatesLength: checkInDates.length
  });
  
  // 計算進度
  const progress = targetCount > 0 ? (currentCount / targetCount) * 100 : 0;
  const isCompleted = currentCount >= targetCount;
  
  // 獲取台灣時間的今日日期字串
  const getTaiwanToday = () => {
    const now = new Date();
    // 使用 en-CA locale 直接獲取 YYYY-MM-DD 格式
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Taipei'
    }).format(now);
  };

  // 檢查今天是否已經打卡 (使用台灣時間)
  const isCheckedInToday = useMemo(() => {
    const today = getTaiwanToday();
    const isChecked = checkInDates.includes(today);
    
    return isChecked;
  }, [checkInDates]);

  // 獲取台灣時間的週一日期
  const getTaiwanMondayOfCurrentWeek = () => {
    const now = new Date();
    
    // 獲取台灣時間的今天日期字串 (YYYY-MM-DD)
    const taipeiFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const todayStr = taipeiFormatter.format(now); // YYYY-MM-DD 格式
    const today = new Date(todayStr + 'T00:00:00Z'); // 建立 UTC 日期對象
    
    // 計算週一
    const dayOfWeek = today.getUTCDay(); // 使用 UTC 方法避免時區問題
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 週日時需要回推6天到週一
    
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - daysFromMonday);
    
    return monday;
  };

  // 生成週日期（針對週循環任務）
  const weekDates = useMemo(() => {
    console.log('🔍 週日期生成邏輯檢查:', {
      taskTitle: localTask.title,
      cycleType: localTask.cycle_config?.cycle_type,
      cycleStart: localTask.cycle_config?.cycle_start_date
    });
    
    if (localTask.cycle_config?.cycle_type !== 'weekly') {
      console.log('📅 使用非週循環邏輯');
      // 如果不是週循環，生成當前週的日期（台灣時間，週一為起始）
      const mondayDate = getTaiwanMondayOfCurrentWeek();
      
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(mondayDate);
        date.setUTCDate(mondayDate.getUTCDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      console.log('📅 非週循環生成的週日期:', dates);
      return dates;
    }
    
    const cycleStart = localTask.cycle_config?.cycle_start_date;
    if (!cycleStart) {
      console.log('📅 週循環但無開始日期，使用當前週');
      // 如果沒有設置開始日期，使用當前週（台灣時間，週一為起始）
      const mondayDate = getTaiwanMondayOfCurrentWeek();
      
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(mondayDate);
        date.setUTCDate(mondayDate.getUTCDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      console.log('📅 週循環無開始日期生成的週日期:', dates);
      return dates;
    }
    
    console.log('📅 週循環有開始日期，使用 cycleStart:', cycleStart);
    const dates: string[] = [];
    const startDate = new Date(cycleStart + 'T00:00:00Z'); // 建立 UTC 日期對象
    
    // 確保從週一開始，無論 cycleStart 是週幾
    const dayOfWeek = startDate.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 週日時需要回推6天到週一
    startDate.setUTCDate(startDate.getUTCDate() - daysFromMonday);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    console.log('📅 週循環生成的週日期:', dates);
    
    return dates;
  }, [localTask.cycle_config?.cycle_type, localTask.cycle_config?.cycle_start_date, localTask.title]);

  // 載入真實的打卡時間資料 - 優化依賴陣列
  React.useEffect(() => {
    const loadRealCheckInTimes = async () => {
      if (!localTask.id || checkInDates.length === 0) return;
      
      try {
        console.log("🔍 載入真實的打卡時間資料，數量:", checkInDates.length);
        const { data: taskActions, error } = await supabase
          .from('task_actions')
          .select('action_date, action_timestamp')
          .eq('task_id', localTask.id)
          .eq('action_type', 'check_in')
          .in('action_date', checkInDates);

        if (error) {
          console.error('載入打卡時間失敗:', error);
          return;
        }

        const timeMap: {[date: string]: string} = {};
        taskActions?.forEach(action => {
          // 使用 Intl.DateTimeFormat 正確處理時區轉換
          const utcTime = new Date(action.action_timestamp);
          const timeStr = new Intl.DateTimeFormat('zh-TW', {
            timeZone: 'Asia/Taipei',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(utcTime);
          
          timeMap[action.action_date] = timeStr;
          console.log(`📅 打卡時間轉換: ${action.action_timestamp} -> ${timeStr} (${action.action_date})`);
        });

        setRealCheckInTimes(timeMap);
        console.log('✅ 載入真實打卡時間:', timeMap);
      } catch (error) {
        console.error('載入打卡時間錯誤:', error);
      }
    };

    loadRealCheckInTimes();
  }, [localTask.id, checkInDates.length]);

  // 獲取詳細的打卡時間資料（使用真實時間）
  const checkInTimestamps = useMemo(() => {
    const timestamps = checkInDates.map((date: string, index: number) => {
      const dayOfWeek = new Date(date).getDay();
      const dayName = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][dayOfWeek];
      
      // 使用真實時間，如果沒有則顯示 "--:--"
      const time = realCheckInTimes[date] || '--:--';
      
      return {
        date,
        time,
        dayName,
        timestamp: new Date(`${date}T00:00:00`).getTime() + index // 簡單排序用
      };
    }).sort((a, b) => b.timestamp - a.timestamp); // 按時間倒序排列，最新的在前
    
    return timestamps;
  }, [checkInDates.length, realCheckInTimes]);

  // 當記錄變化時，重置顯示索引到最新記錄
  useEffect(() => {
    setCurrentRecordIndex(0);
  }, [checkInTimestamps.length]);

  /**
   * 處理打卡操作 - 優化版本，只刷新當前卡片
   */
  const handleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCheckedInToday || isCheckingIn) return;
    
    setIsCheckingIn(true);
    
    try {
      // 檢查是否為週挑戰任務，使用不同的處理方式
      const isWeeklyChallenge = localTask.special_flags?.includes('weekly_quick_challenge');
      
      if (isWeeklyChallenge) {
        // 週挑戰任務：直接調用 taskStore 的 checkInTask 方法，只更新本地狀態
        const result = await taskStore.checkInTask(localTask.id);
        
        if (result.success && result.task) {
          console.log('✅ 週挑戰打卡成功，更新本地狀態');
          
          // 更新本地任務狀態，立即反映變化
          setLocalTask(prevTask => ({
            ...prevTask,
            task_config: result.task.task_config,
            version: result.task.version
          }));
          
          // 顯示成功提示
          const { default: toast } = await import('react-hot-toast');
          const checkInDates = getCheckInDates(result.task);
          const targetCount = (result.task.task_config as any)?.target_count || 7;
          toast.success(`今天完成了！進度 ${checkInDates.length}/${targetCount} 次 🎉`, {
            duration: 3000,
            style: {
              background: '#10B981',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '600'
            }
          });
          
          // 重新載入打卡時間資料
          setRealCheckInTimes({});
        } else {
          console.error('❌ 週挑戰打卡失敗:', result.success === false ? result.message : '未知錯誤');
          const { default: toast } = await import('react-hot-toast');
          toast.error(result.success === false ? result.message : '打卡失敗');
        }
      } else {
        // 普通任務：使用原來的方式，通過 onTaskAction 觸發全域刷新
        if (onTaskAction) {
          await onTaskAction(localTask.id, 'check_in');
        }
      }
    } catch (error: any) {
      console.error('打卡操作失敗:', error);
      const { default: toast } = await import('react-hot-toast');
      const msg =
        error?.message ||
        error?.data?.message ||
        error?.error_description ||
        error?.details ||
        error?.status ||
        error?.code ||
        JSON.stringify(error);
      toast.error('打卡失敗: ' + msg);
    } finally {
      setIsCheckingIn(false);
    }
  };

  /**
   * 處理重置操作
   */
  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onTaskAction) return;
    
    try {
      await onTaskAction(localTask.id, 'reset');
      setShowResetConfirm(false);
    } catch (error: any) {
      console.error('重置失敗:', error);
      const { default: toast } = await import('react-hot-toast');
      const msg =
        error?.message ||
        error?.data?.message ||
        error?.error_description ||
        error?.details ||
        error?.status ||
        error?.code ||
        JSON.stringify(error);
      toast.error('重置失敗: ' + msg);
    }
  };

  /**
   * 處理取消今日打卡 - 優化版本，只刷新當前卡片
   */
  const handleCancelTodayCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // 檢查是否為週挑戰任務，使用不同的處理方式
      const isWeeklyChallenge = localTask.special_flags?.includes('weekly_quick_challenge');
      
      if (isWeeklyChallenge) {
        // 週挑戰任務：直接調用 taskStore 的 cancelTodayCheckIn 方法，只更新本地狀態
        const result = await taskStore.cancelTodayCheckIn(localTask.id);
        
        if (result.success && result.task) {
          console.log('✅ 週挑戰取消打卡成功，更新本地狀態');
          
          // 更新本地任務狀態，立即反映變化
          setLocalTask(prevTask => ({
            ...prevTask,
            task_config: result.task.task_config,
            version: result.task.version
          }));
          
          // 顯示成功提示
          const { default: toast } = await import('react-hot-toast');
          toast.success('已取消今日打卡', {
            duration: 2000,
            style: {
              background: '#10B981',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '600'
            }
          });
          
          // 重新載入打卡時間資料
          setRealCheckInTimes({});
        } else {
          console.error('❌ 週挑戰取消打卡失敗:', result.success === false ? result.message : '未知錯誤');
          const { default: toast } = await import('react-hot-toast');
          toast.error(result.success === false ? result.message : '取消打卡失敗');
        }
      } else {
        // 普通任務：使用原來的方式
        const result = await taskStore.cancelTodayCheckIn(localTask.id);
        
        if (result.success) {
          console.log('✅ 普通任務取消打卡成功');
          // 觸發父組件重新載入任務資料
          if (onTaskUpdate) {
            onTaskUpdate();
          }
        } else {
          console.error('❌ 普通任務取消打卡失敗:', result.success === false ? result.message : '未知錯誤');
          const { default: toast } = await import('react-hot-toast');
          toast.error(result.success === false ? result.message : '取消打卡失敗');
        }
      }
      
      setShowCancelConfirm(false);
    } catch (error: any) {
      console.error('取消今日打卡失敗:', error);
      const { default: toast } = await import('react-hot-toast');
      const msg =
        error?.message ||
        error?.data?.message ||
        error?.error_description ||
        error?.details ||
        error?.status ||
        error?.code ||
        JSON.stringify(error);
      toast.error('取消打卡失敗: ' + msg);
      setShowCancelConfirm(false);
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
            {showCancelConfirm ? (
              // 取消打卡確認視窗 - 特化模式（全螢幕）
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-2">
                <div className="text-center space-y-3">
                  <div className="text-3xl">🤔</div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white">取消今日打卡</p>
                    <p className="text-sm text-white/80">確定要取消今天的打卡嗎？</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCancelConfirm(false);
                    }}
                    className="flex-1 py-1.5 px-3 bg-white/20 rounded text-xs font-medium hover:bg-white/30 transition-colors text-white"
                  >
                    保留打卡
                  </button>
                  <button
                    onClick={handleCancelTodayCheckIn}
                    className="flex-1 py-1.5 px-3 bg-orange-500/80 rounded text-xs font-medium hover:bg-orange-500 transition-colors text-white"
                  >
                    確定取消
                  </button>
                </div>
              </div>
            ) : (
              // 正常的卡片內容
              <>
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
                      {localTask.title}
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
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCancelConfirm(true);
                      }}
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-white/20 text-white/80 text-center border border-white/30 hover:bg-white/30 active:scale-95"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      title="點擊取消今日打卡"
                    >
                      今天已完成 ✅
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={handleCheckIn}
                      disabled={isCheckingIn}
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg bg-white/90 text-indigo-600 hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: isCheckingIn ? 1 : 1.02 }}
                      whileTap={{ scale: isCheckingIn ? 1 : 0.98 }}
                    >
                      {isCheckingIn ? '打卡中... ⏳' : '今天完成了 ✨'}
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
                          const today = getTaiwanToday(); // 使用正確的台灣時間
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
              </>
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
                {localTask.title}
              </h3>
            </div>
            
            {/* 進度環 */}
            <div className="flex justify-center mb-2">
              {renderProgressRing()}
            </div>

            {/* 計數資訊 */}
            <div className="text-center">
              {showCancelConfirm ? (
                // 取消打卡確認視窗 - 普通模式
                <div className="space-y-3">
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
              ) : (
                // 正常的計數資訊和打卡按鈕
                <>
                  <div className="text-sm text-gray-600 mb-1">
                    {localTask.cycle_config?.cycle_type === 'weekly' && (
                      <span className="text-yellow-600">🎯 週挑戰 • </span>
                    )}
                    已完成 {currentCount}/{targetCount} 次
                  </div>
                  
                  {isCompleted && (
                    <div className="text-xs text-green-600 font-medium">
                      🎉 目標達成！
                    </div>
                  )}

                  {/* 打卡按鈕 - 普通模式 */}
                  <div className="mt-2">
                    {isCheckedInToday ? (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCancelConfirm(true);
                        }}
                        className="w-full py-2 px-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors border border-green-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="點擊取消今日打卡"
                      >
                        今天已完成 ✅
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={handleCheckIn}
                        disabled={isCheckingIn}
                        className="w-full py-2 px-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: isCheckingIn ? 1 : 1.02 }}
                        whileTap={{ scale: isCheckingIn ? 1 : 0.98 }}
                      >
                        {isCheckingIn ? '打卡中... ⏳' : '今天完成了 📝'}
                      </motion.button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Owner 標籤 */}
            <div style={{ marginTop: 'auto' }}>
              {renderOwnerTag(currentUserId)}
            </div>
          </div>

          {/* 底部：目標資訊 */}
          {renderBottomInfo()}

          {/* 狀態指示器 - 右上角 */}
          {!showResetConfirm && !showCancelConfirm && (
            <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
              🎯
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

          {/* 內容區域 */}
          <div className="relative z-10 p-4 h-full flex flex-col">
            {/* 頂部標籤 */}
            {!showResetConfirm && (
              <div className="mb-3">
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
                <div className="flex flex-col h-full">
                  {/* 單個記錄顯示區域 - 使用原本的橫向佈局 */}
                  <div className="flex-1 flex items-center justify-center">
                    <motion.div
                      key={currentRecordIndex}
                      className="flex items-center justify-between p-2 bg-white/10 rounded-lg w-full"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs font-medium text-white">
                          {checkInTimestamps[currentRecordIndex]?.dayName}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/90">
                          {checkInTimestamps[currentRecordIndex]?.date && 
                            new Date(checkInTimestamps[currentRecordIndex].date).toLocaleDateString('zh-TW', { 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          }
                        </div>
                        <div className="text-xs text-white/70">
                          {checkInTimestamps[currentRecordIndex]?.time}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* 導航控制 */}
                  {checkInTimestamps.length > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentRecordIndex(prev => 
                            prev > 0 ? prev - 1 : checkInTimestamps.length - 1
                          );
                        }}
                        className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        title="上一個記錄"
                      >
                        <ChevronLeft className="w-3 h-3 text-white" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {checkInTimestamps.map((_, index) => (
                          <div
                            key={index}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              index === currentRecordIndex 
                                ? 'bg-white' 
                                : 'bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentRecordIndex(prev => 
                            prev < checkInTimestamps.length - 1 ? prev + 1 : 0
                          );
                        }}
                        className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        title="下一個記錄"
                      >
                        <ChevronRight className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
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
            {!showResetConfirm && !showCancelConfirm && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80">已完成 {checkInTimestamps.length}/7 次</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('重新設定按鈕被點擊');
                      setShowResetConfirm(true);
                    }}
                    className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    title="重新設定"
                  >
                    <RotateCcw className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 狀態指示器 - 右上角 */}
          {!showResetConfirm && (
            <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
              🎯
            </div>
          )}
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