/**
 * AnswerInputCard - 回答輸入卡片
 * 
 * 🎯 功能：
 * - 顯示選中的問題和提示
 * - 提供豐富的文字輸入體驗
 * - 心情選擇和表情符號支援
 * - 即時字數統計和提示
 * - 溫馨的引導和鼓勵
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RetroQuestion } from '../../types/retro';

interface AnswerInputCardProps {
  question: string;
  questionType: RetroQuestion['type'];
  hint?: string;
  example?: string;
  isCustomQuestion: boolean;
  onSubmit: (answer: string, mood: 'excited' | 'happy' | 'okay' | 'tired' | 'stressed', emoji?: string) => void;
  onBack: () => void;
  submitButtonText?: string;
  questionIndex?: number;
  totalQuestions?: number;
}

export const AnswerInputCard: React.FC<AnswerInputCardProps> = ({
  question,
  questionType,
  hint,
  example,
  isCustomQuestion,
  onSubmit,
  onBack,
  submitButtonText = '提交回答',
  questionIndex,
  totalQuestions
}) => {
  const [answer, setAnswer] = useState('');
  const [selectedMood, setSelectedMood] = useState<'excited' | 'happy' | 'okay' | 'tired' | 'stressed'>('okay');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 心情選項
  const moodOptions = [
    { value: 'excited', emoji: '🤩', color: 'from-pink-400 to-red-400' },
    { value: 'happy', emoji: '😊', color: 'from-yellow-400 to-orange-400' },
    { value: 'okay', emoji: '😌', color: 'from-blue-400 to-cyan-400' },
    { value: 'tired', emoji: '😴', color: 'from-purple-400 to-indigo-400' },
    { value: 'stressed', emoji: '😰', color: 'from-gray-400 to-gray-500' }
  ] as const;

  // 常用表情符號
  const commonEmojis = [
    '😊', '😄', '🥰', '😍', '🤗', '😌', '🤔', '😅', '😂', '🎉',
    '🌟', '✨', '💪', '👏', '🙌', '❤️', '💖', '🔥', '⭐', '🌈',
    '📚', '🎯', '💡', '🚀', '🏆', '🎊', '🌸', '🌱', '🦋', '🎈'
  ];

  // 問題類型對應的樣式
  const getQuestionTypeStyle = (type: RetroQuestion['type']) => {
    const styles = {
      reflection: { emoji: '🤔', color: 'from-blue-400 to-cyan-400' },
      growth: { emoji: '🌱', color: 'from-green-400 to-emerald-400' },
      challenge: { emoji: '💪', color: 'from-red-400 to-pink-400' },
      gratitude: { emoji: '🙏', color: 'from-yellow-400 to-orange-400' },
      planning: { emoji: '📋', color: 'from-purple-400 to-indigo-400' }
    };
    return styles[type] || styles.reflection;
  };

  const typeStyle = getQuestionTypeStyle(questionType);

  // 自動調整文字區域高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [answer]);

  // 插入表情符號
  const insertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newAnswer = answer.substring(0, start) + emoji + answer.substring(end);
      setAnswer(newAnswer);
      
      // 重新設置光標位置
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + emoji.length;
          textareaRef.current.focus();
        }
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  // 提交回答
  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(answer.trim(), selectedMood, selectedEmoji);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 字數統計和建議
  const getWordCountInfo = () => {
    const wordCount = answer.trim().length;
    if (wordCount === 0) return { text: '開始寫下你的想法吧！', color: 'text-gray-500' };
    if (wordCount < 20) return { text: '可以再多寫一些喔～', color: 'text-orange-500' };
    if (wordCount < 50) return { text: '寫得很好！', color: 'text-green-500' };
    if (wordCount < 100) return { text: '內容很豐富呢！', color: 'text-blue-500' };
    return { text: '哇！寫得超詳細的！', color: 'text-purple-500' };
  };

  const wordCountInfo = getWordCountInfo();

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border-2 border-orange-200 shadow-lg">
      {/* 標題和問題顯示 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="text-3xl mr-2">{typeStyle.emoji}</div>
          <div className="text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              {isCustomQuestion ? '✏️ 自訂問題' : '💭 回顧時光'}
            </h2>
            {questionIndex && totalQuestions && (
              <p className="text-sm text-gray-600 mt-1">
                問題 {questionIndex} / {totalQuestions}
              </p>
            )}
          </div>
        </div>
        
        <div className={`mx-auto max-w-2xl p-6 rounded-xl bg-gradient-to-r ${typeStyle.color} text-white shadow-lg`}>
          <h3 className="text-lg font-medium mb-2">{question}</h3>
          {hint && (
            <p className="text-sm opacity-90">
              💡 {hint}
            </p>
          )}
        </div>
      </motion.div>

      {/* 示例顯示 */}
      {example && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200"
        >
          <h4 className="font-medium text-gray-700 mb-2 flex items-center">
            <span className="mr-2">✨</span>
            參考示例
          </h4>
          <p className="text-sm text-gray-600 italic">"{example}"</p>
        </motion.div>
      )}

      {/* 回答輸入區域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="在這裡寫下你的想法和感受... 想到什麼就寫什麼，沒有對錯之分 😊"
            className="w-full min-h-[120px] max-h-[300px] p-4 border-2 border-orange-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent bg-white/50 backdrop-blur-sm"
            style={{ overflow: 'hidden' }}
          />
          
          {/* 表情符號按鈕 */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute bottom-4 right-4 p-2 text-2xl hover:bg-orange-100 rounded-lg transition-colors duration-200"
            title="添加表情符號"
          >
            😊
          </button>
        </div>

        {/* 字數統計 */}
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className={wordCountInfo.color}>{wordCountInfo.text}</span>
          <span className="text-gray-500">{answer.trim().length} 字</span>
        </div>
      </motion.div>

      {/* 表情符號選擇器 */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-orange-200 shadow-lg"
          >
            <h4 className="font-medium text-gray-700 mb-3">選擇表情符號</h4>
            <div className="grid grid-cols-10 gap-2">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="text-2xl p-2 hover:bg-orange-100 rounded-lg transition-colors duration-200"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {      /* 心情選擇 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <h4 className="font-medium text-gray-700 mb-3 text-center">現在的心情如何？</h4>
        <div className="flex justify-center space-x-2">
          {moodOptions.map((mood) => (
            <motion.button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedMood === mood.value
                  ? `border-orange-400 bg-gradient-to-r ${mood.color} text-white shadow-lg`
                  : 'border-gray-200 bg-white/50 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl">{mood.emoji}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* 鼓勵訊息 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mb-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200"
      >
        <div className="text-center">
          <div className="text-xl mb-2">🌟</div>
          <p className="text-sm text-gray-600">
            每一次回顧都是成長的機會！誠實地分享你的想法，沒有標準答案 💕
          </p>
        </div>
      </motion.div>

      {/* 操作按鈕 */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors duration-200"
        >
          ← 重新選擇問題
        </button>
        
        <motion.button
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          whileHover={{ scale: answer.trim() ? 1.05 : 1 }}
          whileTap={{ scale: answer.trim() ? 0.95 : 1 }}
          className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
            answer.trim() && !isSubmitting
              ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>儲存中...</span>
            </>
          ) : (
            <>
              <span>✅</span>
              <span>{submitButtonText}</span>
            </>
          )}
        </motion.button>
      </div>

      {/* 底部提示 */}
      <div className="text-center mt-6">
        <p className="text-xs text-gray-500">
          💡 小提示：回顧沒有對錯，重要的是誠實面對自己的感受
        </p>
      </div>
    </div>
  );
}; 