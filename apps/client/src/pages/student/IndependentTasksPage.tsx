import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Play, Pause, MoreHorizontal } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useAsyncOperation } from '../../utils/errorHandler';
import type { Task } from '../../types/goal';

interface TaskFormData {
  title: string;
  description: string;
  task_type: 'single' | 'accumulative' | 'count' | 'check_in' | 'duration';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const IndependentTasksPage: React.FC = () => {
  const {
    createIndependentTask,
    getMyIndependentTasks,
    getCollaborativeIndependentTasks,
    markTaskCompleted,
    markTaskInProgress,
    markTaskTodo,
    getTaskById
  } = useTaskStore();

  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [collaborativeTasks, setCollaborativeTasks] = useState<Task[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    task_type: 'single',
    priority: 'medium'
  });

  const { wrapAsync } = useAsyncOperation();

  // 載入獨立任務
  const loadTasks = wrapAsync(async () => {
    const [myTasksData, collaborativeTasksData] = await Promise.all([
      getMyIndependentTasks(),
      getCollaborativeIndependentTasks()
    ]);
    setMyTasks(myTasksData);
    setCollaborativeTasks(collaborativeTasksData);
  });

  useEffect(() => {
    loadTasks();
  }, []);

  // 創建新任務
  const handleCreateTask = wrapAsync(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newTask = await createIndependentTask({
      title: formData.title,
      description: formData.description,
      task_type: formData.task_type,
      priority: formData.priority,
      status: 'todo'
    });

    if (newTask) {
      setFormData({
        title: '',
        description: '',
        task_type: 'single',
        priority: 'medium'
      });
      setShowCreateForm(false);
      await loadTasks(); // 重新載入任務列表
    }
  });

  // 更新任務狀態
  const handleTaskStatusChange = wrapAsync(async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    const task = getTaskById(taskId);
    if (!task) return;

    switch (newStatus) {
      case 'done':
        await markTaskCompleted(taskId, task.version);
        break;
      case 'in_progress':
        await markTaskInProgress(taskId, task.version);
        break;
      case 'todo':
        await markTaskTodo(taskId, task.version);
        break;
    }
    await loadTasks();
  });

  const TaskCard: React.FC<{ task: Task; isCollaborative?: boolean }> = ({ task, isCollaborative = false }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'todo': return 'bg-gray-100 text-gray-800';
        case 'in_progress': return 'bg-blue-100 text-blue-800';
        case 'done': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'urgent': return 'border-l-red-500';
        case 'high': return 'border-l-orange-500';
        case 'medium': return 'border-l-yellow-500';
        case 'low': return 'border-l-green-500';
        default: return 'border-l-gray-500';
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${getPriorityColor(task.priority)} hover:shadow-xl transition-all duration-300`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
            {task.description && (
              <p className="text-gray-600 text-sm mb-3">{task.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {task.status === 'todo' ? '待辦' : task.status === 'in_progress' ? '進行中' : '已完成'}
              </span>
              <span className="text-xs text-gray-500">
                {task.task_type === 'single' ? '單次任務' : 
                 task.task_type === 'count' ? '計數任務' :
                 task.task_type === 'check_in' ? '打卡任務' : task.task_type}
              </span>
              {isCollaborative && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  協作任務
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {task.status === 'todo' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTaskStatusChange(task.id, 'in_progress')}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="開始任務"
              >
                <Play size={16} />
              </motion.button>
            )}
            {task.status === 'in_progress' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTaskStatusChange(task.id, 'done')}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  title="完成任務"
                >
                  <Check size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTaskStatusChange(task.id, 'todo')}
                  className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  title="暫停任務"
                >
                  <Pause size={16} />
                </motion.button>
              </>
            )}
            {task.status === 'done' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTaskStatusChange(task.id, 'todo')}
                className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                title="重新啟動"
              >
                <Pause size={16} />
              </motion.button>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          創建於 {new Date(task.created_at).toLocaleDateString('zh-TW')}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                獨立任務
              </h1>
              <p className="text-gray-600 mt-2">管理不屬於特定主題的個人任務</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Plus size={20} />
              新增任務
            </motion.button>
          </div>
        </motion.div>

        {/* 創建任務表單 */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">創建新任務</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    任務標題 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="輸入任務標題..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    任務描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="輸入任務描述..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    任務類型
                  </label>
                  <select
                    value={formData.task_type}
                    onChange={(e) => setFormData({ ...formData, task_type: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="single">單次任務</option>
                    <option value="count">計數任務</option>
                    <option value="check_in">打卡任務</option>
                    <option value="accumulative">累積任務</option>
                    <option value="duration">時間任務</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優先級
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">緊急</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    創建任務
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* 任務列表 */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 我的任務 */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              我的任務
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                {myTasks.length}
              </span>
            </h2>
            <div className="space-y-4">
              {myTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>還沒有獨立任務</p>
                  <p className="text-sm mt-2">點擊「新增任務」開始創建</p>
                </div>
              ) : (
                myTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </motion.section>

          {/* 協作任務 */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              協作任務
              <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm">
                {collaborativeTasks.length}
              </span>
            </h2>
            <div className="space-y-4">
              {collaborativeTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>沒有協作任務</p>
                  <p className="text-sm mt-2">當其他人邀請你協作時會顯示在這裡</p>
                </div>
              ) : (
                collaborativeTasks.map((task) => (
                  <TaskCard key={task.id} task={task} isCollaborative />
                ))
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default IndependentTasksPage; 