/**
 * TaskRecord Store - 任務記錄資料管理
 * 
 * 🎯 職責：
 * - 管理學生的任務記錄 CRUD 操作
 * - 處理檔案上傳與存儲
 * - 提供任務記錄統計功能
 * 
 * 🏗️ 架構：
 * - 遵循分層原則，專注於任務記錄資料操作
 * - 與其他 store 保持一致的設計模式
 */

import { supabase } from '../services/supabase';
import { httpInterceptor } from '../services/httpInterceptor';

export interface TaskRecord {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  message: string;
  files: FileInfo[];
  topic_id?: string;
  task_id?: string;
  task_type?: string;
  completion_time?: number;
  tags: string[];
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  url?: string;
  path?: string;
}

export interface CreateTaskRecordData {
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  message: string;
  files?: File[];
  topic_id?: string;
  task_id?: string;
  task_type?: string;
  completion_time?: number;
  tags?: string[];
}

export interface TaskRecordFilters {
  topic_id?: string;
  task_id?: string;
  task_ids?: string[]; // 新增：支援批量查詢任務記錄
  difficulty?: 1 | 2 | 3 | 4 | 5;
  task_type?: string;
  start_date?: string;
  end_date?: string;
  tags?: string[];
}

export interface TaskRecordStats {
  total: number;
  by_difficulty: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  avg_completion_time?: number;
  recent_activity: number; // 最近 7 天的記錄數
}

class TaskRecordStore {
  /**
   * 創建任務記錄
   */
  async createTaskRecord(data: CreateTaskRecordData): Promise<TaskRecord> {
    try {
      // 1. 先上傳檔案（如果有的話）
      const fileInfos: FileInfo[] = [];
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          const fileInfo = await this.uploadFile(file);
          fileInfos.push(fileInfo);
        }
      }

