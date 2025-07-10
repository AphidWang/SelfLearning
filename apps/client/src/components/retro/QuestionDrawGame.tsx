/**
 * QuestionDrawGame - 問題選擇卡片
 * 
 * 🎯 功能：
 * - 緊湊的三張卡片選擇
 * - 重抽機制
 * - 直接選擇確認
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRetroStore } from '../../store/retroStore';
import type { RetroQuestion } from '../../types/retro';

interface QuestionDrawGameProps {
  onQuestionSelect: (question: RetroQuestion) => void;
  onBack: () => void;
  drawnQuestions: RetroQuestion[];
  setDrawnQuestions: (questions: RetroQuestion[]) => void;
}

export const QuestionDrawGame: React.FC<QuestionDrawGameProps> = ({
  onQuestionSelect,
  onBack,
  drawnQuestions,
  setDrawnQuestions
}) => {
  const { drawQuestions } = useRetroStore();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // 問題類型對應的顏色和圖標
  const getQuestionStyle = (type: RetroQuestion['type']) => {
    const styles = {
      reflection: {
        color: 'from-blue-400 to-cyan-400',
        bg: 'from-blue-50 to-cyan-50',
        border: 'border-blue-200',
        emoji: '🤔'
      },
      growth: {
        color: 'from-green-400 to-emerald-400',
        bg: 'from-green-50 to-emerald-50',
        border: 'border-green-200',
        emoji: '🌱'
      },
      challenge: {
        color: 'from-red-400 to-pink-400',
        bg: 'from-red-50 to-pink-50',
        border: 'border-red-200',
        emoji: '💪'
      },
      gratitude: {
        color: 'from-yellow-400 to-orange-400',
        bg: 'from-yellow-50 to-orange-50',
        border: 'border-yellow-200',
        emoji: '🙏'
      },
      planning: {
        color: 'from-purple-400 to-indigo-400',
        bg: 'from-purple-50 to-indigo-50',
        border: 'border-purple-200',
        emoji: '📋'
      }
    };
    return styles[type] || styles.reflection;
  };

  // 抽取三張問題卡
  const handleDraw = async () => {
    try {
      setIsDrawing(true);
      setSelectedQuestionId(null);
      
      // 轉盤動畫延遲
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const excludeIds = drawnQuestions.map(q => q.id);
      const result = drawQuestions(excludeIds);
      
      setDrawnQuestions(result.questions);
      setIsDrawing(false);
      
    } catch (error) {
      console.error('抽籤失敗:', error);
      setIsDrawing(false);
    }
  };

  // 重抽
  const handleRedraw = () => {
    setSelectedQuestionId(null);
    handleDraw();
  };

  // 選擇問題
  const handleQuestionSelect = (question: RetroQuestion) => {
    setSelectedQuestionId(question.id);
  };

  // 確認選擇
  const handleConfirmSelection = () => {
    const selected = drawnQuestions.find(q => q.id === selectedQuestionId);
    if (selected) {
      onQuestionSelect(selected);
    }
  };

  // 初始抽取
  useEffect(() => {
    if (drawnQuestions.length === 0) {
      handleDraw();
    }
  }, []);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border-2 border-orange-200 shadow-xl max-w-5xl mx-auto">
      {/* 頂部標題和關閉按鈕 */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <h2 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-1">
            🎯 選擇回顧問題
          </h2>
          <p className="text-gray-600 text-sm">
            從下面三張卡片中選擇一個問題開始你的回顧
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
          title="關閉"
        >
          <span className="text-gray-600">✕</span>
        </button>
      </div>

      {/* 轉盤動畫 */}
      {isDrawing && (
        <div className="text-center py-12">
          <div className="relative mb-8">
            {/* 轉盤背景 */}
            <div className="w-32 h-32 mx-auto relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                className="w-full h-full rounded-full bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 relative"
              >
                {/* 轉盤分段 */}
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                    className="text-2xl"
                  >
                    🎯
                  </motion.div>
                </div>
                
                {/* 轉盤指針 */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-orange-500"></div>
                </div>
              </motion.div>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-lg font-medium text-gray-800 mb-2">🎪 問題轉盤旋轉中...</div>
            <p className="text-gray-600">正在為你挑選最適合的回顧問題</p>
          </motion.div>
        </div>
      )}

      {/* 三張問題卡片 */}
      {!isDrawing && drawnQuestions.length > 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {drawnQuestions.map((question, index) => {
              const style = getQuestionStyle(question.type);
              const isSelected = selectedQuestionId === question.id;
              
              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative cursor-pointer transition-all duration-300 ${
                    isSelected ? 'transform scale-105' : 'hover:scale-102'
                  }`}
                  onClick={() => handleQuestionSelect(question)}
                >
                  <div className={`
                    p-6 rounded-2xl border-2 transition-all duration-300
                    bg-gradient-to-br ${style.bg}
                    ${isSelected ? 'border-orange-400 shadow-xl ring-4 ring-orange-100' : `${style.border} shadow-lg hover:shadow-xl`}
                  `}>
                    {/* 問題類型標籤 */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 bg-gradient-to-r ${style.color} text-white`}>
                      <span className="mr-1">{style.emoji}</span>
                      {question.type === 'reflection' && '深度反思'}
                      {question.type === 'growth' && '成長探索'}
                      {question.type === 'challenge' && '挑戰回顧'}
                      {question.type === 'gratitude' && '感恩時刻'}
                      {question.type === 'planning' && '未來規劃'}
                    </div>

                    {/* 問題內容 */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 leading-relaxed">
                      {question.question}
                    </h3>

                    {/* 提示 */}
                    {question.hint && (
                      <p className="text-sm text-gray-600 mb-3">
                        💡 {question.hint}
                      </p>
                    )}

                    {/* 難度指示器 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < question.difficulty ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                      
                      {/* 選中指示器 */}
                      {isSelected && (
                        <div className="flex items-center text-orange-600 text-sm font-medium">
                          <span className="mr-1">✓</span>
                          已選擇
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* 底部按鈕 */}
          <div className="flex items-center justify-center space-x-4">
            <motion.button
              onClick={handleRedraw}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>重新抽取</span>
            </motion.button>

            <motion.button
              onClick={handleConfirmSelection}
              disabled={!selectedQuestionId}
              whileHover={selectedQuestionId ? { scale: 1.05 } : {}}
              whileTap={selectedQuestionId ? { scale: 0.95 } : {}}
              className={`px-8 py-3 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 ${
                selectedQuestionId
                  ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>✨</span>
              <span>開始回顧</span>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}; 