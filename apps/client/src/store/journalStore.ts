import { supabase } from '../services/supabase';
import { getTodayInTimezone } from '../config/timezone';

export type MoodType = 'excited' | 'happy' | 'okay' | 'tired' | 'stressed';

export interface CompletedTask {
  id: string;
  title: string;
  type: 'recorded' | 'completed';
  difficulty?: number;
  time: string;
  category?: string;
  assignedTo?: string;
}

export interface DailyJournal {
  id: string;
  user_id: string;
  date: string;
  mood: MoodType;
  motivation_level: number;
  content: string;
  has_voice_note: boolean;
  voice_note_url?: string;
  completed_tasks: CompletedTask[];
  created_at: string;
  updated_at: string;
}

export interface CreateJournalEntry {
  mood: MoodType;
  motivation_level: number;
  content: string;
  has_voice_note: boolean;
  voice_note_url?: string;
  date?: string; // 如果不提供，使用今天
  completed_tasks?: CompletedTask[]; // 如果不提供，會自動從資料庫獲取
}

class JournalStore {
  // 建立或更新今日日記
  async saveJournalEntry(entry: CreateJournalEntry): Promise<DailyJournal> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未登入');

      const journalDate = entry.date || getTodayInTimezone();

      // 如果沒有提供 completed_tasks，使用資料庫函數獲取
      let completed_tasks = entry.completed_tasks;
      if (!completed_tasks) {
        const { data: tasksData } = await supabase
          .rpc('get_completed_tasks_for_date', {
            target_date: journalDate,
            target_user_id: user.id
          });
        completed_tasks = tasksData || [];
      }

      const journalData = {
        user_id: user.id,
        date: journalDate,
        mood: entry.mood,
        motivation_level: entry.motivation_level,
        content: entry.content,
        has_voice_note: entry.has_voice_note,
        voice_note_url: entry.voice_note_url,
        completed_tasks
      };

      // 使用 upsert 來處理一天只能有一篇日記的邏輯
      const { data, error } = await supabase
        .from('daily_journals')
        .upsert(journalData, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('儲存日記失敗:', error);
      throw error;
    }
  }

  // 獲取用戶的所有日記（分頁）
  async getJournalHistory(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ journals: DailyJournal[]; total: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未登入');

      // 獲取總數
      const { count } = await supabase
        .from('daily_journals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 獲取日記列表
      const { data, error } = await supabase
        .from('daily_journals')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        journals: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('獲取日記歷史失敗:', error);
      throw error;
    }
  }

  // 獲取今日日記
  async getTodayJournal(): Promise<DailyJournal | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未登入');

      const today = getTodayInTimezone();

      const { data, error } = await supabase
        .from('daily_journals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('獲取今日日記失敗:', error);
      throw error;
    }
  }

  // 獲取指定日期的日記
  async getJournalByDate(date: string): Promise<DailyJournal | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未登入');

      const { data, error } = await supabase
        .from('daily_journals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('獲取日記失敗:', error);
      throw error;
    }
  }

  // 刪除日記
  async deleteJournal(journalId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用戶未登入');

      const { error } = await supabase
        .from('daily_journals')
        .delete()
        .eq('id', journalId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('刪除日記失敗:', error);
      throw error;
    }
  }

  // 獲取心情統計
  async getMoodStats(days: number = 30): Promise<Record<MoodType, number>> {
    const defaultStats: Record<MoodType, number> = {
      excited: 0,
      happy: 0,
      okay: 0,
      tired: 0,
      stressed: 0
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('用戶未登入，返回默認統計');
        return defaultStats;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = getTodayInTimezone(); // 先獲取今天的日期
      const actualStartDate = new Date(startDateStr);
      actualStartDate.setDate(actualStartDate.getDate() - days);
      const actualStartDateStr = actualStartDate.toISOString().split('T')[0];

      console.log('獲取心情統計:', {
        userId: user.id,
        startDate: actualStartDateStr,
        days
      });

      const { data, error } = await supabase
        .from('daily_journals')
        .select('mood')
        .eq('user_id', user.id)
        .gte('date', actualStartDateStr);

      if (error) {
        console.error('心情統計查詢失敗:', error);
        return defaultStats;
      }

      console.log('心情統計原始數據:', data);

      const stats: Record<MoodType, number> = { ...defaultStats };

      data?.forEach(journal => {
        if (journal.mood && stats.hasOwnProperty(journal.mood)) {
          stats[journal.mood as MoodType]++;
        }
      });

      console.log('心情統計結果:', stats);
      return stats;
    } catch (error) {
      console.error('獲取心情統計失敗:', error);
      return defaultStats;
    }
  }

  // 獲取動力水平趨勢
  async getMotivationTrend(days: number = 14): Promise<Array<{ date: string; level: number }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('用戶未登入，返回空趨勢');
        return [];
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = getTodayInTimezone(); // 先獲取今天的日期
      const actualStartDate = new Date(startDateStr);
      actualStartDate.setDate(actualStartDate.getDate() - days);
      const actualStartDateStr = actualStartDate.toISOString().split('T')[0];

      console.log('獲取動力趨勢:', {
        userId: user.id,
        startDate: actualStartDateStr,
        days
      });

      const { data, error } = await supabase
        .from('daily_journals')
        .select('date, motivation_level')
        .eq('user_id', user.id)
        .gte('date', actualStartDateStr)
        .order('date', { ascending: true });

      if (error) {
        console.error('動力趨勢查詢失敗:', error);
        return [];
      }

      console.log('動力趨勢原始數據:', data);

      const trend = data?.map(journal => ({
        date: journal.date,
        level: journal.motivation_level
      })) || [];

      console.log('動力趨勢結果:', trend);
      return trend;
    } catch (error) {
      console.error('獲取動力趨勢失敗:', error);
      return [];
    }
  }
}

export const journalStore = new JournalStore(); 