      // 2. 獲取當前用戶 ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用戶未登入');
      }

      // 3. 建立記錄
      const { data: record, error } = await httpInterceptor.wrapSupabaseQuery(
        async () => supabase
          .from('task_records')
          .insert({
            title: data.title,
            difficulty: data.difficulty,
            message: data.message,
            files: fileInfos,
            topic_id: data.topic_id,
            task_id: data.task_id,
            task_type: data.task_type,
            completion_time: data.completion_time,
            tags: data.tags || [],
            author_id: user.id  // 設定作者 ID 為當前用戶
          })
          .select('*')
          .single()
      );

      if (error) {
        console.error('創建任務記錄失敗:', error);
        throw new Error(`創建任務記錄失敗: ${error.message}`);
      }

      return record;
    } catch (error) {
      console.error('createTaskRecord 錯誤:', error);
      throw error;
    }
  }

  /**
   * 獲取用戶的任務記錄 - 優化版本支援批量查詢
   */
     async getUserTaskRecords(filters?: TaskRecordFilters): Promise<TaskRecord[]> {
    try {
      let query = supabase
        .from('task_records')
        .select('*');

      // 批量查詢指定任務的記錄（新增功能）
      if (filters?.task_ids && filters.task_ids.length > 0) {
        query = query.in('task_id', filters.task_ids).order('task_id').order('created_at', { ascending: false });
      } else if (filters?.task_id) {
        // 如果有指定 task_id，使用複合索引
        query = query.eq('task_id', filters.task_id).order('created_at', { ascending: false });
      } else {
        // 其他情況使用一般的時間排序
        query = query.order('created_at', { ascending: false });
      }

      // 應用其他篩選條件
      if (filters) {
        if (filters.topic_id) {
          query = query.eq('topic_id', filters.topic_id);
        }
        if (filters.difficulty) {
          query = query.eq('difficulty', filters.difficulty);
        }
        if (filters.task_type) {
          query = query.eq('task_type', filters.task_type);
        }
        if (filters.start_date) {
          query = query.gte('created_at', filters.start_date);
        }
        if (filters.end_date) {
          query = query.lte('created_at', filters.end_date);
        }
        if (filters.tags && filters.tags.length > 0) {
          query = query.overlaps('tags', filters.tags);
        }
      }

      const { data, error } = await httpInterceptor.wrapSupabaseQuery(async () => query);

      if (error) {
        console.error('獲取任務記錄失敗:', error);
        throw new Error(`獲取任務記錄失敗: ${error.message}`);
      }

      return (data as TaskRecord[]) || [];
    } catch (error) {
      console.error('getUserTaskRecords 錯誤:', error);
      throw error;
    }
  }

  /**
   * 獲取單一任務記錄
   */
  async getTaskRecord(id: string): Promise<TaskRecord | null> {
    try {
      const { data, error } = await httpInterceptor.wrapSupabaseQuery(
        async () => supabase
          .from('task_records')
          .select('*')
          .eq('id', id)
          .single()
      );

      if (error) {
        console.error('獲取任務記錄失敗:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('getTaskRecord 錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新任務記錄
   */
  async updateTaskRecord(id: string, updates: Partial<CreateTaskRecordData>): Promise<TaskRecord> {
    try {
      // 處理檔案上傳（如果有新檔案）
      let fileInfos: FileInfo[] | undefined;
      if (updates.files && updates.files.length > 0) {
        fileInfos = [];
        for (const file of updates.files) {
          const fileInfo = await this.uploadFile(file);
          fileInfos.push(fileInfo);
        }
      }

      const updateData: any = {
        ...updates,
        files: fileInfos,
        updated_at: new Date().toISOString()
      };

      // 移除不應該在更新中的字段
      delete updateData.files; // 如果沒有新檔案

      const { data, error } = await httpInterceptor.wrapSupabaseQuery(
        async () => supabase
          .from('task_records')
          .update(updateData)
          .eq('id', id)
          .select('*')
          .single()
      );

      if (error) {
        console.error('更新任務記錄失敗:', error);
        throw new Error(`更新任務記錄失敗: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('updateTaskRecord 錯誤:', error);
      throw error;
    }
  }

  /**
   * 刪除任務記錄
   */
  async deleteTaskRecord(id: string): Promise<void> {
    try {
      // 先獲取記錄以處理檔案刪除
      const record = await this.getTaskRecord(id);
      if (record) {
        // 刪除相關檔案
        for (const file of record.files) {
          if (file.path) {
            await this.deleteFile(file.path);
          }
        }
      }

      const { error } = await httpInterceptor.wrapSupabaseQuery(
        async () => supabase
          .from('task_records')
          .delete()
          .eq('id', id)
      );

      if (error) {
        console.error('刪除任務記錄失敗:', error);
        throw new Error(`刪除任務記錄失敗: ${error.message}`);
      }
    } catch (error) {
      console.error('deleteTaskRecord 錯誤:', error);
      throw error;
    }
  }

  /**
   * 檢查特定任務是否有記錄
   */
  async hasRecord(taskId: string): Promise<boolean> {
    try {
      const { data, error } = await httpInterceptor.wrapSupabaseQuery(
        async () => supabase
          .from('task_records')
          .select('id')
          .eq('task_id', taskId)
          .limit(1)
      );

      if (error) {
        console.error('檢查任務記錄失敗:', error);
        return false;
      }

      return !!(data && data.length > 0);
    } catch (error) {
      console.error('hasRecord 錯誤:', error);
      return false;
    }
  }

  /**
   * 獲取任務記錄統計
   */
  async getTaskRecordStats(filters?: TaskRecordFilters): Promise<TaskRecordStats> {
    try {
      // 獲取基本統計
      let query = supabase
        .from('task_records')
        .select('difficulty, completion_time, created_at');

      // 應用篩選條件
      if (filters) {
        if (filters.topic_id) {
          query = query.eq('topic_id', filters.topic_id);
        }
        if (filters.start_date) {
          query = query.gte('created_at', filters.start_date);
        }
        if (filters.end_date) {
          query = query.lte('created_at', filters.end_date);
        }
      }

      const { data, error } = await httpInterceptor.wrapSupabaseQuery(async () => query);

      if (error) {
        console.error('獲取統計失敗:', error);
        throw new Error(`獲取統計失敗: ${error.message}`);
      }

      const records = (data as any[]) || [];
      
      // 計算統計
      const stats: TaskRecordStats = {
        total: records.length,
        by_difficulty: {
          1: records.filter(r => r.difficulty === 1).length,
          2: records.filter(r => r.difficulty === 2).length,
          3: records.filter(r => r.difficulty === 3).length,
          4: records.filter(r => r.difficulty === 4).length,
          5: records.filter(r => r.difficulty === 5).length,
        },
        recent_activity: 0
      };

      // 計算平均完成時間
      const completionTimes = records
        .map(r => r.completion_time)
        .filter(t => t != null);
      
      if (completionTimes.length > 0) {
        stats.avg_completion_time = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
      }

      // 計算最近 7 天活動
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      stats.recent_activity = records.filter(r => 
        new Date(r.created_at) >= sevenDaysAgo
      ).length;

      return stats;
    } catch (error) {
      console.error('getTaskRecordStats 錯誤:', error);
      throw error;
    }
  }

  /**
   * 上傳檔案到 Supabase Storage
   */
  private async uploadFile(file: File): Promise<FileInfo> {
    try {
      // 獲取當前用戶 ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用戶未登入');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/task-records/${fileName}`;

      const { data, error } = await httpInterceptor.wrapStorageOperation(
        () => supabase.storage
          .from('uploads')
          .upload(filePath, file)
      );

      if (error) {
        console.error('檔案上傳失敗:', error);
        throw new Error(`檔案上傳失敗: ${error.message}`);
      }

      // 獲取公開 URL
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      return {
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('uploadFile 錯誤:', error);
      throw error;
    }
  }

  /**
   * 從 Supabase Storage 刪除檔案
   */
  private async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await httpInterceptor.wrapStorageOperation(
        () => supabase.storage
          .from('uploads')
          .remove([filePath])
      );

      if (error) {
        console.error('檔案刪除失敗:', error);
        // 不拋出錯誤，因為檔案可能已經不存在
      }
    } catch (error) {
      console.error('deleteFile 錯誤:', error);
    }
  }
}

// 導出單例
export const taskRecordStore = new TaskRecordStore(); 