import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, MotionValue, useMotionValueEvent } from 'framer-motion';
import { ArrowLeft, Plus, Target, ListTodo, ZoomIn, ZoomOut, Move, CheckCircle2, Clock } from 'lucide-react';
import { useGoalStore } from '../../store/goalStore';
import { Goal, Step, Task, createStep } from '../../types/goal';
import Lottie from 'lottie-react';
import loadingAnimation from '../../assets/lottie/mind-map-loading.json';

interface GoalMindMapProps {
  goalId: string;
  onBack?: () => void;
}

// 在 GoalMindMap 組件前添加顏色計算函數
const getStepColors = (index: number, totalSteps: number) => {
  // 使用漸層效果，從淺到深，但降低整體深度
  const colorLevels = [
    { bg: 'from-purple-50 to-purple-100', border: 'border-purple-100', icon: 'text-purple-400', text: 'text-purple-600' },
    { bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', icon: 'text-purple-500', text: 'text-purple-700' },
    { bg: 'from-purple-50 to-purple-200', border: 'border-purple-300', icon: 'text-purple-600', text: 'text-purple-800' },
    { bg: 'from-purple-50 to-purple-200', border: 'border-purple-400', icon: 'text-purple-700', text: 'text-purple-900' },
    { bg: 'from-purple-50 to-purple-300', border: 'border-purple-500', icon: 'text-purple-800', text: 'text-purple-900' },
    { bg: 'from-purple-50 to-purple-300', border: 'border-purple-600', icon: 'text-purple-900', text: 'text-purple-900' },
    { bg: 'from-purple-50 to-purple-400', border: 'border-purple-700', icon: 'text-purple-900', text: 'text-purple-900' },
  ];

  // 限制最大步驟數為7
  const stepIndex = Math.min(index, 6);
  const colors = colorLevels[stepIndex];

  return {
    gradient: colors.bg,
    border: colors.border,
    icon: colors.icon,
    text: colors.text,
  };
};

export const GoalMindMap: React.FC<GoalMindMapProps> = ({ goalId, onBack }) => {
  const { goals, updateGoal } = useGoalStore();
  const goal = goals.find((g) => g.id === goalId);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isGoalSelected, setIsGoalSelected] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState('');
  const [zoom, setZoom] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [stepOffsets, setStepOffsets] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [taskOffsets, setTaskOffsets] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [dragStartPositions, setDragStartPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [isDraggingStep, setIsDraggingStep] = useState<string | null>(null);
  const [goalPosition, setGoalPosition] = useState<{ x: number; y: number }>({ x: 200, y: 0 });
  const [goalOffset, setGoalOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 追蹤目標節點位置
  const goalX = useMotionValue(0);
  const goalY = useMotionValue(0);

  // 追蹤步驟節點位置
  const stepPositions = useRef(new Map<string, { x: number, y: number }>());

  // 監聽位置變化
  useMotionValueEvent(goalX, "change", (latest) => {
    setGoalOffset(prev => ({ ...prev, x: latest }));
  });

  useMotionValueEvent(goalY, "change", (latest) => {
    setGoalOffset(prev => ({ ...prev, y: latest }));
  });

  // 計算最佳視圖位置和縮放值
  const calculateOptimalView = useCallback(() => {
    if (!containerRef.current || !goal) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 計算所有 step 的總高度
    const totalStepHeight = goal.steps.reduce((total, step) => {
      return total + (120 + 40) * step.tasks.length;
    }, 0);

    // 計算整個畫布的寬度（從最左到最右）
    const centerGoalX = 0;  // 中心目標的 x 位置
    const rightmostTaskX = 400 + 300 + 200 + 256 + 100; // baseX + stepX + taskX + taskWidth
    const leftmostX = centerGoalX;  // 中心目標左邊的空間
    const totalWidth = rightmostTaskX - leftmostX;  // 整個畫布的實際寬度

    // 計算最佳縮放值
    const optimalZoomX = (containerWidth * 0.8) / totalWidth;
    const optimalZoomY = (containerHeight * 0.8) / totalStepHeight;
    const optimalZoom = Math.min(Math.max(0.8, Math.min(optimalZoomX, optimalZoomY)), 1.5);

    // 計算目標應該在的位置（螢幕寬度的 35%）
    const targetScreenX = containerWidth * 0.2;
    
    // 計算需要的 translate 值，確保目標出現在 35% 的位置
    const optimalX = (targetScreenX - centerGoalX * optimalZoom) / optimalZoom;

    // 計算 Y 軸位置
    let optimalY;
    const scaledTotalHeight = totalStepHeight * optimalZoom;
    
    if (scaledTotalHeight > containerHeight) {
      // 如果縮放後的高度超過容器高度，將位置設定為顯示第一個 task
      // 考慮 goal 圖示的高度（96px）和一些上方間距（50px）
      optimalY = 50 / optimalZoom;
    } else {
      // 如果高度足夠，置中顯示
      optimalY = (containerHeight - totalStepHeight * optimalZoom) / 2 / optimalZoom;
    }

    console.log('Layout calculation:', {
      container: {
        width: containerWidth,
        height: containerHeight
      },
      canvas: {
        centerGoalX,
        rightmostTaskX,
        leftmostX,
        totalWidth,
        totalStepHeight,
        scaledTotalHeight
      },
      zoom: {
        optimalZoomX,
        optimalZoomY,
        finalZoom: optimalZoom
      },
      position: {
        x: optimalX,
        y: optimalY
      },
      finalTransform: `scale(${optimalZoom}) translate(${optimalX}px, ${optimalY}px)`
    });

    return {
      zoom: optimalZoom,
      position: { x: optimalX, y: optimalY }
    };
  }, [goal]);

  useEffect(() => {
    if (initialLoad) {
      // 確保元素都已經渲染完成
      const timer = setTimeout(() => {
        const optimalView = calculateOptimalView();
        if (optimalView) {
          setZoom(optimalView.zoom);
          setPosition(optimalView.position);
        }
        setInitialLoad(false);
        // 等待位置調整完成後再隱藏 loading
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialLoad, calculateOptimalView]);

  // 初始化 offsets
  useEffect(() => {
    if (goal && initialLoad) {
      const initialStepOffsets: { [key: string]: { x: number; y: number } } = {};
      const initialTaskOffsets: { [key: string]: { x: number; y: number } } = {};

      goal.steps.forEach((step, stepIndex) => {
        initialStepOffsets[step.id] = { x: 0, y: 0 };
        step.tasks.forEach((task) => {
          initialTaskOffsets[task.id] = { x: 0, y: 0 };
        });
      });

      setStepOffsets(initialStepOffsets);
      setTaskOffsets(initialTaskOffsets);
    }
  }, [goal]);

  // ✅ 刪除 resize 時自動 reset zoom/position 的邏輯
// ❌ 不要再做這個
/*
  // 添加視窗大小改變時的重新計算
  useEffect(() => {
    const handleResize = () => {
      const optimalView = calculateOptimalView();
      if (optimalView) {
        const oldZoom = zoom;
        const newZoom = optimalView.zoom;
        const zoomFactor = newZoom / oldZoom;

        // 調整 offset 以適應新的 zoom
        setStepOffsets(prev => {
          const newOffsets = { ...prev };
          Object.keys(newOffsets).forEach(key => {
            newOffsets[key] = {
              x: newOffsets[key].x * zoomFactor,
              y: newOffsets[key].y * zoomFactor
            };
          });
          return newOffsets;
        });

        setTaskOffsets(prev => {
          const newOffsets = { ...prev };
          Object.keys(newOffsets).forEach(key => {
            newOffsets[key] = {
              x: newOffsets[key].x * zoomFactor,
              y: newOffsets[key].y * zoomFactor
            };
          });
          return newOffsets;
        });

        setZoom(newZoom);
        setPosition(optimalView.position);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateOptimalView, zoom]);
  */

  const handleZoom = useCallback((delta: number) => {
    // 獲取容器的位置和大小資訊
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // 計算容器中心點
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 計算新的縮放值
    const newZoom = Math.min(Math.max(0.4, zoom + delta), 2);

    // 計算中心點在畫布邏輯座標系中的位置
    const logicX = centerX / zoom - position.x;
    const logicY = centerY / zoom - position.y;

    // 計算新的位置，確保中心點在縮放前後指向畫布中的同一個點
    const newPosition = {
      x: centerX / newZoom - logicX,
      y: centerY / newZoom - logicY
    };

    // 更新狀態
    setZoom(newZoom);
    setPosition(newPosition);
  }, [zoom, position]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // 只處理 Ctrl/Cmd + 滾輪的縮放事件
    if (e.ctrlKey || e.metaKey) {
      // 阻止事件冒泡和默認行為（避免瀏覽器縮放）
      e.stopPropagation();
      e.preventDefault();
      
      // 獲取容器的位置和大小資訊
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // 計算滑鼠相對於容器左上角的位置
      // 這是在螢幕座標系統中的位置（考慮了滾動）
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 計算新的縮放值
      // deltaY > 0 表示滾輪向下滾動，我們將其解釋為縮小
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      // 限制縮放範圍在 0.4 到 2 之間
      const newZoom = Math.min(Math.max(0.4, zoom + delta), 2);
      // 計算縮放比例（新/舊）
      const zoomFactor = newZoom / zoom;
      
      // 計算滑鼠在畫布邏輯座標系中的位置
      // 1. 先將螢幕座標除以當前縮放比例得到縮放前的座標
      // 2. 再減去當前位移得到邏輯座標
      const logicX = mouseX / zoom - position.x;
      const logicY = mouseY / zoom - position.y;
      
      // 計算新的位置，確保滑鼠指向的內容保持不變
      // 1. 將滑鼠螢幕座標除以新的縮放比例
      // 2. 減去邏輯座標得到新的位移
      // 這樣可以保證滑鼠位置在縮放前後指向畫布中的同一個點
      const newPosition = {
        x: mouseX / newZoom - logicX,
        y: mouseY / newZoom - logicY
      };

      // 更新狀態，觸發重新渲染
      setPosition(newPosition);
      setZoom(newZoom);
    }
  }, [zoom, position]);

  // 拖行相關的處理函數
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 如果點擊的是目標節點或步驟或任務，不觸發畫布拖曳
    if ((e.target as HTMLElement).closest('.goal-node, .step-node, .task-card')) {
      return;
    }

    if (e.button === 0) { // 左鍵點擊
      setIsDragging(true);
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;

      const handleMouseMove = (e: MouseEvent) => {
        setPosition({
          x: e.clientX - startX,
          y: e.clientY - startY,
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [position]);

  // 阻止觸控板的默認縮放行為
  const preventDefault = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
    }
  }, []);

  // 設定 wheel 事件為 non-passive
  React.useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // 觸控相關
      container.addEventListener('touchstart', preventDefault, { passive: false });
      container.addEventListener('touchmove', preventDefault, { passive: false });
      
      // wheel 事件
      const handleWheelPassive = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      };
      container.addEventListener('wheel', handleWheelPassive, { passive: false });

      return () => {
        container.removeEventListener('touchstart', preventDefault);
        container.removeEventListener('touchmove', preventDefault);
        container.removeEventListener('wheel', handleWheelPassive);
      };
    }
  }, [preventDefault]);

  if (!goal) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">找不到目標</p>
      </div>
    );
  }

  const getCenterGoalPosition = () => {
    const totalTasksHeight = goal.steps.reduce((height, step) => {
      return height + (120 + 20) * step.tasks.length;
    }, 0);

    return {
      x: 200,
      y: (totalTasksHeight / 2),
    };
  };

  const getStepPosition = (stepIndex: number, steps: Step[]) => {
    const baseX = 400 + 300;  // 基礎位置
    let baseY = 0;
    
    // 計算前面所有 step 的總高度
    for (let i = 0; i < stepIndex; i++) {
      baseY += (120 + 40) * Math.max(1, steps[i].tasks.length);  // 確保最少有一個 task 的高度
    }
    
    // 計算當前 step 的起始位置
    const currentStepHeight = (120 + 40) * Math.max(1, steps[stepIndex].tasks.length);  // 確保最少有一個 task 的高度
    baseY += currentStepHeight / 2;

    return {
      x: baseX,
      y: baseY
    };
  };

  const getTaskPosition = (stepIndex: number, taskIndex: number, totalTasks: number) => {
    const stepPos = getStepPosition(stepIndex, goal.steps);
    const taskX = 200;
    const cardHeight = 120;
    const cardSpacing = 40;

    // 計算當前任務之前的所有卡片高度和間距
    const currentStepPreviousHeight = (cardHeight * taskIndex) + (cardSpacing * taskIndex);
    
    // 計算整個 step 的總高度（所有卡片高度 + 間距）
    const totalHeight = (cardHeight * totalTasks) + (cardSpacing * (totalTasks - 1));
    
    // 從 step 中心點開始計算位置
    const baseY = stepPos.y - (totalHeight / 2) + currentStepPreviousHeight;

    return {
      x: stepPos.x + taskX,
      y: baseY
    };
  };

  // 計算曲線控制點
  const getCurvePoints = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const controlDistance = distance * 0.5;

    return {
      start,
      end,
      control1: { 
        x: start.x + controlDistance,
        y: start.y
      },
      control2: { 
        x: end.x - controlDistance,
        y: end.y
      },
    };
  };

  const centerGoalPos = getCenterGoalPosition();

  // 新增 step 後重新計算位置並置中到新 step
  const focusOnStep = useCallback((stepId: string) => {
    const stepIndex = goal?.steps.findIndex(s => s.id === stepId) ?? -1;
    if (stepIndex === -1) return;

    const stepPos = getStepPosition(stepIndex, goal.steps);
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 計算新的位置，使 step 位於畫面中心
    const newX = (containerWidth / 2 / zoom) - stepPos.x;
    const newY = (containerHeight / 2 / zoom) - stepPos.y;

    setPosition({ x: newX, y: newY });
  }, [zoom, getStepPosition]);

  // 處理新增 step
  const handleAddStep = useCallback(() => {
    if (!goal) return;

    const newStep = createStep({
      title: '新步驟'
    });

    // 更新 goal store
    const updatedGoal = {
      ...goal,
      steps: [...goal.steps, newStep]
    };
    updateGoal(updatedGoal);


    // 計算新 step 的位置
    const newStepIndex = goal.steps.length; // 新的 step 會是最後一個
    const stepPos = getStepPosition(newStepIndex, updatedGoal.steps);
    const container = containerRef.current;
    if (container) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // 計算所有 step 的總高度（包含新增的 step）
      const totalStepHeight = goal.steps.reduce((total, step) => {
        return total + (120 + 40) * step.tasks.length;
      }, 0) + (120 + 40); // 加上新 step 的預設高度

      // 計算最佳縮放值
      const optimalZoomY = (containerHeight * 0.8) / totalStepHeight;
      const optimalZoom = Math.min(Math.max(0.8, optimalZoomY), 1.5);

      // 計算新的位置，使新的 step 出現在畫面中心偏下
      const newX = (containerWidth / 2 / optimalZoom) - stepPos.x;
      const newY = (containerHeight * 0.7 / optimalZoom) - stepPos.y; // 讓新 step 出現在畫面偏下方

      // 更新縮放和位置
      setZoom(optimalZoom);
      setPosition({ x: newX, y: newY });
    }

    // 設置編輯狀態
    setEditingStepId(newStep.id);
    setEditingStepTitle('新步驟');
    setIsGoalSelected(false);
  }, [goal, updateGoal]);

  // 處理 step 標題更新
  const handleStepTitleUpdate = useCallback((stepId: string, newTitle: string) => {
    if (!goal) return;

    const updatedSteps = goal.steps.map(step => 
      step.id === stepId ? { ...step, title: newTitle } : step
    );

    const updatedGoal = {
      ...goal,
      steps: updatedSteps
    };
    updateGoal(updatedGoal);

    setEditingStepId(null);
    setEditingStepTitle('');
  }, [goal, updateGoal]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative bg-gray-50 overflow-hidden"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Loading 遮罩 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center"
          >
            <div className="w-48 h-48 relative">
              <Lottie
                animationData={loadingAnimation}
                loop={true}
                className="w-full h-full"
              />
            </div>
            <div className="mt-4 text-lg text-purple-600 font-medium">
              正在載入心智圖...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 z-10 flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </motion.button>
        <h1 className="text-xl font-bold text-gray-900">{goal.title}</h1>
      </div>


      <div
        ref={canvasRef}
        className="absolute top-0 left-0"
        style={{
          transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
          transformOrigin: '0 0'
        }}
      >
        <svg
          width="20000"
          height="20000"
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: '200%',
            height: '200%',
            transform: 'translate(-5000px, -5000px)',
            minWidth: '20000px',
            minHeight: '20000px'
          }}
        >
          {goal.steps.map((step, stepIndex) => {
            const stepPos = getStepPosition(stepIndex, goal.steps);
            const stepOffset = stepOffsets[step.id] || { x: 0, y: 0 };
            const curvePoints = getCurvePoints(
              { x: centerGoalPos.x + 96 + goalOffset.x + 5000, y: centerGoalPos.y + goalOffset.y + 5000 },
              { x: stepPos.x - 64 + stepOffset.x + 5000, y: stepPos.y + stepOffset.y + 5000 }
            );

            return (
              <path
                key={`step-line-${step.id}`}
                d={`M ${curvePoints.start.x} ${curvePoints.start.y} 
                    C ${curvePoints.control1.x} ${curvePoints.control1.y},
                      ${curvePoints.control2.x} ${curvePoints.control2.y},
                      ${curvePoints.end.x} ${curvePoints.end.y}`}
                stroke="#818cf8"
                strokeWidth="3"
                fill="none"
              />
            );
          })}

          {goal.steps.map((step, stepIndex) => {
            const stepPos = getStepPosition(stepIndex, goal.steps);
            const stepOffset = stepOffsets[step.id] || { x: 0, y: 0 };
            return step.tasks.map((task, taskIndex) => {
              const taskPos = getTaskPosition(
                stepIndex,
                taskIndex,
                step.tasks.length
              );
              const taskOffset = taskOffsets[task.id] || { x: 0, y: 0 };
              const taskCurvePoints = getCurvePoints(
                { x: stepPos.x + 64 + stepOffset.x + 5000, y: stepPos.y + stepOffset.y + 5000 },
                { x: taskPos.x + taskOffset.x + 5000, y: taskPos.y + 60 + taskOffset.y + 5000 }
              );

              return (
                <path
                  key={`task-line-${task.id}`}
                  d={`M ${taskCurvePoints.start.x} ${taskCurvePoints.start.y} 
                      C ${taskCurvePoints.control1.x} ${taskCurvePoints.control1.y},
                        ${taskCurvePoints.control2.x} ${taskCurvePoints.control2.y},
                        ${taskCurvePoints.end.x} ${taskCurvePoints.end.y}`}
                  stroke={task.status === 'done' 
                    ? '#34d399'
                    : task.status === 'in_progress'
                    ? '#f97316'
                    : '#0ea5e9'
                  }
                  strokeWidth="2.5"
                  fill="none"
                />
              );
            });
          })}
        </svg>

        <motion.div
          className="absolute goal-node"
          style={{
            left: centerGoalPos.x - 96,
            top: centerGoalPos.y - 96,
            transform: 'none',
            x: goalX,
            y: goalY
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          drag
          dragMomentum={false}
          dragElastic={0}
          onDragStart={(e) => {
            e.stopPropagation();
            console.log('Goal drag start');
          }}
          onDrag={(e) => {
            e.stopPropagation();
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            console.log('Goal drag end');
            console.log('Final position:', {
              x: goalX.get(),
              y: goalY.get()
            });
          }}
          whileDrag={{ 
            scale: 1.05,
            zIndex: 50 
          }}
          whileHover={{ 
            scale: 1.02 
          }}
        >
          <div 
            className="group relative w-48 h-48 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-purple-200 flex items-center justify-center p-6 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:border-purple-400 hover:shadow-[0_0_0_4px_rgba(99,102,241,0.2)]"
            onClick={() => setIsGoalSelected(!isGoalSelected)}
          >
            <div className="text-center">
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              <h2 className="text-lg font-bold text-purple-700">{goal.title}</h2>
            </div>

            {/* 新增步驟按鈕 */}
            <div 
              className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{
                right: '0px',
                top: '75%',
                transform: 'translate(50%, -50%)',
              }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddStep();
                }}
                className="w-9 h-9 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {goal.steps.map((step, stepIndex) => {
            const stepPos = getStepPosition(stepIndex, goal.steps);
            const isSelected = selectedStepId === step.id;

            return (
              <React.Fragment key={step.id}>
                <motion.div
                  className="absolute"
                  style={{
                    left: stepPos.x - 64,
                    top: stepPos.y - 64,
                    transform: 'none'
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <motion.button
                    drag={editingStepId !== step.id}
                    dragMomentum={false}
                    onDragStart={(event, info) => {
                      if (editingStepId === step.id) return;
                      setIsDraggingStep(step.id);
                    }}
                    onDrag={(event, info) => {
                      if (editingStepId === step.id) return;
                      const dx = info.delta.x;
                      const dy = info.delta.y;

                      setStepOffsets(prev => {
                        const currentOffset = prev[step.id] || { x: 0, y: 0 };
                        return {
                          ...prev,
                          [step.id]: {
                            x: currentOffset.x + dx,
                            y: currentOffset.y + dy
                          }
                        };
                      });
                    }}
                    onDragEnd={() => {
                      if (editingStepId === step.id) return;
                      setIsDraggingStep(null);
                    }}
                    onClick={() => setSelectedStepId(isSelected ? null : step.id)}
                    onDoubleClick={() => {
                      setEditingStepId(step.id);
                      setEditingStepTitle(step.title);
                    }}
                    className={`step-node w-32 h-32 rounded-full ${
                      isSelected
                        ? 'border-4 border-indigo-400 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]'
                        : 'border-4'
                    } bg-gradient-to-br ${
                      getStepColors(stepIndex, goal.steps.length).gradient
                    } border-${
                      getStepColors(stepIndex, goal.steps.length).border
                    } flex items-center justify-center p-4 shadow-lg transition-colors duration-200 hover:scale-105 hover:shadow-xl transition-all duration-200 ${editingStepId === step.id ? 'cursor-text' : 'cursor-move'}`}
                    whileHover={{ scale: editingStepId === step.id ? 1 : 1.1 }}
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                  >
                    <div className="text-center">
                      {editingStepId === step.id ? (
                        <input
                          type="text"
                          value={editingStepTitle}
                          onChange={(e) => setEditingStepTitle(e.target.value)}
                          onBlur={() => handleStepTitleUpdate(step.id, editingStepTitle)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleStepTitleUpdate(step.id, editingStepTitle);
                            } else if (e.key === 'Escape') {
                              setEditingStepId(null);
                              setEditingStepTitle('');
                            }
                          }}
                          className="w-full text-center bg-transparent border-b border-purple-300 focus:outline-none focus:border-purple-500 px-1"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <ListTodo className={`w-8 h-8 mx-auto mb-1 ${
                            getStepColors(stepIndex, goal.steps.length).icon
                          }`} />
                          <h3 className={`text-sm font-bold ${
                            getStepColors(stepIndex, goal.steps.length).text
                          }`}>{step.title}</h3>
                        </>
                      )}
                    </div>
                  </motion.button>
                </motion.div>

                <AnimatePresence>
                  {step.tasks.map((task, taskIndex) => {
                    const taskPos = getTaskPosition(
                      stepIndex,
                      taskIndex,
                      step.tasks.length
                    );

                    return (
                      <motion.div
                        key={task.id}
                        className="absolute"
                        style={{
                          left: taskPos.x,
                          top: taskPos.y,
                          transform: 'none'
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 260,
                          damping: 20,
                        }}
                      >
                        <motion.div
                          drag
                          dragMomentum={false}
                          whileDrag={{ scale: 1.02, zIndex: 40 }}
                          onDragStart={() => {
                            // 不需要保存初始位置
                          }}
                          onDrag={(event, info) => {
                            const dx = info.delta.x;
                            const dy = info.delta.y;

                            setTaskOffsets(prev => {
                              const currentOffset = prev[task.id] || { x: 0, y: 0 };
                              return {
                                ...prev,
                                [task.id]: {
                                  x: currentOffset.x + dx,
                                  y: currentOffset.y + dy
                                }
                              };
                            });
                          }}
                          onDragEnd={() => {
                            console.log('Task drag end offsets:', taskOffsets);
                          }}
                          className={`task-card w-64 p-4 rounded-2xl shadow-lg border-2 cursor-move ${
                            task.status === 'done'
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                              : task.status === 'in_progress'
                              ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                              : 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <motion.button
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                task.status === 'done'
                                  ? 'border-green-500 bg-green-100'
                                  : task.status === 'in_progress'
                                  ? 'border-orange-500 bg-orange-100'
                                  : 'border-pink-300 bg-white'
                              }`}
                            >
                              {task.status === 'done' && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                              {task.status === 'in_progress' && (
                                <Clock className="w-4 h-4 text-orange-500" />
                              )}
                            </motion.button>
                            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              task.status === 'done'
                                ? 'bg-green-200 text-green-800'
                                : task.status === 'in_progress'
                                ? 'bg-orange-200 text-orange-800'
                                : 'bg-pink-200 text-pink-800'
                            }`}>
                              {task.status === 'done'
                                ? '已完成'
                                : task.status === 'in_progress'
                                ? '進行中'
                                : '未開始'}
                            </div>
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-gray-900">{task.title}</h3>
                          <div className="h-[20px] mt-2">
                            {task.completedAt && (
                              <p className="text-xs text-gray-500">
                                完成於 {new Date(task.completedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-2xl shadow-xl bg-white/80 backdrop-blur border border-gray-200" style={{minWidth:'fit-content'}}>
        <button
          onClick={() => {
            const optimalView = calculateOptimalView();
            if (optimalView) {
              setZoom(optimalView.zoom);
              setPosition(optimalView.position);
            }
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          title="置中"
        >
          <Target className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={() => handleZoom(0.1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          title="放大"
        >
          <ZoomIn className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-16 text-center font-mono text-sm text-gray-600">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => handleZoom(-0.1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          title="縮小"
        >
          <ZoomOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}; 