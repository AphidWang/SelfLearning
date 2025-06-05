import React, { useRef, useState } from 'react';
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

  // 初始角色位置，可依需求調整
  const [characterPos, setCharacterPos] = useState({ left: 20, top: 58 });
  const mapRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCharacterPos({ left: x, top: y });
  };

  return (
    <div
      className="w-full h-full relative"
      ref={mapRef}
      onDoubleClick={handleDoubleClick}
    >
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
          left={characterPos.left}
          top={characterPos.top}
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