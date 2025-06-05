import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Xarrow, { Xwrapper } from 'react-xarrows';
import { DndContext, DragEndEvent, useDraggable, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import { Lock, Star, Trophy, Flag, Map, Compass, Award, Plus, Edit2, Tag } from 'lucide-react';
import CurriculumDialog from './CurriculumDialog';

type RewardType = {
  type: 'points' | 'badge' | 'experience';
  value: number;
  icon: string;
};

export interface LearningNode {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'unlocked' | 'locked';
  requirements: string[];
  position: { x: number; y: number };
  connections: string[];
  level: number;
  rewards: RewardType[];
}

interface NodeProps {
  node: LearningNode;
  onNodeComplete?: (nodeId: string) => void;
  onAddBranch?: (nodeId: string, position: { x: number; y: number }) => void;
  onEditNode?: (nodeId: string, updates: Partial<LearningNode>) => void;
  onNodesChange?: (nodes: LearningNode[]) => void;
  showRewardAnimation?: boolean;
  isStudent?: boolean;
  isEditable?: boolean;
  dragStartPosition?: { x: number; y: number } | null;
  nodes?: LearningNode[];
  allowDragOut?: boolean;
}

const Node: React.FC<NodeProps> = React.memo(({ 
  node, 
  onNodeComplete,
  onAddBranch,
  onEditNode,
  onNodesChange,
  nodes,
  showRewardAnimation,
  isStudent,
  isEditable,
  dragStartPosition,
  allowDragOut
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const nodeRef = useRef<HTMLElement | null>(null);
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: node.id,
    disabled: !isEditable || isStudent
  });

  const style = dragStartPosition ? {
    transform: `translate3d(${dragStartPosition.x}px, ${dragStartPosition.y}px, 0)`,
  } : undefined;

  const statusColors = {
    locked: 'bg-gray-200 dark:bg-gray-700',
    unlocked: 'bg-indigo-500 dark:bg-indigo-600',
    completed: 'bg-green-500 dark:bg-green-600'
  };

  const levelColors = [
    'from-blue-500 to-purple-500',
    'from-purple-500 to-pink-500',
    'from-pink-500 to-red-500',
    'from-red-500 to-orange-500',
    'from-orange-500 to-yellow-500'
  ];

  const handleAddBranch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddBranch) {
      const newPosition = {
        x: node.position.x + 300,
        y: node.position.y + 100
      };
      onAddBranch(node.id, newPosition);
    }
  };

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates: Partial<LearningNode> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      level: parseInt(formData.get('level') as string),
      rewards: [
        {
          type: (formData.get('rewardType') as string) as ('points' | 'badge' | 'experience'),
          value: parseInt(formData.get('rewardValue') as string),
          icon: 'star'
        }
      ]
    };
    onEditNode?.(node.id, updates);
    setIsEditing(false);
  };

  const handleOpenDialog = () => {
    if (!isEditing) {
      setShowDialog(true);
    }
  };

  useEffect(() => {
    if (!allowDragOut) return;

    const element = nodeRef.current;
    if (!element) return;

    const handleNativeDragStart = (e: DragEvent) => {
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', node.id);
        e.dataTransfer.effectAllowed = 'move';
      }
    };

    const handleNativeDragEnd = () => {
      if (dragStartPosition && nodes) {
        const updatedNodes = nodes.map(n =>
          n.id === node.id
            ? { ...n, position: dragStartPosition }
            : n
        );
        onNodesChange?.(updatedNodes);
      }
    };

    element.addEventListener('dragstart', handleNativeDragStart);
    element.addEventListener('dragend', handleNativeDragEnd);
    
    return () => {
      element.removeEventListener('dragstart', handleNativeDragStart);
      element.removeEventListener('dragend', handleNativeDragEnd);
    };
  }, [node.id, allowDragOut, dragStartPosition, nodes, onNodesChange]);

  if (isEditing && isEditable) {
    return (
      <div
        style={{
          position: 'absolute',
          left: node.position.x,
          top: node.position.y,
          width: '320px'
        }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 z-50"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              標題
            </label>
            <input
              name="title"
              defaultValue={node.title}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <textarea
              name="description"
              defaultValue={node.description}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              等級
            </label>
            <input
              name="level"
              type="number"
              defaultValue={node.level}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                獎勵類型
              </label>
              <select
                name="rewardType"
                defaultValue={node.rewards?.[0]?.type}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                <option value="points">點數</option>
                <option value="badge">徽章</option>
                <option value="experience">經驗值</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                獎勵值
              </label>
              <input
                name="rewardValue"
                type="number"
                defaultValue={node.rewards?.[0]?.value}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
    <motion.div
      id={node.id}
      ref={(el) => {
        nodeRef.current = el;
        setNodeRef(el);
      }}
      {...attributes}
      {...listeners}
      onClick={handleOpenDialog}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        touchAction: 'none',
        cursor: isEditable && !isStudent ? 'grab' : 'default',
        ...style
      }}
      draggable={allowDragOut}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      {/* Level Ring */}
      <div className={`
        absolute -inset-2 rounded-xl bg-gradient-to-r ${levelColors[node.level % levelColors.length]}
        opacity-75 blur-lg transition-opacity duration-300
        ${isHovered ? 'opacity-100' : 'opacity-50'}
      `} />

      {/* Node Content */}
      <div 
        className={`
          w-64 p-4 rounded-xl relative bg-white dark:bg-gray-800
          border-2 ${
            node.status === 'locked' 
              ? 'border-gray-300 dark:border-gray-700' 
              : node.status === 'completed'
                ? 'border-green-500 dark:border-green-600'
                : 'border-indigo-500 dark:border-indigo-600'
          }
          shadow-xl backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90
        `}
      >
        {/* Edit Button */}
        {isEditable && !isStudent && (
          <button
            onClick={(e) => handleEdit(e)}
            className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors z-10"
          >
            <Edit2 size={16} />
          </button>
        )}

        {/* Add Branch Button */}
        {isEditable && !isStudent && (
          <button
            onClick={handleAddBranch}
            className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors z-10"
          >
            <Plus size={16} />
          </button>
        )}

        {/* Status Badge */}
        <div className={`
          absolute -top-3 -right-3 w-8 h-8 rounded-full 
          flex items-center justify-center ${statusColors[node.status]}
          shadow-lg transition-colors duration-300
        `}>
          {node.status === 'locked' ? (
            <Lock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : node.status === 'completed' ? (
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Trophy className="w-4 h-4 text-white" />
            </motion.div>
          ) : (
            <Map className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Category Tag */}
        {node.rewards.find(r => r.type === 'badge') && (
          <div className="absolute -top-3 right-12 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium flex items-center">
            <Tag size={12} className="mr-1" />
            {node.rewards.find(r => r.type === 'badge')?.icon}
          </div>
        )}

        {/* Level Indicator */}
        <div className="absolute -top-3 -left-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          Level {node.level}
        </div>

        <div className="mb-3">
          <h3 className={`
            text-lg font-semibold
            ${node.status === 'locked' 
              ? 'text-gray-500 dark:text-gray-400' 
              : 'text-gray-900 dark:text-white'
            }
          `}>
            {node.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {node.description}
          </p>
        </div>

        {/* Requirements */}
        {node.requirements && node.requirements.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              需要完成：{node.requirements.join(', ')}
            </p>
          </div>
        )}

        {/* Rewards */}
        {node.rewards && (
          <div className="flex flex-wrap gap-2 mt-2">
            {node.rewards.map((reward, index) => (
              <motion.div
                key={index}
                className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${reward.type === 'badge' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : reward.type === 'experience'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                  }
                `}
                whileHover={{ scale: 1.1 }}
                animate={showRewardAnimation ? { 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                } : undefined}
              >
                {reward.type === 'badge' ? (
                  <Award className="w-3 h-3 mr-1" />
                ) : reward.type === 'experience' ? (
                  <Flag className="w-3 h-3 mr-1" />
                ) : (
                  <Star className="w-3 h-3 mr-1" />
                )}
                {reward.value} {reward.type === 'badge' ? '徽章' : reward.type === 'experience' ? 'EXP' : '點數'}
              </motion.div>
            ))}
          </div>
        )}

        {/* Action Button */}
        {isStudent && node.status === 'unlocked' && (
          <motion.button
            onClick={() => onNodeComplete?.(node.id)}
            className="mt-3 w-full px-3 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            開始任務
          </motion.button>
        )}
      </div>
    </motion.div>
    {showDialog && (
      <CurriculumDialog goalId={node.id} onClose={() => setShowDialog(false)} />
    )}
    </>
  );
}, (prev, next) => {
  return (
    prev.node.id === next.node.id &&
    prev.node.position.x === next.node.position.x &&
    prev.node.position.y === next.node.position.y &&
    prev.showRewardAnimation === next.showRewardAnimation &&
    prev.isEditable === next.isEditable &&
    prev.isStudent === next.isStudent &&
    prev.dragStartPosition === next.dragStartPosition
  );
});

interface LearningMapProps {
  nodes: LearningNode[];
  onNodesChange: (nodes: LearningNode[]) => void;
  isStudent?: boolean;
  isEditable?: boolean;
  allowDragOut?: boolean;
}

const LearningMap: React.FC<LearningMapProps> = ({ 
  nodes = [], 
  onNodesChange, 
  isStudent,
  isEditable = !isStudent,
  allowDragOut = false
}) => {
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);

  const handleNodeComplete = (nodeId: string) => {
    setShowRewardAnimation(true);
    setTimeout(() => setShowRewardAnimation(false), 1000);

    const newNodes = nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, status: 'completed' as const };
      }
      // Unlock connected nodes
      if (node.requirements?.includes(nodeId)) {
        return { ...node, status: 'unlocked' as const };
      }
      return node;
    });

    onNodesChange?.(newNodes);
  };

  const handleAddBranch = (parentId: string, position: { x: number; y: number }) => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: LearningNode = {
      id: newNodeId,
      title: '新任務',
      description: '點擊編輯任務內容',
      status: 'locked',
      position,
      connections: [],
      requirements: [],
      level: nodes.find(n => n.id === parentId)?.level ?? 1 + 1,
      rewards: [
        { type: 'points', value: 100, icon: 'star' }
      ]
    };

    // Update parent node's connections
    const updatedNodes = nodes.map(node => 
      node.id === parentId 
        ? { ...node, connections: [...node.connections, newNodeId] }
        : node
    );

    onNodesChange?.([...updatedNodes, newNode]);
  };

  const handleEditNode = (nodeId: string, updates: Partial<LearningNode>) => {
    const newNodes = nodes.map(node =>
      node.id === nodeId
        ? { ...node, ...updates }
        : node
    );
    onNodesChange?.(newNodes);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const nodeId = event.active.id as string;
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setDragStartPosition(node.position);
      setDraggingNodeId(nodeId);
    }
  };

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { active, delta } = event;
    if (!active || !draggingNodeId || !dragStartPosition) return;

    const nodeId = active.id as string;
    const updatedNodes = nodes.map(node => 
      node.id === nodeId 
        ? {
            ...node,
            position: {
              x: dragStartPosition.x + delta.x,
              y: dragStartPosition.y + delta.y
            }
          }
        : node
    );
    onNodesChange(updatedNodes);
  }, [nodes, draggingNodeId, dragStartPosition, onNodesChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    if (!active || !dragStartPosition) return;

    const nodeId = active.id as string;
    setDraggingNodeId(null);
    setDragStartPosition(null);

    // 更新節點位置
    const updatedNodes = nodes.map(node => 
      node.id === nodeId 
        ? {
            ...node,
            position: {
              x: dragStartPosition.x + delta.x,
              y: dragStartPosition.y + delta.y
            }
          }
        : node
    );
    onNodesChange(updatedNodes);
  };

  // 生成連線
  const arrows = useMemo(() => 
    nodes.flatMap(node => 
      node.connections.map(targetId => (
        <Xarrow
          key={`${node.id}-${targetId}`}
          start={node.id}
          end={targetId}
          path="smooth"
          startAnchor="right"
          endAnchor="left"
          showHead={true}
          strokeWidth={2}
          color={node.status === 'completed' ? '#22c55e' : '#6366f1'}
          dashness={node.status === 'locked' ? true : false}
          curveness={0.3}
        />
      ))
    ), [nodes]
  );

  return (
    <div className="relative w-full bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900/30 rounded-xl shadow-inner">
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 text-gray-600 dark:text-gray-300">
        <Compass className="w-5 h-5" />
        <span className="text-sm font-medium">學習地圖</span>
      </div>
      
      <div 
        className="min-h-[600px] relative p-8" 
        style={{ 
          minWidth: '1200px',
          touchAction: 'none',
          overflow: allowDragOut ? 'visible' : 'hidden'
        }}
      >
        <Xwrapper>
          {arrows}
          <DndContext 
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            {nodes.map(node => (
              <Node
                key={node.id}
                node={node}
                nodes={nodes}
                onNodeComplete={handleNodeComplete}
                onAddBranch={handleAddBranch}
                onEditNode={handleEditNode}
                showRewardAnimation={showRewardAnimation}
                isStudent={isStudent}
                isEditable={isEditable}
                dragStartPosition={dragStartPosition}
                allowDragOut={allowDragOut}
              />
            ))}
          </DndContext>
        </Xwrapper>
      </div>
    </div>
  );
};

export default LearningMap;