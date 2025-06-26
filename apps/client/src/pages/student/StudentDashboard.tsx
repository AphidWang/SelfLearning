import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Calendar from '../../components/calendar/Calendar';
import { Task } from '../../components/tasks/TaskList';
import ProgressChart from '../../components/progress/ProgressChart';
import { Check, BookOpen, Clock, FileText, Layers, Search, Plus } from 'lucide-react';
import ChatModule from '../../components/chat/ChatModule';
import { TopicTemplateBrowser } from '../../components/template/TopicTemplateBrowser';

// Mock data for demonstration
const todayEvents = [
  {
    id: '1',
    title: '國語課',
    date: new Date(),
    startTime: '10:30',
    endTime: '12:00',
    category: '國語',
    color: 'indigo'
  },
  {
    id: '2',
    title: '自然科學',
    date: new Date(),
    startTime: '13:00',
    endTime: '14:30',
    category: '自然',
    color: 'green'
  }
];

const upcomingTasks: Task[] = [
  {
    id: '1',
    title: '寫一篇遊記',
    description: '選擇一個最近去過的地方，寫一篇遊記',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    completed: false,
    subject: '國語',
    priority: 'high',
    assignedBy: '陳老師'
  },
  {
    id: '2',
    title: '水三態的科學實驗',
    description: '準備水三態實驗的報告',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    completed: false,
    subject: '自然',
    priority: 'medium',
    assignedBy: '林老師'
  },
  {
    id: '3',
    title: '閱讀課外讀物 - 科學家',
    description: '閱讀科學家的傳記並做筆記',
    dueDate: new Date(),
    completed: true,
    subject: '自然',
    priority: 'low',
    assignedBy: '林老師'
  }
];

const progressData = [
  { subject: '國語', progress: 38, color: '#4F46E5' },
  { subject: '數學', progress: 55, color: '#0EA5E9' },
  { subject: '英語', progress: 47, color: '#F97316' },
  { subject: '自然', progress: 62, color: '#10B981' },
  { subject: '社會', progress: 41, color: '#8B5CF6' }
];

const StudentDashboard: React.FC = () => {
  const [tasks, setTasks] = React.useState<Task[]>(upcomingTasks);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);

  const handleTaskToggle = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed } 
        : task
    ));
  };

  return (
    <PageLayout title="學生儀表板">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 快速開始學習 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              快速開始學習
            </h2>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium mb-2">開始新的學習主題</h3>
                  <p className="text-indigo-100 mb-4">
                    從課程模板庫選擇一個模板，開始您的學習旅程
                  </p>
                  <button
                    onClick={() => setShowTemplateBrowser(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <Layers className="w-4 h-4" />
                    瀏覽課程模板
                  </button>
                </div>
                <div className="hidden md:block">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              今日學習規劃
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {todayEvents.map((event, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4"
                  style={{ borderLeftColor: event.color === 'indigo' ? '#4F46E5' : '#10B981' }}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900 dark:text-white">{event.title}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    {index === 0 ? (
                      <>
                        <div className="flex items-center">
                          <div className="flex items-center">
                            <Check size={16} className="text-green-500 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-300 line-through">課文閱讀</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="h-4 w-4 border border-gray-300 dark:border-gray-600 rounded mr-2"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">寫一篇遊記 (1/3)</span>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          <strong>進度規劃:</strong> 第六課, 第七課
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <Check size={16} className="text-green-500 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 line-through">閱讀課外讀物 - 科學家</span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-4 w-4 border border-gray-300 dark:border-gray-600 rounded mr-2"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">水三態的科學實驗</span>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          <strong>進度紀錄:</strong> 《居禮夫人傳》, 已閱讀 60 頁
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                待完成任務
              </h2>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                查看全部
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.filter(task => !task.completed).slice(0, 3).map((task, index) => (
                <div key={index} className="p-4 flex items-start">
                  <button
                    className="mt-0.5 mr-3 focus:outline-none"
                    onClick={() => handleTaskToggle(task.id)}
                  >
                    <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                      <span 
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === 'high' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                            : task.priority === 'medium'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}
                      >
                        {task.priority === 'high' ? '優先' : task.priority === 'medium' ? '一般' : '次要'}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        <BookOpen size={14} className="mr-1" />
                        {task.subject}
                      </span>
                      <span className="inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                        <Clock size={14} className="mr-1" />
                        到期: {new Intl.DateTimeFormat('zh-TW', { month: 'short', day: 'numeric' }).format(task.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {tasks.filter(task => !task.completed).length === 0 && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  沒有待完成的任務
                </div>
              )}
            </div>
          </section>
          
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                最近完成
              </h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="space-y-4">
                {tasks.filter(task => task.completed).map((task, index) => (
                  <div key={index} className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <Check size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{task.title}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {task.subject} · 今天完成
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
        
        <div className="space-y-6">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                學習進度
              </h2>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                詳細資料
              </button>
            </div>
            
            <ProgressChart data={progressData} />
          </section>
          
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                本週課表
              </h2>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                完整課表
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="space-y-3">
                {['一', '二', '三', '四', '五'].map((day, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{day}</span>
                    </div>
                    <div className="flex-1">
                      {index === 0 ? (
                        <>
                          <div className="flex justify-between">
                            <p className="font-medium text-gray-800 dark:text-white">國語、數學</p>
                            <span className="text-xs text-gray-500">10:30 - 15:00</span>
                          </div>
                        </>
                      ) : index === 2 ? (
                        <>
                          <div className="flex justify-between">
                            <p className="font-medium text-gray-800 dark:text-white">自然、社會</p>
                            <span className="text-xs text-gray-500">13:00 - 16:30</span>
                          </div>
                        </>
                      ) : index === 4 ? (
                        <>
                          <div className="flex justify-between">
                            <p className="font-medium text-gray-800 dark:text-white">英語、藝術</p>
                            <span className="text-xs text-gray-500">10:00 - 15:00</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">自主學習日</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                學習筆記
              </h2>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                所有筆記
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">今日反思</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">今天</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    今天閱讀了居禮夫人的生平，她的堅持和毅力讓我很受啟發。在遇到困難時也要像她一樣堅持...
                  </p>
                  <div className="mt-2 flex items-center">
                    <FileText size={14} className="text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      自然科學
                    </span>
                  </div>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">遊記初稿</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">昨天</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    上週去了海邊，我觀察到許多有趣的海洋生物。寫作過程中我發現可以加入更多細節...
                  </p>
                  <div className="mt-2 flex items-center">
                    <FileText size={14} className="text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      國語
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="mt-6">
        <ChatModule />
      </div>

      {/* 課程模板瀏覽器 */}
      <TopicTemplateBrowser
        isOpen={showTemplateBrowser}
        onClose={() => setShowTemplateBrowser(false)}
        onTemplateSelected={(templateId) => {
          console.log('學生選擇了模板:', templateId);
          // TODO: 導航到新建立的主題頁面
        }}
      />
    </PageLayout>
  );
};

export default StudentDashboard;