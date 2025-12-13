/**
 * Google Calendar Service Account 整合服務
 * 
 * 使用 Google Service Account 來建立和管理 Google Calendar events
 * 需要在環境變數中設定：
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: Service Account 的 email
 * - GOOGLE_PRIVATE_KEY: Service Account 的 private key (base64 encoded 或直接 JSON)
 * - GOOGLE_CALENDAR_ID: 要使用的 Calendar ID (可選，預設使用 primary)
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

interface CalendarEventData {
  summary: string; // 事件標題
  description?: string; // 事件描述
  start: {
    dateTime: string; // ISO 8601 格式
    timeZone?: string; // 時區，預設 'Asia/Taipei'
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

class GoogleCalendarService {
  private auth: JWT | null = null;
  private calendar: any = null;
  private calendarId: string;

  constructor() {
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      let privateKey = process.env.GOOGLE_PRIVATE_KEY;

      console.log('🔵 [GoogleCalendar] 初始化 Auth');
      console.log('  - serviceAccountEmail:', serviceAccountEmail ? '已設定' : '未設定');
      console.log('  - privateKey exists:', !!privateKey);
      console.log('  - privateKey length:', privateKey?.length || 0);
      console.log('  - calendarId:', this.calendarId);

      if (!serviceAccountEmail || !privateKey) {
        console.warn('⚠️ Google Calendar Service Account 未設定，Calendar 功能將無法使用');
        return;
      }

      // 處理 private key 格式
      // 1. 替換 \\n 為實際的換行符號
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // 2. 確保 private key 有正確的開頭和結尾
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error('❌ Private key 格式錯誤：缺少 BEGIN 標記');
        return;
      }
      
      if (!privateKey.includes('-----END PRIVATE KEY-----')) {
        console.error('❌ Private key 格式錯誤：缺少 END 標記');
        return;
      }

      // 3. 驗證 private key 格式
      const keyLines = privateKey.split('\n');
      console.log('  - privateKey lines:', keyLines.length);
      console.log('  - privateKey first line:', keyLines[0]?.substring(0, 30));
      console.log('  - privateKey last line:', keyLines[keyLines.length - 1]?.substring(0, 30));

      try {
        this.auth = new JWT({
          email: serviceAccountEmail,
          key: privateKey,
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
          ],
        });

        this.calendar = google.calendar({ version: 'v3', auth: this.auth });
        console.log('✅ Google Calendar Service Account 初始化成功');
        console.log('  - calendarId:', this.calendarId);
        
        // 列出所有可用的 calendars
        this.listAvailableCalendars();
        
        // 獲取今天的 events 並印出 log
        this.fetchTodayEvents();
      } catch (authError: any) {
        console.error('❌ JWT 認證建立失敗');
        console.error('  - error.message:', authError.message);
        console.error('  - error.code:', authError.code);
        console.error('  - error.stack:', authError.stack);
        
        // 如果是 OpenSSL 錯誤，提供更詳細的診斷
        if (authError.message?.includes('DECODER') || authError.code === 'ERR_OSSL_UNSUPPORTED') {
          console.error('💡 可能的解決方案：');
          console.error('  1. 確認 GOOGLE_PRIVATE_KEY 環境變數中的 private key 格式正確');
          console.error('  2. 確認 private key 包含完整的 BEGIN 和 END 標記');
          console.error('  3. 確認換行符號已正確處理（\\n 會被自動轉換為實際換行）');
          console.error('  4. 嘗試直接從 JSON 檔案讀取 private_key 欄位');
        }
      }
    } catch (error: any) {
      console.error('❌ Google Calendar Service Account 初始化失敗:', error);
      console.error('  - error.message:', error.message);
      console.error('  - error.code:', error.code);
    }
  }

  /**
   * 列出所有可用的 calendars
   */
  private async listAvailableCalendars() {
    if (!this.calendar) {
      return;
    }

    try {
      console.log('📋 [GoogleCalendar] 列出所有可用的 calendars');
      const response = await this.calendar.calendarList.list();
      const calendars = response.data.items || [];
      
      console.log(`📋 [GoogleCalendar] 共有 ${calendars.length} 個可用的 calendars:`);
      calendars.forEach((cal: any, index: number) => {
        console.log(`  [${index + 1}] ${cal.summary || '(無名稱)'}`);
        console.log(`      - ID: ${cal.id}`);
        console.log(`      - Primary: ${cal.primary ? '是' : '否'}`);
        console.log(`      - Access Role: ${cal.accessRole}`);
        if (cal.description) {
          console.log(`      - Description: ${cal.description}`);
        }
      });
      
      // 檢查目前使用的 calendarId 是否存在
      const currentCalendar = calendars.find((cal: any) => cal.id === this.calendarId);
      if (!currentCalendar) {
        console.warn(`⚠️ [GoogleCalendar] 警告：找不到 calendar ID "${this.calendarId}"`);
        console.warn(`   請確認 GOOGLE_CALENDAR_ID 環境變數是否正確，或將 calendar 分享給 Service Account`);
        if (calendars.length > 0) {
          const primaryCalendar = calendars.find((cal: any) => cal.primary);
          if (primaryCalendar) {
            console.log(`💡 [GoogleCalendar] 建議使用 primary calendar ID: ${primaryCalendar.id}`);
          } else {
            console.log(`💡 [GoogleCalendar] 建議使用第一個 calendar ID: ${calendars[0].id}`);
          }
        }
      } else {
        console.log(`✅ [GoogleCalendar] 目前使用的 calendar "${this.calendarId}" 存在且可存取`);
        console.log(`   - Calendar 名稱: ${currentCalendar.summary}`);
        console.log(`   - Access Role: ${currentCalendar.accessRole}`);
      }
    } catch (error: any) {
      console.error('❌ [GoogleCalendar] 列出 calendars 失敗');
      console.error('  - error.message:', error.message);
      console.error('  - error.code:', error.code);
      console.error('  - error.response?.data:', error.response?.data);
    }
  }

  /**
   * 獲取今天的 events 並印出 log
   */
  private async fetchTodayEvents() {
    if (!this.calendar) {
      return;
    }

    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      console.log('📅 [GoogleCalendar] 獲取今天的 events');
      console.log('  - calendarId:', this.calendarId);
      console.log('  - startOfDay:', startOfDay.toISOString());
      console.log('  - endOfDay:', endOfDay.toISOString());

      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      console.log('📅 [GoogleCalendar] API 回應成功');
      console.log('  - response.status:', response.status);
      console.log('  - response.data.summary:', response.data.summary);

      const events = response.data.items || [];
      console.log(`📅 [GoogleCalendar] 今天共有 ${events.length} 個 events`);

      if (events.length > 0) {
        events.forEach((event: any, index: number) => {
          console.log(`  [${index + 1}] ${event.summary || '(無標題)'}`);
          console.log(`      - ID: ${event.id}`);
          console.log(`      - Start: ${event.start?.dateTime || event.start?.date}`);
          console.log(`      - End: ${event.end?.dateTime || event.end?.date}`);
          if (event.description) {
            console.log(`      - Description: ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}`);
          }
          if (event.location) {
            console.log(`      - Location: ${event.location}`);
          }
        });
      } else {
        console.log('  (今天沒有 events)');
      }
    } catch (error: any) {
      console.error('❌ [GoogleCalendar] 獲取今天的 events 失敗');
      console.error('  - error.message:', error.message);
      console.error('  - error.code:', error.code);
      console.error('  - error.response?.data:', error.response?.data);
    }
  }

  /**
   * 建立 Calendar Event
   */
  async createEvent(eventData: CalendarEventData): Promise<string> {
    if (!this.calendar) {
      throw new Error('Google Calendar Service 未初始化');
    }

    try {
      console.log('🔵 [GoogleCalendar] 準備建立 Event');
      console.log('  - calendarId:', this.calendarId);
      console.log('  - eventData:', JSON.stringify(eventData, null, 2));

      const event = {
        summary: eventData.summary,
        description: eventData.description || '',
        start: {
          dateTime: eventData.start.dateTime,
          timeZone: eventData.start.timeZone || 'Asia/Taipei',
        },
        end: {
          dateTime: eventData.end.dateTime,
          timeZone: eventData.end.timeZone || 'Asia/Taipei',
        },
        // 暫時移除 attendees，因為 Service Account 需要 Domain-Wide Delegation 才能邀請
        // attendees: eventData.attendees || [],
        location: eventData.location,
        reminders: eventData.reminders || {
          useDefault: true,
        },
      };

      console.log('🔵 [GoogleCalendar] 呼叫 API insert');
      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
        // 移除 sendUpdates，因為沒有 attendees
      });

      console.log('✅ [GoogleCalendar] API 回應成功');
      console.log('  - response.data.id:', response.data.id);
      console.log('  - response.data.htmlLink:', response.data.htmlLink);
      console.log('  - response.data.summary:', response.data.summary);
      console.log('  - response.data.start:', response.data.start);
      console.log('  - response.data.end:', response.data.end);

      return response.data.id || '';
    } catch (error: any) {
      console.error('❌ [GoogleCalendar] 建立 Event 失敗');
      console.error('  - error.message:', error.message);
      console.error('  - error.code:', error.code);
      console.error('  - error.response?.data:', error.response?.data);
      console.error('  - full error:', error);
      throw new Error(`建立 Calendar Event 失敗: ${error.message}`);
    }
  }

  /**
   * 更新 Calendar Event
   * 如果 event 不存在（404），會拋出特殊錯誤讓上層處理
   */
  async updateEvent(eventId: string, eventData: Partial<CalendarEventData>): Promise<void> {
    if (!this.calendar) {
      throw new Error('Google Calendar Service 未初始化');
    }

    try {
      // 先獲取現有 event
      const existingEvent = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId,
      });

      // 合併更新
      const updatedEvent: any = {
        ...existingEvent.data,
        summary: eventData.summary ?? existingEvent.data.summary,
        description: eventData.description ?? existingEvent.data.description,
        start: eventData.start
          ? {
              dateTime: eventData.start.dateTime,
              timeZone: eventData.start.timeZone || 'Asia/Taipei',
            }
          : existingEvent.data.start,
        end: eventData.end
          ? {
              dateTime: eventData.end.dateTime,
              timeZone: eventData.end.timeZone || 'Asia/Taipei',
            }
          : existingEvent.data.end,
        // 暫時移除 attendees，因為 Service Account 需要 Domain-Wide Delegation 才能邀請
        // attendees: eventData.attendees ?? existingEvent.data.attendees,
        location: eventData.location ?? existingEvent.data.location,
      };
      
      // 移除 attendees 欄位（如果存在）
      delete updatedEvent.attendees;

      await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        requestBody: updatedEvent,
        // 移除 sendUpdates，因為沒有 attendees
      });
    } catch (error: any) {
      // 如果是 404，表示 event 不存在，拋出特殊錯誤
      if (error.code === 404 || error.status === 404) {
        console.warn(`⚠️ [GoogleCalendar] Event ${eventId} 不存在，將建立新 event`);
        throw new Error('EVENT_NOT_FOUND');
      }
      console.error('❌ [GoogleCalendar] 更新 Event 失敗');
      console.error('  - error.message:', error.message);
      console.error('  - error.code:', error.code);
      console.error('  - error.response?.data:', error.response?.data);
      throw new Error(`更新 Calendar Event 失敗: ${error.message}`);
    }
  }

  /**
   * 刪除 Calendar Event
   */
  async deleteEvent(eventId: string): Promise<void> {
    if (!this.calendar) {
      throw new Error('Google Calendar Service 未初始化');
    }

    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: eventId,
        // 移除 sendUpdates，因為沒有 attendees
      });
    } catch (error: any) {
      console.error('刪除 Google Calendar Event 失敗:', error);
      throw new Error(`刪除 Calendar Event 失敗: ${error.message}`);
    }
  }

  /**
   * 檢查 Service 是否可用
   */
  isAvailable(): boolean {
    return this.calendar !== null;
  }
}

export const googleCalendarService = new GoogleCalendarService();
