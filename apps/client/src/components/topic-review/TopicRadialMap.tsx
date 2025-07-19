import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, easeInOut } from 'framer-motion';
import { useTopicStore } from '../../store/topicStore';
import { subjects } from '../../styles/tokens';
import { UserAvatar } from '../learning-map/UserAvatar';
import { Topic } from '../../types/goal';
import { 
  Target, CheckCircle2, Clock, Play, Flag, Sparkles, ZoomIn, ZoomOut, RotateCcw,
  Cloud, Car, TreePine, Star, Sun, Moon, AlertTriangle,
  Pause, Trophy, Eye, EyeOff
} from 'lucide-react';
import type { Goal } from '../../types/goal';
import { refreshTopicData } from '../../store/dataManager';

interface TopicRadialMapProps {
  topicId: string;
  goals?: Goal[];
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
    const x = stepX + taskRadius * Math.cos(goalAngle);
    const y = stepY + taskRadius * Math.sin(goalAngle);
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
  goals = [],
  width = 1000,
  height = 700,
  showAnimations = true,
  selectedGoalId = null,
  selectedTaskId = null,
  onTaskClick,
  onGoalClick,
  className = ""
}) => {
  const { getActiveGoals } = useTopicStore();
  const [topic, setTopic] = useState<Topic | null>(null);
  const isInitialRender = useRef(true);
  const [shouldAnimate, setShouldAnimate] = useState(showAnimations);
  
  // 只在第一次渲染時才允許動畫
  useEffect(() => {
    if (isInitialRender.current) {
      // 第一次載入時根據 showAnimations 參數決定是否動畫
      setShouldAnimate(showAnimations);
      isInitialRender.current = false;
    } else {
      // 後續更新時禁用動畫
      setShouldAnimate(false);
    }
  }, []);

  // 縮放和拖拽狀態
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  const centerX = width / 2;
  const centerY = height / 2;

  // 定義裝飾圖示的位置和類型
  const decorativeIcons = useMemo(() => {
    return [
      // 天空區域 - 上方
      { icon: Sun, x: centerX + 280, y: centerY - 280, size: 70, color: '#fcd34d', opacity: 0.7 },
      { icon: Cloud, x: centerX + 250, y: centerY - 200, size: 50, color: '#93c5fd', opacity: 0.7 },
      { icon: Cloud, x: centerX - 220, y: centerY - 240, size: 50, color: '#ddd6fe', opacity: 0.7 },
      { icon: Star, x: centerX - 330, y: centerY - 130, size: 30, color: '#fbbf24', opacity: 0.7 },
      { icon: Moon, x: centerX - 300, y: centerY - 180, size: 70, color: '#cbd5e1', opacity: 0.7 },
      
      // 地面區域 - 下方
      { icon: TreePine, x: centerX + 280, y: centerY + 220, size: 70, color: '#86efac', opacity: 0.7 },
      { icon: TreePine, x: centerX - 250, y: centerY + 200, size: 70, color: '#65a30d', opacity: 0.7 },
      { icon: Car, x: centerX - 200, y: centerY + 280, size: 70, color: '#fbbf24', opacity: 0.7 },
    ];
  }, [centerX, centerY]);

  // 計算週進度統計
  const weeklyStats = useMemo(() => {
    if (!goals) return { newlyCompleted: 0, totalTasks: 0, completedTasks: 0, inProgressTasks: 0 };
    
    let newlyCompleted = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    
    goals.forEach(goal => {
      if (!goal.tasks) return;
      goal.tasks.forEach(task => {
        totalTasks++;
        if (task.status === 'done') {
          completedTasks++;
          if (isThisWeek(task.completed_at)) {
            newlyCompleted++;
          }
        } else if (task.status === 'in_progress') {
          inProgressTasks++;
        }
      });
    });
    
    return { newlyCompleted, totalTasks, completedTasks, inProgressTasks };
  }, [goals]);

  // 更新地圖尺寸
  const updateMapSize = useCallback(() => {
    if (!svgRef.current) return;
    const container = svgRef.current;
    const img = container.querySelector('img');
    if (!img) return;

    // 計算圖片在容器中的實際顯示尺寸
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = containerWidth / containerHeight;

    let displayWidth, displayHeight;
    if (imgRatio > containerRatio) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imgRatio;
    } else {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imgRatio;
    }

    // 計算地圖在容器中的偏移量
    const offsetX = (containerWidth - displayWidth) / 2;
    const offsetY = (containerHeight - displayHeight) / 2;

    setMapSize({
      width: displayWidth,
      height: displayHeight
    });

    setMapOffset({
      x: offsetX,
      y: offsetY
    });

    // 計算縮放比例，增加 1.5 倍
    setScale((displayWidth / img.naturalWidth) * 1.5);
  }, []);

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

  const handleToggleAvatars = useCallback(() => {
    if (topic) {
      setTopic({
        ...topic,
        show_avatars: !topic.show_avatars
      });
    }
  }, [topic]);

  const handleMapLoad = useCallback(() => {
    updateMapSize();
  }, [updateMapSize]);

  // 監聽容器大小變化
  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateMapSize);
    if (svgRef.current) {
      resizeObserver.observe(svgRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [updateMapSize]);

  // 獲取主題數據 - 優先使用外部傳入的 goals
  useEffect(() => {
    const fetchData = async () => {
      const fetchedTopic = await refreshTopicData(topicId);
      if (fetchedTopic) {
        setTopic(fetchedTopic);
      }
    };
    
    // 如果沒有傳入 goals 才從 store 獲取
    if (!goals || goals.length === 0) {
      fetchData();
    } else {
      // 如果有傳入 goals，只獲取 topic 基本信息
      fetchData();
    }
  }, [topicId, goals]);
  
  // 調試信息
  useEffect(() => {
    if (topic?.is_collaborative) {
      console.log('🔍 RadialMap Debug:', {
        topicId,
        topicTitle: topic.title,
        isCollaborative: topic.is_collaborative,
        showAvatars: topic.show_avatars,
        owner: topic.owner,
        collaborators: topic.collaborators
      });
    }
  }, [topic?.is_collaborative, topic?.show_avatars, topicId, topic?.title]);

  // 提前計算所有可能需要的值，避免在渲染時計算
  const computedValues = useMemo(() => {
    if (!topic) return null;

    const subjectStyle = subjects.getSubjectStyle(topic.subject || '');
    const subjectColor = subjectStyle.accent;
    const progress = topic.completionRate;
    const showAvatars = topic?.show_avatars ?? true;
    const goalRadius = Math.min(width, height) * 0.46;
    const taskRadius = goalRadius * 0.6;
    const goalNodeSize = Math.min(60, Math.min(width, height) * 0.13);
    const taskNodeSize = Math.min(24, Math.min(width, height) * 0.06);

    return {
      subjectStyle,
      subjectColor,
      progress,
      showAvatars,
      goalRadius,
      taskRadius,
      goalNodeSize,
      taskNodeSize
    };
  }, [topic, width, height]);

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

  // 優化動畫效果
  const animationConfig = useMemo(() => ({
    initial: shouldAnimate ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 },
    animate: { scale: 1, opacity: 1 },
    transition: shouldAnimate ? { 
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
      mass: 0.5,
      duration: 0.2
    } : { duration: 0 }
  }), [shouldAnimate]);

  // 優化選中效果動畫
  const selectedAnimationConfig = useMemo(() => ({
    initial: { fillOpacity: 0.05 },
    animate: { fillOpacity: 0.15 },
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: easeInOut,
      repeatType: "reverse" as const
    }
  }), []);

  if (!topic || !computedValues) {
    return null;
  }

  const {
    subjectStyle,
    subjectColor,
    progress,
    showAvatars,
    goalRadius,
    taskRadius,
    goalNodeSize,
    taskNodeSize
  } = computedValues;

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
        {topic?.is_collaborative && (
          <motion.button
            onClick={handleToggleAvatars}
            className={`w-8 h-8 rounded-lg shadow-md flex items-center justify-center transition-colors ${
              showAvatars 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-white/90 hover:bg-white text-gray-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={showAvatars ? '隱藏頭像' : '顯示頭像'}
          >
            {showAvatars ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                              initial={shouldAnimate ? { opacity: 0, scale: 0 } : { opacity: decoration.opacity, scale: 1 }}
              animate={{ opacity: decoration.opacity, scale: 1 }}
              transition={shouldAnimate ? { delay: 0.5 + index * 0.1, duration: 0.4 } : { duration: 0 }}
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
        {(goals && goals.length > 0 ? goals : topic?.goals || []).map((_, index) => {
          const currentGoals = goals && goals.length > 0 ? goals : topic?.goals || [];
          const { x, y } = getRadialPosition(index, currentGoals.length, goalRadius, centerX, centerY);
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
              initial={shouldAnimate ? { pathLength: 0 } : { pathLength: 1 }}
              animate={{ pathLength: 1 }}
              transition={shouldAnimate ? { delay: index * 0.1, duration: 0.8 } : { duration: 0 }}
            />
          );
        })}

        {/* 目標和任務的連接線 - 在背景之後，節點之前 */}
        {(goals && goals.length > 0 ? goals : topic?.goals || []).map((goal, goalIndex) => {
          const currentGoals = goals && goals.length > 0 ? goals : topic?.goals || [];
          const goalPos = getRadialPosition(goalIndex, currentGoals.length, goalRadius, centerX, centerY);
          
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
                              initial={shouldAnimate ? { pathLength: 0 } : { pathLength: 1 }}
              animate={{ pathLength: 1 }}
              transition={shouldAnimate ? { delay: 0.5 + goalIndex * 0.1, duration: 0.6 } : { duration: 0 }}
              />
              
              {/* 目標到任務的連接線 */}
              {goal.tasks?.map((task, taskIndex) => {
                const taskPos = getTaskPosition(taskIndex, goal.tasks?.length || 0, goalPos.x, goalPos.y, taskRadius, goalPos.angle, centerX, centerY);
                const isNewlyCompleted = task.status === 'done' && isThisWeek(task.completed_at);
                
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
          initial={showAnimations ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={showAnimations ? { delay: 0.2, duration: 0.5 } : { duration: 0 }}
          style={{ cursor: onGoalClick ? 'pointer' : 'default' }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDragging) {
              onGoalClick?.('TOPIC'); // 使用特殊 ID 標識點擊的是主題節點
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
        {(goals && goals.length > 0 ? goals : topic?.goals || []).map((goal, goalIndex) => {
          const currentGoals = goals && goals.length > 0 ? goals : topic?.goals || [];
          const { x, y } = getRadialPosition(goalIndex, currentGoals.length, goalRadius, centerX, centerY);
          const goalCompletedTasks = goal.tasks?.filter(t => t.status === 'done').length || 0;
          const goalProgress = (goal.tasks?.length || 0) > 0 ? (goalCompletedTasks / (goal.tasks?.length || 1)) * 100 : 0;
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
              {...animationConfig}
              transition={showAnimations ? { 
                ...animationConfig.transition,
                delay: 0.5 + goalIndex * 0.05 
              } : undefined}
              style={{ cursor: onGoalClick ? 'pointer' : 'default' }}
              onClick={(e) => handleGoalClick(e, goal.id)}
            >
              {/* 選中狀態的外圈 */}
              {isSelected && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r={Math.min(68, Math.min(width, height) * 0.15)}
                  fill="#3b82f6"
                  stroke="none"
                  {...selectedAnimationConfig}
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
              {goal.need_help && (
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
              
              {goal.need_help && (
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
            </motion.g>
          );
        })}

        {/* 任務節點 */}
        {(goals && goals.length > 0 ? goals : topic?.goals || []).map((goal, goalIndex) => {
          const currentGoals = goals && goals.length > 0 ? goals : topic?.goals || [];
          const goalPos = getRadialPosition(goalIndex, currentGoals.length, goalRadius, centerX, centerY);
          
          return goal.tasks?.map((task, taskIndex) => {
            const { x, y } = getTaskPosition(taskIndex, goal.tasks?.length || 0, goalPos.x, goalPos.y, taskRadius, goalPos.angle, centerX, centerY);
            const isNewlyCompleted = task.status === 'done' && isThisWeek(task.completed_at);
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
                {...animationConfig}
                transition={showAnimations ? { 
                  ...animationConfig.transition,
                  delay: 0.8 + goalIndex * 0.05 + taskIndex * 0.02 
                } : undefined}
                style={{ cursor: onTaskClick ? 'pointer' : 'default' }}
                onClick={(e) => handleTaskClick(e, task.id, goal.id)}
              >
                {/* 選中狀態的外圈 */}
                {isSelected && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={Math.min(32, Math.min(width, height) * 0.08)}
                    fill="#3b82f6"
                    stroke="none"
                    {...selectedAnimationConfig}
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
                {task.need_help && (
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
                
                {task.need_help && (
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
              </motion.g>
            );
          });
        })}

        {/* 所有協作頭像 - 放在最上層 */}
        {(goals && goals.length > 0 ? goals : topic?.goals || []).map((goal, goalIndex) => {
          const currentGoals = goals && goals.length > 0 ? goals : topic?.goals || [];
          const goalPos = getRadialPosition(goalIndex, currentGoals.length, goalRadius, centerX, centerY);
          const { x, y } = goalPos;
          
          return (
            <React.Fragment key={`avatars-${goal.id}`}>
              {/* 目標協作頭像 */}
              {topic.is_collaborative && topic.show_avatars && goal.owner && (
                <foreignObject
                  x={x + goalNodeSize * 0.3}
                  y={y - goalNodeSize * 1.3}
                  width={goalNodeSize * 1.3}
                  height={goalNodeSize * 1.3}
                  style={{ overflow: 'visible', zIndex: 1000 }}
                >
                  <motion.div 
                    className="absolute"
                    style={{
                      width: `${goalNodeSize * 1.2}px`,
                      height: `${goalNodeSize * 1.2}px`,
                      zIndex: 1000
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.2 + goalIndex * 0.1, duration: 0.3 }}
                  >
                    <div className="relative w-full h-full" style={{ zIndex: 1000 }}>
                      {goal.owner && (
                        <>
                          <div className="w-full h-full">
                            <UserAvatar 
                              user={goal.owner} 
                              size="sm" 
                              showTooltip={true}
                              style={{ 
                                width: '100%',
                                height: '100%',
                                zIndex: 1000
                              }}
                            />
                          </div>
                          {goal.collaborators && goal.collaborators.length > 0 && (
                            <div 
                              className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg cursor-help hover:bg-blue-600 transition-colors"
                              style={{
                                width: `${goalNodeSize * 0.4}px`,
                                height: `${goalNodeSize * 0.4}px`,
                                zIndex: 1001
                              }}
                              title={`協作者: ${goal.collaborators.map(c => c.name).join(', ')}`}
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

              {/* 任務協作頭像 */}
              {goal.tasks?.map((task, taskIndex) => {
                const taskPos = getTaskPosition(taskIndex, goal.tasks?.length || 0, x, y, taskRadius, goalPos.angle, centerX, centerY);
                return (
                  topic.is_collaborative && topic.show_avatars && task.owner && (
                    <foreignObject
                      key={`task-avatar-${task.id}`}
                      x={taskPos.x + taskNodeSize * 0.3}
                      y={taskPos.y - taskNodeSize * 1.5}
                      width={taskNodeSize * 2}
                      height={taskNodeSize * 2}
                      style={{ overflow: 'visible', zIndex: 1000 }}
                    >
                      <motion.div 
                        className="absolute"
                        style={{
                          width: `${taskNodeSize * 1.8}px`,
                          height: `${taskNodeSize * 1.8}px`,
                          zIndex: 1000
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.5 + goalIndex * 0.1 + taskIndex * 0.05, duration: 0.3 }}
                      >
                        <div className="relative w-full h-full" style={{ zIndex: 1000 }}>
                          {task.owner && (
                            <div className="w-full h-full">
                              <UserAvatar 
                                user={task.owner} 
                                size="xs" 
                                showTooltip={true}
                                style={{ 
                                  width: '100%',
                                  height: '100%',
                                  zIndex: 1000
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </foreignObject>
                  )
                );
              })}
            </React.Fragment>
          );
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
      if (!goal.tasks) return;
      goal.tasks.forEach(task => {
        totalTasks++;
        if (task.status === 'done') {
          completedTasks++;
          if (isThisWeek(task.completed_at)) {
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