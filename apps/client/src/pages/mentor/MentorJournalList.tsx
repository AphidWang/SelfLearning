import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Smile, Zap, Mic, CheckCircle, Play } from 'lucide-react';
import { journalStore, type DailyJournal, type MoodType } from '../../store/journalStore';
import PageLayout from '../../components/layout/PageLayout';

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

const getMotivationConfig = (level: number) => {
  const keys = Object.keys(MOTIVATION_CONFIG).map(Number).sort((a, b) => b - a);
  for (const key of keys) {
    if (level >= key) {
      return MOTIVATION_CONFIG[key as keyof typeof MOTIVATION_CONFIG];
    }
  }
  return MOTIVATION_CONFIG[2];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
};

const MentorJournalList: React.FC = () => {
  const [journals, setJournals] = useState<DailyJournal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJournals = async () => {
      setLoading(true);
      try {
        // 這裡假設 journalStore.getAllJournals() 可以拿到所有學生的日記
        // 如果沒有這個 function，請改成你們的 API
        const result = await (journalStore.getAllJournals ? journalStore.getAllJournals() : journalStore.getJournalHistory(1000, 0));
        setJournals(result.journals || result || []);
      } catch (e) {
        setJournals([]);
      } finally {
        setLoading(false);
      }
    };
    loadJournals();
  }, []);

  return (
    <PageLayout title="所有學生日記">
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">所有學生日記</h1>
              <p className="text-gray-600">快速瀏覽所有小朋友的學習日記</p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-6">
          {loading ? (
            <div>載入中...</div>
          ) : journals.length === 0 ? (
            <div>目前沒有日記記錄</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {journals.map((journal, idx) => {
                const moodConfig = MOOD_CONFIG[journal.mood];
                const motivationConfig = getMotivationConfig(journal.motivation_level);
                return (
                  <motion.div
                    key={journal.id || idx}
                    className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -5 }}
                  >
                    {/* 學生資訊（之後可加 user filter） */}
                    {journal.user_name && (
                      <div className="mb-2 text-xs text-gray-500 font-medium">👤 {journal.user_name}</div>
                    )}
                    {/* 日期 */}
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">{formatDate(journal.date)}</span>
                    </div>
                    {/* 心情和動力 */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: moodConfig.bgColor }}>
                        <span className="text-lg">{moodConfig.emoji}</span>
                        <span className="text-sm font-medium" style={{ color: moodConfig.color }}>{moodConfig.label}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: motivationConfig.bgColor }}>
                        <span className="text-lg">{motivationConfig.emoji}</span>
                        <span className="text-sm font-medium" style={{ color: motivationConfig.color }}>{motivationConfig.label}</span>
                      </div>
                    </div>
                    {/* 日誌內容 */}
                    <div className="mb-4">
                      <p className="text-gray-600 text-sm line-clamp-3">{journal.content || '沒有記錄內容'}</p>
                    </div>
                    {/* 完成的任務 */}
                    {journal.completed_tasks && journal.completed_tasks.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <h4 className="text-sm font-medium text-gray-700">完成的任務</h4>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {journal.completed_tasks.map((task: any, taskIndex: number) => (
                            <div key={task.id || taskIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                              {task.type === 'completed' ? (
                                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <Play className="w-3 h-3 text-blue-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-800 truncate">{task.title}</span>
                                  {task.type === 'completed' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">完成</span>
                                  )}
                                  {task.type === 'recorded' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">記錄</span>
                                  )}
                                </div>
                                {(task.category || task.assignedTo) && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {task.category && task.assignedTo ? `${task.category} · ${task.assignedTo}` : task.category || task.assignedTo}
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
      </div>
    </PageLayout>
  );
};

export default MentorJournalList; 