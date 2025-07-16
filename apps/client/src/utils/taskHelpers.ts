// 取得所有打卡日期（去重排序）
import { TaskAction, Task} from '../types/goal';

export function getCheckInDates(task: Task): string[] {
  if (task.actions && task.actions.length > 0) {
    return Array.from(new Set(task.actions.filter(a => a.action_type === 'check_in').map(a => a.action_date))).sort();
  } else {
    return [];
  }
}

// 取得累積型任務的每日累積量
export function getDailyAmountRecords(task: Task): { date: string, amount: number }[] {
  if (task.actions && task.actions.length > 0) {
    const addAmountActions = task.actions.filter(a => a.action_type === 'add_amount');
    const map: Record<string, number> = {};
    addAmountActions.forEach(a => {
        const date = a.action_date;
        const amount = Number(a.action_data?.amount) || 0;
        map[date] = (map[date] || 0) + amount;
    });
    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  } else {
    return [];
  }
}

// 算 current streak
export function getCurrentStreak(checkInDates: string[]): number {
  if (checkInDates.length === 0) return 0;
  let streak = 0;
  let today = new Date();
  for (let i = checkInDates.length - 1; i >= 0; i--) {
    const date = new Date(checkInDates[i]);
    if (
      date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
      || (streak > 0 && date.toISOString().split('T')[0] === new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0])
    ) {
      streak++;
      today = new Date(date);
    } else {
      break;
    }
  }
  return streak;
}

// 算 max streak
export function getMaxStreak(checkInDates: string[]): number {
  if (checkInDates.length === 0) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < checkInDates.length; i++) {
    const prev = new Date(checkInDates[i - 1]);
    const curr = new Date(checkInDates[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 3600 * 24);
    if (diff === 1) {
      cur++;
      max = Math.max(max, cur);
    } else {
      cur = 1;
    }
  }
  return max;
} 