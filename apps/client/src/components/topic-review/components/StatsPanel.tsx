import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Star, MessageSquare } from 'lucide-react';

interface StatsPanelProps {
  subjectStyle: any;
  progress: number;
  weeklyStats: {
    completedTasks: number;
    totalTasks: number;
    newlyCompleted: number;
    inProgressTasks: number;
  };
  needHelpCount: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  subjectStyle,
  progress,
  weeklyStats,
  needHelpCount
}) => {
  return (
    <div className="col-span-3 flex flex-col gap-2 overflow-y-auto">
      {/* 總體進度 */}
      <motion.div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4" style={{ color: subjectStyle.accent }} />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">總體進度</h3>
          <div className="ml-auto text-2xl font-bold" style={{ color: subjectStyle.accent }}>
            {Math.round(progress)}%
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <motion.div
            className="h-2 rounded-full"
            style={{ backgroundColor: subjectStyle.accent }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.5, duration: 1 }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>已完成: {weeklyStats.completedTasks}</span>
          <span>總任務: {weeklyStats.totalTasks}</span>
        </div>
      </motion.div>

      {/* 本週亮點與學習洞察 */}
      <motion.div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">本週亮點</h3>
        </div>
        
        {/* 本週統計 */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-lg font-bold text-green-600">{weeklyStats.newlyCompleted}</div>
            <div className="text-xs text-green-700 dark:text-green-300">新完成</div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-lg font-bold text-blue-600">{weeklyStats.inProgressTasks}</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">進行中</div>
          </div>
          <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-lg font-bold text-orange-600">{needHelpCount}</div>
            <div className="text-xs text-orange-700 dark:text-orange-300">需要幫忙</div>
          </div>
        </div>
      </motion.div>

      {/* 心情小屋 */}
      <motion.div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">心情小屋</h3>
        </div>
        
        <div className="space-y-2">
          <div className="text-center text-xs text-gray-600 dark:text-gray-400 mb-2">
            本週對這個主題的感覺
          </div>
          
          <div className="grid grid-cols-4 gap-1">
            {[
              { emoji: '😊', label: '開心', selected: true },
              { emoji: '🤔', label: '思考', selected: false },
              { emoji: '😤', label: '困難', selected: false },
              { emoji: '🎉', label: '興奮', selected: false },
            ].map((mood, index) => (
              <button
                key={index}
                className={`p-1.5 rounded-lg text-center transition-all hover:scale-105 ${
                  mood.selected
                    ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700'
                    : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="text-lg mb-1">{mood.emoji}</div>
                <div className={`text-xs ${
                  mood.selected 
                    ? 'text-amber-800 dark:text-amber-200 font-medium' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {mood.label}
                </div>
              </button>
            ))}
          </div>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            點擊記錄心情
          </div>
        </div>
      </motion.div>

      {/* 老師評語 */}
      <motion.div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-200 dark:border-gray-700 flex-1 flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">老師評語</h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            尚無老師評語
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 