/**
 * Mentor 課程規劃頁面
 * 
 * 功能：
 * 1. 課程模板管理 - 建立、編輯、複製、刪除模板
 * 2. 協作管理 - 邀請其他 mentor 共同編輯
 * 3. 權限控制 - 管理模板的公開/私人狀態
 * 4. 使用統計 - 查看模板的使用情況
 * 5. 模板庫 - 瀏覽和使用其他 mentor 的公開模板
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  Settings,
  Plus,
  Calendar,
  BarChart3,
  FileText,
  MessageSquare,
  TrendingUp,
  Clock,
  Layers,
  Copy,
  Share2,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Grid,
  List,
  X,
  RefreshCw
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { useTopicTemplateStore } from '../../store/topicTemplateStore';
import { useUser } from '../../context/UserContext';
import { usePermissions, PermissionBadge, CollaboratorList } from '../../components/template/PermissionManager';

import { TemplateEditor } from '../../components/template/TemplateEditor';
import { SUBJECTS } from '../../constants/subjects';
import type { TopicTemplate } from '../../types/goal';

const MentorCurriculum: React.FC = () => {
  const {
    templates,
    loading: storeLoading,
    error,
    fetchAllTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    copyTemplate,
    togglePublic,
    toggleCollaborative,
    clearError
  } = useTopicTemplateStore();

  const { currentUser } = useUser();
  const { checkTemplatePermission } = usePermissions(currentUser?.id || '');

  // Debug: 檢查 currentUser 狀態（只在 currentUser 改變時執行）
  useEffect(() => {
    console.log('🔍 [MentorCurriculum] currentUser:', {
      hasUser: !!currentUser,
      userId: currentUser?.id,
      userName: currentUser?.name,
      userRoles: currentUser?.roles
    });
  }, [currentUser]);

  const [currentView, setCurrentView] = useState<'my' | 'public' | 'collaborative'>('my');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showCreateBlankModal, setShowCreateBlankModal] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TopicTemplate | null>(null);

  // 客戶端過濾模板
  const getFilteredTemplates = () => {
    if (!currentUser) return [];
    
    let filteredByCategory = templates;
    
    // 根據分頁過濾
    if (currentView === 'my') {
      filteredByCategory = templates.filter(template => template.created_by === currentUser.id);
    } else if (currentView === 'public') {
      filteredByCategory = templates.filter(template => template.is_public);
    } else if (currentView === 'collaborative') {
      filteredByCategory = templates.filter(template => 
        template.collaborators?.some(collab => collab.user_id === currentUser.id)
      );
    }
    
    // 根據搜尋和學科過濾
    return filteredByCategory.filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = !selectedSubject || template.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  };
  
  const filteredTemplates = getFilteredTemplates();
  
  // 計算統計數據
  const stats = {
    totalTemplates: currentUser ? templates.filter(t => t.created_by === currentUser.id).length : 0,
    publicTemplates: templates.filter(t => t.is_public).length,
    collaborativeTemplates: currentUser ? templates.filter(t => 
      t.collaborators?.some(collab => collab.user_id === currentUser.id)
    ).length : 0,
    totalUsage: currentUser ? templates
      .filter(t => t.created_by === currentUser.id)
      .reduce((sum, t) => sum + t.usage_count, 0) : 0
  };
  
  // 初始化：載入所有模板
  useEffect(() => {
    fetchAllTemplates();
  }, []);

  // 刷新模板數據
  const handleRefresh = async () => {
    await fetchAllTemplates();
  };

  // 處理編輯模板
  const handleEditTemplate = (template: TopicTemplate) => {
    setEditingTemplate(template);
    setShowTemplateEditor(true);
  };

  // 處理複製模板
  const handleCopyTemplate = async (template: TopicTemplate) => {
    const copiedTemplate = await copyTemplate({
      source_template_id: template.id,
      title: `${template.title} (複製)`,
      description: template.description || '',
      is_public: false
    });

    if (copiedTemplate) {
      // 重新載入所有模板數據
      await fetchAllTemplates();
    }
  };

  // 處理建立空白模板
  const handleCreateBlankTemplate = async (templateData: any) => {
    try {
      const newTemplate = await createTemplate({
        title: templateData.title,
        description: templateData.description,
        subject: templateData.subject || '未分類',
        category: templateData.category || 'learning',
        is_public: false,
        is_collaborative: templateData.is_collaborative,
        goals: [],
        bubbles: []
      });

      if (newTemplate) {
        // 重新載入所有模板數據
        await fetchAllTemplates();
        setShowCreateBlankModal(false);
      }
    } catch (error) {
      console.error('建立模板失敗:', error);
    }
  };

  return (
    <PageLayout title="課程模板管理">
      <div className="space-y-6">
        {/* 錯誤提示 */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-center">
              <p className="text-red-800">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 統計卡片 - 縮小版 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Layers}
            title="我的模板"
            value={stats.totalTemplates}
            description="已建立的模板"
            color="bg-blue-500"
            compact
          />
          <StatCard
            icon={Eye}
            title="公開模板"
            value={stats.publicTemplates}
            description="對學生公開"
            color="bg-green-500"
            compact
          />
          <StatCard
            icon={Users}
            title="協作模板"
            value={stats.collaborativeTemplates}
            description="我參與協作的"
            color="bg-purple-500"
            compact
          />
          <StatCard
            icon={TrendingUp}
            title="總使用次數"
            value={stats.totalUsage}
            description="學生使用統計"
            color="bg-orange-500"
            compact
          />
        </div>

        {/* 主要工具欄 */}
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
                  onClick={() => setCurrentView(key as any)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                    currentView === key
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
                onClick={handleRefresh}
                disabled={storeLoading}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${storeLoading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              <button
                onClick={() => setShowCreateBlankModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                建立空白模板
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
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 模板列表 */}
        {storeLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <TemplateList
            templates={filteredTemplates}
            viewMode={viewMode}
            currentUserId={currentUser?.id || ''}
            onEdit={handleEditTemplate}
            onCopy={(templateId) => {
              const template = filteredTemplates.find(t => t.id === templateId);
              if (template) {
                handleCopyTemplate(template);
              }
            }}
            onDelete={async (templateId) => {
              const success = await deleteTemplate(templateId);
              if (success) {
                await fetchAllTemplates();
              }
            }}
            onTogglePublic={async (templateId) => {
              const success = await togglePublic(templateId);
              if (success) {
                await fetchAllTemplates();
              }
            }}
            onToggleCollaborative={async (templateId) => {
              const success = await toggleCollaborative(templateId);
              if (success) {
                await fetchAllTemplates();
              }
            }}
            checkPermission={checkTemplatePermission}
          />
        )}

        {filteredTemplates.length === 0 && !storeLoading && (
          <div className="text-center py-12">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到模板</h3>
            <p className="text-gray-500 mb-4">
              {currentView === 'my' ? '開始建立您的第一個課程模板' : '沒有符合條件的模板'}
            </p>
            {currentView === 'my' && (
              <button
                onClick={() => setShowCreateBlankModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                建立空白模板
              </button>
            )}
          </div>
        )}
      </div>

      {/* 建立空白模板 Modal */}
      <CreateBlankTemplateModal
        isOpen={showCreateBlankModal}
        onClose={() => setShowCreateBlankModal(false)}
        onSubmit={handleCreateBlankTemplate}
      />
      
      {/* 模板編輯器 */}
      {showTemplateEditor && editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => {
            setShowTemplateEditor(false);
            setEditingTemplate(null);
          }}
          onSave={async (updatedTemplate) => {
            // 更新模板後重新載入所有數據
            await fetchAllTemplates();
            setShowTemplateEditor(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </PageLayout>
  );
};

// 統計卡片組件
interface StatCardProps {
  icon: React.ComponentType<any>;
  title: string;
  value: number;
  description: string;
  color: string;
  compact?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, description, color, compact = false }) => {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200"
    >
      <div className={compact ? "p-4" : "p-6"}>
        <div className="flex items-center">
          <div className={`flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-12 h-12'} rounded-lg ${color} text-white`}>
            <Icon className={compact ? "w-4 h-4" : "w-6 h-6"} />
          </div>
          <div className={compact ? "ml-3" : "ml-4"}>
            <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-500`}>{title}</p>
            <p className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>{value}</p>
          </div>
        </div>
        {!compact && (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        )}
      </div>
    </div>
  );
};

// 模板列表組件
interface TemplateListProps {
  templates: TopicTemplate[];
  viewMode: 'grid' | 'list';
  currentUserId: string;
  onEdit: (template: TopicTemplate) => void;
  onCopy: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  onTogglePublic: (templateId: string) => void;
  onToggleCollaborative: (templateId: string) => void;
  checkPermission: (template: TopicTemplate, permission: any) => boolean;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  viewMode,
  currentUserId,
  onEdit,
  onCopy,
  onDelete,
  onTogglePublic,
  onToggleCollaborative,
  checkPermission
}) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onCopy={onCopy}
            onDelete={onDelete}
            onTogglePublic={onTogglePublic}
            onToggleCollaborative={onToggleCollaborative}
            checkPermission={checkPermission}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                模板
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                學科
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                使用情況
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                協作者
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.map((template) => (
              <TemplateRow
                key={template.id}
                template={template}
                currentUserId={currentUserId}
                onEdit={onEdit}
                onCopy={onCopy}
                onDelete={onDelete}
                onTogglePublic={onTogglePublic}
                onToggleCollaborative={onToggleCollaborative}
                checkPermission={checkPermission}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 模板卡片組件
interface TemplateCardProps {
  template: TopicTemplate;
  currentUserId: string;
  onEdit: (template: TopicTemplate) => void;
  onCopy: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  onTogglePublic: (templateId: string) => void;
  onToggleCollaborative: (templateId: string) => void;
  checkPermission: (template: TopicTemplate, permission: any) => boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  currentUserId,
  onEdit,
  onCopy,
  onDelete,
  onTogglePublic,
  onToggleCollaborative,
  checkPermission
}) => {
  const isOwner = template.created_by === currentUserId;
  const canEdit = isOwner || checkPermission(template, 'edit');
  const canAdmin = isOwner || checkPermission(template, 'admin');
  
  // Debug 資訊
  console.log('TemplateCard Debug:', {
    templateTitle: template.title,
    templateCreatedBy: template.created_by,
    currentUserId: currentUserId,
    isOwner: isOwner,
    templateCreatedByType: typeof template.created_by,
    currentUserIdType: typeof currentUserId
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setShowDropdown(false);
  };

  const confirmDelete = () => {
    onDelete(template.id);
    setShowDeleteConfirm(false);
  };

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.dropdown-menu')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all duration-200"
    >
      <div className="h-2 bg-indigo-500" />
      
      <div className="p-6">
        {/* 標題和選單 */}
        <div className="mb-3 flex justify-between items-start">
          <h3 className="font-bold text-gray-900 text-lg line-clamp-2 flex-1">
            {template.title}
          </h3>
          
          {/* 三個點選單 - 只有 owner 才顯示 */}
          {isOwner && (
            <div className="relative ml-2 dropdown-menu">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    刪除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 描述 */}
        {template.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* 標籤 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
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

          {isOwner && (
            <PermissionBadge permission="owner" isOwner />
          )}
        </div>

        {/* 統計資訊 */}
        <div className="flex justify-between text-xs text-gray-500 mb-4">
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

        {/* 協作者 */}
        {template.collaborators && template.collaborators.length > 0 && (
          <CollaboratorList
            collaborators={template.collaborators}
            ownerId={template.created_by}
            maxDisplay={3}
          />
        )}

        {/* 操作按鈕 - 放在底部 */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => onEdit(template)}
            className="flex-1 px-3 py-2 text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 text-sm"
          >
            <Eye className="w-4 h-4" />
            瀏覽
          </button>
          <button
            onClick={() => onCopy(template.id)}
            className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            複製
          </button>
        </div>
      </div>
      
      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">確認刪除</h3>
                <p className="text-sm text-gray-600">此操作無法復原</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              確定要刪除模板「<span className="font-medium">{template.title}</span>」嗎？
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 模板行組件（列表模式）
interface TemplateRowProps extends TemplateCardProps {}

const TemplateRow: React.FC<TemplateRowProps> = ({
  template,
  currentUserId,
  onEdit,
  onCopy,
  onDelete,
  onTogglePublic,
  onToggleCollaborative,
  checkPermission
}) => {
  const isOwner = template.created_by === currentUserId;
  const canEdit = isOwner || checkPermission(template, 'edit');
  const canAdmin = isOwner || checkPermission(template, 'admin');

  // Debug 資訊
  console.log('TemplateRow Debug:', {
    templateTitle: template.title,
    templateCreatedBy: template.created_by,
    currentUserId: currentUserId,
    isOwner: isOwner,
    templateCreatedByType: typeof template.created_by,
    currentUserIdType: typeof currentUserId
  });

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="font-medium text-gray-900">{template.title}</div>
          {template.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {template.description}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
          {template.subject || '未分類'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex gap-1">
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
          {isOwner && <PermissionBadge permission="owner" isOwner />}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div>
          <div>使用 {template.usage_count} 次</div>
          <div>複製 {template.copy_count} 次</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {template.collaborators && template.collaborators.length > 0 ? (
          <CollaboratorList
            collaborators={template.collaborators}
            ownerId={template.created_by}
            maxDisplay={2}
          />
        ) : (
          <span className="text-sm text-gray-500">無</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(template)}
            className="text-indigo-600 hover:text-indigo-900"
          >
            瀏覽
          </button>
          <button
            onClick={() => onCopy(template.id)}
            className="text-gray-600 hover:text-gray-900"
          >
            複製
          </button>
          {isOwner && (
            <button
              onClick={() => onDelete(template.id)}
              className="text-red-600 hover:text-red-900"
            >
              刪除
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// 建立空白模板 Modal - 採用 TopicTemplateBrowser 的風格
interface CreateBlankTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateBlankTemplateModal: React.FC<CreateBlankTemplateModalProps> = ({
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
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
        style={{
          background: 'linear-gradient(135deg, #fefdf8 0%, #faf7f0 50%, #f7f3e9 100%)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">建立空白模板</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  模板標題 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                  placeholder="輸入模板標題..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                  placeholder="輸入模板描述..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    學科
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                  >
                    <option value="">選擇學科</option>
                    {Object.values(SUBJECTS).map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    分類
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                  >
                    <option value="">選擇分類</option>
                    <option value="learning">學習成長</option>
                    <option value="personal">個人發展</option>
                    <option value="project">專案計畫</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                <input
                  type="checkbox"
                  id="is_collaborative_template"
                  checked={formData.is_collaborative}
                  onChange={(e) => setFormData({ ...formData, is_collaborative: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_collaborative_template" className="text-sm text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  啟用協作模式（可邀請其他 mentor 共同編輯）
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50/50 border-t border-gray-200/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              建立模板
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorCurriculum;