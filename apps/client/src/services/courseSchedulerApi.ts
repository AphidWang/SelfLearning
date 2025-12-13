/**
 * 課程排程系統 API Service
 */

import { api } from './api';

export interface CourseSheet {
  id: string;
  title: string;
  subject: string;
  teacher_email: string;
  default_email_title: string;
  regular_schedule: Array<{
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // "HH:mm"
    endTime: string;
  }>;
  custom_fields: Record<string, any>; // 老師自訂欄位
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CourseSheetStudent {
  id: string;
  sheet_id: string;
  student_nickname: string;
  student_email: string;
  order_index: number;
  custom_data: Record<string, any>; // 學生自訂資料
  created_at: string;
}

export interface CourseSheetRow {
  id: string;
  sheet_id: string;
  title: string | null;
  scheduled_time: string | null; // ISO 8601
  student_ids: string[]; // 空陣列表示全部學生
  order_index: number;
  // JSONB 欄位
  data: {
    suggested_approach?: string | null;
    learning_objectives?: string | null;
    materials?: string[];
    homework?: string | null;
    notes?: string | null;
    attachments?: Array<{ name: string; url: string }>;
    [key: string]: any; // 允許未來擴充
  };
  custom_fields: Record<string, any>; // 老師自訂欄位
  created_at: string;
  updated_at: string;
}

export interface CourseSheetWithDetails extends CourseSheet {
  students: CourseSheetStudent[];
  rows: CourseSheetRow[];
}

class CourseSchedulerApi {
  // ========================================
  // Sheet 相關
  // ========================================

  async getSheets(): Promise<CourseSheet[]> {
    const { data } = await api.get<{ success: boolean; data: CourseSheet[] }>(
      '/api/course-scheduler/sheets'
    );
    return data.data;
  }

  async getSheet(sheetId: string): Promise<CourseSheetWithDetails> {
    const { data } = await api.get<{ success: boolean; data: CourseSheetWithDetails }>(
      `/api/course-scheduler/sheets/${sheetId}`
    );
    return data.data;
  }

  async createSheet(sheet: Partial<CourseSheet>): Promise<CourseSheet> {
    const { data } = await api.post<{ success: boolean; data: CourseSheet }>(
      '/api/course-scheduler/sheets',
      sheet
    );
    return data.data;
  }

  async updateSheet(sheetId: string, sheet: Partial<CourseSheet>): Promise<CourseSheet> {
    const { data } = await api.put<{ success: boolean; data: CourseSheet }>(
      `/api/course-scheduler/sheets/${sheetId}`,
      sheet
    );
    return data.data;
  }

  async deleteSheet(sheetId: string): Promise<void> {
    await api.delete(`/api/course-scheduler/sheets/${sheetId}`);
  }

  // ========================================
  // Student 相關
  // ========================================

  async addStudent(
    sheetId: string,
    student: { student_nickname: string; student_email: string }
  ): Promise<CourseSheetStudent> {
    const { data } = await api.post<{ success: boolean; data: CourseSheetStudent }>(
      `/api/course-scheduler/sheets/${sheetId}/students`,
      student
    );
    return data.data;
  }

  async updateStudent(
    studentId: string,
    student: Partial<CourseSheetStudent>
  ): Promise<CourseSheetStudent> {
    const { data } = await api.put<{ success: boolean; data: CourseSheetStudent }>(
      `/api/course-scheduler/students/${studentId}`,
      student
    );
    return data.data;
  }

  async deleteStudent(studentId: string): Promise<void> {
    await api.delete(`/api/course-scheduler/students/${studentId}`);
  }

  // ========================================
  // Row 相關
  // ========================================

  async createRow(sheetId: string, row: Partial<CourseSheetRow>): Promise<CourseSheetRow> {
    const { data } = await api.post<{ success: boolean; data: CourseSheetRow }>(
      `/api/course-scheduler/sheets/${sheetId}/rows`,
      row
    );
    return data.data;
  }

  async updateRow(rowId: string, row: Partial<CourseSheetRow>): Promise<CourseSheetRow> {
    const { data } = await api.put<{ success: boolean; data: CourseSheetRow }>(
      `/api/course-scheduler/rows/${rowId}`,
      row
    );
    return data.data;
  }

  async deleteRow(rowId: string): Promise<void> {
    await api.delete(`/api/course-scheduler/rows/${rowId}`);
  }

  // ========================================
  // Calendar Event 相關
  // ========================================

  async createCalendarEvent(rowId: string): Promise<{ google_event_id: string }> {
    const { data } = await api.post<{
      success: boolean;
      data: { google_event_id: string; message: string };
    }>(`/api/course-scheduler/rows/${rowId}/create-calendar-event`);
    return { google_event_id: data.data.google_event_id };
  }
}

export const courseSchedulerApi = new CourseSchedulerApi();
