import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar, UserAvatarGroup } from './UserAvatar';
import type { User } from '../../types/goal';
import { 
  Users, Plus, X, Check, Crown, UserPlus, Trash2, 
  ChevronDown, ChevronUp 
} from 'lucide-react';

interface CollaborationManagerProps {
  title: string;
  owner?: User;
  collaborators?: User[];
  availableUsers: User[];
  onSetOwner: (user: User) => void;
  onAddCollaborator: (user: User) => void;
  onRemoveCollaborator: (userId: string) => void;
  className?: string;
}

export const CollaborationManager: React.FC<CollaborationManagerProps> = ({
  title,
  owner,
  collaborators = [],
  availableUsers,
  onSetOwner,
  onAddCollaborator,
  onRemoveCollaborator,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOwnerSelector, setShowOwnerSelector] = useState(false);
  const [showCollaboratorSelector, setShowCollaboratorSelector] = useState(false);

  // 使用 useMemo 優化可用用戶的計算
  const availableForOwner = useMemo(() => 
    availableUsers.filter(user => user.id !== owner?.id),
    [availableUsers, owner?.id]
  );
  
  const availableForCollaborator = useMemo(() => 
    availableUsers.filter(user => 
      !(collaborators || []).some(c => c.id === user.id)
    ),
    [availableUsers, collaborators]
  );

  // 使用 useMemo 優化日誌輸出
  const debugInfo = useMemo(() => ({
    all: availableUsers,
    forOwner: availableForOwner,
    forCollaborator: availableForCollaborator,
    currentOwner: owner,
    currentCollaborators: collaborators
  }), [availableUsers, availableForOwner, availableForCollaborator, owner, collaborators]);

  console.log('🔍 CollaborationManager - Available Users:', debugInfo);

  return (
    <div className={`bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 ${className}`}>
      {/* 標題和摺疊按鈕 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-100/30 dark:hover:bg-blue-800/20 rounded-t-xl transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm">{title}</h4>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 快速預覽 */}
          <div className="flex items-center gap-1">
            {owner && <UserAvatar user={owner} size="xs" />}
            {collaborators.length > 0 && (
              <UserAvatarGroup users={collaborators} size="xs" maxDisplay={2} />
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
              
              {/* 主要負責人 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    主要負責人
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOwnerSelector(!showOwnerSelector);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                  >
                    {owner ? '更換' : '設定'}
                  </button>
                </div>
                
                {owner ? (
                  <div className="flex items-center gap-2 p-2 bg-white/60 dark:bg-gray-800/40 rounded-lg">
                    <UserAvatar user={owner} size="xs" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {owner.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {owner.role === 'student' ? '學生' :
                         owner.role === 'mentor' ? '導師' :
                         owner.role === 'parent' ? '家長' : 
                         owner.role === 'admin' ? '管理員' : '其他'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-gray-100/60 dark:bg-gray-800/40 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400">
                    尚未指定負責人
                  </div>
                )}

                {/* Owner 選擇器 */}
                {showOwnerSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm max-h-32 overflow-y-auto"
                  >
                    {availableForOwner.map((user) => (
                      <button
                        key={user.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetOwner(user);
                          setShowOwnerSelector(false);
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
                  </motion.div>
                )}
              </div>

              {/* 協作人員 */}
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
                    新增
                  </button>
                </div>

                {/* 現有協作人員列表 */}
                <div className="space-y-1">
                  {collaborators.map((collaborator) => (
                    <motion.div
                      key={collaborator.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-2 p-2 bg-white/60 dark:bg-gray-800/40 rounded-lg"
                    >
                      <UserAvatar user={collaborator} size="xs" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {collaborator.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {collaborator.role === 'student' ? '學生' :
                           collaborator.role === 'mentor' ? '導師' :
                           collaborator.role === 'parent' ? '家長' : 
                           collaborator.role === 'admin' ? '管理員' : '其他'}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveCollaborator(collaborator.id);
                        }}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="移除協作人員"
                      >
                        <X className="w-3 h-3" />
                      </button>
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
                          onAddCollaborator(user);
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
                        沒有可新增的用戶
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 