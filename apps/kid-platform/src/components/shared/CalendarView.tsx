/**
 * 日曆主組件
 * 支援月/週/日 view，事件顯示和管理
 */

import React, { useState, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfDay, isToday } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Typography } from '@/components/ui/typography';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';
import type { CalendarView as CalendarViewType, CalendarEvent, CalendarEventConfig } from '@/types/calendar';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export interface CalendarViewProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventAdd?: (date: Date) => void;
  eventConfig?: CalendarEventConfig;
  defaultView?: CalendarViewType;
  className?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events = [],
  onEventClick,
  onDateClick,
  onEventAdd,
  eventConfig = {},
  defaultView = 'month',
  className,
}) => {
  const { t } = useI18n();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarViewType>(defaultView);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // 預設事件配置
  const defaultEventConfig: Required<CalendarEventConfig> = {
    defaultColor: '#3b82f6',
    displayFields: {
      title: true,
      time: true,
      description: false,
    },
    defaultOrder: 0,
  };

  const config = { ...defaultEventConfig, ...eventConfig };

  // 取得指定日期的事件
  const getEventsForDate = useCallback(
    (date: Date): CalendarEvent[] => {
      return events
        .filter((event) => {
          const eventStart = startOfDay(event.startTime);
          const eventEnd = startOfDay(event.endTime);
          const targetDate = startOfDay(date);
          return targetDate >= eventStart && targetDate <= eventEnd;
        })
        .sort((a, b) => {
          // 先按 order 排序，再按開始時間排序
          const orderA = a.order ?? config.defaultOrder;
          const orderB = b.order ?? config.defaultOrder;
          if (orderA !== orderB) return orderA - orderB;
          return a.startTime.getTime() - b.startTime.getTime();
        });
    },
    [events, config.defaultOrder]
  );

  // 處理日期點擊
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      setSelectedDate(date);
      onDateClick?.(date);
    },
    [onDateClick]
  );

  // 處理空白區域點擊（新增事件）
  const handleEmptyAreaClick = useCallback(
    (date: Date) => {
      onEventAdd?.(date);
    },
    [onEventAdd]
  );

  // 導航功能
  const goToPrevious = useCallback(() => {
    if (view === 'month') {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (view === 'week') {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => subDays(prev, 1));
    }
  }, [view]);

  const goToNext = useCallback(() => {
    if (view === 'month') {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (view === 'week') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addDays(prev, 1));
    }
  }, [view]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDate(undefined);
  }, []);

  // 月檢視
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // 週一開始
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px] sm:min-w-0">
          {/* 星期標題 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, index) => (
              <div key={index} className="text-center p-1 sm:p-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.replace('週', '')}</span>
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, dayIdx) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = day >= monthStart && day <= monthEnd;
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={dayIdx}
                className={cn(
                  'min-h-[80px] sm:min-h-[100px] border rounded-lg p-1 sm:p-2 cursor-pointer transition-colors',
                  'hover:bg-accent/50',
                  !isCurrentMonth && 'opacity-40',
                  isToday(day) && 'border-primary border-2',
                  isSelected && 'bg-accent'
                )}
                onClick={() => handleDateSelect(day)}
              >
                {/* 日期數字 */}
                <div className={cn('text-xs sm:text-sm font-medium mb-1', isToday(day) && 'text-primary font-bold')}>
                  {format(day, 'd')}
                </div>

                {/* 事件列表 */}
                <div className="space-y-0.5 sm:space-y-1">
                  {dayEvents.slice(0, 2).map((event) => {
                    const displayFields = event.displayFields ?? config.displayFields;
                    const eventColor = event.color ?? config.defaultColor;

                    return (
                      <div
                        key={event.id}
                        className={cn(
                          'text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer',
                          'hover:opacity-80 transition-opacity'
                        )}
                        style={{ backgroundColor: eventColor, color: 'white' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        {displayFields.time && (
                          <span className="font-medium hidden sm:inline">
                            {format(event.startTime, 'HH:mm')}
                            {event.endTime && ` - ${format(event.endTime, 'HH:mm')}`}
                          </span>
                        )}
                        {displayFields.title && (
                          <div className="truncate">{event.title}</div>
                        )}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground">+{dayEvents.length - 2} 更多</div>
                  )}
                  {dayEvents.length === 0 && (
                    <div
                      className="text-[10px] sm:text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmptyAreaClick(day);
                      }}
                    >
                      <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">{t('common.calendar.addEvent')}</span>
                      <span className="sm:hidden">+</span>
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 週檢視
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px] sm:min-w-[800px]">
          {/* 星期標題 */}
          <div className="grid grid-cols-8 border-b mb-2">
            <div className="p-1 sm:p-2 text-xs sm:text-sm font-medium text-muted-foreground">時間</div>
            {days.map((day) => (
              <div
                key={day.toString()}
                className={cn(
                  'p-1 sm:p-2 text-center text-xs sm:text-sm font-medium border-l',
                  isToday(day) && 'bg-primary/10 text-primary font-bold'
                )}
              >
                <div className="hidden sm:block">{format(day, 'EEE', { locale: zhTW })}</div>
                <div className="sm:hidden">{format(day, 'E', { locale: zhTW })}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">{format(day, 'M/d')}</div>
              </div>
            ))}
          </div>

          {/* 時間軸 */}
          <div className="grid grid-cols-8">
            <div className="border-r">
              {hours.map((hour) => (
                <div key={hour} className="h-12 sm:h-16 border-b text-[10px] sm:text-xs text-muted-foreground p-0.5 sm:p-1">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </div>
              ))}
            </div>
            {days.map((day) => {
              const dayEvents = getEventsForDate(day);

              return (
                <div key={day.toString()} className="border-r border-l">
                  {hours.map((hour) => {
                    const hourStart = new Date(day);
                    hourStart.setHours(hour, 0, 0, 0);
                    const hourEnd = new Date(day);
                    hourEnd.setHours(hour + 1, 0, 0, 0);

                    const hourEvents = dayEvents.filter((event) => {
                      const eventStart = event.startTime;
                      const eventEnd = event.endTime;
                      return eventStart < hourEnd && eventEnd > hourStart;
                    });

                    return (
                      <div
                        key={hour}
                        className={cn(
                          'h-12 sm:h-16 border-b p-0.5 sm:p-1 cursor-pointer hover:bg-accent/50 transition-colors',
                          'relative'
                        )}
                        onClick={() => handleEmptyAreaClick(hourStart)}
                      >
                        {hourEvents.map((event) => {
                          const displayFields = event.displayFields ?? config.displayFields;
                          const eventColor = event.color ?? config.defaultColor;
                          const eventStartMinutes = event.startTime.getHours() * 60 + event.startTime.getMinutes();
                          const eventEndMinutes = event.endTime.getHours() * 60 + event.endTime.getMinutes();
                          const hourStartMinutes = hour * 60;
                          const hourEndMinutes = (hour + 1) * 60;

                          const top = Math.max(0, eventStartMinutes - hourStartMinutes);
                          const height = Math.min(
                            eventEndMinutes - hourStartMinutes,
                            hourEndMinutes - hourStartMinutes
                          );

                          return (
                            <div
                              key={event.id}
                              className={cn(
                                'absolute left-0 right-0 rounded p-0.5 sm:p-1 text-[10px] sm:text-xs cursor-pointer',
                                'hover:opacity-80 transition-opacity z-10'
                              )}
                              style={{
                                backgroundColor: eventColor,
                                color: 'white',
                                top: `${(top / 60) * 100}%`,
                                height: `${(height / 60) * 100}%`,
                                minHeight: '16px',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick?.(event);
                              }}
                            >
                              {displayFields.time && (
                                <div className="font-medium hidden sm:block">
                                  {format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}
                                </div>
                              )}
                              {displayFields.title && <div className="truncate font-medium">{event.title}</div>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 日檢視
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="w-full">
        <div className="grid grid-cols-2 border-b mb-2">
          <div className="p-1 sm:p-2 text-xs sm:text-sm font-medium text-muted-foreground">時間</div>
          <div className={cn('p-1 sm:p-2 text-center text-xs sm:text-sm font-medium', isToday(currentDate) && 'text-primary font-bold')}>
            <div className="hidden sm:block">{format(currentDate, 'yyyy年MM月dd日 EEE', { locale: zhTW })}</div>
            <div className="sm:hidden">{format(currentDate, 'M/d EEE', { locale: zhTW })}</div>
          </div>
        </div>

        <div className="grid grid-cols-2">
          <div className="border-r">
            {hours.map((hour) => (
              <div key={hour} className="h-12 sm:h-16 border-b text-[10px] sm:text-xs text-muted-foreground p-0.5 sm:p-1">
                {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
              </div>
            ))}
          </div>
          <div>
            {hours.map((hour) => {
              const hourStart = new Date(currentDate);
              hourStart.setHours(hour, 0, 0, 0);
              const hourEnd = new Date(currentDate);
              hourEnd.setHours(hour + 1, 0, 0, 0);

              const hourEvents = dayEvents.filter((event) => {
                return event.startTime < hourEnd && event.endTime > hourStart;
              });

              return (
                <div
                  key={hour}
                  className="h-12 sm:h-16 border-b p-0.5 sm:p-1 cursor-pointer hover:bg-accent/50 transition-colors relative"
                  onClick={() => handleEmptyAreaClick(hourStart)}
                >
                  {hourEvents.map((event) => {
                    const displayFields = event.displayFields ?? config.displayFields;
                    const eventColor = event.color ?? config.defaultColor;
                    const eventStartMinutes = event.startTime.getHours() * 60 + event.startTime.getMinutes();
                    const eventEndMinutes = event.endTime.getHours() * 60 + event.endTime.getMinutes();
                    const hourStartMinutes = hour * 60;
                    const hourEndMinutes = (hour + 1) * 60;

                    const top = Math.max(0, eventStartMinutes - hourStartMinutes);
                    const height = Math.min(eventEndMinutes - hourStartMinutes, hourEndMinutes - hourStartMinutes);

                    return (
                      <div
                        key={event.id}
                        className={cn(
                          'absolute left-0 right-0 rounded p-0.5 sm:p-1 text-[10px] sm:text-xs cursor-pointer',
                          'hover:opacity-80 transition-opacity z-10'
                        )}
                        style={{
                          backgroundColor: eventColor,
                          color: 'white',
                          top: `${(top / 60) * 100}%`,
                          height: `${(height / 60) * 100}%`,
                          minHeight: '16px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        {displayFields.time && (
                          <div className="font-medium">
                            {format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}
                          </div>
                        )}
                        {displayFields.title && <div className="font-medium truncate">{event.title}</div>}
                        {displayFields.description && event.description && (
                          <div className="text-[10px] sm:text-xs opacity-90 truncate hidden sm:block">{event.description}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* 控制列 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={goToPrevious}>
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={goToNext}>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs sm:h-10 sm:text-sm" onClick={goToToday}>
            {t('common.calendar.goToToday')}
          </Button>
          <Typography tag="h2" variant="heading" size="lg" className="sm:size-xl ml-1 sm:ml-2">
            {view === 'month' && format(currentDate, 'yyyy年MM月', { locale: zhTW })}
            {view === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'M/d')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'M/d')}`}
            {view === 'day' && (
              <>
                <span className="hidden sm:inline">{format(currentDate, 'yyyy年MM月dd日', { locale: zhTW })}</span>
                <span className="sm:hidden">{format(currentDate, 'M/d', { locale: zhTW })}</span>
              </>
            )}
          </Typography>
        </div>

        <Select value={view} onValueChange={(value) => setView(value as CalendarViewType)}>
          <SelectTrigger className="w-[120px] sm:w-[140px] h-8 sm:h-10 text-xs sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">{t('common.calendar.monthView')}</SelectItem>
            <SelectItem value="week">{t('common.calendar.weekView')}</SelectItem>
            <SelectItem value="day">{t('common.calendar.dayView')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 日曆內容 */}
      <div className="border rounded-lg p-2 sm:p-4 bg-background">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
    </div>
  );
};
