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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Save, Smile, Zap, Heart, BookOpen, History } from 'lucide-react';
import { journalStore, type MoodType, type CreateJournalEntry } from '../../../store/journalStore';
import { useNavigate } from 'react-router-dom';

type MotivationLevel = number; // 1-10

interface JournalEntry {
  mood: MoodType;
  motivationLevel: MotivationLevel;
  content: string;
  hasVoiceNote: boolean;
  date: string;
}

interface DailyJournalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (entry: JournalEntry) => Promise<void>; // 改為可選，因為我們會直接用 store
}

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
  onSave
}) => {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [motivationLevel, setMotivationLevel] = useState<MotivationLevel>(6);
  const [journalContent, setJournalContent] = useState('');
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistoryConfirm, setShowHistoryConfirm] = useState(false);

  const handleSave = async () => {
    if (!selectedMood) {
      alert('請選擇今天的心情！');
      return;
    }

    setIsSaving(true);
    try {
      const entry: CreateJournalEntry = {
        mood: selectedMood,
        motivation_level: motivationLevel,
        content: journalContent,
        has_voice_note: hasVoiceNote
      };

      // 使用 store 儲存或呼叫外部回調
      if (onSave) {
        await onSave({
          mood: selectedMood,
          motivationLevel,
          content: journalContent,
          hasVoiceNote,
          date: new Date().toISOString()
        });
      } else {
        await journalStore.saveJournalEntry(entry);
      }
      
      // 重置表單
      setSelectedMood(null);
      setMotivationLevel(6);
      setJournalContent('');
      setHasVoiceNote(false);
      onClose();
    } catch (error) {
      console.error('儲存日誌失敗:', error);
      alert('儲存失敗，請稍後再試');
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
          onClick={onClose}
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
              className="relative p-6 rounded-t-3xl text-white text-center"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center justify-center gap-2 mb-2">
                <BookOpen className="w-6 h-6" />
                <h2 className="text-xl font-bold">今日學習日記</h2>
              </div>
              <p className="text-white/80 text-sm">
                記錄今天的學習心情和收穫
              </p>

              {/* History 按鈕 */}
              <button
                onClick={handleViewHistory}
                className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors group"
                title="查看歷史記錄"
              >
                <History className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 心情選擇 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Smile className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-gray-800">今天的心情</h3>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <motion.button
                      key={mood.type}
                      onClick={() => setSelectedMood(mood.type)}
                      className={`relative p-3 rounded-2xl transition-all duration-200 ${
                        selectedMood === mood.type 
                          ? 'scale-110 shadow-lg' 
                          : 'hover:scale-105 shadow-sm'
                      }`}
                      style={{
                        backgroundColor: selectedMood === mood.type ? mood.color : mood.bgColor,
                        color: selectedMood === mood.type ? 'white' : mood.color
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-800">學習動力</h3>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {MOTIVATION_OPTIONS.map((motivation) => (
                    <motion.button
                      key={motivation.level}
                      onClick={() => setMotivationLevel(motivation.level)}
                      className={`relative p-2 rounded-2xl transition-all duration-200 min-h-[80px] flex flex-col justify-center ${
                        motivationLevel === motivation.level 
                          ? 'scale-110 shadow-lg' 
                          : 'hover:scale-105 shadow-sm'
                      }`}
                      style={{
                        backgroundColor: motivationLevel === motivation.level ? motivation.color : motivation.bgColor,
                        color: motivationLevel === motivation.level ? 'white' : motivation.color
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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

              {/* 文字記錄 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">今天學了什麼？</h3>
                <textarea
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="寫下今天的學習心得、收穫或想法... 可以是很簡單的幾句話喔！"
                  className="w-full h-32 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:outline-none resize-none text-sm leading-relaxed"
                />
              </div>

              {/* 語音記錄 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">語音記錄 (選擇性)</h3>
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={handleVoiceRecord}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-medium transition-all ${
                      isRecording 
                        ? 'bg-red-500 text-white' 
                        : hasVoiceNote
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                    transition={isRecording ? { repeat: Infinity, duration: 1 } : {}}
                  >
                    <Mic className="w-4 h-4" />
                    {isRecording ? '錄音中...' : hasVoiceNote ? '已錄音' : '錄一段話'}
                  </motion.button>
                  
                  {hasVoiceNote && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-sm text-green-600 font-medium"
                    >
                      ✨ 語音已錄製
                    </motion.div>
                  )}
                </div>
              </div>

              {/* 儲存按鈕 */}
              <motion.button
                onClick={handleSave}
                disabled={isSaving || !selectedMood}
                className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                  !selectedMood || isSaving
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg'
                }`}
                whileHover={!isSaving && selectedMood ? { scale: 1.02 } : {}}
                whileTap={!isSaving && selectedMood ? { scale: 0.98 } : {}}
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
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 歷史記錄確認對話框 */}
      {showHistoryConfirm && (
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