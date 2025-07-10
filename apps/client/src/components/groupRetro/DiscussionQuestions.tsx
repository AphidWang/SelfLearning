/**
 * DiscussionQuestions - 討論問題組件
 * 
 * 🎯 功能說明：
 * - 顯示和管理討論問題
 * - 支援問題編輯和調整
 * - 抽籤產生共學問題
 * - 從問題庫選擇
 * - 顯示每個問題的回覆
 * 
 * 🏗️ 架構設計：
 * - 使用 GroupRetroStore 管理狀態
 * - 卡片式問題佈局
 * - 問題類型分類
 * - 互動式編輯功能
 * 
 * 🎨 視覺設計：
 * - 明顯的問題區分
 * - 問題類型顏色系統
 * - 編輯模式切換
 * - 回覆預覽
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
  BookOpen,
  Users,
  Heart,
  Target,
  Lightbulb,
  CheckCircle2,
  MessageCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useGroupRetroStore } from '../../store/groupRetroStore';
import { LoadingDots } from '../shared/LoadingDots';
import type { GroupRetroQuestion } from '../../types/groupRetro';
import toast from 'react-hot-toast';

interface QuestionCardProps {
  question: GroupRetroQuestion;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updatedQuestion: Partial<GroupRetroQuestion>) => void;
  onCancel: () => void;
  onDelete: () => void;
  repliesCount: number;
  onToggleReplies: () => void;
  showReplies: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  repliesCount,
  onToggleReplies,
  showReplies
}) => {
  const [editTitle, setEditTitle] = useState(question.title);
  const [editContent, setEditContent] = useState(question.content);
  const [editGuidance, setEditGuidance] = useState(question.guidance || '');
  
  // 問題類型配置
  const typeConfig = useMemo(() => {
    switch (question.type) {
      case 'appreciation':
        return {
          icon: Heart,
          color: 'text-pink-600',
          bg: 'bg-pink-50',
          border: 'border-pink-200',
          gradient: 'from-pink-400 to-rose-400'
        };
      case 'learning':
        return {
          icon: BookOpen,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          gradient: 'from-blue-400 to-indigo-400'
        };
      case 'collaboration':
        return {
          icon: Users,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          gradient: 'from-green-400 to-emerald-400'
        };
      case 'reflection':
        return {
          icon: Lightbulb,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          gradient: 'from-yellow-400 to-orange-400'
        };
      case 'planning':
        return {
          icon: Target,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          gradient: 'from-purple-400 to-violet-400'
        };
      default:
        return {
          icon: MessageSquare,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          gradient: 'from-gray-400 to-gray-500'
        };
    }
  }, [question.type]);
  
  const TypeIcon = typeConfig.icon;
  
  const handleSave = () => {
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
  
  const handleCancel = () => {
    setEditTitle(question.title);
    setEditContent(question.content);
    setEditGuidance(question.guidance || '');
    onCancel();
  };
  
  return (
    <motion.div
      className={`bg-white rounded-xl shadow-sm border-2 ${typeConfig.border} overflow-hidden`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      layout
    >
      {/* 問題標題區域 */}
      <div className={`${typeConfig.bg} px-6 py-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`w-8 h-8 bg-gradient-to-r ${typeConfig.gradient} rounded-lg flex items-center justify-center`}>
              <TypeIcon className="w-4 h-4 text-white" />
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    placeholder="問題標題"
                  />
                </div>
              ) : (
                <h3 className="font-semibold text-gray-800 text-lg">
                  {question.title}
                </h3>
              )}
              
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${typeConfig.bg} ${typeConfig.color} font-medium`}>
                  {question.type === 'appreciation' && '互相欣賞'}
                  {question.type === 'learning' && '學習分享'}
                  {question.type === 'collaboration' && '共同協作'}
                  {question.type === 'reflection' && '反思探討'}
                  {question.type === 'planning' && '未來計劃'}
                  {question.type === 'custom' && '自訂問題'}
                </span>
                
                <span className="text-xs text-gray-500">
                  問題 {index + 1}
                </span>
              </div>
            </div>
          </div>
          
          {/* 操作按鈕 */}
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  title="保存"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="取消"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onEdit}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="編輯"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {!question.isDefault && (
                  <button
                    onClick={onDelete}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="刪除"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 問題內容區域 */}
      <div className="px-6 py-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                問題內容
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="輸入問題的具體內容..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                引導提示 (可選)
              </label>
              <textarea
                value={editGuidance}
                onChange={(e) => setEditGuidance(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="提供一些引導或例子幫助大家回答..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-700 text-lg leading-relaxed">
              {question.content}
            </p>
            
            {question.guidance && (
              <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-orange-400">
                <p className="text-sm text-gray-600">
                  <strong>💡 提示：</strong> {question.guidance}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 回覆區域 */}
      {!isEditing && (
        <div className="px-6 py-4 bg-gray-50 border-t">
          <button
            onClick={onToggleReplies}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                回覆 ({repliesCount})
              </span>
            </div>
            {showReplies ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export const DiscussionQuestions: React.FC = () => {
  const {
    currentSession,
    defaultQuestions,
    loading,
    error,
    addCustomQuestion,
    updateQuestion,
    deleteQuestion,
    drawQuestions,
    getRepliesForQuestion
  } = useGroupRetroStore();
  
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  
  // 新增問題表單狀態
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [newQuestionGuidance, setNewQuestionGuidance] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<GroupRetroQuestion['type']>('custom');
  
  const questions = currentSession?.questions || [];
  
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
    if (window.confirm('確定要刪除這個問題嗎？相關的回覆也會被刪除。')) {
      try {
        await deleteQuestion(questionId);
        toast.success('問題刪除成功');
      } catch (error) {
        toast.error('刪除問題失敗');
      }
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
  
  // 切換回覆展開狀態
  const toggleReplies = (questionId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedReplies(newExpanded);
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
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-lg hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">新增問題</span>
          </button>
        </div>
      </div>
      
      {/* 新增問題表單 */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="bg-white rounded-xl p-6 shadow-sm border-2 border-orange-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <Plus className="w-5 h-5 text-orange-500" />
              <h4 className="font-semibold text-gray-800">新增討論問題</h4>
            </div>
            
            <div className="space-y-4">
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
                    placeholder="輸入問題標題..."
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
                    <option value="appreciation">互相欣賞</option>
                    <option value="learning">學習分享</option>
                    <option value="collaboration">共同協作</option>
                    <option value="reflection">反思探討</option>
                    <option value="planning">未來計劃</option>
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="輸入問題的具體內容..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  引導提示 (可選)
                </label>
                <textarea
                  value={newQuestionGuidance}
                  onChange={(e) => setNewQuestionGuidance(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="提供一些引導或例子幫助大家回答..."
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 問題列表 */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border-2 border-gray-200">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">還沒有討論問題</h3>
            <p className="text-gray-600 mb-6">開始添加問題來引導大家的討論吧！</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDrawQuestions}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg hover:shadow-md transition-all"
              >
                <Shuffle className="w-4 h-4" />
                <span>抽籤生成問題</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-lg hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>手動新增問題</span>
              </button>
            </div>
          </div>
        ) : (
          questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              isEditing={editingQuestionId === question.id}
              onEdit={() => handleEditQuestion(question.id)}
              onSave={(updates) => handleSaveQuestion(question.id, updates)}
              onCancel={handleCancelEdit}
              onDelete={() => handleDeleteQuestion(question.id)}
              repliesCount={getRepliesForQuestion(question.id).length}
              onToggleReplies={() => toggleReplies(question.id)}
              showReplies={expandedReplies.has(question.id)}
            />
          ))
        )}
      </div>
      
      {/* 討論提示 */}
      {questions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800">討論開始！</h4>
          </div>
          <p className="text-sm text-blue-700">
            問題已經準備好了，現在可以開始讓大家輪流分享想法。
            記得給每個人足夠的時間思考和表達，也要互相傾聽喔！
          </p>
        </div>
      )}
    </div>
  );
}; 