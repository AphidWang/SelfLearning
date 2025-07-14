/**
 * WeekSelector - 週期選擇器組件
 * 
 * 🎯 功能說明：
 * - 顯示和切換回顧週期
 * - 支援單週和多週選擇
 * - 遵循專案統一設計風格 [[memory:2569399]]
 * - 提供直觀的週期導航
 * 
 * 🎨 設計風格：
 * - 漸層背景和毛玻璃效果
 * - 圓角設計和縮放動畫
 * - 溫暖色調和彩色邊框
 * - Framer Motion 動畫過渡
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Plus, X, Check } from 'lucide-react';
import { 
  generateWeekId, 
  parseWeekId, 
  getPreviousWeekId, 
  getNextWeekId, 
  formatWeekRange,
  type WeekInfo 
} from '../../utils/weekUtils';

interface WeekSelectorProps {
  /** 當前選中的週期 ID (單週模式) */
  selectedWeekId?: string;
  /** 當前選中的週期 IDs (多週模式) */
  selectedWeekIds?: string[];
  /** 是否支援多週選擇 */
  allowMultiWeek?: boolean;
  /** 週期變更回調 */
  onChange: (weekId: string, weekIds: string[]) => void;
  /** 是否正在載入 */
  loading?: boolean;
  /** 組件標題 */
  title?: string;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  selectedWeekId,
  selectedWeekIds = [],
  allowMultiWeek = false,
  onChange,
  loading = false,
  title = "選擇回顧週期"
}) => {
  const [showMultiSelect, setShowMultiSelect] = useState(false);

  // 當前選中的主要週期
  const currentWeek = useMemo(() => {
    const weekId = selectedWeekId || (selectedWeekIds.length > 0 ? selectedWeekIds[0] : null);
    if (!weekId) {
      // 預設為當前週
      const today = new Date();
      const currentWeekId = generateWeekId(today);
      return parseWeekId(currentWeekId);
    }
    return parseWeekId(weekId);
  }, [selectedWeekId, selectedWeekIds]);

  // 生成可選週期列表（前後各4週）
  const availableWeeks = useMemo(() => {
    if (!currentWeek) return [];
    
    const weeks: WeekInfo[] = [];
    const baseDate = new Date(currentWeek.startDate);
    
    // 生成前後各4週的選項
    for (let offset = -4; offset <= 4; offset++) {
      const weekDate = new Date(baseDate);
      weekDate.setDate(baseDate.getDate() + (offset * 7));
      
      const weekId = generateWeekId(weekDate);
      const weekInfo = parseWeekId(weekId);
      
      if (weekInfo) {
        weeks.push(weekInfo);
      }
    }
    
    return weeks.sort((a, b) => b.year - a.year || b.week - a.week);
  }, [currentWeek]);

  // 切換到前一週
  const handlePreviousWeek = useCallback(() => {
    if (!currentWeek) return;
    
    const newWeekId = getPreviousWeekId(currentWeek.weekId);
    if (newWeekId) {
      onChange(newWeekId, allowMultiWeek ? [newWeekId] : []);
    }
  }, [currentWeek, onChange, allowMultiWeek]);

  // 切換到下一週
  const handleNextWeek = useCallback(() => {
    if (!currentWeek) return;
    
    const newWeekId = getNextWeekId(currentWeek.weekId);
    if (newWeekId) {
      onChange(newWeekId, allowMultiWeek ? [newWeekId] : []);
    }
  }, [currentWeek, onChange, allowMultiWeek]);

  // 切換多週選擇模式
  const handleToggleMultiSelect = useCallback(() => {
    setShowMultiSelect(!showMultiSelect);
  }, [showMultiSelect]);

  // 處理多週選擇
  const handleWeekToggle = useCallback((weekId: string) => {
    if (!allowMultiWeek) {
      onChange(weekId, [weekId]);
      return;
    }

    const currentSelected = selectedWeekIds || [];
    const isSelected = currentSelected.includes(weekId);
    
    let newSelected: string[];
    if (isSelected) {
      newSelected = currentSelected.filter(id => id !== weekId);
    } else {
      newSelected = [...currentSelected, weekId].sort();
    }
    
    // 確保至少有一週被選中
    if (newSelected.length === 0) {
      newSelected = [weekId];
    }
    
    onChange(newSelected[0], newSelected);
  }, [allowMultiWeek, selectedWeekIds, onChange]);

  // 使用統一的格式化函數
  const formatDateRange = formatWeekRange;

  if (!currentWeek) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* 標題 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h3>
        {allowMultiWeek && (
          <motion.button
            onClick={handleToggleMultiSelect}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-lg border border-orange-200 dark:border-orange-800 hover:scale-105 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showMultiSelect ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showMultiSelect ? '單週模式' : '多週模式'}
          </motion.button>
        )}
      </div>

      {/* 主要週期選擇器 */}
      <motion.div 
        className="relative bg-gradient-to-r from-orange-400 to-pink-400 p-[2px] rounded-2xl shadow-lg"
        layout
      >
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-4">
          <div className="flex items-center justify-between">
            {/* 前一週按鈕 */}
            <motion.button
              onClick={handlePreviousWeek}
              disabled={loading}
              className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-xl shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            {/* 當前週期顯示 */}
            <div className="flex-1 mx-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-orange-500" />
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {currentWeek.weekId}
                  {currentWeek.isCurrentWeek && (
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full">
                      本週
                    </span>
                  )}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatDateRange(currentWeek.startDate, currentWeek.endDate)}
              </div>
              {allowMultiWeek && selectedWeekIds.length > 1 && (
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  已選擇 {selectedWeekIds.length} 個週期
                </div>
              )}
            </div>

            {/* 下一週按鈕 */}
            <motion.button
              onClick={handleNextWeek}
              disabled={loading}
              className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-xl shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 多週選擇面板 */}
      <AnimatePresence>
        {showMultiSelect && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl border-2 border-orange-200 dark:border-orange-800 p-4"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableWeeks.map((week) => {
                const isSelected = selectedWeekIds.includes(week.weekId);
                return (
                  <motion.button
                    key={week.weekId}
                    onClick={() => handleWeekToggle(week.weekId)}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white border-orange-300'
                        : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="font-medium text-sm">
                      {week.weekId}
                      {week.isCurrentWeek && (
                        <span className="ml-1 text-xs opacity-80">本週</span>
                      )}
                    </div>
                    <div className="text-xs opacity-80 mt-1">
                      {formatDateRange(week.startDate, week.endDate)}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 載入指示器 */}
      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
            載入週期資料中...
          </div>
        </div>
      )}
    </div>
  );
}; 