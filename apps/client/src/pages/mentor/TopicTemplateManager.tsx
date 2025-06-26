/**
 * TopicTemplate 管理頁面
 * 
 * 功能：
 * 1. 顯示 mentor 建立的課程模板列表
 * 2. 支援模板的建立、編輯、複製和刪除
 * 3. 管理協作者和權限
 * 4. 切換公開/私人狀態
 * 5. 顯示使用統計和複製次數
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Copy,
  Share2,
  Users,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  MoreVertical,
  BookOpen,
  TrendingUp,
  Clock,
  Search,
  X,
  UserPlus
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { useTopicTemplateStore } from '../../store/topicTemplateStore';
import { useUserStore } from '../../store/userStore';
import type { TopicTemplate, User } from '../../types/goal';
import { SUBJECTS } from '../../constants/subjects';

const TopicTemplateManager: React.FC = () => {
  const {
    templates,
    loading,
    error,
    fetchMyTemplates,
    fetchPublicTemplates,
    fetchCollaborativeTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    copyTemplate,
    togglePublic,
    toggleCollaborative,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorPermission,
    clearError
  } = useTopicTemplateStore();

  const { users } = useUserStore();

  const [currentTab, setCurrentTab] = useState<'my' | 'public' | 'collaborative'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TopicTemplate | null>(null);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);

  // 載入資料
  useEffect(() => {
    if (currentTab === 'my') {
      fetchMyTemplates();
    } else if (currentTab === 'public') {
      fetchPublicTemplates();
    } else {
      fetchCollaborativeTemplates();
    }
  }, [currentTab]);

  // 過濾模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || template.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // 處理建立新模板
  const handleCreateTemplate = async (templateData: any) => {
    const newTemplate = await createTemplate({
      title: templateData.title,
      description: templateData.description,
      subject: templateData.subject,
      category: templateData.category,
      template_type: 'course',
      goals: [],
      bubbles: [],
      is_public: false,
      is_collaborative: false
    });

    if (newTemplate) {
      setShowCreateModal(false);
    }
  };

  // 處理複製模板
  const handleCopyTemplate = async (copyData: any) => {
    if (!selectedTemplate) return;

    const copiedTemplate = await copyTemplate({
      source_template_id: selectedTemplate.id,
      title: copyData.title,
      description: copyData.description,
      is_public: copyData.is_public
    });

    if (copiedTemplate) {
      setShowCopyModal(false);
      setSelectedTemplate(null);
    }
  };

  // 處理刪除模板
  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('確定要刪除這個模板嗎？此操作無法復原。')) {
      await deleteTemplate(templateId);
    }
  };

  // 處理添加協作者
  const handleAddCollaborator = async (userId: string, permission: 'view' | 'edit' | 'admin') => {
    if (!selectedTemplate) return;
    
    const success = await addCollaborator(selectedTemplate.id, userId, permission);
    if (success) {
      // 重新載入資料
      if (currentTab === 'my') {
        fetchMyTemplates();
      }
    }
  };

  return (
    <PageLayout title="課程模板管理">
      <div className="space-y-6">
        {/* 錯誤提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="text-red-800">{error}</p>
              <button onClick={clearError}>
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        )}

        {/* 頂部工具欄 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            {/* 分頁標籤 */}
            <div className="flex border-b border-gray-200">
              {[
                { key: 'my', label: '我的模板', icon: BookOpen },
                { key: 'public', label: '公開模板', icon: Eye },
                { key: 'collaborative', label: '協作模板', icon: Users }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setCurrentTab(key as any)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                    currentTab === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* 右側操作 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                建立模板
              </button>
            </div>
          </div>

          {/* 搜尋和篩選 */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜尋模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">所有學科</option>
              {Object.values(SUBJECTS).map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 模板列表 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={(template) => {
                    // TODO: 開啟編輯模式
                    console.log('編輯模板:', template.id);
                  }}
                  onCopy={(template) => {
                    setSelectedTemplate(template);
                    setShowCopyModal(true);
                  }}
                  onDelete={handleDeleteTemplate}
                  onTogglePublic={togglePublic}
                  onToggleCollaborative={toggleCollaborative}
                  onManageCollaborators={(template) => {
                    setSelectedTemplate(template);
                    setShowCollaboratorModal(true);
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredTemplates.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到模板</h3>
            <p className="text-gray-500">
              {currentTab === 'my' ? '開始建立您的第一個課程模板' : '沒有符合條件的模板'}
            </p>
          </div>
        )}
      </div>

      {/* 建立模板 Modal */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTemplate}
      />

      {/* 複製模板 Modal */}
      <CopyTemplateModal
        isOpen={showCopyModal}
        onClose={() => {
          setShowCopyModal(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onSubmit={handleCopyTemplate}
      />

      {/* 協作者管理 Modal */}
      <CollaboratorModal
        isOpen={showCollaboratorModal}
        onClose={() => {
          setShowCollaboratorModal(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        availableUsers={users}
        onAddCollaborator={handleAddCollaborator}
        onRemoveCollaborator={removeCollaborator}
        onUpdatePermission={updateCollaboratorPermission}
      />
    </PageLayout>
  );
};

// 模板卡片組件
interface TemplateCardProps {
  template: TopicTemplate;
  onEdit: (template: TopicTemplate) => void;
  onCopy: (template: TopicTemplate) => void;
  onDelete: (templateId: string) => void;
  onTogglePublic: (templateId: string) => void;
  onToggleCollaborative: (templateId: string) => void;
  onManageCollaborators: (template: TopicTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onCopy,
  onDelete,
  onTogglePublic,
  onToggleCollaborative,
  onManageCollaborators
}) => {
  const [showActions, setShowActions] = useState(false);
  const subjectStyle = SUBJECTS[template.subject as keyof typeof SUBJECTS] ? 
    { accent: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-800' } : 
    { accent: '#6b7280', bg: 'bg-gray-50', text: 'text-gray-800' };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
    >
      {/* 卡片頭部 */}
      <div 
        className="h-2"
        style={{ backgroundColor: subjectStyle.accent }}
      />
      
      <div className="p-6">
        {/* 標題和操作 */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-gray-900 text-lg line-clamp-2 flex-1">
            {template.title}
          </h3>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 w-48">
                <button
                  onClick={() => {
                    onEdit(template);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  編輯
                </button>
                <button
                  onClick={() => {
                    onCopy(template);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  複製
                </button>
                <button
                  onClick={() => {
                    onManageCollaborators(template);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  協作者
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    onTogglePublic(template.id);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  {template.is_public ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {template.is_public ? '設為私人' : '設為公開'}
                </button>
                <button
                  onClick={() => {
                    onToggleCollaborative(template.id);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {template.is_collaborative ? '關閉協作' : '開啟協作'}
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    onDelete(template.id);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  刪除
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 描述 */}
        {template.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* 學科標籤 */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${subjectStyle.bg} ${subjectStyle.text}`}>
            {template.subject || '未分類'}
          </span>
          
          {template.is_public && (
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
              公開
            </span>
          )}
          
          {template.is_collaborative && (
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
              協作
            </span>
          )}
        </div>

        {/* 統計資訊 */}
        <div className="flex justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Copy className="w-3 h-3" />
            複製 {template.copy_count}
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            使用 {template.usage_count}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(template.updated_at).toLocaleDateString()}
          </div>
        </div>

        {/* 協作者頭像 */}
        {template.collaborators && template.collaborators.length > 0 && (
          <div className="flex items-center gap-1 mt-3">
            <span className="text-xs text-gray-500">協作者：</span>
            <div className="flex -space-x-1">
              {template.collaborators.slice(0, 3).map((collaborator, index) => (
                <div
                  key={collaborator.id}
                  className="w-6 h-6 rounded-full bg-gray-300 border border-white flex items-center justify-center text-xs font-medium"
                  title={collaborator.user?.name || '未知用戶'}
                >
                  {collaborator.user?.name?.[0] || '?'}
                </div>
              ))}
              {template.collaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-xs text-gray-500">
                  +{template.collaborators.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// 建立模板 Modal 組件
interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    category: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: '', description: '', subject: '', category: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">建立新模板</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模板標題 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="輸入模板標題..."
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
                  placeholder="輸入模板描述..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  學科
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">選擇學科</option>
                  {Object.values(SUBJECTS).map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分類
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="輸入分類..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              建立
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 複製模板 Modal 組件
interface CopyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TopicTemplate | null;
  onSubmit: (data: any) => void;
}

const CopyTemplateModal: React.FC<CopyTemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false
  });

  useEffect(() => {
    if (template) {
      setFormData({
        title: `${template.title} (複製)`,
        description: template.description || '',
        is_public: false
      });
    }
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: '', description: '', is_public: false });
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">複製模板</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新模板標題 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_public" className="text-sm text-gray-700">
                  設為公開模板
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              複製
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 協作者管理 Modal 組件
interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TopicTemplate | null;
  availableUsers: User[];
  onAddCollaborator: (userId: string, permission: 'view' | 'edit' | 'admin') => void;
  onRemoveCollaborator: (templateId: string, userId: string) => void;
  onUpdatePermission: (templateId: string, userId: string, permission: 'view' | 'edit' | 'admin') => void;
}

const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  isOpen,
  onClose,
  template,
  availableUsers,
  onAddCollaborator,
  onRemoveCollaborator,
  onUpdatePermission
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'edit' | 'admin'>('view');

  const handleAddCollaborator = () => {
    if (selectedUserId && template) {
      onAddCollaborator(selectedUserId, selectedPermission);
      setSelectedUserId('');
      setSelectedPermission('view');
    }
  };

  if (!isOpen || !template) return null;

  const availableUsersToAdd = availableUsers.filter(user => 
    !template.collaborators?.some(collab => collab.user_id === user.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">管理協作者</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 添加協作者 */}
          <div className="border rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">邀請協作者</h4>
            <div className="space-y-3">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">選擇用戶</option>
                {availableUsersToAdd.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              
              <select
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="view">檢視權限</option>
                <option value="edit">編輯權限</option>
                <option value="admin">管理權限</option>
              </select>
              
              <button
                onClick={handleAddCollaborator}
                disabled={!selectedUserId}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                邀請協作者
              </button>
            </div>
          </div>

          {/* 現有協作者列表 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              現有協作者 ({template.collaborators?.length || 0})
            </h4>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {template.collaborators?.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                      {collaborator.user?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {collaborator.user?.name || '未知用戶'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {collaborator.user?.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={collaborator.permission}
                      onChange={(e) => onUpdatePermission(template.id, collaborator.user_id, e.target.value as any)}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="view">檢視</option>
                      <option value="edit">編輯</option>
                      <option value="admin">管理</option>
                    </select>
                    
                    <button
                      onClick={() => onRemoveCollaborator(template.id, collaborator.user_id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {(!template.collaborators || template.collaborators.length === 0) && (
                <p className="text-gray-500 text-center py-6">尚無協作者</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicTemplateManager; 