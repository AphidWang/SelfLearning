import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Task, TaskStatus } from '../../types/goal';
import { 
  ChevronLeft, MessageSquare, Paperclip, 
  HelpCircle, CheckCircle, PlayCircle,
  Smile, Meh, Frown,
  Battery, BatteryMedium, BatteryLow,
  Target, Upload, PauseCircle
} from 'lucide-react';
import { useTopicStore } from '../../store/topicStore';

interface TaskDetailProps {
  task: Task;
  goalId: string;
  topicId: string;
  onBack: () => void;
  onHelpRequest: (taskId: string) => void;
}

type MoodLevel = 'very_good' | 'good' | 'neutral' | 'bad' | 'very_bad';
type EnergyLevel = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
type ChallengeLevel = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';

const moodLabels: Record<MoodLevel, string> = {
  very_good: '超開心',
  good: '快樂',
  neutral: '普通',
  bad: '不開心',
  very_bad: '很難過'
};

const energyLabels: Record<EnergyLevel, string> = {
  very_high: '充滿力量',
  high: '精神很好',
  medium: '還不錯',
  low: '有點累',
  very_low: '很疲憊'
};

const challengeLabels: Record<ChallengeLevel, string> = {
  very_high: '非常有挑戰',
  high: '很有挑戰',
  medium: '一般般',
  low: '還算輕鬆',
  very_low: '非常輕鬆'
};

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  goalId,
  topicId,
  onBack,
  onHelpRequest
}) => {
  const { updateTask } = useTopicStore();
  const [comment, setComment] = useState('');
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [challenge, setChallenge] = useState<ChallengeLevel | null>(null);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const statusButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusButtonRef.current && !statusButtonRef.current.contains(event.target as Node)) {
        setShowStatusOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (newStatus: TaskStatus) => {
    const updatedTask = {
      ...task,
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date().toISOString() : undefined
    };
    updateTask(topicId, goalId, task.id, updatedTask);
  };

  const handleFieldUpdate = (field: keyof Task, value: any) => {
    const updatedTask = { ...task, [field]: value };
    updateTask(topicId, goalId, task.id, updatedTask);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      {/* 頂部導航欄 */}
      <div className="flex items-center p-4 border-b">
        <button
          onClick={onBack}
          className="mr-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="返回"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold flex-1 text-center">{task.title}</h2>
      </div>

      {/* 內容區域 - 可滾動 */}
      <div className="flex-1 overflow-auto">
        {/* 任務說明 */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">任務說明</h3>
          <p className="text-gray-700">{task.description}</p>
        </div>

        <div className="border-t border-gray-200" />

        {/* 我的紀錄 */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">我的紀錄</h3>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
              {/* 這裡放歷史紀錄列表 */}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // 上傳檔案
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="紀錄一下..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  // 發送紀錄
                  setComment('');
                }}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <MessageSquare size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* 底部固定區域 */}
        <div className="border-t border-gray-200">
          {/* 心情和能量追蹤 */}
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">今天的心情如何？</h3>
              <div className="flex justify-between">
                {(['very_bad', 'bad', 'neutral', 'good', 'very_good'] as MoodLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setMood(level)}
                    className={`w-16 p-2 rounded-full flex flex-col items-center gap-1 ${
                      mood === level 
                        ? level === 'very_bad' || level === 'bad' 
                          ? 'bg-red-100 text-red-700' 
                          : level === 'neutral'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {level === 'very_bad' && <Frown size={20} />}
                    {level === 'bad' && <Frown size={20} />}
                    {level === 'neutral' && <Meh size={20} />}
                    {level === 'good' && <Smile size={20} />}
                    {level === 'very_good' && <Smile size={20} />}
                    <span className="text-xs whitespace-nowrap">{moodLabels[level]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">現在的能量如何？</h3>
              <div className="flex justify-between">
                {(['very_low', 'low', 'medium', 'high', 'very_high'] as EnergyLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`w-16 p-2 rounded-full flex flex-col items-center gap-1 ${
                      energy === level 
                        ? level === 'very_low' || level === 'low' 
                          ? 'bg-red-100 text-red-700' 
                          : level === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {level === 'very_low' && <BatteryLow size={20} />}
                    {level === 'low' && <BatteryLow size={20} />}
                    {level === 'medium' && <BatteryMedium size={20} />}
                    {level === 'high' && <Battery size={20} />}
                    {level === 'very_high' && <Battery size={20} />}
                    <span className="text-xs whitespace-nowrap">{energyLabels[level]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">任務有挑戰嗎？</h3>
              <div className="flex justify-between">
                {(['very_low', 'low', 'medium', 'high', 'very_high'] as ChallengeLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setChallenge(level)}
                    className={`w-16 p-2 rounded-full flex flex-col items-center gap-1 ${
                      challenge === level 
                        ? level === 'very_low' 
                          ? 'bg-blue-50 text-blue-700' 
                          : level === 'low'
                          ? 'bg-blue-100 text-blue-700'
                          : level === 'medium'
                          ? 'bg-indigo-100 text-indigo-700'
                          : level === 'high'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-purple-200 text-purple-700'
                        : 'text-gray-400'
                    }`}
                  >
                    <Target size={20} />
                    <span className="text-xs whitespace-nowrap">{challengeLabels[level]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 狀態按鈕 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="relative" ref={statusButtonRef}>
                <button
                  onClick={() => setShowStatusOptions(!showStatusOptions)}
                  className="px-6 py-2 rounded-full text-white transition-colors flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                >
                  <PlayCircle size={20} />
                  進行中
                </button>
                
                {showStatusOptions && (
                  <div className="absolute bottom-full right-0 mb-2 space-y-2">
                    <button
                      onClick={() => handleStatusChange('todo')}
                      className="w-full px-6 py-2 bg-gradient-to-r from-slate-400 to-gray-500 text-white rounded-full hover:from-slate-500 hover:to-gray-600 transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      <PauseCircle size={20} />
                      暫停
                    </button>
                    <button
                      onClick={() => handleStatusChange('in_progress')}
                      className="w-full px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      <PlayCircle size={20} />
                      進行中
                    </button>
                    <button
                      onClick={() => handleStatusChange('done')}
                      className="w-full px-6 py-2 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 text-white rounded-full hover:from-emerald-500 hover:via-green-600 hover:to-teal-600 transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      <CheckCircle size={20} />
                      完成
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 