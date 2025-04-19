import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  isImportant?: boolean;
  category?: string;
  color?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onSelectDate?: (date: Date) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
  showImportantOnly?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  onSelectDate,
  onSelectEvent,
  showImportantOnly = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week'>('month');
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day names for the header
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  // Filter events for the current month
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return isSameMonth(eventDate, currentDate) && (!showImportantOnly || event.isImportant);
  });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());
  
  const toggleView = () => {
    setCurrentView(currentView === 'month' ? 'week' : 'month');
  };

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(event => isSameDay(new Date(event.date), day));
  };

  const getCellClassName = (day: Date) => {
    let className = "h-24 border border-gray-200 dark:border-gray-700 p-1 transition duration-150";
    
    if (!isSameMonth(day, currentDate)) {
      className += " bg-gray-50 dark:bg-gray-900 text-gray-400";
    } else if (isToday(day)) {
      className += " bg-indigo-50 dark:bg-indigo-900/30";
    } else {
      className += " bg-white dark:bg-gray-800";
    }
    
    return className;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {format(currentDate, 'yyyy年 M月')}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            今天
          </button>
          <button
            onClick={toggleView}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {currentView === 'month' ? '週檢視' : '月檢視'}
          </button>
          <div className="flex">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-l-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-r-md border border-gray-300 dark:border-gray-600 border-l-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {dayNames.map((day, index) => (
          <div 
            key={index} 
            className="p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 h-[600px] overflow-y-auto">
        {days.map((day, i) => (
          <div 
            key={i} 
            className={getCellClassName(day)}
            onClick={() => onSelectDate && onSelectDate(day)}
          >
            <div className="flex justify-between">
              <span 
                className={`text-sm font-medium ${
                  isToday(day) 
                    ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {format(day, 'd')}
              </span>
            </div>
            <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
              {getEventsForDay(day).map((event) => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent && onSelectEvent(event);
                  }}
                  className={`text-xs truncate px-2 py-1 rounded ${
                    event.isImportant 
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-l-2 border-orange-500' 
                      : `bg-${event.color || 'blue'}-100 dark:bg-${event.color || 'blue'}-900/30 text-${event.color || 'blue'}-800 dark:text-${event.color || 'blue'}-300`
                  } cursor-pointer hover:opacity-80 transition`}
                >
                  {event.startTime && <span className="font-medium">{event.startTime} </span>}
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;