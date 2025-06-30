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
import { X, Mic, Save, Smile, Zap, Heart, BookOpen } from 'lucide-react';

type MoodType = 'excited' | 'happy' | 'okay' | 'tired' | 'stressed';
type EnergyLevel = number; // 1-10

interface JournalEntry {
  mood: MoodType;
  energyLevel: EnergyLevel;
  content: string;
  hasVoiceNote: boolean;
  date: string;
}

interface DailyJournalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: JournalEntry) => Promise<void>;
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

const ENERGY_LABELS = [
  '完全沒電', '很累', '有點累', '還行', '普通',
  '不錯', '很棒', '超棒', '滿滿能量', '超級充電'
];

export const DailyJournalDialog: React.FC<DailyJournalDialogProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(5);
  const [journalContent, setJournalContent] = useState('');
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedMood) {
      alert('請選擇今天的心情！');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        mood: selectedMood,
        energyLevel,
        content: journalContent,
        hasVoiceNote,
        date: new Date().toISOString()
      });
      
      // 重置表單
      setSelectedMood(null);
      setEnergyLevel(5);
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

              {/* 能量狀態 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-800">能量指數</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={energyLevel}
                      onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, 
                          #ff6b6b 0%, 
                          #feca57 ${(energyLevel - 1) * 10}%, 
                          #48ca8f ${(energyLevel - 1) * 10}%, 
                          #48ca8f 100%)`
                      }}
                    />
                    <style jsx>{`
                      input[type="range"]::-webkit-slider-thumb {
                        appearance: none;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        cursor: pointer;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                      }
                    `}</style>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {energyLevel <= 3 ? '😴' : energyLevel <= 6 ? '😊' : '🚀'}
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      {ENERGY_LABELS[energyLevel - 1]}
                    </p>
                  </div>
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
    </AnimatePresence>
  );
}; 