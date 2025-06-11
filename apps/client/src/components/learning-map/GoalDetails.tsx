import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Trash2, Plus, Pencil, Brain, Target, Sparkles, PartyPopper, X, GripVertical } from 'lucide-react';
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
    // 如果點擊的是選單內的選項，不要關閉選單
    if (target.closest('.dropdown-option')) {
      return;
    }
    // 如果點擊的不是選單本身，就關閉選單
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

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
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
    } else if (deleteTarget.type === 'step' && deleteTarget.stepId) {
      deleteStep(deleteTarget.goalId, deleteTarget.stepId);
    } else if (deleteTarget.type === 'task' && deleteTarget.stepId && deleteTarget.taskId) {
      deleteTask(deleteTarget.goalId, deleteTarget.stepId, deleteTarget.taskId);
    }
    
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const getSubjectColor = (subject: string) => {
    return subjectColors[subject as keyof typeof subjectColors] || subjectColors['未分類'];
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

  // 當編輯狀態變化時重新設置 editedGoal
  useEffect(() => {
    if (isEditing) {
      setEditedGoal({
        ...goal,
        templateType: goal.templateType || '學習目標',
        subject: goal.subject || SUBJECTS.CUSTOM
      });
    }
  }, [isEditing, goal]);

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

    // 如果是同一個步驟內的移動
    if (sourceStepId === destStepId) {
      reorderTasks(goal.id, sourceStepId, source.index, destination.index);
    } else {
      // 如果是跨步驟移動，需要先從原步驟移除，再添加到新步驟
      const sourceStep = activeSteps.find(step => step.id === sourceStepId);
      const destStep = activeSteps.find(step => step.id === destStepId);
      
      if (sourceStep && destStep) {
        const task = sourceStep.tasks[source.index];
        // 先從原步驟移除
        deleteTask(goal.id, sourceStepId, task.id);
        // 再添加到新步驟
        addTask(goal.id, destStepId, {
          ...task,
          order: destination.index
        });
      }
    }
  };

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
        <div 
          className="mb-6 rounded-lg shadow p-4 border-l-4" 
          style={{ 
            borderLeftColor: subjects.getSubjectStyle(goal.subject || '').accent,
            background: `linear-gradient(to right, ${subjects.getSubjectStyle(goal.subject || '').accent}10, ${subjects.getSubjectStyle(goal.subject || '').accent}10)`
          }}
        >
          <div className="flex gap-2 mb-3">
            {isEditing ? (
              <>
                <div className="relative">
                  <button
                    onClick={handleTypeSelectClick}
                    className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-sm font-medium ${
                      editedGoal.templateType === '學習目標' ? 'bg-purple-100 text-purple-800' :
                      editedGoal.templateType === '個人成長' ? 'bg-blue-100 text-blue-800' :
                      editedGoal.templateType === '專案計畫' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {editedGoal.templateType === '學習目標' ? <Brain className="h-4 w-4" /> :
                     editedGoal.templateType === '個人成長' ? <Target className="h-4 w-4" /> :
                     editedGoal.templateType === '專案計畫' ? <Sparkles className="h-4 w-4" /> :
                     <PartyPopper className="h-4 w-4" />}
                    {editedGoal.templateType || '選擇類型'}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showTypeSelect && (
                    <div className="absolute z-10 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
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
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dropdown-option ${
                              type === '學習目標' ? 'text-purple-800' :
                              type === '個人成長' ? 'text-blue-800' :
                              type === '專案計畫' ? 'text-green-800' :
                              'text-orange-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {type === '學習目標' ? <Brain className="h-4 w-4" /> :
                               type === '個人成長' ? <Target className="h-4 w-4" /> :
                               type === '專案計畫' ? <Sparkles className="h-4 w-4" /> :
                               <PartyPopper className="h-4 w-4" />}
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
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                      subjects.getSubjectStyle(editedGoal.subject || '').bg
                    } ${subjects.getSubjectStyle(editedGoal.subject || '').text}`}
                  >
                    {editedGoal.subject || '未分類'}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>
                  {showSubjectSelect && (
                    <div className="absolute z-10 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
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
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dropdown-option ${
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
                <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-sm font-medium ${
                  goal.templateType === '學習目標' ? 'bg-purple-100 text-purple-800' :
                  goal.templateType === '個人成長' ? 'bg-blue-100 text-blue-800' :
                  goal.templateType === '專案計畫' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {goal.templateType === '學習目標' ? <Brain className="h-4 w-4" /> :
                   goal.templateType === '個人成長' ? <Target className="h-4 w-4" /> :
                   goal.templateType === '專案計畫' ? <Sparkles className="h-4 w-4" /> :
                   <PartyPopper className="h-4 w-4" />}
                  {goal.templateType}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                  subjects.getSubjectStyle(goal.subject || '').bg
                } ${subjects.getSubjectStyle(goal.subject || '').text}`}>
                  {goal.subject || '未分類'}
                </span>
              </>
            )}
          </div>
          {isEditing ? (
            <textarea
              value={editedGoal.description}
              onChange={(e) => {
                const updatedGoal = {...editedGoal, description: e.target.value};
                setEditedGoal(updatedGoal);
                updateGoal(updatedGoal);
              }}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="描述你的目標..."
            />
          ) : (
            <p className="text-gray-700">{goal.description}</p>
          )}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {activeSteps.map(step => (
              <div key={step.id} className="border rounded-lg overflow-hidden bg-white/80 backdrop-blur-sm shadow-sm group">
                <div className="flex items-center justify-between p-3 bg-gray-100/60 backdrop-blur-sm group">
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="flex items-center flex-1"
                  >
                    {expandedSteps.includes(step.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="ml-2 font-medium">{step.title}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">
                        {getCompletionRate(step)}%
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${getCompletionRate(step)}%` }}
                        />
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleDelete('step', goal.id, step.id)}
                        className="text-red-500 hover:bg-red-50 rounded-full p-1"
                        aria-label="刪除步驟"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {expandedSteps.includes(step.id) && (
                  <div className="p-3 space-y-2 bg-gray-50/20 backdrop-blur-sm">
                    <Droppable droppableId={step.id}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="min-h-[50px]"
                        >
                          {step.tasks
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={!isEditing}
                            >
                              {(provided, snapshot) => (
                                <React.Fragment>
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center justify-between group ${
                                      snapshot.isDragging ? 'opacity-100 shadow-lg' : ''
                                    }`}
                                  >
                                    <div className={`flex items-center justify-between flex-1 p-2 rounded hover:bg-gray-100 transition-colors ${
                                      task.status === 'done' ? 'bg-green-50' : 
                                      task.status === 'in_progress' ? 'bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100' : ''
                                    }`}>
                                      <button
                                        onClick={() => onTaskClick(task.id)}
                                        className="flex items-center flex-1"
                                      >
                                        {task.status === 'done' ? (
                                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                                        ) : task.status === 'in_progress' ? (
                                          <AlertCircle className="h-5 w-5 text-purple-500 mr-2" />
                                        ) : (
                                          <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                                        )}
                                        <span className={`${
                                          task.status === 'done' ? 'text-gray-400' : 
                                          task.status === 'in_progress' ? 'text-purple-700 font-medium' : ''
                                        }`}>
                                          {task.title}
                                        </span>
                                      </button>
                                      <div className="flex items-center gap-2">
                                        {isEditing && (
                                          <>
                                            <button
                                              onClick={() => handleDelete('task', goal.id, step.id, task.id)}
                                              className="text-red-500 hover:bg-red-50 rounded-full p-1"
                                              aria-label="刪除任務"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                            <button
                                              onClick={() => {
                                                setSelectedStepId(step.id);
                                                setNewTaskTitle('');
                                              }}
                                              className="text-blue-500 hover:bg-blue-50 rounded-full p-1"
                                              aria-label="新增任務"
                                            >
                                              <Plus size={16} />
                                            </button>
                                            <div {...provided.dragHandleProps}>
                                              <button
                                                className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                                aria-label="拖曳排序"
                                              >
                                                <GripVertical size={16} />
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {selectedStepId === step.id && index === step.tasks.length - 1 && (
                                    <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50 ml-8">
                                      <AlertCircle className="h-5 w-5 text-gray-400" />
                                      <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="輸入任務名稱..."
                                        className="flex-1 bg-transparent border-none focus:outline-none"
                                        autoFocus
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            handleAddTask(step.id);
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() => handleAddTask(step.id)}
                                        className="p-1 text-blue-500 hover:bg-blue-50 rounded-full"
                                        aria-label="確認新增"
                                      >
                                        <CheckCircle2 size={20} />
                                      </button>
                                      <button
                                        onClick={() => setSelectedStepId(null)}
                                        className="p-1 text-gray-500 hover:bg-gray-50 rounded-full"
                                        aria-label="取消"
                                      >
                                        <X size={20} />
                                      </button>
                                    </div>
                                  )}
                                </React.Fragment>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                    {step.tasks.length === 0 && !selectedStepId && isEditing && (
                      <button
                        onClick={() => {
                          setSelectedStepId(step.id);
                          setNewTaskTitle('');
                        }}
                        className="w-full flex items-center justify-center gap-2 p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Plus size={16} />
                        <span>新增任務</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {selectedStepId === 'new' ? (
              <div className="border rounded-lg overflow-hidden bg-white/80 backdrop-blur-sm shadow-sm">
                <div className="flex items-center justify-between p-3 bg-gray-50/80 backdrop-blur-sm">
                  <div className="flex items-center flex-1">
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                    <input
                      type="text"
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                      placeholder="輸入步驟名稱..."
                      className="ml-2 font-medium bg-transparent border-none focus:outline-none"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddStep();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddStep}
                      className="p-1 text-blue-500 hover:bg-blue-50 rounded-full"
                      aria-label="確認新增"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <button
                      onClick={() => setSelectedStepId(null)}
                      className="p-1 text-gray-500 hover:bg-gray-50 rounded-full"
                      aria-label="取消"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ) : isEditing && (
              <button
                onClick={() => {
                  setSelectedStepId('new');
                  setNewStepTitle('');
                }}
                className="w-full flex items-center justify-center gap-2 p-3 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors border border-dashed border-gray-300"
              >
                <Plus size={20} />
                <span>新增步驟</span>
              </button>
            )}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}; 