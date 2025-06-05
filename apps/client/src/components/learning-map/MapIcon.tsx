import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Goal } from '../../types/goal';

interface MapIconProps {
  goal: Goal;
  src: string;
  left: number;
  top: number;
  onGoalClick: (goalId: string) => void;
  flip?: boolean;
}

export const MapIcon: React.FC<MapIconProps> = ({ goal, src, left, top, onGoalClick, flip }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="absolute cursor-pointer z-10"
      style={{
        transform: 'translate(-50%, -50%)',
        transformOrigin: 'center center'
      }}
      animate={{
        left: `${left}%`,
        top: `${top}%`,
        scale: isHovered ? 1.15 : 1
      }}
      transition={{
        left: { duration: 1, ease: 'linear' },
        top: { duration: 1, ease: 'linear' },
        scale: { duration: 0.2 }
      }}
      onClick={() => onGoalClick(goal.id)}
      initial={false}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <img 
        src={src} 
        alt={goal.title} 
        className="w-32 h-32 drop-shadow-lg"
        style={{
          transform: flip ? 'scaleX(-1)' : 'none',
          transformOrigin: 'center'
        }}
      />
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs rounded-full shadow-lg whitespace-nowrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ 
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 8
        }}
        transition={{ duration: 0.2 }}
      >
        {goal.title}
      </motion.div>
    </motion.div>
  );
}; 