import React, { useState, useEffect, useRef } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { Target, ChevronRight, Plus, Calendar, ArrowRight, Sparkles, BookOpen, Lightbulb, CheckCircle2, AlertCircle, Pencil, Trash2, ChevronDown, Brain, PartyPopper } from 'lucide-react';
import { AIAssistant } from '../../components/goals/AIAssistant';
import { ActionItem } from '../../components/goals/ActionItem';
import { goalTemplates } from '../../constants/goalTemplates';
import { useTopicStore } from '../../store/topicStore';
import { useTaskStore } from '../../store/taskStore';
import { useGoalStore } from '../../store/goalStore';
import type { Task } from '../../types/goal';
import type { Topic } from '../../types/goal';
import { GOAL_STATUSES, GOAL_SOURCES } from '../../constants/goals';
import { SUBJECTS, type SubjectType } from '../../constants/subjects';
import { subjects } from '../../styles/tokens';
import { GoalItem } from '../../components/goals/GoalItem';
import { useNavigate } from 'react-router-dom';
import { FloatingAssistant } from '../../components/assistant/FloatingAssistant';
import { useAssistant } from '../../hooks/useAssistant';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import type { TaskActionResult } from '../../types/goal';

const StudentPlanning: React.FC = () => {
  const { topics, updateTopic, fetchTopicsWithActions: fetchTopics, createTopic } = useTopicStore();
  const { updateTask, markTaskCompleted, markTaskInProgress, markTaskTodo } = useTaskStore();
  const { addGoal } = useGoalStore();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showActionItemModal, setShowActionItemModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTopic, setEditedTopic] = useState<Topic | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [savedTopicIds, setSavedTopicIds] = useState<Set<string>>(new Set());
  const [showSubjectSelect, setShowSubjectSelect] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<string[]>([]);
  const { isVisible: showAssistant, position: assistantPosition, setPosition: setAssistantPosition, toggleAssistant } = useAssistant({
    position: { x: -120, y: 0 },
    isVisible: false
  });
  const detailsRef = useRef<HTMLDivElement>(null);
  const assistantContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await useTopicStore.getState().fetchTopicsWithActions();
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入主題時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSavedTopicIds(new Set(topics.map(topic => topic.id)));
  }, [topics]);

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

  const handleAddToSchedule = (topicId: string, goalId: string, taskId: string) => {
    const topic = useTopicStore.getState().topics.find(t => t.id === topicId);
    if (!topic?.goals) return;
    const goal = topic.goals.find(g => g.id === goalId);
    if (!goal?.tasks) return;
    const task = goal.tasks.find(t => t.id === taskId);
    if (!task) return;

    updateTask(task.id, task.version ?? 0, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      role: task.role,
      estimatedTime: task.estimatedTime,
      notes: '已加入排程',
      challenge: task.challenge,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo,
      order: task.order
    });
  };

  const toggleGoal = (goalId: string) => {
    setExpandedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const getCompletionRate = (topic: Topic) => {
    if (!topic?.goals) return 0;
    const totalTasks = topic.goals.reduce((acc, goal) => acc + (goal.tasks?.length || 0), 0);
    const completedTasks = topic.goals.reduce(
      (acc, goal) => acc + (goal.tasks?.filter(task => task.status === 'done').length || 0),
      0
    );
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  const handleTaskStatusChange = async (topicId: string, goalId: string, task: Task) => {
    try {
      let result: TaskActionResult;
      
      if (task.status === 'done') {
        result = await markTaskTodo(task.id, task.version ?? 0);
      } else {
        result = await markTaskCompleted(task.id, task.version ?? 0);
      }
      
      if (!result.success) {
        if (result.requiresRecord) {
          toast.error('請先記錄學習心得再標記完成！');
        } else {
          toast.error(result.message);
        }
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('系統錯誤，請稍後再試');
    }
  };

  const handleTaskEdit = async (topicId: string, goalId: string, task: Task) => {
    try {
      const updatedTask = await updateTask(task.id, task.version ?? 0, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: task.category,
        role: task.role,
        estimatedTime: task.estimatedTime,
        notes: task.notes,
        challenge: task.challenge,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo,
        order: task.order
      });
      if (!updatedTask) {
        // 錯誤信息已在 store 中設置
      }
    } catch (err) {
      console.error('Error editing task:', err);
      setError(err instanceof Error ? err.message : '編輯任務時發生錯誤');
    }
  };

  const handleDeleteTopic = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    updateTopic(topicId, topic.version ?? 0, { status: 'archived' });
  };

  const handleAddNewTopic = (newTopic: Topic) => {
    // 新的 API 需要使用 createTopic 或 addTopic
    // 這裡需要檢查實際的使用場景
    console.log('Add new topic:', newTopic);
  };

  const handleSave = () => {
    if (editedTopic &&
        editedTopic.title?.trim() !== '' &&
        editedTopic.description?.trim() !== '') {
      setIsEditing(false);
      updateTopic(editedTopic.id, editedTopic.version ?? 0, editedTopic);
      setSelectedTopic(editedTopic);
      setHasAttemptedSave(false);
      setSavedTopicIds(prev => new Set(prev).add(editedTopic.id));
    }
  };

  const handleUpdateTopic = (topic: Topic) => {
    updateTopic(topic.id, topic.version ?? 0, topic);
  };

  const handleTopicSelect = (topic: Topic) => {
    if (isEditing && editedTopic) {
      if (!savedTopicIds.has(editedTopic.id)) {
        handleDeleteTopic(editedTopic.id);
      }
      setIsEditing(false);
      setHasAttemptedSave(false);
    }
    setSelectedTopic(topic);
    setEditedTopic(topic);
    setAssistantPosition({ x: -120, y: 0 });
  };

  const handleTopicSave = (topic: Topic) => {
    if (topic.title?.trim() !== '' && 
        topic.description?.trim() !== '') {
      setIsEditing(false);
      handleUpdateTopic(topic);
      setSelectedTopic(topic);
      setHasAttemptedSave(false);
    }
  };

  const handleTopicDelete = (topic: Topic) => {
    if (deleteConfirmText === 'delete') {
      handleDeleteTopic(topic.id);
      setSelectedTopic(null);
      setShowDeleteModal(false);
    }
  };

  const handleTopicFilter = (filteredTopics: Topic[]) => {
    // 這裡不需要更新 store，因為我們只是過濾顯示
    return filteredTopics;
  };

  const handleAddGoal = async () => {
    if (!selectedTopic?.goals) return;
    
    try {
      const newGoal = await useGoalStore.getState().addGoal(selectedTopic.id, {
        title: '新目標',
        description: '',
        status: 'todo',
        tasks: [],
        order_index: selectedTopic.goals.length,
        priority: 'medium'
      });

      if (newGoal) {
        await loadTopics();
        const updatedTopic = useTopicStore.getState().topics.find(t => t.id === selectedTopic.id);
        if (updatedTopic) {
          setSelectedTopic(updatedTopic);
          setEditedTopic(updatedTopic);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '新增目標時發生錯誤');
    }
  };

  return (
    <PageLayout title="學習計畫">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* 浮動助理容器 - 移到最外層 */}
        <div 
          ref={assistantContainerRef}
          className="fixed bottom-20 right-6 w-[400px] h-[400px]"
          style={{ pointerEvents: 'none' }}
        >
          <FloatingAssistant
            enabled={showAssistant}
            onToggle={toggleAssistant}
            hideCloseButton
            dragConstraints={assistantContainerRef}
            initialPosition={assistantPosition}
            onPositionChange={setAssistantPosition}
            className="pointer-events-auto"
          />
        </div>

        {/* Left Column - Goals List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">我的學習主題</h2>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                新增主題
              </button>
            </div>

            <div className="space-y-3">
              {topics.filter(topic => topic.status !== GOAL_STATUSES.ARCHIVED).map(topic => (
                <button
                  key={topic.id}
                  onClick={() => {
                    if (isEditing && editedTopic) {
                      if (!savedTopicIds.has(editedTopic.id)) {
                        handleDeleteTopic(editedTopic.id);
                      }
                      setIsEditing(false);
                      setHasAttemptedSave(false);
                    }
                    setSelectedTopic(topic);
                    setEditedTopic(topic);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedTopic?.id === topic.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500'
                      : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 flex items-start gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`shrink-0 ${
                          topic.type === '學習目標' ? 'text-purple-500' :
                          topic.type === '個人成長' ? 'text-blue-500' :
                          topic.type === '專案計畫' ? 'text-green-500' :
                          'text-orange-500'
                        }`}>
                          {topic.type === '學習目標' ? <Brain className="h-4 w-4" /> :
                           topic.type === '個人成長' ? <Target className="h-4 w-4" /> :
                           topic.type === '專案計畫' ? <Sparkles className="h-4 w-4" /> :
                           <PartyPopper className="h-4 w-4" />}
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {topic.title}
                        </h3>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                      subjects.getSubjectStyle(topic.subject || '').bg
                    } ${subjects.getSubjectStyle(topic.subject || '').text}`}>
                      {topic.subject || '未分類'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400">進度</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getCompletionRate(topic)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${getCompletionRate(topic)}%` }}
                      />
                    </div>
                  </div>

                  {topic.due_date && (
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Intl.DateTimeFormat('zh-TW', {
                        month: 'long',
                        day: 'numeric'
                      }).format(new Date(topic.due_date))}
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

        {/* Right Column - Topic Details & Action Items */}
        <div className="lg:col-span-2">
          {selectedTopic ? (
            <div className="space-y-6">
              {/* Topic Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editedTopic?.title}
                          onChange={(e) => {
                            if (editedTopic) {
                              setEditedTopic({...editedTopic, title: e.target.value});
                            }
                          }}
                          placeholder="輸入主題標題（例如：完成科學探索專案）"
                          className={`w-full text-2xl font-bold bg-gray-50 dark:bg-gray-700 border ${
                            hasAttemptedSave && editedTopic?.title === '' ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } rounded-md px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500`}
                        />
                        <textarea
                          value={editedTopic?.description}
                          onChange={(e) => {
                            if (editedTopic) {
                              setEditedTopic({...editedTopic, description: e.target.value});
                            }
                          }}
                          placeholder="描述你的學習主題內容和期望達成的結果（例如：透過觀察、實驗和記錄，探索自然現象並培養科學思維）"
                          className={`w-full text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border ${
                            hasAttemptedSave && editedTopic?.description === '' ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } rounded-md px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500`}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <div className="relative inline-block">
                            <button
                              onClick={handleTypeSelectClick}
                              className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-sm font-medium type-select ${
                                editedTopic?.type === '學習目標' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                editedTopic?.type === '個人成長' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                editedTopic?.type === '專案計畫' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                              }`}
                            >
                              {editedTopic?.type === '學習目標' ? <Brain className="h-4 w-4" /> :
                               editedTopic?.type === '個人成長' ? <Target className="h-4 w-4" /> :
                               editedTopic?.type === '專案計畫' ? <Sparkles className="h-4 w-4" /> :
                               <PartyPopper className="h-4 w-4" />}
                              {editedTopic?.type}
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            
                            {showTypeSelect && (
                              <div className="absolute z-10 mt-1 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
                                {goalTemplates.map((template) => (
                                  <button
                                    key={template.title}
                                    onClick={() => {
                                      if (editedTopic) {
                                        setEditedTopic({...editedTopic, type: template.title});
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
                                subjects.getSubjectStyle(editedTopic?.subject || '').bg
                              } ${subjects.getSubjectStyle(editedTopic?.subject || '').text}`}
                            >
                              {editedTopic?.subject || '未分類'}
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            
                            {showSubjectSelect && (
                              <div className="absolute z-10 mt-1 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
                                {Object.values(SUBJECTS).map((subject) => (
                                  <button
                                    key={subject}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (editedTopic) {
                                        setEditedTopic({...editedTopic, subject});
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
                            onClick={handleSave}
                            disabled={!editedTopic?.title || !editedTopic?.description}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setEditedTopic(selectedTopic);
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
                          {selectedTopic.title}
                        </h2>
                        <p className="mt-1 text-gray-600 dark:text-gray-300">
                          {selectedTopic.description}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-sm font-medium ${
                            selectedTopic.type === '學習目標' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            selectedTopic.type === '個人成長' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            selectedTopic.type === '專案計畫' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                          }`}>
                            {selectedTopic.type === '學習目標' ? <Brain className="h-4 w-4" /> :
                             selectedTopic.type === '個人成長' ? <Target className="h-4 w-4" /> :
                             selectedTopic.type === '專案計畫' ? <Sparkles className="h-4 w-4" /> :
                             <PartyPopper className="h-4 w-4" />}
                            {selectedTopic.type}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                            subjects.getSubjectStyle(selectedTopic.subject || '').bg
                          } ${subjects.getSubjectStyle(selectedTopic.subject || '').text}`}>
                            {selectedTopic.subject || '未分類'}
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
                          setEditedTopic(selectedTopic);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/student/planning/topic/${selectedTopic.id}`)}
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
                      <button
                        onClick={toggleAssistant}
                        className={`text-gray-400 ${showAssistant ? 'text-indigo-600 dark:text-indigo-400' : 'hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                      >
                        <Sparkles className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">總進度</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {getCompletionRate(selectedTopic)}%
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">已完成項目</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedTopic?.goals?.reduce((acc, goal) => 
                        acc + (goal.tasks?.filter(task => task.status === 'done').length || 0), 0
                      ) || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">待辦項目</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {selectedTopic?.goals?.reduce((acc, goal) => 
                        acc + (goal.tasks?.filter(task => task.status === 'todo').length || 0), 0
                      ) || 0}
                    </p>
                  </div>
                </div>

                {/* Goals List */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      學習目標
                    </h3>
                    <button
                      onClick={handleAddGoal}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      新增目標
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedTopic?.goals?.map(goal => (
                      <GoalItem
                        key={goal.id}
                        goal={goal}
                        isExpanded={expandedGoals.includes(goal.id)}
                        onToggle={() => toggleGoal(goal.id)}
                        onTaskStatusChange={(task) => handleTaskStatusChange(selectedTopic.id, goal.id, task)}
                        onTaskEdit={(task) => handleTaskEdit(selectedTopic.id, goal.id, task)}
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
                  選擇一個學習主題開始
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  從左側選擇一個學習主題，或點擊「新增主題」來開始規劃你的學習之旅。
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
                選擇學習主題類型
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {goalTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={async () => {
                      setShowTemplateModal(false);
                      const newTopic = await useTopicStore.getState().createTopic({
                        title: template.title || '新主題',
                        description: template.description || '',
                        type: template.title,
                        subject: SUBJECTS.CUSTOM,
                        category: 'learning',
                        status: 'active',
                        goals: [],
                        bubbles: [],
                        progress: 0,
                        is_collaborative: false,
                        show_avatars: true
                      });
                      
                      if (newTopic) {
                        await loadTopics();
                        setSelectedTopic(newTopic);
                        setEditedTopic(newTopic);
                        setIsEditing(true);
                      }
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
              確認刪除學習主題
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              確定要刪除此學習主題嗎？此操作無法復原。
            </p>
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
                  if (selectedTopic) {
                    handleDeleteTopic(selectedTopic.id);
                    setSelectedTopic(null);
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }
                }}
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