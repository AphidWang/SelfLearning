/**
 * 事件新增/編輯對話框
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';
import type { CalendarEvent } from '@/types/calendar';
import { startOfDay } from 'date-fns';
import { getSubjectColor, getSubjectOptions } from '@/constants/subjects';
import { lightenColor } from '@/lib/utils/color';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { Trash2, X, Palette } from 'lucide-react';
import { DialogClose } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const eventSchema = yup.object({
  title: yup.string().required('請輸入事件標題').min(1, '標題不能為空'),
  description: yup.string().optional(),
  subject: yup.string().optional(),
  startDate: yup.date().required('請選擇開始日期'),
  startTime: yup.date().required('請選擇開始時間'),
  endDate: yup.date().required('請選擇結束日期'),
  endTime: yup.date().required('請選擇結束時間'),
  color: yup.string().optional(),
});

type EventFormData = yup.InferType<typeof eventSchema>;

export interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  event?: CalendarEvent | null;
  onSave: (eventData: Omit<CalendarEvent, 'id'>) => void;
  onDelete?: (eventId: string) => void;
}

export const EventDialog: React.FC<EventDialogProps> = ({ open, onOpenChange, date, event, onSave, onDelete }) => {
  const { t } = useI18n();
  const isEdit = !!event;

  // 將日期和時間分開處理
  const getDefaultStartDate = () => {
    if (event) return startOfDay(event.startTime);
    if (date) return startOfDay(date);
    return startOfDay(new Date());
  };

  const getDefaultStartTime = () => {
    if (event) return event.startTime;
    if (date) {
      const d = new Date(date);
      d.setHours(10, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    return d;
  };

  const getDefaultEndDate = () => {
    if (event) return startOfDay(event.endTime);
    if (date) return startOfDay(date);
    return startOfDay(new Date());
  };

  const getDefaultEndTime = () => {
    if (event) return event.endTime;
    if (date) {
      const d = new Date(date);
      d.setHours(11, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(11, 0, 0, 0);
    return d;
  };

  const form = useForm<EventFormData & { subject?: string }>({
    resolver: yupResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      subject: event?.subject || undefined,
      startDate: getDefaultStartDate(),
      startTime: getDefaultStartTime(),
      endDate: getDefaultEndDate(),
      endTime: getDefaultEndTime(),
      color: event?.color || (event?.subject ? getSubjectColor(event.subject) : '#3b82f6'),
    },
  });

  // 當科目改變時，自動更新顏色
  const selectedSubject = form.watch('subject');
  const selectedColor = form.watch('color');
  React.useEffect(() => {
    if (selectedSubject) {
      form.setValue('color', getSubjectColor(selectedSubject));
    }
  }, [selectedSubject, form]);

  React.useEffect(() => {
    if (open) {
      if (event) {
        form.reset({
          title: event.title,
          description: event.description || '',
          subject: event.subject || undefined,
          startDate: startOfDay(event.startTime),
          startTime: event.startTime,
          endDate: startOfDay(event.endTime),
          endTime: event.endTime,
          color: event.color || (event.subject ? getSubjectColor(event.subject) : '#3b82f6'),
        });
      } else if (date) {
        const startDate = startOfDay(date);
        const endDate = startOfDay(date);
        const startTime = new Date(date);
        startTime.setHours(10, 0, 0, 0);
        const endTime = new Date(date);
        endTime.setHours(11, 0, 0, 0);
        form.reset({
          title: '',
          description: '',
          subject: undefined,
          startDate,
          startTime,
          endDate,
          endTime,
          color: '#3b82f6',
        });
      }
    }
  }, [open, event, date, form]);

  const onSubmit = (data: EventFormData & { subject?: string }) => {
    // 合併日期和時間
    const combineDateTime = (date: Date, time: Date): Date => {
      const result = new Date(date);
      result.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
      return result;
    };

    const startTime = combineDateTime(data.startDate, data.startTime);
    const endTime = combineDateTime(data.endDate, data.endTime);

    if (endTime <= startTime) {
      form.setError('endTime', { message: '結束時間必須晚於開始時間' });
      return;
    }

    const subject = data.subject || undefined;
    const color = data.color || (subject ? getSubjectColor(subject) : '#3b82f6');

    onSave({
      title: data.title,
      description: data.description || undefined,
      subject,
      startTime,
      endTime,
      color,
      displayFields: {
        title: true,
        time: true,
        description: false,
      },
      order: 0,
    });

    onOpenChange(false);
    form.reset();
  };

  // 根據選擇的顏色或科目動態設定 Dialog 邊框顏色
  // 優先使用調色盤選擇的顏色，其次使用科目顏色，最後使用預設顏色
  const dialogBorderColor = selectedColor || 
    (selectedSubject
      ? getSubjectColor(selectedSubject)
      : event?.subject
        ? getSubjectColor(event.subject)
        : event?.color || '#3b82f6'); // 預設藍色

  // 計算背景顏色（邊框顏色的淺色版本）
  const dialogBackgroundColor = lightenColor(dialogBorderColor);

  const handleDelete = () => {
    if (event?.id && onDelete) {
      if (window.confirm('確定要刪除這個事件嗎？')) {
        onDelete(event.id);
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        style={{
          borderColor: dialogBorderColor,
          borderWidth: '3px',
          backgroundColor: dialogBackgroundColor,
        }}
        onOpenAutoFocus={(e) => {
          // 防止自動 focus 到刪除按鈕
          e.preventDefault();
        }}
      >
        {/* 隱藏的 DialogTitle 供螢幕閱讀器使用 */}
        <DialogTitle className="sr-only">
          {isEdit ? '編輯事件' : '新增事件'}
        </DialogTitle>

        {/* 自定義關閉按鈕區域 */}
        <div className="absolute right-4 top-4 flex items-center gap-2 z-10">
          {isEdit && event?.id && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center justify-center w-8 h-8 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground text-red-500"
              title="刪除事件"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">刪除</span>
            </button>
          )}
          <DialogClose className="flex items-center justify-center w-8 h-8 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 標題列：科目選擇和顏色選擇 */}
          <div className="flex items-center gap-2">
            <Select
              value={form.watch('subject') || 'none'}
              onValueChange={(value) => {
                if (value === 'none') {
                  form.setValue('subject', undefined);
                  form.setValue('color', '#3b82f6');
                } else {
                  form.setValue('subject', value);
                  form.setValue('color', getSubjectColor(value));
                }
              }}
            >
              <SelectTrigger className="w-auto min-w-[100px]">
                <SelectValue placeholder="選擇科目（選填）" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]" position="popper">
                <SelectItem value="none">無</SelectItem>
                {getSubjectOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="w-10 h-10"
                  title="選擇顏色"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3">
                <div className="space-y-3">
                  <Typography tag="span" variant="subtitle" size="sm" weight="medium">
                    顏色
                  </Typography>
                  <div className="grid grid-cols-6 gap-2">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          form.watch('color') === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => form.setValue('color', color)}
                      />
                    ))}
                  </div>
                  <div className="pt-2 border-t">
                    <Input
                      type="color"
                      {...form.register('color')}
                      className="w-full h-10 p-0 border cursor-pointer"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* 事件標題 */}
          <div className="space-y-2">
            <Typography tag="span" variant="subtitle" size="sm" weight="medium">
              {t('common.calendar.eventTitle')} <span className="text-red-500">*</span>
            </Typography>
            <Input
              {...form.register('title')}
              placeholder="輸入事件標題"
              className={form.formState.errors.title ? 'border-red-500' : ''}
            />
            {form.formState.errors.title && (
              <Typography tag="p" variant="caption" className="text-red-500 text-xs">
                {form.formState.errors.title.message}
              </Typography>
            )}
          </div>

          <div className="space-y-2">
            <Typography tag="span" variant="subtitle" size="sm" weight="medium">
              描述
            </Typography>
            <Input
              {...form.register('description')}
              placeholder="輸入事件描述（選填）"
              autoComplete="off"
              onKeyDown={(e) => {
                // 防止瀏覽器擴充功能可能造成的錯誤
                try {
                  // 確保事件物件存在且有效
                  if (!e || typeof e !== 'object') return;
                  // 正常處理鍵盤事件，但不做任何可能導致錯誤的操作
                } catch (error) {
                  // 靜默處理錯誤，避免影響使用者體驗
                  if (error instanceof Error) {
                    console.warn('Input keydown error:', error.message);
                  }
                  if (e && typeof e.preventDefault === 'function') {
                    e.preventDefault();
                  }
                }
              }}
            />
          </div>

          {/* 時間區塊：開始和結束上下排 */}
          <div className="space-y-4">
            <Typography tag="span" variant="subtitle" size="sm" weight="medium">
              時間 <span className="text-red-500">*</span>
            </Typography>
            <div className="space-y-3">
              {/* 開始時間 */}
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  value={form.watch('startDate')}
                  onChange={(date) => {
                    if (date) {
                      form.setValue('startDate', date);
                    }
                  }}
                  placeholder="日期"
                />
                <TimePicker
                  value={form.watch('startTime')}
                  onChange={(time) => {
                    form.setValue('startTime', time);
                  }}
                  placeholder="時間"
                />
              </div>
              {form.formState.errors.startDate && (
                <Typography tag="p" variant="caption" className="text-red-500 text-xs">
                  {form.formState.errors.startDate.message}
                </Typography>
              )}
              {form.formState.errors.startTime && (
                <Typography tag="p" variant="caption" className="text-red-500 text-xs">
                  {form.formState.errors.startTime.message}
                </Typography>
              )}
              {/* 結束時間 */}
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  value={form.watch('endDate')}
                  onChange={(date) => {
                    if (date) {
                      form.setValue('endDate', date);
                    }
                  }}
                  placeholder="日期"
                />
                <TimePicker
                  value={form.watch('endTime')}
                  onChange={(time) => {
                    form.setValue('endTime', time);
                  }}
                  placeholder="時間"
                />
              </div>
              {form.formState.errors.endDate && (
                <Typography tag="p" variant="caption" className="text-red-500 text-xs">
                  {form.formState.errors.endDate.message}
                </Typography>
              )}
              {form.formState.errors.endTime && (
                <Typography tag="p" variant="caption" className="text-red-500 text-xs">
                  {form.formState.errors.endTime.message}
                </Typography>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.buttons.cancel')}
            </Button>
            <Button type="submit">{t('common.buttons.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
