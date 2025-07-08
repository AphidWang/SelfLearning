/**
 * TaskCardFactory - 任務卡片工廠
 * 
 * 🎯 功能說明：
 * - 根據任務類型選擇對應的卡片組件
 * - 統一的卡片介面和屬性傳遞
 * - 支援特化模式（如週挑戰）
 * 
 * 🏗️ 架構設計：
 * - 工廠模式：根據 task_type 選擇對應的卡片
 * - 統一的 props 傳遞和任務操作處理
 * - 支援 highlight 特化模式
 */

import React from 'react';
import { SingleTaskCard } from './SingleTaskCard';
import { CountTaskCard } from './CountTaskCard';
import { StreakTaskCard } from './StreakTaskCard';
import { AccumulativeTaskCard } from './AccumulativeTaskCard';
import type { TaskWithContext, TaskStatus } from '../../../../types/goal';
import { useTopicStore } from '../../../../store/topicStore';
import toast from 'react-hot-toast';

export interface TaskCardFactoryProps {
  task: TaskWithContext;
  onStatusUpdate?: (newStatus: TaskStatus) => void;
  onOpenRecord?: (task: TaskWithContext) => void;
  onOpenHistory?: (task: TaskWithContext) => void;
  onRecordSuccess?: () => void;
  currentUserId?: string;
  highlight?: boolean; // 特化模式標記
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 任務卡片工廠組件
 */
export const TaskCardFactory: React.FC<TaskCardFactoryProps> = (props) => {
  const { task, ...otherProps } = props;
  
  const { 
    checkInTask, 
    addTaskCount, 
    addTaskAmount, 
    resetTaskProgress 
  } = useTopicStore();

  /**
   * 統一的任務操作處理
   */
  const handleTaskAction = async (
    taskId: string, 
    action: 'check_in' | 'add_count' | 'add_amount' | 'reset', 
    params?: any
  ) => {
    try {
      let result;
      
      switch (action) {
        case 'check_in':
          result = await checkInTask(taskId);
          break;
        case 'add_count':
          result = await addTaskCount(taskId, params?.count || 1);
          break;
        case 'add_amount':
          result = await addTaskAmount(taskId, params?.amount || 0, params?.unit);
          break;
        case 'reset':
          result = await resetTaskProgress(taskId);
          break;
        default:
          throw new Error(`未知的操作類型: ${action}`);
      }

      if (result.success) {
        toast.success(getSuccessMessage(action));
        
        // 檢查是否為週挑戰任務的打卡操作
        // 週挑戰任務會在卡片內部自行處理狀態更新，不需要觸發全域刷新
        const isWeeklyChallenge = task.special_flags?.includes('weekly_quick_challenge');
        const isCheckInAction = action === 'check_in';
        
        if (!(isWeeklyChallenge && isCheckInAction)) {
          // 非週挑戰打卡操作才觸發全域刷新
          otherProps.onRecordSuccess?.();
        }
      } else {
        toast.error(result.message || '操作失敗');
      }
    } catch (error) {
      console.error('任務操作失敗:', error);
      toast.error('操作失敗');
    }
  };

  /**
   * 獲取成功訊息
   */
  const getSuccessMessage = (action: string) => {
    switch (action) {
      case 'check_in':
        return '打卡成功！';
      case 'add_count':
        return '計數已增加！';
      case 'add_amount':
        return '累計已更新！';
      case 'reset':
        return '進度已重置！';
      default:
        return '操作成功！';
    }
  };

  /**
   * 根據任務類型選擇對應的卡片組件
   */
  const renderTaskCard = () => {
    const commonProps = {
      task,
      onTaskAction: handleTaskAction,
      onStatusUpdate: otherProps.onStatusUpdate || (() => {}),
      onOpenRecord: otherProps.onOpenRecord,
      onOpenHistory: otherProps.onOpenHistory,
      onRecordSuccess: otherProps.onRecordSuccess,
      currentUserId: otherProps.currentUserId,
      highlight: otherProps.highlight,
      className: otherProps.className,
      style: otherProps.style,
    };

    switch (task.task_type) {
      case 'single':
        return <SingleTaskCard {...commonProps} />;
        
      case 'count':
        return <CountTaskCard {...commonProps} />;
        
      case 'streak':
        return <StreakTaskCard {...commonProps} />;
        
      case 'accumulative':
        return <AccumulativeTaskCard {...commonProps} />;
        
      default:
        // 預設使用單次任務卡片
        console.warn(`未知的任務類型: ${task.task_type}，使用預設的單次任務卡片`);
        return <SingleTaskCard {...commonProps} />;
    }
  };

  return renderTaskCard();
};

 