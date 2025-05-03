/** @jsx React.createElement */
import React from 'react';
import type { ReactNode } from 'react';
import { Brain, Target, Sparkles, Calendar, Book, Trophy, Users, Palette, PartyPopper } from 'lucide-react';
import { GOAL_CATEGORIES } from '../constants/goals';

export const goalTemplates = [
  {
    icon: React.createElement(Brain, { className: "h-5 w-5 text-purple-500" }),
    title: '學習目標',
    description: '設定特定科目或技能的學習目標',
    category: GOAL_CATEGORIES.LEARNING
  },
  {
    icon: React.createElement(Target, { className: "h-5 w-5 text-blue-500" }),
    title: '個人成長',
    description: '培養習慣、發展興趣或自我提升',
    category: GOAL_CATEGORIES.PERSONAL
  },
  {
    icon: React.createElement(Sparkles, { className: "h-5 w-5 text-green-500" }),
    title: '專案計畫',
    description: '規劃並執行一個完整的學習專案',
    category: GOAL_CATEGORIES.PROJECT
  },
  {
    icon: React.createElement(PartyPopper, { className: "h-5 w-5 text-purple-500" }),
    title: '活動規劃',
    description: '規劃各種有趣的活動，從比賽參與到節日慶祝，培養規劃和組織能力',
    category: GOAL_CATEGORIES.PROJECT,
    suggestedActions: [
      '確定活動類型和目的',
      '選擇時間和地點',
      '列出所需準備項目',
      '安排活動流程',
      '準備預算計畫',
      '邀請參與人員'
    ]
  }
] as const;