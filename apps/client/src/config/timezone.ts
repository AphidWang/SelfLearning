/**
 * 時區配置
 * 統一處理應用中的時區相關邏輯
 */

// 應用預設時區 (UTC+8)
export const APP_TIMEZONE_OFFSET = 8;
export const APP_TIMEZONE = 'Asia/Taipei'; // 更標準的時區標識

/**
 * 獲取當前時區的今天日期字符串 (YYYY-MM-DD)
 * 使用標準的 Intl.DateTimeFormat API
 */
export const getTodayInTimezone = (timezone: string = APP_TIMEZONE): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now); // 直接返回 YYYY-MM-DD 格式
};

/**
 * 舊版本：使用偏移量計算（保留向後兼容）
 */
export const getTodayInTimezoneByOffset = (timezoneOffset: number = APP_TIMEZONE_OFFSET): string => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const localTime = new Date(utc + (timezoneOffset * 3600000));
  return localTime.toISOString().split('T')[0];
};

/**
 * 獲取指定日期在時區中的日期字符串
 */
export const getDateInTimezone = (date: Date, timezone: string = APP_TIMEZONE): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
};

/**
 * 檢查兩個日期是否是同一天（在指定時區）
 */
export const isSameDayInTimezone = (
  date1: Date | string, 
  date2: Date | string, 
  timezone: string = APP_TIMEZONE
): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return getDateInTimezone(d1, timezone) === getDateInTimezone(d2, timezone);
};

/**
 * 獲取昨天的日期字符串（在指定時區）
 */
export const getYesterdayInTimezone = (timezone: string = APP_TIMEZONE): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateInTimezone(yesterday, timezone);
};

/**
 * 計算兩個日期之間的天數差（在指定時區）
 */
export const getDaysDifferenceInTimezone = (
  date1: Date | string,
  date2: Date | string,
  timezone: string = APP_TIMEZONE
): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1 + 'T00:00:00') : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2 + 'T00:00:00') : date2;
  
  // 將兩個日期都轉換到指定時區的午夜
  const date1InTz = new Date(getDateInTimezone(d1, timezone) + 'T00:00:00');
  const date2InTz = new Date(getDateInTimezone(d2, timezone) + 'T00:00:00');
  
  const timeDiff = Math.abs(date2InTz.getTime() - date1InTz.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * 格式化時區顯示
 */
export const formatTimezone = (offset: number): string => {
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.abs(offset);
  return `UTC${sign}${hours}`;
};

/**
 * 獲取時區的當前時間（包含時分秒）
 */
export const getCurrentTimeInTimezone = (timezone: string = APP_TIMEZONE): Date => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const dateStr = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}T${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}:${parts.find(p => p.type === 'second')?.value}`;
  
  return new Date(dateStr);
};

console.log(`📅 時區配置已載入: ${APP_TIMEZONE} (${formatTimezone(APP_TIMEZONE_OFFSET)})`); 