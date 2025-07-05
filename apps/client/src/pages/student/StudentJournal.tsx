/**
 * StudentJournal - 學生日誌歷史頁面
 * 
 * 🎯 功能說明：
 * - 展示學生的所有日記記錄
 * - 提供心情統計和動力趨勢圖表
 * - 可以查看和編輯過往的日記
 * - 快速寫新日記的入口
 * 
 * 🎨 設計理念：
 * - 承續 DailyJournalDialog 的溫馨可愛風格
 * - 卡片式設計展示每日記錄
 * - 色彩豐富的統計圖表
 * - 直覺的操作體驗
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Smile,
  Zap,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Edit,
  Trash2,
  CheckCircle,
  Play,
  Mic
} from 'lucide-react';
import { journalStore, type DailyJournal, type MoodType } from '../../store/journalStore';
import { DailyJournalDialog } from './components/DailyJournalDialog';
import PageLayout from '../../components/layout/PageLayout';
import * as Sentry from '@sentry/react';

const MOOD_CONFIG = {
  excited: { emoji: '🤩', label: '超興奮', color: '#FF6B6B', bgColor: '#FFE5E5' },
  happy: { emoji: '😊', label: '開心', color: '#4ECDC4', bgColor: '#E5F9F7' },
  okay: { emoji: '😐', label: '普通', color: '#45B7D1', bgColor: '#E5F4FD' },
  tired: { emoji: '😴', label: '累累的', color: '#96CEB4', bgColor: '#F0F9F4' },
  stressed: { emoji: '😰', label: '有壓力', color: '#FECA57', bgColor: '#FFF9E5' }
};

const MOTIVATION_CONFIG = {
  10: { emoji: '🚀', label: '隨時接受挑戰', color: '#FF6B6B', bgColor: '#FFE5E5' },
  8: { emoji: '🐎', label: '想嘗試新事物', color: '#4ECDC4', bgColor: '#E5F9F7' },
  6: { emoji: '🐰', label: '還在慢慢暖機', color: '#45B7D1', bgColor: '#E5F4FD' },
  4: { emoji: '🐢', label: '好像提不起勁', color: '#96CEB4', bgColor: '#F0F9F4' },
  2: { emoji: '🦥', label: '可能需要幫忙', color: '#FECA57', bgColor: '#FFF9E5' }
};

const StudentJournal: React.FC = () => {
  const [journals, setJournals] = useState<DailyJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<DailyJournal | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [moodStats, setMoodStats] = useState<Record<MoodType, number>>({
    excited: 0, happy: 0, okay: 0, tired: 0, stressed: 0
  });
  const [motivationTrend, setMotivationTrend] = useState<Array<{ date: string; level: number }>>([]);
  const [selectedMood, setSelectedMood] = useState<MoodType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const pageSize = 12;

  useEffect(() => {
    loadJournals();
    loadStats();
  }, [currentPage, selectedMood, searchQuery]);

  const loadJournals = async () => {
    try {
      setLoading(true);
      const { journals: data, total } = await journalStore.getJournalHistory(
        pageSize,
        currentPage * pageSize
      );

      // 簡單的前端過濾（實際應該在後端做）
      let filteredJournals = data;
      if (selectedMood !== 'all') {
        filteredJournals = data.filter(journal => journal.mood === selectedMood);
      }
      if (searchQuery) {
        filteredJournals = filteredJournals.filter(journal => 
          journal.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setJournals(filteredJournals);
      setTotalPages(Math.ceil(total / pageSize));
    } catch (error) {
      console.error('載入日記失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [stats, trend] = await Promise.all([
        journalStore.getMoodStats(30),
        journalStore.getMotivationTrend(14)
      ]);
      
      // 調試：檢查數據類型和值
      console.log('📊 心情統計載入結果:', {
        stats,
        statsType: typeof stats,
        statsKeys: Object.keys(stats),
        statsValues: Object.values(stats),
        statsValuesTypes: Object.values(stats).map(v => typeof v),
        trend,
        trendLength: trend.length
      });
      
      // 發送到 Sentry 進行追蹤
      Sentry.addBreadcrumb({
        message: 'Journal stats loaded',
        level: 'info',
        data: {
          stats,
          statsValues: Object.values(stats),
          statsValuesTypes: Object.values(stats).map(v => typeof v),
          trendLength: trend.length,
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      });
      
      setMoodStats(stats);
      setMotivationTrend(trend);
    } catch (error) {
      console.error('載入統計失敗:', error);
      
      // 發送錯誤到 Sentry
      Sentry.captureException(error, {
        tags: {
          component: 'StudentJournal',
          function: 'loadStats'
        },
        extra: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      });
    }
  };

  const formatDate = (dateString: string) => {
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

  const getMotivationConfig = (level: number) => {
    const keys = Object.keys(MOTIVATION_CONFIG).map(Number).sort((a, b) => b - a);
    for (const key of keys) {
      if (level >= key) {
        return MOTIVATION_CONFIG[key as keyof typeof MOTIVATION_CONFIG];
      }
    }
    return MOTIVATION_CONFIG[2];
  };

  const handleDeleteJournal = async (journalId: string) => {
    if (confirm('確定要刪除這篇日記嗎？')) {
      try {
        await journalStore.deleteJournal(journalId);
        loadJournals();
        loadStats();
      } catch (error) {
        console.error('刪除日記失敗:', error);
        alert('刪除失敗');
      }
    }
  };

  const handleViewJournal = (journal: DailyJournal) => {
    setSelectedJournal(journal);
    setShowViewDialog(true);
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleEditJournal = async (journal: DailyJournal) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayJournal = await journalStore.getJournalByDate(today);
      
      if (todayJournal) {
        setSelectedJournal(todayJournal);
        setShowEditDialog(true);
      }
    } catch (error) {
      console.error('載入今日日誌失敗:', error);
    }
  };

  // 安全計算總日記數，確保數值正確
  const totalJournals = Object.values(moodStats).reduce((a, b) => {
    const numA = typeof a === 'number' ? a : parseInt(String(a)) || 0;
    const numB = typeof b === 'number' ? b : parseInt(String(b)) || 0;
    return numA + numB;
  }, 0);
  
  // 調試：記錄計算過程
  console.log('🔢 總日記數計算:', {
    moodStats,
    moodStatsValues: Object.values(moodStats),
    totalJournals,
    calculation: Object.values(moodStats).map(v => ({ 
      original: v, 
      type: typeof v, 
      parsed: typeof v === 'number' ? v : parseInt(String(v)) || 0 
    }))
  });

  return (
    <PageLayout title="學習日記">
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* 頁面標題 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">我的學習日記</h1>
                <p className="text-gray-600">記錄每天的學習心情與收穫</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 調試按鈕 - 只在開發環境顯示 */}
              {import.meta.env.DEV && (
                <button
                  onClick={() => {
                    const debugData = {
                      moodStats,
                      moodStatsValues: Object.values(moodStats),
                      totalJournals,
                      userAgent: navigator.userAgent,
                      platform: navigator.platform,
                      timestamp: new Date().toISOString()
                    };
                    console.log('🐛 調試數據:', debugData);
                    Sentry.captureMessage('iPad 調試數據', {
                      level: 'info',
                      extra: debugData
                    });
                    alert('調試數據已發送到 Sentry');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                  調試
                </button>
              )}
              
              <motion.button
                onClick={() => setShowNewDialog(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-5 h-5" />
                寫新日記
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* 統計區 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 心情統計 */}
          <motion.div 
            className="bg-white rounded-3xl p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Smile className="w-6 h-6 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-800">心情統計</h3>
              <span className="text-sm text-gray-500">（近30天）</span>
            </div>
            
            <div className="space-y-3">
              {Object.entries(MOOD_CONFIG).map(([mood, config]) => {
                const rawCount = moodStats[mood as MoodType];
                const count = typeof rawCount === 'number' ? rawCount : parseInt(String(rawCount)) || 0;
                const percentage = totalJournals > 0 ? (count / totalJournals) * 100 : 0;
                
                return (
                  <div key={mood} className="flex items-center gap-3">
                    <span className="text-xl">{config.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{config.label}</span>
                        <span className="text-sm text-gray-500">{count}次</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="h-2 rounded-full"
                          style={{ backgroundColor: config.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* 動力趨勢 */}
          <motion.div 
            className="bg-white rounded-3xl p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-800">動力趨勢</h3>
              <span className="text-sm text-gray-500">（近14天）</span>
            </div>
            
            <div className="h-40 flex items-end justify-between gap-1">
              {motivationTrend.map((point, index) => {
                const height = (point.level / 10) * 100;
                return (
                  <motion.div
                    key={point.date}
                    className="flex-1 bg-gradient-to-t from-green-400 to-green-300 rounded-t-lg min-h-[4px]"
                    style={{ height: `${height}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    title={`${point.date}: ${point.level}/10`}
                  />
                );
              })}
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>2週前</span>
              <span>今天</span>
            </div>
          </motion.div>

          {/* 快速統計 */}
          <motion.div 
            className="bg-white rounded-3xl p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800">學習統計</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">{totalJournals}</div>
                <div className="text-sm text-gray-600">總日記數</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-green-600">
                    {motivationTrend.length > 0 ? 
                      Math.round(motivationTrend.reduce((a, b) => a + b.level, 0) / motivationTrend.length) : 0
                    }
                  </div>
                  <div className="text-xs text-gray-600">平均動力</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-orange-600">
                    {motivationTrend.length}
                  </div>
                  <div className="text-xs text-gray-600">記錄天數</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 搜尋和篩選 */}
        <motion.div 
          className="bg-white rounded-2xl p-4 shadow-lg mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜尋 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜尋日記內容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
              />
            </div>
            
            {/* 心情篩選 */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value as MoodType | 'all')}
                className="px-3 py-2 border border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none bg-white"
              >
                <option value="all">所有心情</option>
                {Object.entries(MOOD_CONFIG).map(([mood, config]) => (
                  <option key={mood} value={mood}>
                    {config.emoji} {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* 日誌列表 */}
        <div className="mt-8">
          {loading ? (
            <div>載入中...</div>
          ) : journals.length === 0 ? (
            <div>還沒有日誌記錄</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {journals.map((journal, index) => {
                const moodConfig = MOOD_CONFIG[journal.mood];
                const motivationConfig = getMotivationConfig(journal.motivation_level);
                const isJournalToday = isToday(journal.date);
                
                return (
                  <motion.div
                    key={journal.id}
                    className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    onClick={() => handleViewJournal(journal)}
                  >
                    {/* 日期和操作 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 font-medium">
                          {formatDate(journal.date)}
                        </span>
                      </div>
                      
                      {isJournalToday && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditJournal(journal);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteJournal(journal.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 心情和動力 */}
                    <div className="flex items-center gap-4 mb-4">
                      <div 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: moodConfig.bgColor }}
                      >
                        <span className="text-lg">{moodConfig.emoji}</span>
                        <span className="text-sm font-medium" style={{ color: moodConfig.color }}>
                          {moodConfig.label}
                        </span>
                      </div>

                      <div 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: motivationConfig.bgColor }}
                      >
                        <span className="text-lg">{motivationConfig.emoji}</span>
                        <span className="text-sm font-medium" style={{ color: motivationConfig.color }}>
                          {motivationConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* 日誌內容 */}
                    <div className="mb-4">
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {journal.content || '沒有記錄內容'}
                      </p>
                    </div>

                    {/* 完成的任務 */}
                    {journal.completed_tasks && journal.completed_tasks.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <h4 className="text-sm font-medium text-gray-700">完成的任務</h4>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {journal.completed_tasks.map((task, taskIndex) => (
                            <div
                              key={task.id || taskIndex}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm"
                            >
                              {task.type === 'completed' ? (
                                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <Play className="w-3 h-3 text-blue-500 flex-shrink-0" />
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-800 truncate">
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
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 語音記錄指示器 */}
                    {journal.has_voice_note && (
                      <div className="mt-4 flex items-center gap-2 text-purple-500 text-sm">
                        <Mic className="w-4 h-4" />
                        <span>有語音記錄</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* 分頁 */}
        {totalPages > 1 && (
          <motion.div 
            className="flex items-center justify-center gap-2 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage(Math.max(0, currentPage - 1));
              }}
              disabled={currentPage === 0}
              className="p-2 rounded-xl bg-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage(index);
                  }}
                  className={`w-10 h-10 rounded-xl font-semibold transition-colors ${
                    currentPage === index
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 shadow-lg'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
              }}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-xl bg-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>

      {/* 新日記對話框 */}
      <DailyJournalDialog
        isOpen={showNewDialog}
        onClose={() => {
          setShowNewDialog(false);
        }}
        mode="edit"
        onSave={async (entry) => {
          await journalStore.saveJournalEntry({
            mood: entry.mood,
            motivation_level: entry.motivationLevel,
            content: entry.content,
            has_voice_note: entry.hasVoiceNote,
            completed_tasks: entry.completedTasks
          });
          loadJournals();
          loadStats();
        }}
      />

      {/* 檢視日記對話框 */}
      <DailyJournalDialog
        isOpen={showViewDialog}
        onClose={() => {
          setShowViewDialog(false);
          setSelectedJournal(null);
        }}
        mode="view"
        initialData={selectedJournal || undefined}
      />

      {/* 編輯日記對話框 */}
      <DailyJournalDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedJournal(null);
          loadJournals();
          loadStats();
        }}
        mode="edit"
        initialData={selectedJournal || undefined}
      />
      </div>
    </PageLayout>
  );
};

export default StudentJournal;