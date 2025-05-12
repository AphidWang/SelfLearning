import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Target, ListTodo, ZoomIn, ZoomOut } from 'lucide-react';
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
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoom = useCallback((delta: number) => {
    setZoom((prevZoom) => {
      const newZoom = prevZoom + delta;
      return Math.min(Math.max(0.5, newZoom), 2);
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    }
  }, [handleZoom]);

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

  const getStepPosition = (index: number, total: number) => {
    const radius = 300;
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const getTaskPosition = (stepIndex: number, taskIndex: number, totalTasks: number) => {
    const stepPos = getStepPosition(stepIndex, goal.steps.length);
    const taskRadius = 200;
    const angle = (taskIndex * 2 * Math.PI) / totalTasks - Math.PI / 2;
    return {
      x: stepPos.x + Math.cos(angle) * taskRadius,
      y: stepPos.y + Math.sin(angle) * taskRadius,
    };
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative bg-gray-50 overflow-hidden"
      onWheel={handleWheel}
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

      <div className="absolute top-4 right-4 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          新增任務
        </motion.button>
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => handleZoom(0.1)}
          className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-50"
        >
          <ZoomIn className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-50"
        >
          <ZoomOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div 
        className="relative w-full h-full"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out'
        }}
      >
        {/* 中心目標 */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <div className="w-48 h-48 rounded-full bg-indigo-100 border-4 border-indigo-200 flex items-center justify-center p-6 shadow-lg">
            <div className="text-center">
              <Target className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
              <h2 className="text-lg font-bold text-indigo-700">{goal.title}</h2>
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
                  className="absolute left-1/2 top-1/2"
                  initial={{ scale: 0, x: '-50%', y: '-50%' }}
                  animate={{
                    scale: 1,
                    x: `calc(${stepPos.x}px - 50%)`,
                    y: `calc(${stepPos.y}px - 50%)`,
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <motion.button
                    onClick={() => setSelectedStepId(isSelected ? null : step.id)}
                    className={`w-32 h-32 rounded-full ${
                      isSelected
                        ? 'bg-blue-200 border-blue-300'
                        : 'bg-blue-100 border-blue-200'
                    } border-4 flex items-center justify-center p-4 shadow-lg transition-colors duration-200`}
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="text-center">
                      <ListTodo className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                      <h3 className="text-sm font-bold text-blue-700">
                        {step.title}
                      </h3>
                    </div>
                  </motion.button>
                </motion.div>

                {/* 任務卡片 */}
                <AnimatePresence>
                  {isSelected &&
                    step.tasks.map((task, taskIndex) => {
                      const taskPos = getTaskPosition(
                        stepIndex,
                        taskIndex,
                        step.tasks.length
                      );

                      return (
                        <motion.div
                          key={task.id}
                          className="absolute left-1/2 top-1/2"
                          initial={{ scale: 0, x: '-50%', y: '-50%' }}
                          animate={{
                            scale: 1,
                            x: `calc(${taskPos.x}px - 50%)`,
                            y: `calc(${taskPos.y}px - 50%)`,
                          }}
                          exit={{ scale: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 20,
                          }}
                        >
                          <div className="w-64 p-4 rounded-2xl shadow-lg border-2 bg-emerald-50 border-emerald-200">
                            <div className="flex justify-between items-start">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="w-6 h-6 rounded-full border-2 flex items-center justify-center border-emerald-300 bg-white"
                              />
                              <div className="flex items-center px-2 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700">
                                <span className="text-xs font-medium">進行中</span>
                              </div>
                            </div>
                            <h3 className="mt-3 text-lg font-semibold text-emerald-900">
                              {task.title}
                            </h3>
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
    </div>
  );
}; 