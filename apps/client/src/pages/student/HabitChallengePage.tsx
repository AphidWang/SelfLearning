/**
 * HabitChallengePage - 學生習慣挑戰頁面
 * 
 * 🎯 功能說明：
 * - 管理日常習慣和挑戰任務
 * - 支援不同類型的挑戰：體能、學習、生活等
 * - 進度追蹤和連續天數統計
 * - 溫暖色調設計，鼓勵持續完成
 * 
 * 🏗️ 架構設計：
 * - 按類別分組顯示（學科、生活、體能等）
 * - 每個類別顯示整體進度和具體任務
 * - 支援每日打卡和連續天數統計
 * - 簡潔的卡片式佈局
 * 
 * 🎨 視覺設計：
 * - 清爽的淺色調背景
 * - 按類別使用不同的主題色彩
 * - 進度條和打卡動畫
 * - 鼓勵性的視覺反饋
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Settings, Plus, CheckCircle2, Clock, Target, Star, Flame, Calendar, TrendingUp, X } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { LoadingDots } from '../../components/shared/LoadingDots';

/**
 * 習慣類型
 */
type HabitType = 'daily' | 'weekly' | 'challenge';

/**
 * 習慣狀態
 */
type HabitStatus = 'active' | 'completed' | 'paused';

/**
 * 習慣/挑戰介面
 */
interface Habit {
  id: string;
  title: string;
  description?: string;
  type: HabitType;
  status: HabitStatus;
  categoryId: string;
  target: number; // 目標次數或天數
  current: number; // 目前進度
  streak: number; // 連續天數
  lastCompletedDate?: string;
  createdAt: string;
  completedDates: string[]; // 完成日期記錄
}

/**
 * 習慣類別
 */
interface HabitCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

/**
 * 習慣統計
 */
interface HabitStats {
  totalHabits: number;
  completedHabits: number;
  currentStreak: number;
  totalCompletions: number;
}

// Mock 資料
const mockCategories: HabitCategory[] = [
  {
    id: 'study',
    name: '學習習慣',
    emoji: '📚',
    color: '#3B82F6',
    description: '培養良好的學習習慣'
  },
  {
    id: 'health',
    name: '健康生活',
    emoji: '💪',
    color: '#10B981',
    description: '維持身心健康'
  },
  {
    id: 'life',
    name: '生活管理',
    emoji: '🏠',
    color: '#F59E0B',
    description: '提升生活品質'
  },
  {
    id: 'hobby',
    name: '興趣培養',
    emoji: '🎨',
    color: '#8B5CF6',
    description: '發展個人興趣'
  }
];

const mockHabits: Habit[] = [
  // 學習習慣
  {
    id: 'habit-1',
    title: '每日英文練習',
    description: '每天15分鐘英文練習',
    type: 'daily',
    status: 'active',
    categoryId: 'study',
    target: 7,
    current: 4,
    streak: 4,
    lastCompletedDate: '2024-01-15',
    createdAt: '2024-01-12',
    completedDates: ['2024-01-12', '2024-01-13', '2024-01-14', '2024-01-15']
  },
  {
    id: 'habit-2',
    title: '數學練習題',
    description: '完成5道數學練習題',
    type: 'daily',
    status: 'active',
    categoryId: 'study',
    target: 7,
    current: 2,
    streak: 2,
    lastCompletedDate: '2024-01-14',
    createdAt: '2024-01-13',
    completedDates: ['2024-01-13', '2024-01-14']
  },
  {
    id: 'habit-3',
    title: '閱讀理解',
    description: '閱讀30分鐘',
    type: 'daily',
    status: 'active',
    categoryId: 'study',
    target: 7,
    current: 1,
    streak: 1,
    lastCompletedDate: '2024-01-15',
    createdAt: '2024-01-15',
    completedDates: ['2024-01-15']
  },
  // 健康生活
  {
    id: 'habit-4',
    title: '晨間運動',
    description: '10分鐘伸展運動',
    type: 'daily',
    status: 'active',
    categoryId: 'health',
    target: 7,
    current: 3,
    streak: 3,
    lastCompletedDate: '2024-01-15',
    createdAt: '2024-01-13',
    completedDates: ['2024-01-13', '2024-01-14', '2024-01-15']
  },
  {
    id: 'habit-5',
    title: '喝水提醒',
    description: '每日8杯水',
    type: 'daily',
    status: 'active',
    categoryId: 'health',
    target: 7,
    current: 5,
    streak: 5,
    lastCompletedDate: '2024-01-15',
    createdAt: '2024-01-11',
    completedDates: ['2024-01-11', '2024-01-12', '2024-01-13', '2024-01-14', '2024-01-15']
  },
  // 生活管理
  {
    id: 'habit-6',
    title: '整理書桌',
    description: '保持書桌整潔',
    type: 'daily',
    status: 'active',
    categoryId: 'life',
    target: 7,
    current: 2,
    streak: 2,
    lastCompletedDate: '2024-01-14',
    createdAt: '2024-01-13',
    completedDates: ['2024-01-13', '2024-01-14']
  },
  {
    id: 'habit-7',
    title: '早睡早起',
    description: '11點前上床睡覺',
    type: 'daily',
    status: 'active',
    categoryId: 'life',
    target: 7,
    current: 1,
    streak: 1,
    lastCompletedDate: '2024-01-15',
    createdAt: '2024-01-15',
    completedDates: ['2024-01-15']
  },
  // 興趣培養
  {
    id: 'habit-8',
    title: '畫畫練習',
    description: '每日素描20分鐘',
    type: 'daily',
    status: 'active',
    categoryId: 'hobby',
    target: 7,
    current: 3,
    streak: 3,
    lastCompletedDate: '2024-01-15',
    createdAt: '2024-01-13',
    completedDates: ['2024-01-13', '2024-01-14', '2024-01-15']
  }
];

