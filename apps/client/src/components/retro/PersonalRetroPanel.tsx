/**
 * PersonalRetroPanel - 個人 Retro 面板
 * 
 * 🎯 功能：
 * - 週完成概覽顯示
 * - 遊戲化問題抽取
 * - 回答輸入和儲存
 * - 溫馨引導和鼓勵
 * 
 * 🎨 設計風格：
 * - 漸層背景和毛玻璃效果
 * - 溫暖友善的色調
 * - 減壓的遊戲化元素
 * - 適合兒童使用的介面
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRetroStore } from '../../store/retroStore';
import { WeekOverviewCard } from './WeekOverviewCard';
import { QuestionDrawGame } from './QuestionDrawGame';
import { AnswerInputCard } from './AnswerInputCard';
import { LoadingDots } from '../shared/LoadingDots';
import type { RetroQuestion } from '../../types/retro';

export const PersonalRetroPanel: React.FC = () => {
  const {
    currentWeekStats,
    loading,
    error,
    getCurrentWeekStats,
    drawQuestions,
    createAnswer,
    getWeekId,
    clearError
  } = useRetroStore();

  const [currentStep, setCurrentStep] = useState<'overview' | 'question' | 'answer'>('overview');
  const [selectedQuestion, setSelectedQuestion] = useState<RetroQuestion | null>(null);
  const [drawnQuestions, setDrawnQuestions] = useState<RetroQuestion[]>([]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // 載入週統計數據
  useEffect(() => {
    getCurrentWeekStats().catch(console.error);
  }, [getCurrentWeekStats]);

  // 處理問題選擇
  const handleQuestionSelect = (question: RetroQuestion) => {
    setSelectedQuestion(question);
    setCurrentStep('answer');
  };

  // 處理自訂問題
  const handleCustomQuestion = (question: string) => {
    setCustomQuestion(question);
    setIsCustomMode(true);
    setCurrentStep('answer');
  };

  // 處理回答提交
  const handleAnswerSubmit = async (answer: string, mood: 'excited' | 'happy' | 'okay' | 'tired' | 'stressed', emoji?: string) => {
    try {
      const weekId = getWeekId();
      
      if (isCustomMode) {
        // 自訂問題模式
        await createAnswer({
          weekId,
          question: {
            id: 'custom',
            question: customQuestion,
            type: 'reflection',
            ageGroup: 'all',
            difficulty: 3,
            tags: ['自訂']
          },
          isCustomQuestion: true,
          customQuestion,
          answer,
          mood,
          emoji
        });
      } else if (selectedQuestion) {
        // 選擇問題模式
        await createAnswer({
          weekId,
          question: selectedQuestion,
          isCustomQuestion: false,
          answer,
          mood,
          emoji
        });
      }
      
      // 重置狀態
      setCurrentStep('overview');
      setSelectedQuestion(null);
      setCustomQuestion('');
      setIsCustomMode(false);
      setDrawnQuestions([]);
      
    } catch (error) {
      console.error('提交回答失敗:', error);
    }
  };

  // 返回上一步
  const handleBack = () => {
    switch (currentStep) {
      case 'answer':
        setCurrentStep('question');
        setSelectedQuestion(null);
        setIsCustomMode(false);
        setCustomQuestion('');
        break;
      case 'question':
        setCurrentStep('overview');
        setDrawnQuestions([]);
        break;
      default:
        break;
    }
  };

  if (loading && !currentWeekStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingDots />
          <p className="mt-4 text-gray-600">載入本週學習統計中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-4">
      {/* 標題區域 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
          ✨ 個人回顧時光 ✨
        </h1>
        <p className="text-gray-600">
          {currentStep === 'overview' && '讓我們一起回顧這週的學習旅程吧！'}
          {currentStep === 'question' && '轉一轉幸運輪盤，看看今天要聊什麼話題呢？'}
          {currentStep === 'answer' && '來分享你的想法和感受吧～'}
        </p>
      </motion.div>

      {/* 錯誤提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-red-100 border border-red-200 rounded-xl text-red-700"
          >
            <div className="flex items-center justify-between">
              <span>⚠️ {error}</span>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 步驟指示器 */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {['overview', 'question', 'answer'].map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep === step
                    ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white'
                    : index < ['overview', 'question', 'answer'].indexOf(currentStep)
                    ? 'bg-green-400 text-white'
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {index < ['overview', 'question', 'answer'].indexOf(currentStep) ? '✓' : index + 1}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep === step ? 'text-orange-600 font-medium' : 'text-gray-500'
                }`}>
                  {step === 'overview' && '週回顧'}
                  {step === 'question' && '選問題'}
                  {step === 'answer' && '寫回答'}
                </span>
              </div>
              {index < 2 && (
                <div className={`w-8 h-0.5 ${
                  index < ['overview', 'question', 'answer'].indexOf(currentStep)
                    ? 'bg-green-400'
                    : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {currentStep === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <WeekOverviewCard
                weekStats={currentWeekStats}
                onNext={() => setCurrentStep('question')}
              />
            </motion.div>
          )}

          {currentStep === 'question' && (
            <motion.div
              key="question"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <QuestionDrawGame
                onQuestionSelect={handleQuestionSelect}
                onCustomQuestion={handleCustomQuestion}
                onBack={handleBack}
                drawnQuestions={drawnQuestions}
                setDrawnQuestions={setDrawnQuestions}
              />
            </motion.div>
          )}

          {currentStep === 'answer' && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <AnswerInputCard
                question={isCustomMode ? customQuestion : selectedQuestion?.question || ''}
                questionType={selectedQuestion?.type || 'reflection'}
                hint={selectedQuestion?.hint}
                example={selectedQuestion?.example}
                isCustomQuestion={isCustomMode}
                onSubmit={handleAnswerSubmit}
                onBack={handleBack}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部鼓勵話語 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2"
      >
        <div className="bg-white/80 backdrop-blur-md rounded-full px-6 py-2 border border-orange-200 shadow-lg">
          <p className="text-sm text-gray-600 text-center">
            {currentStep === 'overview' && '🌟 每一步的成長都值得慶祝！'}
            {currentStep === 'question' && '🎲 好奇心是最好的老師～'}
            {currentStep === 'answer' && '💝 誠實的分享讓我們更了解自己'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}; 