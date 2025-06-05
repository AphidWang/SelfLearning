import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Task } from '../../types/goal';
import { 
  ChevronLeft, MessageSquare, Paperclip, 
  HelpCircle, CheckCircle, PlayCircle,
  Smile, Meh, Frown,
  Battery, BatteryMedium, BatteryLow,
  Target
} from 'lucide-react';

interface TaskDetailProps {
  task: Task;
  onBack: () => void;
  onStatusChange: (taskId: string, status: 'in_progress' | 'completed') => void;
  onHelpRequest: (taskId: string) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  onBack,
  onStatusChange,
  onHelpRequest
}) => {
  const [comment, setComment] = useState('');
  const [mood, setMood] = useState<'good' | 'neutral' | 'bad'>('neutral');
  const [energy, setEnergy] = useState<'high' | 'medium' | 'low'>('medium');
  const [challenge, setChallenge] = useState<'high' | 'medium' | 'low'>('medium');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
      {/* 標題和返回按鈕 */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
      </div>

      {/* 任務狀態 */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => onStatusChange(task.id, 'in_progress')}
          className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
        >
          <PlayCircle size={20} className="mr-2" />
          進行中
        </button>
        <button
          onClick={() => onStatusChange(task.id, 'completed')}
          className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
        >
          <CheckCircle size={20} className="mr-2" />
          完成
        </button>
      </div>

      {/* 心情和能量追蹤 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">心情</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setMood('good')}
              className={`p-2 rounded-full ${mood === 'good' ? 'bg-green-100 text-green-700' : 'text-gray-400'}`}
            >
              <Smile size={20} />
            </button>
            <button
              onClick={() => setMood('neutral')}
              className={`p-2 rounded-full ${mood === 'neutral' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400'}`}
            >
              <Meh size={20} />
            </button>
            <button
              onClick={() => setMood('bad')}
              className={`p-2 rounded-full ${mood === 'bad' ? 'bg-red-100 text-red-700' : 'text-gray-400'}`}
            >
              <Frown size={20} />
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">能量</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setEnergy('high')}
              className={`p-2 rounded-full ${energy === 'high' ? 'bg-green-100 text-green-700' : 'text-gray-400'}`}
            >
              <Battery size={20} />
            </button>
            <button
              onClick={() => setEnergy('medium')}
              className={`p-2 rounded-full ${energy === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400'}`}
            >
              <BatteryMedium size={20} />
            </button>
            <button
              onClick={() => setEnergy('low')}
              className={`p-2 rounded-full ${energy === 'low' ? 'bg-red-100 text-red-700' : 'text-gray-400'}`}
            >
              <BatteryLow size={20} />
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">挑戰度</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setChallenge('high')}
              className={`p-2 rounded-full ${challenge === 'high' ? 'bg-red-100 text-red-700' : 'text-gray-400'}`}
            >
              <Target size={20} />
            </button>
            <button
              onClick={() => setChallenge('medium')}
              className={`p-2 rounded-full ${challenge === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400'}`}
            >
              <Target size={20} />
            </button>
            <button
              onClick={() => setChallenge('low')}
              className={`p-2 rounded-full ${challenge === 'low' ? 'bg-green-100 text-green-700' : 'text-gray-400'}`}
            >
              <Target size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 留言區 */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
          {/* 這裡放留言列表 */}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="輸入留言..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => {
              // 發送留言
              setComment('');
            }}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </div>

      {/* 底部按鈕 */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => {
            // 上傳附件
          }}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Paperclip size={20} className="mr-2" />
          上傳附件
        </button>
        <button
          onClick={() => onHelpRequest(task.id)}
          className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <HelpCircle size={20} className="mr-2" />
          請求協助
        </button>
      </div>
    </div>
  );
}; 