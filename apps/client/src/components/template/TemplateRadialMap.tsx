/**
 * Template Radial Map - 模板專用放射狀圖
 * 
 * 這是 TopicRadialMap 的簡化版本，專門用於模板編輯模式
 * 
 * 與 TopicRadialMap 的主要差異：
 * 
 * 1. 數據來源：
 *    - TopicRadialMap: 從 topicStore 通過 API 獲取真實主題數據
 *    - TemplateRadialMap: 直接使用傳入的模板數據，無 API 調用
 * 
 * 2. 功能範圍：
 *    - TopicRadialMap: 支援協作功能、用戶頭像、實時數據更新
 *    - TemplateRadialMap: 純編輯功能，無協作相關功能
 * 
 * 3. 數據結構：
 *    - TopicRadialMap: 使用 Topic + Goal + Task 結構
 *    - TemplateRadialMap: 使用 TopicTemplate + TemplateGoal + TemplateTask 結構
 * 
 * 4. 用途：
 *    - TopicRadialMap: 用於真實主題的檢視和管理
 *    - TemplateRadialMap: 用於模板的編輯和預覽
 * 
 * 5. 性能：
 *    - TopicRadialMap: 需要處理 API 調用、錯誤處理、加載狀態
 *    - TemplateRadialMap: 純前端渲染，性能更好
 * 
 * 6. 狀態管理：
 *    - TopicRadialMap: 依賴 topicStore 進行狀態管理
 *    - TemplateRadialMap: 狀態由父組件 TemplateEditor 管理
 */

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { motion, easeInOut } from 'framer-motion';
import { subjects } from '../../styles/tokens';
import { 
  Target, CheckCircle2, Clock, Play, Flag, Sparkles, ZoomIn, ZoomOut, RotateCcw,
  Cloud, Car, TreePine, Star, Heart, Flower2, Sun, Moon,
  Pause, Trophy
} from 'lucide-react';
import type { TopicTemplate, TemplateGoal } from '../../types/goal';

interface TemplateRadialMapProps {
  template: TopicTemplate;
  width?: number;
  height?: number;
  selectedGoalId?: string | null;
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string, goalId: string) => void;
  onGoalClick?: (goalId: string) => void;
  className?: string;
}

// 計算放射狀位置
const getRadialPosition = (index: number, total: number, radius: number, centerX: number, centerY: number) => {
  const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // 從頂部開始
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  return { x, y, angle };
};

// 計算任務位置
const getTaskPosition = (taskIndex: number, totalTasks: number, stepX: number, stepY: number, taskRadius: number, goalAngle: number, centerX: number, centerY: number) => {
  const extensionAngle = goalAngle + Math.PI;
  
  if (totalTasks === 1) {
    const x = stepX + taskRadius * Math.cos(goalAngle);
    const y = stepY + taskRadius * Math.sin(goalAngle);
    return { x, y, angle: extensionAngle };
  }
  
  const maxSpread = Math.PI * 2;
  const angleStep = (totalTasks > 1 ? maxSpread / (totalTasks+1) : 0) * 0.9;
  const centerIndex = (totalTasks+1) / 2;
  const offsetFromCenter = taskIndex+1 - centerIndex;
  const taskAngle = goalAngle + offsetFromCenter * angleStep;
  
  const x = stepX + taskRadius * Math.cos(taskAngle);
  const y = stepY + taskRadius * Math.sin(taskAngle);
  return { x, y, angle: taskAngle };
};

