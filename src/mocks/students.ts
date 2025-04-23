const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(today.getDate() - 2);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);

export const mockStudents = [
// Mock data
    {
      id: '1',
      name: '王小明',
      progress: 75,
      subjects: [
        { name: '國語', progress: 80 },
        { name: '數學', progress: 70 },
        { name: '英語', progress: 75 }
      ],
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
      completedTasks: 3,
      totalTasks: 5,
      lastActive: '今天',
      pendingFeedback: 2,
      weeklyPlans: [
        {
          subject: '國語',
          curriculum: '第六課 - 生活中的科學',
          tasks: [
            {
              id: 't1',
              title: '寫一篇遊記',
              description: '選擇一個最近去過的地方，寫一篇遊記',
              startDate: today,
              endDate: dayAfterTomorrow,
              status: 'in_progress',
              progress: 30
            },
            {
              id: 't2',
              title: '課文朗讀練習',
              description: '練習課文朗讀並錄音',
              startDate: twoDaysAgo,
              endDate: twoDaysAgo,
              status: 'in_progress',
              progress: 50
            },
            {
              id: 't3',
              title: '詞語練習',
              description: '完成詞語練習作業',
              startDate: yesterday,
              endDate: today,
              status: 'pending',
              progress: 0
            }
          ]
        },
        {
          subject: '自然',
          curriculum: '水的三態變化',
          tasks: [
            {
              id: 't6',
              title: '實驗報告',
              description: '完成水的三態變化實驗報告',
              startDate: yesterday,
              endDate: tomorrow,
              status: 'waiting_feedback',
              progress: 100
            },
            {
              id: 't7',
              title: '課堂練習',
              description: '完成課本練習題',
              startDate: today,
              endDate: today,
              status: 'waiting_feedback',
              progress: 100
            }
          ]
        }
      ]
    },
    {
      id: '2',
      name: '陳小美',
      progress: 62,
      subjects: [
        { name: '國語', progress: 65 },
        { name: '數學', progress: 55 },
        { name: '英語', progress: 72 }
      ],
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
      completedTasks: 0,
      totalTasks: 2,
      lastActive: '昨天',
      pendingFeedback: 1,
      weeklyPlans: [
        {
          subject: '數學',
          curriculum: '分數的加減',
          tasks: [
            {
              id: 't4',
              title: '分數加減練習',
              description: '完成課本練習題',
              startDate: today,
              endDate: tomorrow,
              status: 'in_progress',
              progress: 50
            },
            {
              id: 't5',
              title: '情境應用題',
              description: '完成應用題作業',
              startDate: yesterday,
              endDate: today,
              status: 'pending',
              progress: 0
            }
          ]
        }
      ]
    },
    {
      id: '3',
      name: '林大文',
      progress: 91,
      completedTasks: 0,
      totalTasks: 0,
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