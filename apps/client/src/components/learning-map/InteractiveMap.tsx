import React, { useRef, useState } from 'react';
import { MapIcon } from './MapIcon';
import { Goal } from '../../types/goal';
import mapImage from '../../assets/maps/sep-twtour/map-sep.png';
import heyaImg from '../../assets/maps/sep-twtour/buildings/heya.png';
import jinImg from '../../assets/maps/sep-twtour/character/jin.png';
import fireImg from '../../assets/maps/sep-twtour/buildings/fire.png';
import mailboxImg from '../../assets/maps/sep-twtour/buildings/mailbox.png';

interface InteractiveMapProps {
  goals: Goal[];
  onGoalClick: (goalId: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ goals, onGoalClick }) => {
  // 根據 subject 決定圖示
  const getIcon = (subject: string) => {
    if (subject.includes('地標') || subject.includes('房')) return heyaImg;
    if (subject.includes('火')) return fireImg;
    if (subject.includes('信箱')) return mailboxImg;
    return jinImg;
  };

  // 初始角色位置，可依需求調整
  const [characterPos, setCharacterPos] = useState({ left: 26, top: 34 });
  const mapRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // 圖示實際大小是 128px (w-32 h-32)
    const iconWidth = 128;
    const iconHeight = 128;
    const offsetX = (iconWidth / rect.width) * 50; // 轉換為百分比
    const offsetY = (iconHeight / rect.height) * 80; // 轉換為百分比
    
    // 因為 MapIcon 有 transform: translate(-50%, -50%)，所以不需要額外計算偏移
    setCharacterPos({ 
      left: Math.max(0, Math.min(100, x-offsetX)), 
      top: Math.max(0, Math.min(100, y-offsetY)) 
    });
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      ref={mapRef}
      onDoubleClick={handleDoubleClick}
    >
      <div className="absolute inset-0 w-full h-full">
        {/* 背景地圖 */}
        <img 
          src={mapImage}
          alt="地圖"
          className="w-full h-full object-contain"
        />

        {/* 固定位置的小人 - 第一個 goal */}
        {goals[0] && (
          <MapIcon
            goal={goals[0]}
            src={jinImg}
            left={characterPos.left}
            top={characterPos.top}
            onGoalClick={onGoalClick}
          />
        )}

        {/* 固定位置的房子 - 第二個 goal */}
        {goals[1] && (
          <MapIcon
            goal={goals[1]}
            src={heyaImg}
            left={1}
            top={18}
            onGoalClick={onGoalClick}
            flip={true}
          />
        )}

        {/* 固定位置的火 - 第三個 goal */}
        {goals[2] && (
          <MapIcon
            goal={goals[2]}
            src={fireImg}
            left={26}
            top={65}
            onGoalClick={onGoalClick}
          />
        )}

        {/* 固定位置的信箱 - 第四個 goal */}
        {goals[3] && (
          <MapIcon
            goal={goals[3]}
            src={mailboxImg}
            left={59}
            top={22}
            onGoalClick={onGoalClick}
          />
        )}
      </div>
    </div>
  );
}; 