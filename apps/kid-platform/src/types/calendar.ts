/**
 * 日曆事件類型定義
 */

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  subject?: string; // 科目（例如：'國語', '數學'）
  startTime: Date;
  endTime: Date;
  color?: string; // 顏色（如果沒有指定，會根據 subject 自動設定）
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

