import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionValueEvent } from 'framer-motion';
import { ArrowLeft, Plus, Target, ListTodo, ZoomIn, ZoomOut, CheckCircle2, Clock, Share2, Sparkles, RotateCcw, FilePlus, Power, LayoutGrid, ArrowLeftRight, RefreshCw, MessageSquare } from 'lucide-react';
import { useGoalStore, isDefaultGoal } from '../../store/goalStore';
import { Goal, Step, Task } from '../../types/goal';
import Lottie from 'lottie-react';
import loadingAnimation from '../../assets/lottie/mind-map-loading.json';
import mindMapBg from '../../assets/images/mindmap-bg.jpg';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { FloatingAssistant } from '../assistant/FloatingAssistant';
import { PanelAssistant } from '../assistant/PanelAssistant';
import { useAssistant } from '../../hooks/useAssistant';
import { MindMapService } from '../../services/mindmap';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useNavigate } from 'react-router-dom';

interface GoalMindMapProps {
  goalId: string;
  onBack?: () => void;
}

interface Node {
  id: string;
  type: 'goal' | 'step' | 'task' | 'bubble';
  title: string;
  parentId?: string;
  children?: Node[];
  position: { x: number; y: number };
  bubbleType?: 'impression' | 'background';
  content?: string;
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

const useElementStack = (initialValue = 1) => {
  const [stackIndexes, setStackIndexes] = useState<{ [key: string]: number }>({});
  
  const bringToFront = useCallback((id: string) => {
    const currentMax = Object.values(stackIndexes).reduce((max, z) => Math.max(max, z), initialValue);
    setStackIndexes(prev => ({
      ...prev,
      [id]: currentMax + 1
    }));
  }, [stackIndexes, initialValue]);

  const getIndex = useCallback((id: string) => stackIndexes[id] || initialValue, [stackIndexes, initialValue]);

  return { bringToFront, getIndex };
};

// 計算所有可見元素的邊界
const calculateContentBounds = (
  canvasRef: React.RefObject<HTMLDivElement>,
  goal: Goal | undefined,
  zoom: number,
  position: { x: number; y: number }
) => {
  if (!canvasRef.current || !goal) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // 獲取所有需要計算的元素
  const elements = canvasRef.current.querySelectorAll('.goal-node, .step-node, .task-card');
  
  elements.forEach(element => {
    const rect = element.getBoundingClientRect();
    const scale = zoom; // 當前縮放值
    
    // 計算實際位置（考慮縮放和位移）
    const actualLeft = (rect.left - position.x * scale) / scale;
    const actualTop = (rect.top - position.y * scale) / scale;
    const actualRight = actualLeft + rect.width / scale;
    const actualBottom = actualTop + rect.height / scale;

    minX = Math.min(minX, actualLeft);
    minY = Math.min(minY, actualTop);
    maxX = Math.max(maxX, actualRight);
    maxY = Math.max(maxY, actualBottom);
  });

  // 添加邊距
  const padding = 50;
  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: maxX - minX + (padding * 2),
    height: maxY - minY + (padding * 2)
  };
};

