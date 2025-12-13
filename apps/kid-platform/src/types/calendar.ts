/**
 * 日曆事件類型定義
 */

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  color?: string;
  displayFields?: {
    title?: boolean;
    time?: boolean;
    description?: boolean;
    [key: string]: boolean | undefined;
  };
  order?: number; // 用於排序
  metadata?: Record<string, unknown>;
}

export interface CalendarEventConfig {
  defaultColor?: string;
  displayFields?: {
    title?: boolean;
    time?: boolean;
    description?: boolean;
    [key: string]: boolean | undefined;
  };
  defaultOrder?: number;
}

