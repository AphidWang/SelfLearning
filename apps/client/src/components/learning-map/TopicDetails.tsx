import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Trash2, Plus, Pencil, Brain, Target, Sparkles, PartyPopper, X, GripVertical, List, Heart, Star } from 'lucide-react';
import type { Goal, Task } from '../../types/goal';
import type { Topic } from '../../types/goal';
import { useTopicStore, type MarkTaskResult } from '../../store/topicStore';
import { subjectColors } from '../../styles/tokens';
import { goalTemplates } from '../../constants/goalTemplates';
import { SUBJECTS } from '../../constants/subjects';
import { subjects } from '../../styles/tokens';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

interface TopicDetailsProps {
  topic: Topic;
  onBack: () => void;
  onTaskClick?: (taskId: string, goalId?: string) => void;
  isCreating: boolean;
  isEditing: boolean;
  onEditToggle: () => void;
  onUpdate?: () => Promise<void>;
}

export const TopicDetails: React.FC<TopicDetailsProps> = ({ 
  topic, 
  onBack, 
  onTaskClick, 
  isCreating = false, 
  isEditing = isCreating, 
  onEditToggle, 
  onUpdate
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ 
    type: 'goal' | 'task' | 'topic', 
    topicId: string, 
    goalId?: string, 
    taskId?: string 
  } | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showSubjectSelect, setShowSubjectSelect] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [editedTopic, setEditedTopic] = useState<Topic>({
    ...topic,
    topic_type: topic.topic_type || '學習目標',
    subject: topic.subject || SUBJECTS.CUSTOM
  });
  const { deleteTopic, addGoal, deleteGoal, addTask, deleteTask, updateTopicCompat: updateTopic, getActiveGoals, updateTaskInfo, markTaskCompletedCompat: markTaskCompleted, markTaskInProgressCompat: markTaskInProgress, reorderTasks, getTopic } = useTopicStore();
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [showGoalsOverview, setShowGoalsOverview] = useState(false);
  const [selectedGoalForTasks, setSelectedGoalForTasks] = useState<string | null>(null);
  const [markedGoals, setMarkedGoals] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTopicData = async () => {
      const topicData = await getTopic(topic.id);
      if (topicData) {
        const goals = getActiveGoals(topic.id);
        setActiveGoals(goals);
      }
    };
    fetchTopicData();
  }, [topic.id, topic]);

  useEffect(() => {
    setEditedTopic({
      ...topic,
      topic_type: topic.topic_type || '學習目標',
      subject: topic.subject || SUBJECTS.CUSTOM
    });
  }, [topic]);

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

  const getCompletionRate = (goal: Goal) => {
    const activeGoal = activeGoals.find(g => g.id === goal.id);
    if (!activeGoal) return 0;
    
    const totalTasks = activeGoal.tasks?.length || 0;
    const completedTasks = activeGoal.tasks?.filter(task => task.status === 'done').length || 0;
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  const handleDelete = (type: 'goal' | 'task', topicId: string, goalId: string, taskId?: string) => {
    setDeleteTarget({ type, topicId, goalId, taskId });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      if (deleteTarget.type === 'topic') {
        const success = await deleteTopic(deleteTarget.topicId);
        if (success) {
          onBack();
        } else {
          alert('刪除主題失敗，請稍後再試');
        }
      } else if (deleteTarget.type === 'goal' && deleteTarget.goalId) {
        const success = await deleteGoal(deleteTarget.goalId);
        if (success) {
          await onUpdate?.();
        } else {
          alert('刪除目標失敗，請稍後再試');
        }
      } else if (deleteTarget.type === 'task' && deleteTarget.goalId && deleteTarget.taskId) {
        const success = await deleteTask(deleteTarget.taskId);
        if (success) {
          await onUpdate?.();
        } else {
          alert('刪除任務失敗，請稍後再試');
        }
      }
    } catch (error) {
      console.error('刪除操作失敗:', error);
      alert('刪除失敗，請稍後再試');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    
    try {
      const success = await addGoal(topic.id, {
        title: newGoalTitle,
        status: 'todo',
        priority: 'medium',
        order_index: topic.goals?.length || 0
      });
      
      if (success) {
        setNewGoalTitle('');
        setSelectedGoalId(null);
        await onUpdate?.();
      } else {
        alert('新增目標失敗，請稍後再試');
      }
    } catch (error) {
      console.error('新增目標失敗:', error);
      alert('新增目標失敗，請稍後再試');
    }
  };

  const handleAddTask = async (goalId: string) => {
    if (!newTaskTitle.trim()) return;
    
    try {
      const success = await addTask(goalId, {
        title: newTaskTitle,
        status: 'todo',
        priority: 'medium',
        order_index: 0,
        need_help: false
      });
      
      if (success) {
        setNewTaskTitle('');
        setSelectedGoalId(null);
        await onUpdate?.();
      } else {
        alert('新增任務失敗，請稍後再試');
      }
    } catch (error) {
      console.error('新增任務失敗:', error);
      alert('新增任務失敗，請稍後再試');
    }
  };

  const handleSave = () => {
    updateTopic(topic.id, editedTopic);
    if (onEditToggle) {
      onEditToggle();
    }
  };

  const handleTaskStatusChange = async (goalId: string, task: Task) => {
    try {
      let result: MarkTaskResult;
      
      if (task.status === 'done') {
        result = await markTaskInProgress(topic.id, goalId, task.id);
      } else {
        result = await markTaskCompleted(topic.id, goalId, task.id);
      }
      
      if (result.success) {
        await onUpdate?.();
      } else {
        if (result.requiresRecord) {
          toast.error('請先記錄學習心得再標記完成！');
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      toast.error('系統錯誤，請稍後再試');
    }
  };

  const handleGoalMark = (goalId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setMarkedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceGoalId = source.droppableId;
    const destGoalId = destination.droppableId;

    if (sourceGoalId === destGoalId) {
      reorderTasks(sourceGoalId, source.index, destination.index);
    } else {
      const sourceGoal = activeGoals.find(goal => goal.id === sourceGoalId);
      const destGoal = activeGoals.find(goal => goal.id === destGoalId);
      
      if (sourceGoal && destGoal) {
        const task = sourceGoal.tasks?.[source.index];
        if (task) {
          deleteTask(task.id);
          addTask(destGoalId, {
            ...task,
            order_index: destination.index
          });
        }
      }
    }
  };

  const subjectColor = subjectColors[editedTopic.subject || '未分類'];
  const subjectStyle = subjects.getSubjectStyle(topic.subject || '');

  // 獲取選中的目標
  const selectedGoal = selectedGoalForTasks ? activeGoals.find(goal => goal.id === selectedGoalForTasks) : null;

  return (
    <div className="h-full flex flex-col">
      {/* 刪除確認視窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium mb-4">確認刪除</h3>
            <p className="text-gray-600 mb-6">
              確定要刪除這個{deleteTarget?.type === 'goal' ? '目標' : deleteTarget?.type === 'task' ? '任務' : '主題'}嗎？此操作無法復原。
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
        {/* 主題資訊卡片 */}
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
                        editedTopic.topic_type === '學習目標' ? 'bg-purple-100 text-purple-800' :
                        editedTopic.topic_type === '個人成長' ? 'bg-blue-100 text-blue-800' :
                        editedTopic.topic_type === '專案計畫' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {editedTopic.topic_type === '學習目標' ? <Brain className="h-3 w-3" /> :
                       editedTopic.topic_type === '個人成長' ? <Target className="h-3 w-3" /> :
                       editedTopic.topic_type === '專案計畫' ? <Sparkles className="h-3 w-3" /> :
                       <PartyPopper className="h-3 w-3" />}
                                              {editedTopic.topic_type || '選擇類型'}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {showTypeSelect && (
                      <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="py-1">
                          {(['學習目標', '個人成長', '專案計畫', '活動規劃'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                const updatedTopic = {...editedTopic, topic_type: type};
                                setEditedTopic(updatedTopic);
                                updateTopic(topic.id, updatedTopic);
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
                        subjects.getSubjectStyle(editedTopic.subject || '').bg
                      } ${subjects.getSubjectStyle(editedTopic.subject || '').text}`}
                    >
                      {editedTopic.subject || '未分類'}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </button>
                    {showSubjectSelect && (
                      <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="py-1">
                          {Object.entries(SUBJECTS).map(([key, value]) => (
                            <button
                              key={key}
                              onClick={() => {
                                const updatedTopic = {...editedTopic, subject: value};
                                setEditedTopic(updatedTopic);
                                updateTopic(topic.id, updatedTopic);
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
                    topic.topic_type === '學習目標' ? 'bg-purple-100 text-purple-800' :
                    topic.topic_type === '個人成長' ? 'bg-blue-100 text-blue-800' :
                    topic.topic_type === '專案計畫' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {topic.topic_type === '學習目標' ? <Brain className="h-3 w-3" /> :
                     topic.topic_type === '個人成長' ? <Target className="h-3 w-3" /> :
                     topic.topic_type === '專案計畫' ? <Sparkles className="h-3 w-3" /> :
                     <PartyPopper className="h-3 w-3" />}
                    {topic.topic_type}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                    subjects.getSubjectStyle(topic.subject || '').bg
                  } ${subjects.getSubjectStyle(topic.subject || '').text}`}>
                    {topic.subject || '未分類'}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {markedGoals.size > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs">
                    <Heart size={12} className="fill-current" />
                    <span>{markedGoals.size} 個想要進行</span>
                  </div>
                  <button
                    onClick={() => setMarkedGoals(new Set())}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label="清除所有標記"
                    title="清除所有標記"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowGoalsOverview(!showGoalsOverview)}
                className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="目標總覽"
              >
                <List size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-start justify-between gap-2">
            {isEditing ? (
              <div className="space-y-2 flex-1">
                <textarea
                  value={editedTopic.description}
                  onChange={(e) => {
                    const updatedTopic = {...editedTopic, description: e.target.value};
                    setEditedTopic(updatedTopic);
                    updateTopic(topic.id, updatedTopic);
                  }}
                  className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="描述你的主題..."
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setDeleteTarget({ type: 'topic', topicId: topic.id });
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors text-xs"
                  >
                    <Trash2 size={14} />
                    刪除主題
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 flex-1">{topic.description}</p>
            )}
          </div>
        </div>

        {/* 目標網格視圖 - 類似 GoalDetails 的目標網格 */}
        <div className="mb-3">
          <div className="grid grid-cols-2 gap-3">
            {activeGoals.map((goal, index) => {
              const totalTasks = goal.tasks?.length || 0;
              const completedTasks = goal.tasks?.filter(task => task.status === 'done').length || 0;
              const inProgressTasks = goal.tasks?.filter(task => task.status === 'in_progress').length || 0;
              const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
              
              // 決定目標狀態顏色
              let goalStatusColor = '';
              let goalStatusBg = '';
              let goalStatusText = '';
              
              if (progress === 100) {
                goalStatusColor = '#22c55e';
                goalStatusBg = 'bg-green-50';
                goalStatusText = 'text-green-700';
              } else if (inProgressTasks > 0) {
                goalStatusColor = '#8b5cf6';
                goalStatusBg = 'bg-purple-50';
                goalStatusText = 'text-purple-700';
              } else if (completedTasks > 0) {
                goalStatusColor = '#3b82f6';
                goalStatusBg = 'bg-blue-50';
                goalStatusText = 'text-blue-700';
              } else {
                goalStatusColor = '#6b7280';
                goalStatusBg = 'bg-gray-50';
                goalStatusText = 'text-gray-600';
              }
              
              const isMarked = markedGoals.has(goal.id);
              
              return (
                <div
                  key={goal.id}
                  className={`relative flex flex-col gap-2 p-3 rounded-lg text-sm font-medium transition-all ${goalStatusBg} hover:shadow-md cursor-pointer ${
                    isMarked ? 'ring-2 ring-red-300' : ''
                  }`}
                                     onClick={() => {
                     // 點擊目標時展開任務列表
                     const firstTask = goal.tasks?.[0];
                     if (firstTask) {
                       onTaskClick?.(firstTask.id || `${goal.id}-0`, goal.id);
                     }
                   }}
                >
                  {/* 右上角：標記按鈕 */}
                  <button
                    onClick={(e) => handleGoalMark(goal.id, e)}
                    className={`absolute top-1 right-2 p-1 rounded-full transition-all ${
                      isMarked
                        ? 'text-red-500 bg-red-50 hover:bg-red-100'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                    aria-label={isMarked ? '取消標記' : '標記為想要進行'}
                  >
                    <Heart size={14} className={isMarked ? 'fill-current' : ''} />
                  </button>
          
                  {/* 主要內容區塊 */}
                  <div className="flex items-center gap-2 w-full min-h-[42px] pr-6 relative">
                    {/* 編號 */}
                    <span
                      className="w-5 h-5 flex items-center justify-center rounded-full text-xs text-white flex-shrink-0"
                      style={{ backgroundColor: goalStatusColor }}
                    >
                      {index + 1}
                    </span>
          
                    {/* 左側：標題 */}
                    <div className="flex-1 min-h-[42px] flex items-center">
                      <div className={`text-left ${goalStatusText} leading-tight break-words hyphens-auto text-balance`}>
                        {goal.title}
                      </div>
                    </div>
          
                    {/* 右下角：進度計數 */}
                    <div className={`absolute bottom-0 right-0 text-xs ${goalStatusText} flex items-center`}>
                      {completedTasks}/{totalTasks}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* 新增目標按鈕 */}
            <button
              onClick={() => {
                setSelectedGoalId('new');
                setNewGoalTitle('');
              }}
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors border-2 border-dashed border-gray-300 hover:border-blue-300 min-h-[80px]"
              aria-label="新增目標"
            >
              <Plus size={20} />
              <span className="text-xs">新增目標</span>
            </button>
          </div>
        </div>

        {/* 目標總覽彈出框 */}
        {showGoalsOverview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
              className="bg-white rounded-lg p-4 max-w-sm w-full mx-4 shadow-xl"
              style={{ borderColor: subjectStyle.accent, borderWidth: 1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">目標總覽</h3>
                <button
                  onClick={() => setShowGoalsOverview(false)}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {activeGoals.map((goal, index) => {
                  const totalTasks = goal.tasks?.length || 0;
                  const completedTasks = goal.tasks?.filter(task => task.status === 'done').length || 0;
                  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
                  
                  const isMarked = markedGoals.has(goal.id);
                  
                  return (
                    <div
                      key={goal.id}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-all relative ${
                        selectedGoalForTasks === goal.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                      } ${isMarked ? 'bg-red-50 ring-1 ring-red-200' : ''}`}
                    >
                      <button
                        onClick={() => {
                          setSelectedGoalForTasks(goal.id);
                          setShowGoalsOverview(false);
                        }}
                        className="flex items-center gap-2 flex-1"
                      >
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${
                            selectedGoalForTasks === goal.id ? 'bg-blue-500 text-white' : 'bg-gray-200'
                          }`}>
                            {index + 1}
                          </span>
                          <span className={`text-xs font-medium truncate ${
                            selectedGoalForTasks === goal.id ? 'text-blue-700' : ''
                          }`}>{goal.title}</span>
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
                      
                      {/* 標記按鈕 */}
                      <button
                        onClick={(e) => handleGoalMark(goal.id, e)}
                        className={`p-1 rounded-full transition-all ${
                          isMarked 
                            ? 'text-red-500 bg-red-100 hover:bg-red-200' 
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                        aria-label={isMarked ? '取消標記' : '標記為想要進行'}
                      >
                        <Heart size={12} className={isMarked ? 'fill-current' : ''} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 新增目標輸入框 */}
        {selectedGoalId === 'new' && (
          <div className="mt-3 bg-white rounded-lg p-3 shadow-md border" style={{ borderColor: subjectStyle.accent }}>
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="輸入目標名稱..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddGoal();
                  }
                }}
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={handleAddGoal}
                  className="p-1 text-blue-500 hover:bg-blue-50 rounded-full"
                  aria-label="確認新增"
                >
                  <CheckCircle2 size={16} />
                </button>
                <button
                  onClick={() => setSelectedGoalId(null)}
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
        {selectedGoalId && selectedGoalId !== 'new' && (
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
                    handleAddTask(selectedGoalId);
                  }
                }}
              />
              <button
                onClick={() => handleAddTask(selectedGoalId)}
                className="p-1 text-blue-500 hover:bg-blue-50 rounded-full"
                aria-label="確認新增"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={() => setSelectedGoalId(null)}
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

// 兼容性導出
export const GoalDetails = TopicDetails;
export type { TopicDetailsProps, TopicDetailsProps as GoalDetailsProps }; 