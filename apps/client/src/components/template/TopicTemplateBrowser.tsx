/**
 * TopicTemplate 瀏覽器組件
 * 
 * 功能：
 * 1. 讓學生瀏覽公開的課程模板
 * 2. 預覽模板內容
 * 3. 從模板建立新的學習主題
 * 4. 搜尋和篩選模板
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
  ChevronDown
} from 'lucide-react';
import { useTopicTemplateStore } from '../../store/topicTemplateStore';
import { useTopicSupabaseStore } from '../../store/topicSupabaseStore';
import type { TopicTemplate } from '../../types/goal';
import { SUBJECTS } from '../../constants/subjects';

interface TopicTemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelected?: (templateId: string) => void;
}

export const TopicTemplateBrowser: React.FC<TopicTemplateBrowserProps> = ({
  isOpen,
  onClose,
  onTemplateSelected
}) => {
  const {
    templates,
    loading,
    error,
    fetchPublicTemplates,
    clearError
  } = useTopicTemplateStore();

  const {
    createTopicFromTemplate
  } = useTopicSupabaseStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<TopicTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

    const newTopic = await createTopicFromTemplate({
      template_id: selectedTemplate.id,
      title: createData.title,
      description: createData.description,
      is_collaborative: createData.is_collaborative
    });

    if (newTopic) {
      setShowCreateModal(false);
      setSelectedTemplate(null);
      onTemplateSelected?.(selectedTemplate.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
      >
        {/* 標題列 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">課程模板庫</h2>
            <p className="text-gray-600 mt-1">選擇一個模板開始您的學習之旅</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 錯誤提示 */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="text-red-800">{error}</p>
              <button onClick={clearError}>
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        )}

        {/* 搜尋和篩選工具欄 */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜尋框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜尋模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* 篩選選項 */}
            <div className="flex gap-3">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">所有學科</option>
                {Object.values(SUBJECTS).map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">所有分類</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="popular">最受歡迎</option>
                <option value="recent">最新更新</option>
                <option value="name">名稱排序</option>
              </select>
            </div>
          </div>
        </div>

        {/* 模板列表 */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredAndSortedTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
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
              </div>

              {filteredAndSortedTemplates.length === 0 && !loading && (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">沒有找到模板</h3>
                  <p className="text-gray-500">
                    嘗試調整搜尋條件或篩選選項
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
    </div>
  );
};

// 模板卡片組件
interface TemplateCardProps {
  template: TopicTemplate;
  onPreview: () => void;
  onUse: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onPreview,
  onUse
}) => {
  const subjectStyle = { accent: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-800' };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group"
    >
      {/* 卡片頭部 */}
      <div 
        className="h-3"
        style={{ backgroundColor: subjectStyle.accent }}
      />
      
      <div className="p-6">
        {/* 標題和評分 */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-gray-900 text-lg line-clamp-2 flex-1">
            {template.title}
          </h3>
          <div className="flex items-center gap-1 ml-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">4.8</span>
          </div>
        </div>

        {/* 描述 */}
        {template.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {template.description}
          </p>
        )}

        {/* 學科和分類標籤 */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${subjectStyle.bg} ${subjectStyle.text}`}>
            {template.subject || '未分類'}
          </span>
          
          {template.category && (
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
              {template.category}
            </span>
          )}
        </div>

        {/* 統計資訊 */}
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {template.usage_count} 人使用
          </div>
          <div className="flex items-center gap-1">
            <Copy className="w-3 h-3" />
            {template.copy_count} 次複製
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(template.updated_at).toLocaleDateString()}
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex-1 px-3 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="w-4 h-4" />
            預覽
          </button>
          <button
            onClick={onUse}
            className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
          >
            <ArrowRight className="w-4 h-4" />
            使用
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// 模板預覽 Modal
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* 標題列 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{template.title}</h3>
            <p className="text-gray-600 mt-1">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容 */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* 基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">學科分類</h4>
              <span className="px-3 py-1 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800">
                {template.subject || '未分類'}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">使用統計</h4>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>{template.usage_count} 人使用</span>
                <span>{template.copy_count} 次複製</span>
              </div>
            </div>
          </div>

          {/* 學習目標 */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">學習目標 ({template.goals.length})</h4>
            <div className="space-y-3">
              {template.goals.map((goal, index) => (
                <div key={goal.id} className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">{goal.title}</h5>
                  {goal.description && (
                    <p className="text-gray-600 text-sm mb-2">{goal.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    {goal.tasks.length} 個任務
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 思維泡泡 */}
          {template.bubbles && template.bubbles.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">思維導圖 ({template.bubbles.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {template.bubbles.map((bubble, index) => (
                  <div key={bubble.id} className="border rounded-lg p-3">
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
        <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            關閉
          </button>
          <button
            onClick={onUse}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            使用此模板
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// 從模板建立主題 Modal
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">建立學習主題</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  主題標題 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="輸入主題標題..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="輸入主題描述..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_collaborative"
                  checked={formData.is_collaborative}
                  onChange={(e) => setFormData({ ...formData, is_collaborative: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_collaborative" className="text-sm text-gray-700">
                  啟用協作模式（可邀請同學一起學習）
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
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