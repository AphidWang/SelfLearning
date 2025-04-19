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
  title = "學習進度", 
  showLegend = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set chart dimensions
    const chartWidth = canvas.width;
    const chartHeight = canvas.height;
    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    // Draw progress arcs
    let startAngle = -Math.PI / 2;
    
    data.forEach(item => {
      const normalizedProgress = Math.min(Math.max(item.progress, 0), 100) / 100;
      const endAngle = startAngle + (2 * Math.PI * normalizedProgress);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineWidth = 30;
      ctx.strokeStyle = item.color;
      ctx.stroke();
      
      // Draw subject label at the center of the arc
      const midAngle = startAngle + (endAngle - startAngle) / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + Math.cos(midAngle) * labelRadius;
      const labelY = centerY + Math.sin(midAngle) * labelRadius;
      
      ctx.fillStyle = item.color;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Only show label if the segment is big enough
      if (normalizedProgress > 0.1) {
        ctx.fillText(`${item.subject} ${Math.round(item.progress)}%`, labelX, labelY);
      }
      
      startAngle = endAngle;
    });
    
    // Draw inner circle (white/empty)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Calculate overall progress
    const totalProgress = data.reduce((sum, item) => sum + item.progress, 0) / data.length;
    
    // Draw text in the center
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(totalProgress)}%`, centerX, centerY - 10);
    
    ctx.font = '14px sans-serif';
    ctx.fillText('總進度', centerX, centerY + 15);
    
  }, [data]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>
      
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={300}
          className="mx-auto"
        />
      </div>
      
      {showLegend && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{item.subject}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressChart;