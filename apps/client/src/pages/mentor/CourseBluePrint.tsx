/**
 * TODO: 課程藍圖頁面 - 需要重新設計
 * 
 * 計劃改動：
 * 1. 整合 topicTemplate 視覺化編輯功能
 * 2. 支援拖拽式課程設計介面
 * 3. 與新的 Supabase 資料架構整合
 * 4. 改進節點和連線的互動設計
 * 
 * 目前狀態：未完整，等待重新設計
 */

import React, { useCallback, useMemo } from 'react';
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
            style: { stroke: '#0f172a', strokeWidth: 2 }
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