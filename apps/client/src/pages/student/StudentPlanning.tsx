import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { Target, ChevronRight, Plus, Calendar, ArrowRight, Sparkles, BookOpen, Lightbulb, CheckCircle2, AlertCircle, Pencil, Trash2, ChevronDown, Brain, PartyPopper } from 'lucide-react';
import { GoalCard } from '../../components/goals/GoalCard';
import { AIAssistant } from '../../components/goals/AIAssistant';
import { ActionItem } from '../../components/goals/ActionItem';
import { goalTemplates } from '../../constants/goalTemplates';
import { useGoalStore } from '../../store/goalStore';
import type { Goal, Step, Task } from '../../types/goal';
import { GOAL_STATUSES, GOAL_SOURCES } from '../../constants/goals';
import { SUBJECTS, type SubjectType } from '../../constants/subjects';
import { subjects } from '../../styles/tokens';
import { StepItem } from '../../components/goals/StepItem';
import { useNavigate } from 'react-router-dom';

const StudentPlanning: React.FC = () => {
  const { goals, updateGoal, updateTask: storeUpdateTask } = useGoalStore();
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
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setSavedGoalIds(new Set(goals.map(goal => goal.id)));
  }, [goals]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.dropdown-option')) {
        return;
      }
      if (!target.closest('.subject-select') && !target.closest('.type-select')) {
        setShowSubjectSelect(false);
        setShowTypeSelect(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTypeSelectClick = () => {
    setShowTypeSelect(!showTypeSelect);
    setShowSubjectSelect(false);
  };

  const handleSubjectSelectClick = () => {
    setShowSubjectSelect(!showSubjectSelect);
    setShowTypeSelect(false);
  };

  const handleAddToSchedule = (goalId: string, stepId: string, taskId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const step = goal.steps.find(s => s.id === stepId);
    if (!step) return;

    const task = step.tasks.find(t => t.id === taskId);
    if (!task) return;

    storeUpdateTask(goalId, stepId, { ...task, notes: '已加入排程' });
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const getCompletionRate = (goal: Goal) => {
    if (!goal?.steps) return 0;
    const totalTasks = goal.steps.reduce((acc, step) => acc + (step.tasks?.length || 0), 0);
    const completedTasks = goal.steps.reduce(
      (acc, step) => acc + (step.tasks?.filter(task => task.status === 'done').length || 0),
      0
    );
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  const handleTaskStatusChange = (goalId: string, stepId: string, task: Task) => {
    storeUpdateTask(goalId, stepId, task);
  };

  const handleTaskEdit = (goalId: string, stepId: string, task: Task) => {
    storeUpdateTask(goalId, stepId, task);
  };

  const handleDeleteGoal = (goalId: string) => {
    const goalToDelete = goals.find(g => g.id === goalId);
    if (goalToDelete) {
      updateGoal({ ...goalToDelete, status: GOAL_STATUSES.ARCHIVED });
    }
  };

  const handleAddNewGoal = (newGoal: Goal) => {
    updateGoal(newGoal);
  };

  const handleSaveGoal = (goal: Goal) => {
    updateGoal(goal);
  };

  const handleUpdateGoal = (goal: Goal) => {
    updateGoal(goal);
  };

  const handleGoalSelect = (goal: Goal) => {
    if (isEditing && editedGoal) {
      if (!savedGoalIds.has(editedGoal.id)) {
        handleDeleteGoal(editedGoal.id);
      }
      setIsEditing(false);
      setHasAttemptedSave(false);
    }
    setSelectedGoal(goal);
    setEditedGoal(goal);
  };

  const handleGoalSave = (goal: Goal) => {
    if (goal.title?.trim() !== '' && 
        goal.description?.trim() !== '') {
      setIsEditing(false);
      handleUpdateGoal(goal);
      setSelectedGoal(goal);
      setHasAttemptedSave(false);
    }
  };

  const handleGoalDelete = (goal: Goal) => {
    if (deleteConfirmText === 'delete') {
      handleDeleteGoal(goal.id);
      setSelectedGoal(null);
      setShowDeleteModal(false);
    }
  };

  const handleGoalFilter = (filteredGoals: Goal[]) => {
    // 這裡不需要更新 store，因為我們只是過濾顯示
    return filteredGoals;
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
                        handleDeleteGoal(editedGoal.id);
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
                    <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                      subjects.getSubjectStyle(goal.subject || '').bg
                    } ${subjects.getSubjectStyle(goal.subject || '').text}`}>
                      {goal.subject || '未分類'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400">進度</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getCompletionRate(goal)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${getCompletionRate(goal)}%` }}
                      />
                    </div>
                  </div>

                  {goal.dueDate && (
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Intl.DateTimeFormat('zh-TW', {
                        month: 'long',
                        day: 'numeric'
                      }).format(new Date(goal.dueDate))}
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
                              onClick={handleTypeSelectClick}
                              className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-sm font-medium type-select ${
                                editedGoal?.templateType === '學習目標' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                editedGoal?.templateType === '個人成長' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                editedGoal?.templateType === '專案計畫' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (editedGoal) {
                                        setEditedGoal({...editedGoal, templateType: template.title});
                                        setShowTypeSelect(false);
                                      }
                                    }}
                                    className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dropdown-option ${
                                      template.title === '學習目標' ? 'text-purple-600 dark:text-purple-400' :
                                      template.title === '個人成長' ? 'text-blue-600 dark:text-blue-400' :
                                      template.title === '專案計畫' ? 'text-green-600 dark:text-green-400' :
                                      'text-orange-600 dark:text-orange-400'
                                    }`}
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
                              onClick={handleSubjectSelectClick}
                              className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-sm font-medium subject-select ${
                                subjects.getSubjectStyle(editedGoal?.subject || '').bg
                              } ${subjects.getSubjectStyle(editedGoal?.subject || '').text}`}
                            >
                              {editedGoal?.subject || '未分類'}
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            
                            {showSubjectSelect && (
                              <div className="absolute z-10 mt-1 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
                                {Object.values(SUBJECTS).map((subject) => (
                                  <button
                                    key={subject}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (editedGoal) {
                                        setEditedGoal({...editedGoal, subject});
                                        setShowSubjectSelect(false);
                                      }
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dropdown-option ${
                                      subjects.getSubjectStyle(subject).text
                                    }`}
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
                                  editedGoal.description?.trim() !== '') {
                                setIsEditing(false);
                                updateGoal(editedGoal);
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
                            subjects.getSubjectStyle(selectedGoal.subject || '').bg
                          } ${subjects.getSubjectStyle(selectedGoal.subject || '').text}`}>
                            {selectedGoal.subject || '未分類'}
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
                        onClick={() => navigate(`/student/planning/goal/${selectedGoal.id}`)}
                        className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <Brain className="h-5 w-5" />
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
                      {getCompletionRate(selectedGoal)}%
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">已完成項目</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedGoal.steps.reduce((acc, step) => 
                        acc + step.tasks.filter(task => task.status === 'done').length, 0
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">待辦項目</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {selectedGoal.steps.reduce((acc, step) => 
                        acc + step.tasks.filter(task => task.status === 'todo').length, 0
                      )}
                    </p>
                  </div>
                </div>

                {/* Steps List */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      學習步驟
                    </h3>
                    <button
                      onClick={() => {/* 添加步驟的邏輯 */}}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      新增步驟
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedGoal.steps.map(step => (
                      <StepItem
                        key={step.id}
                        step={step}
                        isExpanded={expandedSteps.includes(step.id)}
                        onToggle={() => toggleStep(step.id)}
                        onTaskStatusChange={(task) => handleTaskStatusChange(selectedGoal.id, step.id, task)}
                        onTaskEdit={(task) => handleTaskEdit(selectedGoal.id, step.id, task)}
                        onAddTask={() => {/* 添加任務的邏輯 */}}
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
                        templateType: template.title,
                        subject: SUBJECTS.CUSTOM,
                        dueDate: new Date().toISOString(),
                        progress: 0,
                        steps: [],
                        status: 'active'
                      };
                      
                      setShowTemplateModal(false);
                      updateGoal(newGoal);
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
                    handleDeleteGoal(selectedGoal.id);
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