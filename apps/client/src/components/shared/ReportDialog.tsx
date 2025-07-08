import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Plus, Send, MessageSquare } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportDialog: React.FC<ReportDialogProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useUser();
  const [category, setCategory] = useState<'new_feature' | 'bug_report' | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { 
      id: 'new_feature', 
      name: '新功能', 
      icon: <Plus className="w-5 h-5" />, 
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-gradient-to-r from-blue-400 to-purple-400',
      hoverBg: 'hover:from-blue-500 hover:to-purple-500',
      lightBg: 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30',
      borderColor: 'border-blue-400'
    },
    { 
      id: 'bug_report', 
      name: '問題回報', 
      icon: <AlertTriangle className="w-5 h-5" />, 
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-gradient-to-r from-red-400 to-pink-400',
      hoverBg: 'hover:from-red-500 hover:to-pink-500',
      lightBg: 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30',
      borderColor: 'border-red-400'
    }
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!category || !title || !description || !currentUser) return;

    setIsSubmitting(true);
    try {
      const currentTime = new Date().toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const taskDescription = `**回報類別：** ${categories.find(c => c.id === category)?.name}\n\n**詳細描述：**\n${description}\n\n---\n**建立人：** ${currentUser.name}\n**建立時間：** ${currentTime}`;

      const response = await api.post('/api/report', {
        topicId: '26317f41-1294-40f6-bcdb-514f6c39d66e',
        category,
        title,
        description: taskDescription,
        createdBy: currentUser.id,
      });

      if (response.status === 201) {
        // 重置表單
        setCategory('');
        setTitle('');
        setDescription('');
        onClose();
        
        // 顯示成功訊息
        alert('回報已成功提交！感謝你的回報。');
      } else {
        throw new Error('提交失敗');
      }
    } catch (error: any) {
      console.error('回報提交失敗:', error);
      
      // 詳細的錯誤處理
      let errorMessage = '回報提交失敗，請稍後再試。';
      
      if (error.response?.status === 401) {
        errorMessage = '登入狀態已過期，請重新登入後再試。';
      } else if (error.response?.status === 403) {
        errorMessage = '您沒有權限執行此操作。';
      } else if (error.response?.data?.message) {
        errorMessage = `提交失敗：${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `提交失敗：${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCategory('');
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-orange-200 dark:border-purple-500 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-orange-200 dark:border-purple-500 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-gray-700 dark:to-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-400 to-pink-400 rounded-lg shadow-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  📢 系統回報
                </h2>
                <p className="text-sm text-orange-600 dark:text-purple-300">
                  回報問題或建議新功能
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  選擇回報類別
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {categories.map((cat) => (
                    <motion.button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as 'new_feature' | 'bug_report')}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        category === cat.id
                          ? `${cat.borderColor} ${cat.lightBg} shadow-lg`
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category === cat.id ? `${cat.bgColor} ${cat.hoverBg}` : 'bg-gray-100 dark:bg-gray-700'} shadow-lg transition-all duration-200`}>
                          <span className="text-white">
                            {cat.icon}
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-bold text-gray-900 dark:text-white block">
                            {cat.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {cat.id === 'new_feature' ? '建議新的功能或改進' : '回報遇到的問題或錯誤'}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  標題
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="簡短描述你的回報..."
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  required
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  詳細描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="請詳細描述你遇到的問題或想要的新功能..."
                  rows={4}
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-all duration-200"
                  required
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t-2 border-orange-200 dark:border-purple-500 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-gray-700 dark:to-gray-800">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!category || !title || !description || isSubmitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    提交回報
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportDialog; 