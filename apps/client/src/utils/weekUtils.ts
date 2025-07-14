/**
 * 週期計算工具 - 統一的週期邏輯
 * 
 * 🎯 功能：
 * - 統一所有週期 ID 生成和解析邏輯
 * - 基於週一開始的週期計算
 * - 支援時區處理
 * - 避免重複實現造成的不一致
 */

// 避免循環依賴，直接定義時區常數
const APP_TIMEZONE = 'Asia/Taipei';

// 簡化版本的時區處理函數
const getDateInTimezone = (date: Date, timezone: string = APP_TIMEZONE): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const getTodayInTimezone = (timezone: string = APP_TIMEZONE): string => {
  return getDateInTimezone(new Date(), timezone);
};

export interface WeekInfo {
  weekId: string;
  year: number;
  week: number;
  startDate: string;  // YYYY-MM-DD 格式
  endDate: string;    // YYYY-MM-DD 格式
  isCurrentWeek: boolean;
}

/**
 * 生成週期 ID (基於週一開始的週，統一邏輯)
 */
export const generateWeekId = (date: Date | string = new Date(), timezone: string = APP_TIMEZONE): string => {
  let targetDate: Date;
  if (typeof date === 'string') {
    targetDate = new Date(date + 'T00:00:00');
  } else {
    targetDate = new Date(date);
  }
  
  // 轉換到指定時區
  const dateInTz = getDateInTimezone(targetDate, timezone);
  const dateObj = new Date(dateInTz + 'T00:00:00');
  
  const year = dateObj.getFullYear();
  
  // 找到該日期所在週的週一
  const dayOfWeek = dateObj.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() + daysToMonday);
  
  // 找到該年第一個週一
  const firstDayOfYear = new Date(year, 0, 1);
  const firstDayOfWeek = firstDayOfYear.getDay();
  const daysToFirstMonday = firstDayOfWeek === 0 ? 1 : (8 - firstDayOfWeek) % 7;
  const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
  
  // 計算該週一距離第一個週一的週數
  const daysDiff = Math.floor((monday.getTime() - firstMonday.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.floor(daysDiff / 7) + 1;
  
  return `${year}W${weekNumber.toString().padStart(2, '0')}`;
};

/**
 * 從週期 ID 解析週期資訊
 */
export const parseWeekId = (weekId: string, timezone: string = APP_TIMEZONE): WeekInfo | null => {
  const match = weekId.match(/^(\d{4})W(\d{2})$/);
  if (!match) return null;
  
  const year = parseInt(match[1]);
  const week = parseInt(match[2]);
  
  // 找到該年第一個週一
  const firstDayOfYear = new Date(year, 0, 1);
  const firstDayOfWeek = firstDayOfYear.getDay();
  const daysToFirstMonday = firstDayOfWeek === 0 ? 1 : (8 - firstDayOfWeek) % 7;
  const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
  
  // 計算指定週的週一
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const startDate = getDateInTimezone(weekStart, timezone);
  const endDate = getDateInTimezone(weekEnd, timezone);
  
  // 檢查是否為當前週
  const today = getTodayInTimezone(timezone);
  const currentWeekId = generateWeekId(today, timezone);
  const isCurrentWeek = weekId === currentWeekId;
  
  return {
    weekId,
    year,
    week,
    startDate,
    endDate,
    isCurrentWeek
  };
};

/**
 * 獲取當前週期 ID
 */
export const getCurrentWeekId = (timezone: string = APP_TIMEZONE): string => {
  const today = getTodayInTimezone(timezone);
  return generateWeekId(today, timezone);
};

/**
 * 獲取指定日期所在週的開始日期（週一）
 */
export const getWeekStart = (date: string | Date = new Date(), timezone: string = APP_TIMEZONE): string => {
  const weekId = generateWeekId(date, timezone);
  const weekInfo = parseWeekId(weekId, timezone);
  return weekInfo?.startDate || '';
};

/**
 * 獲取指定日期所在週的結束日期（週日）
 */
export const getWeekEnd = (date: string | Date = new Date(), timezone: string = APP_TIMEZONE): string => {
  const weekId = generateWeekId(date, timezone);
  const weekInfo = parseWeekId(weekId, timezone);
  return weekInfo?.endDate || '';
};

/**
 * 獲取前一週的週期 ID
 */
export const getPreviousWeekId = (weekId: string, timezone: string = APP_TIMEZONE): string | null => {
  const weekInfo = parseWeekId(weekId, timezone);
  if (!weekInfo) return null;
  
  const prevWeekStart = new Date(weekInfo.startDate + 'T00:00:00');
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  
  return generateWeekId(prevWeekStart, timezone);
};

/**
 * 獲取下一週的週期 ID
 */
export const getNextWeekId = (weekId: string, timezone: string = APP_TIMEZONE): string | null => {
  const weekInfo = parseWeekId(weekId, timezone);
  if (!weekInfo) return null;
  
  const nextWeekStart = new Date(weekInfo.startDate + 'T00:00:00');
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  
  return generateWeekId(nextWeekStart, timezone);
};

/**
 * 格式化週期日期範圍顯示
 */
export const formatWeekRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  
  const formatDate = (date: Date) => {
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const dayOfWeek = dayNames[date.getDay()];
    return `${date.getMonth() + 1}/${date.getDate()}(${dayOfWeek})`;
  };
  
  return `${formatDate(start)} - ${formatDate(end)}`;
};

/**
 * 生成週期日期列表（週一到週日）
 */
export const generateWeekDates = (weekId: string, timezone: string = APP_TIMEZONE): string[] => {
  const weekInfo = parseWeekId(weekId, timezone);
  if (!weekInfo) return [];
  
  const dates: string[] = [];
  const startDate = new Date(weekInfo.startDate + 'T00:00:00');
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(getDateInTimezone(date, timezone));
  }
  
  return dates;
}; 