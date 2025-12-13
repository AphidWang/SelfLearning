import React, { useState } from 'react';
import { Typography } from './components/ui/typography';
import { BigButton } from './components/kid-friendly/BigButton';
import { CalendarView } from './components/shared/CalendarView';
import { EventDialog } from './components/shared/EventDialog';
import { useI18n } from './lib/i18n';
import type { CalendarEvent } from './types/calendar';
import { SUBJECTS } from './constants/subjects';
import { BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const { t } = useI18n();
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: '數學課',
      description: '學習加減法',
      subject: SUBJECTS.MATH,
      startTime: new Date(2024, 11, 15, 10, 0),
      endTime: new Date(2024, 11, 15, 11, 0),
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
      subject: SUBJECTS.ENGLISH,
      startTime: new Date(2024, 11, 15, 14, 0),
      endTime: new Date(2024, 11, 15, 15, 30),
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
      subject: SUBJECTS.PE,
      startTime: new Date(2024, 11, 16, 9, 0),
      endTime: new Date(2024, 11, 16, 10, 0),
      order: 1,
    },
  ]);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(event.startTime);
    setEventDialogOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setEventDialogOpen(true);
  };

  const handleEventAdd = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setEventDialogOpen(true);
  };

  const handleEventSave = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (selectedEvent) {
      // 編輯現有事件
      setEvents(events.map((e) => (e.id === selectedEvent.id ? { ...selectedEvent, ...eventData } : e)));
    } else {
      // 新增事件
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        ...eventData,
      };
      setEvents([...events, newEvent]);
    }
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter((e) => e.id !== eventId));
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <Typography tag="h1" variant="title" size="3xl" weight="bold" colorful>
            {t('student.welcome.title')}
          </Typography>
          <Typography tag="p" variant="subtitle" size="lg" className="mt-4">
            {t('student.welcome.subtitle')}
          </Typography>
          <div className="mt-8">
            <BigButton icon={BookOpen} iconPosition="left">
              {t('student.welcome.startButton')}
            </BigButton>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <Typography tag="h2" variant="heading" size="2xl" weight="bold" className="mb-6">
            我的日曆
          </Typography>
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
      </div>

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        date={selectedDate}
        event={selectedEvent}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
      />
    </div>
  );
};

export default App;

