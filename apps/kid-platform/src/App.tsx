import React, { useState } from 'react';
import { Typography } from './components/ui/typography';
import { BigButton } from './components/kid-friendly/BigButton';
import { CalendarView } from './components/shared/CalendarView';
import { useI18n } from './lib/i18n';
import type { CalendarEvent } from './types/calendar';
import { BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const { t } = useI18n();
  const [events] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: '數學課',
      description: '學習加減法',
      startTime: new Date(2024, 11, 15, 10, 0),
      endTime: new Date(2024, 11, 15, 11, 0),
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
      startTime: new Date(2024, 11, 15, 14, 0),
      endTime: new Date(2024, 11, 15, 15, 30),
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
      startTime: new Date(2024, 11, 16, 9, 0),
      endTime: new Date(2024, 11, 16, 10, 0),
      color: '#f59e0b',
      order: 1,
    },
  ]);

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
  };

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
  };

  const handleEventAdd = (date: Date) => {
    console.log('Add event on date:', date);
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
    </div>
  );
};

export default App;

