import React, { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, CheckCircle2, Clock3, HeartHandshake, Plus, Sparkles, SunMedium, Timer, Trophy } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';

type TimeSlot = 'morning' | 'afternoon';

type WeeklyPlan = {
  day: string;
  morning: string[];
  afternoon: string[];
};

type PomodoroType = {
  key: keyof PomodoroCounts;
  label: string;
  description: string;
  badgeClass: string;
};

type PomodoroCounts = {
  try: number;
  normal: number;
  awesome: number;
  focus: number;
  review: number;
};

type DailyPomodoroLog = {
  id: string;
  day: string;
  subject: string;
  pomodoros: PomodoroCounts;
  tasks: string[];
  isMakeup?: boolean;
  exceededPlan?: boolean;
};

const subjectColorMap: Record<string, string> = {
  國語: 'bg-amber-100 text-amber-800',
  數學: 'bg-blue-100 text-blue-800',
  英語: 'bg-indigo-100 text-indigo-800',
  自然: 'bg-emerald-100 text-emerald-800',
  社會: 'bg-orange-100 text-orange-800',
  藝術: 'bg-pink-100 text-pink-800',
  體育: 'bg-rose-100 text-rose-800',
  生活: 'bg-sky-100 text-sky-800',
};

const pomodoroTypes: PomodoroType[] = [
  {
    key: 'try',
    label: '嘗試番茄',
    description: '第一次動手做，勇敢試試看',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200'
  },
  {
    key: 'normal',
    label: '一般番茄',
    description: '穩穩進行，保持節奏',
    badgeClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200'
  },
  {
    key: 'awesome',
    label: '太棒了番茄',
    description: '超棒的專注力，表現亮眼',
    badgeClass: 'bg-purple-50 text-purple-800 border border-purple-200'
  },
  {
    key: 'focus',
    label: '超專注番茄',
    description: '完全沉浸，忘記時間',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200'
  },
  {
    key: 'review',
    label: '複習番茄',
    description: '回頭補課，讓學習更完整',
    badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200'
  }
];

const availableTasks = [
  { id: 't1', title: '寫一篇遊記' },
  { id: 't2', title: '數學練習卷 2 份' },
  { id: 't3', title: '英語口說錄音' },
  { id: 't4', title: '自然觀察記錄' }
];

const initialWeekPlan: WeeklyPlan[] = [
  { day: '週一', morning: ['國語'], afternoon: ['數學', '英語'] },
  { day: '週二', morning: ['自然'], afternoon: ['社會'] },
  { day: '週三', morning: ['數學'], afternoon: ['藝術'] },
  { day: '週四', morning: ['英語'], afternoon: ['體育'] },
  { day: '週五', morning: ['社會'], afternoon: ['國語'] },
  { day: '週六', morning: [], afternoon: ['生活'] },
  { day: '週日', morning: [], afternoon: [] },
];

const initialDailyLogs: DailyPomodoroLog[] = [
  {
    id: 'log-1',
    day: '週一',
    subject: '國語',
    pomodoros: { try: 1, normal: 1, awesome: 1, focus: 0, review: 0 },
    tasks: ['t1'],
    exceededPlan: true
  },
  {
    id: 'log-2',
    day: '週二',
    subject: '數學',
    pomodoros: { try: 0, normal: 2, awesome: 0, focus: 1, review: 1 },
    tasks: ['t2'],
    isMakeup: true
  }
];

