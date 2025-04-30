/** @jsx React.createElement */
import React from 'react';
import type { ReactNode } from 'react';
import { Brain, Target, Sparkles } from 'lucide-react';
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
  }
] as const;