import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { Task } from '../../../../../packages/types/src/task';
import { X, Users, Calendar, AlertTriangle, Check } from 'lucide-react';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekId: number;
  tasks: Task[];
}

const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  onClose,
  weekId,
  tasks
}) => {
  const { assignTasksToStudents } = usePlanner();
  const students: any[] = []; // 暫時移除 students 依賴
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (selectedStudents.length === 0) return;

    try {
      setIsAssigning(true);
      await assignTasksToStudents({
        weekId,
        taskIds: tasks.map(t => t.id),
        studentIds: selectedStudents
      });
      onClose();
    } catch (error) {
      console.error('Failed to assign tasks:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            分配第 {weekId} 週任務
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 學生選擇 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                選擇學生
              </h3>
              <button
                onClick={() => {
                  setSelectedStudents(prev => 
                    prev.length === students.length ? [] : students.map(s => s.id)
                  );
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {selectedStudents.length === students.length ? '取消全選' : '全選'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {students.map(student => (
                <div
                  key={student.id}
                  onClick={() => {
                    setSelectedStudents(prev => 
                      prev.includes(student.id)
                        ? prev.filter(id => id !== student.id)
                        : [...prev, student.id]
                    );
                  }}
                  className={`
                    flex items-center p-3 rounded-lg border cursor-pointer
                    ${selectedStudents.includes(student.id)
                      ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30'
                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    }
                  `}
                >
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      已完成: {student.completedTasks}/{student.totalTasks}
                    </div>
                  </div>
                  {selectedStudents.includes(student.id) && (
                    <Check className="w-4 h-4 ml-auto text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 任務預覽 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              任務預覽
            </h3>
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-sm text-gray-900 dark:text-white">
                  {task.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  截止日期: {new Date(task.endDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedStudents.length === 0 || isAssigning}
            className="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isAssigning ? '處理中...' : '確認分配'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTaskModal; 