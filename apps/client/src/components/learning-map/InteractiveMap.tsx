import React from 'react';
import { motion } from 'framer-motion';
import { Hotspot } from './Hotspot';
import mapImage from '../../assets/maps/sep-twtour/map-sep.png';

interface Task {
  id: string;
  label: string;
  subject: string;
  completed: boolean;
  position: { x: number; y: number };
  goalId: string;
}

interface InteractiveMapProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ tasks, onTaskClick }) => {
  return (
    <div className="w-full h-full relative">
      {/* 背景地圖 */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${mapImage})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      />

      {/* 互動點 */}
      {tasks.map((task) => (
        <Hotspot
          key={task.id}
          task={task}
          onClick={() => onTaskClick(task.id)}
        />
      ))}
    </div>
  );
}; 