import React, { useState, useMemo } from 'react';
import { UserPlus, Users, X, Check, Eye } from 'lucide-react';
import { UserAvatar } from '../../learning-map/UserAvatar';
import type { User, Topic } from '../../../types/goal';

interface Collaborator extends User {
  permission: 'view' | 'edit';
}

interface TopicCollaborationManagerProps {
  topic: Topic;
  availableUsers: User[];
  collaborators: Collaborator[];
  onInviteCollaborator: (userId: string, permission: 'view' | 'edit') => Promise<boolean>;
  onRemoveCollaborator: (userId: string) => Promise<boolean>;
  onToggleCollaborative: () => Promise<boolean>;
  isUpdating?: boolean;
  className?: string;
}

export const TopicCollaborationManager: React.FC<TopicCollaborationManagerProps> = ({
  topic,
  availableUsers,
  collaborators,
  onInviteCollaborator,
  onRemoveCollaborator,
  onToggleCollaborative,
  isUpdating = false,
  className = ''
}) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);

  const handleInvite = async (userId: string, permission: 'view' | 'edit' = 'view') => {
    const success = await onInviteCollaborator(userId, permission);
    if (success) {
      setShowInviteDialog(false);
    }
  };

  const handleToggleCollaborative = async () => {
    const success = await onToggleCollaborative();
    if (success) {
      setShowToggleConfirm(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 協作模式開關 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">協作模式</span>
          {topic.is_collaborative && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              已開啟
            </span>
          )}
        </div>
        <button
          onClick={() => setShowToggleConfirm(true)}
          disabled={isUpdating}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            topic.is_collaborative
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          } disabled:opacity-50`}
        >
          {topic.is_collaborative ? '關閉協作' : '開啟協作'}
        </button>
      </div>

      {/* 協作者管理 - 只在協作模式開啟時顯示 */}
      {topic.is_collaborative && (
        <>
          {/* 協作者列表 */}
          {collaborators.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  協作者 ({collaborators.length})
                </h5>
              </div>
              <div className="space-y-2">
                {collaborators.map(collaborator => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar user={collaborator} size="sm" />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {collaborator.name}
                        </span>
                        <div className="text-xs text-gray-500">
                          {collaborator.permission === 'edit' ? '可編輯' : '僅檢視'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveCollaborator(collaborator.id)}
                      disabled={isUpdating}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                      title="移除協作者"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 邀請按鈕 */}
          {availableUsers.length > 0 && (
            <button
              onClick={() => setShowInviteDialog(true)}
              disabled={isUpdating}
              className="w-full py-2 px-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              邀請協作者
            </button>
          )}
        </>
      )}

      {/* 開關協作模式確認對話框 */}
      {showToggleConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium mb-2">
              確認{topic.is_collaborative ? '關閉' : '開啟'}協作模式
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {topic.is_collaborative
                ? '關閉協作模式後，所有協作者將失去對此主題的訪問權限。'
                : '開啟協作模式後，您可以邀請其他用戶參與此主題的學習。'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowToggleConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleToggleCollaborative}
                disabled={isUpdating}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  topic.is_collaborative
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUpdating ? '處理中...' : (topic.is_collaborative ? '關閉' : '開啟')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 邀請協作者對話框 */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium mb-4">邀請協作者</h3>
            {availableUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">沒有可邀請的用戶</p>
                <p className="text-sm text-gray-400 mt-1">所有用戶都已是協作者</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {availableUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="sm" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>{user.email || user.id}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {user.role === 'student' ? '學生' :
                             user.role === 'mentor' ? '導師' :
                             user.role === 'parent' ? '家長' : 
                             user.role === 'admin' ? '管理員' : '其他'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleInvite(user.id, 'view')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        檢視
                      </button>
                      <button
                        onClick={() => handleInvite(user.id, 'edit')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        編輯
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowInviteDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 