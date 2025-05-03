import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { Target, ChevronRight, Plus, Calendar, ArrowRight, Sparkles, BookOpen, Lightbulb, CheckCircle2, AlertCircle, Pencil, Trash2, ChevronDown, Brain, PartyPopper } from 'lucide-react';
import { GoalCard } from '../../components/goals/GoalCard';
import { AIAssistant } from '../../components/goals/AIAssistant';
import { ActionItem } from '../../components/goals/ActionItem';
import { goalTemplates } from '../../constants/goalTemplates';
import { mockGoals } from '../../mocks/goals';
import type { Goal } from '../../types/goal';
import { GOAL_STATUSES, GOAL_SOURCES } from '../../constants/goals';
import { SUBJECTS, type SubjectType } from '../../constants/subjects';
import { subjects } from '../../styles/tokens';

const StudentPlanning: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showActionItemModal, setShowActionItemModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState<Goal | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [savedGoalIds, setSavedGoalIds] = useState<Set<string>>(new Set());
  const [showSubjectSelect, setShowSubjectSelect] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);

  useEffect(() => {
    setSavedGoalIds(new Set(goals.map(goal => goal.id)));
  }, []);

  const handleAddToSchedule = (goalId: string, actionItemId: string) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          actionItems: goal.actionItems.map(item => 
            item.id === actionItemId 
              ? { ...item, addedToSchedule: true }
              : item
          )
        };
      }
      return goal;
    }));
  };

  return (
    <PageLayout title="學習計畫">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Goals List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">我的目標</h2>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                新增目標
              </button>
            </div>

            <div className="space-y-3">
              {goals.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => {
                    if (isEditing && editedGoal) {
                      if (!savedGoalIds.has(editedGoal.id)) {
                        setGoals(goals.filter(g => g.id !== editedGoal.id));
                      }
                      setIsEditing(false);
                      setHasAttemptedSave(false);
                    }
                    setSelectedGoal(goal);
                    setEditedGoal(goal);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedGoal?.id === goal.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500'
                      : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 flex items-start gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`shrink-0 ${
                          goal.templateType === '學習目標' ? 'text-purple-500' :
                          goal.templateType === '個人成長' ? 'text-blue-500' :
                          goal.templateType === '專案計畫' ? 'text-green-500' :
                          'text-orange-500'
                        }`}>
                          {goal.templateType === '學習目標' ? <Brain className="h-4 w-4" /> :
                           goal.templateType === '個人成長' ? <Target className="h-4 w-4" /> :
                           goal.templateType === '專案計畫' ? <Sparkles className="h-4 w-4" /> :
                           <PartyPopper className="h-4 w-4" />}
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {goal.title}
                        </h3>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      subjects.getSubjectStyle(goal.subject).bg
                    } ${subjects.getSubjectStyle(goal.subject).text}`}>
                      {goal.subject}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400">進度</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {goal.dueDate && (
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Intl.DateTimeFormat('zh-TW', {
                        month: 'long',
                        day: 'numeric'
                      }).format(goal.dueDate)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              目標設定小技巧
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    具體且可衡量
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    設定明確的目標和可量化的指標
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                  <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    分解大目標
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    將大目標拆解成小步驟，逐步達成
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                  <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    定期回顧
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    每週檢視進度，適時調整計畫
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Goal Details & Action Items */}
        <div className="lg:col-span-2">
          {selectedGoal ? (
            <div className="space-y-6">
              {/* Goal Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editedGoal?.title}
                          onChange={(e) => {
                            if (editedGoal) {
                              setEditedGoal({...editedGoal, title: e.target.value});
                            }
                          }}
                          placeholder="輸入目標標題（例如：完成科學探索專案）"
                          className={`w-full text-2xl font-bold bg-gray-50 dark:bg-gray-700 border ${
                            hasAttemptedSave && editedGoal?.title === '' ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } rounded-md px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500`}
                        />
                        <textarea
                          value={editedGoal?.description}
                          onChange={(e) => {
                            if (editedGoal) {
                              setEditedGoal({...editedGoal, description: e.target.value});
                            }
                          }}
                          placeholder="描述你的目標內容和期望達成的結果（例如：透過觀察、實驗和記錄，探索自然現象並培養科學思維）"
                          className={`w-full text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border ${
                            hasAttemptedSave && editedGoal?.description === '' ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } rounded-md px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500`}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <div className="relative inline-block">
                            <button
                              onClick={() => setShowTypeSelect(!showTypeSelect)}
                              className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-sm font-medium ${
                                editedGoal?.templateType === '學習目標' ? 'bg-purple-100 text-purple-800' :
                                editedGoal?.templateType === '個人成長' ? 'bg-blue-100 text-blue-800' :
                                editedGoal?.templateType === '專案計畫' ? 'bg-green-100 text-green-800' :
                                'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {editedGoal?.templateType === '學習目標' ? <Brain className="h-4 w-4" /> :
                               editedGoal?.templateType === '個人成長' ? <Target className="h-4 w-4" /> :
                               editedGoal?.templateType === '專案計畫' ? <Sparkles className="h-4 w-4" /> :
                               <PartyPopper className="h-4 w-4" />}
                              {editedGoal?.templateType}
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            
                            {showTypeSelect && (
                              <div className="absolute z-10 mt-1 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
                                {goalTemplates.map((template) => (
                                  <button
                                    key={template.title}
                                    onClick={() => {
                                      if (editedGoal) {
                                        setEditedGoal({...editedGoal, templateType: template.title});
                                        setShowTypeSelect(false);
                                      }
                                    }}
                                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    {template.icon}
                                    {template.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="relative inline-block">
                            <button
                              onClick={() => setShowSubjectSelect(!showSubjectSelect)}
                              className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-sm font-medium ${
                                subjects.getSubjectStyle(editedGoal?.subject || '').bg
                              } ${subjects.getSubjectStyle(editedGoal?.subject || '').text}`}
                            >
                              {editedGoal?.subject}
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            
                            {showSubjectSelect && (
                              <div className="absolute z-10 mt-1 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
                                {Object.values(SUBJECTS).map((subject) => (
                                  <button
                                    key={subject}
                                    onClick={() => {
                                      if (editedGoal) {
                                        setEditedGoal({...editedGoal, subject});
                                        setShowSubjectSelect(false);
                                      }
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                      subjects.getSubjectStyle(subject).bg
                                    } ${subjects.getSubjectStyle(subject).text} hover:bg-opacity-80`}
                                  >
                                    {subject}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setHasAttemptedSave(true);
                              if (editedGoal && selectedGoal && 
                                  editedGoal.title.trim() !== '' && 
                                  editedGoal.description.trim() !== '') {
                                setIsEditing(false);
                                setGoals(goals.map(g => g.id === selectedGoal.id ? editedGoal : g));
                                setSelectedGoal(editedGoal);
                                setHasAttemptedSave(false);
                                setSavedGoalIds(prev => new Set(prev).add(editedGoal.id));
                              }
                            }}
                            disabled={!editedGoal?.title || !editedGoal?.description}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setEditedGoal(selectedGoal);
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedGoal.title}
                        </h2>
                        <p className="mt-1 text-gray-600 dark:text-gray-300">
                          {selectedGoal.description}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-sm font-medium ${
                            selectedGoal.templateType === '學習目標' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            selectedGoal.templateType === '個人成長' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            selectedGoal.templateType === '專案計畫' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                          }`}>
                            {selectedGoal.templateType === '學習目標' ? <Brain className="h-4 w-4" /> :
                             selectedGoal.templateType === '個人成長' ? <Target className="h-4 w-4" /> :
                             selectedGoal.templateType === '專案計畫' ? <Sparkles className="h-4 w-4" /> :
                             <PartyPopper className="h-4 w-4" />}
                            {selectedGoal.templateType}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                            subjects.getSubjectStyle(selectedGoal.subject).bg
                          } ${subjects.getSubjectStyle(selectedGoal.subject).text}`}>
                            {selectedGoal.subject}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditedGoal(selectedGoal);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">總進度</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedGoal.progress}%
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">已完成項目</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedGoal.actionItems.filter(item => item.status === 'done').length}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">待辦項目</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {selectedGoal.actionItems.filter(item => item.status === 'todo').length}
                    </p>
                  </div>
                </div>

                {/* Action Items */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      行動計畫
                    </h3>
                    <button
                      onClick={() => setShowActionItemModal(true)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      新增行動項目
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedGoal.actionItems.map(item => (
                      <ActionItem
                        key={item.id}
                        item={item}
                        onAddToSchedule={() => handleAddToSchedule(selectedGoal.id, item.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Assistant */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-900 dark:to-purple-900 rounded-lg shadow p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">AI 學習助理</h3>
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-sm opacity-90 mb-4">
                  需要協助拆解目標或規劃學習路徑嗎？我可以幫你：
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-left transition">
                    <ArrowRight className="h-4 w-4 mb-2" />
                    將目標拆解成可執行的小步驟
                  </button>
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-left transition">
                    <ArrowRight className="h-4 w-4 mb-2" />
                    建議適合的學習資源和方法
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="max-w-sm mx-auto">
                <Target className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  選擇一個目標開始
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  從左側選擇一個目標，或點擊「新增目標」來開始規劃你的學習之旅。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                選擇目標類型
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {goalTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const newGoal: Goal = {
                        id: crypto.randomUUID(),
                        title: '',
                        description: '',
                        category: template.category,
                        templateType: template.title,
                        status: 'active',
                        dueDate: new Date(),
                        progress: 0,
                        subject: SUBJECTS.CUSTOM,
                        createdAt: new Date(),
                        actionItems: []
                      };
                      
                      setShowTemplateModal(false);
                      setGoals([...goals, newGoal]);
                      setSelectedGoal(newGoal);
                      setEditedGoal(newGoal);
                      setIsEditing(true);
                    }}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition text-left"
                  >
                    <div className="flex items-center mb-3">
                      {template.icon}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {template.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              確認刪除目標
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              請輸入 "delete" 以確認刪除此目標。此操作無法復原。
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-4"
              placeholder="輸入 delete"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmText === 'delete' && selectedGoal) {
                    setGoals(goals.filter(g => g.id !== selectedGoal.id));
                    setSelectedGoal(null);
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }
                }}
                disabled={deleteConfirmText !== 'delete'}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default StudentPlanning;