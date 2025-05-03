import { Goal } from '../types/goal';
import { GOAL_STATUSES } from '../constants/goals';
import { SUBJECTS } from '../constants/subjects';

export const mockGoals: Goal[] = [
  {
    id: '1',
    title: '完成科學探索專案',
    description: '透過觀察、實驗和記錄，探索自然現象並培養科學思維',
    category: 'learning',
    templateType: '學習目標',
    status: GOAL_STATUSES.ACTIVE,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    progress: 35,
    subject: SUBJECTS.SCIENCE,
    createdAt: new Date(),
    actionItems: [
      {
        id: '1-1',
        description: '閱讀科學家傳記，了解科學研究方法',
        estimatedTime: '2小時',
        status: 'done',
        addedToSchedule: true,
        priority: 'high'
      },
      {
        id: '1-2',
        description: '進行水的三態實驗並記錄觀察',
        estimatedTime: '1.5小時',
        status: 'in-progress',
        addedToSchedule: true,
        priority: 'high'
      },
      {
        id: '1-3',
        description: '整理實驗數據並製作圖表',
        status: 'todo',
        addedToSchedule: false,
        priority: 'medium'
      }
    ]
  },
  {
    id: '2',
    title: '環島旅行學習計畫',
    description: '結合地理、歷史和文化的實地探索之旅',
    category: 'project',
    templateType: '專案計畫',
    status: 'active',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 60)),
    progress: 20,
    subject: SUBJECTS.SOCIAL,
    createdAt: new Date(),
    actionItems: [
      {
        id: '2-1',
        description: '規劃路線並研究各地特色',
        estimatedTime: '3小時',
        status: 'done',
        addedToSchedule: true,
        priority: 'high'
      },
      {
        id: '2-2',
        description: '準備旅行日誌模板',
        status: 'todo',
        addedToSchedule: false,
        priority: 'medium'
      }
    ]
  }
]; 