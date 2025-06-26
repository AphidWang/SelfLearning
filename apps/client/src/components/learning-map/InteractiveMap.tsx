import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapIcon } from './MapIcon';
import { Topic } from '../../types/goal';
import mapImage from '../../assets/maps/sep-twtour/map-sep.png';
import heyaImg from '../../assets/maps/sep-twtour/buildings/heya.png';
import jinImg from '../../assets/maps/sep-twtour/character/jin.png';
import fireImg from '../../assets/maps/sep-twtour/buildings/fire.png';
import mailboxImg from '../../assets/maps/sep-twtour/buildings/mailbox.png';
import { Sparkles } from 'lucide-react';
import { useTopicStore } from '../../store/topicStore';

interface InteractiveMapProps {
  topics: Topic[];
  onTopicClick: (topicId: string) => void;
  onCampfireClick: () => void;
  onMailboxClick: () => void;
  onHouseClick: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  topics,
  onTopicClick,
  onCampfireClick,
  onMailboxClick,
  onHouseClick,
}) => {
  const { getActiveTopics } = useTopicStore();
  const activeTopics = useMemo(() => getActiveTopics(), [topics]);

  // 根據 subject 決定圖示
  const getIcon = useCallback((subject: string) => {
    if (subject.includes('地標') || subject.includes('房')) return heyaImg;
    if (subject.includes('火')) return fireImg;
    if (subject.includes('信箱')) return mailboxImg;
    return jinImg;
  }, []);

  // 初始角色位置，可依需求調整
  const [characterPos, setCharacterPos] = useState({ left: 26, top: 34 });
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [showTopicOrbs, setShowTopicOrbs] = useState(false);
  const [hoveredMailbox, setHoveredMailbox] = useState(false);
  const [hoveredOrbArea, setHoveredOrbArea] = useState(false);

  // 更新地圖尺寸
  const updateMapSize = useCallback(() => {
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
  }, []);

  // 監聽容器大小變化
  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateMapSize);
    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [updateMapSize]);

  // 監聽地圖圖片載入完成
  const handleMapLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    updateMapSize();
  }, [updateMapSize]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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
  }, [isMoving, mapOffset.x, mapOffset.y, mapSize.width, mapSize.height]);

  // 記憶化 MapIcon 的位置樣式
  const characterStyle = useMemo(() => ({
    left: mapSize.width ? `${(characterPos.left / 100) * mapSize.width / scale}px` : '0',
    top: mapSize.height ? `${(characterPos.top / 100) * mapSize.height / scale}px` : '0',
    transform: 'translate(-50%, -50%)',
    width: '128px',
    height: '128px'
  }), [characterPos.left, characterPos.top, mapSize.width, mapSize.height, scale]);

  const houseStyle = useMemo(() => ({
    left: `${(8 / 100) * mapSize.width / scale}px`,
    top: `${(26 / 100) * mapSize.height / scale}px`,
    transform: 'translate(-50%, -50%)',
    width: '128px',
    height: '128px'
  }), [mapSize.width, mapSize.height, scale]);

  const campfireStyle = useMemo(() => ({
    left: `${(34 / 100) * mapSize.width / scale}px`,
    top: `${(74 / 100) * mapSize.height / scale}px`,
    transform: 'translate(-50%, -50%)',
    width: '128px',
    height: '128px',
    cursor: 'pointer'
  }), [mapSize.width, mapSize.height, scale]);

  const mailboxStyle = useMemo(() => ({
    left: `${(69 / 100) * mapSize.width / scale}px`,
    top: `${(31 / 100) * mapSize.height / scale}px`,
    transform: 'translate(-50%, -50%)',
    width: '128px',
    height: '128px',
    cursor: 'pointer'
  }), [mapSize.width, mapSize.height, scale]);

  const containerStyle = useMemo(() => ({
    left: mapOffset.x || 0,
    top: mapOffset.y || 0,
    width: mapSize.width || '100%',
    height: mapSize.height || '100%',
    transform: `scale(${scale || 1})`,
    transformOrigin: 'top left'
  }), [mapOffset.x, mapOffset.y, mapSize.width, mapSize.height, scale]);

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
              style={containerStyle}
            >
              {/* 固定位置的小人 - 永遠顯示 */}
              {mapSize.width > 0 && (
                <div 
                  className="absolute transition-all duration-[1500ms] linear"
                  style={characterStyle}
                >
                  <MapIcon
                    id="character"
                    title="我"
                    src={jinImg}
                    left={0}
                    top={0}
                    onTopicClick={() => {}}
                  />
                </div>
              )}

              {/* 固定位置的房子 - 永遠顯示 */}
              {mapSize.width > 0 && (
                <div className="absolute" style={houseStyle} onClick={() => {
                  if (activeTopics.length > 0) {
                    onHouseClick();
                  } else {
                    alert('目前還沒有學習主題喔！先去建立一些學習主題吧！');
                  }
                }}>
                  <MapIcon
                    id="house"
                    title="學習小屋"
                    src={heyaImg}
                    left={0}
                    top={0}
                    onTopicClick={() => {}}
                    flip={true}
                  />
                </div>
              )}

              {/* 固定位置的火 - 營火永遠可點，顯示複習功能 */}
              {mapSize.width > 0 && (
                <div className="absolute" style={campfireStyle} onClick={onCampfireClick}>
                  <MapIcon
                    id="campfire"
                    title="營火"
                    src={fireImg}
                    left={0}
                    top={0}
                    onTopicClick={onTopicClick}
                  />
                </div>
              )}

              {/* 固定位置的信箱 - 永遠顯示 */}
              {mapSize.width > 0 && (
                <div 
                  className="absolute"
                  style={mailboxStyle}
                  onClick={onMailboxClick}
                >
                  <MapIcon
                    id="mailbox"
                    title="信箱"
                    src={mailboxImg}
                    left={0}
                    top={0}
                    onTopicClick={onTopicClick}
                    showOrbs={activeTopics.length > 0}
                    orbTopics={activeTopics.slice(0, 3)}
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