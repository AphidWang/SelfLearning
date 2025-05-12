import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Target, ListTodo, ZoomIn, ZoomOut, Move, CheckCircle2, Clock } from 'lucide-react';
import { useGoalStore } from '../../store/goalStore';
import { Goal, Step, Task } from '../../types/goal';

interface GoalMindMapProps {
  goalId: string;
  onBack?: () => void;
}

export const GoalMindMap: React.FC<GoalMindMapProps> = ({ goalId, onBack }) => {
  const { goals } = useGoalStore();
  const goal = goals.find((g) => g.id === goalId);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);

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


    // 讓大目標圓心對齊 container 垂直正中央
    const cardHeight = 120;
    const cardSpacing = 20;
    let totalHeight = 0;
    goal.steps.forEach((step) => {
      const stepHeight = Math.max(1, step.tasks.length) * (cardHeight + cardSpacing);
      totalHeight += stepHeight;
    });
    const centerGoalY = totalHeight / 2;

    // 計算最佳縮放值
    const optimalZoomX = (containerWidth * 0.75) / rightmostX; // 75% 的容器寬度
    const optimalZoomY = (containerHeight * 0.8) / totalHeight; // 80% 的容器高度
    const optimalZoom = Math.min(optimalZoomX, optimalZoomY, 1); // 不超過 1

    const optimalY = (containerHeight * 0.5) - centerGoalY;
    // 水平同前
    const optimalX = (containerWidth * 0.15) - 200;

    
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

  // 添加視窗大小改變時的重新計算
  useEffect(() => {
    const handleResize = () => {
      const optimalView = calculateOptimalView();
      if (optimalView) {
        setZoom(optimalView.zoom);
        setPosition(optimalView.position);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateOptimalView]);

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

  const getStepPosition = (stepIndex: number, total: number) => {
    const baseX = 400; // 起始 X 位置
    const baseY = 0; // 中心 Y 位置
    const stepX = 300; // X 軸間距

    // 計算當前步驟之前所有任務的總高度
    let previousHeight = 0;
    for (let i = 0; i < stepIndex; i++) {
      previousHeight += (120 + 20) * goal.steps[i].tasks.length;
    }

    // 計算當前步驟的任務總高度
    const currentStepHeight = (120 + 20) * goal.steps[stepIndex].tasks.length;

    // 計算當前步驟之前所有步驟的總高度
    const totalPreviousHeight = previousHeight;

    // 計算當前步驟的垂直位置，使其位於其任務範圍的中間
    const stepY = baseY + totalPreviousHeight + (currentStepHeight / 2);

    return {
      x: baseX + stepX,
      y: stepY,
    };
  };

  // 計算中心目標的位置
  const getCenterGoalPosition = () => {
    // 計算所有步驟的任務總高度
    const totalTasksHeight = goal.steps.reduce((height, step) => {
      return height + (120 + 20) * step.tasks.length;
    }, 0);

    return {
      x: 200,
      y: (totalTasksHeight / 2), // 將中心目標放在所有任務的中間位置
    };
  };

  const getTaskPosition = (stepIndex: number, taskIndex: number, totalTasks: number) => {
    const stepPos = getStepPosition(stepIndex, goal.steps.length);
    const taskX = 200; // 任務相對於步驟的 X 偏移
    const cardHeight = 120; // 卡片高度
    const cardSpacing = 20; // 卡片間距

    // 計算當前步驟中之前任務的高度
    const currentStepPreviousHeight = (cardHeight + cardSpacing) * taskIndex;

    return {
      x: stepPos.x + taskX,
      y: stepPos.y - (cardHeight * totalTasks + cardSpacing * (totalTasks - 1)) / 2 + currentStepPreviousHeight,
    };
  };

  // 計算曲線控制點
  const getCurvePoints = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const controlX = start.x + (end.x - start.x) * 0.5;
    return {
      start,
      end,
      control1: { x: controlX, y: start.y },
      control2: { x: controlX, y: end.y },
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
        className="relative w-full h-full"
        style={{
          transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {/* 所有連接線的容器 */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ 
            zIndex: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible'
          }}
        >
          {/* 中心目標到步驟的連接線 */}
          {goal.steps.map((step, stepIndex) => {
            const stepPos = getStepPosition(stepIndex, goal.steps.length);
            const curvePoints = getCurvePoints(
              { x: centerGoalPos.x + 96, y: centerGoalPos.y }, // 從中心目標圓圈右側開始
              { x: stepPos.x - 64, y: stepPos.y } // 連接到步驟圓圈左側
            );

            return (
              <path
                key={`step-line-${step.id}`}
                d={`M ${curvePoints.start.x} ${curvePoints.start.y} 
                    C ${curvePoints.control1.x} ${curvePoints.control1.y},
                      ${curvePoints.control2.x} ${curvePoints.control2.y},
                      ${curvePoints.end.x} ${curvePoints.end.y}`}
                stroke="#818cf8"  // indigo-400，更活潑的紫色
                strokeWidth="3"
                className="transition-all duration-300"
                fill="none"
              />
            );
          })}

          {/* 步驟到任務的連接線 */}
          {goal.steps.map((step, stepIndex) => {
            const stepPos = getStepPosition(stepIndex, goal.steps.length);
            return step.tasks.map((task, taskIndex) => {
              const taskPos = getTaskPosition(
                stepIndex,
                taskIndex,
                step.tasks.length
              );
              const taskCurvePoints = getCurvePoints(
                { x: stepPos.x + 64, y: stepPos.y }, // 從步驟圓圈右側開始
                { x: taskPos.x, y: taskPos.y + 60 } // 連接到任務卡片左側中間
              );

              return (
                <path
                  key={`task-line-${task.id}`}
                  d={`M ${taskCurvePoints.start.x} ${taskCurvePoints.start.y} 
                      C ${taskCurvePoints.control1.x} ${taskCurvePoints.control1.y},
                        ${taskCurvePoints.control2.x} ${taskCurvePoints.control2.y},
                        ${taskCurvePoints.end.x} ${taskCurvePoints.end.y}`}
                  stroke={task.status === 'done' 
                    ? '#34d399'  // green-400
                    : task.status === 'in_progress'
                    ? '#f97316'  // orange-500
                    : '#0ea5e9'  // sky-500
                  }
                  strokeWidth="2.5"
                  className="transition-all duration-300"
                  fill="none"
                />
              );
            });
          })}
        </svg>

        {/* 中心目標 */}
        <motion.div
          className="absolute"
          initial={{ scale: 0, x: centerGoalPos.x - 96, y: centerGoalPos.y - 96 }}
          animate={{ 
            scale: 1,
            x: centerGoalPos.x - 96,
            y: centerGoalPos.y - 96,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-purple-200 flex items-center justify-center p-6 shadow-lg">
            <div className="text-center">
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              <h2 className="text-lg font-bold text-purple-700">{goal.title}</h2>
            </div>
          </div>
        </motion.div>

        {/* 步驟和任務 */}
        <AnimatePresence>
          {goal.steps.map((step, stepIndex) => {
            const stepPos = getStepPosition(stepIndex, goal.steps.length);
            const isSelected = selectedStepId === step.id;

            return (
              <React.Fragment key={step.id}>
                {/* 步驟節點 */}
                <motion.div
                  className="absolute"
                  initial={{ scale: 0, x: stepPos.x - 64, y: stepPos.y - 64 }}
                  animate={{
                    scale: 1,
                    x: stepPos.x - 64,
                    y: stepPos.y - 64,
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <motion.button
                    onClick={() => setSelectedStepId(isSelected ? null : step.id)}
                    className={`w-32 h-32 rounded-full ${
                      isSelected
                        ? 'border-4 border-indigo-400 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]'
                        : 'border-4'
                    } bg-gradient-to-br ${
                      stepIndex === 0
                        ? 'from-rose-100 to-pink-100 border-rose-200'
                        : stepIndex === 1
                        ? 'from-orange-100 to-amber-100 border-orange-200'
                        : stepIndex === 2
                        ? 'from-yellow-100 to-lime-100 border-yellow-200'
                        : 'from-emerald-100 to-teal-100 border-emerald-200'
                    } flex items-center justify-center p-4 shadow-lg transition-colors duration-200 hover:scale-105 hover:shadow-xl transition-all duration-200`}
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="text-center">
                      <ListTodo className={`w-8 h-8 mx-auto mb-1 ${
                        stepIndex === 0
                          ? 'text-rose-500'
                          : stepIndex === 1
                          ? 'text-orange-500'
                          : stepIndex === 2
                          ? 'text-yellow-500'
                          : 'text-emerald-500'
                      }`} />
                      <h3 className={`text-sm font-bold ${
                        stepIndex === 0
                          ? 'text-rose-700'
                          : stepIndex === 1
                          ? 'text-orange-700'
                          : stepIndex === 2
                          ? 'text-yellow-700'
                          : 'text-emerald-700'
                      }`}>{step.title}</h3>
                    </div>
                  </motion.button>
                </motion.div>

                {/* 任務卡片 */}
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
                        initial={{ scale: 0, x: taskPos.x, y: taskPos.y }}
                        animate={{
                          scale: 1,
                          x: taskPos.x,
                          y: taskPos.y,
                        }}
                        exit={{ scale: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 260,
                          damping: 20,
                        }}
                      >
                        <div className={`w-64 p-4 rounded-2xl shadow-lg border-2 ${
                          task.status === 'done'
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                            : task.status === 'in_progress'
                            ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                            : 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200'
                        }`}>
                          <div className="flex justify-between items-start">
                            <motion.button
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                task.status === 'done'
                                  ? 'border-green-500 bg-green-100'
                                  : task.status === 'in_progress'
                                  ? 'border-orange-500 bg-orange-100'
                                  : 'border-sky-300 bg-white'
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
                                : 'bg-sky-200 text-sky-800'
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
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </div>

      {/* footbar 置底按鈕列 - Figma style */}
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