import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionValueEvent } from 'framer-motion';
import { ArrowLeft, Plus, Target, ListTodo, ZoomIn, ZoomOut, CheckCircle2, Clock, Share2, Sparkles, RotateCcw, FilePlus, Power, LayoutGrid, ArrowLeftRight, RefreshCw, MessageSquare, Trash2 } from 'lucide-react';
import { useTopicStore } from '../../store/topicStore';
import { Topic, Goal, Task, Bubble } from '../../types/goal';
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

interface TopicMindMapProps {
  topicId: string;
  onBack?: () => void;
}

interface Node {
  id: string;
  type: 'topic' | 'goal' | 'task' | 'bubble';
  title: string;
  parentId?: string;
  children?: Node[];
  position: { x: number; y: number };
  bubbleType?: 'impression' | 'background';
  content?: string;
}

// 在 TopicMindMap 組件前添加顏色計算函數
const getGoalColors = (index: number, totalGoals: number) => {
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

      // 限制最大目標數為7
    const goalIndex = Math.min(index, 6);
    const colors = colorLevels[goalIndex];

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

export const TopicMindMap: React.FC<TopicMindMapProps> = ({ topicId, onBack }) => {
  const { topics } = useTopicStore();
  const topic = topics.find((t) => t.id === topicId) || null;
  const mindMapService = React.useMemo(() => {
    return new MindMapService(topicId);
  }, [topicId]);

  // 使用 state 來管理 activeGoals 和 activeTasks
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [activeTasks, setActiveTasks] = useState<Map<string, Task[]>>(new Map());

  // 初始化數據載入
  useEffect(() => {
    const { fetchTopicsWithActions } = useTopicStore.getState();
    fetchTopicsWithActions();
  }, []);

  // 初始化數據
  useEffect(() => {
    if (!topic) {
      setActiveGoals([]);
      setActiveTasks(new Map());
      return;
    }

    const goals = topic.goals.filter(goal => goal.status !== 'archived');
    const tasksMap = new Map<string, Task[]>();
    goals.forEach(goal => {
      tasksMap.set(goal.id, goal.tasks.filter(task => task.status !== 'archived'));
    });

    setActiveGoals(goals);
    setActiveTasks(tasksMap);
  }, [topic, topicId]);

  // 訂閱 store 更新
  useEffect(() => {
    const unsubscribe = useTopicStore.subscribe((state) => {
      const currentTopic = state.topics.find(t => t.id === topicId);
      if (!currentTopic) return;

      // 重新計算 activeGoals 和 activeTasks
      const goals = currentTopic.goals.filter(goal => goal.status !== 'archived');
      const tasksMap = new Map<string, Task[]>();
      goals.forEach(goal => {
        tasksMap.set(goal.id, goal.tasks.filter(task => task.status !== 'archived'));
      });

      // 更新狀態
      setActiveGoals(goals);
      setActiveTasks(tasksMap);
    });

    return () => unsubscribe();
  }, [topicId]);

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isTopicSelected, setIsTopicSelected] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalTitle, setEditingGoalTitle] = useState('');
  const [zoom, setZoom] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [goalOffsets, setGoalOffsets] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [taskOffsets, setTaskOffsets] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [dragStartPositions, setDragStartPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [isDraggingGoal, setIsDraggingGoal] = useState<string | null>(null);
  const [topicPosition, setTopicPosition] = useState<{ x: number; y: number }>({ x: 200, y: 0 });
  const [topicOffset, setTopicOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [taskZIndexes, setTaskZIndexes] = useState<{ [key: string]: number }>({});
  const baseZIndex = 1;
  const [assistantMode, setAssistantMode] = useState<'floating' | 'panel'>('floating');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [bubbleOffsets, setBubbleOffsets] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null);
  const [editingBubbleTitle, setEditingBubbleTitle] = useState('');
  const [assistantInputHandler, setAssistantInputHandler] = useState<((input: string, params?: Record<string, any>) => void) | null>(null);

  // 新增一個 useEffect 來追蹤 assistantInputHandler 的變化
  useEffect(() => {
    console.log('🔍 Assistant input handler updated:', !!assistantInputHandler);
  }, [assistantInputHandler]);

  // 處理外部輸入的設置
  const handleSetAssistantInput = useCallback((handler: (input: string, params?: Record<string, any>) => void) => {
    console.log('🔍 Setting assistant input handler');
    setAssistantInputHandler(() => handler);
  }, []);

  // 初始化心智圖狀態
  const initializeMindMap = useCallback((currentTopic: Topic | null) => {
    // 重置所有狀態
    setInitialLoad(true);
    setIsLoading(true);
    setZoom(0.8);
    setPosition({ x: 0, y: 0 });
    setActiveGoals([]);
    setActiveTasks(new Map());
    setSelectedGoalId(null);
    setIsTopicSelected(false);
    setEditingGoalId(null);
    setEditingGoalTitle('');
    setEditingTaskId(null);
    setEditingTaskTitle('');
    setEditingBubbleId(null);
    setEditingBubbleTitle('');
    setGoalOffsets({});
    setTaskOffsets({});
    setBubbleOffsets({});
    setBubbles([]);
    setTopicOffset({ x: 0, y: 0 });
    setTopicPosition({ x: 200, y: 0 });

    // 如果有主題，初始化相關數據
    if (currentTopic) {
      // 初始化目標和任務
      const goals = currentTopic.goals.filter(goal => goal.status !== 'archived');
      const tasksMap = new Map<string, Task[]>();
      goals.forEach(goal => {
        tasksMap.set(goal.id, goal.tasks.filter(task => task.status !== 'archived'));
      });
      setActiveGoals(goals);
      setActiveTasks(tasksMap);

      // 初始化泡泡
      const topicBubbles = currentTopic.bubbles || [];
      setBubbles(topicBubbles);
    }
  }, [topicId]);

  // 當 topicId 改變時重置狀態
  useEffect(() => {
    initializeMindMap(topic);
  }, [topicId, initializeMindMap]);

  // 追蹤主題節點位置
  const topicX = useMotionValue(0);
  const topicY = useMotionValue(0);

  // 追蹤目標節點位置
  const goalPositions = useRef(new Map<string, { x: number, y: number }>());

  // 監聽位置變化
  useMotionValueEvent(topicX, "change", (latest) => {
    setTopicOffset(prev => ({ ...prev, x: latest }));
  });

  useMotionValueEvent(topicY, "change", (latest) => {
    setTopicOffset(prev => ({ ...prev, y: latest }));
  });

  // 計算最佳視圖位置和縮放值
  const calculateOptimalView = useCallback(() => {
    if (!containerRef.current || !topic) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 計算所有 goal 的總高度
    const totalGoalHeight = topic.goals
      .filter(goal => goal.status !== 'archived')
      .reduce((total, goal) => {
        // 確保每個 goal 至少有最小高度
        const goalHeight = Math.max(120, (120 + 40) * Math.max(1, goal.tasks.length));
        return total + goalHeight;
      }, 0);

    // 如果沒有 goal，使用預設高度
    const effectiveTotalHeight = totalGoalHeight || 10;

    // 計算整個畫布的寬度（從最左到最右）
    const centerTopicX = 0;  // 中心主題的 x 位置
    const hasGoals = topic.goals
      .filter(goal => goal.status !== 'archived')
      .length > 0;
    const hasTasks = topic.goals
      .filter(goal => goal.status !== 'archived')
      .some(goal => goal.tasks.length > 0);
    
    // 根據是否有 goal 和 task 決定最右邊的位置
    const rightmostTaskX = hasGoals 
      ? (hasTasks 
        ? 400 + 300 + 200 + 256 + 100  // 有 goal 有 task
        : 400 + 300 + 100)             // 有 goal 無 task
      : 400 + 100;                     // 無 goal
    
    const leftmostX = centerTopicX;  // 中心主題左邊的空間
    const totalWidth = rightmostTaskX - leftmostX;  // 整個畫布的實際寬度

    // 計算最佳縮放值
    const optimalZoomX = (containerWidth * 0.8) / totalWidth;
    const optimalZoomY = (containerHeight * 0.8) / effectiveTotalHeight;
    const optimalZoom = Math.min(Math.max(0.8, Math.min(optimalZoomX, optimalZoomY)), 1.2);

    // 計算主題應該在的位置（螢幕的左邊）
    const targetScreenX = hasGoals ? containerWidth * 0.1 : containerWidth * 0.35;
    
    // 計算需要的 translate 值
    const optimalX = (targetScreenX - centerTopicX * optimalZoom) / optimalZoom;
    // 計算 Y 軸位置
    const optimalY = (containerHeight - effectiveTotalHeight * optimalZoom) / 2 / optimalZoom;

    return {
      zoom: optimalZoom,
      position: { x: optimalX, y: optimalY }
    };
  }, [topic]);

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
    if (topic && initialLoad) {
      const initialGoalOffsets: { [key: string]: { x: number; y: number } } = {};
      const initialTaskOffsets: { [key: string]: { x: number; y: number } } = {};

      topic.goals
        .filter(goal => goal.status !== 'archived')
        .forEach((goal, goalIndex) => {
          initialGoalOffsets[goal.id] = { x: 0, y: 0 };
          goal.tasks.forEach((task) => {
            initialTaskOffsets[task.id] = { x: 0, y: 0 };
          });
        });

      setGoalOffsets(initialGoalOffsets);
      setTaskOffsets(initialTaskOffsets);
    }
  }, [topic]);

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
    console.log('🎯 飛到元素:', elementId);
    
    // 使用 setTimeout 確保元素已經渲染
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.log('❌ 找不到元素:', elementId);
        return;
      }

      // 取得容器資訊
      const container = containerRef.current;
      if (!container) {
        console.log('❌ 找不到容器');
        return;
      }

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

      // 使用 requestAnimationFrame 確保在下一幀更新位置
      requestAnimationFrame(() => {
        setPosition(newPosition);
      });

      // 等待畫布移動動畫完成後清除 focus
      setTimeout(() => {
        mindMapService.clearFocusElement();
      }, 500);
    }, 100); // 給元素 100ms 的渲染時間
  };

  useEffect(() => {
    const unsubscribe = useTopicStore.subscribe((state) => {
      const currentTopic = state.topics.find(t => t.id === topicId);
      if (currentTopic?.focus_element) {
        const elementId = `${currentTopic.focus_element.type}-${currentTopic.focus_element.id}`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            flyToElement(elementId);
          });
        });
      }
    });

    return () => unsubscribe();
  }, [topicId, mindMapService, position, zoom]); // 加回 position 和 zoom 依賴

  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editingTopicTitle, setEditingTopicTitle] = useState('');

  const handleTopicTitleUpdate = (newTitle: string) => {
    if (!topic || !newTitle.trim()) return;
    
    const updatedTopic = {
      ...topic,
      title: newTitle.trim()
    };
    mindMapService.updateTopic(updatedTopic);
    setIsEditingTopic(false);
  };

  const getGoalPosition = useMemo(() => {
    return (goalIndex: number, goals: Goal[]) => {
      const baseX = 400 + 300;  // 基礎位置
      let baseY = 0;
      
      // 計算前面所有 goal 的總高度
      for (let i = 0; i < goalIndex; i++) {
        if (activeGoals[i]) {
          baseY += (120 + 40) * Math.max(1, activeGoals[i].tasks.filter(t => t.status !== 'archived').length);
        }
      }
      
      // 計算當前 goal 的起始位置
      const currentGoalHeight = (120 + 40) * Math.max(1, activeGoals[goalIndex]?.tasks.filter(t => t.status !== 'archived').length || 1);
      baseY += currentGoalHeight / 2;

      return {
        x: baseX,
        y: baseY
      };
    };
  }, [activeGoals]);

  const centerTopicPos = useMemo(() => {
    if (!topic) return { x: 200, y: 0 };
    
    const totalTasksHeight = topic.goals
      .filter(goal => goal.status !== 'archived')
      .length > 0 
      ? getGoalPosition(topic.goals.length, topic.goals).y
      : 0;

    return {
      x: 200,
      y: totalTasksHeight / 2,
    };
  }, [topic, getGoalPosition]);

  // 移動 handleAddBubble 到這裡
  const handleAddBubble = useCallback((parentId: string, type: 'impression' | 'background') => {
    const parentNode = topic?.id === parentId ? topic : topic?.goals.find(g => g.id === parentId);
    if (!parentNode) return;

    // 計算當前已有的 bubble 數量
    const existingBubbles = bubbles.filter(b => b.parentId === parentId);
    const bubbleCount = existingBubbles.length;

    // 計算初始位置
    const baseX = centerTopicPos.x - 200;  // 在 topic 左邊 200px
    const bubbleHeight = 128;  // bubble 的高度 (w-32 h-32 = 128px)
    const spacing = 40;  // bubble 之間的間距
    const totalHeight = bubbleHeight * 3 + spacing * 2;  // 三個 bubble 的總高度（包含兩個間距）
    const startY = centerTopicPos.y - totalHeight / 2 + bubbleHeight / 2;  // 從中心點往上偏移，並考慮第一個 bubble 的高度

    // 根據當前 bubble 數量計算 Y 位置
    const yOffset = (bubbleHeight + spacing) * bubbleCount;
    const initialPosition = {
      x: baseX,
      y: startY + yOffset
    };

    const newBubble: Bubble = {
      id: `bubble-${Date.now()}`,
      title: type === 'impression' ? '新印象' : '新背景',
      parentId,
      bubbleType: type,
      content: '',
      position: initialPosition
    };

    // 使用 MindMapService 新增 bubble
    mindMapService.addBubble(newBubble);
  }, [topic, centerTopicPos, bubbles, mindMapService]);

  // 處理刪除 bubble
  const handleDeleteBubble = useCallback((bubbleId: string) => {
    if (!topic) return;
    
    if (window.confirm('確定要刪除這個氣泡嗎？')) {
      mindMapService.deleteBubble(bubbleId);
    }
  }, [topic, mindMapService]);

  // 處理更新 bubble
  const handleUpdateBubble = useCallback((bubbleId: string, updates: Partial<Bubble>) => {
    if (!topic) return;
    mindMapService.updateBubble(bubbleId, updates);
  }, [topic, mindMapService]);

  // 初始化 bubbles
  useEffect(() => {
    if (!topic) {
      setBubbles([]);
      return;
    }

    const topicBubbles = topic.bubbles || [];
    // 計算每個 bubble 的初始位置
    const bubblesWithPosition = topicBubbles.map((bubble, index) => {
      const baseX = centerTopicPos.x - 200;  // 在 topic 左邊 200px
      const bubbleHeight = 128;  // bubble 的高度 (w-32 h-32 = 128px)
      const spacing = 40;  // bubble 之間的間距
      const totalHeight = bubbleHeight * 3 + spacing * 2;  // 三個 bubble 的總高度（包含兩個間距）
      const startY = centerTopicPos.y - totalHeight / 2 + bubbleHeight / 2;  // 從中心點往上偏移，並考慮第一個 bubble 的高度

      // 根據當前 bubble 數量計算 Y 位置
      const yOffset = (bubbleHeight + spacing) * index;
      return {
        ...bubble,
        position: {
          x: baseX,
          y: startY + yOffset
        }
      };
    });

    setBubbles(bubblesWithPosition);
  }, [topic, centerTopicPos]);

  // 訂閱 store 更新
  useEffect(() => {
    const unsubscribe = useTopicStore.subscribe((state) => {
      const currentTopic = state.topics.find(t => t.id === topicId);
      if (!currentTopic) return;

      // 更新 bubbles
      setBubbles(currentTopic.bubbles || []);
    });

    return () => unsubscribe();
  }, [topicId]);

  // 處理刪除目標
  const handleDeleteGoal = useCallback((goalId: string) => {
    if (!topic) return;
    
    if (window.confirm('確定要刪除這個目標嗎？這會同時刪除所有相關的任務。')) {
      mindMapService.deleteGoal(goalId);
      
      // 重新計算位置
      const optimalView = calculateOptimalView();
      if (optimalView) {
        setZoom(optimalView.zoom);
        setPosition(optimalView.position);
      }
    }
  }, [topic, mindMapService, calculateOptimalView]);

  // 處理刪除任務
  const handleDeleteTask = useCallback((goalId: string, taskId: string) => {
    if (!topic) return;
    
    if (window.confirm('確定要刪除這個任務嗎？')) {
      mindMapService.deleteTask(goalId, taskId);
      
      // 重新計算所有 goal 的位置
      const newGoalOffsets: { [key: string]: { x: number; y: number } } = {};
      
      activeGoals.forEach((goal, goalIndex) => {
        // 計算新的位置
        const goalPos = getGoalPosition(goalIndex, topic.goals);
        const currentOffset = goalOffsets[goal.id] || { x: 0, y: 0 };
        
        // 計算需要移動的距離
        const targetY = goalPos.y;
        const currentY = goalPos.y + currentOffset.y;
        const deltaY = targetY - currentY;
        
        newGoalOffsets[goal.id] = {
          x: currentOffset.x,
          y: deltaY
        };
      });
      
      // 更新 goal 的位置
      setGoalOffsets(newGoalOffsets);
      
      // 重新計算位置
      const optimalView = calculateOptimalView();
      if (optimalView) {
        setZoom(optimalView.zoom);
        setPosition(optimalView.position);
      }
    }
  }, [topic, mindMapService, calculateOptimalView, topicId, goalOffsets, getGoalPosition, activeGoals]);

  if (topicId === 'new') {
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

  if (!topic) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">找不到主題</p>
      </div>
    );
  }

  const getTaskPosition = useMemo(() => {
    return (goalIndex: number, taskIndex: number, totalTasks: number) => {
      const goalPos = getGoalPosition(goalIndex, topic?.goals || []);
      const taskX = 200;
      const cardHeight = 120;
      const cardSpacing = 40;

      const currentGoal = activeGoals[goalIndex];
      if (!currentGoal) return { x: 0, y: 0 };

      // 計算當前任務之前的所有卡片高度和間距
      const currentGoalPreviousHeight = (cardHeight * taskIndex) + (cardSpacing * taskIndex);
      
      // 計算整個 goal 的總高度（所有卡片高度 + 間距）
      const totalHeight = (cardHeight * totalTasks) + (cardSpacing * (totalTasks - 1));
      
      // 從 goal 中心點開始計算位置
      const baseY = goalPos.y - (totalHeight / 2) + currentGoalPreviousHeight;

      return {
        x: goalPos.x + taskX,
        y: baseY
      };
    };
  }, [topic, getGoalPosition, activeGoals]);

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

  // 新增 goal 後重新計算位置並置中到新 goal
  const focusOnGoal = useCallback((goalId: string) => {
    const goalIndex = topic?.goals.findIndex(g => g.id === goalId) ?? -1;
    if (goalIndex === -1) return;

    const goalPos = getGoalPosition(goalIndex, topic.goals);
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 計算新的位置，使 goal 位於畫面中心
    const newX = (containerWidth / 2 / zoom) - goalPos.x;
    const newY = (containerHeight / 2 / zoom) - goalPos.y;

    setPosition({ x: newX, y: newY });
  }, [zoom, getGoalPosition, topic]);

  // 處理新增 goal
  const handleAddGoal = useCallback(() => {
    if (!topic) return;

    const newGoal = {
      id: Date.now().toString(),
      title: '新目標',
      tasks: [],
      status: 'todo' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 準備新增目標', { newGoal });

    // 先新增到 store
    const addedGoalPromise = mindMapService.addGoal(newGoal);
    if (!addedGoalPromise) return;

    addedGoalPromise.then(addedGoal => {
      if (!addedGoal) return;

      // 直接從 store 獲取最新狀態
      const updatedTopic = useTopicStore.getState().topics.find(t => t.id === topicId);
      if (!updatedTopic) return;

      const newAddedGoal = updatedTopic.goals.find(g => g.id === addedGoal.id);
      if (!newAddedGoal) return;

      // 計算新 goal 的位置
      const newGoalIndex = updatedTopic.goals.length - 1;
      const goalPos = getGoalPosition(newGoalIndex, updatedTopic.goals);
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // 計算新的位置，使 goal 位於畫面中心
      const newX = (containerWidth / 2 / zoom) - goalPos.x;
      const newY = (containerHeight / 2 / zoom) - goalPos.y;

      setPosition({ x: newX, y: newY });
    });
  }, [topic, mindMapService, zoom, topicId, getGoalPosition]);

  // 處理 goal 標題更新
  const handleGoalTitleUpdate = useCallback((goalId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    const currentTopic = useTopicStore.getState().topics.find(t => t.id === topicId);
    if (!currentTopic) return;

    const goal = currentTopic.goals.find(g => g.id === goalId);
    if (!goal) return;

    mindMapService.updateGoal(goalId, { 
      ...goal,
      title: newTitle.trim() 
    });

    setEditingGoalId(null);
    setEditingGoalTitle('');
  }, [topicId, mindMapService]);

  const { bringToFront, getIndex } = useElementStack(1);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // 處理新增 task
  const handleAddTask = useCallback((goalId: string) => {
    if (!topic) return;
    console.log('🎯 新增任務開始', { goalId });

    const goalIndex = topic.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;

    const newTask: Partial<Task> = {
      title: '新任務',
      status: 'todo'
    };

    // 先新增到 store
    const addedTaskPromise = mindMapService.addTask(goalId, newTask as Task);
    console.log('✅ Store 新增結果', { addedTaskPromise });
    if (!addedTaskPromise) return;

    addedTaskPromise.then(addedTask => {
      if (!addedTask) return;

      // 直接從 store 獲取最新狀態
      const updatedTopic = useTopicStore.getState().topics.find(t => t.id === topicId);
      if (!updatedTopic) return;

      const goal = updatedTopic.goals.find(g => g.id === goalId);
      if (!goal) return;

      const newAddedTask = goal.tasks.find(t => t.id === addedTask.id);
      console.log('📝 準備設置編輯狀態', { 
        newTaskId: newAddedTask?.id,
        currentEditingTaskId: editingTaskId,
        currentEditingTaskTitle: editingTaskTitle 
      });
      if (!newAddedTask) return;

      // 計算新 task 的位置
      const taskPos = getTaskPosition(
        goalIndex,
        goal.tasks.length - 1,
        goal.tasks.length
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
    });
  }, [topic, mindMapService, zoom, topicId, getTaskPosition, editingTaskId, editingTaskTitle]);

  // 處理 task 標題更新
  const handleTaskTitleUpdate = useCallback((taskId: string, newTitle: string) => {
    console.log('💾 開始更新任務標題', { taskId, newTitle });
    if (!newTitle.trim()) {
      console.log('❌ 更新失敗：標題為空');
      return;
    }

    const currentTopic = useTopicStore.getState().topics.find(t => t.id === topicId);
    if (!currentTopic) {
      console.log('❌ 更新失敗：找不到主題', { topicId });
      return;
    }

    const goal = currentTopic.goals.find(g => g.tasks.some(t => t.id === taskId));
    console.log('🔍 找到的 goal', { goalId: goal?.id });
    if (!goal) {
      console.log('❌ 更新失敗：找不到目標');
      return;
    }

    const task = goal.tasks.find(t => t.id === taskId);
    console.log('🔍 找到的 task', { task });
    if (!task) {
      console.log('❌ 更新失敗：找不到任務');
      return;
    }

    const updatedTask = mindMapService.updateTask(goal.id, taskId, { 
      ...task,
      title: newTitle.trim() 
    });

    if (updatedTask) {
      updatedTask.then(task => {
        if (task) {
          setEditingTaskTitle(task.title);
          setEditingTaskId(null);
          console.log('✅ 任務更新完成', { task });
        } else {
          console.log('❌ 任務更新失敗');
        }
      });
    } else {
      console.log('❌ 任務更新失敗');
    }

    // 不需要 dump，store 已經自動更新
  }, [topicId, mindMapService]);

  // 匯出成 Markdown
  const exportToMarkdown = useCallback(() => {
    if (!topic) return;

    let markdown = `# ${topic.title}\n\n`;

    topic.goals
      .filter(goal => goal.status !== 'archived')
      .forEach((goal, goalIndex) => {
      markdown += `## ${goalIndex + 1}. ${goal.title}\n\n`;
      
      goal.tasks.forEach((task, taskIndex) => {
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
    a.download = `${topic.title}-規劃.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [topic]);

  // 匯出成 JSON
  const exportToJSON = useCallback(() => {
    if (!topic) return;

    const json = JSON.stringify(topic, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.title}-規劃.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [topic]);

  const navigate = useNavigate();

  // 處理泡泡標題更新
  const handleBubbleTitleUpdate = useCallback((bubbleId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    mindMapService.updateBubble(bubbleId, { title: newTitle.trim() });
    setEditingBubbleId(null);
    setEditingBubbleTitle('');
  }, [mindMapService]);

  // AI 分析相關函數
  const handleAnalyzeTopic = useCallback((topicTitle: string) => {
    if (!topic || !assistantInputHandler) return;
    console.log('🔍 Analyzing topic:', topicTitle);
    assistantInputHandler(`總結主題：${topicTitle}`, { mode: 'summarize' });
  }, [topic, assistantInputHandler]);

  const handleAnalyzeGoal = useCallback((goalTitle: string) => {
    if (!topic || !assistantInputHandler) return;
    console.log('🔍 Analyzing goal:', goalTitle);
    assistantInputHandler(`分析目標：${goalTitle}`, { mode: 'goal_search' });
  }, [topic, assistantInputHandler]);

  const handleAnalyzeTask = useCallback((taskTitle: string) => {
    if (!topic || !assistantInputHandler) return;
    console.log('🔍 Analyzing task:', taskTitle);
    assistantInputHandler(`分析任務：${taskTitle}`, { mode: 'mission_search' });
  }, [topic, assistantInputHandler]);

  const handleAnalyzeBubble = useCallback((bubbleTitle: string) => {
    if (!topic || !assistantInputHandler) return;
    console.log('🔍 Analyzing bubble:', bubbleTitle);
    assistantInputHandler(`分析想法：${bubbleTitle}`, { mode: 'bubble_idea_search' });
  }, [topic, assistantInputHandler]);

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

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (window.confirm('確定要重設嗎？這會清除所有已儲存的修改。')) {
              localStorage.removeItem('self_learning_topics');
              window.location.reload();
            }
          }}
          className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-white hover:bg-orange-50"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          重設
        </motion.button>

        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const newTopic: Topic = {
                    id: Date.now().toString(),
                    title: '做點什麼呢?',
                    type: '學習目標',
                    status: 'active',
                    goals: [],
                    owner_id: '',  // store 會自動設定
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  const { createTopic } = useTopicStore.getState();
                  console.log('📝 準備新增主題', { newTopic });
                  const addedTopicPromise = createTopic(newTopic);
                  addedTopicPromise.then(addedTopic => {
                    if (!addedTopic) return;
                    console.log('✅ 主題已新增', { addedTopic });
                    // 直接導航到新主題
                    navigate(`/student/planning/topic/${addedTopic.id}`);
                  });
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
                建立一個空白的學習主題
                <Tooltip.Arrow className="fill-gray-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        <h1 className="text-xl font-bold text-gray-900">{topic.title}</h1>

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
          {topic.goals
            .filter(goal => goal.status !== 'archived')
            .map((goal, goalIndex) => {
            const goalPos = getGoalPosition(goalIndex, topic.goals);
            const goalOffset = goalOffsets[goal.id] || { x: 0, y: 0 };
            const curvePoints = getCurvePoints(
              { x: centerTopicPos.x + 96 + topicOffset.x + 5000, y: centerTopicPos.y + topicOffset.y + 5000 },
              { x: goalPos.x - 64 + goalOffset.x + 5000, y: goalPos.y + goalOffset.y + 5000 }
            );

            return (
              <path
                key={`goal-line-${goal.id}`}
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
            const parentNode = bubble.parentId === topic.id ? topic : topic?.goals.find(g => g.id === bubble.parentId);
            if (!parentNode) return null;
            const parentPos = bubble.parentId === topic.id 
              ? { x: centerTopicPos.x + 96 + topicOffset.x + 5000, y: centerTopicPos.y + topicOffset.y + 5000 }
              : { x: getGoalPosition(topic.goals.findIndex(g => g.id === bubble.parentId), topic.goals).x - 64 + 5000, 
                  y: getGoalPosition(topic.goals.findIndex(g => g.id === bubble.parentId), topic.goals).y + 5000 };
            const bubblePos = { 
              x: (bubble.position?.x ?? 0) + offset.x + 5000, 
              y: (bubble.position?.y ?? 0) + offset.y + 5000 
            };
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

          {activeGoals.map((goal, goalIndex) => {
            const goalPos = getGoalPosition(goalIndex, topic.goals);
            const goalOffset = goalOffsets[goal.id] || { x: 0, y: 0 };
            return activeTasks.get(goal.id)?.map((task, taskIndex) => {
              const taskPos = getTaskPosition(
                goalIndex,
                taskIndex,
                goal.tasks.length
              );
              const taskOffset = taskOffsets[task.id] || { x: 0, y: 0 };
              const taskCurvePoints = getCurvePoints(
                { x: goalPos.x + 64 + goalOffset.x + 5000, y: goalPos.y + goalOffset.y + 5000 },
                { x: taskPos.x + taskOffset.x + 5000, y: taskPos.y + 60 + taskOffset.y + 5000 }
              );

              // 檢查是否為特殊任務類型
              const isObservationGoal = goal.title.includes('觀察');
              const isThoughtTask = isObservationGoal && task.title.includes('想法');

              return (
                <path
                  key={`task-line-${goal.id}-${task.id || taskIndex}`}
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
          id={`topic-${topic.id}`}
          className="absolute topic-node"
          style={{
            left: centerTopicPos.x - 96,
            top: centerTopicPos.y - 96,
            transform: 'none',
            x: topicX,
            y: topicY,
            zIndex: getIndex('topic')
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          drag
          dragMomentum={false}
          dragElastic={0}
          onDragStart={(e) => {
            e.stopPropagation();
            console.log('Topic drag start event triggered');
            bringToFront('topic');
          }}
          onDrag={(e) => {
            e.stopPropagation();
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            console.log('Final position:', {
              x: topicX.get(),
              y: topicY.get()
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
            setIsTopicSelected(!isTopicSelected);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditingTopic(true);
            setEditingTopicTitle(topic.title);
          }}
        >
          <div 
            className="group relative w-48 h-48 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-purple-200 flex items-center justify-center p-6 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:border-purple-400 hover:shadow-[0_0_0_4px_rgba(99,102,241,0.2)]"
          >
            <div className="text-center">
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              {isEditingTopic ? (
                <input
                  type="text"
                  value={editingTopicTitle}
                  onChange={(e) => setEditingTopicTitle(e.target.value)}
                  onBlur={() => handleTopicTitleUpdate(editingTopicTitle)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTopicTitleUpdate(editingTopicTitle);
                    } else if (e.key === 'Escape') {
                      setIsEditingTopic(false);
                      setEditingTopicTitle(topic.title);
                    }
                  }}
                  className="w-full text-center bg-transparent border-b border-purple-300 focus:outline-none focus:border-purple-500 px-1 text-lg font-bold text-purple-700"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h2 className="text-lg font-bold text-purple-700">{topic.title || '新主題'}</h2>
              )}
            </div>

            {/* 新增目標按鈕 */}
            <div 
              className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{
                right: '-10px',
                bottom: '10px',
                transform: 'translate(50%, 50%)',
                zIndex: getIndex('topic') + 1
              }}
            >
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddGoal();
                  }}
                  className="w-8 h-8 bg-indigo-100 hover:bg-indigo-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 text-indigo-500" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddBubble(topic.id, 'impression');
                  }}
                  className="w-8 h-8 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                </motion.button>
              </div>
            </div>

            {/* 新增 AI 按鈕 */}
            <div 
              className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{
                right: '-5px',
                top: '-15px',
                transform: 'translate(50%, 50%)',
                zIndex: getIndex('goal') + 1
              }}
            >
              <div className="flex space-x-2">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnalyzeTopic(topic.title);
                  }}
                  className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {activeGoals.map((goal, goalIndex) => {
            const goalPos = getGoalPosition(goalIndex, topic.goals);
            const isSelected = selectedGoalId === goal.id;

            return (
              <React.Fragment key={`goal-group-${goal.id}`}>
                <motion.div
                  className="absolute"
                  style={{
                    left: goalPos.x - 64,
                    top: goalPos.y - 64,
                    transform: 'none'
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <motion.div
                    id={`goal-${goal.id}`}
                    drag={editingGoalId !== goal.id}
                    dragMomentum={false}
                    dragElastic={0}
                    onDragStart={(event, info) => {
                      if (editingGoalId === goal.id) return;
                      event.stopPropagation();
                      setIsDraggingGoal(goal.id);
                      bringToFront(goal.id);
                    }}
                    onDrag={(event, info) => {
                      if (editingGoalId === goal.id) return;
                      const dx = info.delta.x;
                      const dy = info.delta.y;

                      setGoalOffsets(prev => {
                        const currentOffset = prev[goal.id] || { x: 0, y: 0 };
                        return {
                          ...prev,
                          [goal.id]: {
                            x: currentOffset.x + dx,
                            y: currentOffset.y + dy
                          }
                        };
                      });
                    }}
                    onDragEnd={() => {
                      if (editingGoalId === goal.id) return;
                      setIsDraggingGoal(null);
                    }}
                    style={{
                      position: 'relative',
                      zIndex: getIndex(goal.id)
                    }}
                    onClick={() => {
                      setSelectedGoalId(isSelected ? null : goal.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingGoalId(goal.id);
                      setEditingGoalTitle(goal.title);
                    }}
                    className={`goal-node group w-32 h-32 rounded-full ${
                      'border-4'
                    } bg-gradient-to-br ${
                      getGoalColors(goalIndex, topic.goals.length).gradient
                    } border-${
                      getGoalColors(goalIndex, topic.goals.length).border
                    } flex items-center justify-center p-4 shadow-lg transition-colors duration-200 hover:scale-105 hover:border-indigo-400 shadow-[0_0_0_4px_rgba(99,102,241,0.2)] transition-all duration-200 ${editingGoalId === goal.id ? 'cursor-text' : 'cursor-move'}`}
                    whileHover={{ scale: editingGoalId === goal.id ? 1 : 1.1 }}
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                  >
                    <div className="text-center">
                      {editingGoalId === goal.id ? (
                        <input
                          type="text"
                          value={editingGoalTitle}
                          onChange={(e) => setEditingGoalTitle(e.target.value)}
                          onBlur={() => handleGoalTitleUpdate(goal.id, editingGoalTitle)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleGoalTitleUpdate(goal.id, editingGoalTitle);
                            } else if (e.key === 'Escape') {
                              setEditingGoalId(null);
                              setEditingGoalTitle('');
                            }
                          }}
                          className="w-full text-center bg-transparent border-b border-purple-300 focus:outline-none focus:border-purple-500 px-1"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <ListTodo className={`w-8 h-8 mx-auto mb-1 ${
                            getGoalColors(goalIndex, topic.goals.length).icon
                          }`} />
                          <h3 className={`text-sm font-bold ${
                            getGoalColors(goalIndex, topic.goals.length).text
                          }`}>{goal.title}</h3>
                        </>
                      )}
                    </div>

                    {/* 新增任務按鈕 */}
                    <div 
                      className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{
                        right: '-15px',
                        bottom: '0px',
                        transform: 'translate(50%, 50%)',
                        zIndex: getIndex(goal.id) + 1
                      }}
                    >
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddTask(goal.id);
                          }}
                          className="w-8 h-8 bg-indigo-100 hover:bg-indigo-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-indigo-500" />
                        </motion.button>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGoal(goal.id);
                          }}
                          className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </motion.div>
                      </div>
                    </div>

                    {/* 新增 AI 按鈕 */}
                    <div 
                      className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{
                        right: '-15px',
                        top: '-15px',
                        transform: 'translate(50%, 50%)',
                        zIndex: getIndex(goal.id) + 1
                      }}
                    >
                      <div className="flex space-x-2">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnalyzeGoal(goal.title);
                          }}
                          className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                <AnimatePresence>
                  {activeTasks.get(goal.id)?.map((task, taskIndex) => {
                    const taskPos = getTaskPosition(
                      goalIndex,
                      taskIndex,
                      goal.tasks.length
                    );

                    // 檢查是否為特殊任務類型
                    const isObservationGoal = goal.title.includes('觀察');
                    const isThoughtTask = isObservationGoal && task.title.includes('想法');

                    return (
                      <motion.div
                        key={`task-${goal.id}-${task.id}`}
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
                          drag={editingTaskId !== task.id}
                          dragMomentum={false}
                          whileDrag={{ scale: 1.05 }}
                          whileHover={{ scale: editingTaskId === task.id ? 1 : 1.1 }}
                          onDragStart={(e) => {
                            if (editingTaskId === task.id) return;
                            e.stopPropagation();
                            bringToFront(task.id);
                          }}
                          onDrag={(event, info) => {
                            if (editingTaskId === task.id) return;
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
                          onDragEnd={() => {
                            if (editingTaskId === task.id) return;
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
                          className={`task-card group w-64 h-24 p-4 rounded-2xl shadow-lg border-2 cursor-move flex flex-col justify-center gap-2 relative ${
                            task.status === 'idea'
                              ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 rounded-3xl hover:border-purple-400 hover:shadow-[0_0_0_4px_rgba(99,102,241,0.2)]'
                              : task.status === 'done'
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-400 hover:shadow-[0_0_0_4px_rgba(34,197,94,0.2)]'
                              : task.status === 'in_progress'
                              ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-orange-400 hover:shadow-[0_0_0_4px_rgba(249,115,22,0.2)]'
                              : 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 hover:border-pink-400 hover:shadow-[0_0_0_4px_rgba(236,72,153,0.2)]'
                          } `}
                        >
                          <div className="absolute top-2 right-2 flex space-x-2">
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

                          {/* 新增任務按鈕 */}
                          <div 
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{
                              right: '-20px',
                              bottom: '-5px',
                              transform: 'translate(50%, 50%)',
                              zIndex: getIndex(task.id) + 1
                            }}
                          >
                            <div className="flex space-x-2">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const parentGoal = topic.goals.find(g => g.tasks.some(t => t.id === task.id));
                                  if (parentGoal) {
                                    handleDeleteTask(parentGoal.id, task.id);
                                  }
                                }}
                                className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </motion.div>
                            </div>
                          </div>

                          {/* 新增 AI 按鈕 */}
                          <div 
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{
                              right: '-20px',
                              top: '-35px',
                              transform: 'translate(50%, 50%)',
                              zIndex: getIndex(task.id) + 1
                            }}
                          >
                            <div className="flex space-x-2">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnalyzeTask(task.title);
                                }}
                                className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                              >
                                <Sparkles className="w-4 h-4 text-white" />
                              </motion.div>
                            </div>
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

        <AnimatePresence>
          {bubbles.map(bubble => {
            const offset = bubbleOffsets[bubble.id] || { x: 0, y: 0 };
            return (
              <motion.div
                key={bubble.id}
                className="absolute"
                style={{
                  left: (bubble.position?.x ?? 0) - 64,
                  top: (bubble.position?.y ?? 0) - 64,
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
                    // 更新 bubble 位置
                    const currentOffset = bubbleOffsets[bubble.id] || { x: 0, y: 0 };
                    handleUpdateBubble(bubble.id, {
                      position: {
                        x: (bubble.position?.x ?? 0) + currentOffset.x,
                        y: (bubble.position?.y ?? 0) + currentOffset.y
                      }
                    });
                    // 重置 offset
                    setBubbleOffsets(prev => ({
                      ...prev,
                      [bubble.id]: { x: 0, y: 0 }
                    }));
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
                  className="bubble-node w-32 h-32 rounded-full bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg cursor-move flex items-center justify-center group"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingBubbleId(bubble.id);
                    setEditingBubbleTitle(bubble.title);
                  }}
                >
                  {editingBubbleId === bubble.id ? (
                    <input
                      type="text"
                      value={editingBubbleTitle}
                      onChange={(e) => setEditingBubbleTitle(e.target.value)}
                      onBlur={() => handleBubbleTitleUpdate(bubble.id, editingBubbleTitle)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleBubbleTitleUpdate(bubble.id, editingBubbleTitle);
                        } else if (e.key === 'Escape') {
                          setEditingBubbleId(null);
                          setEditingBubbleTitle('');
                        }
                      }}
                      className="w-full text-center bg-transparent border-b border-purple-300 focus:outline-none focus:border-purple-500 px-1 font-[Iansui] text-2xl text-purple-700"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="text-center font-[Iansui] text-2xl text-purple-700">
                      {bubble.title}
                    </div>
                  )}
                  {/* 刪除按鈕 */}
                  <div 
                    className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      right: '-10px',
                      bottom: ' 10px',
                      transform: 'translate(50%, 50%)',
                      zIndex: getIndex(bubble.id) + 1
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBubble(bubble.id);
                      }}
                      className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </motion.div>
                  </div>

                  {/* 新增 AI 按鈕 */}
                  <div 
                    className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      right: '-15px',
                      top: '-15px',
                      transform: 'translate(50%, 50%)',
                      zIndex: getIndex(bubble.id) + 1
                    }}
                  >
                    <div className="flex space-x-2">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyzeBubble(bubble.title);
                        }}
                        className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                      </motion.div>
                    </div>
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
          goalId={topicId}
          onFocus={(elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
              flyToElement(elementId);
            }
          }}
          onExternalInput={handleSetAssistantInput}
        />
      </div>
    </div>
  );
};

// 向後兼容的 GoalMindMap 組件
export const GoalMindMap: React.FC<{ goalId: string; onBack?: () => void }> = ({ goalId, onBack }) => {
  return <TopicMindMap topicId={goalId} onBack={onBack} />;
};