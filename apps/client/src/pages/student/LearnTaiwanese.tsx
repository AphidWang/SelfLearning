import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Play, Pause, Volume2, History, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface Word {
  hanzi: string;
  tai_lo: string;
}

interface TranslationResult {
  words: Word[];
  fullSentence: {
    hanzi: string;
    tai_lo: string;
  };
}

interface HistoryItem {
  id: string;
  originalText: string;
  translation: TranslationResult;
  timestamp: number;
  audioUrls?: {
    words: { [key: string]: string };
    sentence?: string;
  };
}

const LearnTaiwanese: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioErrors, setAudioErrors] = useState<Set<string>>(new Set());
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // 載入歷史記錄
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem('taiwanese-learning-history');
        if (stored) {
          const parsed = JSON.parse(stored);
          setHistory(parsed);
        }
      } catch (error) {
        console.error('載入歷史記錄失敗:', error);
      }
    };
    
    loadHistory();
  }, []);

  // 保存歷史記錄
  const saveHistory = (newHistory: HistoryItem[]) => {
    try {
      localStorage.setItem('taiwanese-learning-history', JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error('保存歷史記錄失敗:', error);
    }
  };

  // 翻譯功能
  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    try {
      const response = await api.post('/api/taiwanese/translate', {
        text: inputText.trim()
      });

      if (response.data.success) {
        const translationData = response.data.data;
        setTranslation(translationData);

        // 保存到歷史記錄
        const newItem: HistoryItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          originalText: inputText.trim(),
          translation: translationData,
          timestamp: Date.now()
        };

        const updatedHistory = [newItem, ...history].slice(0, 50); // 最多保存 50 條
        saveHistory(updatedHistory);
      } else {
        alert('翻譯失敗：' + (response.data.message || '未知錯誤'));
      }
    } catch (error: any) {
      console.error('翻譯錯誤:', error);
      alert('翻譯失敗：' + (error.response?.data?.message || error.message || '網路錯誤'));
    } finally {
      setIsTranslating(false);
    }
  };

  // 生成音頻
  const generateAudio = async (text: string, type: 'word' | 'sentence', wordIndex?: number) => {
    const audioKey = type === 'word' ? `word-${wordIndex}` : 'sentence';
    
    // 檢查是否已有音頻 URL（從歷史記錄中）
    if (translation && type === 'sentence') {
      const currentHistoryItem = history.find(
        item => item.originalText === inputText.trim() && 
        item.translation.fullSentence.tai_lo === translation.fullSentence.tai_lo
      );
      if (currentHistoryItem?.audioUrls?.sentence) {
        return currentHistoryItem.audioUrls.sentence;
      }
    }

    setIsGeneratingAudio(true);
    try {
      const response = await api.post(
        '/api/taiwanese/tts',
        { text, type },
        { 
          responseType: 'blob',
          timeout: 120000 // TTS 需要更長時間（120 秒），特別是首次運行需要下載模型
        }
      );

      // 將 blob 轉換為 URL
      const audioUrl = URL.createObjectURL(response.data);
      
      // 保存音頻 URL 到歷史記錄
      if (translation) {
        const currentHistoryItem = history.find(
          item => item.originalText === inputText.trim()
        );
        
        if (currentHistoryItem) {
          const updatedHistory = history.map(item => {
            if (item.id === currentHistoryItem.id) {
              return {
                ...item,
                audioUrls: {
                  ...item.audioUrls,
                  [audioKey]: audioUrl,
                  ...(type === 'sentence' ? { sentence: audioUrl } : {})
                }
              };
            }
            return item;
          });
          saveHistory(updatedHistory);
        }
      }

      return audioUrl;
    } catch (error: any) {
      console.error('生成音頻失敗:', error);
      setAudioErrors(prev => new Set([...prev, audioKey]));
      return null;
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // 播放音頻
  const playAudio = async (text: string, type: 'word' | 'sentence', wordIndex?: number) => {
    const audioKey = type === 'word' ? `word-${wordIndex}` : 'sentence';
    
    // 停止當前播放的音頻
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // 檢查是否已有音頻
    let audioUrl: string | null = null;
    
    if (type === 'sentence' && translation) {
      const currentHistoryItem = history.find(
        item => item.originalText === inputText.trim()
      );
      audioUrl = currentHistoryItem?.audioUrls?.sentence || null;
    }

    // 如果沒有音頻 URL，生成一個
    if (!audioUrl) {
      audioUrl = await generateAudio(text, type, wordIndex);
      if (!audioUrl) {
        alert('無法生成音頻，請稍後再試');
        return;
      }
    }

    // 創建並播放音頻
    const audio = new Audio(audioUrl);
    audioRefs.current[audioKey] = audio;
    
    audio.onended = () => {
      setPlayingAudio(null);
    };

    audio.onerror = () => {
      setPlayingAudio(null);
      setAudioErrors(prev => new Set([...prev, audioKey]));
      alert('播放音頻失敗');
    };

    setPlayingAudio(audioKey);
    audio.play().catch(error => {
      console.error('播放失敗:', error);
      setPlayingAudio(null);
    });
  };

  // 停止播放
  const stopAudio = () => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setPlayingAudio(null);
  };

  // 刪除歷史記錄
  const deleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    saveHistory(updatedHistory);
  };

  // 載入歷史記錄項
  const loadHistoryItem = (item: HistoryItem) => {
    setInputText(item.originalText);
    setTranslation(item.translation);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
            學台語
          </h1>
          <p className="text-center text-gray-600 text-lg">
            輸入中文，學習台語的國字和臺羅拼音
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-purple-200 p-6 mb-6"
        >
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                輸入中文
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleTranslate();
                  }
                }}
                placeholder="輸入你想說的中文..."
                className="w-full px-4 py-3 text-lg border-2 border-purple-300 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                rows={3}
                disabled={isTranslating}
              />
              <p className="text-sm text-gray-500 mt-2">
                按 Ctrl+Enter 或點擊按鈕翻譯
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <motion.button
                onClick={handleTranslate}
                disabled={isTranslating || !inputText.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    翻譯中...
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    翻譯
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <History className="h-4 w-4" />
                歷史
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Translation Result */}
        <AnimatePresence>
          {translation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-pink-200 p-6 mb-6"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">翻譯結果</h2>
              
              {/* Full Sentence */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl">
                <div className="text-sm text-gray-600 mb-2">整句</div>
                <div className="text-2xl font-bold text-gray-800 mb-2">
                  {translation.fullSentence.hanzi}
                </div>
                <div className="text-xl text-purple-600 font-medium mb-3 font-['Noto_Sans_TC',sans-serif]" style={{ fontFeatureSettings: '"liga" 1, "kern" 1' }}>
                  {translation.fullSentence.tai_lo}
                </div>
                <motion.button
                  onClick={() => playAudio(translation.fullSentence.tai_lo, 'sentence')}
                  disabled={isGeneratingAudio || playingAudio === 'sentence'}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {playingAudio === 'sentence' ? (
                    <>
                      <Pause className="h-4 w-4" />
                      播放中...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      播放整句
                    </>
                  )}
                </motion.button>
              </div>

              {/* Words */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-3">單詞</div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {translation.words.map((word, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-400 transition-colors"
                    >
                      <div className="text-lg font-bold text-gray-800 mb-1">
                        {word.hanzi}
                      </div>
                      <div className="text-sm text-purple-600 font-medium mb-2 font-['Noto_Sans_TC',sans-serif]" style={{ fontFeatureSettings: '"liga" 1, "kern" 1' }}>
                        {word.tai_lo}
                      </div>
                      <motion.button
                        onClick={() => playAudio(word.tai_lo, 'word', index)}
                        disabled={isGeneratingAudio || playingAudio === `word-${index}`}
                        className="w-full px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {playingAudio === `word-${index}` ? (
                          <>
                            <Pause className="h-3 w-3" />
                            播放中
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3" />
                            聽發音
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-orange-200 p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">歷史記錄</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  還沒有歷史記錄
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1">
                            {new Date(item.timestamp).toLocaleString('zh-TW')}
                          </div>
                          <div className="text-lg font-medium text-gray-800 mb-2">
                            {item.originalText}
                          </div>
                                <div className="text-purple-600 font-medium font-['Noto_Sans_TC',sans-serif]" style={{ fontFeatureSettings: '"liga" 1, "kern" 1' }}>
                                  {item.translation.fullSentence.hanzi} ({item.translation.fullSentence.tai_lo})
                                </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadHistoryItem(item)}
                            className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
                          >
                            載入
                          </button>
                          <button
                            onClick={() => deleteHistoryItem(item.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LearnTaiwanese;
