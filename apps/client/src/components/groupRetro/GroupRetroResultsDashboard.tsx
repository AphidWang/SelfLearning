/**
 * GroupRetroResultsDashboard - 小組討論結果儀表板
 * 
 * 🎯 功能說明：
 * - 展示每個討論問題的所有回覆
 * - 統計參與者的回覆情況
 * - 顯示討論的整體概況
 * - 支援匯出和分享功能
 * 
 * 🏗️ 架構設計：
 * - 參考 AnswerInputCard 的設計風格
 * - 使用卡片式佈局展示問題和回覆
 * - 統計數據視覺化
 * - 響應式設計
 * 
 * 🎨 視覺設計：
 * - 遵循專案設計規範 [[memory:2569399]]
 * - 漸層背景和毛玻璃效果
 * - 溫暖色調和圓角設計
 * - 豐富的動畫效果
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Heart,
  Star,
  TrendingUp,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Clock,
  Target,
  Smile,
  Award,
  BookOpen,
  Sparkles,
  Save,
  CheckCircle
} from 'lucide-react';
import { useGroupRetroStore } from '../../store/groupRetroStore';
import { LoadingDots } from '../shared/LoadingDots';
import type { GroupRetroQuestion, GroupRetroReply } from '../../types/groupRetro';

interface QuestionResultCardProps {
  question: GroupRetroQuestion;
  replies: GroupRetroReply[];
  participants: any[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const QuestionResultCard: React.FC<QuestionResultCardProps> = ({
  question,
  replies,
  participants,
  isExpanded,
  onToggleExpand
}) => {
  // 問題類型對應的樣式
  const getQuestionTypeStyle = (type: GroupRetroQuestion['type']) => {
    const styles = {
      reflection: { emoji: '🤔', color: 'from-blue-400 to-cyan-400', bg: 'from-blue-50 to-cyan-50' },
      growth: { emoji: '🌱', color: 'from-green-400 to-emerald-400', bg: 'from-green-50 to-emerald-50' },
      challenge: { emoji: '💪', color: 'from-red-400 to-pink-400', bg: 'from-red-50 to-pink-50' },
      gratitude: { emoji: '🙏', color: 'from-yellow-400 to-orange-400', bg: 'from-yellow-50 to-orange-50' },
      planning: { emoji: '📋', color: 'from-purple-400 to-indigo-400', bg: 'from-purple-50 to-indigo-50' },
      custom: { emoji: '✏️', color: 'from-gray-400 to-gray-600', bg: 'from-gray-50 to-gray-100' }
    };
    return styles[type] || styles.reflection;
  };

  const typeStyle = getQuestionTypeStyle(question.type);
  const replyCount = replies.length;
  const participantCount = participants.length;
  const responseRate = participantCount > 0 ? Math.round((replyCount / participantCount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-md rounded-xl border-2 border-orange-200 shadow-lg overflow-hidden"
    >
      {/* 問題標題區域 */}
      <div className={`p-4 bg-gradient-to-r ${typeStyle.bg} border-b border-orange-200`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="text-2xl">{typeStyle.emoji}</div>
              <h3 className="font-bold text-gray-800">{question.title}</h3>
            </div>
            <p className="text-gray-700 text-sm mb-3">{question.content}</p>
            {question.guidance && (
              <p className="text-gray-600 text-xs bg-white/50 rounded-lg px-3 py-1">
                💡 {question.guidance}
              </p>
            )}
          </div>
          
          <button
            onClick={onToggleExpand}
            className="ml-4 p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* 統計資訊 */}
        <div className="flex items-center space-x-4 mt-3">
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <MessageSquare className="w-4 h-4" />
            <span>{replyCount} 個回覆</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{responseRate}% 參與率</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            responseRate >= 80 ? 'bg-green-100 text-green-700' :
            responseRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {responseRate >= 80 ? '🎉 熱烈' : responseRate >= 60 ? '👍 不錯' : '🤔 需要鼓勵'}
          </div>
        </div>
      </div>

      {/* 回覆展示區域 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {replies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>還沒有人回覆這個問題</p>
                  <p className="text-sm mt-1">鼓勵大家分享想法吧！</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {replies.map((reply) => (
                    <motion.div
                      key={reply.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-sm rounded-lg p-4 border border-purple-100"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {reply.user?.name?.charAt(0) || <User className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-800">
                              {reply.user?.name || '匿名用戶'}
                            </span>
                            {reply.emoji && (
                              <span className="text-lg">{reply.emoji}</span>
                            )}
                            {reply.mood && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                reply.mood === 'happy' ? 'bg-green-100 text-green-700' :
                                reply.mood === 'neutral' ? 'bg-gray-100 text-gray-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {reply.mood === 'happy' ? '😊 開心' :
                                 reply.mood === 'neutral' ? '😐 普通' :
                                 reply.mood === 'excited' ? '🤩 興奮' :
                                 reply.mood}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {reply.content}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(reply.createdAt).toLocaleString('zh-TW')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface GroupRetroResultsDashboardProps {
  onSaveComplete?: () => void;
}

export const GroupRetroResultsDashboard: React.FC<GroupRetroResultsDashboardProps> = ({ 
  onSaveComplete 
}) => {
  const {
    currentSession,
    selectedParticipants,
    getRepliesForQuestion,
    exportSession,
    updateSession,
    loading,
    error
  } = useGroupRetroStore();

  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const questions = currentSession?.questions || [];
  const participants = currentSession?.participants || selectedParticipants;
  const sessionTitle = currentSession?.title || '小組討論';

  // 當問題載入完成後，預設全部展開
  useEffect(() => {
    if (questions.length > 0) {
      setExpandedQuestions(new Set(questions.map(q => q.id)));
    }
  }, [questions]);

  // 切換問題展開狀態
  const toggleQuestionExpand = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  // 計算整體統計
  const overallStats = useMemo(() => {
    const totalQuestions = questions.length;
    const totalReplies = questions.reduce((sum, q) => sum + getRepliesForQuestion(q.id).length, 0);
    const totalParticipants = participants.length;
    const avgRepliesPerQuestion = totalQuestions > 0 ? Math.round(totalReplies / totalQuestions) : 0;
    const participationRate = totalParticipants > 0 && totalQuestions > 0 
      ? Math.round((totalReplies / (totalParticipants * totalQuestions)) * 100) 
      : 0;

    return {
      totalQuestions,
      totalReplies,
      totalParticipants,
      avgRepliesPerQuestion,
      participationRate
    };
  }, [questions, participants, getRepliesForQuestion]);

  // 匯出討論結果
  const handleExport = () => {
    if (currentSession) {
      exportSession(currentSession.id, 'markdown');
    }
  };

  // 儲存小組討論
  const handleSaveGroupRetro = async () => {
    if (!currentSession) return;
    
    setIsSaving(true);
    try {
      // 更新會話狀態為完成
      await updateSession(currentSession.id, {
        status: 'completed',
        title: currentSession.title,
        participantIds: currentSession.participants.map(p => p.user.id),
        settings: currentSession.settings
      });
      
      setIsSaved(true);
      setIsSaving(false);
      
      // 通知父組件儲存完成
      if (onSaveComplete) {
        onSaveComplete();
      }
      
      console.log('✅ 小組討論已儲存');
    } catch (error) {
      console.error('儲存失敗:', error);
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingDots />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 標題和整體統計 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* 右上角儲存按鈕 */}
        <div className="absolute top-0 right-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            key={isSaved ? 'saved' : 'save'}
          >
            {isSaved ? (
              // 已儲存狀態
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-medium rounded-xl shadow-lg">
                <CheckCircle className="w-4 h-4" />
                <span>討論已儲存</span>
              </div>
            ) : (
              // 可儲存狀態
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveGroupRetro}
                disabled={isSaving}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 ${
                  isSaving
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>儲存中...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>儲存小組討論</span>
                  </>
                )}
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* 標題內容 */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">討論結果總覽</h2>
          <p className="text-gray-600">大家的分享很精彩！一起來看看討論的成果</p>
        </div>
      </motion.div>

      {/* 整體統計卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-6 border-2 border-orange-200"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{overallStats.totalQuestions}</div>
            <div className="text-sm text-gray-600">討論問題</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{overallStats.totalReplies}</div>
            <div className="text-sm text-gray-600">總回覆數</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{overallStats.totalParticipants}</div>
            <div className="text-sm text-gray-600">參與夥伴</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{overallStats.participationRate}%</div>
            <div className="text-sm text-gray-600">參與率</div>
          </div>
        </div>
        
        {/* 參與評價 */}
        <div className="mt-6 text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
            overallStats.participationRate >= 80 ? 'bg-green-100 text-green-700' :
            overallStats.participationRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">
              {overallStats.participationRate >= 80 ? '🎉 討論非常熱烈！' :
               overallStats.participationRate >= 60 ? '👍 討論氣氛不錯！' :
               '🤔 可以鼓勵更多分享'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 問題回覆展示 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">問題回覆詳情</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setExpandedQuestions(new Set(questions.map(q => q.id)))}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              全部展開
            </button>
            <button
              onClick={() => setExpandedQuestions(new Set())}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              全部收起
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">還沒有討論問題</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <QuestionResultCard
                key={question.id}
                question={question}
                replies={getRepliesForQuestion(question.id)}
                participants={participants}
                isExpanded={expandedQuestions.has(question.id)}
                onToggleExpand={() => toggleQuestionExpand(question.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 操作按鈕 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center space-x-4"
      >
        <motion.button
          onClick={handleExport}
          className="px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-4 h-4" />
          匯出討論記錄
        </motion.button>
        
        <motion.button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: sessionTitle,
                text: `查看我們的小組討論結果：${sessionTitle}`,
                url: window.location.href
              });
            }
          }}
          className="px-6 py-3 bg-gradient-to-r from-green-400 to-teal-400 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Share2 className="w-4 h-4" />
          分享結果
        </motion.button>
      </motion.div>

      {/* 鼓勵訊息 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200 text-center"
      >
        <div className="text-2xl mb-2">🌟</div>
        <h4 className="font-bold text-gray-800 mb-2">討論完成！</h4>
        <p className="text-sm text-gray-600">
          透過分享和討論，大家不僅回顧了自己的學習，也學到了夥伴們的方法和經驗。
          繼續保持這樣的學習熱忱，一起成長！
        </p>
      </motion.div>
    </div>
  );
}; 