/**
 * RecordHistory - 學習記錄歷史組件
 * 
 * 🎯 功能說明：
 * - 顯示任務的歷史學習記錄
 * - 支援展開/收起功能
 * - 按時間排序顯示
 * - 可獨立使用或嵌入其他組件
 * 
 * 🎨 設計特色：
 * - 美觀的卡片設計
 * - 友善的日期格式化
 * - 星星評分顯示
 * - 標籤展示
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, FileText, ChevronDown, ChevronUp, Star } from 'lucide-react';

// 任務記錄接口
interface TaskRecord {
  id: string;
  created_at: string;
  title: string;
  message: string;
  difficulty: number;
  completion_time?: number;
  files?: any[];
  tags?: string[];
}

interface RecordHistoryProps {
  records: TaskRecord[];
  className?: string;
  initiallyExpanded?: boolean;
  maxInitialItems?: number;
  onRecordClick?: (record: TaskRecord) => void;
}

export const RecordHistory: React.FC<RecordHistoryProps> = ({
  records,
  className = '',
  initiallyExpanded = false,
  maxInitialItems = 3,
  onRecordClick
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '今天';
    if (diffDays === 2) return '昨天';
    if (diffDays <= 7) return `${diffDays - 1} 天前`;
    
    return date.toLocaleDateString('zh-TW', {
      month: 'long',
      day: 'numeric'
    });
  };

  // 渲染星星評分
  const renderStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < difficulty ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}
      />
    ));
  };

  if (records.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <FileText size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="text-base font-medium mb-1">還沒有學習記錄</p>
        <p className="text-sm">完成第一個記錄吧！</p>
      </div>
    );
  }

  const displayedRecords = isExpanded ? records : records.slice(0, maxInitialItems);
  const hasMoreRecords = records.length > maxInitialItems;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-gray-800">📚 學習歷程</div>
        {hasMoreRecords && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? '收起' : `看看之前的記錄`} ({records.length})
          </button>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {displayedRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200/50 rounded-lg hover:shadow-sm transition-all ${
                onRecordClick ? 'cursor-pointer hover:bg-blue-50/70' : ''
              }`}
              onClick={() => onRecordClick?.(record)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">
                    {formatDate(record.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(record.difficulty)}
                </div>
              </div>
              
              <div className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                {record.message}
              </div>
              
              {record.tags && record.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {record.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {record.tags.length > 2 && (
                    <span className="text-xs text-gray-500">+{record.tags.length - 2}</span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isExpanded && hasMoreRecords && (
        <div className="text-center">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            還有 {records.length - maxInitialItems} 則記錄...
          </button>
        </div>
      )}
    </div>
  );
}; 