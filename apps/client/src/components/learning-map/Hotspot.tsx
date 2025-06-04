import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface Task {
  id: string;
  label: string;
  subject: string;
  completed: boolean;
  position: { x: number; y: number };
  goalId: string;
}

interface HotspotProps {
  task: Task;
  onClick: () => void;
}

export const Hotspot: React.FC<HotspotProps> = ({ task, onClick }) => {
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `${task.position.x}%`,
        top: `${task.position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      whileHover={{ scale: 1.2 }}
      onClick={onClick}
    >
      <div className="relative">
        <MapPin 
          size={24} 
          className={task.completed ? 'text-green-500' : 'text-blue-500'} 
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-white rounded shadow text-sm whitespace-nowrap"
        >
          {task.label}
        </motion.div>
      </div>
    </motion.div>
  );
}; 