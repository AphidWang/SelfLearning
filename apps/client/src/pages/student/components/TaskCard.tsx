/**
 * TaskCard - 任務卡片組件
 * 
 * 🎯 功能說明：
 * - 便條紙風格的任務卡片設計
 * - 支援卡片翻轉動畫，背面顯示操作按鈕
 * - 顯示任務資訊：標題、學科、目標、狀態
 * - 溫暖色調和手作感設計
 * 
 * 🏗️ 架構設計：
 * - 正面：任務基本資訊展示
 * - 背面：操作按鈕（記錄、完成等）
 * - 使用 Framer Motion 實現流暢翻轉動畫
 * - 響應式設計，適配不同螢幕
 * 
 * 🎨 視覺設計：
 * - 便條紙造型：圓角、無粗邊框、輕微陰影
 * - 學科色彩：頂部小標籤顯示學科和顏色
 * - 狀態圖示：右上角顯示任務狀態
 * - 手寫風字體：親切溫馨的視覺效果
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Clock, Target, CheckCircle2, Play, Edit, BookOpen, Activity, Pause, User as UserIcon, Timer, Link, FileText, Image, Video, Download, ExternalLink } from 'lucide-react';
import type { Task, TaskStatus } from '../../../types/goal';

/**
 * 擴展的任務介面，包含主題和目標資訊
 */
interface TaskWithContext extends Task {
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

interface TaskCardProps {
  task: TaskWithContext;
  onStatusUpdate: (newStatus: TaskStatus) => void;
  onOpenRecord?: (task: TaskWithContext) => void;
  onOpenHistory?: (task: TaskWithContext) => void;
  onRecordSuccess?: () => void;
  currentUserId?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusUpdate, onOpenRecord, onOpenHistory, onRecordSuccess, currentUserId }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showReferenceInfo, setShowReferenceInfo] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const priorityDisplay = getPriorityDisplay(task.priority);
  const statusDisplay = getStatusDisplay(task.status);
  const StatusIcon = statusDisplay.icon;
  
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
        // 檢查是否點擊在彈窗內
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
    // 根據類型決定行為
    if (type === 'image' || type === 'video' || type === 'pdf') {
      // 在新分頁中預覽
      window.open(url, '_blank');
    } else if (type === 'document' || type === 'audio' || type === 'other') {
      // 下載
      window.open(url, '_blank');
    } else {
      // 連結類型，在新分頁中開啟
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
      setPopupPosition({
        x: rect.right - 256, // 彈窗寬度是 256px (w-64)
        y: rect.bottom + 8
      });
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

  return (
    <div className="relative w-full max-w-xs mx-auto h-48" style={{ perspective: '1000px', zIndex: showReferenceInfo ? 9999 : 1 }}>
      {/* 卡片容器 */}
      <motion.div
        className="relative w-full h-full cursor-pointer"
        onClick={() => {
          setIsFlipped(!isFlipped);
          setShowReferenceInfo(false); // 翻轉時關閉參考資訊彈窗
        }}
        animate={isFlipped ? "back" : "front"}
        variants={cardVariants}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* 正面 */}
        <motion.div
          className="absolute inset-0 w-full h-full rounded-2xl shadow-lg border-0"
          style={{
            backgroundColor: '#FFFEF7',
            backgroundImage: `
              linear-gradient(135deg, ${task.subjectStyle.accent}20 0%, ${task.subjectStyle.accent}30 100%),
              url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f5f0e8' fill-opacity='0.5'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3C/g%3E%3C/svg%3E")
            `,
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.1),
              0 2px 8px ${task.subjectStyle.accent}20,
              inset 0 1px 0 rgba(255,255,255,0.8)
            `,
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="p-4 h-full flex flex-col">
            {/* 頂部：主題標籤 */}
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

            {/* 中間：任務標題 */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-2">
                <h3 
                  className="text-lg font-bold text-gray-800 leading-tight line-clamp-2 flex-1"
                  style={{ fontFamily: 'system-ui, -apple-system, \"Segoe UI\", Roboto, sans-serif' }}
                >
                  {task.title}
                </h3>
              </div>
              {/* 任務描述（如果有） */}
              {task.description && (
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}
              <div style={{ marginTop: 'auto' }}>
                {shouldShowOwnerTag && (
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
                )}
              </div>
            </div>

            {/* 操作按鈕區域 */}
            <div className="flex justify-end gap-2 mb-2">
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
                    ref={buttonRef}
                    onClick={handleShowReferenceInfo}
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

                        {/* 參考資訊彈窗 - 使用 Portal 渲染到 body */}
            {showReferenceInfo && createPortal(
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
                    className="absolute -top-2 right-6 w-4 h-4 rotate-45"
                    style={{
                      background: '#f0f4ff',
                      border: `1px solid ${task.subjectStyle.accent}20`,
                      borderRight: 'none',
                      borderBottom: 'none'
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
            )}

            {/* 底部：目標資訊 */}
            <div className="mt-auto pt-2 border-t border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Target className="w-3 h-3" />
                  <span className="truncate">{task.goalTitle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 狀態指示器 */}
          {task.status === 'in_progress' && (
            <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
              🦕
            </div>
          )}
        </motion.div>

        {/* 背面 */}
        <motion.div
          className="absolute inset-0 w-full h-full rounded-2xl shadow-lg border-0"
          style={{
            backgroundColor: '#FFF9F0',
            backgroundImage: `linear-gradient(135deg, ${task.subjectStyle.accent}25 0%, ${task.subjectStyle.accent}40 100%)`,
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.1),
              0 2px 8px ${task.subjectStyle.accent}20,
              inset 0 1px 0 rgba(255,255,255,0.8)
            `,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="p-4 h-full flex flex-col items-center justify-center gap-4">
            {/* 背面標題 */}
            <div className="text-center">
              <h4 className="text-sm font-bold text-gray-800 mb-1">
                {task.title}
              </h4>
            </div>

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
        </motion.div>
      </motion.div>
    </div>
  );
}; 