import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Smile, Meh, Frown, X } from 'lucide-react';
import { subjects } from '../../styles/tokens';

const mockData = [
  {
    date: '2024/06/10',
    weekday: '一',
    tasks: [
      { id: 't1', name: '完成數學作業', subject: '數學' },
      { id: 't2', name: '閱讀科學故事', subject: '自然' }
    ],
    mood: 'happy',
    moodLabel: '很開心',
    phrases: '我很有成就感，今天進步了，學到新東西！',
    isHoliday: false
  },
  {
    date: '2024/06/11',
    weekday: '二',
    tasks: [
      { id: 't3', name: '寫一篇作文', subject: '國語' }
    ],
    mood: 'neutral',
    moodLabel: '普通',
    phrases: '有點累，但還可以。',
    isHoliday: false
  },
  {
    date: '2024/06/12',
    weekday: '三',
    tasks: [],
    mood: 'happy',
    phrases: '',
    isHoliday: true
  },
  {
    date: '2024/06/13',
    weekday: '四',
    tasks: [
      { id: 't4', name: '完成英語單字卡', subject: '英語' },
      { id: 't5', name: '畫一張圖', subject: '藝術' }
    ],
    mood: 'sad',
    moodLabel: '有點低落',
    phrases: '下雨天心情不太好...',
    isHoliday: false
  },
  {
    date: '2024/06/14',
    weekday: '五',
    tasks: [],
    mood: 'neutral',
    moodLabel: '普通',
    phrases: '',
    isHoliday: false
  }
];

const moodIcon = {
  happy: <Smile className="h-7 w-7 text-yellow-500" />,
  neutral: <Meh className="h-7 w-7 text-gray-400" />,
  sad: <Frown className="h-7 w-7 text-blue-400" />
};

// 小知識/互動話語 mock
const funFacts = [
  '你知道嗎？貓頭鷹晚上看得比白天還清楚！',
  '今天有什麼新發現嗎？記得和家人分享喔！',
  '阿嬤說：休息一下，腦袋會更靈光！',
  '小提醒：多喝水，保持好精神！',
  '你有沒有最喜歡的課？下次可以寫下來！'
];
function getRandomFact() {
  return funFacts[Math.floor(Math.random() * funFacts.length)];
}

export const DailyReviewCarousel: React.FC<{ className?: string; onClose?: () => void }> = ({ className = "fixed top-8 left-1/2 -translate-x-1/2 z-50 w-[440px] max-w-full", onClose }) => {
  const [index, setIndex] = useState(0);
  const day = mockData[index];

  return (
    <div className={`${className} w-[440px] max-w-full`}>
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
        {/* 右上角 X 按鈕 */}
        {onClose && (
          <button
            className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onClose}
            aria-label="關閉"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
        {/* 日期＋左右切換 */}
        <div className="flex items-center justify-between mb-4">
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="前一天"
          >
            <ChevronLeft size={28} />
          </button>
          <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300 select-none">
            {day.date}（週{day.weekday}）
          </span>
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
            onClick={() => setIndex(i => Math.min(mockData.length - 1, i + 1))}
            disabled={index === mockData.length - 1}
            aria-label="後一天"
          >
            <ChevronRight size={28} />
          </button>
        </div>

        {/* 成就/休息提示（已移除主標題和 emoji） */}
        {day.tasks.length === 0 && (
          <div className="flex items-center justify-center h-28 my-2">
            <span className="text-lg font-bold text-green-700 dark:text-green-200 text-center">
              {day.isHoliday
                ? '休息日! 有去哪裡玩嗎?'
                : '進行一半的任務也可以記錄下來喔！'}
            </span>
          </div>
        )}

        {/* 任務列表 */}
        {day.tasks.length > 0 && (
          <ul className="space-y-2 mt-1 mb-2 h-28 flex flex-col justify-center">
            {day.tasks.map(task => {
              const style = subjects.getSubjectStyle(task.subject);
              return (
                <li key={task.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg leading-relaxed shadow-sm`} style={{ background: `${style.gradient}10` }}>
                  <span className={`w-2 h-2 rounded-full`} style={{ background: style.accent }} />
                  <span className="text-base font-medium text-gray-900 dark:text-white flex-1">{task.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${style.bg} ${style.text}`}>{task.subject}</span>
                </li>
              );
            })}
          </ul>
        )}

        {/* 情緒＋短語 or 小知識 */}
        <div className="flex items-center gap-3 mt-3 bg-blue-50 dark:bg-blue-600/30 rounded-xl px-4 py-3">
          {day.phrases ? (
            <>
              <div className="flex-shrink-0 flex flex-col items-center min-w-[56px]">
                {moodIcon[day.mood as keyof typeof moodIcon]}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-1">{day.moodLabel}</span>
              </div>
              <div className="flex-1 text-base text-gray-700 dark:text-gray-100 whitespace-pre-line break-words bg-transparent rounded-lg px-2 py-1 leading-relaxed">
                {day.phrases}
              </div>
            </>
          ) : (
            <>
              <div className="flex-shrink-0 flex flex-col items-center min-w-[56px]">
                <span className="text-3xl">🦉</span>
                <span className="text-xs text-gray-400 mt-1">小知識</span>
              </div>
              <div className="flex-1 text-base text-gray-700 dark:text-gray-100 whitespace-pre-line break-words bg-transparent rounded-lg px-2 py-1 leading-relaxed">
                {getRandomFact()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 