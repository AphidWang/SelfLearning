/**
 * 系統回報 API 路由
 * 
 * 功能：
 * - 接收用戶回報的問題或新功能請求
 * - 將回報轉換為任務並儲存到指定主題
 * - 使用 Service Role Key 避免 RLS 限制
 */

import express, { Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { authenticateSupabaseToken } from './auth';

const router = express.Router();

// 系統回報端點
router.post('/report', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const { topicId, category, title, description, createdBy } = req.body;
    
    // 驗證必要參數
    if (!topicId || !category || !title || !description || !createdBy) {
      return res.status(400).json({ 
        message: '缺少必要參數',
        required: ['topicId', 'category', 'title', 'description', 'createdBy']
      });
    }

    // 驗證類別
    const validCategories = ['new_feature', 'bug_report'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        message: '無效的回報類別',
        validCategories
      });
    }

    // 驗證主題是否存在並獲取 owner_id
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .select('id, title, owner_id')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return res.status(404).json({ 
        message: '指定的主題不存在',
        topicId
      });
    }

    // 先創建或獲取一個目標 (goal)
    let goalId: string;
    const goalTitle = category === 'new_feature' ? '新功能' : '問題回報';
    
    // 查看是否已有相同類別的目標
    const { data: existingGoal, error: goalQueryError } = await supabaseAdmin
      .from('goals')
      .select('id')
      .eq('topic_id', topicId)
      .eq('title', goalTitle)
      .single();

    if (existingGoal) {
      goalId = existingGoal.id;
    } else {
      // 創建新目標
      const { data: newGoal, error: goalError } = await supabaseAdmin
        .from('goals')
        .insert({
          topic_id: topicId,
          title: goalTitle,
          description: `${goalTitle}的相關任務`,
          status: 'todo',
          priority: category === 'bug_report' ? 'high' : 'medium',
          owner_id: topic.owner_id,
          order_index: 0,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (goalError) {
        console.error('建立目標失敗:', goalError);
        return res.status(500).json({ 
          message: '建立目標失敗',
          error: goalError.message
        });
      }

      goalId = newGoal.id;
    }

    // 建立任務
    const taskData = {
      goal_id: goalId,
      title: title,
      description: description,
      priority: category === 'bug_report' ? 'high' : 'medium',
      status: 'todo',
      task_type: 'accumulative',
      owner_id: topic.owner_id, // 使用主題的 owner_id
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (taskError) {
      console.error('建立任務失敗:', taskError);
      return res.status(500).json({ 
        message: '建立任務失敗',
        error: taskError.message
      });
    }

    // 回傳成功結果
    res.status(201).json({
      message: '回報已成功提交',
      task: {
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
        created_at: task.created_at
      },
      goal: {
        id: goalId,
        title: goalTitle
      },
      topic: {
        id: topic.id,
        title: topic.title
      }
    });

  } catch (error: any) {
    console.error('回報提交失敗:', error);
    res.status(500).json({ 
      message: '內部伺服器錯誤',
      error: error.message
    });
  }
});

// 獲取回報統計 (可選功能)
router.get('/reports/stats', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    // 先獲取回報主題的所有目標
    const { data: goals, error: goalsError } = await supabaseAdmin
      .from('goals')
      .select('id')
      .eq('topic_id', '26317f41-1294-40f6-bcdb-514f6c39d66e');

    if (goalsError) {
      throw new Error(goalsError.message);
    }

    const goalIds = goals?.map(g => g.id) || [];
    
    if (goalIds.length === 0) {
      return res.json({
        totalReports: 0,
        byStatus: {},
        byPriority: {},
        recentReports: []
      });
    }

    // 查詢這些目標下的所有任務
    const { data: stats, error } = await supabaseAdmin
      .from('tasks')
      .select('priority, status, created_at, goal_id')
      .in('goal_id', goalIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // 統計數據
    const totalReports = stats.length;
    
    const byStatus = stats.reduce((acc: any, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const byPriority = stats.reduce((acc: any, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalReports,
      byStatus,
      byPriority,
      recentReports: stats.slice(0, 10) // 最近 10 筆
    });

  } catch (error: any) {
    console.error('獲取回報統計失敗:', error);
    res.status(500).json({ 
      message: '獲取統計失敗',
      error: error.message
    });
  }
});

export default router; 