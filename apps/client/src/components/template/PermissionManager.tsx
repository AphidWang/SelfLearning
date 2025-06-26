/**
 * 權限管理組件
 * 
 * 功能：
 * 1. 檢查用戶對模板/主題的權限
 * 2. 管理協作者權限
 * 3. 顯示權限相關的 UI 元素
 */

import React from 'react';
import { Eye, Edit3, Shield, Users, Lock } from 'lucide-react';
import type { TopicTemplate, TopicWithSupabase, User } from '../../types/goal';

// 權限類型
export type Permission = 'view' | 'edit' | 'admin' | 'owner';

// 權限檢查 Hook
export const usePermissions = (currentUserId: string) => {
  // 檢查模板權限
  const checkTemplatePermission = (template: TopicTemplate, requiredPermission: Permission): boolean => {
    // 擁有者有所有權限
    if (template.created_by === currentUserId) {
      return true;
    }

    // 檢查協作者權限
    const collaborator = template.collaborators?.find(c => c.user_id === currentUserId);
    if (!collaborator) return false;

    switch (requiredPermission) {
      case 'view':
        return ['view', 'edit', 'admin'].includes(collaborator.permission);
      case 'edit':
        return ['edit', 'admin'].includes(collaborator.permission);
      case 'admin':
        return collaborator.permission === 'admin';
      case 'owner':
        return template.created_by === currentUserId;
      default:
        return false;
    }
  };

  // 檢查主題權限
  const checkTopicPermission = (topic: TopicWithSupabase, requiredPermission: Permission): boolean => {
    // 擁有者有所有權限
    if (topic.owner_id === currentUserId) {
      return true;
    }

    // 檢查協作者權限
    const collaborator = topic.topic_collaborators?.find(c => c.user_id === currentUserId);
    if (!collaborator) return false;

    switch (requiredPermission) {
      case 'view':
        return ['view', 'edit'].includes(collaborator.permission);
      case 'edit':
        return collaborator.permission === 'edit';
      case 'owner':
        return topic.owner_id === currentUserId;
      default:
        return false;
    }
  };

  return {
    checkTemplatePermission,
    checkTopicPermission
  };
};

// 權限標籤組件
interface PermissionBadgeProps {
  permission: Permission;
  isOwner?: boolean;
  className?: string;
}

export const PermissionBadge: React.FC<PermissionBadgeProps> = ({
  permission,
  isOwner = false,
  className = ''
}) => {
  const getPermissionConfig = () => {
    if (isOwner) {
      return {
        icon: Shield,
        text: '擁有者',
        color: 'bg-purple-100 text-purple-800'
      };
    }

    switch (permission) {
      case 'view':
        return {
          icon: Eye,
          text: '檢視',
          color: 'bg-gray-100 text-gray-800'
        };
      case 'edit':
        return {
          icon: Edit3,
          text: '編輯',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'admin':
        return {
          icon: Shield,
          text: '管理',
          color: 'bg-green-100 text-green-800'
        };
      default:
        return {
          icon: Lock,
          text: '無權限',
          color: 'bg-red-100 text-red-800'
        };
    }
  };

  const config = getPermissionConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.color} ${className}`}>
      <Icon className="w-3 h-3" />
      {config.text}
    </span>
  );
};

// 協作者列表組件
interface CollaboratorListProps {
  collaborators: Array<{
    user_id: string;
    permission: 'view' | 'edit' | 'admin';
    user?: User;
  }>;
  ownerId?: string;
  owner?: User;
  showPermissions?: boolean;
  maxDisplay?: number;
  className?: string;
}

export const CollaboratorList: React.FC<CollaboratorListProps> = ({
  collaborators,
  ownerId,
  owner,
  showPermissions = false,
  maxDisplay = 5,
  className = ''
}) => {
  const displayCollaborators = collaborators.slice(0, maxDisplay);
  const remainingCount = Math.max(0, collaborators.length - maxDisplay);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 擁有者 */}
      {owner && (
        <div className="flex items-center gap-1">
          <div
            className="w-8 h-8 rounded-full bg-purple-200 border-2 border-purple-400 flex items-center justify-center text-sm font-medium text-purple-800"
            title={`${owner.name} (擁有者)`}
          >
            {owner.name?.[0] || '?'}
          </div>
          {showPermissions && <PermissionBadge permission="owner" isOwner />}
        </div>
      )}

      {/* 協作者 */}
      <div className="flex -space-x-1">
        {displayCollaborators.map((collaborator) => (
          <div
            key={collaborator.user_id}
            className="relative group"
          >
            <div
              className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-sm font-medium"
              title={collaborator.user?.name || '未知用戶'}
            >
              {collaborator.user?.name?.[0] || '?'}
            </div>
            
            {showPermissions && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <PermissionBadge permission={collaborator.permission} />
              </div>
            )}
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div
            className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500"
            title={`還有 ${remainingCount} 位協作者`}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {/* 協作者總數 */}
      {collaborators.length > 0 && (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {collaborators.length} 位協作者
        </span>
      )}
    </div>
  );
};

// 權限檢查包裝組件
interface PermissionGateProps {
  children: React.ReactNode;
  hasPermission: boolean;
  fallback?: React.ReactNode;
  className?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  hasPermission,
  fallback = null,
  className = ''
}) => {
  if (!hasPermission) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <div className={className}>{children}</div>;
};

// 權限提示組件
interface PermissionHintProps {
  requiredPermission: Permission;
  currentPermission?: Permission;
  className?: string;
}

export const PermissionHint: React.FC<PermissionHintProps> = ({
  requiredPermission,
  currentPermission,
  className = ''
}) => {
  const getHintText = () => {
    switch (requiredPermission) {
      case 'view':
        return '需要檢視權限才能查看此內容';
      case 'edit':
        return '需要編輯權限才能修改此內容';
      case 'admin':
        return '需要管理權限才能執行此操作';
      case 'owner':
        return '只有擁有者才能執行此操作';
      default:
        return '權限不足';
    }
  };

  return (
    <div className={`flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
      <Lock className="w-4 h-4 text-yellow-600" />
      <span className="text-yellow-800 text-sm">{getHintText()}</span>
      {currentPermission && (
        <PermissionBadge permission={currentPermission} className="ml-auto" />
      )}
    </div>
  );
};

// 權限相關工具函數
export const PermissionUtils = {
  // 獲取權限等級數值（用於比較）
  getPermissionLevel: (permission: Permission): number => {
    switch (permission) {
      case 'view': return 1;
      case 'edit': return 2;
      case 'admin': return 3;
      case 'owner': return 4;
      default: return 0;
    }
  },

  // 檢查權限是否足夠
  hasPermission: (userPermission: Permission, requiredPermission: Permission): boolean => {
    return PermissionUtils.getPermissionLevel(userPermission) >= PermissionUtils.getPermissionLevel(requiredPermission);
  },

  // 獲取權限描述
  getPermissionDescription: (permission: Permission): string => {
    switch (permission) {
      case 'view': return '可以查看內容，但無法修改';
      case 'edit': return '可以查看和編輯內容';
      case 'admin': return '可以管理協作者和設定';
      case 'owner': return '擁有完整控制權';
      default: return '無權限';
    }
  }
}; 