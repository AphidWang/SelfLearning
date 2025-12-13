/**
 * 課程排程系統 API 路由
 * 
 * 功能：
 * - Sheet CRUD
 * - Row CRUD
 * - Student 管理
 * - Google Calendar Event 建立/更新
 */

import express, { Request, Response } from 'express';
import { authenticateSupabaseToken } from './auth';
import { supabaseAdmin } from '../services/supabase';
import { googleCalendarService } from '../services/googleCalendar';

const router = express.Router();

// ========================================
// Sheet 相關 API
// ========================================

// 獲取所有 sheets
router.get('/sheets', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const { data, error } = await supabaseAdmin
      .from('course_sheets')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('獲取 sheets 失敗:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 獲取單個 sheet（包含 students 和 rows）
router.get('/sheets/:sheetId', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { sheetId } = req.params;

    // 獲取 sheet
    const { data: sheet, error: sheetError } = await supabaseAdmin
      .from('course_sheets')
      .select('*')
      .eq('id', sheetId)
      .eq('owner_id', user.id)
      .single();

    if (sheetError) throw sheetError;
    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet 不存在' });
    }

    // 獲取 students
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('course_sheet_students')
      .select('*')
      .eq('sheet_id', sheetId)
      .order('order_index', { ascending: true });

    if (studentsError) throw studentsError;

    // 獲取 rows
    const { data: rows, error: rowsError } = await supabaseAdmin
      .from('course_sheet_rows')
      .select('*')
      .eq('sheet_id', sheetId)
      .order('order_index', { ascending: true });

    if (rowsError) throw rowsError;

    res.json({
      success: true,
      data: {
        ...sheet,
        students: students || [],
        rows: rows || [],
      },
    });
  } catch (error: any) {
    console.error('獲取 sheet 失敗:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 建立新 sheet
router.post('/sheets', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, subject, teacher_email, default_email_title, regular_schedule, custom_fields } = req.body;

    console.log('📝 [Create Sheet] 請求資料:', {
      title,
      subject,
      teacher_email,
      default_email_title,
      regular_schedule,
      custom_fields,
      owner_id: user.id,
    });

    // 驗證必填欄位
    if (!title || !subject || !teacher_email) {
      return res.status(400).json({
        success: false,
        message: '缺少必填欄位：title, subject, teacher_email',
      });
    }

    // 準備插入資料
    const insertData: any = {
      title,
      subject,
      teacher_email,
      default_email_title: default_email_title || '課程通知',
      regular_schedule: regular_schedule || [],
      owner_id: user.id,
    };

    // 如果 custom_fields 欄位存在，才加入（向後兼容）
    if (custom_fields !== undefined) {
      insertData.custom_fields = custom_fields || {};
    }

    console.log('📤 [Create Sheet] 準備插入:', insertData);

    const { data, error } = await supabaseAdmin
      .from('course_sheets')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // 檢查 error 物件的所有屬性
      const errorKeys = Object.keys(error);
      const errorValues = Object.values(error);
      const errorString = String(error);
      const errorJSON = JSON.stringify(error);
      
      console.error('❌ [Create Sheet] Supabase 錯誤詳情:', {
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorKeys,
        errorValues,
        errorString,
        errorJSON,
        hasMessage: 'message' in error,
        hasCode: 'code' in error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        // 嘗試獲取所有可枚舉屬性
        allProps: Object.getOwnPropertyNames(error),
        // 嘗試獲取所有符號屬性
        symbols: Object.getOwnPropertySymbols(error),
      });
      
      // 嘗試從不同方式獲取錯誤訊息
      const errorMessage = 
        error?.message || 
        error?.toString() || 
        errorString ||
        errorJSON ||
        '未知錯誤';
      
      const errorCode = error?.code || 'UNKNOWN_ERROR';
      
      // 如果是表不存在的錯誤
      if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        return res.status(500).json({ 
          success: false, 
          message: '資料表不存在，請先執行 migration。詳見：COURSE_SCHEDULER_SETUP.md',
          error: errorMessage,
          code: errorCode,
          hint: '執行 course_scheduler_schema_v2.sql 來建立資料表',
          debug: { errorKeys, errorString }
        });
      }
      
      // 如果是欄位不存在的錯誤
      if (errorCode === '42703' || errorMessage.includes('column')) {
        return res.status(500).json({ 
          success: false, 
          message: '資料表結構不匹配，請執行 migration：course_scheduler_schema_v2.sql',
          error: errorMessage,
          code: errorCode,
          debug: { errorKeys, errorString }
        });
      }
      
      // RLS policy 錯誤
      if (errorMessage.includes('policy') || errorMessage.includes('permission') || errorMessage.includes('RLS')) {
        return res.status(403).json({
          success: false,
          message: '權限不足，請檢查 RLS policies',
          error: errorMessage,
          code: errorCode,
          debug: { errorKeys, errorString }
        });
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        code: errorCode,
        details: error?.details,
        hint: error?.hint,
        debug: { errorKeys, errorString, errorJSON }
      });
    }

    console.log('✅ [Create Sheet] 成功建立:', data);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ [Create Sheet] 異常錯誤:', {
      error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    });
    
    res.status(500).json({ 
      success: false, 
      message: error?.message || '建立失敗，請檢查 server logs',
      error: String(error),
    });
  }
});

