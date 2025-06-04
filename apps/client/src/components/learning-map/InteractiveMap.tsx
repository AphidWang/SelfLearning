import React from 'react';
import { MapIcon } from './MapIcon';
import mapImage from '../../assets/maps/sep-twtour/map-sep.png';
import heyaImg from '../../assets/maps/sep-twtour/buildings/heya.png';
import jinImg from '../../assets/maps/sep-twtour/character/jin.png';

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
  // 根據 subject 決定圖示
  const getIcon = (subject: string) => {
    if (subject.includes('地標') || subject.includes('房')) return heyaImg;
    return jinImg;
  };

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

      {/* 固定位置的小人 */}
      {tasks[0] && (
        <MapIcon
          task={tasks[0]}
          src={jinImg}
          left={20}
          top={58}
          onTaskClick={onTaskClick}
        />
      )}

      {/* 固定位置的房子 */}
      {tasks[1] && (
        <MapIcon
          task={tasks[1]}
          src={heyaImg}
          left={58}
          top={38}
          onTaskClick={onTaskClick}
        />
      )}
    </div>
  );
}; 