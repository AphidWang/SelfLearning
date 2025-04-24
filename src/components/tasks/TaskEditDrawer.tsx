import React, { useState, useEffect } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { X, Plus, Trash2 } from 'lucide-react';
import { Task, Resource } from '../../types/task';

interface TaskEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const TaskEditDrawer: React.FC<TaskEditDrawerProps> = ({ isOpen, onClose, task }) => {
  const { updateTask } = usePlanner();
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState<Resource>({
    id: '',
    title: '',
    url: '',
    type: 'link'
  });

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      setResources(task.resources || []);
    }
  }, [task]);

  if (!isOpen || !editedTask) return null;

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const updatedTask: Task = {
      ...editedTask,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      subject: formData.get('subject') as string,
      priority: formData.get('priority') as Task['priority'],
      startDate: new Date(formData.get('startDate') as string),
      endDate: new Date(formData.get('endDate') as string),
      resources
    };

    updateTask(updatedTask);
    onClose();
  };

  const handleAddResource = () => {
    if (newResource.title && newResource.url) {
      setResources((prev: Resource[]) => [...prev, { ...newResource, id: Date.now().toString() }]);
      setNewResource({
        id: '',
        title: '',
        url: '',
        type: 'link'
      });
    }
  };

  const handleRemoveResource = (resourceId: string) => {
    setResources((prev: Resource[]) => prev.filter(r => r.id !== resourceId));
  };

  const handleResourceChange = (field: keyof Resource, value: string) => {
    setNewResource(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl">
        <form onSubmit={handleSave} className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              編輯任務
            </h2>
            <button type="button" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  標題
                </label>
                <input
                  name="title"
                  defaultValue={editedTask.title}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  描述
                </label>
                <textarea
                  name="description"
                  defaultValue={editedTask.description}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    科目
                  </label>
                  <input
                    name="subject"
                    defaultValue={editedTask.subject}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    優先級
                  </label>
                  <select
                    name="priority"
                    defaultValue={editedTask.priority}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    開始日期
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={editedTask.startDate.toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    結束日期
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={editedTask.endDate.toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* 資源列表 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                學習資源
              </h3>
              
              <div className="space-y-2">
                {resources.map((resource: Resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                  >
                    <div>
                      <div className="font-medium text-sm">{resource.title}</div>
                      <div className="text-xs text-gray-500">{resource.url}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(resource.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 新增資源表單 */}
              <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    資源標題
                  </label>
                  <input
                    value={newResource.title}
                    onChange={(e) => handleResourceChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    資源連結
                  </label>
                  <input
                    value={newResource.url}
                    onChange={(e) => handleResourceChange('url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    資源類型
                  </label>
                  <select
                    value={newResource.type}
                    onChange={(e) => handleResourceChange('type', e.target.value as Resource['type'])}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  >
                    <option value="video">影片</option>
                    <option value="document">文件</option>
                    <option value="link">連結</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddResource}
                  className="w-full flex items-center justify-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  新增資源
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEditDrawer; 