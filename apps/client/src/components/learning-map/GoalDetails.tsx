import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Trash2, Plus, Pencil, Brain, Target, Sparkles, PartyPopper, X, GripVertical, List } from 'lucide-react';
import type { Goal, Step, Task } from '../../types/goal';
import { useGoalStore } from '../../store/goalStore';
import { subjectColors } from '../../styles/tokens';
import { goalTemplates } from '../../constants/goalTemplates';
import { SUBJECTS } from '../../constants/subjects';
import { subjects } from '../../styles/tokens';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface GoalDetailsProps {
  goal: Goal;
  onBack: () => void;
  onTaskClick: (taskId: string) => void;
  isCreating?: boolean;
  isEditing?: boolean;
  onEditToggle?: () => void;
}

export const GoalDetails: React.FC<GoalDetailsProps> = ({ goal, onBack, onTaskClick, isCreating = false, isEditing = isCreating, onEditToggle }) => {
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ 
    type: 'step' | 'task' | 'goal', 
    goalId: string, 
    stepId?: string, 
    taskId?: string 
  } | null>(null);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showSubjectSelect, setShowSubjectSelect] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [editedGoal, setEditedGoal] = useState<Goal>({
    ...goal,
    templateType: goal.templateType || '學習目標',
    subject: goal.subject || SUBJECTS.CUSTOM
  });
  const { deleteGoal, addStep, deleteStep, addTask, deleteTask, updateGoal, getActiveSteps, updateTask, reorderTasks } = useGoalStore();
  const [activeSteps, setActiveSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showStepsOverview, setShowStepsOverview] = useState(false);

  useEffect(() => {
    const steps = getActiveSteps(goal.id);
    setActiveSteps(steps);
    // 初始化時，只展開未完成的步驟
    setExpandedSteps(
      steps
        .filter(step => {
          const totalTasks = step.tasks.length;
          const completedTasks = step.tasks.filter(task => task.status === 'done').length;
          return totalTasks > 0 && completedTasks < totalTasks;
        })
        .map(step => step.id)
    );
  }, [goal.id, goal.steps]);

  useEffect(() => {
    setEditedGoal({
      ...goal,
      templateType: goal.templateType || '學習目標',
      subject: goal.subject || SUBJECTS.CUSTOM
    });
  }, [goal]);

  // 當進入編輯模式時，展開所有步驟
  useEffect(() => {
    if (isEditing) {
      setExpandedSteps(activeSteps.map(step => step.id));
    } else {
      // 退出編輯模式時，恢復預設展開邏輯
      setExpandedSteps(
        activeSteps
          .filter(step => {
            const totalTasks = step.tasks.length;
            const completedTasks = step.tasks.filter(task => task.status === 'done').length;
            return totalTasks > 0 && completedTasks < totalTasks;
          })
          .map(step => step.id)
      );
    }
  }, [isEditing, activeSteps]);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('.dropdown-option')) {
      return;
    }
    if (!target.closest('.type-select') && !target.closest('.subject-select')) {
      setShowTypeSelect(false);
      setShowSubjectSelect(false);
    }
  };

  useEffect(() => {
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

  const getCompletionRate = (step: Step) => {
    const activeStep = activeSteps.find(s => s.id === step.id);
    if (!activeStep) return 0;
    
    const totalTasks = activeStep.tasks.length;
    const completedTasks = activeStep.tasks.filter(task => task.status === 'done').length;
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  const handleDelete = (type: 'step' | 'task', goalId: string, stepId: string, taskId?: string) => {
    setDeleteTarget({ type, goalId, stepId, taskId });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'goal') {
      deleteGoal(deleteTarget.goalId);
      onBack();
    } else if (deleteTarget.type === 'step' && deleteTarget.stepId) {
      deleteStep(deleteTarget.goalId, deleteTarget.stepId);
    } else if (deleteTarget.type === 'task' && deleteTarget.stepId && deleteTarget.taskId) {
      deleteTask(deleteTarget.goalId, deleteTarget.stepId, deleteTarget.taskId);
    }
    
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return;
    addStep(goal.id, {
      id: '',
      title: newStepTitle,
      tasks: []
    });
    setNewStepTitle('');
    setSelectedStepId(null);
  };

  const handleAddTask = (stepId: string) => {
    if (!newTaskTitle.trim()) return;
    addTask(goal.id, stepId, {
      id: '',
      title: newTaskTitle,
      status: 'todo'
    });
    setNewTaskTitle('');
    setSelectedStepId(null);
  };

  const handleSave = () => {
    updateGoal(editedGoal);
    if (onEditToggle) {
      onEditToggle();
    }
  };

  const handleTaskStatusChange = (stepId: string, task: Task) => {
    const newStatus = task.status === 'done' ? 'in_progress' : 'done';
    updateTask(goal.id, stepId, {
      ...task,
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date().toISOString() : undefined
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceStepId = source.droppableId;
    const destStepId = destination.droppableId;

    if (sourceStepId === destStepId) {
      reorderTasks(goal.id, sourceStepId, source.index, destination.index);
    } else {
      const sourceStep = activeSteps.find(step => step.id === sourceStepId);
      const destStep = activeSteps.find(step => step.id === destStepId);
      
      if (sourceStep && destStep) {
        const task = sourceStep.tasks[source.index];
        deleteTask(goal.id, sourceStepId, task.id);
        addTask(goal.id, destStepId, {
          ...task,
          order: destination.index
        });
      }
    }
  };

  const subjectStyle = subjects.getSubjectStyle(goal.subject || '');

  return (
    <div className="h-full flex flex-col">
      {/* 刪除確認視窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium mb-4">確認刪除</h3>
            <p className="text-gray-600 mb-6">
              確定要刪除這個{deleteTarget?.type === 'step' ? '步驟' : deleteTarget?.type === 'task' ? '任務' : '目標'}嗎？此操作無法復原。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-md transition-colors"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {/* 目標資訊卡片 */}
        <div 
          className="mb-4 rounded-lg p-3 border-2 shadow-md" 
          style={{ 
            borderColor: subjectStyle.accent,
            background: `linear-gradient(to right, ${subjectStyle.accent}10, ${subjectStyle.accent}10)`,
            boxShadow: `0 4px 12px ${subjectStyle.accent}15`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <div className="relative">
                    <button
                      onClick={handleTypeSelectClick}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
                        editedGoal.templateType === '學習目標' ? 'bg-purple-100 text-purple-800' :
                        editedGoal.templateType === '個人成長' ? 'bg-blue-100 text-blue-800' :
                        editedGoal.templateType === '專案計畫' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {editedGoal.templateType === '學習目標' ? <Brain className="h-3 w-3" /> :
                       editedGoal.templateType === '個人成長' ? <Target className="h-3 w-3" /> :
                       editedGoal.templateType === '專案計畫' ? <Sparkles className="h-3 w-3" /> :
                       <PartyPopper className="h-3 w-3" />}
                      {editedGoal.templateType || '選擇類型'}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {showTypeSelect && (
                      <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="py-1">
                          {['學習目標', '個人成長', '專案計畫', '其他'].map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                const updatedGoal = {...editedGoal, templateType: type};
                                setEditedGoal(updatedGoal);
                                updateGoal(updatedGoal);
                                setShowTypeSelect(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dropdown-option ${
                                type === '學習目標' ? 'text-purple-800' :
                                type === '個人成長' ? 'text-blue-800' :
                                type === '專案計畫' ? 'text-green-800' :
                                'text-orange-800'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {type === '學習目標' ? <Brain className="h-3 w-3" /> :
                                 type === '個人成長' ? <Target className="h-3 w-3" /> :
                                 type === '專案計畫' ? <Sparkles className="h-3 w-3" /> :
                                 <PartyPopper className="h-3 w-3" />}
                                {type}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={handleSubjectSelectClick}
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        subjects.getSubjectStyle(editedGoal.subject || '').bg
                      } ${subjects.getSubjectStyle(editedGoal.subject || '').text}`}
                    >
                      {editedGoal.subject || '未分類'}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </button>
                    {showSubjectSelect && (
                      <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="py-1">
                          {Object.entries(SUBJECTS).map(([key, value]) => (
                            <button
                              key={key}
                              onClick={() => {
                                const updatedGoal = {...editedGoal, subject: value};
                                setEditedGoal(updatedGoal);
                                updateGoal(updatedGoal);
                                setShowSubjectSelect(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dropdown-option ${
                                subjects.getSubjectStyle(value).text
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
                    goal.templateType === '學習目標' ? 'bg-purple-100 text-purple-800' :
                    goal.templateType === '個人成長' ? 'bg-blue-100 text-blue-800' :
                    goal.templateType === '專案計畫' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {goal.templateType === '學習目標' ? <Brain className="h-3 w-3" /> :
                     goal.templateType === '個人成長' ? <Target className="h-3 w-3" /> :
                     goal.templateType === '專案計畫' ? <Sparkles className="h-3 w-3" /> :
                     <PartyPopper className="h-3 w-3" />}
                    {goal.templateType}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                    subjects.getSubjectStyle(goal.subject || '').bg
                  } ${subjects.getSubjectStyle(goal.subject || '').text}`}>
                    {goal.subject || '未分類'}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => setShowStepsOverview(!showStepsOverview)}
              className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="步驟總覽"
            >
              <List size={16} />
            </button>
          </div>
          <div className="flex items-start justify-between gap-2">
            {isEditing ? (
              <div className="space-y-2 flex-1">
                <textarea
                  value={editedGoal.description}
                  onChange={(e) => {
                    const updatedGoal = {...editedGoal, description: e.target.value};
                    setEditedGoal(updatedGoal);
                    updateGoal(updatedGoal);
                  }}
                  className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="描述你的目標..."
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setDeleteTarget({ type: 'goal', goalId: goal.id });
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors text-xs"
                  >
                    <Trash2 size={14} />
                    刪除目標
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 flex-1">{goal.description}</p>
            )}
          </div>
        </div>

        {/* 步驟分頁 */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {activeSteps.map((step, index) => {
            const totalTasks = step.tasks.length;
            const completedTasks = step.tasks.filter(task => task.status === 'done').length;
            const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
            
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(index)}
                className={`flex flex-col gap-1 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  currentStepIndex === index
                    ? 'bg-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={{
                  borderColor: currentStepIndex === index ? subjectStyle.accent : 'transparent',
                  borderWidth: currentStepIndex === index ? 1 : 0,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 text-[10px]">
                    {index + 1}
                  </span>
                  <span className="truncate max-w-[120px]">{step.title}</span>
                </div>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: progress === 100 ? '#22c55e' : subjectStyle.accent
                    }}
                  />
                </div>
                <div className="text-[10px] text-gray-500">
                  {completedTasks}/{totalTasks} 任務
                </div>
              </button>
            );
          })}
          <button
            onClick={() => {
              setSelectedStepId('new');
              setNewStepTitle('');
            }}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            aria-label="新增步驟"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* 當前步驟內容 */}
        {activeSteps.length > 0 && (
          <div className="bg-white rounded-lg p-3 shadow-md border" style={{ borderColor: subjectStyle.accent }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">{activeSteps[currentStepIndex].title}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setSelectedStepId(activeSteps[currentStepIndex].id);
                    setNewTaskTitle('');
                  }}
                  className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                  aria-label="新增任務"
                >
                  <Plus size={16} />
                </button>
                {isEditing && (
                  <button
                    onClick={() => handleDelete('step', goal.id, activeSteps[currentStepIndex].id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                    aria-label="刪除步驟"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId={activeSteps[currentStepIndex].id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-1.5"
                  >
                    {activeSteps[currentStepIndex].tasks
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                        isDragDisabled={!isEditing}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center justify-between group ${
                              snapshot.isDragging ? 'opacity-100 shadow-lg' : ''
                            }`}
                          >
                            <div className={`flex items-center justify-between flex-1 p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                              task.status === 'done' ? 'bg-green-50' : 
                              task.status === 'in_progress' ? 'bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100' : ''
                            }`}>
                              <button
                                onClick={() => onTaskClick(task.id)}
                                className="flex items-center flex-1"
                              >
                                {task.status === 'done' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-1.5" />
                                ) : task.status === 'in_progress' ? (
                                  <AlertCircle className="h-4 w-4 text-purple-500 mr-1.5" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-gray-400 mr-1.5" />
                                )}
                                <span className={`text-sm ${
                                  task.status === 'done' ? 'text-gray-400' : 
                                  task.status === 'in_progress' ? 'text-purple-700 font-medium' : ''
                                }`}>
                                  {task.title}
                                </span>
                              </button>
                              <div className="flex items-center gap-1">
                                {isEditing && (
                                  <>
                                    <button
                                      onClick={() => handleDelete('task', goal.id, activeSteps[currentStepIndex].id, task.id)}
                                      className="text-red-500 hover:bg-red-50 rounded-full p-1"
                                      aria-label="刪除任務"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    <div {...provided.dragHandleProps}>
                                      <button
                                        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                        aria-label="拖曳排序"
                                      >
                                        <GripVertical size={14} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* 步驟總覽彈出框 */}
        {showStepsOverview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
              className="bg-white rounded-lg p-4 max-w-sm w-full mx-4 shadow-xl"
              style={{ borderColor: subjectStyle.accent, borderWidth: 1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">步驟總覽</h3>
                <button
                  onClick={() => setShowStepsOverview(false)}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {activeSteps.map((step, index) => {
                  const totalTasks = step.tasks.length;
                  const completedTasks = step.tasks.filter(task => task.status === 'done').length;
                  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setCurrentStepIndex(index);
                        setShowStepsOverview(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-[10px]">
                          {index + 1}
                        </span>
                        <span className="text-xs font-medium truncate">{step.title}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${progress}%`,
                              backgroundColor: progress === 100 ? '#22c55e' : subjectStyle.accent
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 min-w-[40px] text-right">
                          {progress}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 新增步驟輸入框 */}
        {selectedStepId === 'new' && (
          <div className="mt-3 bg-white rounded-lg p-3 shadow-md border" style={{ borderColor: subjectStyle.accent }}>
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="輸入步驟名稱..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddStep();
                  }
                }}
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={handleAddStep}
                  className="p-1 text-blue-500 hover:bg-blue-50 rounded-full"
                  aria-label="確認新增"
                >
                  <CheckCircle2 size={16} />
                </button>
                <button
                  onClick={() => setSelectedStepId(null)}
                  className="p-1 text-gray-500 hover:bg-gray-50 rounded-full"
                  aria-label="取消"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 新增任務輸入框 */}
        {selectedStepId && selectedStepId !== 'new' && (
          <div className="mt-3 bg-white rounded-lg p-3 shadow-md border" style={{ borderColor: subjectStyle.accent }}>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="輸入任務名稱..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTask(selectedStepId);
                  }
                }}
              />
              <button
                onClick={() => handleAddTask(selectedStepId)}
                className="p-1 text-blue-500 hover:bg-blue-50 rounded-full"
                aria-label="確認新增"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={() => setSelectedStepId(null)}
                className="p-1 text-gray-500 hover:bg-gray-50 rounded-full"
                aria-label="取消"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 