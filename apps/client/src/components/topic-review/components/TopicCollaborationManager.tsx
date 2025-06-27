import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar, UserAvatarGroup } from '../../learning-map/UserAvatar';
import type { User } from '../../../types/goal';
import { 
  Users, Plus, X, Check, UserPlus, Trash2, 
  ChevronDown, ChevronUp 
} from 'lucide-react';

interface TopicCollaborationManagerProps {
  topic: {
    id: string;
    is_collaborative: boolean;
    owner?: User;
  };
  availableUsers: User[];
  collaborators: { user: User; permission: 'edit' | 'view' }[];
  onInviteCollaborator: (userId: string, permission: 'edit' | 'view') => Promise<boolean>;
  onRemoveCollaborator: (userId: string) => Promise<boolean>;
  onToggleCollaborative: () => Promise<boolean>;
  isUpdating?: boolean;
}

export const TopicCollaborationManager: React.FC<TopicCollaborationManagerProps> = ({
  topic,
  availableUsers,
  collaborators,
  onInviteCollaborator,
  onRemoveCollaborator,
  onToggleCollaborative,
  isUpdating = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCollaboratorSelector, setShowCollaboratorSelector] = useState(false);

  // 使用 useMemo 優化可用用戶的計算
  const availableForCollaborator = useMemo(() => 
    availableUsers.filter(user => 
      !collaborators.some(c => c.user.id === user.id)
    ),
    [availableUsers, collaborators]
  );

  return (
    <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
      {/* 標題和摺疊按鈕 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-100/30 dark:hover:bg-blue-800/20 rounded-t-xl transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm">協作管理</h4>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 快速預覽 */}
          <div className="flex items-center gap-1">
            {topic.owner && <UserAvatar user={topic.owner} size="xs" />}
            {collaborators.length > 0 && (
              <UserAvatarGroup users={collaborators.map(c => c.user)} size="xs" maxDisplay={2} />
            )}
          </div>
          
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
        </div>
      </div>

      {/* 展開的內容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3">
              {/* 協作模式開關 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    協作模式
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCollaborative();
                    }}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      topic.is_collaborative
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={isUpdating}
                  >
                    {topic.is_collaborative ? '已開啟' : '已關閉'}
                  </button>
                </div>
              </div>


              {/* 協作人員 */}
              {topic.is_collaborative && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <UserPlus className="w-3 h-3" />
                      協作人員 ({collaborators.length})
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCollaboratorSelector(!showCollaboratorSelector);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors flex items-center gap-1"
                      disabled={availableForCollaborator.length === 0}
                    >
                      <Plus className="w-3 h-3" />
                      邀請
                    </button>
                  </div>

                  {/* 現有協作人員列表 */}
                  <div className="space-y-1">
                    {collaborators.map((collaborator) => (
                      <motion.div
                        key={collaborator.user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-2 p-2 bg-white/60 dark:bg-gray-800/40 rounded-lg"
                      >
                        <UserAvatar user={collaborator.user} size="xs" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {collaborator.user.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {collaborator.user.role === 'student' ? '學生' :
                             collaborator.user.role === 'mentor' ? '導師' :
                             collaborator.user.role === 'parent' ? '家長' : 
                             collaborator.user.role === 'admin' ? '管理員' : '其他'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            collaborator.permission === 'edit'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {collaborator.permission === 'edit' ? '可編輯' : '僅查看'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveCollaborator(collaborator.user.id);
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="移除協作人員"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {collaborators.length === 0 && (
                      <div className="p-2 bg-gray-100/60 dark:bg-gray-800/40 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400">
                        尚無協作人員
                      </div>
                    )}
                  </div>

                  {/* 協作人員選擇器 */}
                  {showCollaboratorSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm max-h-32 overflow-y-auto"
                    >
                      {availableForCollaborator.map((user) => (
                        <button
                          key={user.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onInviteCollaborator(user.id, 'edit');
                            setShowCollaboratorSelector(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-left transition-colors"
                        >
                          <UserAvatar user={user} size="xs" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {user.role === 'student' ? '學生' :
                               user.role === 'mentor' ? '導師' :
                               user.role === 'parent' ? '家長' : 
                               user.role === 'admin' ? '管理員' : '其他'}
                            </div>
                          </div>
                        </button>
                      ))}
                      
                      {availableForCollaborator.length === 0 && (
                        <div className="p-2 text-center text-sm text-gray-500 dark:text-gray-400">
                          沒有可邀請的用戶
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 