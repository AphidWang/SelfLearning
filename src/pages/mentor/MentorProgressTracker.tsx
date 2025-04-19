import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { TrendingUp, AlertTriangle, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react';

const students = [
  {
    id: '1',
    name: '王小明',
    subjects: [
      { name: '國語', progress: 85, trend: 5 },
      { name: '數學', progress: 72, trend: -3 },
      { name: '英語', progress: 68, trend: 2 },
      { name: '自然', progress: 90, trend: 8 },
    ]
  },
  {
    id: '2',
    name: '陳小美',
    subjects: [
      { name: '國語', progress: 65, trend: -2 },
      { name: '數學', progress: 55, trend: 4 },
      { name: '英語', progress: 72, trend: 6 },
      { name: '自然', progress: 60, trend: 1 },
    ]
  },
  {
    id: '3',
    name: '林大文',
    subjects: [
      { name: '國語', progress: 92, trend: 3 },
      { name: '數學', progress: 88, trend: 5 },
      { name: '英語', progress: 95, trend: 4 },
      { name: '自然', progress: 89, trend: -1 },
    ]
  }
];

const MentorProgressTracker: React.FC = () => {
  return (
    <PageLayout title="進度追蹤">
      <div className="space-y-6">
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">平均進度</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">76%</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">達標科目</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">8/12</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">需要關注</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">2</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">學生進度詳情</h2>
              <div className="space-y-8">
                {students.map((student) => (
                  <div key={student.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">{student.name}</h3>
                    </div>
                    <div className="space-y-2">
                      {student.subjects.map((subject, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-24 text-sm text-gray-500 dark:text-gray-400">{subject.name}</div>
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                <div
                                  className="h-2 bg-indigo-600 dark:bg-indigo-500 rounded-full"
                                  style={{ width: `${subject.progress}%` }}
                                ></div>
                              </div>
                              <span className="ml-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {subject.progress}%
                              </span>
                              <div className="ml-2 flex items-center">
                                {subject.trend > 0 ? (
                                  <ArrowUp className="h-4 w-4 text-green-500" />
                                ) : (
                                  <ArrowDown className="h-4 w-4 text-red-500" />
                                )}
                                <span className={`ml-1 text-sm ${
                                  subject.trend > 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  {Math.abs(subject.trend)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default MentorProgressTracker; 