/**
 * ✅ 課綱藍圖系統 - React Flow + Framer Motion 節點實作注意事項
 *
 * 1. React Flow 負責整體節點邏輯（拖曳、連線、位置管理），請勿覆寫拖曳行為。
 * 2. 節點元件可使用 Framer Motion 增加動畫效果（初始顯示、hover 等），但 **不可加入 `drag` 屬性**。
 *    → drag 屬性為 Framer Motion 的拖曳功能，會與 React Flow 衝突。
 * 3. 所有節點應定義為 `nodeTypes`，並透過 `motion.div` 包裝外觀，保持純粹的視覺動畫。
 * 4. 所有節點位置將由 React Flow 控制，變動需實作 `onNodesChange`。
 * 5. 若需持久化節點位置，請將更新後的 `nodes` 傳至後端或 localStorage。
 * 6. 動畫建議使用：`initial`, `animate`, `whileHover` 等屬性，避免 layout 被 Framer Motion 強制控制。
 *
 * ✅ 此組合最適合用於需要：結構化流程圖 + 高互動視覺回饋 的使用情境。
 */

import React from "react";
import { motion } from "framer-motion";
import { Lock, Target, BookOpen, CheckSquare } from "lucide-react";
import { Handle, Position } from "reactflow";

const baseStyle = {
  padding: "1rem",
  borderRadius: "0.75rem",
  minWidth: "240px",
  background: "white",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  border: "1px solid rgba(0, 0, 0, 0.1)",
};

const getNodeIcon = (type: string) => {
  switch (type) {
    case "phase":
      return <Lock className="w-4 h-4" />;
    case "goal":
      return <Target className="w-4 h-4" />;
    case "syllabus":
      return <BookOpen className="w-4 h-4" />;
    case "task":
      return <CheckSquare className="w-4 h-4" />;
    default:
      return null;
  }
};

const getNodeColor = (type: string) => {
  switch (type) {
    case "phase":
      return "from-blue-500 to-blue-600";
    case "goal":
      return "from-green-500 to-green-600";
    case "syllabus":
      return "from-orange-500 to-orange-600";
    case "task":
      return "from-yellow-500 to-yellow-600";
    default:
      return "from-gray-500 to-gray-600";
  }
};

const NodeCard = ({ type, data }: { type: string; data: { label: string; description: string } }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    className={`relative ${baseStyle}`}
  >
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
    <div className={`absolute -inset-2 rounded-xl bg-gradient-to-r ${getNodeColor(type)} opacity-75 blur-lg`} />
    <div className="relative bg-white dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {getNodeIcon(type)}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{data.label}</h3>
      </div>
      {data.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300">{data.description}</p>
      )}
    </div>
  </motion.div>
);

export const nodeTypes = {
  phase: ({ data }) => <NodeCard type="phase" data={data} />,
  goal: ({ data }) => <NodeCard type="goal" data={data} />,
  syllabus: ({ data }) => <NodeCard type="syllabus" data={data} />,
  task: ({ data }) => <NodeCard type="task" data={data} />,
}; 