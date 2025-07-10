/**
 * WeekOverviewCard - 週學習概覽卡片
 * 
 * 🎯 功能：
 * - 顯示本週打卡次數、完成任務、平均能量
 * - 展示主要完成的任務和主題
 * - 提供友善的視覺化呈現
 * - 引導用戶進入回顧流程
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { WeeklyStats } from '../../types/retro';

interface WeekOverviewCardProps {
  weekStats: WeeklyStats | null;
  onNext: () => void;
}

export const WeekOverviewCard: React.FC<WeekOverviewCardProps> = ({
  weekStats,
  onNext
}) => {
  if (!weekStats) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-orange-200 shadow-lg">
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

  const getEnergyText = (energy: number) => {
    if (energy >= 5) return '超級棒！';
    if (energy >= 4) return '很不錯！';
    if (energy >= 3) return '還可以';
    if (energy >= 2) return '有點累';
    return '需要休息';
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
      className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* 標題 */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
          📊 本週學習回顧
        </h2>
        <p className="text-gray-600">
          {weekStats.weekRange.start} ~ {weekStats.weekRange.end}
        </p>
      </motion.div>

      {/* 統計數據網格 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 打卡次數 */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 hover:scale-105 transition-transform duration-200"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {weekStats.checkInCount}
            </div>
            <div className="text-sm text-gray-600">打卡次數</div>
          </div>
        </motion.div>

        {/* 完成任務 */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 hover:scale-105 transition-transform duration-200"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {weekStats.completedTaskCount}
            </div>
            <div className="text-sm text-gray-600">完成任務</div>
          </div>
        </motion.div>

        {/* 平均能量 */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-6 border border-orange-200 hover:scale-105 transition-transform duration-200 md:col-span-2 lg:col-span-1"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">{getEnergyEmoji(weekStats.averageEnergy)}</div>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {weekStats.averageEnergy}/5
            </div>
            <div className="text-sm text-gray-600">{getEnergyText(weekStats.averageEnergy)}</div>
          </div>
        </motion.div>
      </div>

      {/* 主要任務清單 */}
      {weekStats.mainTasks.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            本週主要完成的任務
          </h3>
          <div className="space-y-3">
            {weekStats.mainTasks.slice(0, 3).map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
                    <p className="text-sm text-gray-600">{task.topic}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
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
                </div>
              </motion.div>
            ))}
            {weekStats.mainTasks.length > 3 && (
              <div className="text-center text-sm text-gray-500">
                還有 {weekStats.mainTasks.length - 3} 個任務...
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 主要主題清單 */}
      {weekStats.mainTopics.length > 0 && (
        <motion.div variants={itemVariants} className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📚</span>
            本週學習的主題
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {weekStats.mainTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200"
              >
                <div className="mb-3">
                  <h4 className="font-medium text-gray-800 mb-1">{topic.title}</h4>
                  <p className="text-sm text-gray-600">{topic.subject}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">進度</span>
                    <span className="font-medium text-indigo-600">{topic.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${topic.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>任務 {topic.completedTaskCount}/{topic.taskCount}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 鼓勵訊息 */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 mb-8"
      >
        <div className="text-center">
          <div className="text-2xl mb-2">🌟</div>
          <h3 className="font-semibold text-gray-800 mb-2">這週的你真棒！</h3>
          <p className="text-sm text-gray-600">
            {weekStats.completedTaskCount > 0
              ? `完成了 ${weekStats.completedTaskCount} 個任務，每一步都是進步！`
              : '雖然這週比較忙碌，但回顧也是很重要的學習呢！'
            }
          </p>
        </div>
      </motion.div>

      {/* 下一步按鈕 */}
      <motion.div variants={itemVariants} className="text-center">
        <motion.button
          onClick={onNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-gradient-to-r from-orange-400 to-pink-400 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center mx-auto space-x-2"
        >
          <span>開始回顧問答</span>
          <span className="text-lg">🎯</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}; 