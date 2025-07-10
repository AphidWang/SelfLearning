/**
 * ReplyInput - 回覆輸入組件
 * 
 * 🎯 功能說明：
 * - 每個問題支援多人回覆
 * - 顯示所有參與者的回覆
 * - 支援表情符號和心情選擇
 * - 實時更新回覆狀態
 * - 家長/輔助者協助輸入
 * 
 * 🏗️ 架構設計：
 * - 使用 GroupRetroStore 管理狀態
 * - 按問題分組顯示回覆
 * - 支援編輯和刪除回覆
 * - 實時進度更新
 * 
 * 🎨 視覺設計：
 * - 用戶頭像和顏色標識
 * - 表情符號選擇器
 * - 心情狀態顯示
 * - 回覆卡片佈局
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Edit3,
  Trash2,
  Smile,
  Heart,
  ThumbsUp,
  Star,
  Sparkles,
  User,
  Save,
  X,
  Plus,
  Users,
  CheckCircle2
} from 'lucide-react';
import { useGroupRetroStore } from '../../store/groupRetroStore';
import { useUser } from '../../context/UserContext';
import { LoadingDots } from '../shared/LoadingDots';
import type { GroupRetroQuestion, GroupRetroReply, CreateGroupRetroReplyData } from '../../types/groupRetro';
import toast from 'react-hot-toast';

interface ReplyItemProps {
  reply: GroupRetroReply;
  currentUserId: string;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  onSave: (content: string, mood?: string, emoji?: string) => void;
  onCancel: () => void;
}

const ReplyItem: React.FC<ReplyItemProps> = ({
  reply,
  currentUserId,
  onEdit,
  onDelete,
  isEditing,
  onSave,
  onCancel
}) => {
  const [editContent, setEditContent] = useState(reply.content);
  const [editMood, setEditMood] = useState(reply.mood || '');
  const [editEmoji, setEditEmoji] = useState(reply.emoji || '');
  
  const isOwner = reply.userId === currentUserId;
  const userInitial = reply.user.name?.charAt(0)?.toUpperCase() || 'U';
  
  // 心情配置
  const moodConfig = useMemo(() => {
    switch (reply.mood) {
      case 'excited':
        return { emoji: '🤩', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'happy':
        return { emoji: '😊', color: 'text-green-600', bg: 'bg-green-50' };
      case 'neutral':
        return { emoji: '😐', color: 'text-gray-600', bg: 'bg-gray-50' };
      case 'thoughtful':
        return { emoji: '🤔', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'surprised':
        return { emoji: '😯', color: 'text-purple-600', bg: 'bg-purple-50' };
      default:
        return { emoji: '💭', color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  }, [reply.mood]);
  
  const handleSave = () => {
    if (!editContent.trim()) {
      toast.error('回覆內容不能為空');
      return;
    }
    onSave(editContent.trim(), editMood, editEmoji);
  };
  
  const handleCancel = () => {
    setEditContent(reply.content);
    setEditMood(reply.mood || '');
    setEditEmoji(reply.emoji || '');
    onCancel();
  };
  
  return (
    <motion.div
      className={`bg-white rounded-xl p-4 shadow-sm border-2 ${
        isOwner ? 'border-orange-200' : 'border-gray-200'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="flex items-start space-x-3">
        {/* 用戶頭像 */}
        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
          {reply.user.avatar ? (
            <img
              src={reply.user.avatar}
              alt={reply.user.name || '用戶'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm">{userInitial}</span>
          )}
        </div>
        
        <div className="flex-1">
          {/* 用戶名稱和時間 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-800">
                {reply.user.name || '匿名用戶'}
              </h4>
              {isOwner && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  你的回覆
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {new Date(reply.createdAt).toLocaleString('zh-TW', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              {isOwner && !isEditing && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={onEdit}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="編輯"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="刪除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* 回覆內容 */}
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="輸入你的回覆..."
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* 心情選擇 */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">心情：</span>
                    <select
                      value={editMood}
                      onChange={(e) => setEditMood(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    >
                      <option value="">選擇心情</option>
                      <option value="excited">🤩 興奮</option>
                      <option value="happy">😊 開心</option>
                      <option value="neutral">😐 平靜</option>
                      <option value="thoughtful">🤔 深思</option>
                      <option value="surprised">😯 驚訝</option>
                    </select>
                  </div>
                  
                  {/* 表情符號 */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">表情：</span>
                    <input
                      type="text"
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      className="w-12 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                      placeholder="😊"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors text-xs"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded hover:shadow-md transition-all text-xs"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-700 leading-relaxed">
                {reply.content}
              </p>
              
              {/* 心情和表情符號 */}
              <div className="flex items-center space-x-3">
                {reply.mood && (
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${moodConfig.bg}`}>
                    <span className="text-sm">{moodConfig.emoji}</span>
                    <span className={`text-xs ${moodConfig.color}`}>
                      {reply.mood === 'excited' && '興奮'}
                      {reply.mood === 'happy' && '開心'}
                      {reply.mood === 'neutral' && '平靜'}
                      {reply.mood === 'thoughtful' && '深思'}
                      {reply.mood === 'surprised' && '驚訝'}
                    </span>
                  </div>
                )}
                
                {reply.emoji && (
                  <span className="text-lg">{reply.emoji}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface QuestionRepliesProps {
  question: GroupRetroQuestion;
  replies: GroupRetroReply[];
  participants: any[];
  onAddReply: (questionId: string, data: CreateGroupRetroReplyData) => void;
  onUpdateReply: (replyId: string, content: string, mood?: string, emoji?: string) => void;
  onDeleteReply: (replyId: string) => void;
}

const QuestionReplies: React.FC<QuestionRepliesProps> = ({
  question,
  replies,
  participants,
  onAddReply,
  onUpdateReply,
  onDeleteReply
}) => {
  const { currentUser } = useUser();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyMood, setReplyMood] = useState('');
  const [replyEmoji, setReplyEmoji] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  
  // 檢查當前用戶是否已回覆
  const currentUserReply = replies.find(r => r.userId === currentUser?.id);
  
  // 統計回覆情況
  const repliedParticipants = new Set(replies.map(r => r.userId));
  const unrepliedParticipants = participants.filter(p => !repliedParticipants.has(p.user.id));
  
  const handleAddReply = () => {
    if (!replyContent.trim()) {
      toast.error('回覆內容不能為空');
      return;
    }
    
    const replyData: CreateGroupRetroReplyData = {
      questionId: question.id,
      content: replyContent.trim(),
      mood: replyMood as GroupRetroReply['mood'] || undefined,
      emoji: replyEmoji || undefined
    };
    
    onAddReply(question.id, replyData);
    
    // 重置表單
    setReplyContent('');
    setReplyMood('');
    setReplyEmoji('');
    setShowReplyForm(false);
  };
  
  const handleUpdateReply = (replyId: string, content: string, mood?: string, emoji?: string) => {
    onUpdateReply(replyId, content, mood, emoji);
    setEditingReplyId(null);
  };
  
  const handleDeleteReply = (replyId: string) => {
    if (window.confirm('確定要刪除這個回覆嗎？')) {
      onDeleteReply(replyId);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* 問題標題 */}
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 border-2 border-orange-200">
        <div className="flex items-center space-x-2 mb-2">
          <MessageSquare className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-800">{question.title}</h3>
        </div>
        <p className="text-gray-700 mb-3">{question.content}</p>
        
        {/* 回覆進度 */}
        <div className="flex items-center justify-between">
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
      
      {/* 回覆列表 */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800 flex items-center space-x-2">
          <MessageSquare className="w-4 h-4" />
          <span>大家的回覆</span>
        </h4>
        
        {replies.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-sm">還沒有人回覆這個問題</p>
            <p className="text-gray-500 text-xs mt-1">成為第一個分享想法的人吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                currentUserId={currentUser?.id || ''}
                onEdit={() => setEditingReplyId(reply.id)}
                onDelete={() => handleDeleteReply(reply.id)}
                isEditing={editingReplyId === reply.id}
                onSave={(content, mood, emoji) => handleUpdateReply(reply.id, content, mood, emoji)}
                onCancel={() => setEditingReplyId(null)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 待回覆提示 */}
      {unrepliedParticipants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h5 className="font-medium text-blue-800 mb-2">還在等待回覆的夥伴：</h5>
          <div className="flex flex-wrap gap-2">
            {unrepliedParticipants.map((participant) => (
              <div key={participant.user.id} className="flex items-center space-x-2 bg-white rounded-lg px-3 py-1 border border-blue-200">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${participant.colorTheme}`}>
                  {participant.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-gray-700">{participant.user.name || '匿名用戶'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 回覆輸入表單 */}
      {currentUser && (
        <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200">
          {!currentUserReply ? (
            !showReplyForm ? (
              <button
                onClick={() => setShowReplyForm(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-lg hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>我也要回覆</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                    {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <h4 className="font-medium text-gray-800">分享你的想法</h4>
                </div>
                
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                  placeholder="輸入你的回覆..."
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* 心情選擇 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">心情：</span>
                      <select
                        value={replyMood}
                        onChange={(e) => setReplyMood(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                      >
                        <option value="">選擇心情</option>
                        <option value="excited">🤩 興奮</option>
                        <option value="happy">😊 開心</option>
                        <option value="neutral">😐 平靜</option>
                        <option value="thoughtful">🤔 深思</option>
                        <option value="surprised">😯 驚訝</option>
                      </select>
                    </div>
                    
                    {/* 表情符號 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">表情：</span>
                      <input
                        type="text"
                        value={replyEmoji}
                        onChange={(e) => setReplyEmoji(e.target.value)}
                        className="w-16 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        placeholder="😊"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowReplyForm(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddReply}
                      className="px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded hover:shadow-md transition-all flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>發送回覆</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="text-center text-gray-600">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-sm">你已經回覆了這個問題</p>
              <p className="text-xs text-gray-500 mt-1">可以在上方查看和編輯你的回覆</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ReplyInput: React.FC = () => {
  const {
    currentSession,
    selectedParticipants,
    loading,
    error,
    addReply,
    updateReply,
    deleteReply,
    getRepliesForQuestion
  } = useGroupRetroStore();
  
  const questions = currentSession?.questions || [];
  const participants = currentSession?.participants || selectedParticipants;
  
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
  
  if (questions.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-xl">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600">還沒有問題可以回覆</p>
        <p className="text-gray-500 text-sm mt-1">先添加一些討論問題吧！</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {questions.map((question) => (
        <QuestionReplies
          key={question.id}
          question={question}
          replies={getRepliesForQuestion(question.id)}
          participants={participants}
          onAddReply={handleAddReply}
          onUpdateReply={handleUpdateReply}
          onDeleteReply={handleDeleteReply}
        />
      ))}
    </div>
  );
}; 