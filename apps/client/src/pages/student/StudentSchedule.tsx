import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Calendar from '../../components/calendar/Calendar';
import { Plus, X, Edit, Clock, MapPin, Book } from 'lucide-react';

// Mock calendar events
const mockEvents = [
  {
    id: '1',
    title: '國語課',
    date: new Date(),
    startTime: '10:30',
    endTime: '12:00',
    category: '國語',
    location: '主教室',
    color: 'indigo',
    isImportant: true
  },
  {
    id: '2',
    title: '自然科學',
    date: new Date(),
    startTime: '13:00',
    endTime: '14:30',
    category: '自然',
    location: '科學教室',
    color: 'green',
    isImportant: false
  },
  {
    id: '3',
    title: '數學課',
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
    startTime: '09:00',
    endTime: '10:30',
    category: '數學',
    location: '主教室',
    color: 'blue',
    isImportant: false
  },
  {
    id: '4',
    title: '戶外教學',
    date: new Date(new Date().setDate(new Date().getDate() + 7)),
    startTime: '08:30',
    endTime: '16:00',
    category: '社會',
    location: '自然博物館',
    color: 'orange',
    isImportant: true
  },
  {
    id: '5',
    title: '英語會話',
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    startTime: '14:00',
    endTime: '15:30',
    category: '英語',
    location: '視訊教室',
    color: 'purple',
    isImportant: false
  }
];

interface Event {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  category?: string;
  location?: string;
  color?: string;
  isImportant?: boolean;
}

const StudentSchedule: React.FC = () => {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showImportantOnly, setShowImportantOnly] = useState(false);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedEvent({
      id: String(Date.now()),
      title: '',
      date: date,
      startTime: '',
      endTime: '',
      isImportant: false
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = (event: Event) => {
    if (events.find(e => e.id === event.id)) {
      setEvents(events.map(e => e.id === event.id ? event : e));
    } else {
      setEvents([...events, event]);
    }
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <PageLayout title="課表">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">月課表</h2>
              <div className="flex space-x-3">
                <div className="flex items-center">
                  <input
                    id="showImportant"
                    type="checkbox"
                    checked={showImportantOnly}
                    onChange={() => setShowImportantOnly(!showImportantOnly)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showImportant" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    僅顯示重要事項
                  </label>
                </div>
                <button
                  onClick={() => handleDateSelect(new Date())}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus size={16} className="mr-1" />
                  新增課程
                </button>
              </div>
            </div>
            <Calendar 
              events={events} 
              onSelectDate={handleDateSelect}
              onSelectEvent={handleEventSelect}
              showImportantOnly={showImportantOnly}
            />
          </div>
        </div>
        
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              課表類型
            </h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                一般課表 (目前)
              </button>
              <button className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none">
                旅行課表
              </button>
              <button className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none">
                滑雪課表
              </button>
              <button className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none">
                假期課表
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                即將到來的課程
              </h3>
              
              <div className="space-y-3">
                {events
                  .filter(event => new Date(event.date) >= new Date())
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 3)
                  .map((event, index) => (
                    <div 
                      key={index}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/70 cursor-pointer"
                      onClick={() => handleEventSelect(event)}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {event.title}
                        </h4>
                        {event.isImportant && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                            重要
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {new Intl.DateTimeFormat('zh-TW', { 
                          month: 'short', 
                          day: 'numeric', 
                          weekday: 'short' 
                        }).format(new Date(event.date))}
                        {event.startTime && ` · ${event.startTime} - ${event.endTime}`}
                      </div>
                      {event.category && (
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {event.category}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Event Modal */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedEvent.id ? '編輯課程' : '新增課程'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    標題
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={selectedEvent.title}
                    onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="課程名稱"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      開始時間
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      value={selectedEvent.startTime}
                      onChange={(e) => setSelectedEvent({...selectedEvent, startTime: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      結束時間
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      value={selectedEvent.endTime}
                      onChange={(e) => setSelectedEvent({...selectedEvent, endTime: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    科目
                  </label>
                  <select
                    id="category"
                    value={selectedEvent.category}
                    onChange={(e) => setSelectedEvent({...selectedEvent, category: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">選擇科目</option>
                    <option value="國語">國語</option>
                    <option value="數學">數學</option>
                    <option value="英語">英語</option>
                    <option value="自然">自然</option>
                    <option value="社會">社會</option>
                    <option value="藝術">藝術</option>
                    <option value="體育">體育</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    地點
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={selectedEvent.location}
                    onChange={(e) => setSelectedEvent({...selectedEvent, location: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="上課地點"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    id="isImportant"
                    type="checkbox"
                    checked={selectedEvent.isImportant}
                    onChange={(e) => setSelectedEvent({...selectedEvent, isImportant: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isImportant" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    標記為重要事項
                  </label>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end space-x-3">
              {selectedEvent.id && (
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  刪除
                </button>
              )}
              <button
                onClick={closeModal}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                onClick={() => handleSaveEvent(selectedEvent)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default StudentSchedule;