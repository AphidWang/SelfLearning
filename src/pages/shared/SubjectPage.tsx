import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useParams } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface SubjectPageProps {
  isMentor?: boolean;
}

const SubjectPage: React.FC<SubjectPageProps> = ({ isMentor = false }) => {
  const { subjectId } = useParams<{ subjectId: string }>();
  
  // Mock data - in a real app, this would come from your backend
  const subjectData = {
    國語: {
      name: '國語',
      progress: 65,
      currentUnit: '第六課：春天的雨',
      nextAssessment: '作文：遊記',
      recentActivities: [
        { type: 'task', title: '完成遊記初稿', date: '2024/03/15' },
        { type: 'note', title: '課文筆記：春天的意象', date: '2024/03/14' },
        { type: 'assessment', title: '單元測驗：85分', date: '2024/03/12' }
      ]
    },
    數學: {
      name: '數學',
      progress: 78,
      currentUnit: '單元四：分數除法',
      nextAssessment: '單元測驗：分數運算',
      recentActivities: [
        { type: 'task', title: '完成練習題 4-2', date: '2024/03/15' },
        { type: 'note', title: '解題技巧：分數除法', date: '2024/03/14' },
        { type: 'assessment', title: '小考：90分', date: '2024/03/13' }
      ]
    },
    英語: {
      name: 'English',
      progress: 42,
      currentUnit: 'Unit 5: Daily Life',
      nextAssessment: 'Oral Test: Daily Conversation',
      recentActivities: [
        { type: 'task', title: '完成單字練習', date: '2024/03/15' },
        { type: 'note', title: '文法筆記：現在進行式', date: '2024/03/14' },
        { type: 'assessment', title: '單字測驗：75分', date: '2024/03/12' }
      ]
    },
    自然: {
      name: '自然科學',
      progress: 85,
      currentUnit: '物質的三態變化',
      nextAssessment: '實驗報告：水的三態',
      recentActivities: [
        { type: 'task', title: '完成實驗記錄', date: '2024/03/15' },
        { type: 'note', title: '實驗觀察筆記', date: '2024/03/14' },
        { type: 'assessment', title: '實驗操作評量：95分', date: '2024/03/12' }
      ]
    }
  };

  const subject = subjectData[subjectId as keyof typeof subjectData];

  if (!subject) {
    return (
      <PageLayout title="科目不存在">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            找不到該科目的資料
          </h2>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={subject.name}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {subject.currentUnit}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    目前進度：{subject.progress}%
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 w-32">
                    <div 
                      className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" 
                      style={{ width: `${subject.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  近期活動
                </h3>
                <div className="space-y-4">
                  {subject.recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div 
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            activity.type === 'task'
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : activity.type === 'note'
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : 'bg-purple-100 dark:bg-purple-900/30'
                          }`}
                        >
                          {activity.type === 'task' ? (
                            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : activity.type === 'note' ? (
                            <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                學習資源
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    推薦教材
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• 課本隨堂練習</li>
                    <li>• 補充教材</li>
                    <li>• 線上影片教學</li>
                    <li>• 互動式練習</li>
                  </ul>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    延伸學習
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• 相關課外讀物</li>
                    <li>• 實踐活動建議</li>
                    <li>• 進階練習題</li>
                    <li>• 小組討論主題</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                即將到來
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      下次評量
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {subject.nextAssessment}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {isMentor && (
            <section>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  教學建議
                </h3>
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                  <p>• 根據學生最近的表現，建議加強口語練習</p>
                  <p>• 可以考慮增加實作練習的比重</p>
                  <p>• 建議進行小組討論活動</p>
                  <p>• 可以引入更多生活化的例子</p>
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                學習提醒
              </h3>
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <p>• 記得複習今天學習的重點</p>
                <p>• 準備下次課程需要的材料</p>
                <p>• 完成作業後自我檢查</p>
                <p>• 有問題及時詢問老師</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default SubjectPage;