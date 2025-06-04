import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Circle } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';

interface TaskSidebarProps {
  taskId: string;
  onClose: () => void;
}

export const TaskSidebar: React.FC<TaskSidebarProps> = ({ taskId, onClose }) => {
  const { tasks, toggleTask } = useTaskStore();
  const task = tasks.find(t => t.id === taskId);

  if (!task) return null;

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      '地標': 'bg-green-100 border-l-green-500 text-green-800',
      '交通': 'bg-blue-100 border-l-blue-500 text-blue-800',
      '商圈': 'bg-yellow-100 border-l-yellow-500 text-yellow-800',
      '文化': 'bg-purple-100 border-l-purple-500 text-purple-800',
      '美食': 'bg-red-100 border-l-red-500 text-red-800',
    };
    
    return colors[subject] || 'bg-gray-100 border-l-gray-500 text-gray-800';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 w-80 h-full bg-white shadow-lg z-30 flex flex-col"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">景點詳情</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="關閉側邊欄"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className={`p-3 mb-4 rounded-md border-l-4 ${getSubjectColor(task.subject)}`}>
            <div className="font-bold text-lg">{task.label}</div>
            <div className="text-sm">{task.subject}</div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">景點介紹</h3>
            <p className="text-gray-700">
              {task.label === '台北101' && '台北101是台灣最高的建築物，也是世界知名的地標之一。'}
              {task.label === '台北車站' && '台北車站是台灣最大的交通樞紐，連接高鐵、台鐵和捷運。'}
              {task.label === '西門町' && '西門町是台北最熱鬧的商圈之一，充滿年輕活力與流行文化。'}
              {task.label === '信義商圈' && '信義商圈是台北最繁華的商業區，聚集了眾多百貨公司與精品店。'}
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">參觀狀態</h3>
            <div className="flex items-center">
              {task.completed ? (
                <CheckCircle className="text-green-500 mr-2" size={20} />
              ) : (
                <Circle className="text-gray-400 mr-2" size={20} />
              )}
              <span className={task.completed ? "text-green-600" : "text-gray-600"}>
                {task.completed ? "已參觀" : "未參觀"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t">
          <button
            onClick={() => toggleTask(taskId)}
            className={`w-full py-2 px-4 rounded-md transition-colors ${
              task.completed 
              ? "bg-yellow-500 hover:bg-yellow-600 text-white" 
              : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {task.completed ? "取消參觀" : "標記為已參觀"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}; 