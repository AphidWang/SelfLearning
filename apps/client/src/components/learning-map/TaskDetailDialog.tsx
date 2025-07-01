import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../../types/goal';
import { Topic } from '../../types/goal';
import { 
  ChevronLeft, MessageSquare, 
  HelpCircle, CheckCircle, PlayCircle,
  Target, X, Pencil, Star, Sparkles, Edit3
} from 'lucide-react';
import { useTopicStore } from '../../store/topicStore';
import { subjects } from '../../styles/tokens';
import { TaskRecordForm } from '../shared/TaskRecordForm';

interface TaskDetailDialogProps {
  task: Task;
  goalId: string;
  topicId: string;
  onClose: () => void;
  onBack: () => void;
  onHelpRequest: (taskId: string) => void;
}

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  task,
  goalId,
  topicId,
  onClose,
  onBack,
  onHelpRequest
}) => {
  const { updateTask, getTopic } = useTopicStore();
  const [isFlipped, setIsFlipped] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [isEditing, setIsEditing] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const subjectStyle = subjects.getSubjectStyle(topic?.subject || '');

  const handleStatusUpdate = async (status: 'in_progress' | 'done') => {
    const updatedTask = {
      ...task,
      status,
      completedAt: status === 'done' ? new Date().toISOString() : undefined
    };
    await updateTask(topicId, goalId, task.id, updatedTask);
    onBack();
  };

  const handleRecordSuccess = () => {
    // 記錄成功後保持在背面，讓用戶選擇狀態
  };

  const handleSaveDescription = () => {
    updateTask(topicId, goalId, task.id, editedTask);
    setIsEditing(false);
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  useEffect(() => {
    const fetchTopic = async () => {
      const fetchedTopic = await getTopic(topicId);
      if (fetchedTopic) {
        setTopic(fetchedTopic);
        const goal = fetchedTopic.goals.find(g => g.id === goalId);
        const foundTask = goal?.tasks.find(t => t.id === task.id);
        if (foundTask) {
          setEditedTask(foundTask);
        }
      }
    };
    fetchTopic();
  }, [topicId, goalId, task.id, getTopic]);

  const handleSave = async () => {
    if (!task || !topic) return;
    
    await updateTask(topicId, goalId, task.id, task);
    onClose();
  };

  return (
    <div className="perspective-1000">
      <motion.div
        key={`task-detail-${task.id}`}
        className="relative w-[380px] max-w-[90vw] h-[520px]"
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px"
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* 正面 - 任務資訊 */}
        <motion.div
          className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 p-6 flex flex-col overflow-hidden"
          style={{
            borderColor: subjectStyle.accent,
            boxShadow: `0 20px 40px ${subjectStyle.accent}25, 0 0 0 1px ${subjectStyle.accent}20`,
            backfaceVisibility: "hidden",
            pointerEvents: isFlipped ? "none" : "auto"
          }}
          animate={{
            rotateY: isFlipped ? 180 : 0,
            zIndex: isFlipped ? 1 : 2
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          initial={false}
        >
          {/* 背景裝飾 */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              background: `radial-gradient(circle at 20% 20%, ${subjectStyle.accent}40 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${subjectStyle.accent}30 0%, transparent 50%)`,
              pointerEvents: 'none',
            }}
          />

          {/* 頂部區域 */}
          <div className="flex justify-between items-start mb-4 relative z-10" data-draggable-header>
            <div className="flex items-center gap-3 flex-1">
              <button
                className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={onBack}
                aria-label="返回"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 line-clamp-2 pr-6">{task.title}</h2>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">任務卡</span>
                </div>
              </div>
            </div>
            <button
              className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={onClose}
              aria-label="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto space-y-4">
            {/* 任務描述卡片 */}
            <div 
              className="rounded-xl p-4 border-2 shadow-lg relative overflow-hidden" 
              style={{ 
                borderColor: subjectStyle.accent,
                background: `linear-gradient(135deg, ${subjectStyle.accent}08 0%, ${subjectStyle.accent}15 100%)`,
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={16} style={{ color: subjectStyle.accent }} />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">任務描述</h3>
                    <button
                      onClick={() => {
                        setIsEditing(!isEditing);
                        if (!isEditing) {
                          setTimeout(() => descriptionRef.current?.focus(), 0);
                        } else {
                          handleSaveDescription();
                        }
                      }}
                      className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                    >
                      {isEditing ? (
                        <CheckCircle size={14} />
                      ) : (
                        <Pencil size={14} />
                      )}
                    </button>
                  </div>
                </div>
                
                {isEditing ? (
                  <textarea
                    ref={descriptionRef}
                    value={editedTask.description}
                    onChange={(e) => {
                      const updatedTask = {...editedTask, description: e.target.value};
                      setEditedTask(updatedTask);
                    }}
                    onBlur={handleSaveDescription}
                    className="w-full p-3 text-sm bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-gray-300 resize-none backdrop-blur-sm"
                    rows={3}
                    placeholder="描述這個任務..."
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {task.description || "點擊編輯按鈕來新增描述"}
                  </p>
                )}
              </div>
            </div>

            {/* 參考教材 */}
            <div
              className="p-3 bg-gradient-to-br from-indigo-50/90 to-purple-50/90 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border border-indigo-200/50 dark:border-indigo-700/50"
            >
              <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                參考資訊
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-2 italic">
                  尚無參考資訊
                </div>
                {/* 未來可以添加實際內容：
                <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/60 transition-colors cursor-pointer">
                  <BookOpen size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">教學影片</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">基礎概念講解 - 15分鐘</div>
                  </div>
                </div>
                */}
              </div>
            </div>

            {/* 最近活動 */}
            <div
              className="p-3 bg-gradient-to-br from-green-50/90 to-emerald-50/90 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-700/50"
            >
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                <PlayCircle size={16} className="text-green-600 dark:text-green-400" />
                最近活動
              </h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-2 italic">
                  尚無活動紀錄
                </div>
                {/* 未來可以添加實際內容：
                <div className="flex items-center gap-3 p-2 bg-white/60 dark:bg-gray-800/40 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">開始任務</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">2 小時前</div>
                  </div>
                </div>
                */}
              </div>
            </div>
          </div>

          {/* 記錄一下按鈕 - 移到底部 */}
          <button
            onClick={handleFlipCard}
            className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            <Edit3 size={20} className="relative z-10" />
            <span className="relative z-10">記錄一下</span>
            <Sparkles size={16} className="relative z-10" />
          </button>
        </motion.div>

        {/* 背面 - 學習記錄 */}
        <motion.div
          className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 p-6 flex flex-col overflow-hidden"
          style={{
            borderColor: subjectStyle.accent,
            boxShadow: `0 20px 40px ${subjectStyle.accent}25, 0 0 0 1px ${subjectStyle.accent}20`,
            backfaceVisibility: "hidden",
            pointerEvents: isFlipped ? "auto" : "none"
          }}
          animate={{
            rotateY: isFlipped ? 0 : -180,
            zIndex: isFlipped ? 2 : 1
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          initial={false}
        >
          {/* 背景裝飾 */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              background: `radial-gradient(circle at 80% 20%, ${subjectStyle.accent}40 0%, transparent 50%), radial-gradient(circle at 20% 80%, ${subjectStyle.accent}30 0%, transparent 50%)`,
              pointerEvents: 'none',
            }}
          />

          {/* 頂部區域 */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={handleFlipCard}
                aria-label="翻回正面"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">學習記錄</h2>
            </div>
            <button
              className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={onClose}
              aria-label="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col">
            <TaskRecordForm
              taskTitle={task.title}
              taskId={task.id}
              topicId={topicId}
              goalId={goalId}
              onSuccess={handleRecordSuccess}
              showStatusButtons={false}
              onStatusUpdate={handleStatusUpdate}
              showCancelButton={true}
              onCancel={handleFlipCard}
              buttonText="保存學習記錄"
              initialChallenge={task.challenge as 1 | 2 | 3 | 4 | 5 | undefined}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}; 