/**
 * BaseTaskCard - 基礎任務卡片類
 * 
 * 🎯 功能說明：
 * - 提供所有任務卡片的共享邏輯和介面
 * - 統一的翻轉動畫、狀態管理、樣式
 * - 可被不同任務類型繼承和擴展
 * 
 * 🏗️ 架構設計：
 * - 定義統一的卡片介面和基礎邏輯
 * - 提供可覆寫的方法來處理不同任務類型
 * - 統一的動畫和互動行為
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  Clock, Target, CheckCircle2, Play, Edit, BookOpen, 
  Pause, User as UserIcon, Link, FileText, Image, 
  Video, Download, ExternalLink 
} from 'lucide-react';
import type { Task, TaskStatus } from '../../../../types/goal';

/**
 * 擴展的任務介面，包含主題和目標資訊
 */
export interface TaskWithContext extends Task {
  topicId: string;
  topicTitle: string;
  topicSubject: string;
  goalId: string;
  goalTitle: string;
  subjectStyle: any;
  records: {
    id: string;
    created_at: string;
    title: string;
    message: string;
    difficulty: number;
    completion_time?: number;
    files?: any[];
    tags?: string[];
  }[];
}

/**
 * 基礎卡片 Props
 */
export interface BaseTaskCardProps {
  task: TaskWithContext;
  onStatusUpdate: (newStatus: TaskStatus) => void;
  onOpenRecord?: (task: TaskWithContext) => void;
  onOpenHistory?: (task: TaskWithContext) => void;
  onRecordSuccess?: () => void;
  currentUserId?: string;
  highlight?: boolean; // 是否高亮顯示（特化用）
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 卡片渲染內容介面
 */
export interface CardContent {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  statusIndicator?: React.ReactNode;
  actionButtons?: React.ReactNode;
}

/**
 * 基礎任務卡片組件
 */
export const BaseTaskCard: React.FC<BaseTaskCardProps & {
  renderContent: () => CardContent;
  cardClassName?: string;
  frontClassName?: string;
  backClassName?: string;
}> = ({ 
  task, 
  onStatusUpdate, 
  onOpenRecord, 
  onOpenHistory, 
  onRecordSuccess,
  currentUserId,
  highlight = false,
  className = '',
  style = {},
  renderContent,
  cardClassName = '',
  frontClassName = '',
  backClassName = ''
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showReferenceInfo, setShowReferenceInfo] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [arrowPosition, setArrowPosition] = useState({ side: 'left', offset: 24 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 檢查是否需要顯示 owner tag
  const shouldShowOwnerTag = task.owner && currentUserId && task.owner.id !== currentUserId;

  // 參考資訊相關
  const attachments = task.reference_info?.attachments || [];
  const links = task.reference_info?.links || [];
  const totalReferenceItems = attachments.length + links.length;

  // 點擊外部關閉彈窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showReferenceInfo && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        const popupElement = document.querySelector('[data-popup="reference-info"]');
        if (popupElement && !popupElement.contains(event.target as Node)) {
          setShowReferenceInfo(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReferenceInfo]);

  /**
   * 獲取優先權顏色和圖示
   */
  const getPriorityDisplay = (priority: string = 'medium') => {
    switch (priority) {
      case 'high':
        return { color: '#EF4444', icon: '🔥', text: '重要' };
      case 'medium':
        return { color: '#F59E0B', icon: '⭐', text: '一般' };
      case 'low':
        return { color: '#10B981', icon: '🌱', text: '次要' };
      default:
        return { color: '#6B7280', icon: '📝', text: '一般' };
    }
  };

  /**
   * 獲取狀態顯示
   */
  const getStatusDisplay = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return { icon: Clock, color: '#6B7280', text: '待開始' };
      case 'in_progress':
        return { icon: Play, color: '#8B5CF6', text: '進行中' };
      case 'done':
        return { icon: CheckCircle2, color: '#10B981', text: '已完成' };
      default:
        return { icon: Clock, color: '#6B7280', text: '待開始' };
    }
  };

  /**
   * 獲取附件類型對應的圖標
   */
  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'pdf':
      case 'document':
        return FileText;
      default:
        return FileText;
    }
  };

  /**
   * 獲取連結類型對應的圖標
   */
  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'youtube':
        return Video;
      case 'github':
        return Link;
      default:
        return Link;
    }
  };

  /**
   * 處理參考資訊項目點擊
   */
  const handleReferenceItemClick = (url: string, type: string) => {
    if (type === 'image' || type === 'video' || type === 'pdf') {
      window.open(url, '_blank');
    } else if (type === 'document' || type === 'audio' || type === 'other') {
      window.open(url, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  /**
   * 處理完成任務，檢查是否需要記錄
   */
  const handleCompleteTask = () => {
    onStatusUpdate('done');
  };

  /**
   * 處理參考資訊彈窗的顯示位置
   */
  const handleShowReferenceInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 256; // 彈窗寬度
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 計算水平位置 - 優先顯示在按鈕右側，如果空間不夠則顯示在左側
      let x = rect.right + 8;
      let arrowSide = 'left';
      if (x + popupWidth > viewportWidth) {
        x = rect.left - popupWidth - 8;
        arrowSide = 'right';
      }
      
      // 計算垂直位置 - 優先顯示在按鈕下方，如果空間不夠則顯示在上方
      let y = rect.bottom + 8;
      const estimatedPopupHeight = 200; // 估算彈窗高度
      if (y + estimatedPopupHeight > viewportHeight) {
        y = rect.top - estimatedPopupHeight - 8;
      }
      
      // 計算箭頭位置
      const buttonCenter = rect.top + rect.height / 2;
      const arrowOffset = Math.max(16, Math.min(buttonCenter - y, popupWidth - 32));
      
      setPopupPosition({ x, y });
      setArrowPosition({ side: arrowSide, offset: arrowOffset });
    }
    
    setShowReferenceInfo(!showReferenceInfo);
  };

  /**
   * 卡片翻轉動畫變體
   */
  const cardVariants = {
    front: {
      rotateY: 0
    },
    back: {
      rotateY: 180
    }
  };



  /**
   * 渲染參考資訊彈窗
   */
  const renderReferenceInfoPopup = () => {
    if (!showReferenceInfo) return null;

    return createPortal(
      <AnimatePresence>
        <motion.div
          className="fixed z-[99999] w-64 rounded-2xl shadow-2xl border-0 p-4"
          data-popup="reference-info"
          style={{
            left: popupPosition.x,
            top: popupPosition.y,
            background: '#f0f4ff',
            boxShadow: `
              0 20px 40px rgba(0,0,0,0.15),
              0 8px 16px ${task.subjectStyle.accent}25,
              0 0 0 1px ${task.subjectStyle.accent}20,
              inset 0 1px 0 rgba(255,255,255,0.9)
            `
          }}
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 箭頭指向按鈕 */}
          <div 
            className={`absolute w-4 h-4 rotate-45 ${
              arrowPosition.side === 'left' ? '-left-2' : '-right-2'
            }`}
            style={{
              top: `${arrowPosition.offset}px`,
              background: '#f0f4ff',
              border: `1px solid ${task.subjectStyle.accent}20`,
              borderRight: arrowPosition.side === 'left' ? 'none' : `1px solid ${task.subjectStyle.accent}20`,
              borderBottom: arrowPosition.side === 'left' ? 'none' : `1px solid ${task.subjectStyle.accent}20`,
              borderLeft: arrowPosition.side === 'right' ? 'none' : `1px solid ${task.subjectStyle.accent}20`,
              borderTop: arrowPosition.side === 'right' ? 'none' : `1px solid ${task.subjectStyle.accent}20`
            }}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h5 
                className="text-sm font-bold flex items-center gap-2"
                style={{ color: task.subjectStyle.accent }}
              >
                <Link className="w-4 h-4" />
                參考資料
              </h5>
              <button
                onClick={() => setShowReferenceInfo(false)}
                className="p-1.5 rounded-full transition-all hover:scale-110"
                style={{ 
                  backgroundColor: task.subjectStyle.accent + '15',
                  color: task.subjectStyle.accent 
                }}
              >
                <span className="text-xs font-bold">✕</span>
              </button>
            </div>
            
            {/* 附件列表 */}
            {attachments.map((attachment) => {
              const Icon = getAttachmentIcon(attachment.type);
              return (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    background: '#ffffff',
                    border: `1px solid #e2e8f0`
                  }}
                  onClick={() => handleReferenceItemClick(attachment.url, attachment.type)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#4f46e5' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {attachment.title}
                    </div>
                    {(attachment.size || 0) > 0 && (
                      <div className="text-xs text-gray-600">
                        {((attachment.size || 0) / 1024 / 1024).toFixed(1)} MB
                      </div>
                    )}
                  </div>
                  {attachment.type === 'image' || attachment.type === 'video' || attachment.type === 'pdf' ? (
                    <ExternalLink className="w-3 h-3" style={{ color: '#4f46e5' }} />
                  ) : (
                    <Download className="w-3 h-3" style={{ color: '#4f46e5' }} />
                  )}
                </div>
              );
            })}

            {/* 連結列表 */}
            {links.map((link) => {
              const Icon = getLinkIcon(link.type);
              return (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    background: '#ffffff',
                    border: `1px solid #e2e8f0`
                  }}
                  onClick={() => handleReferenceItemClick(link.url, link.type)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#0ea5e9' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {link.title}
                    </div>
                    {link.description && (
                      <div className="text-xs text-gray-600 truncate">
                        {link.description}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-3 h-3" style={{ color: '#0ea5e9' }} />
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  };

  /**
   * 渲染基礎背面按鈕
   */
  const renderBaseBackButtons = () => (
    <div className="space-y-3">
      {/* 狀態操作按鈕 */}
      {task.status !== 'done' && (
        <div className="flex gap-2 w-full">
          {task.status === 'todo' ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReferenceInfo(false);
                  onStatusUpdate('in_progress');
                }}
                className="flex-1 py-2 px-3 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-1"
              >
                <Play className="w-3 h-3" />
                開始
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReferenceInfo(false);
                  handleCompleteTask();
                }}
                className="flex-1 py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                完成
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReferenceInfo(false);
                  onStatusUpdate('todo');
                }}
                className="flex-1 py-2 px-3 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
              >
                <Pause className="w-3 h-3" />
                暫停
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReferenceInfo(false);
                  handleCompleteTask();
                }}
                className="flex-1 py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                完成
              </button>
            </>
          )}
        </div>
      )}

      {/* 學習記錄按鈕 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowReferenceInfo(false);
          onOpenRecord?.(task);
        }}
        className="w-full py-2 px-3 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
      >
        <Edit className="w-4 h-4" />
        📝 留下記錄
      </button>
    </div>
  );

  const content = renderContent();

  return (
    <div className={`relative w-full max-w-sm mx-auto h-48 ${className}`} style={{ perspective: '1000px', ...style }}>
      {/* 卡片容器 */}
      <motion.div
        className={`relative w-full h-full cursor-pointer ${cardClassName}`}
        onClick={() => {
          setIsFlipped(!isFlipped);
          setShowReferenceInfo(false);
        }}
        animate={isFlipped ? "back" : "front"}
        variants={cardVariants}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* 正面 */}
        <motion.div
          className={`absolute inset-0 w-full h-full rounded-2xl shadow-lg border-0 ${frontClassName}`}
          style={{
            backgroundColor: highlight ? '#FFF4E6' : '#FFFEF7',
            backgroundImage: `
              linear-gradient(135deg, ${task.subjectStyle.accent}${highlight ? '30' : '20'} 0%, ${task.subjectStyle.accent}${highlight ? '40' : '30'} 100%),
              url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f5f0e8' fill-opacity='0.5'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3C/g%3E%3C/svg%3E")
            `,
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.1),
              0 2px 8px ${task.subjectStyle.accent}20,
              inset 0 1px 0 rgba(255,255,255,0.8)
              ${highlight ? `, 0 0 0 2px ${task.subjectStyle.accent}40` : ''}
            `,
            backfaceVisibility: 'hidden'
          }}
        >
          {content.frontContent}
          {content.statusIndicator}
        </motion.div>

        {/* 背面 */}
        <motion.div
          className={`absolute inset-0 w-full h-full rounded-2xl shadow-lg border-0 ${backClassName}`}
          style={{
            backgroundColor: highlight ? '#FFF4E6' : '#FFF9F0',
            backgroundImage: `linear-gradient(135deg, ${task.subjectStyle.accent}${highlight ? '35' : '25'} 0%, ${task.subjectStyle.accent}${highlight ? '50' : '40'} 100%)`,
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.1),
              0 2px 8px ${task.subjectStyle.accent}20,
              inset 0 1px 0 rgba(255,255,255,0.8)
              ${highlight ? `, 0 0 0 2px ${task.subjectStyle.accent}40` : ''}
            `,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="p-4 h-full flex flex-col items-center justify-center gap-4">
            {content.backContent || (
              <>
                {/* 背面標題 */}
                <div className="text-center">
                  <h4 className="text-sm font-bold text-gray-800 mb-1">
                    {task.title}
                  </h4>
                </div>
                {renderBaseBackButtons()}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* 參考資訊彈窗 */}
      {renderReferenceInfoPopup()}
    </div>
  );
};

