import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import TaskList from '../../components/tasks/TaskList';
import { Task } from '../../../../../packages/types/src/task';
import { Plus, Filter } from 'lucide-react';

const mockTasks: Task[] = [
  {
    id: '1',
    title: '寫一篇遊記',
    description: '選擇一個最近去過的地方，寫一篇遊記',
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    status: 'pending',
    subject: '國語',
    priority: 'high',
    assignedBy: '陳老師',
    progress: 0,
    subjectId: 'chinese',
    creatorId: 'teacher1',
    required: true,
    students: []
  },
  {
    id: '2',
    title: '水三態的科學實驗',
    description: '準備水三態實驗的報告',
    endDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
    status: 'pending',
    subject: '自然',
    priority: 'medium',
    assignedBy: '林老師',
    progress: 0,
    subjectId: 'science',
    creatorId: 'teacher2',
    required: true,
    students: []
  },
  {
    id: '3',
    title: '閱讀課外讀物 - 科學家',
    description: '閱讀科學家的傳記並做筆記',
    endDate: new Date().toISOString(),
    status: 'completed',
    subject: '自然',
    priority: 'low',
    assignedBy: '林老師',
    progress: 100,
    subjectId: 'science',
    creatorId: 'teacher2',
    required: false,
    students: []
  },
  {
    id: '4',
    title: '英語單字測驗準備',
    description: '準備下週的英語單字測驗，範圍：Unit 5-7',
    endDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    status: 'pending',
    subject: '英語',
    priority: 'high',
    assignedBy: '王老師',
    progress: 0,
    subjectId: 'english',
    creatorId: 'teacher3',
    required: true,
    students: []
  },
  {
    id: '5',
    title: '數學練習題',
    description: '完成分數除法練習題',
    endDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    status: 'pending',
    subject: '數學',
    priority: 'medium',
    assignedBy: '李老師',
    progress: 0,
    subjectId: 'math',
    creatorId: 'teacher4',
    required: true,
    students: []
  }
];

const StudentTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [groupBy, setGroupBy] = useState<'subject' | 'dueDate' | 'priority' | 'none'>('dueDate');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskToggle = (taskId: string, status: any) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status }
        : task
    ));
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <PageLayout title="任務列表">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
              className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="none">不分組</option>
              <option value="subject">依科目</option>
              <option value="dueDate">依到期日</option>
              <option value="priority">依優先順序</option>
            </select>
            
            <button
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              篩選
            </button>
          </div>
          
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增任務
          </button>
        </div>

        <TaskList
          tasks={tasks}
          onStatusChange={handleTaskToggle}
          onTaskSelect={handleTaskSelect}
          groupBy={groupBy}
        />
      </div>
    </PageLayout>
  );
};

export default StudentTasks;