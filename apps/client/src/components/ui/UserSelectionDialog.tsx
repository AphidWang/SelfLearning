import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, UserPlus } from 'lucide-react';
import type { User } from '../../types/goal';

interface UserSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  availableUsers: User[];
  selectedUsers?: User[];
  title?: string;
  description?: string;
  maxHeight?: string;
}

export const UserSelectionDialog: React.FC<UserSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  availableUsers,
  selectedUsers = [],
  title = '選擇用戶',
  description = '選擇要加入的用戶',
  maxHeight = '80vh'
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // 根據搜索詞過濾用戶
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;
    const query = searchQuery.toLowerCase();
    return availableUsers.filter(user => 
      user.name.toLowerCase().includes(query)
    );
  }, [availableUsers, searchQuery]);

  // 檢查用戶是否已被選中
  const isUserSelected = (user: User) => {
    return selectedUsers.some(selectedUser => selectedUser.id === user.id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋用戶..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* User List */}
            <div className="overflow-y-auto" style={{ maxHeight }}>
              <div className="grid grid-cols-2 gap-3 p-4">
                {filteredUsers.map(user => {
                  const selected = isUserSelected(user);
                  return (
                    <motion.div
                      key={user.id}
                      className={`relative group cursor-pointer rounded-xl border ${
                        selected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                      onClick={() => onSelect(user)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="p-4 flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800"
                          />
                          {selected && (
                            <div className="absolute -right-1 -bottom-1 bg-blue-500 rounded-full p-1">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>

                        {/* Action Button */}
                        <div className={`
                          p-2 rounded-full transition-colors
                          ${selected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-500 group-hover:bg-blue-500 group-hover:text-white dark:bg-gray-700'
                          }
                        `}>
                          {selected ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 