/**
 * QuestionDrawGame - 問題抽取遊戲
 * 
 * 🎯 功能：
 * - 遊戲化的問題抽籤體驗
 * - 轉盤動畫和視覺效果
 * - 重抽機制 (最多一次)
 * - 自訂問題選項
 * - 問題選擇和確認
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRetroStore } from '../../store/retroStore';
import type { RetroQuestion } from '../../types/retro';

interface QuestionDrawGameProps {
  onQuestionSelect: (question: RetroQuestion) => void;
  onCustomQuestion: (question: string) => void;
  onBack: () => void;
  drawnQuestions: RetroQuestion[];
  setDrawnQuestions: (questions: RetroQuestion[]) => void;
}

export const QuestionDrawGame: React.FC<QuestionDrawGameProps> = ({
  onQuestionSelect,
  onCustomQuestion,
  onBack,
  drawnQuestions,
  setDrawnQuestions
}) => {
  const { drawQuestions, questionBank } = useRetroStore();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [rerollsLeft, setRerollsLeft] = useState(1);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
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

  // 抽籤動畫
  const handleDraw = async () => {
    try {
      setIsSpinning(true);
      setShowQuestions(false);
      
      // 模擬轉盤動畫延遲
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const excludeIds = drawnQuestions.map(q => q.id);
      const result = drawQuestions(excludeIds);
      
      setDrawnQuestions(result.questions);
      setIsSpinning(false);
      setShowQuestions(true);
      
    } catch (error) {
      console.error('抽籤失敗:', error);
      setIsSpinning(false);
    }
  };

  // 重抽
  const handleReroll = () => {
    if (rerollsLeft > 0) {
      setRerollsLeft(prev => prev - 1);
      setSelectedQuestionId(null);
      handleDraw();
    }
  };

  // 選擇問題
  const handleQuestionClick = (question: RetroQuestion) => {
    setSelectedQuestionId(question.id);
  };

  // 確認選擇
  const handleConfirmSelection = () => {
    const selected = drawnQuestions.find(q => q.id === selectedQuestionId);
    if (selected) {
      onQuestionSelect(selected);
    }
  };

  // 提交自訂問題
  const handleCustomSubmit = () => {
    if (customQuestionText.trim()) {
      onCustomQuestion(customQuestionText.trim());
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-orange-200 shadow-lg">
      {/* 標題 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
          🎲 問題幸運輪盤
        </h2>
        <p className="text-gray-600">
          點擊轉盤來抽取今天的回顧問題吧！
        </p>
      </div>

      {/* 轉盤區域 */}
      {!showQuestions && !showCustomInput && (
        <div className="text-center mb-8">
          <motion.div
            className="relative mx-auto w-48 h-48 mb-8"
            animate={isSpinning ? { rotate: 360 } : {}}
            transition={isSpinning ? { duration: 2, ease: "easeOut" } : {}}
          >
            {/* 轉盤背景 */}
            <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-200 via-pink-200 to-purple-200 border-4 border-white shadow-lg flex items-center justify-center">
              {isSpinning ? (
                <div className="text-4xl animate-bounce">🎯</div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">🎪</div>
                  <div className="text-sm font-medium text-gray-700">點擊抽籤</div>
                </div>
              )}
            </div>
            
            {/* 轉盤指針 */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-orange-500"></div>
            </div>
          </motion.div>

          <div className="space-y-4">
            <motion.button
              onClick={handleDraw}
              disabled={isSpinning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-8 py-4 bg-gradient-to-r from-orange-400 to-pink-400 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                isSpinning ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSpinning ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>轉盤轉動中...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>🎲</span>
                  <span>開始抽籤</span>
                </span>
              )}
            </motion.button>
            
            <div className="text-center">
              <button
                onClick={() => setShowCustomInput(true)}
                className="text-sm text-orange-600 hover:text-orange-700 underline"
              >
                我想自己提問 ✏️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 抽中的問題列表 */}
      <AnimatePresence>
        {showQuestions && drawnQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                🎉 恭喜！抽到了這些問題
              </h3>
              <p className="text-sm text-gray-600">選擇一個你最想回答的問題吧！</p>
            </div>

            <div className="space-y-4 mb-6">
              {drawnQuestions.map((question, index) => {
                const style = getQuestionStyle(question.type);
                const isSelected = selectedQuestionId === question.id;
                
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    onClick={() => handleQuestionClick(question)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-pink-50 shadow-lg transform scale-105' 
                        : `${style.border} bg-gradient-to-r ${style.bg} hover:shadow-md hover:scale-102`
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl">{style.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${style.color}`}>
                            {question.type === 'reflection' && '反思'}
                            {question.type === 'growth' && '成長'}
                            {question.type === 'challenge' && '挑戰'}
                            {question.type === 'gratitude' && '感恩'}
                            {question.type === 'planning' && '計劃'}
                          </span>
                          <div className="flex">
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
                        </div>
                        <h4 className="font-medium text-gray-800 mb-2">{question.question}</h4>
                        {question.hint && (
                          <p className="text-sm text-gray-600 mb-2">
                            💡 <strong>提示：</strong>{question.hint}
                          </p>
                        )}
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 p-3 bg-white/50 rounded-lg"
                          >
                            <p className="text-sm text-gray-600">
                              <strong>✨ 就是這個問題！</strong> 點擊下方確認按鈕開始回答。
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 操作按鈕 */}
            <div className="flex justify-center space-x-4">
              <motion.button
                onClick={handleReroll}
                disabled={rerollsLeft === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  rerollsLeft > 0
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                🔄 重抽 ({rerollsLeft})
              </motion.button>

              <motion.button
                onClick={handleConfirmSelection}
                disabled={!selectedQuestionId}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedQuestionId
                    ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                ✅ 確認選擇
              </motion.button>
            </div>

            {/* 自訂問題選項 */}
            <div className="text-center mt-6">
              <button
                onClick={() => setShowCustomInput(true)}
                className="text-sm text-orange-600 hover:text-orange-700 underline"
              >
                還是想自己提問？點這裡 ✏️
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 自訂問題輸入 */}
      <AnimatePresence>
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                ✏️ 自訂回顧問題
              </h3>
              <p className="text-sm text-gray-600">想聊什麼都可以，寫下你想回顧的問題吧！</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <textarea
                value={customQuestionText}
                onChange={(e) => setCustomQuestionText(e.target.value)}
                placeholder="例如：這週最讓我感到驕傲的事情是什麼？"
                className="w-full h-32 p-4 border border-purple-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
              />
              
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomQuestionText('');
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                >
                  取消
                </button>
                <motion.button
                  onClick={handleCustomSubmit}
                  disabled={!customQuestionText.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-8 py-2 rounded-lg font-medium transition-all duration-200 ${
                    customQuestionText.trim()
                      ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  開始回答 ✨
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 返回按鈕 */}
      <div className="text-center">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center mx-auto space-x-2"
        >
          <span>←</span>
          <span>返回週回顧</span>
        </button>
      </div>
    </div>
  );
}; 