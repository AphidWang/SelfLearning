import React, { useEffect } from 'react';
import { useTopicStore } from '../../store/topicStore';
import type { Task } from '../../types/goal';
import { useTaskStore } from '../../store/taskStore';

interface CurriculumDialogProps {
  topicId: string;
  goalId: string;
  onClose: () => void;
}

const CurriculumDialog: React.FC<CurriculumDialogProps> = ({ topicId, goalId, onClose }) => {
  const { topics  } = useTopicStore();
  const { updateTask } = useTaskStore();
  const topic = topics.find(t => t.id === topicId);
  const goal = topic?.goals?.find(g => g.id === goalId);

  useEffect(() => {
    // 確保有初始化主題數據
    if (topics.length === 0) {
      // 這裡可能需要調用 fetchTopics()，但要確認組件的上下文
    }
  }, [topics]);

  if (!goal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
          <p className="mb-4 text-gray-700 dark:text-gray-200">找不到對應的課綱</p>
          <button
            onClick={onClose}
            className="mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md"
          >
            關閉
          </button>
        </div>
      </div>
    );
  }

  const toggleTaskStatus = async (taskId: string, task: Task) => {
    try {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      const updatedTask = await updateTask(taskId, task.version, {
        ...task,
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
      });
      if (!updatedTask) {
        throw new Error('Failed to update task status');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const editTaskTitle = (taskId: string, task: Task) => {
    const title = window.prompt('修改任務名稱', task.title);
    if (title !== null && title !== task.title) {
      updateTask(task.id, task.version, { ...task, title });
    }
  };

  const handleTaskUpdate = (taskId: string, taskVersion: number, updates: Partial<Task>) => {
    updateTask(taskId, taskVersion, updates);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 max-h-[80vh] overflow-y-auto w-full max-w-2xl p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{goal.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        {goal.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-6">{goal.description}</p>
        )}
        <div className="space-y-6">
          {goal.tasks?.map(task => (
            <div key={task.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={task.status === 'done'}
                    onChange={() => toggleTaskStatus(task.id, task)}
                  />
                  <span className={`text-sm ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>{task.title}</span>
                </div>
                <button
                  onClick={() => editTaskTitle(task.id, task)}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  編輯
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurriculumDialog;