export const TemplateRadialMap: React.FC<TemplateRadialMapProps> = ({
  template,
  width = 1000,
  height = 700,
  selectedGoalId = null,
  selectedTaskId = null,
  onTaskClick,
  onGoalClick,
  className = ""
}) => {
  // 注意：這裡不像 TopicRadialMap 需要 useEffect 來獲取數據
  // 所有數據都直接從 template prop 獲取
  // 縮放和拖拽狀態
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  const centerX = width / 2;
  const centerY = height / 2;

  // 主題樣式 - 直接從模板獲取，無需像 TopicRadialMap 那樣處理異步加載
  const subjectStyle = useMemo(() => {
    return subjects.getSubjectStyle(template.subject || '');
  }, [template.subject]);

  const subjectColor = subjectStyle.accent;

  // 定義裝飾圖示的位置和類型
  const decorativeIcons = useMemo(() => {
    return [
      { icon: Sun, x: centerX + 280, y: centerY - 280, size: 70, color: '#fcd34d', opacity: 0.7 },
      { icon: Cloud, x: centerX + 250, y: centerY - 200, size: 50, color: '#93c5fd', opacity: 0.7 },
      { icon: Cloud, x: centerX - 220, y: centerY - 240, size: 50, color: '#ddd6fe', opacity: 0.7 },
      { icon: Star, x: centerX - 330, y: centerY - 130, size: 30, color: '#fbbf24', opacity: 0.7 },
      { icon: Moon, x: centerX - 300, y: centerY - 180, size: 70, color: '#cbd5e1', opacity: 0.7 },
      { icon: TreePine, x: centerX + 280, y: centerY + 220, size: 70, color: '#86efac', opacity: 0.7 },
      { icon: TreePine, x: centerX - 250, y: centerY + 200, size: 70, color: '#65a30d', opacity: 0.7 },
      { icon: Car, x: centerX - 200, y: centerY + 280, size: 70, color: '#fbbf24', opacity: 0.7 },
    ];
  }, [centerX, centerY]);

  // 控制函數
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev / 1.2));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
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
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
  }, []);

  // 優化點擊處理函數
  const handleGoalClick = useCallback((e: React.MouseEvent, goalId: string) => {
    e.stopPropagation();
    if (!isDragging) {
      onGoalClick?.(goalId);
    }
  }, [isDragging, onGoalClick]);

  const handleTaskClick = useCallback((e: React.MouseEvent, taskId: string, goalId: string) => {
    e.stopPropagation();
    if (!isDragging) {
      onTaskClick?.(taskId, goalId);
    }
  }, [isDragging, onTaskClick]);

  // 動態計算尺寸，與 TopicRadialMap 保持一致
  const computedValues = useMemo(() => {
    const goalRadius = Math.min(width, height) * 0.46;
    const taskRadius = goalRadius * 0.6;
    const goalNodeSize = Math.min(60, Math.min(width, height) * 0.13);
    const taskNodeSize = Math.min(24, Math.min(width, height) * 0.06);
    
    return {
      goalRadius,
      taskRadius,
      goalNodeSize,
      taskNodeSize
    };
  }, [width, height]);

  const { goalRadius, taskRadius, goalNodeSize, taskNodeSize } = computedValues;

  return (
    <div className={`relative ${className}`} style={{ overflow: 'visible' }}>
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
        className={`absolute inset-0 w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* 定義漸變和陰影 */}
        <defs>
          <radialGradient id={`centerGradient-${template.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={subjectColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={subjectColor} stopOpacity="0.05" />
          </radialGradient>
          <filter id={`glow-${template.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 主要內容組，應用縮放和平移變換 */}
        <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
          {/* 裝飾圖示 */}
          {decorativeIcons.map((decoration, index) => {
            const IconComponent = decoration.icon;
            return (
              <motion.g
                key={`decoration-${index}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: decoration.opacity, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
              >
                <foreignObject
                  x={decoration.x - decoration.size / 2}
                  y={decoration.y - decoration.size / 2}
                  width={decoration.size}
                  height={decoration.size}
                  className="pointer-events-none"
                  style={{ overflow: 'visible' }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <IconComponent 
                      size={decoration.size} 
                      style={{ 
                        color: decoration.color,
                        fill: ['Sun', 'Star', 'Heart', 'Moon'].includes(decoration.icon.name) ? decoration.color : 'none',
                        strokeWidth: 2
                      }}
                    />
                  </div>
                </foreignObject>
              </motion.g>
            );
          })}

          {/* 透明背景區域用於捕捉點擊事件 */}
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="transparent"
            onClick={(e) => {
              // 點擊空白區域取消選擇
              if (!isDragging && (selectedGoalId || selectedTaskId)) {
                e.stopPropagation();
                onGoalClick?.(''); // 傳遞空字串來取消選擇
              }
            }}
            style={{ cursor: 'default' }}
          />

          {/* 背景放射線 */}
          {template.goals.map((_, index) => {
            const { x, y } = getRadialPosition(index, template.goals.length, goalRadius, centerX, centerY);
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
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
              />
            );
          })}

          {/* 目標和任務的連接線 - 在背景之後，節點之前 */}
          {template.goals.map((goal, goalIndex) => {
            const goalPos = getRadialPosition(goalIndex, template.goals.length, goalRadius, centerX, centerY);
            
            return (
              <g key={`goal-connections-${goal.id}`}>
                {/* 中心到目標的主線 */}
                <motion.line
                  x1={centerX}
                  y1={centerY}
                  x2={goalPos.x}
                  y2={goalPos.y}
                  stroke={subjectColor}
                  strokeWidth="4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5 + goalIndex * 0.1, duration: 0.6 }}
                />
                
                {/* 目標到任務的連接線 */}
                {goal.tasks?.map((task, taskIndex) => {
                  const taskPos = getTaskPosition(taskIndex, goal.tasks?.length || 0, goalPos.x, goalPos.y, taskRadius, goalPos.angle, centerX, centerY);
                  
                  return (
                    <motion.line
                      key={`task-line-${task.id}`}
                      x1={goalPos.x}
                      y1={goalPos.y}
                      x2={taskPos.x}
                      y2={taskPos.y}
                      stroke={subjectColor}
                      strokeWidth="2"
                      strokeOpacity="0.6"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.8 + goalIndex * 0.1 + taskIndex * 0.05, duration: 0.4 }}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* 中央主題節點 */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ cursor: onGoalClick ? 'pointer' : 'default' }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDragging) {
                onGoalClick?.('TEMPLATE');
              }
            }}
          >
            {/* 主要圓圈 */}
            <circle
              cx={centerX}
              cy={centerY}
              r={Math.min(70, Math.min(width, height) * 0.14)}
              fill="white"
              stroke={subjectColor}
              strokeWidth="4"
              filter={`url(#glow-${template.id})`}
            />
            
            {/* 簡單的虛線外圈 */}
            <circle
              cx={centerX}
              cy={centerY}
              r={Math.min(82, Math.min(width, height) * 0.155)}
              fill="none"
              stroke={subjectColor}
              strokeWidth="2"
              strokeOpacity="0.4"
              strokeDasharray="6,4"
            />
            

            
            {/* 主題標題 */}
            <foreignObject
              x={centerX - Math.min(60, Math.min(width, height) * 0.12)}
              y={centerY - Math.min(35, Math.min(width, height) * 0.07)}
              width={Math.min(120, Math.min(width, height) * 0.24)}
              height={Math.min(70, Math.min(width, height) * 0.14)}
              className="pointer-events-none"
            >
              <div className="w-full h-full flex items-center justify-center text-center">
                <div className="text-base font-bold text-gray-800 leading-tight">
                  {(() => {
                    const title = template.title;
                    const length = title.length;
                    
                    // 如果標題很短，直接顯示
                    if (length <= 4) {
                      return <div>{title}</div>;
                    }
                    
                    // 如果標題較長，嘗試平均分行
                    if (length <= 8) {
                      const mid = Math.ceil(length / 2);
                      return (
                        <div>
                          <div>{title.substring(0, mid)}</div>
                          <div>{title.substring(mid)}</div>
                        </div>
                      );
                    }
                    
                    // 更長的標題分三行
                    const third = Math.ceil(length / 3);
                    return (
                      <div>
                        <div>{title.substring(0, third)}</div>
                        <div>{title.substring(third, third * 2)}</div>
                        <div>{title.substring(third * 2)}</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </foreignObject>
          </motion.g>

          {/* 目標節點 - 使用模板目標數據，無需處理協作用戶頭像等功能 */}
          {template.goals.map((goal, goalIndex) => {
            const { x, y } = getRadialPosition(goalIndex, template.goals.length, goalRadius, centerX, centerY);
            const goalCompletedTasks = goal.tasks?.filter(t => t.status === 'done').length || 0;
            const goalProgress = (goal.tasks?.length || 0) > 0 ? (goalCompletedTasks / (goal.tasks?.length || 1)) * 100 : 0;
            const isSelected = selectedGoalId === goal.id && !selectedTaskId;
            
            // 根據目標狀態決定圖標、顏色和樣式
            let goalIcon = Flag;
            let goalColor = subjectColor;
            let goalBgColor = 'white';
            let strokeColor = `${subjectColor}60`;
            let strokeWidth = "4";
            
            switch (goal.status) {
              case 'todo':
                goalIcon = Target;
                goalColor = '#6b7280';
                goalBgColor = 'white';
                strokeColor = '#6b7280';
                strokeWidth = "3";
                break;
              case 'pause':
                goalIcon = Pause;
                goalColor = '#6b7280';
                goalBgColor = 'white';
                strokeColor = '#6b7280';
                strokeWidth = "3";
                break;
              case 'focus':
                goalIcon = Play;
                goalColor = subjectColor;
                goalBgColor = `color-mix(in srgb, ${subjectColor} 5%, white 95%)`;
                strokeColor = subjectColor;
                strokeWidth = "5";
                break;
              case 'finish':
                goalIcon = CheckCircle2;
                goalColor = subjectColor;
                goalBgColor = `color-mix(in srgb, ${subjectColor} 10%, white 90%)`;
                strokeColor = subjectColor;
                strokeWidth = "5";
                break;
              case 'complete':
                goalIcon = Trophy;
                goalColor = subjectColor;
                goalBgColor = `color-mix(in srgb, ${subjectColor} 15%, white 85%)`;
                strokeColor = subjectColor;
                strokeWidth = "6";
                break;
              default:
                if (goalProgress === 100) {
                  goalIcon = CheckCircle2;
                  goalColor = subjectColor;
                  goalBgColor = `color-mix(in srgb, ${subjectColor} 15%, white 85%)`;
                  strokeColor = subjectColor;
                  strokeWidth = "5";
                }
                break;
            }

            return (
              <motion.g
                key={`goal-${goal.id}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 + goalIndex * 0.1, duration: 0.4 }}
                style={{ cursor: onGoalClick ? 'pointer' : 'default' }}
                onClick={(e) => handleGoalClick(e, goal.id)}
              >
                {/* 選中效果 */}
                {isSelected && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={Math.min(68, Math.min(width, height) * 0.15)}
                    fill="#3b82f6"
                    fillOpacity="0.1"
                    initial={{ fillOpacity: 0.05 }}
                    animate={{ fillOpacity: 0.15 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: easeInOut,
                      repeatType: "reverse"
                    }}
                  />
                )}

                {/* 專注狀態的脈動效果 */}
                {goal.status === 'focus' && (
                  <circle
                    cx={x}
                    cy={y}
                    r={Math.min(70, Math.min(width, height) * 0.14)}
                    fill="none"
                    stroke={`color-mix(in srgb, ${subjectColor} 75%, white 25%)`}
                    strokeWidth="2"
                    opacity="0.4"
                  >
                    <animate
                      attributeName="r"
                      values={`${Math.min(60, Math.min(width, height) * 0.13)};${Math.min(75, Math.min(width, height) * 0.16)};${Math.min(60, Math.min(width, height) * 0.13)}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0;0.6"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* 目標圓圈 */}
                <circle
                  cx={x}
                  cy={y}
                  r={goalNodeSize}
                  fill={goalBgColor}
                  stroke={isSelected ? '#3b82f6' : strokeColor}
                  strokeWidth={isSelected ? "5" : strokeWidth}
                  filter={`url(#glow-${template.id})`}
                />

                {/* 目標圖標和標題 */}
                <foreignObject
                  x={x - Math.min(55, Math.min(width, height) * 0.12)}
                  y={y - Math.min(55, Math.min(width, height) * 0.12)}
                  width={Math.min(110, Math.min(width, height) * 0.24)}
                  height={Math.min(110, Math.min(width, height) * 0.24)}
                  className="pointer-events-none"
                >
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-1">
                    {React.createElement(goalIcon, { 
                      className: "w-6 h-6 mb-2", 
                      style: { color: goalColor } 
                    })}
                    <div className="text-sm font-medium text-gray-800 leading-tight max-w-[90px] overflow-hidden">
                      <div className="truncate">
                        {goal.title}
                      </div>
                    </div>
                  </div>
                </foreignObject>
              </motion.g>
            );
          })}

          {/* 任務節點 - 簡化版本，無需處理協作頭像、新完成標記等複雜功能 */}
          {template.goals.map((goal, goalIndex) => {
            const goalPos = getRadialPosition(goalIndex, template.goals.length, goalRadius, centerX, centerY);
            
            return goal.tasks?.map((task, taskIndex) => {
              const { x, y } = getTaskPosition(taskIndex, goal.tasks?.length || 0, goalPos.x, goalPos.y, taskRadius, goalPos.angle, centerX, centerY);
              const isSelected = selectedTaskId === task.id;
              
              let taskColor = '#6b7280';
              let taskBg = 'white';
              let TaskIcon = Clock;
              
              if (task.status === 'done') {
                taskColor = '#10b981';
                taskBg = '#d1fae5';
                TaskIcon = CheckCircle2;
              } else if (task.status === 'in_progress') {
                taskColor = '#3b82f6';
                taskBg = '#dbeafe';
                TaskIcon = Play;
              }

              return (
                <motion.g
                  key={`task-${task.id}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.0 + goalIndex * 0.1 + taskIndex * 0.05, duration: 0.3 }}
                  style={{ cursor: onTaskClick ? 'pointer' : 'default' }}
                  onClick={(e) => handleTaskClick(e, task.id, goal.id)}
                >
                  {/* 選中效果 */}
                  {isSelected && (
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={Math.min(32, Math.min(width, height) * 0.08)}
                      fill="#3b82f6"
                      fillOpacity="0.1"
                      initial={{ fillOpacity: 0.05 }}
                      animate={{ fillOpacity: 0.2 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: easeInOut,
                        repeatType: "reverse"
                      }}
                    />
                  )}

                  {/* 進行中任務的脈動效果 */}
                  {task.status === 'in_progress' && (
                    <circle
                      cx={x}
                      cy={y}
                      r={Math.min(30, Math.min(width, height) * 0.075)}
                      fill="none"
                      stroke="#dbeafe"
                      strokeWidth="2"
                      opacity="0.4"
                    >
                      <animate
                        attributeName="r"
                        values={`${Math.min(24, Math.min(width, height) * 0.06)};${Math.min(32, Math.min(width, height) * 0.08)};${Math.min(24, Math.min(width, height) * 0.06)}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0;0.6"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* 任務圓圈 */}
                  <circle
                    cx={x}
                    cy={y}
                    r={taskNodeSize}
                    fill={taskBg}
                    stroke={isSelected ? '#3b82f6' : taskColor}
                    strokeWidth={isSelected ? "4" : "3"}
                  />

                  {/* 任務圖標 */}
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