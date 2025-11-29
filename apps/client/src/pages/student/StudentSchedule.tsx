import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock3,
  Flame,
  PartyPopper,
  PlusCircle,
  Sparkles,
  Sun,
  Sunset,
  TimerReset
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
type ScheduleSlot = 'morning' | 'afternoon';

interface WeeklySchedule {
  label: string;
  key: DayKey;
  morning: string[];
  afternoon: string[];
}

interface TomatoType {
  id: string;
  label: string;
  color: string;
  text: string;
  description: string;
  icon: React.ReactNode;
}

interface DailyRecord {
  id: string;
  date: string;
  subjects: string[];
  tomatoCounts: Record<string, number>;
  tasks: string[];
  note?: string;
}

const TOMATO_TYPES: TomatoType[] = [
  {
    id: 'try',
    label: '嘗試',
    color: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-200',
    description: '第一次試試看，勇敢踏出第一步',
    icon: <Sparkles className="w-4 h-4" />
  },
  {
    id: 'regular',
    label: '一般',
    color: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-800 dark:text-indigo-200',
    description: '穩定前進的學習番茄',
    icon: <Clock3 className="w-4 h-4" />
  },
  {
    id: 'great',
    label: '太棒了',
    color: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-200',
    description: '超專注、感覺很棒的番茄',
    icon: <PartyPopper className="w-4 h-4" />
  },
  {
    id: 'makeup',
    label: '補課',
    color: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-800 dark:text-cyan-200',
    description: '補回進度的番茄，會在週報特別標示',
    icon: <TimerReset className="w-4 h-4" />
  },
  {
    id: 'extra',
    label: '加碼',
    color: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-800 dark:text-pink-200',
    description: '超過原本計畫的番茄，也會特別顯示',
    icon: <Flame className="w-4 h-4" />
  }
];

const SUBJECT_OPTIONS = ['國語', '數學', '英語', '自然', '社會', '藝術', '體育', '音樂', '閱讀', '生活課題'];

const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule[] = [
  { key: 'mon', label: '週一', morning: ['晨間閱讀', '數學探險'], afternoon: ['自然探索', '藝術創作'] },
  { key: 'tue', label: '週二', morning: ['國語故事', '寫字練習'], afternoon: ['英語遊戲', '生活實驗'] },
  { key: 'wed', label: '週三', morning: ['數學暖身', '科學實驗'], afternoon: ['社會觀察', '音樂時間'] },
  { key: 'thu', label: '週四', morning: ['晨跑體育', '閱讀討論'], afternoon: ['英語繪本', '數學小組'] },
  { key: 'fri', label: '週五', morning: ['創意寫作', '社會議題'], afternoon: ['藝術拼貼', '生活家事'] },
  { key: 'sat', label: '週六', morning: ['自由探索'], afternoon: ['家務任務'] },
  { key: 'sun', label: '週日', morning: ['休息日'], afternoon: ['家庭時光'] }
];

const DEFAULT_TASKS = ['完成閱讀筆記', '解題 3 題', '和同學討論', '完成練習本', '整理學習單'];

