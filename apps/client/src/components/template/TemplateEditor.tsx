/**
 * Template Editor Page - 模板編輯頁面
 * 
 * 重構為頁面形式，參考 TopicReviewPage 的架構：
 * - 左側：TemplateRadialMap 放射狀圖
 * - 右側：TemplateDetailsPanel 詳情面板
 * - 頂部：導航和工具欄
 * 
 * 功能：
 * 1. 使用 TemplateRadialMap 顯示模板結構
 * 2. 使用 TemplateDetailsPanel 進行詳細編輯
 * 3. 支援完整的 CRUD 操作
 * 4. 統一的狀態管理和錯誤處理
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Settings,
  BookOpen,
  Users,
  Eye,
  MoreVertical,
  Trash2,
  Copy
} from 'lucide-react';
import { TemplateRadialMap } from './TemplateRadialMap';
import { TemplateDetailsPanel } from './components/TemplateDetailsPanel';
import { useTemplateReview } from './hooks/useTemplateReview';
import { useTemplateStats } from './hooks/useTemplateStats';
import { subjects } from '../../styles/tokens';

interface TemplateEditorProps {
  templateId: string;
  onClose: () => void;
  onSave?: (template: any) => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  templateId,
  onClose,
  onSave
}) => {
  const { state, actions, computed } = useTemplateReview(templateId);
  const { templateStats } = useTemplateStats(templateId, state.template);
  
  // UI 狀態
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 記憶化主題樣式
  const subjectStyle = useMemo(() => {
    return subjects.getSubjectStyle(state.template?.subject || '');
  }, [state.template?.subject]);

  // 處理任務/目標選擇
  const handleNodeClick = (nodeId: string, nodeType: 'goal' | 'task' | 'template' = 'goal') => {
    if (nodeId === 'TEMPLATE') {
      actions.setSelectedGoal('TEMPLATE');
    } else if (nodeType === 'goal') {
      actions.setSelectedGoal(nodeId);
    } else if (nodeType === 'task') {
      // 找到任務所屬的目標
      const goal = state.template?.goals?.find(g => 
        g.tasks?.some(t => t.id === nodeId)
      );
      if (goal) {
        actions.setSelectedTask(nodeId, goal.id);
      }
    }
  };

  const handleTaskClick = (taskId: string, goalId: string) => {
    actions.setSelectedTask(taskId, goalId);
  };

  const handleGoalClick = (goalId: string) => {
    if (goalId === 'TEMPLATE') {
      actions.setSelectedGoal('TEMPLATE');
    } else {
      actions.setSelectedGoal(goalId);
    }
  };

  // 保存模板
  const handleSave = async () => {
    if (state.template) {
      onSave?.(state.template);
    }
  };

  // 刪除模板
  const handleDelete = async () => {
    try {
      await actions.handleDeleteTemplate();
      onClose();
    } catch (error) {
      console.error('刪除模板失敗:', error);
    }
  };

  if (!state.template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入模板中...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 w-full max-w-[1280px] h-[85vh] flex flex-col overflow-hidden"
        style={{ 
          borderColor: subjectStyle.accent,
          boxShadow: `0 20px 40px ${subjectStyle.accent}25`
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* 頂部標題區 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: subjectStyle.accent }}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{state.template.title}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span 
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: subjectStyle.accent }}
                  >
                    {state.template.subject}
                  </span>
                  <span>•</span>
                  <span>{computed.totalGoals} 目標</span>
                  <span>•</span>
                  <span>{computed.totalTasks} 任務</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{templateStats.usageCount} 次使用</span>
            </div>

            <button
              onClick={handleSave}
              disabled={state.isUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              保存
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    刪除模板
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 主要內容區 */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 min-h-0">
          {/* 左側：放射狀圖 */}
          <motion.div
            className="lg:col-span-2 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/40 overflow-hidden"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <TemplateRadialMap
              template={state.template}
              width={800}
              height={600}
              selectedGoalId={state.selectedGoalId}
              selectedTaskId={state.selectedTaskId}
              onGoalClick={handleGoalClick}
              onTaskClick={handleTaskClick}
              className="w-full h-full"
            />
          </motion.div>

          {/* 右側：詳情面板 */}
          <motion.div
            className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg border border-white/40 overflow-hidden"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <TemplateDetailsPanel
              template={state.template}
              selectedGoalId={state.selectedGoalId}
              selectedTaskId={state.selectedTaskId}
              subjectStyle={subjectStyle}
              onUpdateNotify={async () => { await actions.refreshTemplate(); }}
              onTaskSelect={handleTaskClick}
              onUpdateTemplate={actions.handleUpdateTemplate}
              onDeleteTemplate={actions.handleDeleteTemplate}
              onAddGoal={actions.handleAddGoal}
              onUpdateGoal={actions.handleUpdateGoal}
              onDeleteGoal={actions.handleDeleteGoal}
              onAddTask={actions.handleAddTask}
              onUpdateTask={actions.handleUpdateTask}
              onDeleteTask={actions.handleDeleteTask}
              isUpdating={state.isUpdating}
            />
          </motion.div>
        </div>

        {/* 刪除確認對話框 */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">刪除模板</h3>
                  <p className="text-sm text-gray-600">此操作無法復原</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                您確定要刪除模板 <strong>{state.template.title}</strong> 嗎？
                這將永久刪除所有相關的目標和任務。
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={state.isUpdating}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {state.isUpdating ? '刪除中...' : '確認刪除'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 點擊外部關閉更多選項菜單 */}
        {showMoreMenu && (
          <div 
            className="absolute inset-0 z-40" 
            onClick={() => setShowMoreMenu(false)}
          />
        )}
      </motion.div>
    </motion.div>
  );
}; 