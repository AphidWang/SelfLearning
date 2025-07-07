/**
 * SingleTaskCard - 單次任務卡片
 * 
 * 🎯 功能說明：
 * - 繼承 BaseTaskCard 的基礎功能
 * - 專門處理單次任務（task_type: 'single'）
 * - 簡潔的進度顯示：待開始/進行中/已完成
 * 
 * 🎨 視覺設計：
 * - 經典的便條紙風格
 * - 狀態圖示：時鐘/播放/勾選
 * - 簡潔的進度條或狀態標籤
 */

import React, { useRef } from 'react';
import { Clock, Play, CheckCircle2, Target, BookOpen, User as UserIcon, Link } from 'lucide-react';
import { BaseTaskCard, BaseTaskCardProps, useBaseTaskCard } from './BaseTaskCard';

interface SingleTaskCardProps extends BaseTaskCardProps {}

export const SingleTaskCard: React.FC<SingleTaskCardProps> = (props) => {
  const { task, currentUserId, onOpenRecord, onOpenHistory } = props;
  const { renderTopicTag, renderOwnerTag, renderBottomInfo, renderActionButtons } = useBaseTaskCard(task);
  const referenceButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * 獲取狀態圖示
   */
  const getStatusIcon = () => {
    switch (task.status) {
      case 'todo':
        return Clock;
      case 'in_progress':
        return Play;
      case 'done':
        return CheckCircle2;
      default:
        return Clock;
    }
  };

  const StatusIcon = getStatusIcon();

  /**
   * 渲染正面內容 - 三分佈局
   */
  const renderFrontContent = (showReferenceInfo: (e: React.MouseEvent, buttonRef?: React.RefObject<HTMLButtonElement>) => void) => (
    <div className="p-4 h-full flex flex-col">
      {/* 第一部分：主題標籤 */}
      <div className="flex-shrink-0">
        {renderTopicTag()}
      </div>

      {/* 第二部分：任務標題和描述 + 按鈕 */}
      <div className="flex-1 flex flex-col">
        {/* 標題和描述區域 */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-2">
            <h3 
              className="text-lg font-bold text-gray-800 leading-tight line-clamp-2"
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
            >
              {task.title}
            </h3>
          </div>
          
          {/* 任務描述（如果有） */}
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-2">
              {task.description}
            </p>
          )}
        </div>

        {/* 底部區域：Owner 標籤 + 按鈕 */}
        <div className="flex items-end justify-between">
          {/* Owner 標籤 */}
          <div className="flex-1">
            {renderOwnerTag(currentUserId)}
          </div>

          {/* 按鈕區域 */}
          <div className="flex-shrink-0">
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
              {((task.reference_info?.attachments || []).length + (task.reference_info?.links || []).length) > 0 && (
                <button 
                  ref={referenceButtonRef}
                  data-reference-button
                  onClick={(e) => {
                    e.stopPropagation();
                    showReferenceInfo(e, referenceButtonRef);
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all hover:scale-110 hover:shadow-md active:scale-95"
                  style={{
                    backgroundColor: task.subjectStyle.accent + 'AA',
                    color: 'white'
                  }}
                  title={`${(task.reference_info?.attachments || []).length + (task.reference_info?.links || []).length} 個參考資料`}
                >
                  <Link className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 第三部分：目標資訊 */}
      <div className="flex-shrink-0">
        {renderBottomInfo()}
      </div>
    </div>
  );

  /**
   * 渲染狀態指示器
   */
  const renderStatusIndicator = () => {
    if (task.status === 'in_progress') {
      return (
        <div className="absolute top-2 right-2 text-lg transform hover:scale-125 transition-transform">
          🦕
        </div>
      );
    }
    return null;
  };

  return (
    <BaseTaskCard
      {...props}
      renderContent={(showReferenceInfo) => ({
        frontContent: renderFrontContent(showReferenceInfo),
        backContent: null, // 使用默認背面內容
        statusIndicator: renderStatusIndicator(),
        actionButtons: null // 使用默認操作按鈕
      })}
    />
  );
}; 