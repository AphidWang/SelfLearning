import React from 'react';

interface CircularProgressProps {
  value: number;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 40,
  color = '#3b82f6',
  strokeWidth = 4
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* 背景圓圈 */}
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          className="text-gray-200 dark:text-gray-700"
          stroke="currentColor"
          fill="none"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.5s ease-in-out'
          }}
        />
      </svg>
      {/* 百分比文字 */}
      <div 
        className="absolute inset-0 flex items-center justify-center font-bold"
        style={{ 
          fontSize: size / 4,
          color: color
        }}
      >
        {value}%
      </div>
    </div>
  );
}; 