/**
 * 創建基礎卡片的 Hook
 */
export const useBaseTaskCard = (task: TaskWithContext) => {
  const shouldShowOwnerTag = (currentUserId?: string) => 
    task.owner && currentUserId && task.owner.id !== currentUserId;

  const renderTopicTag = () => (
    <div className="mb-3">
      <div 
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: task.subjectStyle.accent + '25',
          color: task.subjectStyle.accent
        }}
      >
        <BookOpen className="w-3 h-3" />
        {task.topicTitle}
      </div>
    </div>
  );

  const renderOwnerTag = (currentUserId?: string) => {
    if (!shouldShowOwnerTag(currentUserId)) return null;
    
    return (
      <div 
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 mb-1 self-start"
        style={{ 
          backgroundColor: task.owner!.color + '20',
          color: task.owner!.color,
          border: `1px solid ${task.owner!.color}40`
        }}
      >
        <UserIcon className="w-3 h-3" />
        {task.owner!.name}
      </div>
    );
  };

  const renderBottomInfo = () => (
    <div className="mt-auto pt-2 border-t border-gray-200/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Target className="w-3 h-3" />
          <span className="truncate">{task.goalTitle}</span>
        </div>
      </div>
    </div>
  );

  const renderActionButtons = (onOpenRecord?: (task: TaskWithContext) => void, onOpenHistory?: (task: TaskWithContext) => void) => {
    const attachments = task.reference_info?.attachments || [];
    const links = task.reference_info?.links || [];
    const totalReferenceItems = attachments.length + links.length;

    return (
      <div className="flex gap-2">
        {/* 學習記錄數量 */}
        {(task.records?.length || 0) > 0 && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onOpenHistory?.(task);
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all hover:scale-110 hover:shadow-md"
            style={{
              backgroundColor: task.subjectStyle.accent + 'CC',
              color: 'white'
            }}
            title={`${task.records?.length} 則學習記錄`}
          >
            +{task.records?.length}
          </button>
        )}
        
        {/* 參考資訊按鈕 */}
        {totalReferenceItems > 0 && (
          <div className="relative">
            <button 
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all hover:scale-110 hover:shadow-md"
              style={{
                backgroundColor: task.subjectStyle.accent + 'AA',
                color: 'white'
              }}
              title={`${totalReferenceItems} 個參考資料`}
            >
              <Link className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return {
    shouldShowOwnerTag,
    renderTopicTag,
    renderOwnerTag,
    renderBottomInfo,
    renderActionButtons
  };
}; 