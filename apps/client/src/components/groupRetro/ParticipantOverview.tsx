/**
 * ParticipantOverview - 參與者概覽組件
 * 
 * 🎯 功能說明：
 * - 展示每位參與者的本週學習概覽
 * - 提供討論的脈絡參考
 * - 避免比較評比，強調個人成長
 * - 營造溫暖鼓勵的氛圍
 * 
 * 🏗️ 架構設計：
 * - 使用 GroupRetroStore 獲取參與者資料
 * - 響應式網格佈局
 * - 個人化的顏色主題
 * - 動畫效果
 * 
 * 🎨 視覺設計：
 * - 非競爭性的資料呈現
 * - 溫暖的色彩搭配
 * - 圖標和數據的視覺化
 * - 鼓勵性的文案
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  CheckCircle2, 
  BookOpen, 
  Target, 
  Star, 
  Heart, 
  Sparkles,
  TrendingUp,
  Coffee,
  Zap
} from 'lucide-react';
import { useGroupRetroStore } from '../../store/groupRetroStore';
import type { ParticipantWeeklySummary } from '../../types/groupRetro';

interface ParticipantCardProps {
  participant: ParticipantWeeklySummary;
  index: number;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, index }) => {
  const { user, weeklyStats, mainTopics, energyDescription, colorTheme } = participant;
  
  // 用戶頭像或初始化字母
  const userInitial = user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U';
  
  // 能量等級對應的圖標和顏色
  const energyConfig = useMemo(() => {
    const level = weeklyStats.averageEnergy;
    if (level >= 5) return { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' };
    if (level >= 4) return { icon: Star, color: 'text-green-500', bg: 'bg-green-50' };
    if (level >= 3) return { icon: Heart, color: 'text-blue-500', bg: 'bg-blue-50' };
    if (level >= 2) return { icon: Coffee, color: 'text-purple-500', bg: 'bg-purple-50' };
    return { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-50' };
  }, [weeklyStats.averageEnergy]);
  
  const EnergyIcon = energyConfig.icon;
  
  // 鼓勵性的描述
  const encouragementText = useMemo(() => {
    if (weeklyStats.checkInCount >= 5) return '本週很規律！';
    if (weeklyStats.checkInCount >= 3) return '保持得不錯！';
    if (weeklyStats.checkInCount >= 1) return '開始了就很棒！';
    return '期待你的分享！';
  }, [weeklyStats.checkInCount]);
  
  return (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:shadow-md transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* 用戶頭像和名稱 */}
      <div className="flex items-center space-x-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${colorTheme}`}>
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name || '用戶'} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-lg">{userInitial}</span>
          )}
        </div>
        <div>
          <h3 className="font-medium text-gray-800 text-lg">
            {user.name || '匿名用戶'}
          </h3>
          <p className="text-sm text-gray-500">{encouragementText}</p>
        </div>
      </div>
      
      {/* 學習概覽數據 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 打卡次數 */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">打卡次數</p>
            <p className="font-semibold text-gray-800">{weeklyStats.checkInCount} 次</p>
          </div>
        </div>
        
        {/* 完成任務 */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">完成任務</p>
            <p className="font-semibold text-gray-800">{weeklyStats.completedTaskCount} 個</p>
          </div>
        </div>
      </div>
      
      {/* 能量狀態 */}
      <div className={`${energyConfig.bg} rounded-lg p-3 mb-4`}>
        <div className="flex items-center space-x-2 mb-1">
          <EnergyIcon className={`w-4 h-4 ${energyConfig.color}`} />
          <span className="text-sm font-medium text-gray-700">本週能量</span>
        </div>
        <p className="text-sm text-gray-600">{energyDescription}</p>
      </div>
      
      {/* 主要主題 */}
      {mainTopics.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">主要主題</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {mainTopics.slice(0, 3).map((topic, topicIndex) => (
              <span
                key={topicIndex}
                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
              >
                {topic}
              </span>
            ))}
            {mainTopics.length > 3 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{mainTopics.length - 3} 個
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const ParticipantOverview: React.FC = () => {
  const { currentSession, selectedParticipants } = useGroupRetroStore();
  
  // 使用當前會話的參與者，如果沒有則使用選擇的參與者
  const participants = currentSession?.participants || selectedParticipants;
  
  // 計算整體統計（用於展示團隊氛圍，非比較）
  const teamStats = useMemo(() => {
    if (participants.length === 0) return null;
    
    const totalCheckIns = participants.reduce((sum, p) => sum + p.weeklyStats.checkInCount, 0);
    const totalCompletedTasks = participants.reduce((sum, p) => sum + p.weeklyStats.completedTaskCount, 0);
    const averageEnergy = participants.reduce((sum, p) => sum + p.weeklyStats.averageEnergy, 0) / participants.length;
    
    // 收集所有主題（去重）
    const allTopics = new Set<string>();
    participants.forEach(p => {
      p.mainTopics.forEach(topic => allTopics.add(topic));
    });
    
    return {
      totalCheckIns,
      totalCompletedTasks,
      averageEnergy: Math.round(averageEnergy * 10) / 10,
      uniqueTopics: allTopics.size
    };
  }, [participants]);
  
  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-sm">還沒有參與者資料</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 團隊氛圍概覽 */}
      {teamStats && (
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-6 border-2 border-orange-200">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-800">本週小組學習氛圍</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{teamStats.totalCheckIns}</p>
              <p className="text-xs text-gray-600">總打卡次數</p>
            </div>
            
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center justify-center mb-1">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{teamStats.totalCompletedTasks}</p>
              <p className="text-xs text-gray-600">完成任務總數</p>
            </div>
            
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center justify-center mb-1">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{teamStats.averageEnergy}</p>
              <p className="text-xs text-gray-600">平均能量指數</p>
            </div>
            
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center justify-center mb-1">
                <BookOpen className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{teamStats.uniqueTopics}</p>
              <p className="text-xs text-gray-600">涵蓋主題數</p>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              🌟 大家都在努力學習，每個人的進步都很珍貴！
            </p>
          </div>
        </div>
      )}
      
      {/* 個人學習概覽 */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">個人學習概覽</h3>
          <span className="text-sm text-gray-500">（僅作脈絡參考）</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant, index) => (
            <ParticipantCard
              key={participant.user.id}
              participant={participant}
              index={index}
            />
          ))}
        </div>
      </div>
      
      {/* 討論提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">討論小貼士</h4>
            <p className="text-sm text-blue-700">
              每個人的學習節奏都不同，讓我們專注於分享經驗和互相學習，而非比較成績。
              看看大家都在學什麼有趣的主題，有什麼好方法可以互相交流！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 