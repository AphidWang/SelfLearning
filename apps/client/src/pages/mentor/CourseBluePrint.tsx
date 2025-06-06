/**
 * ✅ 課綱藍圖系統 - React Flow 流程圖管理
 *
 * 1. 此元件負責整體流程圖的管理邏輯，包含：
 *    - 節點狀態管理（nodes）
 *    - 連線狀態管理（edges）
 *    - 節點變更處理（onNodesChange）
 *    - 連線變更處理（onEdgesChange）
 *    - 新增連線處理（onConnect）
 *
 * 2. 節點的視覺效果和動畫請參考 nodeTypes.tsx
 * 3. 節點資料結構定義在 initial-elements.ts
 */

import React from "react";
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  Connection,
  EdgeTypes,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import PageLayout from "../../components/layout/PageLayout";
import { nodeTypes } from "./course-blueprint/nodeTypes";
import { initialNodes, initialEdges } from "./course-blueprint/initial-elements.ts";

type CustomNode = Node<{
  label: string;
  description: string;
}>;

const CourseBluePrint: React.FC = () => {
  const [nodes, setNodes] = React.useState<CustomNode[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);

  const onNodesChange = React.useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = React.useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = React.useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  return (
    <PageLayout title="課程藍圖設計">
      <div style={{ width: "100%", height: "calc(100vh - 100px)" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 }
          }}
          connectionMode={ConnectionMode.Loose}
          snapToGrid={true}
          snapGrid={[15, 15]}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </PageLayout>
  );
};

export default CourseBluePrint; 