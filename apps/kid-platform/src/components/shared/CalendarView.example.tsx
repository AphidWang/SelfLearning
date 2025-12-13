/**
 * CalendarView 使用範例
 */

import React, { useState } from 'react';
import { CalendarView } from './CalendarView';
import type { CalendarEvent } from '@/types/calendar';

export const CalendarViewExample: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: '數學課',
      description: '學習加減法',
      startTime: new Date(2024, 0, 15, 10, 0),
      endTime: new Date(2024, 0, 15, 11, 0),
      color: '#3b82f6',
      order: 1,
      displayFields: {
        title: true,
        time: true,
        description: false,
      },
    },
    {
      id: '2',
      title: '英文課',
      description: '學習單字',
      startTime: new Date(2024, 0, 15, 14, 0),
      endTime: new Date(2024, 0, 15, 15, 30),
      color: '#10b981',
      order: 2,
      displayFields: {
        title: true,
        time: true,
        description: false,
      },
    },
    {
      id: '3',
      title: '體育課',
      startTime: new Date(2024, 0, 16, 9, 0),
      endTime: new Date(2024, 0, 16, 10, 0),
      color: '#f59e0b',
      order: 1,
    },
  ]);

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
    // 可以開啟編輯對話框
  };

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
  };

  const handleEventAdd = (date: Date) => {
    console.log('Add event on date:', date);
    // 可以開啟新增事件對話框
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: '新事件',
      startTime: new Date(date.setHours(10, 0, 0, 0)),
      endTime: new Date(date.setHours(11, 0, 0, 0)),
      color: '#8b5cf6',
      order: 0,
    };
    setEvents([...events, newEvent]);
  };

  return (
    <div className="p-4">
      <CalendarView
        events={events}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        onEventAdd={handleEventAdd}
        defaultView="month"
        eventConfig={{
          defaultColor: '#3b82f6',
          displayFields: {
            title: true,
            time: true,
            description: false,
          },
        }}
      />
    </div>
  );
};

