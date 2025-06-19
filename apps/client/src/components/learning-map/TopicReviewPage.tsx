import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTopicStore } from '../../store/topicStore';
import { subjects } from '../../styles/tokens';
import { TopicRadialMap, useTopicRadialMapStats } from './TopicRadialMap';
import type { Goal, Task } from '../../types/goal';
import { 
  Brain, TrendingUp, Calendar, Trophy, Star, Clock, 
  CheckCircle2, Target, BookOpen, Zap, Award, 
  BarChart3, PieChart, TrendingDown, ArrowUp,
  Flame, Eye, X, AlertCircle, PlayCircle, MessageSquare,
  ChevronLeft, Pencil, Sparkles, Check
} from 'lucide-react';

interface TopicReviewPageProps {
  topicId: string;
  onTaskClick?: (taskId: string, goalId: string) => void;
  onGoalClick?: (goalId: string) => void;
  onClose: () => void;
}

export const TopicReviewPage: React.FC<TopicReviewPageProps> = ({
  topicId,
  onTaskClick,
  onGoalClick,
  onClose
}) => {
  const { getTopic, getCompletionRate, updateTopic } = useTopicStore();
  const topic = getTopic(topicId);
  const weeklyStats = useTopicRadialMapStats(topicId);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTopic, setEditedTopic] = useState(topic);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  
  if (!topic) {
    return null;
  }
  
  // 當 topic 更新時同步 editedTopic
  useEffect(() => {
    setEditedTopic(topic);
  }, [topic]);

  // 處理點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSubjectDropdown && !target.closest('.subject-dropdown')) {
        setShowSubjectDropdown(false);
      }
    };

    if (showSubjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSubjectDropdown]);

  const subjectStyle = subjects.getSubjectStyle((isEditingTitle ? editedTopic?.subject : topic.subject) || '');
  const progress = getCompletionRate(topic.id);

  // 處理 RadialMap 的點擊事件
  const handleRadialMapGoalClick = (goalId: string) => {
    if (goalId === '') {
      // 空字串表示取消選擇
      setSelectedGoalId(null);
      setSelectedTaskId(null);
    } else {
      setSelectedGoalId(goalId);
      setSelectedTaskId(null); // 清除任務選擇
    }
    // 不調用外部 onGoalClick，只更新選中狀態顯示在右側面板
  };

  const handleRadialMapTaskClick = (taskId: string, goalId: string) => {
    setSelectedGoalId(goalId);
    setSelectedTaskId(taskId);
    // 不調用外部 onTaskClick，只更新選中狀態顯示在右側面板
  };

  // 處理右側面板中任務項目的點擊（用於選擇）
  const handleInfoPanelTaskSelect = (taskId: string, goalId: string) => {
    setSelectedGoalId(goalId);
    setSelectedTaskId(taskId);
  };



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
                          onChange={(e) => setEditedTopic(prev => prev ? {...prev, title: e.target.value} : prev)}
                          className="text-xl font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:border-transparent flex-1"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              if (editedTopic) {
                                updateTopic(editedTopic);
                              }
                              setIsEditingTitle(false);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="relative flex-shrink-0 subject-dropdown">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSubjectDropdown(!showSubjectDropdown);
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
                                      console.log('Subject clicked:', subject);
                                      setEditedTopic(prev => prev ? {...prev, subject: subject as any} : prev);
                                      setShowSubjectDropdown(false);
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
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditingTitle ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (editedTopic) {
                                updateTopic(editedTopic);
                              }
                              setIsEditingTitle(false);
                              setShowSubjectDropdown(false);
                            }}
                            className="p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                            aria-label="完成編輯"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditedTopic(topic); // 恢復原始數據
                              setIsEditingTitle(false);
                              setShowSubjectDropdown(false);
                            }}
                            className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            aria-label="取消編輯"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditedTopic(topic);
                            setIsEditingTitle(true);
                          }}
                          className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          aria-label="編輯標題"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                                {isEditingTitle ? (
                  <textarea
                    value={editedTopic?.description || ''}
                    onChange={(e) => setEditedTopic(prev => prev ? {...prev, description: e.target.value} : prev)}
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
            
            <div className="flex items-center gap-4">
              {/* 關閉按鈕 */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="關閉"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
                    </div>
        </div>

        {/* 主要內容區 */}
                <div className="flex-1 p-3">
          <div className="grid grid-cols-12 gap-3 h-full">
            {/* 左側統計面板 */}
            <div className="col-span-3 flex flex-col gap-2 h-full">
            {/* 總體進度 */}
            <motion.div
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4" style={{ color: subjectStyle.accent }} />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">總體進度</h3>
                <div className="ml-auto text-2xl font-bold" style={{ color: subjectStyle.accent }}>
                  {Math.round(progress)}%
                </div>
              </div>
              
              <div 
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2"
              >
                <motion.div
                  className="h-2 rounded-full"
                  style={{ backgroundColor: subjectStyle.accent }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>已完成: {weeklyStats.completedTasks}</span>
                <span>總任務: {weeklyStats.totalTasks}</span>
              </div>
            </motion.div>

            {/* 本週亮點與學習洞察 */}
            <motion.div
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">本週亮點</h3>
              </div>
              
              {/* 本週統計 */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-lg font-bold text-green-600">{weeklyStats.newlyCompleted}</div>
                  <div className="text-xs text-green-700 dark:text-green-300">新完成</div>
                </div>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-lg font-bold text-blue-600">{weeklyStats.inProgressTasks}</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">進行中</div>
                </div>
                <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-lg font-bold text-orange-600">2</div>
                  <div className="text-xs text-orange-700 dark:text-orange-300">需要幫忙</div>
                </div>
              </div>
            </motion.div>

            {/* 心情小屋 */}
            <motion.div
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">心情小屋</h3>
              </div>
              
              <div className="space-y-2">
                <div className="text-center text-xs text-gray-600 dark:text-gray-400 mb-2">
                  本週對這個主題的感覺
                </div>
                
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { emoji: '😊', label: '開心', selected: true },
                    { emoji: '🤔', label: '思考', selected: false },
                    { emoji: '😤', label: '困難', selected: false },
                    { emoji: '🎉', label: '興奮', selected: false },
                  ].map((mood, index) => (
                    <button
                      key={index}
                      className={`p-1.5 rounded-lg text-center transition-all hover:scale-105 ${
                        mood.selected
                          ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700'
                          : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="text-lg mb-1">{mood.emoji}</div>
                      <div className={`text-xs ${
                        mood.selected 
                          ? 'text-amber-800 dark:text-amber-200 font-medium' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {mood.label}
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                  點擊記錄心情
                </div>
              </div>
            </motion.div>

            {/* 老師評語 */}
            <motion.div
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-gray-200 dark:border-gray-700 flex-1 flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">老師評語</h3>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  尚無老師評語
                </div>
              </div>
            </motion.div>
          </div>

                      {/* 中央心智圖 */}
            <div className="col-span-6 h-full">
              <motion.div
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <TopicRadialMap
                  topicId={topicId}
                  width={760}
                  height={460}
                  showAnimations={true}
                  selectedGoalId={selectedGoalId}
                  selectedTaskId={selectedTaskId}
                  onTaskClick={handleRadialMapTaskClick}
                  onGoalClick={handleRadialMapGoalClick}
                  className="w-full h-full"
                />
              </motion.div>
            </div>

            {/* 右側資訊面板 */}
            <div className="col-span-3 h-full">
              <GoalTaskInfoPanel
                topicId={topicId}
                selectedGoalId={selectedGoalId}
                selectedTaskId={selectedTaskId}
                subjectColor={subjectStyle.accent}
                onTaskSelect={handleInfoPanelTaskSelect}
                onGoalClick={onGoalClick}
              />
            </div>
        </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// GoalTaskInfoPanel 組件
interface GoalTaskInfoPanelProps {
  topicId: string;
  selectedGoalId: string | null;
  selectedTaskId: string | null;
  subjectColor: string;
  onTaskSelect?: (taskId: string, goalId: string) => void;
  onGoalClick?: (goalId: string) => void;
}

const GoalTaskInfoPanel: React.FC<GoalTaskInfoPanelProps> = ({
  topicId,
  selectedGoalId,
  selectedTaskId,
  subjectColor,
  onTaskSelect,
  onGoalClick
}) => {
  const { getTopic } = useTopicStore();
  const topic = getTopic(topicId);
  
  // 根據選擇顯示不同內容
  const selectedGoal = selectedGoalId ? topic?.goals.find(goal => goal.id === selectedGoalId) : null;
  const selectedTask = selectedTaskId && selectedGoal ? 
    selectedGoal.tasks.find(task => task.id === selectedTaskId) : null;

  if (selectedTask && selectedGoal) {
    // 顯示任務詳情
    return (
      <TaskDetailPanel 
        key={`task-${selectedTask.id}`}
        task={selectedTask}
        goal={selectedGoal}
        topicId={topicId}
        subjectColor={subjectColor}
      />
    );
  }

  if (selectedGoal) {
    // 顯示目標詳情
    const totalTasks = selectedGoal.tasks.length;
    const completedTasks = selectedGoal.tasks.filter(task => task.status === 'done').length;
    const inProgressTasks = selectedGoal.tasks.filter(task => task.status === 'in_progress').length;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return (
      <motion.div
        key={`goal-${selectedGoal.id}`}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col p-4"
        style={{ borderColor: `${subjectColor}50` }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {/* 背景裝飾 */}
        <div 
          className="absolute inset-0 opacity-5 rounded-xl"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${subjectColor}40 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />

        {/* 標題區 */}
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <Target className="w-4 h-4" style={{ color: subjectColor }} />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">目標詳情</h3>
        </div>

        {/* 目標標題和進度 */}
        <div className="mb-4 relative z-10">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm mb-2">
            {selectedGoal.title}
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? '#22c55e' : subjectColor
                }}
              />
            </div>
            <span className="text-xs text-gray-500 min-w-[40px]">
              {progress}%
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>已完成: {completedTasks}</span>
            <span>進行中: {inProgressTasks}</span>
            <span>總計: {totalTasks}</span>
          </div>
        </div>

        {/* 任務列表 */}
        <div className="flex-1 overflow-auto relative z-10">
          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">任務列表</h5>
                    <div className="space-y-2">
            {selectedGoal.tasks.slice(0, 5).map((task) => {
              const isSelected = selectedTaskId === task.id;
              return (
                <div
                  key={task.id}
                  className={`p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300' :
                    task.status === 'done' ? 'bg-green-50 border-green-200' : 
                    task.status === 'in_progress' ? 'bg-purple-50 border-purple-200' : 
                    'bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => onTaskSelect?.(task.id, selectedGoal.id)}
                 >
                <div className="flex items-center gap-2">
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : task.status === 'in_progress' ? (
                    <AlertCircle className="w-3 h-3 text-purple-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-gray-400" />
                  )}
                  <span className={`text-xs flex-1 ${
                    task.status === 'done' ? 'text-gray-500 line-through' : 
                    task.status === 'in_progress' ? 'text-purple-700 font-medium' : 'text-gray-700'
                  }`}>
                    {task.title}
                                     </span>
                 </div>
               </div>
                 );
               })}
            {selectedGoal.tasks.length > 5 && (
              <div className="text-center text-xs text-gray-500 py-1">
                還有 {selectedGoal.tasks.length - 5} 個任務...
              </div>
            )}
            {selectedGoal.tasks.length === 0 && (
              <div className="text-center text-xs text-gray-500 py-4">
                此目標還沒有任務
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // 預設狀態：顯示提示訊息
  return (
    <motion.div
      key="default-state"
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col items-center justify-center p-6"
      style={{ borderColor: `${subjectColor}50` }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      {/* 背景裝飾 */}
      <div 
        className="absolute inset-0 opacity-5 rounded-xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${subjectColor}30 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      <div className="text-center relative z-10">
        <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">選擇要查看的內容</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          點擊左側路徑圖中的目標或任務
          <br />
          來查看詳細資訊
        </p>
      </div>
    </motion.div>
  );
};

// TaskDetailPanel 組件 - 類似 TaskDetailDialog 的內容
interface TaskDetailPanelProps {
  task: Task;
  goal: Goal;
  topicId: string;
  subjectColor: string;
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  goal,
  topicId,
  subjectColor
}) => {
  const { updateTask } = useTopicStore();
  const [isFlipped, setIsFlipped] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState('');
  const [challenge, setChallenge] = useState<1 | 2 | 3 | 4 | 5 | undefined>(task.challenge as 1 | 2 | 3 | 4 | 5 | undefined);

  const handleSaveDescription = () => {
    updateTask(topicId, goal.id, editedTask);
    setIsEditing(false);
  };

  const handleStatusSelect = (status: 'in_progress' | 'done' | 'todo') => {
    const updatedTask = {
      ...task,
      status,
      challenge: challenge as number,
      completedAt: status === 'done' ? new Date().toISOString() : undefined
    };
    updateTask(topicId, goal.id, updatedTask);
  };

  return (
    <motion.div
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col relative overflow-hidden"
      style={{ borderColor: `${subjectColor}50` }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      {/* 背景裝飾 */}
      <div 
        className="absolute inset-0 opacity-5 rounded-xl"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${subjectColor}40 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      {/* 正面 - 任務資訊 */}
      {!isFlipped ? (
        <motion.div 
          className="flex flex-col h-full p-4 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 標題區 */}
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">任務詳情</h3>
          </div>

          {/* 任務標題 */}
          <div className="mb-3">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm line-clamp-2">
              {task.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">來自目標: {goal.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                task.status === 'done' ? 'bg-green-100 text-green-700' :
                task.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {task.status === 'done' ? '已完成' :
                 task.status === 'in_progress' ? '進行中' : '待開始'}
              </span>
            </div>
          </div>

          {/* 任務描述 */}
          <div 
            className="rounded-xl p-3 border mb-3" 
            style={{ 
              borderColor: `${subjectColor}30`,
              background: `linear-gradient(135deg, ${subjectColor}08 0%, ${subjectColor}15 100%)`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target size={12} style={{ color: subjectColor }} />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">任務描述</span>
              </div>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (!isEditing) {
                    setTimeout(() => {}, 0);
                  } else {
                    handleSaveDescription();
                  }
                }}
                className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              >
                {isEditing ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <Pencil size={12} />
                )}
              </button>
            </div>
            
            {isEditing ? (
              <textarea
                value={editedTask.description}
                onChange={(e) => {
                  const updatedTask = {...editedTask, description: e.target.value};
                  setEditedTask(updatedTask);
                }}
                onBlur={handleSaveDescription}
                className="w-full p-2 text-xs bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-gray-300 resize-none backdrop-blur-sm"
                rows={3}
                placeholder="描述這個任務..."
                autoFocus
              />
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {task.description || "點擊編輯按鈕來新增描述"}
              </p>
            )}
          </div>

          {/* 參考資訊 */}
          <div className="p-3 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200/50 dark:border-indigo-700/50 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={12} style={{ color: subjectColor }} />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">參考資訊</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
              尚無參考資訊
            </div>
          </div>

          {/* 最近活動 */}
          <div className="p-3 bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-700/50 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <PlayCircle size={12} style={{ color: subjectColor }} />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">最近活動</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
              尚無活動紀錄
            </div>
          </div>

          {/* 底部按鈕組 */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setIsFlipped(true)}
              className="w-full py-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              記錄一下
            </button>
          </div>
        </motion.div>
      ) : (
        /* 背面 - 學習記錄 */
        <motion.div 
          className="flex flex-col h-full p-4 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 標題區 */}
          <div className="flex items-center gap-2 mb-4">
            <button
              className="p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={() => setIsFlipped(false)}
              aria-label="返回任務詳情"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">學習記錄</h3>
          </div>

          {/* 挑戰程度 */}
          <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl mb-3">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">這個任務有多挑戰？</h4>
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setChallenge((i + 1) as 1 | 2 | 3 | 4 | 5)}
                  className="p-1 rounded-lg transition-all hover:scale-110"
                >
                  <Star 
                    size={16} 
                    className={challenge && i < challenge ? 'text-yellow-500' : 'text-gray-300'} 
                    fill={challenge && i < challenge ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
            {challenge && (
              <p className="text-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                {challenge === 1 && "很簡單"}
                {challenge === 2 && "有點簡單"}
                {challenge === 3 && "剛剛好"}
                {challenge === 4 && "有點困難"}
                {challenge === 5 && "很有挑戰"}
              </p>
            )}
          </div>

          {/* 心得輸入 */}
          <div className="p-3 bg-gray-50/80 dark:bg-gray-900/40 rounded-xl flex-1">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">學習心得</h4>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="今天學到了什麼？有什麼想法想記錄下來嗎？"
              className="w-full h-16 p-2 text-xs border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm resize-none"
            />
          </div>

          {/* 底部按鈕組 */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setIsFlipped(false)}
              className="flex-1 px-3 py-2 text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all shadow-md text-sm"
            >
              返回
            </button>
            <button
              onClick={() => handleStatusSelect('in_progress')}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 text-white rounded-lg hover:from-blue-500 hover:via-indigo-600 hover:to-purple-600 transition-all shadow-md text-sm"
            >
              進行中
            </button>
            <button
              onClick={() => handleStatusSelect('done')}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white rounded-lg hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-600 transition-all shadow-md text-sm"
            >
              完成
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// 兼容性導出
export const GoalReviewPage = TopicReviewPage;
export type { TopicReviewPageProps, TopicReviewPageProps as GoalReviewPageProps }; 