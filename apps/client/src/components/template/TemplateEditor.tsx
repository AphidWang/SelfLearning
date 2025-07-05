/**
 * Template Editor - 模板編輯器
 * 
 * 功能：
 * 1. 使用 TopicRadialMap 顯示模板結構
 * 2. 支援編輯模板的基本資訊
 * 3. 支援編輯目標和任務
 * 4. 支援編輯思維泡泡
 * 5. 模擬主題環境但專注於模板編輯
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Save,
  Edit3,
  Plus,
  Target,
  Lightbulb,
  BookOpen,
  Users,
  Settings,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { TemplateRadialMap } from './TemplateRadialMap';
import { useTopicTemplateStore } from '../../store/topicTemplateStore';
import { subjects } from '../../styles/tokens';
import { SUBJECTS } from '../../constants/subjects';
import type { TopicTemplate, TemplateGoal, TemplateTask, Bubble } from '../../types/goal';

interface TemplateEditorProps {
  template: TopicTemplate;
  onClose: () => void;
  onSave: (template: TopicTemplate) => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onClose,
  onSave
}) => {
  const { updateTemplate, addGoal, updateGoal, deleteGoal, addBubble, updateBubble, deleteBubble } = useTopicTemplateStore();

  // 編輯狀態
  const [editingTemplate, setEditingTemplate] = useState<TopicTemplate>(template);
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showBubbles, setShowBubbles] = useState(true);

  // 記憶化主題樣式
  const subjectStyle = useMemo(() => {
    return subjects.getSubjectStyle(editingTemplate.subject || '');
  }, [editingTemplate.subject]);



  // 處理基本資訊編輯
  const handleBasicInfoSave = async () => {
    const updated = await updateTemplate(template.id, {
      title: editingTemplate.title,
      description: editingTemplate.description,
      subject: editingTemplate.subject,
      category: editingTemplate.category
    });

    if (updated) {
      setEditingTemplate(updated);
      setIsEditingBasicInfo(false);
    }
  };

  // 處理目標點擊
  const handleGoalClick = (goalId: string) => {
    if (goalId === 'TOPIC') {
      setSelectedGoalId(null);
      setSelectedTaskId(null);
    } else {
      setSelectedGoalId(goalId);
      setSelectedTaskId(null);
    }
  };

  // 處理任務點擊
  const handleTaskClick = (taskId: string, goalId: string) => {
    setSelectedGoalId(goalId);
    setSelectedTaskId(taskId);
  };

  // 添加新目標
  const handleAddGoal = async () => {
    const newGoal = await addGoal(template.id, {
      title: '新目標',
      description: '',
      status: 'todo',
      priority: 'medium',
      tasks: []
    });

    if (newGoal) {
      const updated = { ...editingTemplate, goals: [...editingTemplate.goals, newGoal] };
      setEditingTemplate(updated);
    }
  };

  // 添加新任務
  const handleAddTask = async (goalId: string) => {
    const goal = editingTemplate.goals.find(g => g.id === goalId);
    if (!goal) return;

    const newTask: TemplateTask = {
      id: crypto.randomUUID(),
      title: '新任務',
      description: '',
      status: 'todo',
      priority: 'medium'
    };

    const updatedGoal = await updateGoal(template.id, goalId, {
      tasks: [...(goal.tasks || []), newTask]
    });

    if (updatedGoal) {
      const updatedGoals = editingTemplate.goals.map(g => 
        g.id === goalId ? updatedGoal : g
      );
      setEditingTemplate({ ...editingTemplate, goals: updatedGoals });
    }
  };

  // 刪除目標
  const handleDeleteGoal = async (goalId: string) => {
    if (confirm('確定要刪除這個目標嗎？')) {
      const success = await deleteGoal(template.id, goalId);
      if (success) {
        const updatedGoals = editingTemplate.goals.filter(g => g.id !== goalId);
        setEditingTemplate({ ...editingTemplate, goals: updatedGoals });
        setSelectedGoalId(null);
        setSelectedTaskId(null);
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 w-full max-w-[1280px] h-[85vh] flex flex-col overflow-hidden"
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
        <div 
          className="flex items-center justify-between p-6 border-b-2"
          style={{ borderColor: `${subjectStyle.accent}30` }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: subjectStyle.accent }}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            
            {isEditingBasicInfo ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  className="text-2xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-indigo-500 outline-none"
                />
                <div className="flex gap-4">
                  <select
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value as any })}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(SUBJECTS).map(([key, subject]) => (
                      <option key={key} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBasicInfoSave}
                    className="px-4 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingBasicInfo(false)}
                    className="px-4 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{editingTemplate.title}</h1>
                  <button
                    onClick={() => setIsEditingBasicInfo(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: subjectStyle.accent }}
                  >
                    {editingTemplate.subject}
                  </span>
                  <span className="text-gray-500 text-sm">模板編輯中</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBubbles(!showBubbles)}
              className={`p-2 rounded-lg transition-colors ${
                showBubbles ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
              }`}
              title={showBubbles ? '隱藏泡泡' : '顯示泡泡'}
            >
              {showBubbles ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 主要內容區 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左側 - 放射狀圖 */}
          <div className="flex-1 relative overflow-hidden">
            <TemplateRadialMap
              template={editingTemplate}
              width={800}
              height={600}
              selectedGoalId={selectedGoalId}
              selectedTaskId={selectedTaskId}
              onGoalClick={handleGoalClick}
              onTaskClick={handleTaskClick}
              className="w-full h-full"
            />
            
            {/* 快速操作按鈕 */}
            <div className="absolute bottom-6 left-6 flex gap-2">
              <button
                onClick={handleAddGoal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                新增目標
              </button>
              
              {selectedGoalId && (
                <button
                  onClick={() => handleAddTask(selectedGoalId)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  新增任務
                </button>
              )}
            </div>
          </div>

          {/* 右側 - 詳情面板 */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <TemplateDetailsPanel
              template={editingTemplate}
              selectedGoalId={selectedGoalId}
              selectedTaskId={selectedTaskId}
              onUpdateTemplate={setEditingTemplate}
              onDeleteGoal={handleDeleteGoal}
              onSave={() => onSave(editingTemplate)}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 模板詳情面板組件
interface TemplateDetailsPanelProps {
  template: TopicTemplate;
  selectedGoalId: string | null;
  selectedTaskId: string | null;
  onUpdateTemplate: (template: TopicTemplate) => void;
  onDeleteGoal: (goalId: string) => void;
  onSave: () => void;
}

const TemplateDetailsPanel: React.FC<TemplateDetailsPanelProps> = ({
  template,
  selectedGoalId,
  selectedTaskId,
  onUpdateTemplate,
  onDeleteGoal,
  onSave
}) => {
  const selectedGoal = selectedGoalId ? template.goals.find(g => g.id === selectedGoalId) : null;
  const selectedTask = selectedTaskId && selectedGoal ? 
    selectedGoal.tasks?.find(t => t.id === selectedTaskId) : null;

  const [editingGoal, setEditingGoal] = useState<TemplateGoal | null>(null);
  const [editingTask, setEditingTask] = useState<TemplateTask | null>(null);

  // 處理目標編輯
  const handleGoalEdit = (goal: TemplateGoal) => {
    setEditingGoal({ ...goal });
  };

  const handleGoalSave = () => {
    if (!editingGoal) return;
    
    const updatedGoals = template.goals.map(g => 
      g.id === editingGoal.id ? editingGoal : g
    );
    onUpdateTemplate({ ...template, goals: updatedGoals });
    setEditingGoal(null);
  };

  // 處理任務編輯
  const handleTaskEdit = (task: TemplateTask) => {
    setEditingTask({ ...task });
  };

  const handleTaskSave = () => {
    if (!editingTask || !selectedGoal) return;
    
    const updatedTasks = (selectedGoal.tasks || []).map(t => 
      t.id === editingTask.id ? editingTask : t
    );
    
    const updatedGoal = { ...selectedGoal, tasks: updatedTasks };
    const updatedGoals = template.goals.map(g => 
      g.id === selectedGoal.id ? updatedGoal : g
    );
    
    onUpdateTemplate({ ...template, goals: updatedGoals });
    setEditingTask(null);
  };

  return (
    <div className="p-4 space-y-4">
      {/* 模板概要 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          模板概要
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div>目標數量: {template.goals.length}</div>
          <div>任務數量: {template.goals.reduce((sum, g) => sum + (g.tasks?.length || 0), 0)}</div>
          <div>泡泡數量: {(template.bubbles || []).length}</div>
        </div>
        
        <button
          onClick={onSave}
          className="w-full mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          儲存模板
        </button>
      </div>

      {/* 選中項目詳情 */}
      {selectedTask && selectedGoal ? (
        // 任務詳情
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              任務詳情
            </h3>
            <button
              onClick={() => handleTaskEdit(selectedTask)}
              className="text-indigo-600 hover:text-indigo-800"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          
          {editingTask ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="任務標題"
              />
              <textarea
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="任務描述"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleTaskSave}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                >
                  儲存
                </button>
                <button
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="font-medium">{selectedTask.title}</h4>
              <p className="text-gray-600 text-sm">{selectedTask.description || '沒有描述'}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded ${
                  selectedTask.status === 'done' ? 'bg-green-100 text-green-800' :
                  selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedTask.status}
                </span>
                <span className={`px-2 py-1 rounded ${
                  selectedTask.priority === 'high' ? 'bg-red-100 text-red-800' :
                  selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedTask.priority}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : selectedGoal ? (
        // 目標詳情
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              目標詳情
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => handleGoalEdit(selectedGoal)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteGoal(selectedGoal.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {editingGoal ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editingGoal.title}
                onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="目標標題"
              />
              <textarea
                value={editingGoal.description || ''}
                onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="目標描述"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleGoalSave}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                >
                  儲存
                </button>
                <button
                  onClick={() => setEditingGoal(null)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="font-medium">{selectedGoal.title}</h4>
              <p className="text-gray-600 text-sm">{selectedGoal.description || '沒有描述'}</p>
              <div className="text-xs text-gray-500">
                任務數量: {selectedGoal.tasks?.length || 0}
              </div>
            </div>
          )}
        </div>
      ) : (
        // 沒有選中任何項目
        <div className="bg-white rounded-lg p-4 shadow-sm text-center text-gray-500">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>點擊目標或任務來編輯</p>
        </div>
      )}
    </div>
  );
}; 