// 更新 sheet
router.put('/sheets/:sheetId', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { sheetId } = req.params;
    const { title, subject, teacher_email, default_email_title, regular_schedule, custom_fields } = req.body;

    const updateData: any = {
      title,
      subject,
      teacher_email,
      default_email_title,
      regular_schedule,
    };
    
    // 如果提供了 custom_fields，合併而不是覆蓋
    if (custom_fields !== undefined) {
      if (Object.keys(custom_fields).length === 0) {
        updateData.custom_fields = {};
      } else {
        // 獲取現有的 custom_fields 並合併
        const { data: existing } = await supabaseAdmin
          .from('course_sheets')
          .select('custom_fields')
          .eq('id', sheetId)
          .single();
        
        updateData.custom_fields = {
          ...(existing?.custom_fields || {}),
          ...custom_fields,
        };
      }
    }

    const { data, error } = await supabaseAdmin
      .from('course_sheets')
      .update(updateData)
      .eq('id', sheetId)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: 'Sheet 不存在' });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('更新 sheet 失敗:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 刪除 sheet
router.delete('/sheets/:sheetId', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { sheetId } = req.params;

    const { error } = await supabaseAdmin
      .from('course_sheets')
      .delete()
      .eq('id', sheetId)
      .eq('owner_id', user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('刪除 sheet 失敗:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================================
// Student 相關 API
// ========================================

// 新增學生到 sheet
router.post('/sheets/:sheetId/students', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { sheetId } = req.params;
    const { student_nickname, student_email } = req.body;

    // 驗證 sheet 屬於該用戶
    const { data: sheet } = await supabaseAdmin
      .from('course_sheets')
      .select('id')
      .eq('id', sheetId)
      .eq('owner_id', user.id)
      .single();

    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet 不存在' });
    }

    // 獲取現有學生數量來設定 order_index
    const { count } = await supabaseAdmin
      .from('course_sheet_students')
      .select('*', { count: 'exact', head: true })
      .eq('sheet_id', sheetId);

    const { data, error } = await supabaseAdmin
      .from('course_sheet_students')
      .insert({
        sheet_id: sheetId,
        student_nickname,
        student_email,
        order_index: count || 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('新增學生失敗:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新學生
router.put('/students/:studentId', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { studentId } = req.params;
    const { student_nickname, student_email, order_index } = req.body;

    // 驗證學生屬於該用戶的 sheet
    const { data: student } = await supabaseAdmin
      .from('course_sheet_students')
      .select('sheet_id, course_sheets!inner(owner_id)')
      .eq('id', studentId)
      .single();

    if (!student || (student as any).course_sheets.owner_id !== user.id) {
      return res.status(404).json({ success: false, message: '學生不存在' });
    }

    const { data, error } = await supabaseAdmin
      .from('course_sheet_students')
      .update({
        student_nickname,
        student_email,
        order_index,
      })
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('更新學生失敗:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 刪除學生
router.delete('/students/:studentId', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { studentId } = req.params;

    // 驗證學生屬於該用戶的 sheet
    const { data: student } = await supabaseAdmin
      .from('course_sheet_students')
      .select('sheet_id, course_sheets!inner(owner_id)')
      .eq('id', studentId)
      .single();

    if (!student || (student as any).course_sheets.owner_id !== user.id) {
      return res.status(404).json({ success: false, message: '學生不存在' });
    }

    const { error } = await supabaseAdmin
      .from('course_sheet_students')
      .delete()
      .eq('id', studentId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('刪除學生失敗:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================================
// Row 相關 API
// ========================================

// 新增 row
router.post('/sheets/:sheetId/rows', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { sheetId } = req.params;
    const { title, student_ids, scheduled_time, data, custom_fields } = req.body;

    // 驗證 sheet 屬於該用戶
    const { data: sheet } = await supabaseAdmin
      .from('course_sheets')
      .select('id')
      .eq('id', sheetId)
      .eq('owner_id', user.id)
      .single();

    if (!sheet) {
      return res.status(404).json({ success: false, message: 'Sheet 不存在' });
    }

    // 獲取現有 rows 數量來設定 order_index
    const { count } = await supabaseAdmin
      .from('course_sheet_rows')
      .select('*', { count: 'exact', head: true })
      .eq('sheet_id', sheetId);

    // 準備 data JSONB（支援舊格式向後兼容）
    let rowData: any = {
      suggested_approach: null,
      learning_objectives: null,
      materials: [],
      homework: null,
      notes: null,
      attachments: [],
    };
    
    // 如果提供了 data，合併
    if (data) {
      rowData = { ...rowData, ...data };
    }
    
    // 向後兼容：如果直接提供了 suggested_approach 或 learning_objectives
    if (req.body.suggested_approach !== undefined) {
      rowData.suggested_approach = req.body.suggested_approach;
    }
    if (req.body.learning_objectives !== undefined) {
      rowData.learning_objectives = req.body.learning_objectives;
    }

    const { data: insertedData, error } = await supabaseAdmin
      .from('course_sheet_rows')
      .insert({
        sheet_id: sheetId,
        title,
        student_ids: student_ids || [],
        scheduled_time,
        data: rowData,
        custom_fields: custom_fields || {},
        order_index: count || 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: insertedData });
  } catch (error: any) {
    console.error('新增 row 失敗:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新 row
router.put('/rows/:rowId', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { rowId } = req.params;
    const { title, student_ids, scheduled_time, order_index, data, custom_fields } = req.body;

    // 驗證 row 屬於該用戶的 sheet
    const { data: row } = await supabaseAdmin
      .from('course_sheet_rows')
      .select('sheet_id, course_sheets!inner(owner_id), data, custom_fields')
      .eq('id', rowId)
      .single();

    if (!row || (row as any).course_sheets.owner_id !== user.id) {
      return res.status(404).json({ success: false, message: 'Row 不存在' });
    }

    const updateData: any = {
      title,
      student_ids,
      scheduled_time,
      order_index,
    };

    // 處理 data JSONB（合併而不是覆蓋）
    if (data !== undefined) {
      const existingData = (row as any).data || {};
      updateData.data = { ...existingData, ...data };
    }
    
    // 向後兼容：如果直接提供了 suggested_approach 或 learning_objectives
    if (req.body.suggested_approach !== undefined || req.body.learning_objectives !== undefined) {
      const existingData = updateData.data || (row as any).data || {};
      if (req.body.suggested_approach !== undefined) {
        existingData.suggested_approach = req.body.suggested_approach;
      }
      if (req.body.learning_objectives !== undefined) {
        existingData.learning_objectives = req.body.learning_objectives;
      }
      updateData.data = existingData;
    }

    // 處理 custom_fields（合併）
    if (custom_fields !== undefined) {
      const existingCustomFields = (row as any).custom_fields || {};
      updateData.custom_fields = { ...existingCustomFields, ...custom_fields };
    }

    const { data: updatedData, error } = await supabaseAdmin
      .from('course_sheet_rows')
      .update(updateData)
      .eq('id', rowId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: updatedData });
  } catch (error: any) {
    console.error('更新 row 失敗:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 刪除 row
router.delete('/rows/:rowId', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { rowId } = req.params;

    // 驗證 row 屬於該用戶的 sheet
    const { data: row } = await supabaseAdmin
      .from('course_sheet_rows')
      .select('sheet_id, course_sheets!inner(owner_id)')
      .eq('id', rowId)
      .single();

    if (!row || (row as any).course_sheets.owner_id !== user.id) {
      return res.status(404).json({ success: false, message: 'Row 不存在' });
    }

    // 如果有 calendar event，先刪除
    const { data: calendarEvent } = await supabaseAdmin
      .from('google_calendar_events')
      .select('google_event_id')
      .eq('row_id', rowId)
      .single();

    if (calendarEvent && googleCalendarService.isAvailable()) {
      try {
        await googleCalendarService.deleteEvent(calendarEvent.google_event_id);
      } catch (error) {
        console.warn('刪除 Calendar Event 失敗，但繼續刪除 row:', error);
      }
    }

    const { error } = await supabaseAdmin
      .from('course_sheet_rows')
      .delete()
      .eq('id', rowId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('刪除 row 失敗:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================================
// Google Calendar Event 相關 API
// ========================================

// 建立/更新 Calendar Event
router.post('/rows/:rowId/create-calendar-event', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { rowId } = req.params;

    console.log('📅 [Create Calendar Event] 開始建立 Calendar Event');
    console.log('  - rowId:', rowId);
    console.log('  - userId:', user?.id);

    if (!googleCalendarService.isAvailable()) {
      console.error('❌ [Create Calendar Event] Google Calendar Service 未設定');
      return res.status(503).json({
        success: false,
        message: 'Google Calendar Service 未設定',
      });
    }

    // 獲取 row 和相關資料
    const { data: row, error: rowError } = await supabaseAdmin
      .from('course_sheet_rows')
      .select(`
        *,
        course_sheets!inner(
          id,
          title,
          subject,
          teacher_email,
          default_email_title,
          owner_id
        )
      `)
      .eq('id', rowId)
      .single();

    if (rowError) throw rowError;
    if (!row || (row as any).course_sheets.owner_id !== user.id) {
      return res.status(404).json({ success: false, message: 'Row 不存在' });
    }

    const sheet = (row as any).course_sheets;
    
    console.log('✅ [Create Calendar Event] 找到 row 和 sheet');
    console.log('  - row.title:', row.title);
    console.log('  - row.scheduled_time:', row.scheduled_time);
    console.log('  - sheet.subject:', sheet.subject);
    console.log('  - sheet.teacher_email:', sheet.teacher_email);
    
    if (!row.scheduled_time) {
      console.error('❌ [Create Calendar Event] Row 沒有設定時間');
      return res.status(400).json({ success: false, message: 'Row 沒有設定時間' });
    }

    // 獲取學生列表
    let attendees: Array<{ email: string; displayName?: string }> = [];
    if (row.student_ids && row.student_ids.length > 0) {
      const { data: students } = await supabaseAdmin
        .from('course_sheet_students')
        .select('student_email, student_nickname')
        .in('id', row.student_ids)
        .eq('sheet_id', sheet.id);

      if (students) {
        attendees = students.map((s: any) => ({
          email: s.student_email,
          displayName: s.student_nickname,
        }));
      }
    } else {
      // 全部學生
      const { data: allStudents } = await supabaseAdmin
        .from('course_sheet_students')
        .select('student_email, student_nickname')
        .eq('sheet_id', sheet.id);

      if (allStudents) {
        attendees = allStudents.map((s: any) => ({
          email: s.student_email,
          displayName: s.student_nickname,
        }));
      }
    }

    // 建立 event 資料
    if (!row.scheduled_time) {
      console.error('❌ [Create Calendar Event] 課程時間未設定');
      return res.status(400).json({ success: false, message: '課程時間未設定' });
    }

    const startTime = new Date(row.scheduled_time);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 預設 1 小時

    console.log('📅 [Create Calendar Event] 時間資訊');
    console.log('  - startTime:', startTime.toISOString());
    console.log('  - endTime:', endTime.toISOString());

    // 從 data JSONB 中讀取內容（向後兼容舊格式）
    const rowData = row.data || {};
    const suggested_approach = rowData.suggested_approach || null;
    const learning_objectives = rowData.learning_objectives || null;
    const materials = rowData.materials || null;
    
    console.log('📝 [Create Calendar Event] Row 資料');
    console.log('  - row.title:', row.title);
    console.log('  - suggested_approach:', suggested_approach);
    console.log('  - learning_objectives:', learning_objectives);
    console.log('  - materials:', materials);
    console.log('  - suggested_approach:', suggested_approach);
    console.log('  - learning_objectives:', learning_objectives);

    // 格式化素材（如果是陣列，轉換為字串）
    let materialsText = '';
    if (materials) {
      if (Array.isArray(materials)) {
        materialsText = materials.length > 0 ? materials.join(', ') : '';
      } else {
        materialsText = String(materials);
      }
    }

    const eventData = {
      summary: `${sheet.subject} - ${row.title || '課程'}`,
      description: [
        row.title && `主題：${row.title}`,
        suggested_approach && `建議進行方式：${suggested_approach}`,
        learning_objectives && `課堂目標：${learning_objectives}`,
        materialsText && `素材：${materialsText}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Taipei',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Taipei',
      },
      // 暫時移除 attendees，因為 Service Account 需要 Domain-Wide Delegation 才能邀請
      // attendees: [
      //   { email: sheet.teacher_email, displayName: '老師' },
      //   ...attendees,
      // ],
    };

    console.log('📝 [Create Calendar Event] Event Data:');
    console.log('  - summary:', eventData.summary);
    console.log('  - description:', eventData.description);
    console.log('  - start:', JSON.stringify(eventData.start));
    console.log('  - end:', JSON.stringify(eventData.end));

    // 檢查是否已有 calendar event
    const { data: existingEvent } = await supabaseAdmin
      .from('google_calendar_events')
      .select('google_event_id')
      .eq('row_id', rowId)
      .single();

    let googleEventId: string;

    if (existingEvent) {
      console.log('🔄 [Create Calendar Event] 嘗試更新現有 event');
      console.log('  - existing google_event_id:', existingEvent.google_event_id);
      
      try {
        await googleCalendarService.updateEvent(existingEvent.google_event_id, eventData);
        googleEventId = existingEvent.google_event_id;
        console.log('✅ [Create Calendar Event] Event 已更新');
      } catch (updateError: any) {
        // 如果 event 不存在（404），建立新的 event
        if (updateError.message === 'EVENT_NOT_FOUND') {
          console.log('⚠️ [Create Calendar Event] 舊 event 不存在，建立新 event');
          
          // 刪除資料庫中的舊記錄
          await supabaseAdmin
            .from('google_calendar_events')
            .delete()
            .eq('row_id', rowId);
          
          // 建立新 event
          googleEventId = await googleCalendarService.createEvent(eventData);
          console.log('✅ [Create Calendar Event] 新 Event 已建立');
          console.log('  - google_event_id:', googleEventId);

          // 儲存到資料庫
          const { error: insertError } = await supabaseAdmin.from('google_calendar_events').insert({
            row_id: rowId,
            sheet_id: sheet.id,
            google_event_id: googleEventId,
          });
          
          if (insertError) {
            console.error('❌ [Create Calendar Event] 儲存到資料庫失敗:', insertError);
          } else {
            console.log('✅ [Create Calendar Event] 已儲存到資料庫');
          }
        } else {
          // 其他錯誤，直接拋出
          throw updateError;
        }
      }
    } else {
      console.log('➕ [Create Calendar Event] 建立新 event');
      googleEventId = await googleCalendarService.createEvent(eventData);
      console.log('✅ [Create Calendar Event] Event 已建立');
      console.log('  - google_event_id:', googleEventId);

      // 儲存到資料庫
      const { error: insertError } = await supabaseAdmin.from('google_calendar_events').insert({
        row_id: rowId,
        sheet_id: sheet.id,
        google_event_id: googleEventId,
      });
      
      if (insertError) {
        console.error('❌ [Create Calendar Event] 儲存到資料庫失敗:', insertError);
      } else {
        console.log('✅ [Create Calendar Event] 已儲存到資料庫');
      }
    }

    res.json({
      success: true,
      data: {
        google_event_id: googleEventId,
        message: existingEvent ? 'Calendar Event 已更新' : 'Calendar Event 已建立',
      },
    });
  } catch (error: any) {
    console.error('建立/更新 Calendar Event 失敗:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
