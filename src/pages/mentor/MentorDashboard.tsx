import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useNavigate } from 'react-router-dom';
import { StatsBlock } from '../../components/blocks/StatsBlock';
import { StudentProgressTable } from '../../components/blocks/StudentProgressTable';
import { AttentionBlock } from '../../components/blocks/AttentionBlock';
import { TasksBlock } from '../../components/blocks/TasksBlock';
import { RecentActivitiesBlock } from '../../components/blocks/RecentActivitiesBlock';
import { card, text, layout } from '../../styles/tokens';

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

const attentionItems = [
  {
    type: 'error' as const,
    title: '任務進度延遲',
    description: '陳小美: 自然科作業已延遲 3 天'
  },
  {
    type: 'warning' as const,
    title: '學習時間不足',
    description: '王小明: 數學科學習時間連續兩週低於計畫'
  },
  {
    type: 'success' as const,
    title: '進步顯著',
    description: '林大文: 英語口說能力提升 25%'
  }
];

const MentorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const statsData = {
    studentCount: students.length,
    completedTasks: students.reduce((sum, student) => sum + student.completedTasks, 0),
    pendingTasks: students.reduce((sum, student) => sum + (student.totalTasks - student.completedTasks), 0),
    weeklyPlans: 5
  };

  return (
    <PageLayout title="指導老師儀表板">
      <div className={layout.grid.main}>
        <div className={layout.grid.sidebar}>
          <section className={layout.section.wrapper}>
            <StatsBlock data={statsData} />
          </section>
          <section className={layout.section.wrapper}>
            <div className={layout.section.header}>
              <h2 className={text.title}>學生進度總覽</h2>
            </div>
            <div className={`${layout.card.base} overflow-hidden`}>
              <StudentProgressTable 
                students={students}
                onViewDetails={(studentId) => navigate(`/mentor/students/${studentId}`)}
              />
            </div>
          </section>
        </div>
        <div className={layout.section.wrapper}>
          <section>
            <div className={layout.section.header}>
              <h2 className={text.title}>需要關注</h2>
            </div>
            <AttentionBlock items={attentionItems} />
          </section>
          <section>
            <div className={layout.section.header}>
              <h2 className={text.title}>您的待辦事項</h2>
              <button onClick={() => navigate('/mentor/tasks')} className={text.link}>
                查看全部
              </button>
            </div>
            <TasksBlock tasks={upcomingTasks} />
          </section>
          <section>
            <div className={layout.section.header}>
              <h2 className={text.title}>學生最近活動</h2>
              <button onClick={() => navigate('/mentor/activities')} className={text.link}>
                查看全部
              </button>
            </div>
            <RecentActivitiesBlock activities={recentActivities} />
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default MentorDashboard;