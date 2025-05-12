import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  NodeTypes,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  Panel,
  Handle,
  Position,
} from 'reactflow';
import { motion } from 'framer-motion';
import { Brain, Plus, ArrowLeft } from 'lucide-react';
import { useGoalStore } from '../../store/goalStore';
import { Goal, Step, Task } from '../../types/goal';
import 'reactflow/dist/style.css';

interface NodeData {
  label: string;
  description?: string;
}

// 定义节点类型
const nodeTypes: NodeTypes = {
  goal: ({ data }: { data: NodeData }) => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="p-4 rounded-lg bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-800 shadow-lg"
    >
      <Handle type="source" position={Position.Bottom} />
      <h3 className="text-lg font-bold text-purple-800 dark:text-purple-300">{data.label}</h3>
      <p className="text-sm text-purple-600 dark:text-purple-400">{data.description}</p>
    </motion.div>
  ),
  step: ({ data }: { data: NodeData }) => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 shadow-md"
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <h4 className="font-semibold text-blue-800 dark:text-blue-300">{data.label}</h4>
      <p className="text-sm text-blue-600 dark:text-blue-400">{data.description}</p>
    </motion.div>
  ),
  task: ({ data }: { data: NodeData }) => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 shadow-sm"
    >
      <Handle type="target" position={Position.Top} />
      <p className="text-sm font-medium text-green-800 dark:text-green-300">{data.label}</p>
      <p className="text-xs text-green-600 dark:text-green-400">{data.description}</p>
    </motion.div>
  ),
};

// 计算节点位置
const calculateNodePositions = (
  nodes: Node[],
  centerX: number,
  centerY: number,
  radius: number
) => {
  const angleStep = (2 * Math.PI) / nodes.length;
  return nodes.map((node, index) => {
    const angle = index * angleStep;
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });
};

interface GoalMindMapProps {
  goalId: string;
  onBack?: () => void;
}

export const GoalMindMap: React.FC<GoalMindMapProps> = ({ goalId, onBack }) => {
  const { goals } = useGoalStore();
  const goal = goals.find((g) => g.id === goalId);

  // 创建节点和边
  const initialNodes = useMemo(() => {
    if (!goal) return [];

    const nodes: Node[] = [
      {
        id: goal.id,
        type: 'goal',
        data: {
          label: goal.title,
          description: goal.description,
        },
        position: { x: 0, y: 0 },
      },
    ];

    // 添加步骤节点
    goal.steps.forEach((step, index) => {
      nodes.push({
        id: step.id,
        type: 'step',
        data: {
          label: step.title,
          description: step.description,
        },
        position: { x: 0, y: 0 },
      });

      // 添加任务节点
      step.tasks.forEach((task) => {
        nodes.push({
          id: task.id,
          type: 'task',
          data: {
            label: task.title,
            description: task.description,
          },
          position: { x: 0, y: 0 },
        });
      });
    });

    // 计算节点位置
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    return calculateNodePositions(nodes, centerX, centerY, radius);
  }, [goal]);

  const initialEdges = useMemo(() => {
    if (!goal) return [];

    const edges: Edge[] = [];

    // 目标到步骤的边
    goal.steps.forEach((step) => {
      edges.push({
        id: `${goal.id}-${step.id}`,
        source: goal.id,
        target: step.id,
        type: 'smoothstep',
        animated: true,
      });

      // 步骤到任务的边
      step.tasks.forEach((task) => {
        edges.push({
          id: `${step.id}-${task.id}`,
          source: step.id,
          target: task.id,
          type: 'smoothstep',
          animated: true,
        });
      });
    });

    return edges;
  }, [goal]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)),
    [setEdges]
  );

  if (!goal) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">找不到目标</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-left">
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => {
                // TODO: 实现添加新节点的功能
              }}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}; 