import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTopicStore } from '../../store/topicStore';
import { subjects } from '../../styles/tokens';
import { UserAvatar, UserAvatarGroup } from './UserAvatar';
import type { User } from '../../types/goal';
import { 
  Target, CheckCircle2, Clock, Play, Flag, Sparkles, ZoomIn, ZoomOut, RotateCcw,
  Cloud, Car, TreePine, Star, Heart, Flower2, Sun, Moon, AlertTriangle,
  Pause, Award, Trophy, FlagOff, Users, Eye, EyeOff
} from 'lucide-react';

interface TopicRadialMapProps {
  topicId: string;
  width?: number;
  height?: number;
  showAnimations?: boolean;
  selectedGoalId?: string | null;
  selectedTaskId?: string | null;
  onTaskClick?: (taskId: string, goalId: string) => void;
  onGoalClick?: (goalId: string) => void;
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

// 計算任務在目標周圍的位置，與 topic-goal 連線形成均勻角度，但偏向延伸線
const getTaskPosition = (taskIndex: number, totalTasks: number, stepX: number, stepY: number, taskRadius: number, goalAngle: number, centerX: number, centerY: number) => {
  // topic-goal 線的延伸線角度（goal 指向中心相反方向）
  const extensionAngle = goalAngle + Math.PI;
  
  if (totalTasks === 1) {
    // 單個任務時，放在延伸線方向
    const x = stepX + taskRadius * Math.cos(extensionAngle);
    const y = stepY + taskRadius * Math.sin(extensionAngle);
    return { x, y, angle: extensionAngle };
  }
  
  // 不再計算均勻分佈，而是讓任務更靠近延伸線
  // 使用較小的角度範圍，讓所有任務都集中在延伸線附近
  const maxSpread = Math.PI * 2; // 最大散佈角度（30度）
  const angleStep = (totalTasks > 1 ? maxSpread / (totalTasks+1) : 0) * 0.9;
  
  // 計算對稱分佈：以延伸線為中心，左右對稱排列
  const centerIndex = (totalTasks+1) / 2; // 中心索引
  const offsetFromCenter = taskIndex+1 - centerIndex; // 相對於中心的偏移
  const taskAngle = goalAngle + offsetFromCenter * angleStep;
  
  const x = stepX + taskRadius * Math.cos(taskAngle);
  const y = stepY + taskRadius * Math.sin(taskAngle);
  return { x, y, angle: taskAngle };
};

export const TopicRadialMap: React.FC<TopicRadialMapProps> = ({
  topicId,
  width = 1000,
  height = 700,
  showAnimations = true,
  selectedGoalId = null,
  selectedTaskId = null,
  onTaskClick,
  onGoalClick,
  className = ""
}) => {
  const { getTopic, getActiveGoals, getCompletionRate, toggleAvatarDisplay } = useTopicStore();
  const topic = getTopic(topicId);
  
  // 調試信息
  useEffect(() => {
    if (topic?.isCollaborative) {
      console.log('🔍 RadialMap Debug:', {
        topicId,
        topicTitle: topic.title,
        isCollaborative: topic.isCollaborative,
        showAvatars: topic.showAvatars,
        owner: topic.owner,
        collaborators: topic.collaborators
      });
    }
  }, [topic?.isCollaborative, topic?.showAvatars, topicId, topic?.title]);
  
  // 縮放和拖拽狀態
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  if (!topic) {
    return null;
  }

  const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
  const subjectColor = subjectStyle.accent;
  const progress = getCompletionRate(topic.id);
  const goals = getActiveGoals(topic.id);
  
  // 計算週進度統計
  const weeklyStats = useMemo(() => {
    let newlyCompleted = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    
    goals.forEach(goal => {
      goal.tasks.forEach(task => {
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
  }, [goals]);

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
  const goalRadius = Math.min(width, height) * 0.46; // 縮短 topic-goal 距離
  const taskRadius = goalRadius * 0.6; // 讓 goal-task 距離與 topic-goal 成比例
  
  // 節點圓圈大小
  const goalNodeSize = Math.min(60, Math.min(width, height) * 0.13);
  const taskNodeSize = Math.min(24, Math.min(width, height) * 0.06);

  // 定義裝飾圖示的位置和類型
  const decorativeIcons = useMemo(() => {
    return [
      // 天空區域 - 上方
      { icon: Sun, x: centerX + 280, y: centerY - 280, size: 70, color: '#fcd34d', opacity: 0.7 },
      { icon: Cloud, x: centerX + 250, y: centerY - 200, size: 50, color: '#93c5fd', opacity: 0.7 },
      { icon: Cloud, x: centerX - 220, y: centerY - 240, size: 50, color: '#ddd6fe', opacity: 0.7 },
      { icon: Star, x: centerX - 330, y: centerY - 130, size: 30, color: '#fbbf24', opacity: 0.7 },
      //{ icon: Star, x: centerX + 320, y: centerY - 150, size: 45, color: '#fbbf24', opacity: 0.4 },
      { icon: Moon, x: centerX - 300, y: centerY - 180, size: 70, color: '#cbd5e1', opacity: 0.7 },
      
      // 地面區域 - 下方
      { icon: TreePine, x: centerX + 280, y: centerY + 220, size: 70, color: '#86efac', opacity: 0.7 },
      { icon: TreePine, x: centerX - 250, y: centerY + 200, size: 70, color: '#65a30d', opacity: 0.7 },
      { icon: Car, x: centerX - 200, y: centerY + 280, size: 70, color: '#fbbf24', opacity: 0.7 },
      //{ icon: Car, x: centerX + 220, y: centerY + 120, size: 30, color: '#f97316', opacity: 0.5 },
      
      // 中間區域裝飾
      // { icon: Heart, x: centerX - 160, y: centerY + 80, size: 30, color: '#fb7185', opacity: 0.4 },
      //{ icon: Flower2, x: centerX + 100, y: centerY + 60, size: 25, color: '#c084fc', opacity: 0.5 },
    ];
  }, [centerX, centerY]);

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
        {/* 協作頭像開關 - 只在協作模式下顯示 */}
        {topic.isCollaborative && (
          <motion.button
            onClick={() => toggleAvatarDisplay(topicId)}
            className={`w-8 h-8 rounded-lg shadow-md flex items-center justify-center transition-colors ${
              topic.showAvatars 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-white/90 hover:bg-white text-gray-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={topic.showAvatars ? '隱藏頭像' : '顯示頭像'}
          >
            {topic.showAvatars ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.button>
        )}
        
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
          <radialGradient id={`centerGradient-${topicId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={subjectColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={subjectColor} stopOpacity="0.05" />
          </radialGradient>
          <filter id={`glow-${topicId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 主要內容組，應用縮放和平移變換 */}
        <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
          {/* 裝飾圖示 - 放在最底層 */}
          {decorativeIcons.map((decoration, index) => {
            const IconComponent = decoration.icon;
            return (
              <motion.g
                key={`decoration-${index}`}
                initial={showAnimations ? { opacity: 0, scale: 0 } : { opacity: decoration.opacity, scale: 1 }}
                animate={{ opacity: decoration.opacity, scale: 1 }}
                transition={showAnimations ? { delay: 0.5 + index * 0.1, duration: 0.4 } : undefined}
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
          {goals.map((_, index) => {
          const { x, y } = getRadialPosition(index, goals.length, goalRadius, centerX, centerY);
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

        {/* 目標和任務的連接線 - 在背景之後，節點之前 */}
        {goals.map((goal, goalIndex) => {
          const goalPos = getRadialPosition(goalIndex, goals.length, goalRadius, centerX, centerY);
          
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
                initial={showAnimations ? { pathLength: 0 } : undefined}
                animate={showAnimations ? { pathLength: 1 } : undefined}
                transition={showAnimations ? { delay: 0.5 + goalIndex * 0.1, duration: 0.6 } : undefined}
              />
              
              {/* 目標到任務的連接線 */}
              {goal.tasks.map((task, taskIndex) => {
                const taskPos = getTaskPosition(taskIndex, goal.tasks.length, goalPos.x, goalPos.y, taskRadius, goalPos.angle, centerX, centerY);
                const isNewlyCompleted = task.status === 'done' && isThisWeek(task.completedAt);
                
                // 檢查是否在主延伸線上（topic-goal 的延長線）
                const extensionAngle = goalPos.angle + Math.PI;
                
                // 計算任務角度與延伸線的角度差（標準化到 -π 到 π）
                let angleDiff = taskPos.angle - extensionAngle;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                // 如果角度差很小（在延伸線上），使用直線
                const isOnExtensionLine = Math.abs(angleDiff) < 0.1; // 約 5.7 度的容忍範圍
                
                if (isOnExtensionLine) {
                  return (
                    <motion.line
                      key={`task-line-${task.id}`}
                      x1={goalPos.x}
                      y1={goalPos.y}
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
                      transition={showAnimations ? { delay: 1 + goalIndex * 0.1 + taskIndex * 0.05, duration: 0.4 } : undefined}
                    />
                  );
                } else {
                  // 不在延伸線上，使用曲線，彎曲程度根據角度差決定
                  const midX = (goalPos.x + taskPos.x) / 2;
                  const midY = (goalPos.y + taskPos.y) / 2;
                  
                  // 彎曲強度基於角度差，最大彎曲在 90 度時
                  const maxBend = 25;
                  const bendIntensity = maxBend * Math.sin(Math.abs(angleDiff));
                  
                  // 彎曲方向：根據角度差的正負決定左右
                  const bendDirection = angleDiff > 0 ? 1 : -1;
                  
                  // 計算控制點：垂直於連線方向（加上 π 讓彎曲方向完全相反）
                  const perpAngle = Math.atan2(taskPos.y - goalPos.y, taskPos.x - goalPos.x) + Math.PI / 2 + Math.PI;
                  const controlX = midX + bendIntensity * bendDirection * Math.cos(perpAngle);
                  const controlY = midY + bendIntensity * bendDirection * Math.sin(perpAngle);
                  
                  return (
                    <motion.path
                      key={`task-line-${task.id}`}
                      d={`M ${goalPos.x} ${goalPos.y} Q ${controlX} ${controlY} ${taskPos.x} ${taskPos.y}`}
                      stroke={
                        isNewlyCompleted ? '#10b981' :
                        task.status === 'done' ? '#6b7280' :
                        task.status === 'in_progress' ? '#3b82f6' :
                        '#d1d5db'
                      }
                      strokeWidth="3"
                      fill="none"
                      initial={showAnimations ? { pathLength: 0 } : undefined}
                      animate={showAnimations ? { pathLength: 1 } : undefined}
                      transition={showAnimations ? { delay: 1 + goalIndex * 0.1 + taskIndex * 0.05, duration: 0.4 } : undefined}
                    />
                  );
                }
              })}
            </g>
          );
        })}

        {/* 中央主題節點 */}
        <motion.g
          initial={showAnimations ? { scale: 0, opacity: 0 } : undefined}
          animate={showAnimations ? { scale: 1, opacity: 1 } : undefined}
          transition={showAnimations ? { delay: 0.2, duration: 0.5 } : undefined}
        >
          {/* 主要圓圈 */}
          <circle
            cx={centerX}
            cy={centerY}
            r={Math.min(70, Math.min(width, height) * 0.14)}
            fill="white"
            stroke={subjectColor}
            strokeWidth="4"
            filter={`url(#glow-${topicId})`}
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
                  const title = topic.title;
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

        {/* 目標節點 */}
        {goals.map((goal, goalIndex) => {
          const { x, y } = getRadialPosition(goalIndex, goals.length, goalRadius, centerX, centerY);
          const goalCompletedTasks = goal.tasks.filter(t => t.status === 'done').length;
          const goalProgress = goal.tasks.length > 0 ? (goalCompletedTasks / goal.tasks.length) * 100 : 0;
          const isSelected = selectedGoalId === goal.id && !selectedTaskId; // 只有在沒有選中任務時才顯示目標選中
          
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
              initial={showAnimations ? { scale: 0, opacity: 0 } : undefined}
              animate={showAnimations ? { scale: 1, opacity: 1 } : undefined}
              transition={showAnimations ? { delay: 0.5 + goalIndex * 0.1, duration: 0.4 } : undefined}
              style={{ cursor: onGoalClick ? 'pointer' : 'default' }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDragging) {
                  onGoalClick?.(goal.id);
                }
              }}
            >
              {/* 選中狀態的外圈 */}
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r={Math.min(68, Math.min(width, height) * 0.15)}
                  fill="#3b82f6"
                  fillOpacity="0.15"
                  stroke="none"
                >
                  <animate
                    attributeName="fill-opacity"
                    values="0.05;0.25;0.05"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
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
              
              <circle
                cx={x}
                cy={y}
                r={goalNodeSize}
                fill={goalBgColor}
                stroke={isSelected ? '#3b82f6' : strokeColor}
                strokeWidth={isSelected ? "5" : strokeWidth}
              />
              
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
              
              {/* 目標的需要幫助指示器 */}
              {goal.needHelp && (
                <motion.circle
                  cx={x + Math.min(45, Math.min(width, height) * 0.10)}
                  cy={y + Math.min(45, Math.min(width, height) * 0.10)}
                  r={Math.min(15, Math.min(width, height) * 0.035)}
                  fill="#f97316"
                  stroke="white"
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8 + goalIndex * 0.1, duration: 0.3 }}
                >
                  <animate
                    attributeName="fill"
                    values="#f97316;#fb923c;#f97316"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </motion.circle>
              )}
              
              {goal.needHelp && (
                <foreignObject
                  x={x + Math.min(45, Math.min(width, height) * 0.10) - Math.min(10, Math.min(width, height) * 0.025)}
                  y={y + Math.min(45, Math.min(width, height) * 0.10) - Math.min(10, Math.min(width, height) * 0.025)}
                  width={Math.min(20, Math.min(width, height) * 0.05)}
                  height={Math.min(20, Math.min(width, height) * 0.05)}
                  className="pointer-events-none"
                  style={{ overflow: 'visible' }}
                >
                  <motion.div 
                    className="w-full h-full flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8 + goalIndex * 0.1, duration: 0.3 }}
                  >
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </motion.div>
                </foreignObject>
              )}

              {/* 協作頭像 - 只在協作模式且開啟頭像顯示時顯示 */}
              {topic.isCollaborative && topic.showAvatars && goal.owner && (
                <foreignObject
                  x={x + goalNodeSize * 0}
                  y={y - goalNodeSize * 1.5}
                  width={goalNodeSize * 1.2}
                  height={goalNodeSize * 1.2}
                  className="pointer-events-none"
                  style={{ overflow: 'visible' }}
                >
                  <motion.div 
                    className="w-full h-full flex items-start justify-start"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.2 + goalIndex * 0.1, duration: 0.3 }}
                  >
                    <div className="flex items-center relative">
                      {goal.owner && (
                        <>
                          <div className="w-full h-full">
                            <UserAvatar 
                              user={goal.owner} 
                              size="sm" 
                              showTooltip={true}
                              style={{ width: '100%', height: '100%' }}
                            />
                          </div>
                          {goal.collaborators && goal.collaborators.length > 0 && (
                            <div 
                              className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg cursor-help hover:bg-blue-600 transition-colors"
                              title={`協作者: ${goal.collaborators.map(c => c.name).join(', ')}`}
                              style={{ zIndex: 1000 }}
                            >
                              +{goal.collaborators.length}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                </foreignObject>
              )}
            </motion.g>
          );
        })}

        {/* 任務節點 */}
        {goals.map((goal, goalIndex) => {
          const goalPos = getRadialPosition(goalIndex, goals.length, goalRadius, centerX, centerY);
          
          return goal.tasks.map((task, taskIndex) => {
            const { x, y } = getTaskPosition(taskIndex, goal.tasks.length, goalPos.x, goalPos.y, taskRadius, goalPos.angle, centerX, centerY);
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
              taskColor = '#10b981'; // 完成任務用綠色
              taskBg = '#d1fae5'; // 淡綠色背景
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
                  delay: 1 + goalIndex * 0.1 + taskIndex * 0.05, 
                  duration: 0.3 
                } : undefined}
                whileHover={{ scale: 1.1 }}
                style={{ cursor: onTaskClick ? 'pointer' : 'default' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDragging) {
                    onTaskClick?.(task.id, goal.id);
                  }
                }}
              >
                {/* 選中狀態的外圈 */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={Math.min(32, Math.min(width, height) * 0.08)}
                    fill="#3b82f6"
                    fillOpacity="0.15"
                    stroke="none"
                  >
                    <animate
                      attributeName="fill-opacity"
                      values="0.05;0.25;0.05"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
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
                
                <circle
                  cx={x}
                  cy={y}
                  r={taskNodeSize}
                  fill={taskBg}
                  stroke={isSelected ? '#3b82f6' : taskColor}
                  strokeWidth={isSelected ? "4" : "3"}
                />
                
                {/* 只有本週新完成的任務才有閃爍效果 */}
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
                
                {/* 任務的需要幫助指示器 */}
                {task.needHelp && (
                  <motion.circle
                    cx={x + Math.min(18, Math.min(width, height) * 0.045)}
                    cy={y + Math.min(18, Math.min(width, height) * 0.045)}
                    r={Math.min(8, Math.min(width, height) * 0.02)}
                    fill="#f97316"
                    stroke="white"
                    strokeWidth="1.5"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.2 + goalIndex * 0.1 + taskIndex * 0.05, duration: 0.3 }}
                  >
                    <animate
                      attributeName="fill"
                      values="#f97316;#fb923c;#f97316"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </motion.circle>
                )}
                
                {task.needHelp && (
                  <foreignObject
                    x={x + Math.min(18, Math.min(width, height) * 0.045) - Math.min(6, Math.min(width, height) * 0.015)}
                    y={y + Math.min(18, Math.min(width, height) * 0.045) - Math.min(6, Math.min(width, height) * 0.015)}
                    width={Math.min(12, Math.min(width, height) * 0.03)}
                    height={Math.min(12, Math.min(width, height) * 0.03)}
                    className="pointer-events-none"
                    style={{ overflow: 'visible' }}
                  >
                    <motion.div 
                      className="w-full h-full flex items-center justify-center"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.2 + goalIndex * 0.1 + taskIndex * 0.05, duration: 0.3 }}
                    >
                      <AlertTriangle className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                  </foreignObject>
                )}

                {/* 任務協作頭像 - 只在協作模式且開啟頭像顯示時顯示 */}
                {topic.isCollaborative && topic.showAvatars && task.owner && (
                  <foreignObject
                    x={x + taskNodeSize * 0.1}
                    y={y - taskNodeSize * 1.9}
                    width={taskNodeSize * 1.8}
                    height={taskNodeSize * 1.8}
                    className="pointer-events-none"
                    style={{ overflow: 'visible' }}
                  >
                    <motion.div 
                      className="w-full h-full flex items-center justify-center"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.5 + goalIndex * 0.1 + taskIndex * 0.05, duration: 0.3 }}
                    >
                      <div className="flex items-center relative">
                        {task.owner && (
                          <div className="w-full h-full">
                            <UserAvatar 
                              user={task.owner} 
                              size="xs" 
                              showTooltip={true}
                              style={{ width: '100%', height: '100%' }}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </foreignObject>
                )}
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
export const useTopicRadialMapStats = (topicId: string) => {
  const { getActiveGoals } = useTopicStore();
  const goals = getActiveGoals(topicId);
  
  return useMemo(() => {
    let newlyCompleted = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    
    goals.forEach(goal => {
      goal.tasks.forEach(task => {
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
  }, [goals]);
};

// 兼容性導出
export const GoalRadialMap = TopicRadialMap;
export const useGoalRadialMapStats = useTopicRadialMapStats;
export type { TopicRadialMapProps, TopicRadialMapProps as GoalRadialMapProps }; 