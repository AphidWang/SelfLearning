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
import { motion, AnimatePresence } from 'framer-motion';
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
  X
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { useTopicTemplateStore } from '../../store/topicTemplateStore';
import { useUserStore } from '../../store/userStore';
import { usePermissions, PermissionBadge, CollaboratorList } from '../../components/template/PermissionManager';
import { TopicTemplateBrowser } from '../../components/template/TopicTemplateBrowser';
import { SUBJECTS } from '../../constants/subjects';
import type { TopicTemplate } from '../../types/goal';

const MentorCurriculum: React.FC = () => {
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
    clearError
  } = useTopicTemplateStore();

  const { user } = useUserStore();
  const { checkTemplatePermission } = usePermissions(user?.id || '');

  const [currentView, setCurrentView] = useState<'my' | 'public' | 'collaborative'>('my');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 載入資料
  useEffect(() => {
    if (currentView === 'my') {
      fetchMyTemplates();
    } else if (currentView === 'public') {
      fetchPublicTemplates();
    } else {
      fetchCollaborativeTemplates();
    }
  }, [currentView]);

  // 過濾模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || template.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // 獲取統計數據
  const stats = {
    totalTemplates: templates.length,
    publicTemplates: templates.filter(t => t.is_public).length,
    collaborativeTemplates: templates.filter(t => t.is_collaborative).length,
    totalUsage: templates.reduce((sum, t) => sum + t.usage_count, 0)
  };

  return (
    <PageLayout title="課程模板管理">
      <div className="space-y-6">
        {/* 錯誤提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
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
          </motion.div>
        )}

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Layers}
            title="我的模板"
            value={stats.totalTemplates}
            description="已建立的模板"
            color="bg-blue-500"
          />
          <StatCard
            icon={Eye}
            title="公開模板"
            value={stats.publicTemplates}
            description="對學生公開"
            color="bg-green-500"
          />
          <StatCard
            icon={Users}
            title="協作模板"
            value={stats.collaborativeTemplates}
            description="團隊協作中"
            color="bg-purple-500"
          />
          <StatCard
            icon={TrendingUp}
            title="總使用次數"
            value={stats.totalUsage}
            description="學生使用統計"
            color="bg-orange-500"
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
                onClick={() => setShowTemplateBrowser(true)}
                className="flex items-center gap-2 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Search className="w-4 h-4" />
                瀏覽模板庫
              </button>
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
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <TemplateList
            templates={filteredTemplates}
            viewMode={viewMode}
            currentUserId={user?.id || ''}
            onEdit={(template) => {
              // TODO: 開啟編輯模式
              console.log('編輯模板:', template.id);
            }}
            onCopy={copyTemplate}
            onDelete={deleteTemplate}
            onTogglePublic={togglePublic}
            onToggleCollaborative={toggleCollaborative}
            checkPermission={checkTemplatePermission}
          />
        )}

        {filteredTemplates.length === 0 && !loading && (
          <div className="text-center py-12">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到模板</h3>
            <p className="text-gray-500 mb-4">
              {currentView === 'my' ? '開始建立您的第一個課程模板' : '沒有符合條件的模板'}
            </p>
            {currentView === 'my' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                建立模板
              </button>
            )}
          </div>
        )}
      </div>

      {/* 模板瀏覽器 */}
      <TopicTemplateBrowser
        isOpen={showTemplateBrowser}
        onClose={() => setShowTemplateBrowser(false)}
        onTemplateSelected={(templateId) => {
          console.log('選擇了模板:', templateId);
        }}
      />

      {/* TODO: 建立模板 Modal */}
      {/* TODO: 編輯模板 Modal */}
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
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, description, color }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${color} text-white`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>
    </motion.div>
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
        <AnimatePresence>
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
        </AnimatePresence>
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
  const [showActions, setShowActions] = useState(false);
  const isOwner = template.created_by === currentUserId;
  const canEdit = isOwner || checkPermission(template, 'edit');
  const canAdmin = isOwner || checkPermission(template, 'admin');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
    >
      <div className="h-2 bg-indigo-500" />
      
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
                {canEdit && (
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
                )}
                <button
                  onClick={() => {
                    onCopy(template.id);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  複製
                </button>
                {canAdmin && (
                  <>
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
                  </>
                )}
                {isOwner && (
                  <>
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
                  </>
                )}
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
      </div>
    </motion.div>
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
          {canEdit && (
            <button
              onClick={() => onEdit(template)}
              className="text-indigo-600 hover:text-indigo-900"
            >
              編輯
            </button>
          )}
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

export default MentorCurriculum;