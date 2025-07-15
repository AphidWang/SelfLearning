/**
 * DailyJournalDialog - 每日學習日誌記錄組件
 * 
 * 🎯 功能說明：
 * - 有趣互動的心情狀態選擇
 * - 能量狀態滑桿選擇
 * - 文字日記輸入
 * - 語音記錄入口（暫時只做 UI）
 * - 可愛的動畫效果和視覺反饋
 * 
 * 🎨 設計理念：
 * - 温馨可愛的風格，適合小朋友使用
 * - 大按鈕、清晰圖示、豐富色彩
 * - 即時的視覺反饋和動畫效果
 * - 簡單直覺的操作流程
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Save, Smile, Zap, Heart, BookOpen, History, CheckCircle, Play } from 'lucide-react';
import { journalStore, type MoodType, type CreateJournalEntry, type CompletedTask, type DailyJournal } from '../../../store/journalStore';
import { taskRecordStore, type TaskRecord } from '../../../store/taskRecordStore';
import { useTopicStore } from '../../../store/topicStore';
import { useNavigate } from 'react-router-dom';
import { Task } from '../../../types/goal';

type MotivationLevel = number; // 1-10

interface JournalEntry {
  mood: MoodType;
  motivationLevel: MotivationLevel;
  content: string;
  hasVoiceNote: boolean;
  date: string;
  completedTasks?: CompletedTask[];
}

interface DailyJournalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (entry: JournalEntry) => Promise<void>;
  mode?: 'edit' | 'view';
  initialData?: DailyJournal;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;
  
  return date.toLocaleDateString('zh-TW', {
    month: 'long',
    day: 'numeric'
  });
};

const MOOD_OPTIONS = [
  {
    type: 'excited' as MoodType,
    emoji: '🤩',
    label: '超興奮',
    color: '#FF6B6B',
    bgColor: '#FFE5E5'
  },
  {
    type: 'happy' as MoodType,
    emoji: '😊',
    label: '開心',
    color: '#4ECDC4',
    bgColor: '#E5F9F7'
  },
  {
    type: 'okay' as MoodType,
    emoji: '😐',
    label: '普通',
    color: '#45B7D1',
    bgColor: '#E5F4FD'
  },
  {
    type: 'tired' as MoodType,
    emoji: '😴',
    label: '累累的',
    color: '#96CEB4',
    bgColor: '#F0F9F4'
  },
  {
    type: 'stressed' as MoodType,
    emoji: '😰',
    label: '有壓力',
    color: '#FECA57',
    bgColor: '#FFF9E5'
  }
];

const MOTIVATION_OPTIONS = [
  {
    level: 10,
    emoji: '🚀',
    label: '隨時接受挑戰',
    color: '#FF6B6B',
    bgColor: '#FFE5E5'
  },
  {
    level: 8,
    emoji: '🐎',
    label: '想嘗試新事物',
    color: '#4ECDC4',
    bgColor: '#E5F9F7'
  },
  {
    level: 6,
    emoji: '🐰',
    label: '還在慢慢暖機',
    color: '#45B7D1',
    bgColor: '#E5F4FD'
  },
  {
    level: 4,
    emoji: '🐢',
    label: '好像提不起勁',
    color: '#96CEB4',
    bgColor: '#F0F9F4'
  },
  {
    level: 2,
    emoji: '🦥',
    label: '可能需要幫忙',
    color: '#FECA57',
    bgColor: '#FFF9E5'
  }
];

export const DailyJournalDialog: React.FC<DailyJournalDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  mode = 'edit',
  initialData
}) => {
  const navigate = useNavigate();
  const { topics } = useTopicStore();
  const topicStore = useTopicStore(); // <--- 修正這裡
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [motivationLevel, setMotivationLevel] = useState<MotivationLevel | null>(null);
  const [journalContent, setJournalContent] = useState('');
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistoryConfirm, setShowHistoryConfirm] = useState(false);
  const [todayTaskRecords, setTodayTaskRecords] = useState<TaskRecord[]>([]);
  const [todayCompletedTasks, setTodayCompletedTasks] = useState<CompletedTask[]>([]);

  // 初始化資料
  useEffect(() => {
    if (initialData) {
      setSelectedMood(initialData.mood);
      setMotivationLevel(initialData.motivation_level);
      setJournalContent(initialData.content);
      setHasVoiceNote(initialData.has_voice_note);
      if (mode === 'view') {
        setTodayCompletedTasks(initialData.completed_tasks || []);
      }
    } else {
      // 重置表單
      setSelectedMood(null);
      setMotivationLevel(null);
      setJournalContent('');
      setHasVoiceNote(false);
    }
  }, [initialData, mode, isOpen]);

  // 獲取今天的任務資料
  useEffect(() => {
    if (!isOpen || mode === 'view') return;

    const fetchTodayTasks = async () => {
      try {
        // 設定今天的日期範圍
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 使用 topicStore 的 getUserTaskActivitiesForDate 獲取今天的任務活動
        const activities = await topicStore.getUserTaskActivitiesForDate(
          today.toISOString().split('T')[0]
        );

        // 設置任務記錄
        setTodayTaskRecords(activities.checked_in_tasks.map(task => ({
          id: `${task.id}-${task.action_timestamp}`,
          task_id: task.id,
          title: task.title,
          created_at: task.action_timestamp,
          difficulty: task.action_data?.difficulty || 3,
          updated_at: task.action_timestamp,
          author_id: '', // 或適合的預設值
          message: '',
          files: [],
          tags: []
        })));

        // 設置完成的任務
        setTodayCompletedTasks(activities.completed_tasks.map(task => ({
          id: task.id,
          title: task.title,
          type: 'completed' as const,
          time: task.completed_at,
          category: task.topic_title,
          assignedTo: task.goal_title
        })));

      } catch (error) {
        console.error('Failed to fetch today tasks:', error);
      }
    };

    fetchTodayTasks();
  }, [isOpen, mode, topics]);

  // 合併今天有做過的任務（記錄 + 完成）
  const todayActiveTasks = useMemo(() => {
    const taskMap = new Map();
    
    // 加入有記錄的任務
    if (todayTaskRecords && Array.isArray(todayTaskRecords)) {
      todayTaskRecords.forEach(record => {
        if (record.task_id) {
          taskMap.set(record.task_id, {
            id: record.task_id,
            title: record.title,
            type: 'recorded' as const,
            difficulty: record.difficulty,
            time: record.created_at
          });
        }
      });
    }

    // 加入完成的任務
    if (todayCompletedTasks && Array.isArray(todayCompletedTasks)) {
      todayCompletedTasks.forEach(task => {
        taskMap.set(task.id, task);
      });
    }

    return Array.from(taskMap.values()).sort((a, b) => 
      new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }, [todayTaskRecords, todayCompletedTasks]);

  const handleSave = async () => {
    // 型別保護
    if (!selectedMood || !motivationLevel) return;
    
    setIsSaving(true);
    try {
      const entry: CreateJournalEntry = {
        mood: selectedMood,
        motivation_level: motivationLevel,
        content: journalContent,
        has_voice_note: hasVoiceNote,
        completed_tasks: todayActiveTasks || []
      };

      // 使用 store 儲存或呼叫外部回調
      if (onSave) {
        await onSave({
          mood: selectedMood,
          motivationLevel,
          content: journalContent,
          hasVoiceNote,
          date: new Date().toISOString(),
          completedTasks: todayActiveTasks || []
        });
      } else {
        await journalStore.saveJournalEntry(entry);
      }
      
      // 重置表單
      setSelectedMood(null);
      setMotivationLevel(null);
      setJournalContent('');
      setHasVoiceNote(false);
      onClose();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // TODO: 實際的語音錄製功能
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setHasVoiceNote(true);
      }, 3000); // 模擬錄音3秒
    }
  };

  const handleViewHistory = () => {
    setShowHistoryConfirm(true);
  };

  const confirmViewHistory = () => {
    setShowHistoryConfirm(false);
    onClose();
    navigate('/student/journal');
  };

  const selectedMoodOption = MOOD_OPTIONS.find(mood => mood.type === selectedMood);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (mode === 'edit' && (selectedMood || motivationLevel || journalContent.trim())) {
                if (confirm('確定要關閉嗎？已輸入的內容將會遺失')) {
                  onClose();
                }
              } else {
                onClose();
              }
            }
          }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 標題區 */}
            <div 
              className="relative p-4 rounded-t-3xl text-white text-center"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              <button
                onClick={onClose}
                type="button"
                className="absolute top-2 right-2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center justify-center gap-1 mb-1">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-lg font-bold">
                  {mode === 'view' ? '日誌內容' : '今日學習日記'}
                </h2>
              </div>
              <p className="text-white/80 text-xs">
                {mode === 'view' ? formatDate(initialData?.date || '') : '記錄今天的學習心情和收穫'}
              </p>

              {/* History 按鈕 - 只在編輯模式顯示 */}
              {mode === 'edit' && (
                <button
                  onClick={handleViewHistory}
                  className="absolute top-2 left-2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors group"
                  title="查看歷史記錄"
                >
                  <History className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="space-y-4"
              >
              {/* 心情選擇 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Smile className="w-4 h-4 text-purple-500" />
                  <h3 className="text-base font-semibold text-gray-800">
                    {mode === 'view' ? '心情' : '今天的心情'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-5 gap-1">
                  {MOOD_OPTIONS.map((mood) => (
                    <motion.button
                      key={mood.type}
                      onClick={(e) => {
                        e.preventDefault(); // 防止表單提交
                        if (mode === 'edit') {
                          setSelectedMood(mood.type);
                        }
                      }}
                      className={`relative p-2 rounded-xl transition-all duration-200 ${
                        selectedMood === mood.type 
                          ? 'scale-110 shadow-lg' 
                          : mode === 'edit' ? 'hover:scale-105 shadow-sm' : 'opacity-50'
                      }`}
                      style={{
                        backgroundColor: selectedMood === mood.type ? mood.color : mood.bgColor,
                        color: selectedMood === mood.type ? 'white' : mood.color,
                        cursor: mode === 'view' ? 'default' : 'pointer'
                      }}
                      whileHover={mode === 'edit' ? { scale: 1.05 } : {}}
                      whileTap={mode === 'edit' ? { scale: 0.95 } : {}}
                    >
                      <div className="text-2xl mb-1">{mood.emoji}</div>
                      <div className="text-xs font-medium">{mood.label}</div>
                      
                      {selectedMood === mood.type && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        >
                          <Heart className="w-3 h-3 text-red-500" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 學習動力 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <h3 className="text-base font-semibold text-gray-800">
                    {mode === 'view' ? '學習動力' : '今天的學習動力'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-5 gap-1">
                  {MOTIVATION_OPTIONS.map((motivation) => (
                    <motion.button
                      key={motivation.level}
                      onClick={(e) => {
                        e.preventDefault(); // 防止表單提交
                        if (mode === 'edit') {
                          setMotivationLevel(motivation.level);
                        }
                      }}
                      className={`relative p-2 rounded-xl transition-all duration-200 min-h-[70px] flex flex-col justify-center ${
                        motivationLevel === motivation.level 
                          ? 'scale-110 shadow-lg' 
                          : mode === 'edit' ? 'hover:scale-105 shadow-sm' : 'opacity-50'
                      }`}
                      style={{
                        backgroundColor: motivationLevel === motivation.level ? motivation.color : motivation.bgColor,
                        color: motivationLevel === motivation.level ? 'white' : motivation.color,
                        cursor: mode === 'view' ? 'default' : 'pointer'
                      }}
                      whileHover={mode === 'edit' ? { scale: 1.05 } : {}}
                      whileTap={mode === 'edit' ? { scale: 0.95 } : {}}
                    >
                      <div className="text-xl mb-1">{motivation.emoji}</div>
                      <div className="text-xs font-medium leading-tight text-center">{motivation.label}</div>
                      
                      {motivationLevel === motivation.level && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        >
                          <Zap className="w-3 h-3 text-yellow-500" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 完成的任務 */}
              {todayCompletedTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <h3 className="text-base font-semibold text-gray-800">
                      {mode === 'view' ? '完成的任務' : '今天做過的任務'}
                    </h3>
                  </div>
                  
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {todayCompletedTasks.map((task, index) => (
                      <motion.div
                        key={task.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                      >
                        {task.type === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <Play className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {task.title}
                            </span>
                            
                            {task.type === 'completed' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                完成
                              </span>
                            )}
                            
                            {task.type === 'recorded' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                記錄
                              </span>
                            )}
                          </div>
                          
                          {(task.category || task.assignedTo) && (
                            <div className="text-xs text-gray-500 truncate">
                              {task.category && task.assignedTo 
                                ? `${task.category} · ${task.assignedTo}`
                                : task.category || task.assignedTo
                              }
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(task.time).toLocaleTimeString('zh-TW', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* 文字記錄 */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">
                  {mode === 'view' ? '學習心得' : '今天學了什麼？'}
                </h3>
                <textarea
                  value={journalContent}
                  onChange={(e) => mode === 'edit' && setJournalContent(e.target.value)}
                  placeholder={mode === 'view' ? '' : "寫下今天的學習心得、收穫或想法... 可以是很簡單的幾句話喔！"}
                  className={`w-full h-24 p-3 border-2 rounded-xl focus:outline-none resize-none text-sm leading-relaxed ${
                    mode === 'edit' && !journalContent.trim() 
                      ? 'border-amber-200 bg-amber-50' 
                      : 'border-gray-200 focus:border-purple-400'
                  }`}
                  readOnly={mode === 'view'}
                />
              </div>

              {/* 語音記錄指示器 */}
              {hasVoiceNote && (
                <div className="flex items-center gap-1 text-purple-500 text-xs">
                  <Mic className="w-3 h-3" />
                  <span>有語音記錄</span>
                </div>
              )}

              {/* 儲存按鈕 - 只在編輯模式顯示 */}
              {mode === 'edit' && (
                <motion.button
                  type="submit"
                  disabled={isSaving || !selectedMood || !motivationLevel || !journalContent.trim()}
                  className={`w-full py-3 rounded-xl font-semibold text-base transition-all ${
                    !selectedMood || !motivationLevel || !journalContent.trim() || isSaving
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg'
                  }`}
                  whileHover={!isSaving && selectedMood && motivationLevel ? { scale: 1.02 } : {}}
                  whileTap={!isSaving && selectedMood && motivationLevel ? { scale: 0.98 } : {}}
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      儲存中...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" />
                      儲存今日記錄
                    </div>
                  )}
                </motion.button>
              )}
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 歷史記錄確認對話框 */}
      {showHistoryConfirm && mode === 'edit' && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-6 h-6 text-purple-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                查看歷史記錄
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                要前往日記歷史頁面嗎？<br />
                目前的編輯內容將會遺失
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHistoryConfirm(false)}
                  className="flex-1 py-2 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmViewHistory}
                  className="flex-1 py-2 px-4 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
                >
                  前往
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 