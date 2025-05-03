import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import ProgressChart from '../../components/progress/ProgressChart';
import { Target, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

const progressData = [
  { subject: '國語', progress: 65, color: '#4F46E5' },
  { subject: '數學', progress: 78, color: '#0EA5E9' },
  { subject: '英語', progress: 42, color: '#F97316' },
  { subject: '自然', progress: 85, color: '#10B981' },
  { subject: '社會', progress: 51, color: '#8B5CF6' }
];

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  progress: number;
  subject: string;
  status: 'in-progress' | 'completed' | 'overdue';
}

const mockGoals: Goal[] = [
  {
    id: '1',
    title: '完成科學讀物閱讀計畫',
    description: '閱讀三本科學相關的課外讀物，並完成閱讀心得',
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)),
    progress: 65,
    subject: '自然',
    status: 'in-progress'
  },
  {
    id: '2',
    title: '英語口說能力提升',
    description: '每週進行兩次英語口說練習，提升口語表達能力',
    deadline: new Date(new Date().setDate(new Date().getDate() + 60)),
    progress: 42,
    subject: '英語',
    status: 'in-progress'
  },
  {
    id: '3',
    title: '數學解題技巧培養',
    description: '完成高階數學題目練習，培養邏輯思維能力',
    deadline: new Date(new Date().setDate(new Date().getDate() + 15)),
    progress: 78,
    subject: '數學',
    status: 'in-progress'
  },
  {
    id: '4',
    title: '完成文學作品創作',
    description: '創作一篇原創短篇小說，字數不少於 3000 字',
    deadline: new Date(new Date().setDate(new Date().getDate() - 5)),
    progress: 100,
    subject: '國語',
    status: 'completed'
  }
];

const StudentGoals: React.FC = () => {
  return (
    <PageLayout title="目標與進度">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">學習目標</h2>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Target className="h-4 w-4 mr-2" />
                設定新目標
              </button>
            </div>
            
            <div className="space-y-4">
              {mockGoals.map((goal) => (
                <div 
                  key={goal.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {goal.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {goal.description}
                      </p>
                    </div>
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        goal.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : goal.status === 'overdue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}
                    >
                      {goal.status === 'completed' ? '已完成' : goal.status === 'overdue' ? '已逾期' : '進行中'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-1" />
                      截止日期：
                      {new Intl.DateTimeFormat('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }).format(goal.deadline)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {goal.progress}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        goal.status === 'completed'
                          ? 'bg-green-600'
                          : goal.status === 'overdue'
                            ? 'bg-red-600'
                            : 'bg-indigo-600'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="mt-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {goal.subject}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">近期里程碑</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-6">
                <div className="relative">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        完成第一階段英語口說訓練
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        已完成 10 次口說練習，口語表達更加流暢
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        完成科學讀物閱讀
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        閱讀完成第二本科學讀物，並撰寫心得
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        數學解題能力提升
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        最近一次測驗成績提升 15 分
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        
        <div className="space-y-6">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                整體學習進度
              </h2>
            </div>
            
            <ProgressChart data={progressData} />
          </section>
          
          <section>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                學習建議
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      英語科目的進度較慢，建議增加口語練習的頻率
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      自然科學的學習成效良好，可以嘗試更具挑戰性的內容
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      建議設定更多短期目標，幫助追蹤學習進度
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default StudentGoals;