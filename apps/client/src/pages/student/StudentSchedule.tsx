import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Calendar from '../../components/calendar/Calendar';
import {
  Plus,
  X,
  Sun,
  Moon,
  Flame,
  ListChecks,
  Sparkles,
  BadgeCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

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

type TimeOfDay = 'morning' | 'afternoon';

type PomodoroCategory = {
  id: string;
  label: string;
  description: string;
  color: string;
};

type ScheduleDay = {
  morning: string[];
  afternoon: string[];
};

type DailyLog = {
  id: string;
  date: string;
  subject: string;
  timeOfDay: TimeOfDay;
  pomodoroType: PomodoroCategory['id'];
  count: number;
  tasks: string[];
  isMakeup: boolean;
  isOverflow: boolean;
};

const StudentSchedule: React.FC = () => {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showImportantOnly, setShowImportantOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState<string>('語文探索');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay>('morning');
  const [selectedPomodoroType, setSelectedPomodoroType] = useState<string>('try');
  const [pomodoroCount, setPomodoroCount] = useState<number>(1);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isMakeup, setIsMakeup] = useState(false);
  const [isOverflow, setIsOverflow] = useState(false);
  const [weekReferenceDate, setWeekReferenceDate] = useState<Date>(new Date());

  const [schedule, setSchedule] = useState<Record<string, ScheduleDay>>({
    星期一: {
      morning: ['語文探索', '閱讀時光'],
      afternoon: ['自然發現']
    },
    星期二: {
      morning: ['數學小隊', '遊戲化算術'],
      afternoon: ['運動冒險']
    },
    星期三: {
      morning: ['創意寫作'],
      afternoon: ['小小藝術家', '社會觀察']
    },
    星期四: {
      morning: ['英文故事屋'],
      afternoon: ['科學實驗日']
    },
    星期五: {
      morning: ['桌遊邏輯'],
      afternoon: ['音樂律動']
    },
    星期六: {
      morning: [],
      afternoon: ['戶外探索']
    },
    星期日: {
      morning: [],
      afternoon: []
    }
  });

  const [newSubject, setNewSubject] = useState('');
  const [newSubjectDay, setNewSubjectDay] = useState<string>('星期一');
  const [newSubjectTime, setNewSubjectTime] = useState<TimeOfDay>('morning');
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog[]>>({});

  const pomodoroTypes: PomodoroCategory[] = [
    { id: 'try', label: '嘗試', description: '第一次嘗試或暖身', color: 'bg-blue-100 text-blue-700' },
    { id: 'normal', label: '一般', description: '穩定前進的進度', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'great', label: '太棒了', description: '表現亮眼，超投入', color: 'bg-purple-100 text-purple-700' },
    { id: 'makeup', label: '補課', description: '補上錯過的課程', color: 'bg-amber-100 text-amber-700' },
    { id: 'extra', label: '超過計畫', description: '超出原本計畫的額外努力', color: 'bg-rose-100 text-rose-700' }
  ];

  const mockTasks = [
    '完成練習題',
    '預習明天的內容',
    '整理筆記',
    '和同學討論',
    '完成專題小任務'
  ];

  const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  const getDateKey = (dateValue: string | Date) => {
    if (typeof dateValue === 'string') return dateValue;
    return new Date(dateValue).toISOString().split('T')[0];
  };

  const getWeekRange = (reference: Date) => {
    const start = new Date(reference);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    setSchedule(prev => ({
      ...prev,
      [newSubjectDay]: {
        ...prev[newSubjectDay],
        [newSubjectTime]: [...prev[newSubjectDay][newSubjectTime], newSubject.trim()]
      }
    }));
    setNewSubject('');
  };

  const handleLogPomodoro = () => {
    if (!selectedSubject.trim()) return;
    const dateKey = getDateKey(selectedDate);
    const log: DailyLog = {
      id: crypto.randomUUID(),
      date: dateKey,
      subject: selectedSubject,
      timeOfDay: selectedTimeOfDay,
      pomodoroType: isMakeup ? 'makeup' : selectedPomodoroType,
      count: pomodoroCount,
      tasks: selectedTasks,
      isMakeup,
      isOverflow
    };

    setDailyLogs(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] ?? []), log]
    }));

    setSelectedTasks([]);
    setPomodoroCount(1);
    setIsMakeup(false);
    setIsOverflow(false);
  };

  const weekLogs = useMemo(() => {
    const { start, end } = getWeekRange(weekReferenceDate);
    return Object.values(dailyLogs)
      .flat()
      .filter(log => {
        const date = new Date(log.date);
        return date >= start && date <= end;
      });
  }, [dailyLogs, weekReferenceDate]);

  const weekSummary = useMemo(() => {
    const summary: Record<string, { total: number; byType: Record<string, number>; makeupCount: number; overflowCount: number }> = {};

    weekLogs.forEach(log => {
      if (!summary[log.subject]) {
        summary[log.subject] = { total: 0, byType: {}, makeupCount: 0, overflowCount: 0 };
      }

      summary[log.subject].total += log.count;
      summary[log.subject].byType[log.pomodoroType] = (summary[log.subject].byType[log.pomodoroType] ?? 0) + log.count;
      if (log.isMakeup) summary[log.subject].makeupCount += log.count;
      if (log.isOverflow) summary[log.subject].overflowCount += log.count;
    });

    return summary;
  }, [weekLogs]);

  const currentWeekRange = getWeekRange(weekReferenceDate);
  const selectedDayName = weekdayNames[new Date(selectedDate).getDay()];
  const availableSubjects = [...schedule[selectedDayName]?.morning, ...schedule[selectedDayName]?.afternoon].filter(Boolean);

  const getPomodoroStyle = (typeId: string) => pomodoroTypes.find(type => type.id === typeId)?.color ?? 'bg-gray-100 text-gray-700';

  useEffect(() => {
    if (availableSubjects.length === 0) {
      setSelectedSubject('自由探索');
    } else if (!availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableSubjects, selectedSubject]);

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
    <PageLayout title="課表與番茄紀錄">
      <div className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">可愛課表</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">早上 / 下午都能放入多個科目，方便小朋友安排</p>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">自由在課表裡加上喜歡的主題，沒有也沒關係</div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(schedule).map(([day, slots]) => (
                <div key={day} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800 dark:text-white">{day}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{slots.morning.length + slots.afternoon.length} 個科目</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white dark:bg-gray-800 rounded-md p-2 shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center text-sm font-medium text-amber-700 dark:text-amber-200 mb-1">
                        <Sun className="w-4 h-4 mr-1" /> 早上
                      </div>
                      {slots.morning.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {slots.morning.map(subject => (
                            <span key={subject} className="px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 rounded-full text-xs">
                              {subject}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">目前空白，期待新點子</p>
                      )}
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-md p-2 shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center text-sm font-medium text-indigo-700 dark:text-indigo-200 mb-1">
                        <Moon className="w-4 h-4 mr-1" /> 下午
                      </div>
                      {slots.afternoon.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {slots.afternoon.map(subject => (
                            <span key={subject} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 rounded-full text-xs">
                              {subject}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">下午暫時留白</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">幫課表加上新科目</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">天</label>
                    <select
                      value={newSubjectDay}
                      onChange={e => setNewSubjectDay(e.target.value)}
                      className="w-full rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
                    >
                      {Object.keys(schedule).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">時段</label>
                    <select
                      value={newSubjectTime}
                      onChange={e => setNewSubjectTime(e.target.value as TimeOfDay)}
                      className="w-full rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
                    >
                      <option value="morning">早上</option>
                      <option value="afternoon">下午</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">科目名稱</label>
                  <input
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="例如：小小科學家"
                    className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
                  />
                </div>
                <button
                  onClick={handleAddSubject}
                  className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" /> 加入課表
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">番茄類型小抄</h4>
              <div className="space-y-2">
                {pomodoroTypes.map(type => (
                  <div key={type.id} className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-1 rounded-full ${type.color}`}>{type.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{type.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Day View：紀錄今天</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">選擇科目、番茄種類，還能連結相關任務</p>
              </div>
              <Flame className="w-5 h-5 text-rose-500" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">日期</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">時段</label>
                <select
                  value={selectedTimeOfDay}
                  onChange={e => setSelectedTimeOfDay(e.target.value as TimeOfDay)}
                  className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option value="morning">早上</option>
                  <option value="afternoon">下午</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">今天進行的科目</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  {availableSubjects.length === 0 ? (
                    <option value="自由探索">自由探索</option>
                  ) : (
                    availableSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">番茄數量</label>
                <input
                  type="number"
                  min={1}
                  value={pomodoroCount}
                  onChange={e => setPomodoroCount(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">番茄種類</label>
                <select
                  value={selectedPomodoroType}
                  onChange={e => setSelectedPomodoroType(e.target.value)}
                  className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  {pomodoroTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4 mt-6 sm:mt-0">
                <label className="inline-flex items-center text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={isMakeup}
                    onChange={e => setIsMakeup(e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  補課
                </label>
                <label className="inline-flex items-center text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={isOverflow}
                    onChange={e => setIsOverflow(e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  超過計畫
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">相關任務（可多選）</label>
              <div className="grid grid-cols-2 gap-2">
                {mockTasks.map(task => (
                  <label key={task} className="flex items-center text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedTasks(prev => [...prev, task]);
                        } else {
                          setSelectedTasks(prev => prev.filter(t => t !== task));
                        }
                      }}
                      className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {task}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleLogPomodoro}
              className="w-full inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
            >
              <BadgeCheck className="w-4 h-4 mr-2" /> 記錄今天的番茄
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">今天的紀錄</h4>
              <div className="space-y-2">
                {(dailyLogs[selectedDate] ?? []).length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">還沒有紀錄，先為自己加油吧！</p>
                )}
                {(dailyLogs[selectedDate] ?? []).map(log => (
                  <div key={log.id} className="flex items-start justify-between bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white">
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">{log.timeOfDay === 'morning' ? '早上' : '下午'}</span>
                        {log.subject}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-2 items-center">
                        <span className={`px-2 py-1 rounded-full ${getPomodoroStyle(log.pomodoroType)}`}>
                          {pomodoroTypes.find(type => type.id === log.pomodoroType)?.label} × {log.count}
                        </span>
                        {log.isMakeup && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">補課</span>}
                        {log.isOverflow && <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-700">超過計畫</span>}
                        {log.tasks.length > 0 && (
                          <span className="inline-flex items-center text-indigo-700 dark:text-indigo-200"><ListChecks className="w-4 h-4 mr-1" /> {log.tasks.join('、')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Week View：一週總覽</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">看出不同番茄類型、補課與超額情況</p>
              </div>
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {new Intl.DateTimeFormat('zh-TW', { month: 'short', day: 'numeric' }).format(currentWeekRange.start)}
                {' '}~{' '}
                {new Intl.DateTimeFormat('zh-TW', { month: 'short', day: 'numeric' }).format(currentWeekRange.end)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setWeekReferenceDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7))}
                  className="p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setWeekReferenceDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7))}
                  className="p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {weekLogs.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">本週還沒有紀錄，從 Day View 開始吧！</p>
            )}

            <div className="space-y-3">
              {Object.entries(weekSummary).map(([subject, summary]) => (
                <div key={subject} className="border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800 dark:text-white">{subject}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">番茄總數：{summary.total}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Object.entries(summary.byType).map(([typeId, count]) => (
                      <span key={typeId} className={`px-2 py-1 rounded-full text-xs ${getPomodoroStyle(typeId)}`}>
                        {pomodoroTypes.find(type => type.id === typeId)?.label} × {count}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    {summary.makeupCount > 0 && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">補課 {summary.makeupCount}</span>}
                    {summary.overflowCount > 0 && <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-700">超過 {summary.overflowCount}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">月課表（進階視圖）</h2>
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