const createEmptyCounts = () => TOMATO_TYPES.reduce<Record<string, number>>((acc, type) => {
  acc[type.id] = 0;
  return acc;
}, {});

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const StudentSchedule: React.FC = () => {
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>(DEFAULT_WEEKLY_SCHEDULE);
  const [scheduleDay, setScheduleDay] = useState<DayKey>('mon');
  const [scheduleSlot, setScheduleSlot] = useState<ScheduleSlot>('morning');
  const [newSubject, setNewSubject] = useState('');

  const [recordDate, setRecordDate] = useState(formatDate(new Date()));
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [tomatoCounts, setTomatoCounts] = useState<Record<string, number>>(createEmptyCounts);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([
    {
      id: 'r1',
      date: formatDate(new Date()),
      subjects: ['數學', '英語'],
      tomatoCounts: { try: 1, regular: 2, great: 1, makeup: 0, extra: 0 },
      tasks: ['解題 3 題', '完成閱讀筆記'],
      note: '今天的英語口說有進步！'
    },
    {
      id: 'r2',
      date: formatDate(new Date(new Date().setDate(new Date().getDate() - 1))),
      subjects: ['國語', '自然'],
      tomatoCounts: { try: 0, regular: 1, great: 0, makeup: 1, extra: 0 },
      tasks: ['整理學習單'],
      note: '補上昨天的自然課'
    },
    {
      id: 'r3',
      date: formatDate(new Date(new Date().setDate(new Date().getDate() - 3))),
      subjects: ['數學'],
      tomatoCounts: { try: 0, regular: 1, great: 0, makeup: 0, extra: 1 },
      tasks: [],
      note: '多做了一組挑戰題！'
    }
  ]);

  const weekStart = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    const day = start.getDay();
    const diff = start.getDay() === 0 ? -6 : 1 - day; // Monday as start of week
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const weekRecords = useMemo(
    () =>
      dailyRecords.filter(record => {
        const date = new Date(record.date);
        return date >= weekStart && date <= weekEnd;
      }),
    [dailyRecords, weekEnd, weekStart]
  );

  const weekSummary = useMemo(() => {
    const subjectTotals: Record<string, number> = {};
    const tomatoTotals = createEmptyCounts();
    let makeupCount = 0;
    let extraCount = 0;

    weekRecords.forEach(record => {
      const totalTomatoes = Object.values(record.tomatoCounts).reduce((sum, value) => sum + value, 0);
      record.subjects.forEach(subject => {
        subjectTotals[subject] = (subjectTotals[subject] || 0) + totalTomatoes;
      });

      Object.entries(record.tomatoCounts).forEach(([key, value]) => {
        tomatoTotals[key] = (tomatoTotals[key] || 0) + value;
      });

      makeupCount += record.tomatoCounts.makeup || 0;
      extraCount += record.tomatoCounts.extra || 0;
    });

    return {
      subjectTotals,
      tomatoTotals,
      makeupCount,
      extraCount
    };
  }, [weekRecords]);

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;

    setWeeklySchedule(prev =>
      prev.map(day => {
        if (day.key !== scheduleDay) return day;
        const updated = { ...day };
        updated[scheduleSlot] = [...updated[scheduleSlot], newSubject.trim()];
        return updated;
      })
    );

    if (!SUBJECT_OPTIONS.includes(newSubject.trim())) {
      SUBJECT_OPTIONS.push(newSubject.trim());
    }

    setNewSubject('');
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(item => item !== subject) : [...prev, subject]
    );
  };

  const toggleTask = (task: string) => {
    setSelectedTasks(prev => (prev.includes(task) ? prev.filter(item => item !== task) : [...prev, task]));
  };

  const adjustTomato = (id: string, delta: number) => {
    setTomatoCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  };

  const handleAddRecord = () => {
    if (!selectedSubjects.length) return;

    const record: DailyRecord = {
      id: `${Date.now()}`,
      date: recordDate,
      subjects: selectedSubjects,
      tomatoCounts,
      tasks: selectedTasks,
      note
    };

    setDailyRecords(prev => [record, ...prev]);
    setSelectedSubjects([]);
    setSelectedTasks([]);
    setTomatoCounts(createEmptyCounts());
    setNote('');
  };

  const totalTomatoTypes = TOMATO_TYPES.map(type => ({
    ...type,
    total: tomatoCounts[type.id] || 0
  }));

  return (
    <PageLayout title="課表與番茄紀錄">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm opacity-90">給小學生也友善的課表 + 番茄紀錄</p>
              <h2 className="text-2xl font-bold mt-1">早上、下午的簡單課表，搭配每日番茄紀錄</h2>
              <p className="text-sm opacity-90 mt-2">五種不同的番茄類型，補課與加碼會在週報清楚顯示</p>
            </div>
            <div className="flex items-center space-x-3 bg-white/15 rounded-xl px-4 py-3">
              <BookOpen className="w-10 h-10" />
              <div>
                <p className="text-sm">本週提醒</p>
                <p className="font-semibold">把喜歡的科目塞進早上或下午！</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">簡易課表</h3>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">早上 / 下午都可以放多個科目</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {weeklySchedule.map(day => (
                  <div key={day.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">{day.label}</span>
                      </div>
                      <span className="text-xs text-gray-500">{day.morning.length + day.afternoon.length} 科</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                          <Sun className="w-4 h-4" /> <span>早上</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {day.morning.length ? (
                            day.morning.map((subject, index) => (
                              <span
                                key={`${subject}-${index}`}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200"
                              >
                                {subject}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">暫時空空的</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                          <Sunset className="w-4 h-4" /> <span>下午</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {day.afternoon.length ? (
                            day.afternoon.map((subject, index) => (
                              <span
                                key={`${subject}-${index}`}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                              >
                                {subject}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">暫時空空的</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex flex-col md:flex-row md:items-end md:space-x-3 space-y-3 md:space-y-0">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">選擇星期與時段</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={scheduleDay}
                        onChange={e => setScheduleDay(e.target.value as DayKey)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {weeklySchedule.map(day => (
                          <option key={day.key} value={day.key}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={scheduleSlot}
                        onChange={e => setScheduleSlot(e.target.value as ScheduleSlot)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="morning">早上</option>
                        <option value="afternoon">下午</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">要新增的科目</label>
                    <input
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      list="subjectOptions"
                      placeholder="例如：畫圖 / 英語繪本"
                      className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <datalist id="subjectOptions">
                      {SUBJECT_OPTIONS.map(subject => (
                        <option key={subject} value={subject} />
                      ))}
                    </datalist>
                  </div>
                  <button
                    onClick={handleAddSubject}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    加到課表
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">每日 Day view 紀錄</h3>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">可以連結多個任務，也可以不填</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3 md:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">日期</label>
                      <input
                        type="date"
                        value={recordDate}
                        onChange={e => setRecordDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">今天有上的科目</label>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECT_OPTIONS.map(subject => (
                          <button
                            key={subject}
                            onClick={() => toggleSubject(subject)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                              selectedSubjects.includes(subject)
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                            }`}
                          >
                            {subject}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">番茄類型與數量</label>
                      <div className="space-y-2">
                        {totalTomatoTypes.map(type => (
                          <div key={type.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${type.color} ${type.text}`}>
                                {type.icon}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => adjustTomato(type.id, -1)}
                                className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white">{type.total}</span>
                              <button
                                onClick={() => adjustTomato(type.id, 1)}
                                className="w-8 h-8 rounded-md bg-indigo-600 text-white"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">相關任務（可選）</label>
                        <div className="flex flex-wrap gap-2">
                          {DEFAULT_TASKS.map(task => (
                            <button
                              key={task}
                              onClick={() => toggleTask(task)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                                selectedTasks.includes(task)
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200'
                                  : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                              }`}
                            >
                              {task}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">想記下什麼嗎？</label>
                        <textarea
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="今天有什麼特別的想法或心得"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 border border-dashed border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">勾選科目 + 計算番茄數量，就能把今天記錄下來</p>
                    <div className="flex flex-wrap gap-2">
                      {TOMATO_TYPES.map(type => (
                        <span
                          key={type.id}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${type.color} ${type.text}`}
                        >
                          {type.icon}
                          <span className="ml-1">{type.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleAddRecord}
                    className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> 儲存今日紀錄
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">今日/最近紀錄</h4>
                <div className="space-y-3">
                  {dailyRecords.map(record => (
                    <div key={record.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <CalendarDays className="w-4 h-4 text-indigo-500" />
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{record.date}</p>
                          <div className="flex flex-wrap gap-1">
                            {record.subjects.map(subject => (
                              <span
                                key={`${record.id}-${subject}`}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {TOMATO_TYPES.map(type => {
                            const count = record.tomatoCounts[type.id] || 0;
                            if (!count) return null;
                            return (
                              <span
                                key={`${record.id}-${type.id}`}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${type.color} ${type.text}`}
                              >
                                {type.icon}
                                <span className="ml-1">{type.label} × {count}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {(record.tasks.length > 0 || record.note) && (
                        <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                          {record.tasks.length > 0 && (
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                              <div className="flex flex-wrap gap-1">
                                {record.tasks.map(task => (
                                  <span
                                    key={`${record.id}-${task}`}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                                  >
                                    {task}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {record.note && (
                            <p className="flex items-start space-x-2">
                              <span className="text-indigo-500 font-semibold">筆記：</span>
                              <span className="flex-1">{record.note}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Week view 總覽</h3>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
              <p className="text-sm text-gray-600 dark:text-gray-300">{formatDate(weekStart)} - {formatDate(weekEnd)}</p>
              <div className="flex items-center space-x-2 mt-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-gray-800 dark:text-gray-200">本週共 {weekRecords.length} 筆紀錄</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {TOMATO_TYPES.map(type => {
                  const total = weekSummary.tomatoTotals[type.id] || 0;
                  if (!total) return null;
                  return (
                    <span
                      key={`week-${type.id}`}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${type.color} ${type.text}`}
                    >
                      {type.icon}
                      <span className="ml-1">{type.label} × {total}</span>
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center space-x-2 mt-3 text-xs text-gray-600 dark:text-gray-300">
                <TimerReset className="w-4 h-4 text-cyan-500" />
                <span>補課番茄：{weekSummary.makeupCount}</span>
                <Flame className="w-4 h-4 text-pink-500 ml-2" />
                <span>加碼番茄：{weekSummary.extraCount}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">科目番茄總和</h4>
              {Object.keys(weekSummary.subjectTotals).length === 0 && (
                <p className="text-sm text-gray-500">本週還沒有紀錄</p>
              )}
              {Object.entries(weekSummary.subjectTotals).map(([subject, total]) => (
                <div key={subject} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium text-gray-900 dark:text-white">{subject}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{total} 顆番茄</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TOMATO_TYPES.map(type => {
                      const count = weekRecords.reduce((sum, record) => {
                        if (!record.subjects.includes(subject)) return sum;
                        return sum + (record.tomatoCounts[type.id] || 0);
                      }, 0);

                      if (!count) return null;

                      return (
                        <span
                          key={`${subject}-${type.id}`}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${type.color} ${type.text}`}
                        >
                          {type.label} × {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">補課 / 加碼提醒</h4>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                <TimerReset className="w-4 h-4 text-cyan-500" />
                <span>補課會用青色顯示，方便知道哪些是補回的進度。</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                <Flame className="w-4 h-4 text-pink-500" />
                <span>加碼會用粉色顯示，幫你看到超過計畫的努力！</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default StudentSchedule;
