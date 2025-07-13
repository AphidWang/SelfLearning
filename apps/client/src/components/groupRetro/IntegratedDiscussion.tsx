/**
 * IntegratedDiscussion - 整合討論組件
 * 
 * 🎯 功能說明：
 * - 整合問題和回覆的展示
 * - 問題 - 大家的回覆 - 問題 - 大家的回覆 的排列方式
 * - 新增問題功能在最下方
 * - 支援問題編輯和回覆管理
 * 
 * 🏗️ 架構設計：
 * - 結合 DiscussionQuestions 和 ReplyInput 的功能
 * - 統一的問題回覆流程
 * - 響應式設計
 * 
 * 🎨 視覺設計：
 * - 遵循專案設計規範 [[memory:2569399]]
 * - 清晰的問題回覆區分
 * - 流暢的用戶體驗
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Edit3,
  Save,
  X,
  Plus,
  Shuffle,
  Users,
  Send,
  Trash2,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useGroupRetroStore } from '../../store/groupRetroStore';
import { useUser } from '../../context/UserContext';
import { LoadingDots } from '../shared/LoadingDots';
import type { GroupRetroQuestion, GroupRetroReply, CreateGroupRetroReplyData } from '../../types/groupRetro';
import toast from 'react-hot-toast';

interface QuestionWithRepliesProps {
  question: GroupRetroQuestion;
  replies: GroupRetroReply[];
  participants: any[];
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<GroupRetroQuestion>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onAddReply: (questionId: string, data: CreateGroupRetroReplyData) => void;
  onUpdateReply: (replyId: string, content: string, mood?: string, emoji?: string) => void;
  onDeleteReply: (replyId: string) => void;
}

const QuestionWithReplies: React.FC<QuestionWithRepliesProps> = ({
  question,
  replies,
  participants,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onAddReply,
  onUpdateReply,
  onDeleteReply
}) => {
  const { currentUser } = useUser();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyMood, setReplyMood] = useState('');
  const [replyEmoji, setReplyEmoji] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  
  // 編輯問題狀態
  const [editTitle, setEditTitle] = useState(question.title);
  const [editContent, setEditContent] = useState(question.content);
  const [editGuidance, setEditGuidance] = useState(question.guidance || '');

  // 統計回覆情況
  const repliedParticipants = new Set(replies.map(r => r.userId));
  const unrepliedParticipants = participants.filter(p => !repliedParticipants.has(p.user.id));

  // 問題類型樣式
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

  // 處理問題保存
  const handleSaveQuestion = () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('問題標題和內容不能為空');
      return;
    }
    
    onSave({
      title: editTitle.trim(),
      content: editContent.trim(),
      guidance: editGuidance.trim() || undefined
    });
  };

  // 處理問題取消編輯
  const handleCancelEdit = () => {
    setEditTitle(question.title);
    setEditContent(question.content);
    setEditGuidance(question.guidance || '');
    onCancel();
  };

  // 處理添加回覆
  const handleAddReply = () => {
    if (!replyContent.trim()) {
      toast.error('回覆內容不能為空');
      return;
    }
    
    if (!selectedParticipant) {
      toast.error('請選擇要代表的參與者');
      return;
    }
    
    const replyData: CreateGroupRetroReplyData = {
      questionId: question.id,
      content: replyContent.trim(),
      mood: replyMood as GroupRetroReply['mood'] || undefined,
      emoji: replyEmoji || undefined,
      onBehalfOf: selectedParticipant
    };
    
    onAddReply(question.id, replyData);
    
    // 重置表單
    setReplyContent('');
    setReplyMood('');
    setReplyEmoji('');
    setSelectedParticipant('');
    setShowReplyForm(false);
  };

  // 處理回覆編輯
  const handleUpdateReply = (replyId: string, content: string, mood?: string, emoji?: string) => {
    onUpdateReply(replyId, content, mood, emoji);
    setEditingReplyId(null);
  };

  // 處理回覆刪除
  const handleDeleteReply = (replyId: string) => {
    if (window.confirm('確定要刪除這個回覆嗎？')) {
      onDeleteReply(replyId);
    }
  };

  return (
    <div className="space-y-6">
      {/* 問題卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-xl border-2 border-orange-200 shadow-lg overflow-hidden"
      >
        <div className={`p-4 bg-gradient-to-r ${typeStyle.bg} border-b border-orange-200`}>
          {isEditing ? (
            // 編輯模式
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="text-2xl">{typeStyle.emoji}</div>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/70 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="問題標題"
                />
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                rows={3}
                placeholder="問題內容"
              />
              <input
                type="text"
                value={editGuidance}
                onChange={(e) => setEditGuidance(e.target.value)}
                className="w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="引導提示（可選）"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSaveQuestion}
                  className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-lg hover:shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            // 顯示模式
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
              
              <div className="flex space-x-2">
                <button
                  onClick={onEdit}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('確定要刪除這個問題嗎？相關的回覆也會被刪除。')) {
                      onDelete();
                    }
                  }}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          )}

          {/* 回覆進度 */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {replies.length} / {participants.length} 位夥伴已回覆
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-400 to-pink-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(replies.length / participants.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {Math.round((replies.length / participants.length) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 大家的回覆 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-md rounded-xl border-2 border-blue-200 shadow-lg"
      >
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
          <h4 className="font-medium text-gray-800 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>大家的回覆</span>
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {replies.length} 個
            </span>
          </h4>
        </div>
        
        <div className="p-4">
          {replies.length === 0 ? (
            <div className="text-center py-8 text-blue-600">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-blue-300" />
              <p>還沒有人回覆這個問題</p>
              <p className="text-sm mt-1">成為第一個分享想法的人吧！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className="bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-sm rounded-lg p-4 border border-blue-100"
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
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {reply.content}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-500">
                          {new Date(reply.createdAt).toLocaleString('zh-TW')}
                        </div>
                        {currentUser?.id === reply.userId && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingReplyId(reply.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => handleDeleteReply(reply.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              刪除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 添加回覆表單 */}
          {currentUser && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              {!showReplyForm ? (
                <button
                  onClick={() => setShowReplyForm(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-lg hover:shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>代表夥伴輸入回覆</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                      {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <h4 className="font-medium text-gray-800">代表夥伴輸入回覆</h4>
                  </div>
                  
                  {/* 參與者選擇器 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      選擇要代表的夥伴
                    </label>
                    <select
                      value={selectedParticipant}
                      onChange={(e) => setSelectedParticipant(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    >
                      <option value="">請選擇夥伴</option>
                      {unrepliedParticipants.map((participant) => (
                        <option key={participant.user.id} value={participant.user.id}>
                          {participant.user.name || participant.user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 回覆內容 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      回覆內容
                    </label>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="寫下你的想法..."
                    />
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyContent('');
                        setSelectedParticipant('');
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddReply}
                      className="px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-lg hover:shadow-md transition-all flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>發送回覆</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const IntegratedDiscussion: React.FC = () => {
  const {
    currentSession,
    selectedParticipants,
    loading,
    error,
    addCustomQuestion,
    updateQuestion,
    deleteQuestion,
    drawQuestions,
    addReply,
    updateReply,
    deleteReply,
    getRepliesForQuestion
  } = useGroupRetroStore();

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 新增問題表單狀態
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [newQuestionGuidance, setNewQuestionGuidance] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<GroupRetroQuestion['type']>('custom');

  const questions = currentSession?.questions || [];
  const participants = currentSession?.participants || selectedParticipants;

  // 處理問題編輯
  const handleEditQuestion = (questionId: string) => {
    setEditingQuestionId(questionId);
  };

  const handleSaveQuestion = async (questionId: string, updates: Partial<GroupRetroQuestion>) => {
    try {
      await updateQuestion(questionId, updates);
      setEditingQuestionId(null);
      toast.success('問題更新成功');
    } catch (error) {
      toast.error('更新問題失敗');
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestion(questionId);
      toast.success('問題刪除成功');
    } catch (error) {
      toast.error('刪除問題失敗');
    }
  };

  // 處理新增問題
  const handleAddQuestion = async () => {
    if (!newQuestionTitle.trim() || !newQuestionContent.trim()) {
      toast.error('問題標題和內容不能為空');
      return;
    }
    
    if (!currentSession) {
      toast.error('沒有找到當前會話');
      return;
    }
    
    try {
      await addCustomQuestion(currentSession.id, {
        title: newQuestionTitle.trim(),
        content: newQuestionContent.trim(),
        guidance: newQuestionGuidance.trim() || undefined,
        type: newQuestionType,
        order: questions.length + 1,
        isDefault: false,
        ageGroup: 'all'
      });
      
      // 重置表單
      setNewQuestionTitle('');
      setNewQuestionContent('');
      setNewQuestionGuidance('');
      setNewQuestionType('custom');
      setShowAddForm(false);
      
      toast.success('問題新增成功');
    } catch (error) {
      toast.error('新增問題失敗');
    }
  };

  // 抽籤生成問題
  const handleDrawQuestions = () => {
    try {
      const drawResult = drawQuestions(2);
      toast.success(`抽到了 ${drawResult.questions.length} 個問題！`);
    } catch (error) {
      toast.error('抽籤失敗');
    }
  };

  // 處理回覆相關操作
  const handleAddReply = async (questionId: string, data: CreateGroupRetroReplyData) => {
    if (!currentSession) {
      toast.error('沒有找到當前會話');
      return;
    }
    
    try {
      await addReply(currentSession.id, data);
      toast.success('回覆發送成功！');
    } catch (error) {
      toast.error('發送回覆失敗');
    }
  };

  const handleUpdateReply = async (replyId: string, content: string, mood?: string, emoji?: string) => {
    try {
      await updateReply(replyId, { content, mood: mood as GroupRetroReply['mood'], emoji });
      toast.success('回覆更新成功！');
    } catch (error) {
      toast.error('更新回覆失敗');
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await deleteReply(replyId);
      toast.success('回覆刪除成功！');
    } catch (error) {
      toast.error('刪除回覆失敗');
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
    <div className="space-y-8">
      {/* 問題管理工具欄 */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">討論問題</h3>
          <span className="text-sm text-gray-500">({questions.length})</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDrawQuestions}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg hover:shadow-md transition-all"
          >
            <Shuffle className="w-4 h-4" />
            <span className="text-sm">抽籤問題</span>
          </button>
        </div>
      </div>

      {/* 問題和回覆列表 */}
      {questions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border-2 border-gray-200">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">還沒有討論問題</h3>
          <p className="text-gray-600 mb-6">開始添加問題來引導大家的討論吧！</p>
          <button
            onClick={handleDrawQuestions}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg hover:shadow-md transition-all mx-auto"
          >
            <Shuffle className="w-4 h-4" />
            <span>抽籤生成問題</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {questions.map((question) => (
            <QuestionWithReplies
              key={question.id}
              question={question}
              replies={getRepliesForQuestion(question.id)}
              participants={participants}
              isEditing={editingQuestionId === question.id}
              onEdit={() => handleEditQuestion(question.id)}
              onSave={(updates) => handleSaveQuestion(question.id, updates)}
              onCancel={handleCancelEdit}
              onDelete={() => handleDeleteQuestion(question.id)}
              onAddReply={handleAddReply}
              onUpdateReply={handleUpdateReply}
              onDeleteReply={handleDeleteReply}
            />
          ))}
        </div>
      )}

      {/* 新增問題表單 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-orange-500" />
            <h4 className="font-semibold text-gray-800">新增討論問題</h4>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
          >
            {showAddForm ? (
              <ChevronUp className="w-5 h-5 text-orange-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-orange-500" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    問題標題
                  </label>
                  <input
                    type="text"
                    value={newQuestionTitle}
                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    placeholder="輸入問題標題"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    問題類型
                  </label>
                  <select
                    value={newQuestionType}
                    onChange={(e) => setNewQuestionType(e.target.value as GroupRetroQuestion['type'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  >
                    <option value="custom">自訂問題</option>
                    <option value="reflection">反思問題</option>
                    <option value="growth">成長問題</option>
                    <option value="challenge">挑戰問題</option>
                    <option value="gratitude">感謝問題</option>
                    <option value="planning">規劃問題</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  問題內容
                </label>
                <textarea
                  value={newQuestionContent}
                  onChange={(e) => setNewQuestionContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="詳細描述這個問題"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  引導提示 (可選)
                </label>
                <input
                  type="text"
                  value={newQuestionGuidance}
                  onChange={(e) => setNewQuestionGuidance(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="提供一些引導或提示"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-lg hover:shadow-md transition-all"
                >
                  新增問題
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 完成討論按鈕 */}
      {questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center pt-6"
        >
          <motion.button
            onClick={() => {
              if (window.confirm('確定要完成討論嗎？完成後將進入結果總覽頁面。')) {
                window.dispatchEvent(new CustomEvent('completeDiscussion'));
              }
            }}
            className="px-8 py-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CheckCircle2 className="w-5 h-5" />
            完成討論
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}; 