export const GoalMindMap: React.FC<GoalMindMapProps> = ({ goalId, onBack }) => {
  const { goals, addGoal } = useGoalStore();
  const goal = goalId === 'new' ? null : goals.find((g) => g.id === goalId);
  const mindMapService = React.useMemo(() => {
    return new MindMapService(goalId);
  }, [goalId]);
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
  const [taskZIndexes, setTaskZIndexes] = useState<{ [key: string]: number }>({});
  const baseZIndex = 1;
  const [assistantMode, setAssistantMode] = useState<'floating' | 'panel'>('floating');
  const [bubbles, setBubbles] = useState<Node[]>([]);
  const [bubbleOffsets, setBubbleOffsets] = useState<{ [key: string]: { x: number; y: number } }>({});

  // 當 goalId 改變時重置狀態
  useEffect(() => {
    setInitialLoad(true);
    setIsLoading(true);
    setZoom(0.8);
    setPosition({ x: 0, y: 0 });
  }, [goalId]);

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
      // 確保每個 step 至少有最小高度
      const stepHeight = Math.max(120, (120 + 40) * Math.max(1, step.tasks.length));
      return total + stepHeight;
    }, 0);

    // 如果沒有 step，使用預設高度
    const effectiveTotalHeight = totalStepHeight || 10;

    // 計算整個畫布的寬度（從最左到最右）
    const centerGoalX = 0;  // 中心目標的 x 位置
    const hasSteps = goal.steps.length > 0;
    const hasTasks = goal.steps.some(step => step.tasks.length > 0);
    
    // 根據是否有 step 和 task 決定最右邊的位置
    const rightmostTaskX = hasSteps 
      ? (hasTasks 
        ? 400 + 300 + 200 + 256 + 100  // 有 step 有 task
        : 400 + 300 + 100)             // 有 step 無 task
      : 400 + 100;                     // 無 step
    
    const leftmostX = centerGoalX;  // 中心目標左邊的空間
    const totalWidth = rightmostTaskX - leftmostX;  // 整個畫布的實際寬度

    // 計算最佳縮放值
    const optimalZoomX = (containerWidth * 0.8) / totalWidth;
    const optimalZoomY = (containerHeight * 0.8) / effectiveTotalHeight;
    const optimalZoom = Math.min(Math.max(0.8, Math.min(optimalZoomX, optimalZoomY)), 1.2);

    // 計算目標應該在的位置（螢幕的左邊）
    const targetScreenX = hasSteps ? containerWidth * 0.1 : containerWidth * 0.35;
    
    // 計算需要的 translate 值
    const optimalX = (targetScreenX - centerGoalX * optimalZoom) / optimalZoom;
    // 計算 Y 軸位置
    const optimalY = (containerHeight - effectiveTotalHeight * optimalZoom) / 2 / optimalZoom;

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
          
          // 獲取容器的位置和大小資訊
          const rect = container.getBoundingClientRect();
          if (!rect) return;
          
          // 計算滑鼠相對於容器左上角的位置
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          // 計算新的縮放值
          const delta = e.deltaY > 0 ? -0.05 : 0.05;
          const newZoom = Math.min(Math.max(0.4, zoom + delta), 2);
          
          // 計算滑鼠在畫布邏輯座標系中的位置
          const logicX = mouseX / zoom - position.x;
          const logicY = mouseY / zoom - position.y;
          
          // 計算新的位置
          const newPosition = {
            x: mouseX / newZoom - logicX,
            y: mouseY / newZoom - logicY
          };

          // 更新狀態
          setPosition(newPosition);
          setZoom(newZoom);
        }
      };

      container.addEventListener('wheel', handleWheelPassive, { passive: false });

      return () => {
        container.removeEventListener('touchstart', preventDefault);
        container.removeEventListener('touchmove', preventDefault);
        container.removeEventListener('wheel', handleWheelPassive);
      };
    }
  }, [preventDefault, zoom, position]);

  // 拖行相關的處理函數
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('Canvas mouse down event triggered');
    // 如果點擊的是助理或其相關元素，不觸發畫布拖曳
    if ((e.target as HTMLElement).closest('.floating-assistant, .goal-node, .step-node, .task-card, .bubble-node')) {
      return;
    }

    if (e.button === 0) { // 左鍵點擊
      // 防止文字選取
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      
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
        // 恢復文字選取
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [position]);

  // 計算右下角位置
  const calculateBottomRightPosition = () => {
    return {
      x: -150,  // 與 FloatingAssistant 的 initialPosition 一致
      y: -150   // 與 FloatingAssistant 的 initialPosition 一致
    };
  };

  const { isVisible: showAssistant, position: assistantPosition, setPosition: setAssistantPosition, toggleAssistant: originalToggleAssistant } = useAssistant({
    position: calculateBottomRightPosition()
  });

  // 包裝 toggleAssistant，在切換時重置位置
  const handleToggleAssistant = () => {
    originalToggleAssistant();
    // 如果是要開啟小幫手，重置到預設位置
    if (!showAssistant) {
      setAssistantPosition(calculateBottomRightPosition());
    }
  };

  // 處理小幫手拖曳結束
  const handleAssistantDragEnd = (position: { x: number; y: number }) => {
    console.log('Assistant dropped at screen position:', position);
  };

  // 飛到指定元素旁邊
  const flyToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // 取得容器資訊
    const container = containerRef.current;
    if (!container) return;

    const elementRect = element.getBoundingClientRect();
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 計算需要的位移
    // 1. 計算元素中心點
    const elementCenterX = elementRect.left + elementRect.width / 2;
    const elementCenterY = elementRect.top + elementRect.height / 2;

    // 2. 計算容器中心點
    const containerCenterX = containerWidth / 2;
    const containerCenterY = containerHeight / 2;

    // 3. 計算需要的位移（從元素到容器中心）
    const dx = containerCenterX - elementCenterX;
    const dy = containerCenterY - elementCenterY;

    // 4. 更新位置（考慮縮放）
    const newPosition = {
      x: position.x + dx / zoom,
      y: position.y + dy / zoom
    };

    console.log('🎯 計算後的位置', { 
      current: {
        x: position.x,
        y: position.y
      },
      element: {
        centerX: elementCenterX,
        centerY: elementCenterY
      },
      container: {
        centerX: containerCenterX,
        centerY: containerCenterY
      },
      delta: {
        dx,
        dy
      },
      new: newPosition,
      zoom
    });

    // 更新畫布位置
    setPosition(newPosition);

    // 等待畫布移動動畫完成後清除 focus
    setTimeout(() => {
      mindMapService.clearFocusElement();
    }, 500);
  };

  useEffect(() => {
    const unsubscribe = useGoalStore.subscribe((state) => {
      const currentGoal = state.goals.find(g => g.id === goalId);
      if (currentGoal?.focusElement) {
        const elementId = `${currentGoal.focusElement.type}-${currentGoal.focusElement.id}`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            flyToElement(elementId);
          });
        });
      }
    });

    return () => unsubscribe();
  }, [goalId, mindMapService, position, zoom]);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editingGoalTitle, setEditingGoalTitle] = useState('');

  const handleGoalTitleUpdate = (newTitle: string) => {
    if (!goal || !newTitle.trim()) return;
    
    const updatedGoal = {
      ...goal,
      title: newTitle.trim()
    };
    mindMapService.updateGoal(updatedGoal);
    setIsEditingGoal(false);
  };

  const getStepPosition = (stepIndex: number, steps: Step[]) => {
    const baseX = 400 + 300;  // 基礎位置
    let baseY = 0;
    
    // 計算前面所有 step 的總高度
    for (let i = 0; i < stepIndex; i++) {
      baseY += (120 + 40) * Math.max(1, steps[i].tasks.length);  // 確保最少有一個 task 的高度
    }
    
    // 計算當前 step 的起始位置
    const currentStepHeight = (120 + 40) * Math.max(1, steps[stepIndex]?.tasks.length || 1);  // 確保最少有一個 task 的高度
    baseY += currentStepHeight / 2;

    return {
      x: baseX,
      y: baseY
    };
  };

  const getCenterGoalPosition = () => {
    if (!goal) return { x: 200, y: 0 };
    
    const totalTasksHeight = goal.steps.length > 0 
      ? getStepPosition(goal.steps.length, goal.steps).y
      : 0;

    return {
      x: 200,
      y: totalTasksHeight / 2,
    };
  };

  const centerGoalPos = getCenterGoalPosition();

  // 移動 handleAddBubble 到這裡
  const handleAddBubble = useCallback((parentId: string, type: 'impression' | 'background') => {
    const parentNode = goal?.id === parentId ? goal : goal?.steps.find(s => s.id === parentId);
    if (!parentNode) return;

    // 計算初始位置（在 goal 左邊）
    const initialPosition = {
      x: centerGoalPos.x - 200,  // 在 goal 左邊 200px
      y: centerGoalPos.y + (type === 'background' ? 100 : -100)  // 印象泡泡在上，背景泡泡在下
    };

    const newId = `bubble-${Date.now()}`;
    const newBubble: Node = {
      id: newId,
      type: 'bubble',
      title: type === 'impression' ? '新印象' : '新背景',
      parentId,
      bubbleType: type,
      content: '',
      position: initialPosition
    };

    setBubbles(prev => [...prev, newBubble]);
    setBubbleOffsets(prev => ({ ...prev, [newId]: { x: 0, y: 0 } }));
  }, [goal, centerGoalPos]);

  if (goalId === 'new') {
    return (
      <div className="flex items-center justify-center h-full">
        <Lottie
          animationData={loadingAnimation}
          loop={true}
          className="w-48 h-48"
        />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">找不到目標</p>
      </div>
    );
  }

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

    const newStep: Partial<Step> = {
      title: '新步驟',
      tasks: []
    };

    console.log('📝 準備新增步驟', { newStep });

    // 先新增到 store
    const addedStep = mindMapService.addStep(newStep as Step);
    console.log('✅ 步驟已新增到 store', { addedStep });
    if (!addedStep) return;

    // 找到新增的 step
    const updatedGoal = useGoalStore.getState().goals.find(g => g.id === goalId);
    if (!updatedGoal) return;

    const newAddedStep = updatedGoal.steps.find(s => s.id === addedStep.id);
    if (!newAddedStep) return;

    // 計算新 step 的位置
    const newStepIndex = updatedGoal.steps.length - 1;
    const stepPos = getStepPosition(newStepIndex, updatedGoal.steps);
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 計算新的位置，使 step 位於畫面中心
    const newX = (containerWidth / 2 / zoom) - stepPos.x;
    const newY = (containerHeight / 2 / zoom) - stepPos.y;

    setPosition({ x: newX, y: newY });
  }, [goal, mindMapService, zoom, goalId, getStepPosition]);

  // 處理 step 標題更新
  const handleStepTitleUpdate = useCallback((stepId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    const currentGoal = useGoalStore.getState().goals.find(g => g.id === goalId);
    if (!currentGoal) return;

    const step = currentGoal.steps.find(s => s.id === stepId);
    if (!step) return;

    mindMapService.updateStep(stepId, { 
      ...step,
      title: newTitle.trim() 
    });

    setEditingStepId(null);
    setEditingStepTitle('');

    useGoalStore.getState().dump(goalId);
  }, [goalId, mindMapService]);

  const { bringToFront, getIndex } = useElementStack(1);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // 處理新增 task
  const handleAddTask = useCallback((stepId: string) => {
    if (!goal) return;
    console.log('🎯 新增任務開始', { stepId });

    const stepIndex = goal.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    const newTask: Partial<Task> = {
      title: '新任務',
      status: 'todo'
    };

    // 先新增到 store
    const addedTask = mindMapService.addTask(stepId, newTask as Task);
    console.log('✅ Store 新增結果', { addedTask });
    if (!addedTask) return;

    // 直接從 store 獲取最新狀態
    const updatedGoal = useGoalStore.getState().goals.find(g => g.id === goalId);
    if (!updatedGoal) return;

    const step = updatedGoal.steps.find(s => s.id === stepId);
    if (!step) return;

    const newAddedTask = step.tasks.find(t => t.id === addedTask.id);
    console.log('📝 準備設置編輯狀態', { 
      newTaskId: newAddedTask?.id,
      currentEditingTaskId: editingTaskId,
      currentEditingTaskTitle: editingTaskTitle 
    });
    if (!newAddedTask) return;

    // 計算新 task 的位置
    const taskPos = getTaskPosition(
      stepIndex,
      step.tasks.length - 1,
      step.tasks.length
    );

    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 計算新的位置，使新的 task 出現在畫面中心
    const newX = (containerWidth / 2 / zoom) - taskPos.x;
    const newY = (containerHeight / 2 / zoom) - taskPos.y;

    // 更新位置
    setPosition({ x: newX, y: newY });

    // 設置編輯狀態
    setEditingTaskId(newAddedTask.id);
    setEditingTaskTitle(newAddedTask.title);
    console.log('✏️ 編輯狀態已設置', { 
      taskId: newAddedTask.id, 
      title: newAddedTask.title 
    });

    // Dump store 狀態
    useGoalStore.getState().dump(goalId);
  }, [goal, mindMapService, zoom, goalId, editingTaskId, editingTaskTitle, getTaskPosition]);

  // 處理 task 標題更新
  const handleTaskTitleUpdate = useCallback((taskId: string, newTitle: string) => {
    console.log('💾 開始更新任務標題', { taskId, newTitle });
    if (!newTitle.trim()) {
      console.log('❌ 更新失敗：標題為空');
      return;
    }

    const currentGoal = useGoalStore.getState().goals.find(g => g.id === goalId);
    if (!currentGoal) {
      console.log('❌ 更新失敗：找不到目標', { goalId });
      return;
    }

    const step = currentGoal.steps.find(s => s.tasks.some(t => t.id === taskId));
    console.log('🔍 找到的 step', { stepId: step?.id });
    if (!step) {
      console.log('❌ 更新失敗：找不到步驟');
      return;
    }

    const task = step.tasks.find(t => t.id === taskId);
    console.log('🔍 找到的 task', { task });
    if (!task) {
      console.log('❌ 更新失敗：找不到任務');
      return;
    }

    const updatedTask = mindMapService.updateTask(step.id, taskId, { 
      ...task,
      title: newTitle.trim() 
    });

    if (updatedTask) {
      setEditingTaskTitle(updatedTask.title);
      setEditingTaskId(null);
      console.log('✅ 任務更新完成', { updatedTask });
    } else {
      console.log('❌ 任務更新失敗');
    }

    useGoalStore.getState().dump(goalId);
  }, [goalId, mindMapService]);

  // 匯出成 Markdown
  const exportToMarkdown = useCallback(() => {
    if (!goal) return;

    let markdown = `# ${goal.title}\n\n`;

    goal.steps.forEach((step, stepIndex) => {
      markdown += `## ${stepIndex + 1}. ${step.title}\n\n`;
      
      step.tasks.forEach((task, taskIndex) => {
        const status = task.status === 'done' 
          ? '✅' 
          : task.status === 'in_progress' 
          ? '🔄' 
          : '⭕';
        
        markdown += `${status} ${task.title}\n`;
        if (task.completedAt) {
          markdown += `   - 完成於: ${new Date(task.completedAt).toLocaleDateString()}\n`;
        }
      });
      markdown += '\n';
    });

    // 創建並下載文件
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${goal.title}-規劃.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [goal]);

  // 匯出成 JSON
  const exportToJSON = useCallback(() => {
    if (!goal) return;

    const json = JSON.stringify(goal, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${goal.title}-規劃.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [goal]);

  const navigate = useNavigate();

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      onMouseDown={handleMouseDown}
      style={{ 
        cursor: isDragging ? 'grabbing' : 'grab',
        backgroundImage: `url(${mindMapBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backgroundBlendMode: 'overlay'
      }}
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

        {isDefaultGoal(goalId) && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (window.confirm('確定要回到預設值嗎？這會清除所有已儲存的修改。')) {
                localStorage.removeItem('self_learning_goals');
                window.location.reload();
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-white hover:bg-orange-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            回到預設值
          </motion.button>
        )}

        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const newGoal: Goal = {
                    id: '',  // store 會自動生成
                    title: '做點什麼呢?',  // 必填欄位
                    status: 'active',
                    steps: []
                  };
                  const mindMapService = new MindMapService();
                  console.log('📝 準備新增目標', { newGoal });
                  const addedGoal = mindMapService.addGoal(newGoal);
                  console.log('✅ 目標已新增', { addedGoal });
                  // 直接導航到新目標
                  navigate(`/student/planning/goal/${addedGoal.id}`);
                }}
                className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50"
              >
                <FilePlus className="h-4 w-4 mr-2" />
                建立新頁面
              </motion.button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-800 text-white px-3 py-2 rounded-md text-sm shadow-lg"
                sideOffset={5}
              >
                建立一個空白的學習目標
                <Tooltip.Arrow className="fill-gray-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        <h1 className="text-xl font-bold text-gray-900">{goal.title}</h1>

        {/* 匯出選單 */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4 mr-1" />
              匯出
            </motion.button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[180px] bg-white rounded-lg p-1 shadow-lg border border-gray-200"
              sideOffset={5}
            >
              <DropdownMenu.Item
                className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md cursor-pointer outline-none"
                onSelect={exportToMarkdown}
              >
                匯出成 Markdown
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md cursor-pointer outline-none"
                onSelect={exportToJSON}
              >
                匯出成 JSON
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
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

          {bubbles.map(bubble => {
            const offset = bubbleOffsets[bubble.id] || { x: 0, y: 0 };
            const parentNode = bubble.parentId === goal.id ? goal : goal?.steps.find(s => s.id === bubble.parentId);
            if (!parentNode) return null;
            const parentPos = bubble.parentId === goal.id 
              ? { x: centerGoalPos.x + 96 + goalOffset.x + 5000, y: centerGoalPos.y + goalOffset.y + 5000 }
              : { x: getStepPosition(goal.steps.findIndex(s => s.id === bubble.parentId), goal.steps).x - 64 + 5000, 
                  y: getStepPosition(goal.steps.findIndex(s => s.id === bubble.parentId), goal.steps).y + 5000 };
            const bubblePos = { x: bubble.position.x + offset.x + 5000, y: bubble.position.y + offset.y + 5000 };
            return (
              <path
                key={`bubble-line-${bubble.id}`}
                d={`M ${parentPos.x} ${parentPos.y} \
                    C ${(parentPos.x + bubblePos.x) / 2} ${parentPos.y},\
                      ${(parentPos.x + bubblePos.x) / 2} ${bubblePos.y},\
                      ${bubblePos.x} ${bubblePos.y}`}
                stroke="#818cf8"
                strokeWidth="2"
                strokeDasharray="4 4"
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

              // 檢查是否為觀察步驟
              const isObservationStep = step.title.includes('觀察');
              const isThoughtTask = isObservationStep && task.title.includes('想法');

              return (
                <path
                  key={`task-line-${step.id}-${task.id || taskIndex}`}
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
          id={`goal-${goal.id}`}
          className="absolute goal-node"
          style={{
            left: centerGoalPos.x - 96,
            top: centerGoalPos.y - 96,
            transform: 'none',
            x: goalX,
            y: goalY,
            zIndex: getIndex('goal')
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          drag
          dragMomentum={false}
          dragElastic={0}
          onDragStart={(e) => {
            e.stopPropagation();
            console.log('Goal drag start event triggered');
            bringToFront('goal');
          }}
          onDrag={(e) => {
            e.stopPropagation();
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
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
          onClick={() => {
            setIsGoalSelected(!isGoalSelected);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditingGoal(true);
            setEditingGoalTitle(goal.title);
          }}
        >
          <div 
            className="group relative w-48 h-48 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-purple-200 flex items-center justify-center p-6 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:border-purple-400 hover:shadow-[0_0_0_4px_rgba(99,102,241,0.2)]"
          >
            <div className="text-center">
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              {isEditingGoal ? (
                <input
                  type="text"
                  value={editingGoalTitle}
                  onChange={(e) => setEditingGoalTitle(e.target.value)}
                  onBlur={() => handleGoalTitleUpdate(editingGoalTitle)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleGoalTitleUpdate(editingGoalTitle);
                    } else if (e.key === 'Escape') {
                      setIsEditingGoal(false);
                      setEditingGoalTitle(goal.title);
                    }
                  }}
                  className="w-full text-center bg-transparent border-b border-purple-300 focus:outline-none focus:border-purple-500 px-1 text-lg font-bold text-purple-700"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h2 className="text-lg font-bold text-purple-700">{goal.title || '新目標'}</h2>
              )}
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
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddBubble(goal.id, 'impression');
                  }}
                  className="w-9 h-9 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                </motion.button>
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
          </div>
        </motion.div>

        <AnimatePresence>
          {goal.steps.map((step, stepIndex) => {
            const stepPos = getStepPosition(stepIndex, goal.steps);
            const isSelected = selectedStepId === step.id;

            return (
              <React.Fragment key={`step-group-${step.id}`}>
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
                    id={`step-${step.id}`}
                    drag={editingStepId !== step.id}
                    dragMomentum={false}
                    onDragStart={(event, info) => {
                      if (editingStepId === step.id) return;
                      event.stopPropagation();
                      setIsDraggingStep(step.id);
                      bringToFront(step.id);
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
                    style={{
                      position: 'relative',
                      zIndex: getIndex(step.id)
                    }}
                    onClick={() => {
                      setSelectedStepId(isSelected ? null : step.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingStepId(step.id);
                      setEditingStepTitle(step.title);
                    }}
                    className={`step-node group w-32 h-32 rounded-full ${
                      'border-4'
                    } bg-gradient-to-br ${
                      getStepColors(stepIndex, goal.steps.length).gradient
                    } border-${
                      getStepColors(stepIndex, goal.steps.length).border
                    } flex items-center justify-center p-4 shadow-lg transition-colors duration-200 hover:scale-105 hover:border-indigo-400 shadow-[0_0_0_4px_rgba(99,102,241,0.2)] transition-all duration-200 ${editingStepId === step.id ? 'cursor-text' : 'cursor-move'}`}
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

                    {/* 新增任務按鈕 */}
                    <div 
                      className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{
                        right: '-10px',
                        bottom: '0px',
                        transform: 'translate(50%, 50%)',
                        zIndex: getIndex(step.id) + 1
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddTask(step.id);
                        }}
                        className="w-8 h-8 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </motion.div>
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

                    // 檢查是否為觀察步驟
                    const isObservationStep = step.title.includes('觀察');
                    const isThoughtTask = isObservationStep && task.title.includes('想法');

                    return (
                      <motion.div
                        key={`task-${step.id}-${task.id}`}
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
                          id={`task-${task.id}`}
                          drag
                          dragMomentum={false}
                          whileDrag={{ scale: 1.02 }}
                          onDragStart={(e) => {
                            e.stopPropagation();
                            bringToFront(task.id);
                          }}
                          onDrag={(event, info) => {
                            event.stopPropagation();
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
                          style={{
                            position: 'relative',
                            zIndex: getIndex(task.id)
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingTaskId(task.id);
                            setEditingTaskTitle(task.title);
                          }}
                          className={`task-card w-64 h-24 p-4 rounded-2xl shadow-lg border-2 cursor-move flex flex-col justify-center gap-2 relative ${
                            task.status === 'idea'
                              ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 rounded-3xl'
                              : task.status === 'done'
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                              : task.status === 'in_progress'
                              ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
                              : 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200'
                          }`}
                        >
                          <div className="absolute top-2 right-2 pointer-events-none z-10">
                            {task.status === 'done' && (
                              <span className="text-xl">✅</span>
                            )}
                            {task.status === 'in_progress' && (
                              <span className="text-xl">🚀</span>
                            )}
                            {task.status === 'idea' && (
                              <span className="text-xl">💭</span>
                            )}
                          </div>
                          {editingTaskId === task.id ? (
                            <input
                              type="text"
                              value={editingTaskTitle}
                              onChange={(e) => setEditingTaskTitle(e.target.value)}
                              onBlur={() => handleTaskTitleUpdate(task.id, editingTaskTitle)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleTaskTitleUpdate(task.id, editingTaskTitle);
                                } else if (e.key === 'Escape') {
                                  setEditingTaskId(null);
                                  setEditingTaskTitle('');
                                }
                              }}
                              className={`w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-indigo-500 px-1 ${
                                task.status === 'idea' 
                                  ? 'text-2xl font-bold text-center font-[Iansui] !text-[#d97706] tracking-wide' 
                                  : 'text-lg font-semibold text-left'
                              } text-gray-900 pr-8`}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <h3 className={`${
                              task.status === 'idea' 
                                ? 'text-2xl font-bold text-center font-[Iansui] !text-[#d97706] tracking-wide' 
                                : 'text-lg font-semibold text-left'
                            } text-gray-900 pr-8`}>{task.title}</h3>
                          )}
                          {task.completedAt && (
                            <p className={`text-xs text-gray-500 ${
                              task.status === 'idea' ? 'text-center' : 'text-left'
                            }`}>
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

        <AnimatePresence>
          {bubbles.map(bubble => {
            const offset = bubbleOffsets[bubble.id] || { x: 0, y: 0 };
            return (
              <motion.div
                key={bubble.id}
                className="absolute"
                style={{
                  left: bubble.position.x-64,
                  top: bubble.position.y-64,
                  transform: 'none'
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <motion.div
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    console.log('Bubble drag start event triggered');
                    bringToFront(bubble.id);
                  }}
                  onDrag={(event, info) => {
                    event.stopPropagation();
                    const dx = info.delta.x;
                    const dy = info.delta.y;
                    setBubbleOffsets(prev => {
                      const current = prev[bubble.id] || { x: 0, y: 0 };
                      return {
                        ...prev,
                        [bubble.id]: {
                          x: current.x + dx,
                          y: current.y + dy
                        }
                      };
                    });
                  }}
                  onDragEnd={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    position: 'relative',
                    zIndex: getIndex(bubble.id)
                  }}
                  whileDrag={{ 
                    scale: 1.05,
                    zIndex: 50 
                  }}
                  whileHover={{ 
                    scale: 1.02 
                  }}
                  className="bubble-node w-32 h-32 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg cursor-move"
                >
                  <div className="p-4 text-sm text-purple-700">
                    {bubble.title}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 底部工具列 */}
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
        <div className="w-px h-6 bg-gray-200" />
        <div className="relative">
          <button
            onClick={handleToggleAssistant}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              showAssistant ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title={showAssistant ? '隱藏助理' : '顯示助理'}
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 浮動助理 */}
      <div className="fixed bottom-6 right-6 z-50">
        <PanelAssistant
          enabled={showAssistant}
          onToggle={handleToggleAssistant}
          dragConstraints={containerRef}
          initialPosition={calculateBottomRightPosition()}
          onPositionChange={setAssistantPosition}
          onDragEnd={handleAssistantDragEnd}
          hideCloseButton
          className="panel-assistant pointer-events-auto"
          goalId={goalId}
          onFocus={(elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
              flyToElement(elementId);
            }
          }}
        />
      </div>
    </div>
  );
}; 