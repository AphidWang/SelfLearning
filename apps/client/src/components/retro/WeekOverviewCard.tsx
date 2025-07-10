/**
 * WeekOverviewCard - 週學習概覽卡片
 * 
 * 🎯 功能：
 * - 顯示本週詳細的學習脈絡
 * - 每日打卡詳情、能量變化
 * - 具體的任務和主題活動
 * - 週摘要和學習模式分析
 * - 讓孩子「回到現場」，回想具體做過什麼
 */

import React from 'react';
import { motion } from 'framer-motion';
import { subjects } from '../../styles/tokens';
import type { WeeklyStats } from '../../types/retro';

interface WeekOverviewCardProps {
  weekStats: WeeklyStats | null;
  className?: string;
}

export const WeekOverviewCard: React.FC<WeekOverviewCardProps> = ({
  weekStats,
  className = ""
}) => {
  if (!weekStats) {
    return (
      <div className={`bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-orange-200 shadow-lg ${className}`}>
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-6"></div>
          </div>
          <p className="text-gray-500">載入週統計中...</p>
        </div>
      </div>
    );
  }

  const getEnergyEmoji = (energy: number) => {
    if (energy >= 5) return '🔥';
    if (energy >= 4) return '😊';
    if (energy >= 3) return '😌';
    if (energy >= 2) return '😐';
    return '😴';
  };

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return '😐';
    const moodEmojis = {
      excited: '🤩',
      happy: '😊',
      okay: '😐',
      tired: '😴',
      stressed: '😰'
    };
    return moodEmojis[mood as keyof typeof moodEmojis] || '😐';
  };

  const getLearningPatternText = (pattern: string) => {
    const patterns = {
      consistent: '穩定持續',
      burst: '爆發式',
      irregular: '不規律',
      balanced: '平衡發展'
    };
    return patterns[pattern as keyof typeof patterns] || '平衡發展';
  };

  const getLearningPatternEmoji = (pattern: string) => {
    const emojis = {
      consistent: '📈',
      burst: '💥',
      irregular: '🌊',
      balanced: '⚖️'
    };
    return emojis[pattern as keyof typeof emojis] || '⚖️';
  };

  // 根據 subject 獲取顏色配置（使用系統統一配置）
  const getSubjectColor = (subject: string) => {
    const style = subjects.getSubjectStyle(subject);
    return {
      bg: style.bg,
      text: style.text,
      dot: style.accent ? `bg-[${style.accent}]` : style.bg
    };
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* 標題和週摘要 */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
          📊 本週學習回顧
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {weekStats.weekRange.start} ~ {weekStats.weekRange.end}
        </p>
        
        {/* 週摘要 */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center mb-2">
            <span className="text-xl mr-2">{getLearningPatternEmoji(weekStats.weekSummary.learningPattern)}</span>
            <span className="font-semibold text-gray-800">{getLearningPatternText(weekStats.weekSummary.learningPattern)}學習模式</span>
          </div>
          <p className="text-sm text-gray-700">{weekStats.weekSummary.summary}</p>
        </div>
      </motion.div>

      {/* 核心統計數據 */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 text-center">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-lg font-bold text-blue-600">{weekStats.checkInCount}</div>
          <div className="text-xs text-gray-600">打卡次數</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 text-center">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-lg font-bold text-green-600">{weekStats.completedTaskCount}</div>
          <div className="text-xs text-gray-600">完成任務</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-200 text-center">
          <div className="text-2xl mb-1">{getEnergyEmoji(weekStats.averageEnergy)}</div>
          <div className="text-lg font-bold text-orange-600">{weekStats.averageEnergy}/5</div>
          <div className="text-xs text-gray-600">平均能量</div>
        </div>
      </motion.div>

      {/* 每日打卡詳情 */}
      <motion.div variants={itemVariants} className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">📅</span>
          每日學習軌跡
        </h3>
        <div className="space-y-2">
          {weekStats.dailyCheckIns.map((day, index) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-800">
                    {day.dayOfWeek}
                  </div>
                  <div className="flex items-center space-x-2">
                    {day.checkInCount > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                        {day.checkInCount} 次打卡
                      </span>
                    )}
                    {day.mood && (
                      <span className="text-lg">{getMoodEmoji(day.mood)}</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {day.date}
                </div>
              </div>
              
              {/* 該日學習的任務 */}
              {day.topics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {day.topics.map((task, taskIndex) => {
                    const colors = getSubjectColor(task.subject || '其他');
                    return (
                      <span
                        key={taskIndex}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${colors.bg} ${colors.text}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} mr-1.5`} />
                        {task.title}
                        {task.recordCount > 1 && (
                          <span className="ml-1 font-medium">({task.recordCount})</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 能量變化趨勢 */}
      {weekStats.energyTimeline.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">📊</span>
            能量變化軌跡
          </h3>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-end justify-between gap-1 h-20">
              {weekStats.energyTimeline.map((point, index) => {
                const height = (point.energy / 5) * 100;
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <motion.div
                      className="bg-gradient-to-t from-indigo-400 to-purple-400 rounded-t-lg min-h-[4px] w-full"
                      style={{ height: `${height}%` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      title={`${point.date}: ${point.energy}/5`}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {getMoodEmoji(point.mood)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* 完成的任務列表 */}
      {weekStats.mainTasks.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            完成的任務
          </h3>
          <div className="space-y-2">
            {weekStats.mainTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">{task.title}</h4>
                    <p className="text-xs text-gray-600">{task.topic}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${
                          i < task.difficulty ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 進行中的任務 */}
      {weekStats.inProgressTasks.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">🔄</span>
            正在進行的任務
          </h3>
          <div className="space-y-2">
            {weekStats.inProgressTasks.slice(0, 3).map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">{task.title}</h4>
                    <p className="text-xs text-gray-600">{task.topic}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {task.daysInProgress > 0 && `進行 ${task.daysInProgress} 天`}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 關鍵字標籤 */}
      {weekStats.weekSummary.keywords.length > 0 && (
        <motion.div variants={itemVariants} className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">🏷️</span>
            本週關鍵字
          </h3>
          <div className="flex flex-wrap gap-2">
            {weekStats.weekSummary.keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 border border-orange-200"
              >
                {keyword}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}; 