import React, { useMemo, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGoalStore } from '../../store/goalStore';
import { subjectColors } from '../../styles/tokens';
import { 
  Target, CheckCircle2, Clock, Play, Flag, Sparkles, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';

interface GoalRadialMapProps {
  goalId: string;
  width?: number;
  height?: number;
  showAnimations?: boolean;
  selectedStepId?: string | null;
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string, stepId: string) => void;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

// 檢查日期是否在本週
const isThisWeek = (date: string | undefined): boolean => {
  if (!date) return false;
  
  const completedDate = new Date(date);
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return completedDate >= oneWeekAgo && completedDate <= now;
};

// 計算放射狀位置
const getRadialPosition = (index: number, total: number, radius: number, centerX: number, centerY: number) => {
  const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // 從頂部開始
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  return { x, y, angle };
};

// 計算任務在步驟周圍的位置
const getTaskPosition = (taskIndex: number, totalTasks: number, stepX: number, stepY: number, taskRadius: number) => {
  const angle = (taskIndex * 2 * Math.PI) / totalTasks;
  const x = stepX + taskRadius * Math.cos(angle);
  const y = stepY + taskRadius * Math.sin(angle);
  return { x, y };
};

export const GoalRadialMap: React.FC<GoalRadialMapProps> = ({
  goalId,
  width = 1000,
  height = 700,
  showAnimations = true,
  selectedStepId = null,
  selectedTaskId = null,
  onTaskClick,
  onStepClick,
  className = ""
}) => {
  const { getGoal, getActiveSteps, getCompletionRate } = useGoalStore();
  const goal = getGoal(goalId);
  
  // 縮放和拖拽狀態
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  if (!goal) {
    return null;
  }

  const subjectColor = subjectColors[goal.subject || '未分類'];
  const progress = getCompletionRate(goal.id);
  const steps = getActiveSteps(goal.id);
  
  // 計算週進度統計
  const weeklyStats = useMemo(() => {
    let newlyCompleted = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    
    steps.forEach(step => {
      step.tasks.forEach(task => {
        totalTasks++;
        if (task.status === 'done') {
          completedTasks++;
          if (isThisWeek(task.completedAt)) {
            newlyCompleted++;
          }
        } else if (task.status === 'in_progress') {
          inProgressTasks++;
        }
      });
    });
    
    return { newlyCompleted, totalTasks, completedTasks, inProgressTasks };
  }, [steps]);

  // 縮放和拖拽處理函數
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // 只處理左鍵
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      setTranslateX(prev => prev + deltaX);
      setTranslateY(prev => prev + deltaY);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, [isDragging, lastMousePos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
  }, []);

  const centerX = width / 2;
  const centerY = height / 2;
  const stepRadius = Math.min(width, height) * 0.46; // 減少半徑避免重疊
  const taskRadius = Math.min(100, stepRadius * 0.9); // 增加任務距離避免重疊

  return (
    <div className={`relative ${className} flex items-center justify-center overflow-hidden`}>
      {/* 縮放比例指示器 */}
      <div className="absolute top-4 left-4 bg-white/90 rounded-lg px-3 py-1 shadow-md z-10">
        <span className="text-xs text-gray-600">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* 控制按鈕 */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <motion.button
          onClick={handleZoomIn}
          className="w-8 h-8 bg-white/90 hover:bg-white rounded-lg shadow-md flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ZoomIn className="w-4 h-4 text-gray-700" />
        </motion.button>
        <motion.button
          onClick={handleZoomOut}
          className="w-8 h-8 bg-white/90 hover:bg-white rounded-lg shadow-md flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ZoomOut className="w-4 h-4 text-gray-700" />
        </motion.button>
        <motion.button
          onClick={handleReset}
          className="w-8 h-8 bg-white/90 hover:bg-white rounded-lg shadow-md flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="w-4 h-4 text-gray-700" />
        </motion.button>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* 定義漸變和陰影 */}
        <defs>
          <radialGradient id={`centerGradient-${goalId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={subjectColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={subjectColor} stopOpacity="0.05" />
          </radialGradient>
          <filter id={`glow-${goalId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 主要內容組，應用縮放和平移變換 */}
        <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
          {/* 背景放射線 */}
          {steps.map((_, index) => {
          const { x, y } = getRadialPosition(index, steps.length, stepRadius, centerX, centerY);
          return (
            <motion.line
              key={`bg-line-${index}`}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke={subjectColor}
              strokeWidth="3"
              strokeOpacity="0.15"
              initial={showAnimations ? { pathLength: 0 } : undefined}
              animate={showAnimations ? { pathLength: 1 } : undefined}
              transition={showAnimations ? { delay: index * 0.1, duration: 0.8 } : undefined}
            />
          );
        })}

        {/* 步驟和任務的連接線 */}
        {steps.map((step, stepIndex) => {
          const stepPos = getRadialPosition(stepIndex, steps.length, stepRadius, centerX, centerY);
          
          return (
            <g key={`step-connections-${step.id}`}>
              {/* 中心到步驟的主線 */}
              <motion.line
                x1={centerX}
                y1={centerY}
                x2={stepPos.x}
                y2={stepPos.y}
                stroke={subjectColor}
                strokeWidth="4"
                initial={showAnimations ? { pathLength: 0 } : undefined}
                animate={showAnimations ? { pathLength: 1 } : undefined}
                transition={showAnimations ? { delay: 0.5 + stepIndex * 0.1, duration: 0.6 } : undefined}
              />
              
              {/* 步驟到任務的連接線 */}
              {step.tasks.map((task, taskIndex) => {
                const taskPos = getTaskPosition(taskIndex, step.tasks.length, stepPos.x, stepPos.y, taskRadius);
                const isNewlyCompleted = task.status === 'done' && isThisWeek(task.completedAt);
                
                return (
                  <motion.line
                    key={`task-line-${task.id}`}
                    x1={stepPos.x}
                    y1={stepPos.y}
                    x2={taskPos.x}
                    y2={taskPos.y}
                    stroke={
                      isNewlyCompleted ? '#10b981' :
                      task.status === 'done' ? '#6b7280' :
                      task.status === 'in_progress' ? '#3b82f6' :
                      '#d1d5db'
                    }
                    strokeWidth="3"
                    initial={showAnimations ? { pathLength: 0 } : undefined}
                    animate={showAnimations ? { pathLength: 1 } : undefined}
                    transition={showAnimations ? { delay: 1 + stepIndex * 0.1 + taskIndex * 0.05, duration: 0.4 } : undefined}
                  />
                );
              })}
            </g>
          );
        })}

        {/* 中央目標節點 */}
        <motion.g
          initial={showAnimations ? { scale: 0, opacity: 0 } : undefined}
          animate={showAnimations ? { scale: 1, opacity: 1 } : undefined}
          transition={showAnimations ? { delay: 0.2, duration: 0.5 } : undefined}
        >
          <circle
            cx={centerX}
            cy={centerY}
            r={Math.min(80, Math.min(width, height) * 0.16)}
            fill={`url(#centerGradient-${goalId})`}
            stroke={subjectColor}
            strokeWidth="5"
            filter={`url(#glow-${goalId})`}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={Math.min(62, Math.min(width, height) * 0.125)}
            fill="white"
            stroke={subjectColor}
            strokeWidth="4"
            opacity="0.95"
          />
          
          {/* 目標圖標 */}
          <foreignObject
            x={centerX - Math.min(50, Math.min(width, height) * 0.1)}
            y={centerY - Math.min(50, Math.min(width, height) * 0.1)}
            width={Math.min(100, Math.min(width, height) * 0.2)}
            height={Math.min(100, Math.min(width, height) * 0.2)}
            className="pointer-events-none"
          >
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
              <Target className="w-8 h-8 mb-2" style={{ color: subjectColor }} />
              <div className="text-base font-bold text-gray-800 leading-tight max-w-[100px] overflow-hidden">
                <div className="truncate">
                  {goal.title}
                </div>
              </div>
            </div>
          </foreignObject>
        </motion.g>

        {/* 步驟節點 */}
        {steps.map((step, stepIndex) => {
          const { x, y } = getRadialPosition(stepIndex, steps.length, stepRadius, centerX, centerY);
          const stepCompletedTasks = step.tasks.filter(t => t.status === 'done').length;
          const stepProgress = step.tasks.length > 0 ? (stepCompletedTasks / step.tasks.length) * 100 : 0;
          const isSelected = selectedStepId === step.id;
          
          return (
            <motion.g
              key={`step-${step.id}`}
              initial={showAnimations ? { scale: 0, opacity: 0 } : undefined}
              animate={showAnimations ? { scale: 1, opacity: 1 } : undefined}
              transition={showAnimations ? { delay: 0.5 + stepIndex * 0.1, duration: 0.4 } : undefined}
              style={{ cursor: onStepClick ? 'pointer' : 'default' }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDragging) {
                  onStepClick?.(step.id);
                }
              }}
            >
              {/* 選中狀態的外圈 */}
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r={Math.min(68, Math.min(width, height) * 0.15)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeDasharray="5,5"
                  opacity="0.8"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={`0 ${x} ${y};360 ${x} ${y}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              
              <circle
                cx={x}
                cy={y}
                r={Math.min(60, Math.min(width, height) * 0.13)}
                fill={stepProgress === 100 ? `${subjectColor}20` : 'white'}
                stroke={isSelected ? '#3b82f6' : (stepProgress === 100 ? subjectColor : `${subjectColor}60`)}
                strokeWidth={isSelected ? "5" : "4"}
              />
              
              <foreignObject
                x={x - Math.min(55, Math.min(width, height) * 0.12)}
                y={y - Math.min(55, Math.min(width, height) * 0.12)}
                width={Math.min(110, Math.min(width, height) * 0.24)}
                height={Math.min(110, Math.min(width, height) * 0.24)}
                className="pointer-events-none"
              >
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-1">
                  {stepProgress === 100 ? (
                    <CheckCircle2 className="w-6 h-6 mb-2" style={{ color: subjectColor }} />
                  ) : (
                    <Flag className="w-6 h-6 mb-2" style={{ color: subjectColor }} />
                  )}
                  <div className="text-sm font-medium text-gray-800 leading-tight max-w-[90px] overflow-hidden">
                    <div className="truncate">
                      {step.title}
                    </div>
                  </div>
                </div>
              </foreignObject>
            </motion.g>
          );
        })}

        {/* 任務節點 */}
        {steps.map((step, stepIndex) => {
          const stepPos = getRadialPosition(stepIndex, steps.length, stepRadius, centerX, centerY);
          
          return step.tasks.map((task, taskIndex) => {
            const { x, y } = getTaskPosition(taskIndex, step.tasks.length, stepPos.x, stepPos.y, taskRadius);
            const isNewlyCompleted = task.status === 'done' && isThisWeek(task.completedAt);
            const isSelected = selectedTaskId === task.id;
            
            let taskColor = '#6b7280'; // 默認灰色
            let taskBg = 'white';
            let TaskIcon = Clock;
            
            if (isNewlyCompleted) {
              taskColor = '#10b981';
              taskBg = '#d1fae5';
              TaskIcon = Sparkles;
            } else if (task.status === 'done') {
              taskColor = '#6b7280';
              taskBg = '#f3f4f6';
              TaskIcon = CheckCircle2;
            } else if (task.status === 'in_progress') {
              taskColor = '#3b82f6';
              taskBg = '#dbeafe';
              TaskIcon = Play;
            }
            
            return (
              <motion.g
                key={`task-${task.id}`}
                initial={showAnimations ? { scale: 0, opacity: 0 } : undefined}
                animate={showAnimations ? { scale: 1, opacity: 1 } : undefined}
                transition={showAnimations ? { 
                  delay: 1 + stepIndex * 0.1 + taskIndex * 0.05, 
                  duration: 0.3 
                } : undefined}
                whileHover={{ scale: 1.1 }}
                style={{ cursor: onTaskClick ? 'pointer' : 'default' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDragging) {
                    onTaskClick?.(task.id, step.id);
                  }
                }}
              >
                {/* 選中狀態的外圈 */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={Math.min(32, Math.min(width, height) * 0.08)}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray="4,4"
                    opacity="0.8"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values={`0 ${x} ${y};360 ${x} ${y}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                
                <circle
                  cx={x}
                  cy={y}
                  r={Math.min(24, Math.min(width, height) * 0.06)}
                  fill={taskBg}
                  stroke={isSelected ? '#3b82f6' : taskColor}
                  strokeWidth={isSelected ? "4" : "3"}
                  filter={isNewlyCompleted ? `url(#glow-${goalId})` : undefined}
                />
                
                {/* 新完成任務的閃爍效果 */}
                {isNewlyCompleted && (
                  <circle
                    cx={x}
                    cy={y}
                    r={Math.min(30, Math.min(width, height) * 0.075)}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      values={`${Math.min(24, Math.min(width, height) * 0.06)};${Math.min(32, Math.min(width, height) * 0.08)};${Math.min(24, Math.min(width, height) * 0.06)}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.8;0;0.8"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                
                <foreignObject
                  x={x - Math.min(16, Math.min(width, height) * 0.04)}
                  y={y - Math.min(16, Math.min(width, height) * 0.04)}
                  width={Math.min(32, Math.min(width, height) * 0.08)}
                  height={Math.min(32, Math.min(width, height) * 0.08)}
                  className="pointer-events-none"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <TaskIcon className="w-4 h-4" style={{ color: taskColor }} />
                  </div>
                </foreignObject>
              </motion.g>
            );
          });
        })}
        </g>
      </svg>
    </div>
  );
};

// 也導出統計計算的 hook，讓其他組件可以使用
export const useGoalRadialMapStats = (goalId: string) => {
  const { getActiveSteps } = useGoalStore();
  const steps = getActiveSteps(goalId);
  
  return useMemo(() => {
    let newlyCompleted = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    
    steps.forEach(step => {
      step.tasks.forEach(task => {
        totalTasks++;
        if (task.status === 'done') {
          completedTasks++;
          if (isThisWeek(task.completedAt)) {
            newlyCompleted++;
          }
        } else if (task.status === 'in_progress') {
          inProgressTasks++;
        }
      });
    });
    
    return { newlyCompleted, totalTasks, completedTasks, inProgressTasks };
  }, [steps]);
};

export type { GoalRadialMapProps }; 