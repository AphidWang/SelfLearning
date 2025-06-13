import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapIcon } from './MapIcon';
import { Goal } from '../../types/goal';
import mapImage from '../../assets/maps/sep-twtour/map-sep.png';
import heyaImg from '../../assets/maps/sep-twtour/buildings/heya.png';
import jinImg from '../../assets/maps/sep-twtour/character/jin.png';
import fireImg from '../../assets/maps/sep-twtour/buildings/fire.png';
import mailboxImg from '../../assets/maps/sep-twtour/buildings/mailbox.png';
import { Sparkles } from 'lucide-react';

interface InteractiveMapProps {
  goals: Goal[];
  onGoalClick: (goalId: string) => void;
  onCampfireClick: () => void;
  onMailboxClick: () => void;
  onHouseClick: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  goals,
  onGoalClick,
  onCampfireClick,
  onMailboxClick,
  onHouseClick,
}) => {
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
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [showGoalOrbs, setShowGoalOrbs] = useState(false);
  const [hoveredMailbox, setHoveredMailbox] = useState(false);
  const [hoveredOrbArea, setHoveredOrbArea] = useState(false);


  // 更新地圖尺寸
  const updateMapSize = () => {
    if (!mapRef.current) return;
    const container = mapRef.current;
    const img = container.querySelector('img');
    if (!img) return;

    // 計算圖片在容器中的實際顯示尺寸
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = containerWidth / containerHeight;

    let displayWidth, displayHeight;
    if (imgRatio > containerRatio) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imgRatio;
    } else {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imgRatio;
    }

    // 計算地圖在容器中的偏移量
    const offsetX = (containerWidth - displayWidth) / 2;
    const offsetY = (containerHeight - displayHeight) / 2;

    setMapSize({
      width: displayWidth,
      height: displayHeight
    });

    setMapOffset({
      x: offsetX,
      y: offsetY
    });

    // 計算縮放比例，增加 1.5 倍
    setScale((displayWidth / img.naturalWidth) * 1.5);
  };

  // 監聽容器大小變化
  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateMapSize);
    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // 監聽地圖圖片載入完成
  const handleMapLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    updateMapSize();
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current || isMoving) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - mapOffset.x) / mapSize.width) * 100;
    const y = ((e.clientY - rect.top - mapOffset.y) / mapSize.height) * 100;
    
    setIsMoving(true);
    setCharacterPos({ 
      left: Math.max(0, Math.min(100, x)), 
      top: Math.max(0, Math.min(100, y)) 
    });
    setTimeout(() => setIsMoving(false), 2000); // 動畫結束後重置狀態
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-blue-100 to-green-100 dark:from-blue-950 dark:to-green-950">

      <div
        className="w-full h-full relative overflow-hidden select-none"
        ref={mapRef}
        onDoubleClick={handleDoubleClick}
      >
        <div className="absolute inset-0 w-full h-full">
          {/* 背景地圖 */}
          <div className="relative w-full h-full">
            <img 
              src={mapImage}
              alt="地圖"
              className="w-full h-full object-contain select-none"
              onLoad={handleMapLoad}
            />

            {/* Icon 容器 */}
            <div 
              className="absolute"
              style={{
                left: mapOffset.x,
                top: mapOffset.y,
                width: mapSize.width,
                height: mapSize.height,
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
              }}
            >
              {/* 固定位置的小人 - 第一個 goal */}
              {goals[0] && mapSize.width > 0 && (
                <div 
                  className="absolute transition-all duration-[1500ms] linear"
                  style={{
                    left: `${(characterPos.left / 100) * mapSize.width / scale}px`,
                    top: `${(characterPos.top / 100) * mapSize.height / scale}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '128px',
                    height: '128px'
                  }}
                >
                  <MapIcon
                    goal={goals[0]}
                    src={jinImg}
                    left={0}
                    top={0}
                    onGoalClick={onGoalClick}
                  />
                </div>
              )}

              {/* 固定位置的房子 - 第二個 goal */}
              {goals[1] && mapSize.width > 0 && (
                <div className="absolute" style={{
                  left: `${(8 / 100) * mapSize.width / scale}px`,
                  top: `${(26 / 100) * mapSize.height / scale}px`,
                  transform: 'translate(-50%, -50%)',
                  width: '128px',
                  height: '128px'
                }}
                onClick={onHouseClick}
                >
                  <MapIcon
                    goal={goals[1]}
                    src={heyaImg}
                    left={0}
                    top={0}
                    onGoalClick={onHouseClick}
                    flip={true}
                  />
                </div>
              )}

              {/* 固定位置的火 - 第三個 goal */}
              {goals[2] && mapSize.width > 0 && (
                <div className="absolute" style={{
                  left: `${(34 / 100) * mapSize.width / scale}px`,
                  top: `${(74 / 100) * mapSize.height / scale}px`,
                  transform: 'translate(-50%, -50%)',
                  width: '128px',
                  height: '128px',
                  cursor: 'pointer'
                }}
                onClick={onCampfireClick}
                >
                  <MapIcon
                    goal={goals[2]}
                    src={fireImg}
                    left={0}
                    top={0}
                    onGoalClick={onGoalClick}
                  />
                </div>
              )}

              {/* 固定位置的信箱 - 第四個 goal */}
              {goals[3] && mapSize.width > 0 && (
                <div 
                  className="absolute"
                  style={{
                    left: `${(69 / 100) * mapSize.width / scale}px`,
                    top: `${(31 / 100) * mapSize.height / scale}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '128px',
                    height: '128px',
                    cursor: 'pointer'
                  }}
                  onClick={onMailboxClick}
                >
                  <MapIcon
                    goal={goals[3]}
                    src={mailboxImg}
                    left={0}
                    top={0}
                    onGoalClick={onGoalClick}
                    showOrbs={true}
                    orbGoals={[goals[0], goals[1], goals[2]]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 