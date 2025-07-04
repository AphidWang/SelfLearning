import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Pencil, Trash2, Brain, Archive } from 'lucide-react';
import { subjects } from '../../../styles/tokens';
import type { Topic } from '../../../types/goal';

interface TopicHeaderProps {
  topic: Topic;
  editedTopic: Topic | null;
  isEditingTitle: boolean;
  showSubjectDropdown: boolean;
  subjectStyle: any;
  onEditingToggle: (editing: boolean) => void;
  onShowSubjectDropdown: (show: boolean) => void;
  onTopicUpdate: (updates: Partial<Topic>) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onDelete: () => void;
  onClose: () => void;
  isMentor?: boolean;
  onSaveAsTemplate?: () => void;
}

export const TopicHeader: React.FC<TopicHeaderProps> = ({
  topic,
  editedTopic,
  isEditingTitle,
  showSubjectDropdown,
  subjectStyle,
  onEditingToggle,
  onShowSubjectDropdown,
  onTopicUpdate,
  onSave,
  onCancel,
  onDelete,
  onClose,
  isMentor = false,
  onSaveAsTemplate
}) => {
  return (
    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-3">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center mt-1 flex-shrink-0"
            style={{ backgroundColor: `${subjectStyle.accent}20` }}
          >
            <Brain className="w-5 h-5" style={{ color: subjectStyle.accent }} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <div className="flex items-center gap-3 mb-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editedTopic?.title || ''}
                      onChange={(e) => onTopicUpdate({ title: e.target.value })}
                      className="text-xl font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:border-transparent flex-1"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          onSave();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="relative flex-shrink-0 subject-dropdown">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowSubjectDropdown(!showSubjectDropdown);
                        }}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${subjects.getSubjectStyle(editedTopic?.subject || '').bg} ${subjects.getSubjectStyle(editedTopic?.subject || '').text} hover:opacity-80 transition-opacity`}
                      >
                        {editedTopic?.subject || '未分類'}
                        <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {showSubjectDropdown && (
                        <div 
                          className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[120px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {Object.keys(subjects.colors).map((subject) => {
                            const subjectStyles = subjects.getSubjectStyle(subject);
                            return (
                              <button
                                key={subject}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTopicUpdate({ subject: subject as any });
                                  onShowSubjectDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 ${
                                  (editedTopic?.subject || '') === subject ? 'bg-gray-100 dark:bg-gray-700' : ''
                                }`}
                              >
                                <span 
                                  className="inline-block w-3 h-3 rounded-full"
                                  style={{ backgroundColor: subjectStyles.accent }}
                                />
                                {subject}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-1">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
                      {topic.title}
                    </h1>
                    <span 
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${subjectStyle.bg} ${subjectStyle.text} flex-shrink-0`}
                    >
                      {topic.subject || '未分類'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {isEditingTitle ? (
              <textarea
                value={editedTopic?.description || ''}
                onChange={(e) => onTopicUpdate({ description: e.target.value })}
                className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                rows={2}
                placeholder="輸入主題描述..."
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{topic.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 編輯按鈕 */}
          {isEditingTitle ? (
            <>
              <button
                onClick={onSave}
                className="w-9 h-9 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                aria-label="完成編輯"
              >
                <Check className="w-5 h-5 text-green-600" />
              </button>
              <button
                onClick={onCancel}
                className="w-9 h-9 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                aria-label="取消編輯"
              >
                <X className="w-5 h-5 text-red-600" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEditingToggle(true)}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="編輯標題"
              >
                <Pencil className="w-5 h-5 text-gray-500" />
              </button>

              {/* 存為模板按鈕 - 只有 mentor 才能看到 */}
              {isMentor && onSaveAsTemplate && (
                <button
                  onClick={onSaveAsTemplate}
                  className="w-9 h-9 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
                  title="存為主題模板"
                >
                  <Archive className="w-5 h-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                </button>
              )}
            </>
          )}

          {/* 刪除按鈕 */}
          <button
            onClick={onDelete}
            className="w-9 h-9 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
            title="刪除主題"
          >
            <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
          </button>

          {/* 關閉按鈕 */}
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="關閉"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}; 