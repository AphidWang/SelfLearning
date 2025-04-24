import React from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurriculum } from '../../context/CurriculumContext';
import { Trash2 } from 'lucide-react';

const WeeklyTaskColumns: React.FC = () => {
  const { weeks, assignNodeToWeek, removeNodeFromWeek } = usePlanner();
  const { nodes } = useCurriculum();

  if (!weeks || !nodes) {
    return <div>Loading...</div>;
  }

  // 檢查節點是否已經在任何週中
  const isNodeAssigned = (nodeId: string) => {
    return weeks.some(week => week.nodeIds.includes(nodeId));
  };

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {weeks.map((week) => (
        <div
          key={week.id}
          className="week-task-column bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex flex-col"
          onDragOver={(e) => {
            e.preventDefault();
            const nodeId = e.dataTransfer.getData('text/plain');
            // 如果節點已經被分配，不顯示拖放效果
            if (!isNodeAssigned(nodeId)) {
              e.currentTarget.classList.add('bg-gray-100', 'dark:bg-gray-700');
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              e.currentTarget.classList.remove('bg-gray-100', 'dark:bg-gray-700');
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-gray-100', 'dark:bg-gray-700');
            const nodeId = e.dataTransfer.getData('text/plain');
            // 只有當節點未被分配時才添加
            if (!isNodeAssigned(nodeId)) {
              assignNodeToWeek(nodeId, week.id);
            }
          }}
        >
          <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
            第 {week.id} 週
          </h3>
          <div className="space-y-2">
            {week.nodeIds?.map((nodeId) => {
              const node = nodes.find((n) => n.id === nodeId);
              if (!node) return null;

              return (
                <div
                  key={nodeId}
                  className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {node.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {node.description}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNodeFromWeek(nodeId, week.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {week.nodeIds.length === 0 && (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg w-full p-4 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  將課程拖曳至此
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeeklyTaskColumns; 