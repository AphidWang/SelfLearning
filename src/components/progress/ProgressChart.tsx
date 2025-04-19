import React, { useEffect, useRef } from 'react';

interface ProgressData {
  subject: string;
  progress: number;
  color: string;
}

interface ProgressChartProps {
  data: ProgressData[];
  title?: string;
  showLegend?: boolean;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  data, 
  title = "學習進度"
}) => {
  // 計算總進度
  const totalProgress = Math.round(data.reduce((sum, item) => sum + item.progress, 0) / data.length);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="text-gray-700 dark:text-gray-300 mr-2 font-medium">總進度：</span>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{totalProgress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          ></div>
        </div>
      </div>
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.subject}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.progress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${item.progress}%`, backgroundColor: item.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressChart;