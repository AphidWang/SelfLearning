import React, { useMemo, useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { BookOpen, CalendarDays, Clock3, NotebookPen, Plus, Sparkles, Sun } from 'lucide-react';

import type { FC } from 'react';

type PomodoroType = 'try' | 'normal' | 'awesome' | 'deep' | 'helper';

type StudySlot = '早上' | '下午';

interface TimetableDay {
  day: string;
  mood: string;
  morning: string[];
  afternoon: string[];
  sticker: string;
}

interface PomodoroLog {
  type: PomodoroType;
  count: number;
}

interface SubjectLog {
  subject: string;
  slot: StudySlot;
  pomodoros: PomodoroLog[];
  tasks?: string[];
  isMakeup?: boolean;
  note?: string;
}

interface WeeklyFlag {
  makeup?: boolean;
  overTarget?: boolean;
}

const pomodoroStyles: Record<PomodoroType, { label: string; description: string; badge: string }>
  = {
    try: {
      label: '嘗試',
      description: '第一次試試看，勇敢開始',
      badge: 'bg-amber-100 text-amber-800 border border-amber-200',
    },
    normal: {
      label: '一般',
      description: '穩定練習，慢慢累積',
      badge: 'bg-sky-100 text-sky-800 border border-sky-200',
    },
    awesome: {
      label: '太棒了',
      description: '超有成就感！',
      badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    },
    deep: {
      label: '超專注',
      description: '完全沉浸的番茄',
      badge: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    },
    helper: {
      label: '助人 / 補課',
      description: '幫助同學或補課時的番茄',
      badge: 'bg-pink-100 text-pink-800 border border-pink-200',
    },
  };

const timetable: TimetableDay[] = [
  { day: '星期一', mood: '好奇心冒險日', morning: ['自然探究', '閱讀時間'], afternoon: ['數學遊戲'], sticker: '🧪' },
  { day: '星期二', mood: '故事與音樂', morning: ['國語故事'], afternoon: ['音樂練習', '美術創作'], sticker: '🎵' },
  { day: '星期三', mood: '專注挑戰', morning: ['數學挑戰'], afternoon: ['自然觀察'], sticker: '🎯' },
  { day: '星期四', mood: '語文表達', morning: ['閱讀理解'], afternoon: ['英語對話'], sticker: '📚' },
  { day: '星期五', mood: '探索與分享', morning: ['科學小實驗'], afternoon: ['專題任務'], sticker: '🧭' },
];

const initialLogs: Record<string, SubjectLog[]> = {
  星期一: [
    {
      subject: '自然探究',
      slot: '早上',
      pomodoros: [
        { type: 'try', count: 1 },
        { type: 'normal', count: 2 },
      ],
      tasks: ['葉子觀察', '小小科學筆記'],
      note: '今天自己選了觀察題目，超棒！',
    },
    {
      subject: '數學遊戲',
      slot: '下午',
      pomodoros: [
        { type: 'awesome', count: 1 },
        { type: 'deep', count: 1 },
      ],
      tasks: ['分數配對遊戲'],
      isMakeup: true,
    },
  ],
  星期二: [
    {
      subject: '音樂練習',
      slot: '下午',
      pomodoros: [
        { type: 'normal', count: 2 },
        { type: 'helper', count: 1 },
      ],
      tasks: ['鋼琴彈奏', '和朋友合奏'],
      note: '一起練習的時候好有趣！',
    },
    {
      subject: '國語故事',
      slot: '早上',
      pomodoros: [
        { type: 'try', count: 1 },
        { type: 'awesome', count: 1 },
      ],
      tasks: ['故事重述'],
    },
  ],
  星期三: [
    {
      subject: '數學挑戰',
      slot: '早上',
      pomodoros: [
        { type: 'deep', count: 1 },
        { type: 'awesome', count: 1 },
      ],
      tasks: ['解題練習', '小隊討論'],
      note: '挑戰題完成！',
    },
  ],
  星期四: [
    {
      subject: '英語對話',
      slot: '下午',
      pomodoros: [
        { type: 'normal', count: 2 },
        { type: 'helper', count: 1 },
      ],
      tasks: ['對話練習', '小短劇'],
      isMakeup: true,
      note: '補課也順便幫助朋友背台詞',
    },
  ],
  星期五: [
    {
      subject: '科學小實驗',
      slot: '早上',
      pomodoros: [
        { type: 'try', count: 1 },
        { type: 'normal', count: 1 },
        { type: 'awesome', count: 1 },
      ],
      tasks: ['完成記錄表'],
    },
    {
      subject: '專題任務',
      slot: '下午',
      pomodoros: [
        { type: 'deep', count: 1 },
        { type: 'awesome', count: 1 },
        { type: 'helper', count: 1 },
      ],
      tasks: ['整理發表稿'],
      note: '跟夥伴一起準備，收穫滿滿',
    },
  ],
};

const weeklyFlags: Record<string, WeeklyFlag> = {
  數學遊戲: { overTarget: true },
  音樂練習: { makeup: true },
  英語對話: { makeup: true },
};

const StudentSchedule: FC = () => {
  const [selectedDay, setSelectedDay] = useState<string>(timetable[0].day);
  const [dayLogs, setDayLogs] = useState<Record<string, SubjectLog[]>>(initialLogs);
  const [newLog, setNewLog] = useState({
    subject: '',
    slot: '早上' as StudySlot,
    type: 'normal' as PomodoroType,
    count: 1,
    tasks: '',
    isMakeup: false,
  });

  const currentLogs = dayLogs[selectedDay] ?? [];

  const weeklySubjects = useMemo(() => {
    const totals: Record<string, { subject: string; totals: Record<PomodoroType, number>; total: number; flags: WeeklyFlag }>
      = {};

    Object.values(dayLogs).forEach((logs) => {
      logs.forEach((log) => {
        if (!totals[log.subject]) {
          totals[log.subject] = {
            subject: log.subject,
            totals: { try: 0, normal: 0, awesome: 0, deep: 0, helper: 0 },
            total: 0,
            flags: weeklyFlags[log.subject] ?? {},
          };
        }

        log.pomodoros.forEach((pomo) => {
          totals[log.subject].totals[pomo.type] += pomo.count;
          totals[log.subject].total += pomo.count;
        });
      });
    });

    return Object.values(totals).sort((a, b) => b.total - a.total);
  }, [dayLogs]);

  const handleAddLog = () => {
    if (!newLog.subject.trim()) return;

    const tasks = newLog.tasks
      .split(',')
      .map((task) => task.trim())
      .filter(Boolean);

    const entry: SubjectLog = {
      subject: newLog.subject.trim(),
      slot: newLog.slot,
      pomodoros: [{ type: newLog.type, count: newLog.count }],
      tasks,
      isMakeup: newLog.isMakeup,
    };

    setDayLogs((prev) => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] ?? []), entry],
    }));

    setNewLog({ subject: '', slot: '早上' as StudySlot, type: 'normal' as PomodoroType, count: 1, tasks: '', isMakeup: false });
  };

  return (
    <PageLayout title="課表">
      <div className="space-y-8">
        <section className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl p-6 shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide opacity-90">小朋友版課表</p>
              <h2 className="text-2xl font-bold mt-1">早上 / 下午想做的科目先排好</h2>
              <p className="text-indigo-100 mt-2">每個時段可以多選科目，沒有也沒關係，重點是開心學習！</p>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="w-10 h-10" />
              <div>
                <p className="text-sm opacity-90">目前選擇</p>
                <p className="text-lg font-semibold">{selectedDay}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
            {timetable.map((day) => (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={`text-left rounded-lg p-4 transition shadow ${
                  selectedDay === day.day ? 'bg-white text-indigo-900' : 'bg-white/10 text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{day.day}</span>
                  <span className="text-xl" aria-hidden>{day.sticker}</span>
                </div>
                <p className="mt-1 text-xs opacity-80">{day.mood}</p>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5" />
                    <span className="font-semibold">早上:</span>
                    <span className="truncate">{day.morning.join('、') || '自由安排'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 className="w-3.5 h-3.5" />
                    <span className="font-semibold">下午:</span>
                    <span className="truncate">{day.afternoon.join('、') || '自由安排'}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{selectedDay} 的日常紀錄</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">記錄做了哪些科目 / 番茄數</span>
            </div>

            <div className="space-y-3">
              {currentLogs.length === 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                  還沒有紀錄，點下面新增一筆吧！
                </div>
              )}

              {currentLogs.map((log, index) => (
                <div
                  key={`${log.subject}-${index}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <p className="font-semibold text-gray-900 dark:text-white">{log.subject}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                        {log.slot}
                      </span>
                      {log.isMakeup && (
                        <span className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-200">
                          補課
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Sparkles className="w-4 h-4" />
                      <span>
                        共 {log.pomodoros.reduce((sum, p) => sum + p.count, 0)} 顆番茄
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {log.pomodoros.map((pomo, idx) => (
                      <span
                        key={`${pomo.type}-${idx}`}
                        className={`text-xs px-2 py-1 rounded-full ${pomodoroStyles[pomo.type].badge}`}
                      >
                        {pomodoroStyles[pomo.type].label} × {pomo.count}
                      </span>
                    ))}
                  </div>

                  {log.tasks && log.tasks.length > 0 && (
                    <div className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                      <p className="font-medium flex items-center gap-2">
                        <NotebookPen className="w-4 h-4" /> 連結任務
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {log.tasks.map((task) => (
                          <span
                            key={task}
                            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs"
                          >
                            {task}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {log.note && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{log.note}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">新增今天的紀錄</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">科目</label>
                  <input
                    type="text"
                    value={newLog.subject}
                    onChange={(e) => setNewLog({ ...newLog, subject: e.target.value })}
                    placeholder="例如：數學遊戲"
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">時段</label>
                  <select
                    value={newLog.slot}
                    onChange={(e) => setNewLog({ ...newLog, slot: e.target.value as StudySlot })}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  >
                    <option value="早上">早上</option>
                    <option value="下午">下午</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">番茄類型</label>
                  <select
                    value={newLog.type}
                    onChange={(e) => setNewLog({ ...newLog, type: e.target.value as PomodoroType })}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  >
                    {Object.entries(pomodoroStyles).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">番茄顆數</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newLog.count}
                    onChange={(e) => setNewLog({ ...newLog, count: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">相關任務 (可選，多個以逗號分隔)</label>
                  <input
                    type="text"
                    value={newLog.tasks}
                    onChange={(e) => setNewLog({ ...newLog, tasks: e.target.value })}
                    placeholder="例如：完成練習本第 3-5 題, 整理發表稿"
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="makeup"
                    type="checkbox"
                    checked={newLog.isMakeup}
                    onChange={(e) => setNewLog({ ...newLog, isMakeup: e.target.checked })}
                    className="h-4 w-4 text-pink-600 rounded"
                  />
                  <label htmlFor="makeup" className="text-sm text-gray-700 dark:text-gray-300">這是補課紀錄</label>
                </div>
              </div>
              <button
                onClick={handleAddLog}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                新增紀錄
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">番茄的 5 種能量</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">讓每天的番茄不只是完成，更知道感覺如何</p>
              <div className="mt-3 space-y-2">
                {Object.entries(pomodoroStyles).map(([key, info]) => (
                  <div key={key} className="flex items-start gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${info.badge}`}>{info.label}</span>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{info.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> 補課與超過提醒 (每週)
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                如果是補課會有粉紅色標示，超過預期的努力則用紫色標示，週總覽時一眼就看懂。
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">本週番茄總覽</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {weeklySubjects.map((subject) => (
              <div
                key={subject.subject}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <p className="font-semibold text-gray-900 dark:text-white">{subject.subject}</p>
                    {subject.flags.makeup && (
                      <span className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-200">
                        補課
                      </span>
                    )}
                    {subject.flags.overTarget && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">
                        超過
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">總計 {subject.total} 顆番茄</span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {Object.entries(subject.totals).map(([key, value]) => (
                    <div key={key} className="p-2 rounded-md bg-gray-50 dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-200">
                      <p className="font-semibold">{pomodoroStyles[key as PomodoroType].label}</p>
                      <p className="mt-1 text-lg font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default StudentSchedule;
