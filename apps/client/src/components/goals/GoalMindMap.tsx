import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Target, ListTodo, ZoomIn, ZoomOut, Move, CheckCircle2, Clock } from 'lucide-react';
import { useGoalStore } from '../../store/goalStore';
import { Goal, Step, Task } from '../../types/goal';

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
  const { goals } = useGoalStore();
  const goal = goals.find((g) => g.id === goalId);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [stepOffsets, setStepOffsets] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [taskOffsets, setTaskOffsets] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [dragStartPositions, setDragStartPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [isDraggingStep, setIsDraggingStep] = useState<string | null>(null);
  const [goalPosition, setGoalPosition] = useState<{ x: number; y: number }>({ x: 200, y: 0 });

  // 計算最佳視圖位置和縮放值
  const calculateOptimalView = useCallback(() => {
    if (!containerRef.current || !goal) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 計算每個 step 的高度，取最大值
    const maxStepHeight = Math.max(...goal.steps.map(step => (120 + 20) * step.tasks.length), 0);

    // 計算最右側任務的 X 位置
    const rightmostX = 400 + 300 + 200 + 256; // baseX + stepX + taskX + taskWidth

    // 計算最佳縮放值
    const optimalZoomX = (containerWidth * 0.75) / rightmostX; // 75% 的容器寬度
    const optimalZoomY = (containerHeight * 0.8) / maxStepHeight; // 80% 的容器高度
    const optimalZoom = Math.min(optimalZoomX, optimalZoomY, 1); // 不超過 1

    // 計算初始位置，讓畫布置中
    const totalWidth = rightmostX;
    const totalHeight = maxStepHeight;
    const optimalX = (containerWidth - totalWidth * optimalZoom) / 2;
    const optimalY = (containerHeight - totalHeight * optimalZoom) / 2;

    return {
      zoom: optimalZoom,
      position: { x: optimalX, y: optimalY }
    };
  }, [goal]);

  useEffect(() => {
    if (initialLoad) {
      setTimeout(() => {
        const optimalView = calculateOptimalView();
        if (optimalView) {
          setZoom(optimalView.zoom);
          setPosition(optimalView.position);
        }
        setInitialLoad(false);
      }, 500);
    }
  }, [initialLoad, calculateOptimalView]);

  // 初始化 offsets
  useEffect(() => {
    if (goal) {
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
    setZoom((prevZoom) => {
      const newZoom = prevZoom + delta;
      return Math.min(Math.max(0.4, newZoom), 2);
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      
      // 獲取滑鼠在容器中的相對位置
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 計算滑鼠相對於當前視圖中心的位置
      const viewCenterX = rect.width / 2;
      const viewCenterY = rect.height / 2;
      
      // 計算滑鼠相對於視圖中心的偏移
      const offsetX = mouseX - viewCenterX;
      const offsetY = mouseY - viewCenterY;
      
      // 計算縮放比例
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newZoom = Math.min(Math.max(0.4, zoom + delta), 2);
      const zoomFactor = newZoom / zoom;
      
      // 更新位置，使滑鼠指向的點保持不變
      setPosition({
        x: position.x - (offsetX * (zoomFactor - 1)),
        y: position.y - (offsetY * (zoomFactor - 1))
      });
      
      setZoom(newZoom);
    }
  }, [zoom, position]);

  // 拖行相關的處理函數
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 如果點擊的是步驟或任務，不觸發畫布拖曳
    if ((e.target as HTMLElement).closest('.step-node, .task-card')) {
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

  React.useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', preventDefault, { passive: false });
      container.addEventListener('touchmove', preventDefault, { passive: false });
      return () => {
        container.removeEventListener('touchstart', preventDefault);
        container.removeEventListener('touchmove', preventDefault);
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

  const getStepPosition = (stepIndex: number) => {
    const baseX = 400 + 300;  // 基礎位置
    let baseY = 0;
    for (let i = 0; i < stepIndex; i++) {
      baseY += (120 + 20) * goal.steps[i].tasks.length;
    }
    baseY += ((120 + 20) * goal.steps[stepIndex].tasks.length) / 2;

    return {
      x: baseX,
      y: baseY
    };
  };

  const getTaskPosition = (stepIndex: number, taskIndex: number, totalTasks: number) => {
    const stepPos = getStepPosition(stepIndex);
    const taskX = 200;
    const cardHeight = 120;
    const cardSpacing = 20;

    const currentStepPreviousHeight = (cardHeight + cardSpacing) * taskIndex;
    const baseY = stepPos.y - (cardHeight * totalTasks + cardSpacing * (totalTasks - 1)) / 2 + currentStepPreviousHeight;

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

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative bg-gray-50 overflow-hidden"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
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

      <div className="absolute top-4 right-4 z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          新增任務
        </motion.button>
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
            const stepPos = getStepPosition(stepIndex);
            const stepOffset = stepOffsets[step.id] || { x: 0, y: 0 };
            const curvePoints = getCurvePoints(
              { x: centerGoalPos.x + 96 + 5000, y: centerGoalPos.y + 5000 },
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
            const stepPos = getStepPosition(stepIndex);
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
          className="absolute"
          style={{
            left: centerGoalPos.x - 96,
            top: centerGoalPos.y - 96,
            transform: 'none'
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-purple-200 flex items-center justify-center p-6 shadow-lg">
            <div className="text-center">
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              <h2 className="text-lg font-bold text-purple-700">{goal.title}</h2>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {goal.steps.map((step, stepIndex) => {
            const stepPos = getStepPosition(stepIndex);
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
                    drag
                    dragMomentum={false}
                    onDragStart={(event, info) => {
                      setIsDraggingStep(step.id);
                    }}
                    onDrag={(event, info) => {
                      const dx = info.delta.x / zoom;
                      const dy = info.delta.y / zoom;

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
                      setIsDraggingStep(null);
                      console.log('Step drag end offsets:', stepOffsets);
                    }}
                    onClick={() => setSelectedStepId(isSelected ? null : step.id)}
                    className={`step-node w-32 h-32 rounded-full ${
                      isSelected
                        ? 'border-4 border-indigo-400 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]'
                        : 'border-4'
                    } bg-gradient-to-br ${
                      getStepColors(stepIndex, goal.steps.length).gradient
                    } border-${
                      getStepColors(stepIndex, goal.steps.length).border
                    } flex items-center justify-center p-4 shadow-lg transition-colors duration-200 hover:scale-105 hover:shadow-xl transition-all duration-200 cursor-move`}
                    whileHover={{ scale: 1.1 }}
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                  >
                    <div className="text-center">
                      <ListTodo className={`w-8 h-8 mx-auto mb-1 ${
                        getStepColors(stepIndex, goal.steps.length).icon
                      }`} />
                      <h3 className={`text-sm font-bold ${
                        getStepColors(stepIndex, goal.steps.length).text
                      }`}>{step.title}</h3>
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
                            const dx = info.delta.x / zoom;
                            const dy = info.delta.y / zoom;

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
                          {task.completedAt && (
                            <p className="mt-2 text-xs text-gray-500">
                              完成於 {new Date(task.completedAt).toLocaleDateString()}
                            </p>
                          )}
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