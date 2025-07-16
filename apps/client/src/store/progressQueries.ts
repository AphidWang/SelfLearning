import type { Topic, Goal, Task } from '../types/goal';
import { supabase } from '../services/supabase';

/**
 * 計算主題完成率
 * @param topic Topic 物件
 * @returns 完成率（百分比，0~100）
 * 沒有做 db 的查詢，只是個 helper function
 */
export function getCompletionRate(topic: Topic): number {
  if (!topic.goals || topic.goals.length === 0) return 0;
  const allTasks = topic.goals.flatMap(g => g.tasks || []);
  if (allTasks.length === 0) return 0;
  const completedTasks = allTasks.filter(t => t.status === 'done').length;
  return Math.round((completedTasks / allTasks.length) * 100);
}

/**
 * 取得指定週期的主題進度摘要
 */
export async function getTopicsProgressForWeek(weekStart: string, weekEnd: string) {
  try {
    const { data, error } = await supabase.rpc('get_topics_progress_for_week', {
      p_week_start: weekStart,
      p_week_end: weekEnd
    });
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    // 可根據需要加上錯誤處理
    return [];
  }
}

/**
 * 取得所有活躍主題的進度摘要
 */
export async function getActiveTopicsWithProgress() {
  try {
    const { data, error } = await supabase.rpc('get_active_topics_with_progress', {});
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    // 可根據需要加上錯誤處理
    return [];
  }
} 