const StudentSchedule: React.FC = () => {
  const [weekPlan, setWeekPlan] = useState<WeeklyPlan[]>(initialWeekPlan);
  const [dailyLogs, setDailyLogs] = useState<DailyPomodoroLog[]>(initialDailyLogs);
  const [selectedDay, setSelectedDay] = useState('週一');
  const [newSubjectSelection, setNewSubjectSelection] = useState<{ day: string; slot: TimeSlot; subject: string }>(
    { day: '週一', slot: 'morning', subject: '國語' }
  );
  const [pomodoroForm, setPomodoroForm] = useState<PomodoroCounts>({ try: 1, normal: 1, awesome: 0, focus: 0, review: 0 });
  const [logSubject, setLogSubject] = useState('國語');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isMakeup, setIsMakeup] = useState(false);
  const [exceededPlan, setExceededPlan] = useState(false);

  const handleAddSubject = () => {
    setWeekPlan(prev => prev.map(plan => {
      if (plan.day !== newSubjectSelection.day) return plan;
      const updated = { ...plan };
      const slotSubjects = [...updated[newSubjectSelection.slot]] as string[];
      if (!slotSubjects.includes(newSubjectSelection.subject)) {
        slotSubjects.push(newSubjectSelection.subject);
      }
      updated[newSubjectSelection.slot] = slotSubjects;
      return updated;
    }));
  };

  const handlePomodoroChange = (key: keyof PomodoroCounts, value: number) => {
    setPomodoroForm(prev => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
  };

  const addDailyLog = () => {
    const newLog: DailyPomodoroLog = {
      id: `log-${Date.now()}`,
      day: selectedDay,
      subject: logSubject,
      pomodoros: pomodoroForm,
      tasks: selectedTasks,
      isMakeup,
      exceededPlan
    };
    setDailyLogs(prev => [...prev, newLog]);
    setPomodoroForm({ try: 1, normal: 1, awesome: 0, focus: 0, review: 0 });
    setSelectedTasks([]);
    setIsMakeup(false);
    setExceededPlan(false);
  };

  const dailyLogsForDay = useMemo(() => dailyLogs.filter(log => log.day === selectedDay), [dailyLogs, selectedDay]);

  const weeklySummary = useMemo(() => {
    const summary: Record<string, { totals: PomodoroCounts; isMakeup?: boolean; exceeded?: boolean }> = {};
    dailyLogs.forEach(log => {
      if (!summary[log.subject]) {
        summary[log.subject] = {
          totals: { try: 0, normal: 0, awesome: 0, focus: 0, review: 0 },
          isMakeup: false,
          exceeded: false
        };
      }
      pomodoroTypes.forEach(type => {
        summary[log.subject].totals[type.key] += log.pomodoros[type.key];
      });
      summary[log.subject].isMakeup = summary[log.subject].isMakeup || !!log.isMakeup;
      summary[log.subject].exceeded = summary[log.subject].exceeded || !!log.exceededPlan;
    });
    return summary;
  }, [dailyLogs]);

  return (
    <PageLayout title="課表">
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-indigo-50 dark:border-gray-700/60">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-100">
                <SunMedium className="w-4 h-4" />
                適合小朋友的早午課表
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">一週簡易課表</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">早上 / 下午可以各放好幾個科目，輕鬆排好今天要玩的學習內容！</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 text-indigo-800 dark:text-indigo-100 flex items-center gap-3">
              <BookOpen className="w-5 h-5" />
              <div>
                <p className="text-sm font-semibold">新增一個科目</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <select
                    className="rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    value={newSubjectSelection.day}
                    onChange={(e) => setNewSubjectSelection(prev => ({ ...prev, day: e.target.value }))}
                  >
                    {weekPlan.map(plan => <option key={plan.day} value={plan.day}>{plan.day}</option>)}
                  </select>
                  <select
                    className="rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    value={newSubjectSelection.slot}
                    onChange={(e) => setNewSubjectSelection(prev => ({ ...prev, slot: e.target.value as TimeSlot }))}
                  >
                    <option value="morning">早上</option>
                    <option value="afternoon">下午</option>
                  </select>
                  <select
                    className="rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    value={newSubjectSelection.subject}
                    onChange={(e) => setNewSubjectSelection(prev => ({ ...prev, subject: e.target.value }))}
                  >
                    {Object.keys(subjectColorMap).map(subject => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                  <button
                    onClick={handleAddSubject}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    放進課表
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekPlan.map(plan => (
              <div key={plan.day} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-indigo-500" />
                    {plan.day}
                  </h3>
                  {(plan.morning.length === 0 && plan.afternoon.length === 0) && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">自由日</span>
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">早上</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {plan.morning.length === 0 && <span className="text-xs text-gray-400">暫時沒有安排</span>}
                      {plan.morning.map(subject => (
                        <span key={subject} className={`px-2 py-1 rounded-full text-xs font-semibold ${subjectColorMap[subject] || 'bg-gray-100 text-gray-800'}`}>
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">下午</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {plan.afternoon.length === 0 && <span className="text-xs text-gray-400">暫時沒有安排</span>}
                      {plan.afternoon.map(subject => (
                        <span key={subject} className={`px-2 py-1 rounded-full text-xs font-semibold ${subjectColorMap[subject] || 'bg-gray-100 text-gray-800'}`}>
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-emerald-50 dark:border-gray-700/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-200 font-semibold flex items-center gap-2">
                  <Timer className="w-4 h-4" /> Day view
                </p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">今天的番茄紀錄</h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>番茄可以連結多個任務</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 items-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">選擇一天：</p>
              <div className="flex gap-2 flex-wrap">
                {weekPlan.map(plan => (
                  <button
                    key={plan.day}
                    onClick={() => setSelectedDay(plan.day)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${selectedDay === plan.day ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    {plan.day}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {dailyLogsForDay.length === 0 && (
                <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                  還沒有紀錄，試著幫 {selectedDay} 新增一個番茄吧！
                </div>
              )}
              {dailyLogsForDay.map(log => (
                <div key={log.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${subjectColorMap[log.subject] || 'bg-gray-100 text-gray-800'}`}>
                        {log.subject}
                      </div>
                      {log.isMakeup && (
                        <span className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-800">補課</span>
                      )}
                      {log.exceededPlan && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">超過計畫</span>
                      )}
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 items-center">
                      <Clock3 className="w-4 h-4" />
                      今天完成 {Object.values(log.pomodoros).reduce((acc, cur) => acc + cur, 0)} 顆番茄
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {pomodoroTypes.map(type => (
                      <span key={type.key} className={`px-3 py-1 rounded-full text-xs ${type.badgeClass}`}>
                        {type.label} × {log.pomodoros[type.key]}
                      </span>
                    ))}
                  </div>

                  {log.tasks.length > 0 && (
                    <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                      相關任務：{' '}
                      {log.tasks.map(taskId => availableTasks.find(task => task.id === taskId)?.title || taskId).join('、')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <HeartHandshake className="w-4 h-4 text-emerald-500" />
                新增今天的番茄紀錄
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">科目</label>
                  <select
                    className="w-full rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    value={logSubject}
                    onChange={(e) => setLogSubject(e.target.value)}
                  >
                    {Object.keys(subjectColorMap).map(subject => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">任務（選填，可多選）</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`px-3 py-1 rounded-full text-xs border ${selectedTasks.includes(task.id) ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-50' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                      >
                        {task.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {pomodoroTypes.map(type => (
                  <label key={type.key} className="flex flex-col text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    <span className="font-semibold text-gray-900 dark:text-white">{type.label}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{type.description}</span>
                    <input
                      type="number"
                      min={0}
                      value={pomodoroForm[type.key]}
                      onChange={(e) => handlePomodoroChange(type.key, Number(e.target.value))}
                      className="mt-2 rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <label className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={isMakeup} onChange={(e) => setIsMakeup(e.target.checked)} />
                  補課番茄
                </label>
                <label className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={exceededPlan} onChange={(e) => setExceededPlan(e.target.checked)} />
                  今天超過計畫
                </label>
              </div>

              <button
                onClick={addDailyLog}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4" />
                加入日常紀錄
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-purple-50 dark:border-gray-700/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-200 font-semibold flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> Week view
                </p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">每週番茄總覽</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <SunMedium className="w-4 h-4 text-amber-400" />
                <span>補課 / 超過計畫 會有不同標示</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {Object.keys(weeklySummary).length === 0 && (
                <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                  還沒有番茄紀錄，先在 Day view 填寫吧！
                </div>
              )}
              {Object.entries(weeklySummary).map(([subject, info]) => (
                <div key={subject} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${subjectColorMap[subject] || 'bg-gray-100 text-gray-800'}`}>
                        {subject}
                      </div>
                      {info.isMakeup && <span className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-800">本週有補課</span>}
                      {info.exceeded && <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">本週超過目標</span>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Timer className="w-4 h-4" />
                      {Object.values(info.totals).reduce((acc, cur) => acc + cur, 0)} 顆番茄
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {pomodoroTypes.map(type => (
                      <div key={type.key} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md ${type.badgeClass}`}>{type.label}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">× {info.totals[type.key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-50 text-sm flex gap-2 items-start">
                <Sparkles className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-semibold">番茄種類小幫手</p>
                  <p>五種番茄各自代表不同感覺：嘗試、一般、太棒了、超專注、複習，幫助你回想今天的狀態。</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-50 text-sm flex gap-2 items-start">
                <CalendarDays className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-semibold">補課 / 超過目標</p>
                  <p>勾選補課會在每週顯示不同顏色；今天比計畫多的番茄也會在週檢視加上「超過目標」的提醒。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default StudentSchedule;
