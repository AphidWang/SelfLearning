import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Book, User, CheckCircle, Clock, Calendar, TrendingUp } from 'lucide-react';

// Mock data
const students = [
  {
    id: '1',
    name: '王小明',
    progress: 78,
    completedTasks: 14,
    totalTasks: 18,
    lastActive: '今天',
    avatar: 'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=150',
    subjects: [
      { name: '國語', progress: 85 },
      { name: '數學', progress: 72 },
      { name: '英語', progress: 68 },
      { name: '自然', progress: 90 },
    ],
    pendingFeedback: 2
  },
  {
    id: '2',
    name: '陳小美',
    progress: 62,
    completedTasks: 9,
    totalTasks: 15,
    lastActive: '昨天',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    subjects: [
      { name: '國語', progress: 65 },
      { name: '數學', progress: 55 },
      { name: '英語', progress: 72 },
      { name: '自然', progress: 60 },
    ],
    pendingFeedback: 1
  },
  {
    id: '3',
    name: '林大文',
    progress: 91,
    completedTasks: 20,
    totalTasks: 22,
    lastActive: '3 小時前',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
    subjects: [
      { name: '國語', progress: 92 },
      { name: '數學', progress: 88 },
      { name: '英語', progress: 95 },
      { name: '自然', progress: 89 },
    ],
    pendingFeedback: 0
  }
];

const recentActivities = [
  { id: '1', student: '王小明', activity: '完成了任務', detail: '水三態的科學實驗', time: '1 小時前' },
  { id: '2', student: '陳小美', activity: '提交了學習筆記', detail: '遊記初稿', time: '3 小時前' },
  { id: '3', student: '林大文', activity: '完成了測驗', detail: '英語單字測驗：95 分', time: '昨天' },
  { id: '4', student: '王小明', activity: '需要幫助', detail: '數學：分數除法', time: '昨天' },
  { id: '5', student: '陳小美', activity: '報名了活動', detail: '戶外教學：自然博物館', time: '2 天前' }
];

const upcomingTasks = [
  { id: '1', title: '審核遊記作業', dueDate: '今天', students: ['王小明', '陳小美'] },
  { id: '2', title: '準備下週自然科實驗', dueDate: '明天', students: ['全班'] },
  { id: '3', title: '英語對話練習', dueDate: '週五', students: ['林大文'] }
];

const MentorDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageLayout title="指導老師儀表板">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-indigo-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                    <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">學生總數</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{students.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">已完成任務</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {students.reduce((sum, student) => sum + student.completedTasks, 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-orange-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">待完成任務</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {students.reduce((sum, student) => sum + (student.totalTasks - student.completedTasks), 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">本週計畫</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">5</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">學生進度概覽</h2>
              <button 
                onClick={() => navigate('/mentor/students')}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
              >
                查看全部
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        學生
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        總進度
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        任務完成率
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        最近活動
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        待回饋
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full object-cover" src={student.avatar} alt={student.name} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-24">
                              <div 
                                className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full" 
                                style={{ width: `${student.progress}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                              {student.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {student.completedTasks}/{student.totalTasks}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {Math.round((student.completedTasks / student.totalTasks) * 100)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.lastActive}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.pendingFeedback > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              {student.pendingFeedback}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              無
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                            詳情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">學生最近活動</h2>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex">
                        <div className="mr-4 flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Book size={16} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            <span className="font-semibold">{activity.student}</span> {activity.activity}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{activity.detail}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">您的待辦事項</h2>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="space-y-4">
                    {upcomingTasks.map((task) => (
                      <div key={task.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                          <span 
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              task.dueDate === '今天' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                                : task.dueDate === '明天'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}
                          >
                            {task.dueDate}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.students.map((student, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                              {student}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <button className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 focus:outline-none">
                      查看全部任務
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        
        <div className="space-y-6">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">需要關注</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="space-y-4">
                <div className="p-3 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-300">任務進度延遲</h3>
                      <div className="mt-1 text-sm text-red-700 dark:text-red-200">
                        <p>陳小美: 自然科作業已延遲 3 天</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/10 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-orange-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300">學習時間不足</h3>
                      <div className="mt-1 text-sm text-orange-700 dark:text-orange-200">
                        <p>王小明: 數學科學習時間連續兩週低於計畫</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">進步顯著</h3>
                      <div className="mt-1 text-sm text-blue-700 dark:text-blue-200">
                        <p>林大文: 英語口說能力提升 25%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">科目進度概覽</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="space-y-6">
                {['國語', '數學', '英語', '自然'].map((subject, index) => {
                  // Calculate average progress across all students for this subject
                  const avgProgress = Math.round(
                    students.reduce((sum, student) => {
                      const subj = student.subjects.find(s => s.name === subject);
                      return sum + (subj ? subj.progress : 0);
                    }, 0) / students.length
                  );
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{subject}</h3>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{avgProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full"
                          style={{ width: `${avgProgress}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div>
                          最低: {Math.min(...students.map(student => {
                            const subj = student.subjects.find(s => s.name === subject);
                            return subj ? subj.progress : 100;
                          }))}%
                        </div>
                        <div>
                          最高: {Math.max(...students.map(student => {
                            const subj = student.subjects.find(s => s.name === subject);
                            return subj ? subj.progress : 0;
                          }))}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6">
                <button className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
                  查看詳細報告
                </button>
              </div>
            </div>
          </section>
          
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">系統公告</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">系統更新通知</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    我們新增了更多課表類型，現在可以為不同學習階段設定專屬課表。
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">2023/05/15</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">學期評估即將開始</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    請在 6 月 15 日前完成所有學生的學期評估。
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">2023/05/01</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default MentorDashboard;