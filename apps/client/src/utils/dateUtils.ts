import { TaskStatus } from '../types/task';

export const formatDate = (date: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  // 計算日期差
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // 優先判斷今天、明天、昨天
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === -1) return '昨天';
  
  // 判斷是否在本週內
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  if (targetDate >= weekStart && targetDate <= weekEnd) {
    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    return weekdays[targetDate.getDay()];
  }
  
  // 其他日期顯示月日
  return `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
};

export const getDueDateStyle = (endDate: string, status: TaskStatus) => {
  // 如果任務已完成或待回饋，使用預設樣式（不上色）
  if (status === 'completed' || status === 'waiting_feedback') {
    return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(endDate);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // 只有過期的才標示紅色，其他都用預設樣式
  if (diffDays < 0) {
    return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  } else {
    return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400';
  }
}; 