/**
 * 習慣卡片組件
 */
interface HabitCardProps {
  habit: Habit;
  category: HabitCategory;
  onToggleComplete: (habitId: string) => void;
  onEdit: (habitId: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, category, onToggleComplete, onEdit }) => {
  const progress = (habit.current / habit.target) * 100;
  const isCompletedToday = habit.lastCompletedDate === new Date().toISOString().split('T')[0];
  
  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
      whileHover={{ y: -2 }}
      layout
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.button
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              isCompletedToday 
                ? 'bg-green-500 border-green-500' 
                : 'border-gray-300 hover:border-green-400'
            }`}
            onClick={() => onToggleComplete(habit.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isCompletedToday && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 text-sm">{habit.title}</h4>
            {habit.description && (
              <p className="text-xs text-gray-600 mt-1">{habit.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {habit.streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">
              <Flame className="w-3 h-3" />
              <span className="font-medium">{habit.streak}</span>
            </div>
          )}
          <span className="text-xs text-gray-500">
            {habit.current}/{habit.target}
          </span>
        </div>
      </div>
      
      {/* 進度條 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="h-2 rounded-full transition-all duration-500"
          style={{ backgroundColor: category.color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

/**
 * 類別卡片組件
 */
interface CategoryCardProps {
  category: HabitCategory;
  habits: Habit[];
  onToggleComplete: (habitId: string) => void;
  onEditHabit: (habitId: string) => void;
  onAddHabit: (categoryId: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  habits, 
  onToggleComplete, 
  onEditHabit, 
  onAddHabit 
}) => {
  const completedHabits = habits.filter(h => h.current >= h.target).length;
  const totalHabits = habits.length;
  const overallProgress = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
  
  return (
    <motion.div
      className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
    >
      {/* 類別標題 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
            style={{ backgroundColor: category.color + '20' }}
          >
            {category.emoji}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{category.name}</h3>
            <p className="text-sm text-gray-600">{category.description}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-gray-800">
              {completedHabits}/{totalHabits}
            </span>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: category.color + '20' }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: category.color }} />
            </div>
          </div>
          <div className="text-xs text-gray-500">完成進度</div>
        </div>
      </div>
      
      {/* 整體進度條 */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="h-3 rounded-full transition-all duration-500"
            style={{ backgroundColor: category.color }}
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>整體進度</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
      </div>
      
      {/* 習慣列表 */}
      <div className="space-y-3">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            category={category}
            onToggleComplete={onToggleComplete}
            onEdit={onEditHabit}
          />
        ))}
        
        {/* 添加新習慣按鈕 */}
        <motion.button
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
          onClick={() => onAddHabit(category.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">添加新習慣</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * 統計面板組件
 */
interface StatsPanelProps {
  stats: HabitStats;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const statItems = [
    { label: '總習慣', value: stats.totalHabits, icon: Target, color: '#3B82F6' },
    { label: '已完成', value: stats.completedHabits, icon: CheckCircle2, color: '#10B981' },
    { label: '連續天數', value: stats.currentStreak, icon: Flame, color: '#F59E0B' },
    { label: '總完成次數', value: stats.totalCompletions, icon: Star, color: '#8B5CF6' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
              style={{ backgroundColor: item.color + '20' }}
            >
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <span className="text-2xl font-bold text-gray-800">{item.value}</span>
          </div>
          <p className="text-sm text-gray-600">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
};

export const HabitChallengePage = () => {
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [categories] = useState<HabitCategory[]>(mockCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // 模擬初始載入
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 計算統計資料
  const stats = useMemo((): HabitStats => {
    const totalHabits = habits.filter(h => h.status === 'active').length;
    const completedHabits = habits.filter(h => h.status === 'active' && h.current >= h.target).length;
    const currentStreak = Math.max(...habits.map(h => h.streak), 0);
    const totalCompletions = habits.reduce((sum, h) => sum + h.current, 0);
    
    return {
      totalHabits,
      completedHabits,
      currentStreak,
      totalCompletions
    };
  }, [habits]);

  // 按類別分組習慣
  const habitsByCategory = useMemo(() => {
    const grouped = categories.map(category => ({
      category,
      habits: habits.filter(h => h.categoryId === category.id && h.status === 'active')
    }));
    return grouped.filter(group => group.habits.length > 0);
  }, [categories, habits]);

  // 處理習慣完成狀態切換
  const handleToggleComplete = useCallback((habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    setHabits(prev => prev.map(habit => {
      if (habit.id !== habitId) return habit;
      
      const isCompletedToday = habit.lastCompletedDate === today;
      
      if (isCompletedToday) {
        // 取消今日完成
        return {
          ...habit,
          current: Math.max(0, habit.current - 1),
          streak: Math.max(0, habit.streak - 1),
          lastCompletedDate: habit.completedDates[habit.completedDates.length - 2] || undefined,
          completedDates: habit.completedDates.filter(date => date !== today)
        };
      } else {
        // 標記今日完成
        const newCompletedDates = [...habit.completedDates, today].sort();
        return {
          ...habit,
          current: habit.current + 1,
          streak: habit.streak + 1,
          lastCompletedDate: today,
          completedDates: newCompletedDates
        };
      }
    }));
    
    // 顯示鼓勵訊息
    toast.success(
      habits.find(h => h.id === habitId)?.lastCompletedDate === today 
        ? '已取消今日完成 👌' 
        : '太棒了！今日任務完成 🎉',
      {
        duration: 2000,
        style: {
          background: '#10B981',
          color: 'white',
          borderRadius: '12px',
          fontWeight: '500'
        }
      }
    );
  }, [habits]);

  // 處理編輯習慣
  const handleEditHabit = useCallback((habitId: string) => {
    console.log('Edit habit:', habitId);
    // TODO: 實作編輯功能
  }, []);

  // 處理添加新習慣
  const handleAddHabit = useCallback((categoryId: string) => {
    console.log('Add habit to category:', categoryId);
    // TODO: 實作添加功能
  }, []);

  if (isLoading) {
    return (
      <PageLayout title="習慣挑戰">
        <div className="flex items-center justify-center h-64">
          <LoadingDots 
            colors={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']}
            size={8}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="習慣挑戰">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontWeight: '500'
          }
        }}
      />
      
      {/* 清新背景 */}
      <div 
        className="min-h-screen"
        style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)',
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #e0f2fe 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, #f0f9ff 0%, transparent 50%)
          `
        }}
      >
        {/* 標題區域 */}
        <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur-sm border-b border-blue-200/50 mb-6">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 rounded-full bg-white/80 text-blue-700 hover:bg-white transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div>
                  <h1 className="text-3xl font-bold text-blue-900 mb-1">
                    🎯 習慣挑戰
                  </h1>
                  <p className="text-blue-700">
                    培養好習慣，迎接每一天的挑戰！
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-full bg-white/80 text-blue-700 hover:bg-white transition-colors shadow-sm"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 設定面板 */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              className="fixed top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-md shadow-2xl z-[100] p-6"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">習慣設定</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>設定功能開發中...</p>
                  <p className="mt-2">即將支援：</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• 自訂提醒時間</li>
                    <li>• 目標調整</li>
                    <li>• 統計報告</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主要內容區域 */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          {/* 統計面板 */}
          <StatsPanel stats={stats} />
          
          {/* 習慣類別網格 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {habitsByCategory.map((group, index) => (
              <motion.div
                key={group.category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CategoryCard
                  category={group.category}
                  habits={group.habits}
                  onToggleComplete={handleToggleComplete}
                  onEditHabit={handleEditHabit}
                  onAddHabit={handleAddHabit}
                />
              </motion.div>
            ))}
          </div>
          
          {/* 空狀態 */}
          {habitsByCategory.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">開始你的習慣挑戰！</h3>
              <p className="text-gray-600 mb-4">建立你的第一個習慣，開始改變生活</p>
              <button
                onClick={() => handleAddHabit('study')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                建立第一個習慣
              </button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default HabitChallengePage; 