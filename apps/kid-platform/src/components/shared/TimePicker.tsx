/**
 * 時間選擇器
 * 兩個 dropdown：小時 (00-23) 和分鐘 (0-55，每5分鐘一格)
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  className?: string;
}

// 生成小時選項 (00-23)
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

// 生成分鐘選項 (0-55，每5分鐘一格)
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5);

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder = '選擇時間',
  className,
}) => {
  // 取得當前小時和分鐘
  const currentHour = value ? value.getHours().toString().padStart(2, '0') : '';
  const currentMinute = value ? Math.floor(value.getMinutes() / 5) * 5 : 0;

  // 更新時間
  const updateTime = (hour: string | undefined, minute: number | undefined) => {
    const baseDate = value || new Date();
    const newDate = new Date(baseDate);
    const hours = hour !== undefined ? parseInt(hour, 10) : (baseDate ? baseDate.getHours() : 0);
    const minutes = minute !== undefined ? minute : (baseDate ? baseDate.getMinutes() : 0);
    newDate.setHours(hours, minutes, 0, 0);
    onChange(newDate);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentHour || undefined}
        onValueChange={(hour) => updateTime(hour, undefined)}
      >
        <SelectTrigger className="w-20">
          <SelectValue placeholder="時" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {HOUR_OPTIONS.map((hour) => (
            <SelectItem key={hour} value={hour}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select
        value={currentMinute !== undefined ? currentMinute.toString() : undefined}
        onValueChange={(minuteStr) => {
          const minute = parseInt(minuteStr, 10);
          if (!isNaN(minute)) {
            updateTime(undefined, minute);
          }
        }}
      >
        <SelectTrigger className="w-20">
          <SelectValue placeholder="分" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {MINUTE_OPTIONS.map((minute) => (
            <SelectItem key={minute} value={minute.toString()}>
              {minute.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
