/**
 * TopicTemplate 瀏覽器組件
 * 
 * 功能：
 * 1. 讓學生瀏覽公開的課程模板
 * 2. 預覽模板內容
 * 3. 從模板建立新的學習主題
 * 4. 搜尋和篩選模板
 * 
 * 🎨 設計風格：採用 TaskWall 的溫暖色調和手作感設計
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  Eye,
  ArrowRight,
  Star,
  Copy,
  X,
  Check,
  ChevronDown,
  Sparkles,
  Target,
  BookMarked,
  Lightbulb
} from 'lucide-react';
import { useTopicTemplateStore } from '../../store/topicTemplateStore';
import { useTopicStore } from '../../store/topicStore';
import type { TopicTemplate } from '../../types/goal';
import { SUBJECTS } from '../../constants/subjects';
import { TOPIC_CATEGORIES } from '../../constants/topics';

interface TopicTemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelected?: (templateId: string) => void;
  onCreateBlankTopic?: () => void;
}

export const TopicTemplateBrowser: React.FC<TopicTemplateBrowserProps> = ({
  isOpen,
  onClose,
  onTemplateSelected,
  onCreateBlankTopic
}) => {
  const {
    templates,
    loading,
    error,
    fetchPublicTemplates,
    clearError
  } = useTopicTemplateStore();

  const {
    createTopicFromTemplate,
    createTopic
  } = useTopicStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<TopicTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateBlankModal, setShowCreateBlankModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPublicTemplates();
    }
  }, [isOpen]);

  // 過濾和排序模板
  const filteredAndSortedTemplates = templates
    .filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = !selectedSubject || template.subject === selectedSubject;
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      return matchesSearch && matchesSubject && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.usage_count - a.usage_count;
        case 'recent':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // 獲取所有分類
  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));

  // 處理從模板建立主題
  const handleCreateFromTemplate = async (createData: any) => {
    if (!selectedTemplate) return;

    try {
      const newTopic = await createTopicFromTemplate({
        template_id: selectedTemplate.id,
        title: createData.title,
        description: createData.description,
        is_collaborative: createData.is_collaborative
      });

      if (newTopic) {
        // 清理狀態
        setShowCreateModal(false);
        setSelectedTemplate(null);
        // 立即關閉整個 browser
        onClose();
        // 通知父組件模板已選擇
        onTemplateSelected?.(selectedTemplate.id);
      }
    } catch (error) {
      console.error('建立主題失敗:', error);
      // 這裡可以顯示錯誤提示，但不關閉 browser
    }
  };

  // 處理建立空白主題
  const handleCreateBlankTopic = async (createData: any) => {
    try {
      const newTopic = await createTopic({
        title: createData.title,
        description: createData.description,
        subject: createData.subject || '未分類',
        category: createData.category || 'learning',
        type: '學習目標',
        topic_type: '學習目標',
        is_collaborative: createData.is_collaborative,
        show_avatars: true,
        bubbles: [],
        status: 'active'
      });

      if (newTopic) {
        // 清理狀態
        setShowCreateBlankModal(false);
        // 立即關閉整個 browser
        onClose();
        // 通知父組件已建立新主題
        onTemplateSelected?.(newTopic.id);
      }
    } catch (error) {
      console.error('建立空白主題失敗:', error);
      // 這裡可以顯示錯誤提示，但不關閉 browser
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #fefdf8 0%, #faf7f0 50%, #f7f3e9 100%)',
          backgroundImage: `
            radial-gradient(circle at 20px 50px, #00000008 1px, transparent 1px),
            radial-gradient(circle at 80px 20px, #00000008 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
          backgroundColor: '#fefdf8'
        }}
      >
        {/* 標題列 - 採用 TaskWall 風格 */}
        <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/90 backdrop-blur-sm border-b border-amber-200/60 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                <BookMarked className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-900 font-hand">📚 模板藏書閣</h2>
                <p className="text-amber-700 text-sm">選擇喜歡的模板開始學習之旅</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-amber-100/50 transition-colors text-amber-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 錯誤提示 */}
        {error && (
          <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <p className="text-red-800 text-sm">{error}</p>
              <button onClick={clearError}>
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        )}

        {/* 搜尋和篩選工具欄 - 更緊湊 */}
        <div className="p-4 border-b border-amber-200/40">
          <div className="flex flex-col md:flex-row gap-3">
            {/* 搜尋框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-4 h-4" />
              <input
                type="text"
                placeholder="搜尋模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/70 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-transparent text-sm placeholder-amber-400"
              />
            </div>

            {/* 篩選選項 - 更緊湊 */}
            <div className="flex gap-2">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2.5 bg-white/70 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-transparent text-sm"
              >
                <option value="">所有學科</option>
                {Object.values(SUBJECTS).map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 bg-white/70 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-transparent text-sm"
              >
                <option value="">所有分類</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2.5 bg-white/70 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-transparent text-sm"
              >
                <option value="popular">🔥 熱門</option>
                <option value="recent">✨ 最新</option>
                <option value="name">📝 名稱</option>
              </select>
            </div>
          </div>
        </div>

        {/* 模板列表 - 響應式網格 */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
              <p className="text-amber-700">載入模板中...</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4">
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence>
                  {/* 建立空白主題卡片 */}
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20, rotate: -1 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    whileHover={{ scale: 1.03, y: -4, rotate: 0 }}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-2xl overflow-hidden hover:border-amber-400 transition-all group cursor-pointer shadow-sm h-[280px] flex flex-col"
                    onClick={() => setShowCreateBlankModal(true)}
                  >
                    <div className="p-5 text-center flex-1 flex flex-col justify-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-amber-900 text-base mb-2">
                        ✨ 建立空白主題
                      </h3>
                      <p className="text-amber-700 text-sm mb-4">
                        從零開始建立專屬學習主題
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-lg text-sm font-medium group-hover:from-amber-500 group-hover:to-orange-500 transition-all">
                        <ArrowRight className="w-4 h-4" />
                        開始建立
                      </div>
                    </div>
                  </motion.div>

                  {/* 現有模板卡片 */}
                  {filteredAndSortedTemplates.map((template, index) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      index={index}
                      onPreview={() => {
                        setSelectedTemplate(template);
                        setShowPreview(true);
                      }}
                      onUse={() => {
                        setSelectedTemplate(template);
                        setShowCreateModal(true);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {filteredAndSortedTemplates.length === 0 && !loading && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🤔</div>
                  <h3 className="text-xl font-bold text-amber-900 mb-2">找不到合適的模板</h3>
                  <p className="text-amber-700">
                    試試調整搜尋條件，或建立一個空白主題吧！
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* 模板預覽 Modal */}
      <TemplatePreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onUse={() => {
          setShowPreview(false);
          setShowCreateModal(true);
        }}
      />

      {/* 建立主題 Modal */}
      <CreateFromTemplateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onSubmit={handleCreateFromTemplate}
      />

      {/* 建立空白主題 Modal */}
      <CreateBlankTopicModal
        isOpen={showCreateBlankModal}
        onClose={() => {
          setShowCreateBlankModal(false);
        }}
        onSubmit={handleCreateBlankTopic}
      />
    </div>
  );
};

// 模板卡片組件 - 採用 TaskWall 風格
interface TemplateCardProps {
  template: TopicTemplate;
  index: number;
  onPreview: () => void;
  onUse: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  index,
  onPreview,
  onUse
}) => {
  const subjectStyle = { accent: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-800' };
  
  // 隨機旋轉角度，模擬手作感
  const randomRotation = (Math.random() - 0.5) * 2;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, rotate: randomRotation }}
      animate={{ opacity: 1, y: 0, rotate: randomRotation }}
      exit={{ opacity: 0, y: -20, rotate: randomRotation }}
      whileHover={{ scale: 1.03, y: -4, rotate: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-sm border border-amber-200/40 overflow-hidden hover:shadow-md transition-all group h-[280px] flex flex-col"
      style={{
        transform: `rotate(${randomRotation}deg)`,
        background: 'linear-gradient(135deg, #ffffff 0%, #fefdf8 100%)'
      }}
    >
      {/* 卡片頭部色帶 */}
      <div 
        className="h-2"
        style={{ backgroundColor: subjectStyle.accent }}
      />
      
      <div className="p-4 flex-1 flex flex-col">
        {/* 標題和評分 */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-gray-900 text-base line-clamp-2 flex-1 font-hand">
            {template.title}
          </h3>
          <div className="flex items-center gap-1 ml-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">4.8</span>
          </div>
        </div>

        {/* 描述 */}
        <div className="flex-1 mb-3">
          {template.description && (
            <p className="text-gray-600 text-sm line-clamp-3">
              {template.description}
            </p>
          )}
        </div>

        {/* 學科和分類標籤 */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${subjectStyle.bg} ${subjectStyle.text}`}>
            {template.subject || '未分類'}
          </span>
          
          {template.category && (
            <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
              {template.category}
            </span>
          )}
        </div>

        {/* 統計資訊 */}
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {template.usage_count}
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {template.goals.length}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(template.updated_at).toLocaleDateString()}
          </div>
        </div>

        {/* 操作按鈕 - 固定在底部 */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={onPreview}
            className="flex-1 px-3 py-2 text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-50 transition-colors flex items-center justify-center gap-1 text-sm"
          >
            <Eye className="w-4 h-4" />
            預覽
          </button>
          <button
            onClick={onUse}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all flex items-center justify-center gap-1 text-sm font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            使用
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// 模板預覽 Modal - 採用新風格
interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TopicTemplate | null;
  onUse: () => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  template,
  onUse
}) => {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #fefdf8 0%, #faf7f0 50%, #f7f3e9 100%)',
        }}
      >
        {/* 標題列 */}
        <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/90 p-4 border-b border-amber-200/40">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900 font-hand">{template.title}</h3>
                <p className="text-amber-700 text-sm">{template.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-amber-100/50 transition-colors text-amber-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 內容 */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* 基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/60 rounded-xl p-4">
              <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                學科分類
              </h4>
              <span className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-800">
                {template.subject || '未分類'}
              </span>
            </div>
            <div className="bg-white/60 rounded-xl p-4">
              <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                使用統計
              </h4>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>👥 {template.usage_count} 人使用</span>
                <span>📋 {template.copy_count} 次複製</span>
              </div>
            </div>
          </div>

          {/* 學習目標 */}
          <div className="mb-6">
            <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              學習目標 ({template.goals.length})
            </h4>
            <div className="space-y-3">
              {template.goals.map((goal, index) => (
                <div key={goal.id} className="bg-white/60 rounded-xl p-4">
                  <h5 className="font-medium text-gray-900 mb-2">{goal.title}</h5>
                  {goal.description && (
                    <p className="text-gray-600 text-sm mb-2">{goal.description}</p>
                  )}
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {goal.tasks?.length || 0} 個任務
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 思維泡泡 */}
          {template.bubbles && template.bubbles.length > 0 && (
            <div>
              <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                思維導圖 ({template.bubbles.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {template.bubbles.map((bubble, index) => (
                  <div key={bubble.id} className="bg-white/60 rounded-xl p-3">
                    <h6 className="font-medium text-gray-900 text-sm">{bubble.title}</h6>
                    {bubble.content && (
                      <p className="text-gray-600 text-xs mt-1">{bubble.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end gap-3 p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-t border-amber-200/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-50 transition-colors"
          >
            關閉
          </button>
          <button
            onClick={onUse}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            使用此模板
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// 從模板建立主題 Modal - 採用新風格
interface CreateFromTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TopicTemplate | null;
  onSubmit: (data: any) => void;
}

const CreateFromTemplateModal: React.FC<CreateFromTemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_collaborative: false
  });

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        description: template.description || '',
        is_collaborative: false
      });
    }
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: '', description: '', is_collaborative: false });
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
        style={{
          background: 'linear-gradient(135deg, #fefdf8 0%, #faf7f0 50%, #f7f3e9 100%)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-amber-900 font-hand">🎯 建立學習主題</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  主題標題 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/70 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-transparent"
                  placeholder="輸入主題標題..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/70 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-transparent"
                  placeholder="輸入主題描述..."
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                <input
                  type="checkbox"
                  id="is_collaborative"
                  checked={formData.is_collaborative}
                  onChange={(e) => setFormData({ ...formData, is_collaborative: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="is_collaborative" className="text-sm text-amber-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  啟用協作模式（可邀請同學一起學習）
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-t border-amber-200/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              建立主題
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// 建立空白主題 Modal - 採用相同風格
interface CreateBlankTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateBlankTopicModal: React.FC<CreateBlankTopicModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    category: '',
    is_collaborative: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: '', description: '', subject: '', category: '', is_collaborative: false });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
        style={{
          background: 'linear-gradient(135deg, #fefdf8 0%, #faf7f0 50%, #f7f3e9 100%)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-amber-900 font-hand">✨ 建立空白主題</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  主題標題 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/70 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-transparent"
                  placeholder="輸入主題標題..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/70 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-transparent"
                  placeholder="輸入主題描述..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    學科
                  </label>
                  <div className="relative">
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-gradient-to-r from-white/90 to-blue-50/90 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all appearance-none cursor-pointer hover:border-blue-300 shadow-sm"
                    >
                      <option value="">選擇學科</option>
                      {Object.entries(SUBJECTS).map(([key, subject]) => (
                        <option key={key} value={subject}>
                          {key === 'CHINESE' && '📖'} 
                          {key === 'ENGLISH' && '🔤'} 
                          {key === 'MATH' && '🔢'} 
                          {key === 'SCIENCE' && '🔬'} 
                          {key === 'SOCIAL' && '🌍'} 
                          {key === 'ARTS' && '🎨'} 
                          {key === 'PE' && '⚽'} 
                          {key === 'CUSTOM' && '✨'} 
                          {' ' + subject}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    分類
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-gradient-to-r from-white/90 to-purple-50/90 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all appearance-none cursor-pointer hover:border-purple-300 shadow-sm"
                    >
                      <option value="">選擇分類</option>
                      <option value="learning">📚 學習成長</option>
                      <option value="personal">🌟 個人發展</option>
                      <option value="project">🚀 專案計畫</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                <input
                  type="checkbox"
                  id="is_collaborative_blank"
                  checked={formData.is_collaborative}
                  onChange={(e) => setFormData({ ...formData, is_collaborative: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="is_collaborative_blank" className="text-sm text-amber-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  啟用協作模式（可邀請同學一起學習）
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-t border-amber-200/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              建立主題
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}; 